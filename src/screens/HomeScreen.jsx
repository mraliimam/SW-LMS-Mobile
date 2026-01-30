import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Popup} from '../components/UI/Popup';
import {SafeAreaView} from 'react-native-safe-area-context';
import AttendanceManager from '../services/AttendanceManager';
import NetInfo from '@react-native-community/netinfo';
import {addExamRecord} from '../services/ExamsManager';
import {hp, wp} from '../components/UI/responsive';
import {showMessage} from 'react-native-flash-message';
import {getClassExamRecords, getExamsByClass, getStudents} from '../api/Signup';

const images = {
  house: require('../assets/house.png'),
  homework: require('../assets/homework.png'),
  Attendance: require('../assets/Attendance.png'),
  calendar: require('../assets/calendar.png'),
  user: require('../assets/user.png'),
  exams: require('../assets/exam.png'),
};

const MenuItem = ({icon, label, onPress}) => {
  return (
    <TouchableOpacity style={[styles.menuItem]} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Image source={images[icon]} style={styles.HomeImages} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen({navigation}) {
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupVisible1, setPopupVisible1] = useState(false);
  const [type, setType] = useState('Attendance');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true); // New state for loading
  const [popupMessage, setPopupMessage] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const prevIsConnected = useRef(null);

  const hasFetchedRef = useRef(false); // Track API call status

  const getStudentList = async () => {
    console.log('API Call Initiated');
    try {
      setLoading(true);
      const response = await getStudents('Teacher');
      const response1 = await getClassExamRecords('Teacher');
      // console.log(response, 'response');
      console.log(JSON.stringify(response1), 'response1');

      if (response?.Records?.length > 0) {
        const students = response.Records.map(item => ({
          name: item.name,
          student_id: item.student_id,
        }));

        await AsyncStorage.setItem('ALL_DATA', JSON.stringify(response));
        await AsyncStorage.setItem('studentsList', JSON.stringify(students));
        await AsyncStorage.setItem('EXAM_LIST', JSON.stringify(response1));
      }
    } catch (error) {
      console.log('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const state = await NetInfo.fetch();
      if (state.isConnected && !hasFetchedRef.current) {
        hasFetchedRef.current = true; // Prevent multiple calls
        getStudentList();
      }
    };

    fetchData();

    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && !hasFetchedRef.current) {
        hasFetchedRef.current = true; // Only first time after going online
        getStudentList();
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected;

      // Only show toast when connection state changes
      if (prevIsConnected.current !== isConnected) {
        prevIsConnected.current = isConnected; // update previous state

        const offline = !isConnected;
        setIsOffline(offline);

        showMessage({
          message: offline ? 'No Internet Connection' : 'You are back online',
          type: offline ? 'danger' : 'success',
          icon: offline ? 'danger' : 'success',
          duration: 3000,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const menuItems = [
    {icon: 'house', label: 'Dashboard'},
    {icon: 'Attendance', label: 'Attendance'},
    {icon: 'user', label: 'Students'},
    {icon: 'exams', label: 'Exams'},
  ];

  useEffect(() => {
    const fetchUsername = async () => {
      const username = await AsyncStorage.getItem('username');
      setUsername(username);
      setLoading(false);
    };

    fetchUsername();
  }, []);

  const showPopup1 = message => {
    setPopupVisible1(true);
    setPopupMessage(message);
  };

  // Function to fetch user data and sync attendance queue
  const fetchDataAndSyncAttendance = async () => {
    const username = await AsyncStorage.getItem('username');
    setUsername(username);
    setLoading(false);

    try {
      const netInfo = await NetInfo.fetch();
      setIsOffline(!netInfo.isConnected);

      if (netInfo.isConnected) {
        setIsSyncing(true);
        const count = await AttendanceManager.processOfflineQueue();

        if (count > 0) {
          showPopup1(
            `You have synced ${count} attendance record${
              count === 1 ? '' : 's'
            }. Your attendance records updated successfully.`,
          );
        }
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Initial fetch & sync on mount
    fetchDataAndSyncAttendance();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        // When network becomes online, sync data
        fetchDataAndSyncAttendance();
      } else {
        setIsOffline(true);
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  // useEffect(() => {
  //   const syncOfflineSubmissions = async () => {
  //     const netState = await NetInfo.fetch();
  //     if (netState.isConnected) {
  //       const stored = await AsyncStorage.getItem(PENDING_SUBMISSIONS_KEY);
  //       const pending = stored ? JSON.parse(stored) : [];

  //       if (pending.length > 0) {
  //         for (const item of pending) {
  //           try {
  //             await addExamRecord(item);
  //           } catch (error) {
  //             console.log('❌ Failed to sync one item:', error);
  //           }
  //         }

  //         await AsyncStorage.removeItem(PENDING_SUBMISSIONS_KEY);
  //         ToastAndroid.show(
  //           '✅ Offline data synced successfully',
  //           ToastAndroid.SHORT,
  //         );
  //         showPopup1(`Your exams records updated successfully.`);
  //       }
  //     }
  //   };

  //   syncOfflineSubmissions();
  // }, []);

  useEffect(() => {
    let isSyncing = false;

    const syncPendingSubmissions = async () => {
      if (isSyncing) return;
      isSyncing = true;

      try {
        const netState = await NetInfo.fetch();
        if (!netState.isConnected) {
          console.log('❌ No internet connection, skipping sync');
          isSyncing = false;
          return;
        }

        const rawData = await AsyncStorage.getItem('pendingSubmissions');
        const pending = rawData ? JSON.parse(rawData) : {};

        const examIds = Object.keys(pending);
        if (examIds.length === 0) {
          console.log('✅ No pending submissions found');
          isSyncing = false;
          return;
        }

        const currentExamId = examIds[0];
        const submissionsQueue = pending[currentExamId];

        if (!Array.isArray(submissionsQueue) || submissionsQueue.length === 0) {
          delete pending[currentExamId];
          await AsyncStorage.setItem(
            'pendingSubmissions',
            JSON.stringify(pending),
          );
          console.log(
            `ℹ️ Removed empty exam_id ${currentExamId}, syncing next if any`,
          );
          showMessage({
            message: 'Submitted Successfully',
            description: `Exam ID ${currentExamId} was synced.`,
            type: 'success',
          });
          isSyncing = false;
          await syncPendingSubmissions();
          return;
        }

        const submission = submissionsQueue[0];

        // ✅ Validate schema
        if (
          !submission.username ||
          !submission.exam_id ||
          !Array.isArray(submission.students_data)
        ) {
          console.error('❌ Invalid submission schema:', submission);
          submissionsQueue.shift();
          if (submissionsQueue.length === 0) {
            delete pending[currentExamId];
          }
          await AsyncStorage.setItem(
            'pendingSubmissions',
            JSON.stringify(pending),
          );
          isSyncing = false;
          await syncPendingSubmissions();
          return;
        }

        console.log('📤 Submitting:', JSON.stringify(submission));

        const response = await addExamRecord(submission);

        console.log('✅ API response:', response);
        showPopup1('Exam records processed successfully', response);

        if (response && response.Message) {
          submissionsQueue.shift();
          if (submissionsQueue.length === 0) {
            delete pending[currentExamId];
          }
          await AsyncStorage.setItem(
            'pendingSubmissions',
            JSON.stringify(pending),
          );
          console.log(
            `✅ Submission for exam_id ${currentExamId} successful, syncing next...`,
          );
          isSyncing = false;
          await syncPendingSubmissions();
        } else if (response && response.Error) {
          console.error(
            `❌ API Error on exam_id ${currentExamId}:`,
            response.Error,
          );
          isSyncing = false; // stop sync on error
        } else {
          console.error('❌ Unexpected API response:', response);
          isSyncing = false;
        }
      } catch (error) {
        console.error('❌ Error during sync:', error);
        isSyncing = false;
      }
    };

    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        syncPendingSubmissions();
      }
    });

    // Initial sync attempt
    syncPendingSubmissions();

    return () => unsubscribe();
  }, []);

  async function logout() {
    try {
      await AsyncStorage.removeItem('username');
      // console.log('User logged out');
      navigation.reset({
        index: 0,
        routes: [{name: 'SignIn'}],
      });
    } catch (error) {
      console.error('Failed to logout:', error.message);
    }
  }

  const showPopup = type => {
    setPopupVisible(true);
    setType(type);
  };

  const handleAttendancePress = label => {
    if (label == 'Attendance' || label == 'Exams') {
      showPopup(label);
    } else {
      // Map Dashboard to Home screen
      const screenName = label === 'Dashboard' ? 'Home' : label;
      navigation.navigate(screenName);
    }
  };

  const handlePopupPress = where => {
    console.log(where, 'where');

    navigation.navigate(where);
    setPopupVisible(false);
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#5B4DBC" />
      <SafeAreaView style={styles.container}>
        {!isOffline && isSyncing && (
          <View style={styles.syncBanner}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.syncText}>Syncing pending data...</Text>
          </View>
        )}

        {/* Offline Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              You are offline. Some features may not work.
            </Text>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <Image
                source={require('../assets/user.png')}
                style={styles.profileImage}
              />
              <View style={styles.profileInfo}>
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" /> // Show loading spinner
                ) : (
                  <Text style={[styles.menuLabel, {color: '#fff'}]}>
                    {username}
                  </Text> // Show username once loaded
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton}>
              <Image
                source={require('../assets/menu.png')}
                style={{width: 25, height: 25, tintColor: 'white'}}
              />
            </TouchableOpacity>
          </View>

          {/* Menu Grid */}
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <MenuItem
                key={index}
                icon={item.icon}
                label={item.label}
                onPress={() => handleAttendancePress(item.label)}
              />
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => logout()}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
        <Popup
          visible={popupVisible}
          onClose={() => setPopupVisible(false)}
          title="Select">
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              width: '90%',
              gap: 5,
            }}>
            <TouchableOpacity
              style={{
                width: wp(35),
                height: hp(5),
                backgroundColor: '#5B4DBC',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 100,
              }}
              onPress={() => handlePopupPress(type)}>
              <Text
                style={{
                  color: 'white',
                  fontWeight: '500',
                  alignSelf: 'center',
                }}>
                {type == 'Attendance'
                  ? 'Take Attendance'
                  : 'Upload Exam results'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: wp(35),
                height: hp(5),
                backgroundColor: '#5B4DBC',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 100,
              }}
              onPress={() =>
                handlePopupPress(
                  type == 'Attendance' ? 'ViewAttendance' : 'ViewExamsResults',
                )
              }>
              <Text
                style={{
                  color: 'white',
                  fontWeight: '500',
                  alignSelf: 'center',
                }}>
                {type == 'Attendance' ? 'View Attendance' : 'View Exam results'}
              </Text>
            </TouchableOpacity>
          </View>
        </Popup>
        <Popup
          visible={popupVisible1}
          onClose={() => setPopupVisible1(false)}
          title="Message">
          <Text>{popupMessage}</Text>
        </Popup>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5B4DBC',
  },
  scrollContent: {
    flexGrow: 1,
    padding: wp('5%'),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('6%'),
  },
  syncBanner: {
    backgroundColor: '#E3F2FD',
    padding: hp('1%'),
    marginBottom: hp('2%'),
    borderRadius: wp('2%'),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: wp('2%'),
  },
  syncText: {
    color: '#0D47A1',
    fontSize: hp('1.4%'),
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5%'),
    marginRight: wp('3%'),
  },
  logoutButton: {
    backgroundColor: '#fff',
    paddingVertical: hp('1.5%'),
    borderRadius: 75,
    marginTop: hp('5%'),
    alignItems: 'center',
    width: wp(80),
    alignSelf: 'center',
  },
  logoutText: {
    color: '#5B4DBC',
    fontWeight: '600',
    fontSize: hp('2%'),
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  menuItem: {
    width: wp('35%'),
    backgroundColor: '#fff',
    borderRadius: wp('5%'),
    paddingVertical: hp('2%'),
    marginVertical: hp('1%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: wp('13%'),
    height: wp('13%'),
    marginBottom: hp('1%'),
  },
  HomeImages: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  menuLabel: {
    fontSize: hp('1.6%'),
    color: '#5B4DBC',
    fontWeight: '600',
  },
  offlineBanner: {
    backgroundColor: '#FFC107',
    padding: hp('1.2%'),
    alignItems: 'center',
  },
  offlineText: {
    color: '#212121',
    fontSize: hp('1.6%'),
  },
});
