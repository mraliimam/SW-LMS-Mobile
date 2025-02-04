import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { addAttendance } from '../api/Signup';
import BackgroundService from 'react-native-background-actions';

const ATTENDANCE_QUEUE_KEY = 'ATTENDANCE_QUEUE';
const OFFLINE_ATTENDANCE_KEY = 'OFFLINE_ATTENDANCE_';

const sleep = (time) => new Promise((resolve) => setTimeout(() => resolve(), time));

// Background task options
const options = {
  taskName: 'AttendanceSync',
  taskTitle: 'Attendance Sync',
  taskDesc: 'Syncing offline attendance data',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  linkingURI: 'yourSchemeHere://chat/jane',
  parameters: {
    delay: 5000,
  },
};

// The background task
const syncTask = async (taskDataArguments) => {
  const { delay } = taskDataArguments;

  await new Promise(async (resolve) => {
    const backgroundProcess = async () => {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        await processOfflineQueue();
      }
      await sleep(delay);
    };

    // Running background task
    while (BackgroundService.isRunning()) {
      await backgroundProcess();
    }
  });
};

// Process offline queue
const processOfflineQueue = async () => {
  try {
    const queue = await AsyncStorage.getItem(ATTENDANCE_QUEUE_KEY);
    if (!queue) return;

    const queueArray = JSON.parse(queue);
    if (queueArray.length === 0) return;

    const successfulSync = [];

    for (const [index, attendanceData] of queueArray.entries()) {
      try {
        const response = await addAttendance(attendanceData);
        if (response.Message) {
          // Remove the processed offline attendance data
          const offlineKey = `${OFFLINE_ATTENDANCE_KEY}${attendanceData.class_id}_${attendanceData.date_added}`;
          await AsyncStorage.removeItem(offlineKey);
          successfulSync.push(index);
        }
      } catch (error) {
        console.error('Error processing attendance item:', error);
        // Continue with next item
      }
    }

    // Remove successfully synced items from queue
    if (successfulSync.length > 0) {
      const updatedQueue = queueArray.filter((_, index) => !successfulSync.includes(index));
      if (updatedQueue.length === 0) {
        await AsyncStorage.removeItem(ATTENDANCE_QUEUE_KEY);
      } else {
        await AsyncStorage.setItem(ATTENDANCE_QUEUE_KEY, JSON.stringify(updatedQueue));
      }
    }
  } catch (error) {
    console.error('Error processing offline queue:', error);
  }
};

// Start background service
export const startAttendanceSync = async () => {
  try {
    if (!BackgroundService.isRunning()) {
      await BackgroundService.start(syncTask, options);
    }
  } catch (error) {
    console.error('Error starting background service:', error);
  }
};

// Stop background service
export const stopAttendanceSync = async () => {
  try {
    await BackgroundService.stop();
  } catch (error) {
    console.error('Error stopping background service:', error);
  }
};

export const addToOfflineQueue = async (attendanceData) => {
  try {
    const queue = await AsyncStorage.getItem(ATTENDANCE_QUEUE_KEY);
    const queueArray = queue ? JSON.parse(queue) : [];
    queueArray.push(attendanceData);
    await AsyncStorage.setItem(ATTENDANCE_QUEUE_KEY, JSON.stringify(queueArray));
    
    // Save the attendance data separately for immediate display
    const offlineKey = `${OFFLINE_ATTENDANCE_KEY}${attendanceData.class_id}_${attendanceData.date_added}`;
    await AsyncStorage.setItem(offlineKey, JSON.stringify(attendanceData));
    
    // Start background sync service
    await startAttendanceSync();
  } catch (error) {
    console.error('Error saving offline attendance:', error);
    throw error;
  }
}; 