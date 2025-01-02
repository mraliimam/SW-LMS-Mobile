import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStudents, addAttendance } from '../api/Signup';
import { Popup } from '../components/UI/Popup';
import PencilLoader from '../components/UI/PencilLoader';
export default function Attendance() {
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [username, setUsername] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);
  const [Class_id, setClass_id] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Add loading state
  const [classes,setclasses] = useState([]); 
  const statuses = ['P', 'A', 'H', 'L', 'E'];

  useEffect(() => {
    fetchStudents();
  }, []);

  const showPopup = (message) => {
    setPopupMessage(message);
    setPopupVisible(true);
  }

  const fetchStudents = async () => {
    setIsLoading(true); // Start loading
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      setUsername(storedUsername);
      // console.log(storedUsername);
      const response = await getStudents(storedUsername);
      if (response && response.Records) {
        setStudents(response.Records);
        setClass_id(response.Records[0].current_class_id)
        const initialAttendance = response.Records.reduce((acc, student) => {
          acc[student.student_id] = '';
          return acc;
        }, {});
        setAttendance(initialAttendance);
        setclasses(response.Records[0].current_class)
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmit = async () => {
    try {
      const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
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
      // console.log('what is this:>',body.class_id)
      const response = await addAttendance(body);
      if (response.Message) {
        showPopup(response.Message);
      }
    } catch (error) {
      console.error('Error submitting attendance:', error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.nameCell]}>{item.name}</Text>
      {statuses.map(status => (
        <TouchableOpacity
          key={status}
          style={styles.radioContainer}
          onPress={() => handleAttendanceChange(item.student_id, status)}>
          <View
            style={[
              styles.radio,
              attendance[item.student_id] === status && styles.radioSelected,
            ]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

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
              <Picker.Item label="Select Class" value="" />
              {/* {classes.map(className => (
                <Picker.Item key={className} label={className} value={className} />
              ))} */}

              <Picker.Item label={classes} value={classes} />
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
            keyExtractor={item => item.student_id.toString()}
          />
        </View>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Attendance</Text>
        </TouchableOpacity>
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
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },

  selectContainer: {
    justifyContent:"center",
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
  row: {
    borderRadius: 20,
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
  cell: {
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  nameCell: {
    flex: 2,
    paddingLeft: 16,
    textAlign: 'left',
  },
  radioContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#5B4DBC',
  },
  radioSelected: {
    backgroundColor: '#5B4DBC',
  },
  submitButton: {
    backgroundColor: '#5B4DBC',
    padding: 16,
    borderRadius: 28,
    maxWidth: '60%',
    justifyContent: "center",
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});