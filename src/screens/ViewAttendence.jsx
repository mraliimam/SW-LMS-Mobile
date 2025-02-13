import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Modal, Image } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { getAttendance } from "../api/Signup"
import PencilLoader from "../components/UI/PencilLoader"
import CalendarPicker from "react-native-calendar-picker"
import { format } from "date-fns"
import { useNavigation } from "@react-navigation/native"
import CustomDropdown from "../components/CustomDropdown"
import NetInfo from "@react-native-community/netinfo"

const { width } = Dimensions.get("window")
const ATTENDANCE_VIEW_CACHE_KEY = "ATTENDANCE_VIEW_"
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

export default function ViewAttendance() {
  const [selectedDate, setSelectedDate] = useState(null)
  const [attendanceData, setAttendanceData] = useState([])
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showCalendar, setShowCalendar] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    fetchUsername()
  }, [])

  const fetchUsername = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem("username")
      setUsername(storedUsername)
      if (storedUsername) {
        const today = new Date()
        setSelectedDate(today)
        fetchAttendance(storedUsername, format(today, "yyyy-MM-dd"))
      }
    } catch (error) {
      console.error("Error fetching username:", error)
    }
  }

  const fetchAttendance = useCallback(
    async (user, date) => {
      setIsLoading(true)
      try {
        const netInfo = await NetInfo.fetch()
        let attendanceResult
        const cacheKey = `${ATTENDANCE_VIEW_CACHE_KEY}${user}_${date}`

        if (netInfo.isConnected) {
          // If online, fetch from API
          const response = await getAttendance({ username: user, dateFor: date })
          if (response && response.Classes) {
            attendanceResult = response.Classes
            // Cache the attendance data
            await AsyncStorage.setItem(
              cacheKey,
              JSON.stringify({
                data: attendanceResult,
                timestamp: Date.now(),
              }),
            )
          }
        } else {
          // If offline, try to get cached data
          const cachedData = await AsyncStorage.getItem(cacheKey)
          if (cachedData) {
            const { data, timestamp } = JSON.parse(cachedData)
            if (Date.now() - timestamp < CACHE_EXPIRY) {
              attendanceResult = data
            }
          }
        }

        if (attendanceResult) {
          setAttendanceData(attendanceResult)
          if (attendanceResult.length > 0 && !selectedClass) {
            setSelectedClass(attendanceResult[0].class_name.toString())
          }
        } else {
          setAttendanceData([])
          if (!netInfo.isConnected) {
            // Show offline message or handle empty state
            console.log("No cached data available while offline")
          }
        }
      } catch (error) {
        console.error("Error fetching attendance:", error)
        // Try to get cached data as fallback
        try {
          const cacheKey = `${ATTENDANCE_VIEW_CACHE_KEY}${user}_${date}`
          const cachedData = await AsyncStorage.getItem(cacheKey)
          if (cachedData) {
            const { data } = JSON.parse(cachedData)
            setAttendanceData(data)
            if (data.length > 0 && !selectedClass) {
              setSelectedClass(data[0].class_name.toString())
            }
          }
        } catch (cacheError) {
          console.error("Error reading cached attendance data:", cacheError)
          setAttendanceData([])
        }
      } finally {
        setIsLoading(false)
      }
    },
    [selectedClass],
  )

  // Add network status effect
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && username && selectedDate) {
        // When connection is restored, refresh the data
        fetchAttendance(username, format(selectedDate, "yyyy-MM-dd"))
      }
    })

    return () => unsubscribe()
  }, [username, selectedDate, fetchAttendance])

  const handleDateChange = (date) => {
    setSelectedDate(date)
    fetchAttendance(username, format(date, "yyyy-MM-dd"))
    setShowCalendar(false)
  }

  const renderAttendanceItem = ({ item, index }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.indexCell]}>{index + 1}</Text>
      <Text style={[styles.cell, styles.nameCell]}>
        {item.student_name}
      </Text>
      <Text style={[styles.cell, styles.idCell]}>{item.student_id}</Text>
      <View style={[styles.statusCell, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
  )

  const getStatusColor = (status) => {
    switch (status) {
      case "P":
        return "#4CAF50"
      case "A":
        return "#F44336"
      case "H":
        return "#FFC107"
      case "L":
        return "#FF9800"
      case "E":
        return "#2196F3"
      default:
        return "#9E9E9E"
    }
  }

  const selectedClassData = attendanceData.find((classData) => classData.class_name.toString() === selectedClass)
  const sortedAttendance = selectedClassData?.attendance?.sort((a, b) => a.sr_no - b.sr_no) || []

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={[styles.header, { marginTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require("../assets/arrow.png")} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
          <Image source={require("../assets/calendar.png")} style={[styles.icon, styles.marginRight]} />
          <Text style={styles.dateButtonText}>
            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select Date"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pickerContainer}>
        <CustomDropdown
          data={attendanceData.map((classData) => ({
            label: classData.class_name,
            value: classData.class_name.toString(),
            teacher: classData.teacher_name,
          }))}
          selectedValue={selectedClass}
          onValueChange={(itemValue) => setSelectedClass(itemValue)}
          placeholder="Select a class"
        />
      </View>

      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.calendarContainer}>
            <CalendarPicker
              onDateChange={handleDateChange}
              selectedDayColor="#5B4DBC"
              selectedDayTextColor="#FFFFFF"
              todayBackgroundColor="#E6E6FA"
              todayTextStyle={{ color: "#5B4DBC" }}
              textStyle={{ color: "#333" }}
              previousTitle="Previous"
              nextTitle="Next"
              previousTitleStyle={{ color: "#5B4DBC" }}
              nextTitleStyle={{ color: "#5B4DBC" }}
              scaleFactor={375}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowCalendar(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <PencilLoader size={100} color="#5B4DBC" />
        </View>
      ) : (
        <View style={styles.attendanceContainer}>
          {selectedClassData ? (
            <>
              <FlatList
                data={sortedAttendance}
                renderItem={renderAttendanceItem}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={() => (
                  <View style={styles.headerRow}>
                    <Text style={[styles.headerCell, styles.indexCell]}>No.</Text>
                    <Text style={[styles.headerCell, styles.nameCell]}>Name</Text>
                    <Text style={[styles.headerCell, styles.idCell]}>ID</Text>
                    <Text style={[styles.headerCell, styles.statusHeaderCell]}>Status</Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.noDataText}>
                    {!selectedClassData.attendance.length
                      ? "No attendance data for this class."
                      : "You are currently offline. No cached data available."}
                  </Text>
                }
                contentContainerStyle={styles.flatListContent}
              />
            </>
          ) : (
            <Text style={styles.noDataText}>No class selected or no data available.</Text>
          )}
        </View>
      )}
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white", paddingHorizontal: 8 },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: "#5B4DBC",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: { tintColor: "white", width: 24, height: 24 },
  marginRight: { marginRight: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateButton: {
    backgroundColor: "#5B4DBC",
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 100,
    alignItems: "center",
  },
  dateButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  pickerContainer: { marginHorizontal: 16, marginVertical: 16 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  calendarContainer: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 10, width: "100%", maxHeight: "80%" },
  closeButton: { backgroundColor: "#5B4DBC", padding: 10, borderRadius: 5, alignItems: "center", marginTop: 10 },
  closeButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  attendanceContainer: { flex: 1, marginHorizontal: 16, backgroundColor: "#FFFFFF", borderRadius: 10 },
  className: { fontSize: 18, fontWeight: "bold", backgroundColor: "#5B4DBC", color: "white", padding: 10 },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingVertical: 12,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopStartRadius: 10,
    borderTopEndRadius: 10,
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  headerCell: {
    flex: 1,
    color: "#333",
    fontWeight: "bold",
    fontSize: 14,
  },
  indexCell: {
    flex: 0.5,
    textAlign: "center",
  },
  nameCell: {
    flex: 2,
    paddingLeft: 4,
  },
  idCell: {
    flex: 1,
    textAlign: "center",
  },
  statusCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    paddingVertical: 4,
    marginHorizontal: 4,
  },
  statusHeaderCell: {
    flex: 1,
    textAlign: "center",
  },
  statusText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  flatListContent: {
    flexGrow: 1,
  },
  noDataText: { textAlign: "center", marginTop: 20, fontSize: 16, color: "#666" },
})

