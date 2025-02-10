import AsyncStorage from "@react-native-async-storage/async-storage"
import NetInfo from "@react-native-community/netinfo"
import { addAttendance, getAttendance } from "../api/Signup"
import { AppState } from "react-native"

const ATTENDANCE_QUEUE_KEY = "ATTENDANCE_QUEUE"
const OFFLINE_ATTENDANCE_KEY = "OFFLINE_ATTENDANCE_"
const SYNC_STATUS_KEY = "ATTENDANCE_SYNC_STATUS"

class AttendanceManager {
  constructor() {
    this.syncInterval = null
    this.appState = AppState.currentState
    this.setupAppStateListener()
  }

  setupAppStateListener() {
    AppState.addEventListener("change", this.handleAppStateChange)
  }

  handleAppStateChange = (nextAppState) => {
    if (this.appState.match(/inactive|background/) && nextAppState === "active") {
      this.startSync()
    } else if (nextAppState.match(/inactive|background/)) {
      this.stopSync()
    }
    this.appState = nextAppState
  }

  startSync() {
    if (!this.syncInterval) {
      this.syncInterval = setInterval(() => this.processOfflineQueue(), 60000) // Sync every minute
      this.processOfflineQueue() // Initial sync
    }
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  async processOfflineQueue() {
    const netInfo = await NetInfo.fetch()
    if (!netInfo.isConnected) return

    try {
      const queue = await AsyncStorage.getItem(ATTENDANCE_QUEUE_KEY)
      if (!queue) return

      const queueArray = JSON.parse(queue)
      if (!queueArray.length) return

      const successfulSync = []

      for (const [index, attendanceData] of queueArray.entries()) {
        try {
          const response = await addAttendance(attendanceData)
          if (response.Message) {
            const offlineKey = `${OFFLINE_ATTENDANCE_KEY}${attendanceData.class_id}_${attendanceData.date_added}`
            await AsyncStorage.removeItem(offlineKey)
            successfulSync.push(index)
          }
        } catch (error) {
          console.error("Error processing attendance item:", error)
        }
      }

      if (successfulSync.length) {
        const updatedQueue = queueArray.filter((_, index) => !successfulSync.includes(index))
        if (!updatedQueue.length) {
          await AsyncStorage.removeItem(ATTENDANCE_QUEUE_KEY)
        } else {
          await AsyncStorage.setItem(ATTENDANCE_QUEUE_KEY, JSON.stringify(updatedQueue))
        }
        await this.setSyncStatus(true)
      }
    } catch (error) {
      console.error("Error processing offline queue:", error)
    }
  }

  async addToOfflineQueue(attendanceData) {
    try {
      const queue = await AsyncStorage.getItem(ATTENDANCE_QUEUE_KEY)
      const queueArray = queue ? JSON.parse(queue) : []
      queueArray.push(attendanceData)
      await AsyncStorage.setItem(ATTENDANCE_QUEUE_KEY, JSON.stringify(queueArray))

      const offlineKey = `${OFFLINE_ATTENDANCE_KEY}${attendanceData.class_id}_${attendanceData.date_added}`
      await AsyncStorage.setItem(offlineKey, JSON.stringify(attendanceData))
      await this.setSyncStatus(false)
    } catch (error) {
      console.error("Error saving offline attendance:", error)
      throw error
    }
  }

  async submitAttendance(attendanceData) {
    const netInfo = await NetInfo.fetch()
    if (!netInfo.isConnected) {
      await this.addToOfflineQueue(attendanceData)
      return { Message: "Attendance saved offline. Will sync when online." }
    } else {
      return await addAttendance(attendanceData)
    }
  }

  async setSyncStatus(status) {
    await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status))
  }

  async getSyncStatus() {
    const status = await AsyncStorage.getItem(SYNC_STATUS_KEY)
    return status ? JSON.parse(status) : true
  }

  async fetchLatestAttendance(username, date) {
    const response = await getAttendance({ username, dateFor: date })
    if (response && response.Classes) {
      const cacheKey = `${OFFLINE_ATTENDANCE_KEY}${username}_${date}`
      await AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: response.Classes,
          timestamp: Date.now(),
        }),
      )
      return response.Classes
    }
    return null
  }
}

export default new AttendanceManager()

