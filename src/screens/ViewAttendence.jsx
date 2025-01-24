import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAttendance } from '../api/Signup';
import PencilLoader from '../components/UI/PencilLoader';
import CalendarPicker from 'react-native-calendar-picker';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import CustomDropdown from '../components/CustomDropdown';

const { width } = Dimensions.get('window');

export default function ViewAttendance() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

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

  const fetchAttendance = useCallback(
    async (user, date) => {
      setIsLoading(true);
      try {
        const response = await getAttendance({ username: user, dateFor: date });
        console.log('response:>',response)
        if (response && response.Classes) {
          setAttendanceData(response.Classes);
          if (response.Classes.length > 0 && !selectedClass) {
            setSelectedClass(response.Classes[0].class_name.toString());
          }
        } else {
          setAttendanceData([]);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
        setAttendanceData([]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedClass]
  );

  const handleDateChange = (date) => {
    setSelectedDate(date);
    fetchAttendance(username, format(date, 'yyyy-MM-dd'));
    setShowCalendar(false);
  };

  const renderAttendanceItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.idCell]}>{item.student_id}</Text>
      <Text style={[styles.cell, styles.idCell]}>{item.student_name}</Text>
      <View style={[styles.statusCell, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'P':
        return '#4CAF50';
      case 'A':
        return '#F44336';
      case 'H':
        return '#FFC107';
      case 'L':
        return '#FF9800';
      case 'E':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  const selectedClassData = attendanceData.find(
    (classData) => classData.class_name.toString() === selectedClass
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { marginTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require('../assets/arrow.png')} style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowCalendar(true)}>
          <Image source={require('../assets/calendar.png')} style={[styles.icon, styles.marginRight]} />
          <Text style={styles.dateButtonText}>
            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select Date'}
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
              todayTextStyle={{ color: '#5B4DBC' }}
              textStyle={{ color: '#333' }}
              previousTitle="Previous"
              nextTitle="Next"
              previousTitleStyle={{ color: '#5B4DBC' }}
              nextTitleStyle={{ color: '#5B4DBC' }}
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
              <Text style={styles.className}>{selectedClassData.class_name}</Text>
              <FlatList
                data={selectedClassData.attendance}
                renderItem={renderAttendanceItem}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={<Text style={styles.noDataText}>No attendance data for this class.</Text>}
              />
            </>
          ) : (
            <Text style={styles.noDataText}>No class selected or no data available.</Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', paddingHorizontal: 8 },
  backButton: { width: 40, height: 40, backgroundColor: '#5B4DBC', borderRadius: 100, justifyContent: 'center', alignItems: 'center' },
  icon: { tintColor: 'white', width: 24, height: 24 },
  marginRight: { marginRight: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  dateButton: { backgroundColor: '#5B4DBC', flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 15, borderRadius: 100, alignItems: 'center' },
  dateButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  pickerContainer: { marginHorizontal: 16, marginVertical: 16 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  calendarContainer: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 10, width: '100%', maxHeight: '80%' },
  closeButton: { backgroundColor: '#5B4DBC', padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 10 },
  closeButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  attendanceContainer: { flex: 1, marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 10 },
  className: { fontSize: 18, fontWeight: 'bold', backgroundColor: '#5B4DBC', color: 'white', padding: 10 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', paddingVertical: 12, alignItems: 'center' },
  cell: { flex: 1, textAlign: 'center', color: '#333' },
  idCell: { flex: 1, paddingLeft: 16, textAlign: 'left' },
  statusCell: { flex: 1, alignItems: 'center', marginRight: 16, borderRadius: 15, padding: 5 },
  statusText: { color: '#FFFFFF', fontWeight: 'bold' },
  noDataText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#666' },
});
