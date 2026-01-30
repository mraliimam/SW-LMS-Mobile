import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {addAttendance, getAttendance} from '../api/Signup';
import {AppState} from 'react-native';
import { showMessage } from 'react-native-flash-message';

const ATTENDANCE_QUEUE_KEY = 'ATTENDANCE_QUEUE';
const OFFLINE_ATTENDANCE_PREFIX = 'OFFLINE_ATTENDANCE_';
const SYNC_STATUS_KEY = 'ATTENDANCE_SYNC_STATUS';
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_SYNC_DELAY = 5000; // 5 seconds
const MAX_SYNC_DELAY = 300000; // 5 minutes

class AttendanceManager {
  constructor() {
    this.syncInterval = null;
    this.syncTimeout = null;
    this.retryCount = 0;
    this.isSyncing = false;
    this.appState = AppState.currentState;
    this.setupAppStateListener();
  }

  // Setup app state listener to optimize sync behavior
  setupAppStateListener() {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  handleAppStateChange = nextAppState => {
    if (
      this.appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App came to foreground
      this.startSync();
    } else if (nextAppState.match(/inactive|background/)) {
      // App going to background
      this.stopSync();
    }
    this.appState = nextAppState;
  };

  // Start sync process with exponential backoff
  startSync() {
    if (this.syncInterval || this.isSyncing) return;

    const sync = async () => {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        this.scheduleNextSync();
        return;
      }

      this.isSyncing = true;
      try {
        await this.processOfflineQueue();
        this.retryCount = 0; // Reset retry count on success
      } catch (error) {
        console.error('Sync error:', error);
        this.retryCount++;
      } finally {
        this.isSyncing = false;
        this.scheduleNextSync();
      }
    };

    // Initial sync
    this.syncTimeout = setTimeout(sync, INITIAL_SYNC_DELAY);
  }

  // Schedule next sync with exponential backoff
  scheduleNextSync() {
    if (this.retryCount >= MAX_RETRY_ATTEMPTS) {
      console.log('Max retry attempts reached, stopping sync');
      return;
    }

    const delay = Math.min(
      INITIAL_SYNC_DELAY * Math.pow(2, this.retryCount),
      MAX_SYNC_DELAY,
    );

    this.syncTimeout = setTimeout(() => {
      this.startSync();
    }, delay);
  }

  // Stop all sync operations
  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
  }

  // Process all pending offline attendance records
  async processOfflineQueue() {
    const queue = await this.getOfflineQueue();
    if (queue.length === 0) {
      // console.log("No offline attendance records to process.");
      return;
    }

    console.log(
      `🕒 Processing ${queue.length} offline attendance record(s)...`,
    );

    const successfulSyncs = [];
    const netInfo = await NetInfo.fetch();

    if (!netInfo.isConnected) {
      console.log('🚫 No internet connection. Cannot sync.');
      return;
    }

    for (const [index, attendanceData] of queue.entries()) {
      try {
        if (!this.validateAttendanceData(attendanceData)) {
          console.log(`⚠️ Record ${index + 1}: Invalid data, skipped.`);
          continue;
        }

        const dateFor = attendanceData.attendance?.[0]?.date_added;
        const serverData = await getAttendance({
          username: attendanceData.username,
          dateFor: dateFor,
        });

        if (this.hasConflict(attendanceData, serverData)) {
          console.log(`⚔️ Record ${index + 1}: Conflict with server, skipped.`);
          successfulSyncs.push(index); // Optional: remove if you don't want to count it as synced
          continue;
        }

        const response = await addAttendance(attendanceData);
        console.log(response, '----------------');

        if (response?.Message) {
          console.log(
            `✅ Record ${index + 1}: Synced successfully for ${attendanceData}`,
          );
          successfulSyncs.push(index);
          await this.removeOfflineAttendance(
            attendanceData.class_id,
            attendanceData.date_added,
          );
        } else {
          console.log(
            `❌ Record ${index + 1}: Sync failed, no success message.`,
          );
        }
      } catch (error) {
        console.log(`🔥 Record ${index + 1}: Error syncing - ${error.message}`);
      }
    }

    if (successfulSyncs.length > 0) {
      const newQueue = queue.filter(
        (_, index) => !successfulSyncs.includes(index),
      );
      await AsyncStorage.setItem(
        ATTENDANCE_QUEUE_KEY,
        JSON.stringify(newQueue),
      );
      await this.setSyncStatus(newQueue.length === 0);
    }

    console.log(
      `🎉 Sync complete. ${successfulSyncs.length}/${queue.length} record(s) processed successfully.`,
    );
    showMessage({
      message: `✅ Sync complete: ${successfulSyncs.length}/${queue.length} records processed successfully.`,
      type: 'success',
      icon: 'success',
      duration: 3000,
    });

    return successfulSyncs.length;
  }

  // Add attendance to offline queue
  async saveOfflineAttendance(attendanceData) {
    if (!this.validateAttendanceData(attendanceData)) {
      throw new Error('Invalid attendance data');
    }

    const queue = await this.getOfflineQueue();

    // Prevent duplicates
    const exists = queue.some(
      item =>
        item.class_id === attendanceData.class_id &&
        item.date_added === attendanceData.date_added,
    );

    if (!exists) {
      queue.push(attendanceData);
      await AsyncStorage.setItem(ATTENDANCE_QUEUE_KEY, JSON.stringify(queue));

      // Store individual attendance record
      const recordKey = this.getOfflineRecordKey(
        attendanceData.class_id,
        attendanceData.date_added,
      );

      await AsyncStorage.setItem(
        recordKey,
        JSON.stringify({
          ...attendanceData,
          timestamp: Date.now(),
        }),
      );

      await this.setSyncStatus(false);
      this.startSync(); // Trigger sync attempt
    }

    return queue.length;
  }

  // Submit attendance (online or offline)
  async submitAttendance(attendanceData) {
    const netInfo = await NetInfo.fetch();

    if (!netInfo.isConnected) {
      const queueSize = await this.saveOfflineAttendance(attendanceData);
      return {
        success: true,
        message: `Attendance saved offline (${queueSize} pending sync)`,
        offline: true,
      };
    }
    console.log(attendanceData, '-=------------');

    try {
      const response = await addAttendance(attendanceData);
      return {
        success: true,
        message: response.Message,
        offline: false,
      };
    } catch (error) {
      // Fallback to offline storage if online submission fails
      const queueSize = await this.saveOfflineAttendance(attendanceData);
      return {
        success: false,
        message: `Network error. Attendance saved offline (${queueSize} pending sync)`,
        offline: true,
      };
    }
  }

  // Get all pending offline attendances
  async getOfflineAttendanceRecords() {
    const queue = await this.getOfflineQueue();

    const records = [];

    for (const item of queue) {
      const recordKey = this.getOfflineRecordKey(
        item.class_id,
        item.date_added,
      );
      const record = await AsyncStorage.getItem(recordKey);
      if (record) {
        records.push(JSON.parse(record));
      }
    }

    return records;
  }

  // Clear all offline attendance data
  async clearAllOfflineData() {
    const queue = await this.getOfflineQueue();

    // Delete all individual records
    for (const item of queue) {
      const recordKey = this.getOfflineRecordKey(
        item.class_id,
        item.date_added,
      );
      await AsyncStorage.removeItem(recordKey);
    }

    // Clear the queue
    await AsyncStorage.removeItem(ATTENDANCE_QUEUE_KEY);
    await this.setSyncStatus(true);
  }

  // Helper methods
  async getOfflineQueue() {
    const queue = await AsyncStorage.getItem(ATTENDANCE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  }

  getOfflineRecordKey(classId, date) {
    return `${OFFLINE_ATTENDANCE_PREFIX}${classId}_${date}`;
  }

  async removeOfflineAttendance(classId, date) {
    const recordKey = this.getOfflineRecordKey(classId, date);
    await AsyncStorage.removeItem(recordKey);
  }

  async setSyncStatus(isSynced) {
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(isSynced));
  }

  async getSyncStatus() {
    const status = await AsyncStorage.getItem(SYNC_STATUS_KEY);
    return status ? JSON.parse(status) : true;
  }

  validateAttendanceData(data) {
    return (
      data &&
      data.username &&
      data.class_id &&
      data.attendance &&
      Array.isArray(data.attendance) &&
      data.attendance.length > 0 &&
      data.attendance.every(
        item => item.student_id && item.status && item.date_added,
      )
    );
  }

  hasConflict(offlineData, serverData) {
    if (!serverData || !serverData.Classes) return false;

    const serverClassData = serverData.Classes.find(
      c => c.class_id === offlineData.class_id,
    );

    if (!serverClassData || !serverClassData.attendance) return false;

    // Simple conflict check - if server has any attendance for this date/class
    return serverClassData.attendance.length > 0;
  }

  // Cleanup resources
  cleanup() {
    this.stopSync();
    AppState.removeEventListener('change', this.handleAppStateChange);
  }
}

// Export as singleton
export default new AttendanceManager();
