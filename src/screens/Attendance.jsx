import React, {useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  Platform,
  TouchableOpacity,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-paper';
import { getStudents, addAttendance, getAttendance } from '../api/Signup';
import { Popup } from '../components/UI/Popup';
import PencilLoader from '../components/UI/PencilLoader';
import StudentRow from './StudentRow';
import CustomDropdown from '../components/CustomDropdown';

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [username, setUsername] = useState('');
  const navigation = useNavigation();
  const [popupVisible, setPopupVisible] = useState(false);
  const [Class_id, setClass_id] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [attendanceTaken, setAttendanceTaken] = useState(false);
  const statuses = ['P', 'A', 'X', 'L/E'];
  const filteredStudents = useMemo(() => 
    students.filter(student => student.current_class === selectedClass),
    [selectedClass, students]
  );

  const showPopup = useCallback((message) => {
    setPopupMessage(message);
    setPopupVisible(true);
  }, []);

useEffect(() => {
  const Getusername = async()=>{
    const storedUsername = await AsyncStorage.getItem('username');
    setUsername(storedUsername);
    fetchStudents();
  }
  Getusername()
},[fetchStudents])


  const handleAttendanceChange = useCallback((studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status === 'L/E' ? 'E' : status,
    }));
  }, []);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      setUsername(storedUsername);
      const response = await getStudents(storedUsername);
      if (response && response.Records) {
        const uniqueClasses = [...new Set(response.Records.map(student => student.current_class))];
        setStudents(response.Records);
        setClasses(uniqueClasses);
        setSelectedClass(prevClass => prevClass || uniqueClasses[0]);
        await fetchAttendance();
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchAttendance]);

  const fetchAttendance = useCallback(async () => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const storedUsername = await AsyncStorage.getItem('username');
      const body = {
        username: storedUsername,
        dateFor: currentDate
      };
      const response = await getAttendance(body);
      if (response && response.Classes && response.Classes.length > 0) {
        const classData = response.Classes[0];        
        const attendanceData = classData.attendance.reduce((acc, item) => {
          acc[item.student_id] = item.status;
          return acc;
        }, {});
        setAttendance(attendanceData);
        setAttendanceTaken(true);
        setSelectedClass(classData.class_name || selectedClass);
      } else {
        setAttendanceTaken(false);
        setAttendance({});
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Failed to fetch attendance. Please try again.');
    }
  }, [selectedClass]);

  const handleSubmit = useCallback(async () => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        status,
        date_added: currentDate,
      }));
      const selectedClassId = students.find(student => student.current_class === selectedClass)?.current_class_id;
      const body = {
        username: username,
        class_id: selectedClassId,
        attendance: attendanceData,
      };
      const response = await addAttendance(body);
      if (response.Message) {
        showPopup(response.Message);
        setAttendanceTaken(true);
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
      setError('Failed to submit attendance. Please try again.');
    }
  }, [attendance, username, selectedClass, students, showPopup]);

  const renderItem = useCallback(({ item }) => (
    <StudentRow
      item={item}
      attendance={attendance}
      statuses={statuses}
      onAttendanceChange={handleAttendanceChange}
      attendanceTaken={attendanceTaken}
    />
  ), [attendance, handleAttendanceChange, attendanceTaken]);

  const keyExtractor = useCallback((item) => item.student_id.toString(), []);

  const handleClassChange = useCallback(async (newClass) => {
    setSelectedClass(newClass);
    // Fetch attendance for all classes
    const currentDate = new Date().toISOString().split('T')[0];
    const body = {
      username: username,
      dateFor: currentDate
    };
    
    try {
      const response = await getAttendance(body);
      if (response && response.Classes) {
        const selectedClassData = response.Classes.find(
          classData => classData.class_name === newClass
        );
        
        if (selectedClassData && selectedClassData.attendance.length > 0) {
          const attendanceData = selectedClassData.attendance.reduce((acc, item) => {
            acc[item.student_id] = item.status;
            return acc;
          }, {});
          setAttendance(attendanceData);
          setAttendanceTaken(true);
        } else {
          setAttendanceTaken(false);
          setAttendance({});
        }
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Failed to fetch attendance. Please try again.');
    }
  }, [username]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchStudents} style={styles.retryButton}>
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
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <PencilLoader size={100} color="#5B4DBC" />
            </View>
          ) : (
            <>
              <View style={styles.selectContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center',marginBottom: 16 }}>
                  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Image source={require('../assets/arrow.png')} style={{ width: 24, height: 24, tintColor: 'white' }} />
                  </TouchableOpacity>
                  <Text style={styles.label}>Attendance</Text>
                </View>
                <View style={styles.pickerContainer}>
                  <CustomDropdown
                    data={classes.map((className) => ({ label: className, value: className }))}
                    selectedValue={selectedClass}
                    onValueChange={handleClassChange}
                    placeholder="Select a class"
                  />
                </View>
              </View>

              <View style={styles.tableContainer}>
                <View style={styles.headerRow}>
                  <Text style={[styles.headerCell, styles.nameCell]}>Student Name</Text>
                  {statuses.map(status => (
                    <Text key={status} style={styles.headerCell}>
                      {status}
                    </Text>
                  ))}
                </View>
                <FlatList
          data={filteredStudents}
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
              <Button 
                mode="contained" 
                onPress={handleSubmit}
                style={styles.submitButton}
              >
                {attendanceTaken ? 'Update Attendance' : 'Submit Attendance'}
              </Button>
            </>
          )}
          <Popup
            visible={popupVisible}
            onClose={() => setPopupVisible(false)}
            title="Message"
          >
            <Text>{popupMessage}</Text>
          </Popup>
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
    // marginBottom: 24,
    // justifyContent: "center",
    marginBottom: 24,
  },
  label: {
    marginRight:15,
    fontSize: 24,
    fontWeight: '500',
    color: 'black',
    textAlign: 'center',
    marginBottom: 8,
    flex: 1,
  },
  pickerContainer: {
    borderRadius: 8,
    // padding:8,
    paddingHorizontal:16,
    backgroundColor: '#fff',
    borderRadius: 30,
  },
  picker: {
    height: 50,
    width: '100%',
    color: 'black'
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 100,
    // justifyContent: 'flex-start',
    backgroundColor: '#5B4DBC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableContainer: {
    borderRadius: 20,
    borderWidth: 1,
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
    borderBottomWidth: 1,
    borderBottomColor: '#5B4DBC',
    paddingVertical: 12,
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  nameCell: {
    flex: 2,
    paddingLeft: 16,
    textAlign: 'left',
  },
  submitButton: {
    backgroundColor: '#5B4DBC',
    marginTop: 16,
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
});

export default Attendance;
