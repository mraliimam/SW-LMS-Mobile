import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-paper';
import { getStudents, addAttendance, getAttendance } from '../api/Signup';
import { Popup } from '../components/UI/Popup';
import PencilLoader from '../components/UI/PencilLoader';
import StudentRow from './StudentRow';

const Attendance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [username, setUsername] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);
  const [Class_id, setClass_id] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [attendanceTaken, setAttendanceTaken] = useState(false);

  const statuses = ['P', 'A', 'X', 'L/E'];

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
},[])
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      setUsername(storedUsername);
      const response = await getStudents(storedUsername);
      if (response && response.Records) {
        setStudents(response.Records);
        if (response.Records.length > 0) {
          setClass_id(response.Records[0].current_class_id);
          setClasses([response.Records[0].current_class]);
          setSelectedClass(response.Records[0].current_class);
        }
        // console.log('1000')
        await fetchAttendance();
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    // console.log('here is something:>')
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const storedUsername = await AsyncStorage.getItem('username');
      const body = {
        username: storedUsername,
        dateFor: currentDate
      };
      // console.log('what is this <><>')
      const response = await getAttendance(body);
      // console.log('what is that <><>',response)
      if (response && response.Classes && response.Classes.length > 0) {
        const classData = response.Classes[0];
        
        // console.log('loli')
        const attendanceData = classData.attendance.reduce((acc, item) => {
          acc[item.student_id] = item.status;
          return acc;
        }, {});
        setAttendance(attendanceData);
        setAttendanceTaken(true);
      } else {
        setAttendanceTaken(false);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Failed to fetch attendance. Please try again.');
    }
  }, [username]);

  const handleAttendanceChange = useCallback((studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status === 'L/E' ? 'E' : status,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: parseInt(studentId),
        status,
        date_added: currentDate,
      }));
      const body = {
        username: username,
        class_id: Class_id, 
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
  }, [attendance, username, Class_id, showPopup]);

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
      <SafeAreaView style={styles.container}>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <PencilLoader size={100} color="#5B4DBC" />
          </View>
        ) : (
          <>
            <View style={styles.selectContainer}>
              <Text style={styles.label}>Select Class</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedClass}
                  onValueChange={setSelectedClass}
                  mode="dropdown"
                  style={styles.picker}
                >
                  {classes.map((className) => (
                    <Picker.Item key={className} label={className} value={className} />
                  ))}
                </Picker>
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
                data={students}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                updateCellsBatchingPeriod={50}
                windowSize={21}
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
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  selectContainer: {
    justifyContent: "center",
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: 'black',
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    borderColor: '#5B4DBC',
    backgroundColor: '#fff',
    borderRadius: 30,
  },
  picker: {
    height: 50,
    width: '100%',
    color: 'black'
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
