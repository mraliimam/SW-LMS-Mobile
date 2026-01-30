import {useMemo, useState, useEffect, useCallback, useRef} from 'react';
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
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Button} from 'react-native-paper';
import {getStudents, getAttendance} from '../api/Signup';
import {Popup} from '../components/UI/Popup';
import PencilLoader from '../components/UI/PencilLoader';
import StudentRow from './StudentRow';
import CustomDropdown from '../components/CustomDropdown';
import NetInfo from '@react-native-community/netinfo';
import AttendanceManager from '../services/AttendanceManager';
import AttendenceRow from './AttendenceRow';
import CalendarPicker from 'react-native-calendar-picker';
import {format} from 'date-fns';
import {hp, wp} from '../components/UI/responsive';

const OFFLINE_ATTENDANCE_KEY = 'OFFLINE_ATTENDANCE_';

const ViewAttendance = ({navigation}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  console.log(attendance, '-=-=-=-=-=--');

  const [username, setUsername] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [attendanceTaken, setAttendanceTaken] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const statuses = ['P', 'A', 'X', 'L/E'];
  const [teachersData, setTeachersData] = useState([]);
  const [isOffline, setIsOffline] = useState(false);
  const [updateedAttendence, setUpdateedAttendence] = useState(false);
  const isFirstLoad = useRef(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (isFirstLoad.current && selectedClass && username) {
      fetchStudents();
      fetchAttendanceForClass(selectedClass, username);
      isFirstLoad.current = false;
    }
  }, [selectedClass, username]);

  useEffect(() => {
    fetchAttendanceForClass(selectedClass, username);
  }, [selectedClass, username]);

  const showPopup = useCallback(message => {
    setPopupMessage(message);
    setPopupVisible(true);
  }, []);

  // Memoized values for performance
  const filteredStudents = useMemo(
    () => students.filter(student => student.current_class === selectedClass),
    [selectedClass, students],
  );
  // console.log(filteredStudents, '================');

  const sortedAttendance = useMemo(
    () => filteredStudents?.sort((a, b) => a.student_id - b.student_id) || [],
    [filteredStudents],
  );
  // console.log(sortedAttendance,'sortedattendence');

  const allAttendanceMarked = useMemo(
    () => filteredStudents.every(student => attendance[student.student_id]),
    [filteredStudents, attendance],
  );

  const classDropdownData = useMemo(
    () =>
      classes.map(className => {
        const classData = teachersData.find(c => c.class_name === className);
        return {
          label: className,
          value: className,
          teacher: classData ? classData.teacher_name : '',
        };
      }),
    [classes, teachersData],
  );

  // Navigation prevention for unsaved changes
  useEffect(() => {
    const beforeRemove = navigation.addListener('beforeRemove', e => {
      if (!attendanceTaken && Object.keys(attendance).length > 0) {
        e.preventDefault();
        showPopup('You have unsaved attendance. Submit before leaving.');
      }
    });
    return () => beforeRemove();
  }, [navigation, attendance, attendanceTaken]);

  // Initial data loading
  useEffect(() => {
    const loadData = async () => {
      const storedUsername = await AsyncStorage.getItem('username');
      setUsername(storedUsername);
      fetchStudents();
    };
    loadData();

    // Sync status listener
    const checkSyncStatus = async () => {
      setIsSyncing(!(await AttendanceManager.getSyncStatus()));
    };
    const state = NetInfo.fetch();
    const offline = !state.isConnected;

    // if (offline) {
    //   AttendanceManager.stopSync()
    // } else {
    //   AttendanceManager.startSync()
    //   checkSyncStatus()
    // }
    checkSyncStatus();
  }, []);

  // Network status listener
  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      //   const stateee = NetInfo.fetch()
      // const offline = !stateee.isConnected
      const offline = !state.isConnected;
      setIsOffline(offline);
      const checkSyncStatus = async () => {
        setIsSyncing(!(await AttendanceManager.getSyncStatus()));
      };
      if (offline) {
        AttendanceManager.stopSync();
      } else {
        AttendanceManager.startSync();
        checkSyncStatus();
      }
    });

    AttendanceManager.startSync();

    return () => {
      unsubscribeNetInfo();
      AttendanceManager.stopSync();
    };
  }, []);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      setUsername(storedUsername);

      // Try cached data first
      const [cachedStudents, cachedTeachers] = await Promise.all([
        AsyncStorage.getItem('CACHED_STUDENTS'),
        AsyncStorage.getItem('CACHED_TEACHERS'),
      ]);

      if (cachedStudents && cachedTeachers) {
        const {data: studentData, timestamp: studentTimestamp} =
          JSON.parse(cachedStudents);
        const {data: teacherData} = JSON.parse(cachedTeachers);

        if (Date.now() - studentTimestamp < 24 * 60 * 60 * 1000) {
          setStudents(studentData);
          setTeachersData(teacherData);
          updateClasses(studentData);
        }
      }

      // Fetch fresh data if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        const [studentsResponse, attendanceResponse] = await Promise.all([
          getStudents(storedUsername),
          getAttendance({
            username: storedUsername,
            dateFor: new Date().toISOString().split('T')[0],
          }),
        ]);

        if (studentsResponse?.Records) {
          setStudents(studentsResponse.Records);
          updateClasses(studentsResponse.Records);
          await AsyncStorage.setItem(
            'CACHED_STUDENTS',
            JSON.stringify({
              data: studentsResponse.Records,
              timestamp: Date.now(),
            }),
          );
        }

        if (attendanceResponse?.Classes) {
          setTeachersData(attendanceResponse.Classes);
          await AsyncStorage.setItem(
            'CACHED_TEACHERS',
            JSON.stringify({
              data: attendanceResponse.Classes,
              timestamp: Date.now(),
            }),
          );
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      const netInfo = await NetInfo.fetch();
      setError(
        netInfo.isConnected
          ? 'Failed to fetch data. Please try again.'
          : 'No internet connection. Using cached data.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateClasses = studentData => {
    const uniqueClasses = [
      ...new Set(studentData.map(student => student.current_class)),
    ];
    setClasses(uniqueClasses);
    if (!selectedClass && uniqueClasses.length > 0) {
      setSelectedClass(uniqueClasses[0]);
    }
  };

  useEffect(() => {
    if (selectedClass && username) {
      const today = new Date();
      const formattedDate = format(today, 'yyyy-MM-dd');
      setSelectedDate(formattedDate); // sets selectedDate state
      fetchAttendanceForClass(selectedClass, username, formattedDate);
    }
  }, [selectedClass, username]); // ✅ only run when these are available

  const handleDateChange = date => {
    const formattedDate = format(date, 'yyyy-MM-dd');

    // ✅ Skip fetch if selected date is same
    if (formattedDate === selectedDate) {
      setShowCalendar(false);
      return;
    }

    setSelectedDate(formattedDate);
    fetchAttendanceForClass(selectedClass, username, formattedDate);
    setShowCalendar(false);
  };

  const fetchAttendanceForClass = async (
    selectedClass,
    username,
    selectedDate,
  ) => {
    try {
      setIsLoading(true); // ✅ Start loading
      console.log('📅 Fetching attendance for:', {
        selectedClass,
        username,
        selectedDate,
      });

      const offlineKey = `${OFFLINE_ATTENDANCE_KEY}${selectedClass}_${selectedDate}`;
      const cached = await AsyncStorage.getItem(offlineKey);

      if (cached) {
        const parsedData = JSON.parse(cached);
        console.log('📦 Cached attendance data:', parsedData);

        const attendanceList =
          parsedData?.body?.attendance ||
          parsedData?.attendance ||
          parsedData?.attendence;

        const attendanceData = Array.isArray(attendanceList)
          ? attendanceList.reduce((acc, item) => {
              acc[item.student_id] = item.status;
              return acc;
            }, {})
          : {};

        setAttendance(attendanceData);
        setAttendanceTaken(true);
        if (!parsedData.isOnlineData) {
          console.log('✅ Used cached data. Skipping online fetch.');
          return;
        }
      }

      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        const response = await getAttendance({
          username: username,
          dateFor: selectedDate,
        });

        console.log('🌐 Online attendance response:', response);

        if (response?.Classes) {
          const classData = response.Classes.find(
            c => c.class_name === selectedClass,
          );
          if (classData?.attendance?.length > 0) {
            const attendanceData = classData.attendance.reduce((acc, item) => {
              acc[item.student_id] = item.status;
              return acc;
            }, {});

            setAttendance(attendanceData);
            setAttendanceTaken(true);

            await AsyncStorage.setItem(
              offlineKey,
              JSON.stringify({
                attendance: classData.attendance,
                timestamp: Date.now(),
                isOnlineData: true,
              }),
            );
          } else {
            console.log('⚠️ No attendance data found in classData.');
          }
        } else {
          console.log('❌ No Classes data in response.');
        }
      } else {
        console.log('📴 Device is offline. Skipping online fetch.');
      }
    } catch (error) {
      console.error('❌ Error fetching attendance:', error);
    } finally {
      setIsLoading(false); // ✅ Stop loading
    }
  };

  const handleAttendanceChange = useCallback(
    (studentId, status) => {
      setAttendance(prev => ({
        ...prev,
        [studentId]: status === 'L/E' ? 'E' : status,
      }));

      if (attendanceTaken === true) {
        setUpdateedAttendence(true); // ✅ mark that a change happened
      }
    },
    [attendanceTaken],
  );

  const handleClassChange = useCallback(
    async newClass => {
      setSelectedClass(newClass);
      setAttendance({});
      setAttendanceTaken(false);
      await fetchAttendanceForClass(newClass, username);
    },
    [username],
  );

  const renderItem = useCallback(
    ({item, index}) => (
      <AttendenceRow
        index={index + 1}
        item={item}
        attendance={attendance}
        statuses={statuses}
        onAttendanceChange={handleAttendanceChange}
        attendanceTaken={attendanceTaken}
        key={`${item.student_id}_${attendance[item.student_id]}`}
      />
    ),
    [attendance, handleAttendanceChange, attendanceTaken],
  );

  const keyExtractor = useCallback(item => item.student_id.toString(), []);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button
          mode="contained"
          onPress={fetchStudents}
          style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#5B4DBC" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {isOffline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineText}>
                You are offline. Attendance will be saved locally.
              </Text>
            </View>
          )}

          {!isOffline && isSyncing && (
            <View style={styles.syncBanner}>
              <ActivityIndicator size="small" color="#5B4DBC" />
              <Text style={styles.syncText}>Syncing pending attendance...</Text>
            </View>
          )}

          <Modal visible={showCalendar} transparent animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.calendarContainer}>
                <CalendarPicker
                  onDateChange={handleDateChange}
                  selectedDayColor="#5B4DBC"
                  selectedDayTextColor="#FFFFFF"
                  todayBackgroundColor="#E6E6FA"
                  todayTextStyle={{color: '#5B4DBC'}}
                  textStyle={{color: '#333'}}
                  previousTitle="Previous"
                  nextTitle="Next"
                  previousTitleStyle={{color: '#5B4DBC'}}
                  nextTitleStyle={{color: '#5B4DBC'}}
                  scaleFactor={375}
                />
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowCalendar(false)}>
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
            <>
              <View style={styles.selectContainer}>
                <View style={styles.headerRow1}>
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}>
                    <Image
                      source={require('../assets/arrow.png')}
                      style={{width: 24, height: 24, tintColor: 'white'}}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowCalendar(true)}>
                    <Image
                      source={require('../assets/calendar.png')}
                      style={[styles.icon, styles.marginRight]}
                    />
                    <Text style={styles.dateButtonText}>
                      {selectedDate
                        ? format(new Date(selectedDate), 'MMMM d, yyyy') // ✅ convert back to Date
                        : 'Select Date'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.pickerContainer}>
                  <CustomDropdown
                    data={classDropdownData}
                    selectedValue={selectedClass}
                    onValueChange={handleClassChange}
                    placeholder="Select a class"
                  />
                </View>
              </View>

              <View style={styles.tableContainer}>
                <View style={styles.headerRow}>
                  <Text style={[styles.headerCell, {width: 50}]}>Sr</Text>
                  <Text
                    style={[
                      styles.headerCell,
                      {width: wp(30), textAlign: 'left'},
                    ]}>
                    Name
                  </Text>
                  <Text
                    style={[styles.headerCell, {width: wp(13), right: wp(5)}]}>
                    ID
                  </Text>
                  <Text
                    style={[styles.headerCell, {width: wp(10), right: wp(5)}]}>
                    status
                  </Text>
                </View>
                {Object.keys(attendance).length > 0 ? (
                  <FlatList
                    data={sortedAttendance}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    updateCellsBatchingPeriod={50}
                    windowSize={21}
                    removeClippedSubviews={true}
                    refreshing={isLoading}
                    onRefresh={() => {
                      fetchStudents();
                      fetchAttendanceForClass(
                        selectedClass,
                        username,
                        selectedDate,
                      );
                    }}
                    getItemLayout={(data, index) => ({
                      length: 50,
                      offset: 50 * index,
                      index,
                    })}
                  />
                ) : (
                  <View style={{padding: 20, alignItems: 'center'}}>
                    <Text style={{color: '#999', fontSize: 16}}>
                      No attendance records found for this class.
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
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
    fontWeight: '500',
    color: 'black',
    textAlign: 'center',
    marginBottom: 8,
    flex: 1,
  },
  pickerContainer: {
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: '#5B4DBC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableContainer: {
    borderRadius: 20,
    borderColor: '#5B4DBC',
    backgroundColor: '#fff',
    marginBottom: 24,
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomColor: '#5B4DBC',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    height: hp(6),
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  headerRow1: {
    flexDirection: 'row',
    borderBottomColor: '#5B4DBC',
    justifyContent: 'space-between',
    height: hp(6),
    alignItems: 'center',
  },
  dateButton: {
    backgroundColor: '#5B4DBC',
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 100,
    alignItems: 'center',
  },
  dateButtonText: {color: 'white', fontSize: 16, fontWeight: 'bold'},
  icon: {tintColor: 'white', width: 24, height: 24},
  marginRight: {marginRight: 10},
  pickerContainer: {marginHorizontal: 16, marginVertical: 16},
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    width: '100%',
    maxHeight: '80%',
  },
  closeButton: {
    backgroundColor: '#5B4DBC',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {color: 'white', fontSize: 16, fontWeight: 'bold'},
  headerCell: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  nameCell: {
    textAlign: 'center',
  },
  idCell: {
    paddingLeft: 16,
    textAlign: 'left',
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#5B4DBC',
    marginTop: 16,
  },
  disabledSubmitButton: {
    backgroundColor: '#A9A9A9',
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#5B4DBC',
  },
  offlineBanner: {
    backgroundColor: '#FFF3CD',
    padding: 8,
    marginBottom: 16,
    borderRadius: 8,
  },
  offlineText: {
    color: '#856404',
    textAlign: 'center',
    fontSize: 12,
  },
  syncBanner: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    marginBottom: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  syncText: {
    color: '#0D47A1',
    fontSize: 12,
  },
});

export default ViewAttendance;
