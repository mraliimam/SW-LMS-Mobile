"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  Platform,
  TouchableOpacity,
  Image,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Button } from "react-native-paper"
import { getStudents, getAttendance } from "../api/Signup"
import { Popup } from "../components/UI/Popup"
import PencilLoader from "../components/UI/PencilLoader"
import StudentRow from "./StudentRow"
import CustomDropdown from "../components/CustomDropdown"
import NetInfo from "@react-native-community/netinfo"
import AttendanceManager from "../services/AttendanceManager"

const OFFLINE_ATTENDANCE_KEY = "OFFLINE_ATTENDANCE_"

const Attendance = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedClass, setSelectedClass] = useState("")
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [username, setUsername] = useState("")
  const navigation = useNavigation()
  const [popupVisible, setPopupVisible] = useState(false)
  const [popupMessage, setPopupMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [attendanceTaken, setAttendanceTaken] = useState(false)
  const statuses = ["P", "A", "X", "L/E"]
  const filteredStudents = useMemo(
    () => students.filter((student) => student.current_class === selectedClass),
    [selectedClass, students],
  )
  const [teachersData, setTeachersData] = useState([])
  const [isOffline, setIsOffline] = useState(false)

  const showPopup = useCallback((message) => {
    setPopupMessage(message)
    setPopupVisible(true)
  }, [])

  useEffect(() => {
    const Getusername = async () => {
      const storedUsername = await AsyncStorage.getItem("username")
      setUsername(storedUsername)
      fetchStudents()
    }
    Getusername()
  }, [fetchStudents])

  const handleAttendanceChange = useCallback((studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status === "L/E" ? "E" : status,
    }))
  }, [])

  const fetchStudents = useCallback(async () => {
    setIsLoading(true)
    try {
      const storedUsername = await AsyncStorage.getItem("username")
      setUsername(storedUsername)

      // Try to get cached data first
      const cachedStudents = await AsyncStorage.getItem("CACHED_STUDENTS")
      const cachedTeachers = await AsyncStorage.getItem("CACHED_TEACHERS")
      let studentsData = []

      if (cachedStudents && cachedTeachers) {
        const { data: studentData, timestamp: studentTimestamp } = JSON.parse(cachedStudents)
        const { data: teacherData, timestamp: teacherTimestamp } = JSON.parse(cachedTeachers)

        if (Date.now() - studentTimestamp < 24 * 60 * 60 * 1000) {
          // 24 hours cache
          studentsData = studentData
          setStudents(studentData)
          setTeachersData(teacherData)
          const uniqueClasses = [...new Set(studentData.map((student) => student.current_class))]
          setClasses(uniqueClasses)
          const initialClass = uniqueClasses[0]
          setSelectedClass(initialClass)

          // Fetch attendance for initial class
          await fetchAttendanceForClass(initialClass, storedUsername)
        }
      }

      const netInfo = await NetInfo.fetch()
      if (netInfo.isConnected) {
        // Fetch fresh students data
        const studentsResponse = await getStudents(storedUsername)
        if (studentsResponse && studentsResponse.Records) {
          studentsData = studentsResponse.Records
          // Cache the students data
          await AsyncStorage.setItem(
            "CACHED_STUDENTS",
            JSON.stringify({
              data: studentsResponse.Records,
              timestamp: Date.now(),
            }),
          )

          setStudents(studentsResponse.Records)
          const uniqueClasses = [...new Set(studentsResponse.Records.map((student) => student.current_class))]
          setClasses(uniqueClasses)

          // Only set initial class if not already set
          if (!selectedClass) {
            const initialClass = uniqueClasses[0]
            setSelectedClass(initialClass)
            await fetchAttendanceForClass(initialClass, storedUsername)
          }
        }

        // Fetch and cache teachers data
        const attendanceResponse = await getAttendance({
          username: storedUsername,
          dateFor: new Date().toISOString().split("T")[0],
        })

        if (attendanceResponse && attendanceResponse.Classes) {
          setTeachersData(attendanceResponse.Classes)
          // Cache the teachers data
          await AsyncStorage.setItem(
            "CACHED_TEACHERS",
            JSON.stringify({
              data: attendanceResponse.Classes,
              timestamp: Date.now(),
            }),
          )
        }
      } else {
        // If offline, use cached teachers data
        const cachedTeachers = await AsyncStorage.getItem("CACHED_TEACHERS")
        if (cachedTeachers) {
          const { data } = JSON.parse(cachedTeachers)
          setTeachersData(data)
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to fetch data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedClass) {
      fetchAttendanceForClass(selectedClass, username)
    }
  }, [selectedClass, fetchAttendanceForClass, username])

  const fetchAttendanceForClass = async (classname, username) => {
    const currentDate = new Date().toISOString().split("T")[0]
    let attendanceData = {}
    let hasAttendance = false

    // Try online first if connected
    const netInfo = await NetInfo.fetch()
    if (netInfo.isConnected) {
      try {
        const response = await getAttendance({
          username: username,
          dateFor: currentDate,
        })

        if (response && response.Classes) {
          const classData = response.Classes.find((c) => c.class_name === classname)
          if (classData && classData.attendance && classData.attendance.length > 0) {
            attendanceData = classData.attendance.reduce((acc, item) => {
              acc[item.student_id] = item.status
              return acc
            }, {})
            hasAttendance = true

            // Cache online attendance data for offline use
            const offlineKey = `${OFFLINE_ATTENDANCE_KEY}${classname}_${currentDate}`
            await AsyncStorage.setItem(
              offlineKey,
              JSON.stringify({
                attendance: classData.attendance,
                timestamp: Date.now(),
                isOnlineData: true,
              }),
            )
          }
        }
      } catch (error) {
        console.error("Error fetching online attendance:", error)
      }
    }

    // Check offline storage if no online data found
    if (!hasAttendance) {
      const offlineKey = `${OFFLINE_ATTENDANCE_KEY}${classname}_${currentDate}`
      const offlineData = await AsyncStorage.getItem(offlineKey)

      if (offlineData) {
        const parsedData = JSON.parse(offlineData)
        // Only use offline data if it was created offline or if we're offline
        if (!parsedData.isOnlineData || !netInfo.isConnected) {
          attendanceData = parsedData.attendance.reduce((acc, item) => {
            acc[item.student_id] = item.status
            return acc
          }, {})
          hasAttendance = true
        }
      }
    }

    setAttendance(attendanceData)
    setAttendanceTaken(hasAttendance)
  }

  const allAttendanceMarked = useCallback(() => {
    return filteredStudents.every((student) => attendance[student.student_id])
  }, [filteredStudents, attendance])

  // const handleSubmit = useCallback(async () => {
  //   if (!allAttendanceMarked()) {
  //     showPopup("Please mark attendance for all students before submitting.")
  //     return
  //   }

  //   try {
  //     const currentDate = new Date().toISOString().split("T")[0]
  //     const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
  //       student_id: Number.parseInt(studentId),
  //       status,
  //       date_added: currentDate,
  //     }))

  //     const selectedClassId = students.find((student) => student.current_class === selectedClass)?.current_class_id
  //     const body = {
  //       username: username,
  //       class_id: selectedClassId,
  //       attendance: attendanceData,
  //     }

  //     const response = await AttendanceManager.submitAttendance(body)
  //     if (response.Message) {
  //       showPopup(response.Message)
  //       setAttendanceTaken(true)
  //     }
  //   } catch (error) {
  //     console.error("Error submitting attendance:", error)
  //     setError("Failed to submit attendance. Please try again.")
  //   }
  // }, [attendance, username, selectedClass, students, showPopup, allAttendanceMarked])

  const handleSubmit = useCallback(async () => {
    if (!allAttendanceMarked()) {
      showPopup("Please mark attendance for all students before submitting.");
      return;
    }
  
    setLoading(true); // Show loading indicator
  
    try {
      const currentDate = new Date().toISOString().split("T")[0];
      const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: Number.parseInt(studentId),
        status,
        date_added: currentDate,
      }));
  
      const selectedClassId = students.find(
        (student) => student.current_class === selectedClass
      )?.current_class_id;
  
      const body = {
        username: username,
        class_id: selectedClassId,
        attendance: attendanceData,
      };
  
      const result = await AttendanceManager.submitAttendance(body);
      
      if (result.offline) {
        showPopup(result.message);
                setAttendanceTaken(true); 
                const offlineKey = `${OFFLINE_ATTENDANCE_KEY}${selectedClass}_${currentDate}`;
        await AsyncStorage.setItem(
          offlineKey,
          JSON.stringify({
            body,
            timestamp: Date.now(),
            isOnlineData: false,
          })
        );
      } else {
        // Online submission successful
        showPopup(result.message || "Attendance submitted successfully");
        setAttendanceTaken(true);
        
        // Clear any offline copy if it exists
        const offlineKey = `${OFFLINE_ATTENDANCE_KEY}${selectedClass}_${currentDate}`;
        await AsyncStorage.removeItem(offlineKey);
      }
    } catch (error) {
      console.error("Error submitting attendance:", error);
      
      // Different messages for different error types
      const errorMessage = error.message.includes("network")
        ? "Network error. Attendance saved locally and will sync when online."
        : "Failed to submit attendance. Please try again.";
      
      showPopup(errorMessage);
      
      // Fallback to offline save if not already done
      if (!error.handledOffline) {
        try {
          await AttendanceManager.saveOfflineAttendance(body);
          showPopup("Attendance saved locally and will sync when online.");
          setAttendanceTaken(true);
        } catch (offlineError) {
          showPopup("Failed to save attendance both online and offline!");
        }
      }
    } finally {
      setLoading(false);
    }
  }, [attendance, username, selectedClass, students, showPopup, allAttendanceMarked]);

  // const handleSubmit = useCallback(async () => {
  //   if (!allAttendanceMarked()) {
  //     showPopup("Please mark attendance for all students before submitting.");
  //     return;
  //   }
  
  //   const currentDate = new Date().toISOString().split("T")[0];
  //   const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
  //     student_id: Number.parseInt(studentId),
  //     status,
  //     date_added: currentDate,
  //   }));
  
  //   const selectedClassId = students.find(
  //     (student) => student.current_class === selectedClass
  //   )?.current_class_id;
  
  //   const body = {
  //     username: username,
  //     class_id: selectedClassId,
  //     attendance: attendanceData,
  //   };
  
  //   const netInfo = await NetInfo.fetch();    
    
  //   if (netInfo.isConnected) {
  //     // Online submission
  //     try {
  //       console.log('POHOOOOo');
        
  //       const response = await AttendanceManager.submitAttendance(body);
  //       if (response.Message) {
  //         showPopup(response.Message);
  //         setAttendanceTaken(true);
          
  //         // Remove offline copy if it exists
  //         const offlineKey = `${OFFLINE_ATTENDANCE_KEY}${selectedClass}_${currentDate}`;
  //         await AsyncStorage.removeItem(offlineKey);
  //       }
  //     } catch (error) {
  //       console.error("Error submitting attendance:", error);
  //       setError("Failed to submit attendance. Please try again.");
  //     }
  //   } else {
  //     const offlineKey = `${OFFLINE_ATTENDANCE_KEY}${selectedClass}_${currentDate}`;
  //     await AsyncStorage.setItem(
  //       offlineKey,
  //       JSON.stringify({
  //         body,
  //         timestamp: Date.now(),
  //         isOnlineData: false,
  //       })
  //     );
      
  //     showPopup("Attendance saved locally. It will be synced when you're back online.");
  //     setAttendanceTaken(true);
  //   }
  // }, [attendance, username, selectedClass, students, showPopup, allAttendanceMarked]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <StudentRow
        index={index + 1}
        item={item}
        attendance={attendance}
        statuses={statuses}
        onAttendanceChange={handleAttendanceChange}
        attendanceTaken={attendanceTaken}
      />
    ),
    [attendance, handleAttendanceChange, attendanceTaken],
  )

  const keyExtractor = useCallback((item) => item.student_id.toString(), [])

  const handleClassChange = useCallback(
    async (newClass) => {
      setSelectedClass(newClass)
      setAttendance({})
      setAttendanceTaken(false)
      const currentDate = new Date().toISOString().split("T")[0]

      // Check for offline attendance for the new class
      const offlineKey = `${OFFLINE_ATTENDANCE_KEY}${newClass}_${currentDate}`
      const offlineData = await AsyncStorage.getItem(offlineKey)

      if (offlineData) {
        const parsedData = JSON.parse(offlineData)
        const attendanceData = parsedData.attendance.reduce((acc, item) => {
          acc[item.student_id] = item.status
          return acc
        }, {})
        setAttendance(attendanceData)
        setAttendanceTaken(true)
        return
      }

      // Only fetch online attendance if we don't have offline data
      const netInfo = await NetInfo.fetch()
      if (netInfo.isConnected) {
        const body = {
          username,
          dateFor: currentDate,
        }

        try {
          const response = await getAttendance(body)
          if (response && response.Classes) {
            const selectedClassData = response.Classes.find((classData) => classData.class_name === newClass)

            if (selectedClassData && selectedClassData.attendance.length > 0) {
              const attendanceData = selectedClassData.attendance.reduce((acc, item) => {
                acc[item.student_id] = item.status
                return acc
              }, {})
              setAttendance(attendanceData)
              setAttendanceTaken(true)
            } else {
              setAttendanceTaken(false)
              setAttendance({})
            }
          }
        } catch (error) {
          console.error("Error fetching attendance:", error)
          setError("Failed to fetch attendance. Please try again.")
        }
      }
    },
    [username],
  )

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected)
      if (state.isConnected) {
        AttendanceManager.startSync()
      } else {
        AttendanceManager.stopSync()
      }
    })
    AttendanceManager.startSync()

    return () => {
      unsubscribe()
      AttendanceManager.stopSync()
    }
  }, [])
  const sortedAttendance = filteredStudents?.sort((a, b) => a.sr_no - b.sr_no) || []

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchStudents} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    )
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#5B4DBC" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {isOffline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineText}>You are offline. Attendance will be saved locally.</Text>
            </View>
          )}
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <PencilLoader size={100} color="#5B4DBC" />
            </View>
          ) : (
            <>
              <View style={styles.selectContainer}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 }}
                >
                  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Image
                      source={require("../assets/arrow.png")}
                      style={{ width: 24, height: 24, tintColor: "white" }}
                    />
                  </TouchableOpacity>
                  <Text style={styles.label}>Attendance</Text>
                </View>
                <View style={styles.pickerContainer}>
                  <CustomDropdown
                    data={classes.map((className) => {
                      const classData = teachersData.find((c) => c.class_name === className)
                       return {
                        label: className,
                        value: className,
                        teacher: classData ? classData.teacher_name : "",
                      }
                    })}
                    selectedValue={selectedClass}
                    onValueChange={handleClassChange}
                    placeholder="Select a class"
                  />
                </View>
              </View>

              <View style={styles.tableContainer}>
                <View style={styles.headerRow}>
                  <Text style={[styles.headerCell, styles.idCell]}>Sr</Text>
                  <Text style={[styles.headerCell, styles.nameCell]}>Name</Text>
                  <Text style={[styles.headerCell, styles.nameCell]}>ID</Text>
                  {statuses.map((status) => (
                    <Text key={status} style={styles.headerCell}>
                      {status}
                    </Text>
                  ))}
                </View>
                <FlatList
                  data={sortedAttendance}
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  updateCellsBatchingPeriod={50}
                  windowSize={21}
                  removeClippedSubviews={true}
                  getItemLayout={(data, index) => ({
                    length: 50,
                    offset: 50 * index,
                    index,
                  })}
                />
              </View>
              <TouchableOpacity
                onPress={handleSubmit}
                style={[styles.submitButton, !allAttendanceMarked() && styles.disabledSubmitButton]}
                disabled={!allAttendanceMarked() || attendanceTaken}
              >
                <Text style={{ color: "white" }}>{"Submit Attendance"}</Text>
              </TouchableOpacity>
            </>
          )}
          <Popup visible={popupVisible} onClose={() => setPopupVisible(false)} title="Message">
            <Text>{popupMessage}</Text>
          </Popup>
        </View>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: Platform.select({
      ios: 16,
      android: 16,
    }),
  },
  selectContainer: {
    marginBottom: 24,
  },
  label: {
    marginRight: 15,
    fontSize: 24,
    fontWeight: "500",
    color: "black",
    textAlign: "center",
    marginBottom: 8,
    flex: 1,
  },
  pickerContainer: {
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: "#5B4DBC",
    justifyContent: "center",
    alignItems: "center",
  },
  tableContainer: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#5B4DBC",
    backgroundColor: "#fff",
    marginBottom: 24,
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#5B4DBC",
    paddingVertical: 12,
  },
  headerCell: {
    flex: 1,
    textAlign: "center",
    fontWeight: "bold",
    color: "#333",
  },
  nameCell: {
    flex: 2,
    paddingLeft: 16,
    textAlign: "left",
  },
  idCell: {
    flex: 1,
    paddingLeft: 16,
    textAlign: "left",
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "#5B4DBC",
    marginTop: 16,
  },
  disabledSubmitButton: {
    backgroundColor: "#A9A9A9",
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#5B4DBC",
  },
  offlineBanner: {
    backgroundColor: "#FFF3CD",
    padding: 8,
    marginBottom: 16,
    borderRadius: 8,
  },
  offlineText: {
    color: "#856404",
    textAlign: "center",
    fontSize: 12,
  },
})

export default Attendance

