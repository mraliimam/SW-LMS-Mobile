import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
  Header
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView,useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAttendance } from '../api/Signup';
import PencilLoader from '../components/UI/PencilLoader';
import CalendarPicker from 'react-native-calendar-picker';
import { format } from 'date-fns';

import Ionicons from 'react-native-vector-icons/Ionicons'
import Icon from 'react-native-vector-icons/Ionicons'
import {  useNavigation } from '@react-navigation/native'
const width = Dimensions.get('window').width;
export default function ViewAttendance() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [username, setUsername] = useState('');
  const insets = useSafeAreaInsets();

  const [isLoading, setIsLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const navigation = useNavigation()
  useEffect(() => {
    fetchUsername();
  }, []);

  const fetchUsername = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      setUsername(storedUsername);
      if (storedUsername) {
        const today = new Date();
        setSelectedDate(today);
        fetchAttendance(storedUsername, format(today, 'yyyy-MM-dd'));
      }
    } catch (error) {
      console.error('Error fetching username:', error);
    }
  };

  const fetchAttendance = async (user, date) => {
    setIsLoading(true);
    try {
      const response = await getAttendance({
        username: user,
        dateFor: date,
      });
      if (response && response.Classes && response.Classes[0]) {
        setAttendanceData(response.Classes[0].attendance);
      } else {
        setAttendanceData([]);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendanceData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    fetchAttendance(username, format(date, 'yyyy-MM-dd'));
    setShowCalendar(false);
  };

  const renderItem = ({ item }) => (
    <SafeAreaView style={styles.row}>
      <Text style={[styles.cell, styles.idCell]}>{item.student_id}</Text>
      <View style={[styles.statusCell, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </SafeAreaView>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'P': return '#4CAF50';
      case 'A': return '#F44336';
      case 'H': return '#FFC107';
      case 'L': return '#FF9800';
      case 'E': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={[styles.header, { marginTop: insets.top }]}>
       <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowCalendar(true)}>
            <Ionicons name="calendar-outline" size={24} color="white" style={{marginRight:10}} />
          <Text style={styles.dateButtonText}>
            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select Date'}
          </Text>
        </TouchableOpacity>
            </View>
       
        <Modal
          visible={showCalendar}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View style={styles.calendarContainer}>
              <CalendarPicker
                onDateChange={handleDateChange}
                selectedDayColor="#5B4DBC"
                selectedDayTextColor="#FFFFFF"
                todayBackgroundColor="#E6E6FA"
                todayTextStyle={{ color: '#5B4DBC' }}
                textStyle={{ color: '#333' }}
                previousTitle="Previous"
                nextTitle="Next"
                previousTitleStyle={{ color: '#5B4DBC' }}
                nextTitleStyle={{ color: '#5B4DBC' }}
                scaleFactor={375}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCalendar(false)}
              >
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
          <View style={styles.tableContainer}>
            <View style={styles.headerRow}>
              <Text style={[styles.headerCell, styles.idCell]}>Student ID</Text>
              <Text style={[styles.headerCell, styles.statusCell]}>Status</Text>
            </View>
            {attendanceData.length > 0 ? (
              <FlatList
                data={attendanceData}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
              />
            ) : (
              <Text style={styles.noDataText}>No attendance data for this date.</Text>
            )}
          </View>
        )}
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 8,
  },
  backButton: {
    width: 40,
    height:40,
    backgroundColor:"#5B4DBC",
    borderRadius:100,
    justifyContent: 'center',
    alignItems: 'center',   
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dateButton: {
    backgroundColor: '#5B4DBC',
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical:15,
    marginLeft: 20,
    marginRight: 20,
    width:width/1.5,
    justifyContent:"center",
    borderRadius: 100,
    alignItems: 'center',
  },
  dateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
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
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  idCell: {
    flex: 1,
    paddingLeft: 16,
    textAlign: 'left',
  },
  statusCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderRadius: 15,
    padding: 5,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});