import {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  getAllClasses,
  getAttendance,
  getExamsByClass,
  getExamsObject,
  getStudentsByClass,
} from '../api/Signup';
import PencilLoader from '../components/UI/PencilLoader';
import CalendarPicker from 'react-native-calendar-picker';
import {format} from 'date-fns';
import {useNavigation} from '@react-navigation/native';
import CustomDropdown from '../components/CustomDropdown';
import NetInfo from '@react-native-community/netinfo';

const {width, height} = Dimensions.get('window');
const ATTENDANCE_VIEW_CACHE_KEY = 'ATTENDANCE_VIEW_';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export default function ViewExamsResults() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState([]);
  const [username, setUsername] = useState('Teacher');
  const [isLoading, setIsLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [Class_Exam_Results, setClassExamResults] = useState([]);
  const [examsNames, setExamNames] = useState([
    'Internal Exam 1',
    'Internal Exam 2',
    'Final Exam',
  ]);
  const [categories, setCategories] = useState([
    'Qaida/Nazra',
    'Syllabus Status',
    'Tajweed',
    'Reading',
    'Syllabus',
  ]);
  const [selectedExam, setSelectedExam] = useState(examsNames[0]);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [statuses, setStatuses] = useState(['Results']);
  const [subExam, setSubExam] = useState({});
  const [classId, setClassId] = useState(null);
  const [students, setStudents] = useState([]);
  const [subExamId, setSubExamId] = useState(null);
  const [subExamType, setSubExamType] = useState('Category');

  const getClasses = async () => {
    try {
      setIsLoading(true);
      const response = await getAllClasses('Teacher');
      setClasses(response.Classes);
      if (response.Classes.length > 0) {
        setSelectedClass(response.Classes[0].class_name);
        setClassId(response.Classes[0].id);
      }
    } catch (error) {
      console.log('Error in getting classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStudentsOfClass = async className => {
    try {
      setIsLoading(true);
      const targetClass = classes.find(cls => cls.class_name === className);
      if (!targetClass) return;

      const data = {
        username: 'Teacher',
        class_id: targetClass.id,
      };

      const response = await getStudentsByClass(data);
      setStudents(response.Students);
    } catch (error) {
      console.log('Error in getting students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getExams = async (classId, subExamId) => {
    try {
      if (!classId || !subExamId) return;

      setIsLoading(true);
      const data = {
        username: 'Teacher',
        class_id: classId,
        sub_exam_id: subExamId,
      };

      const response = await getExamsByClass(data);
      setClassExamResults(response.Class_Exam_Results);
    } catch (error) {
      console.log('Error in getting exams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getExamObject = async (className, examName, category) => {
    try {
      setIsLoading(true);
      const data = {
        username: 'Teacher',
        class_name: className,
        exam_name: examName,
        sub_exam_name: category,
      };

      const response = await getExamsObject(data);
      if (response.Exams && response.Exams.sub_exams) {
        setSubExam(response.Exams.sub_exams);
        setSubExamId(response.Exams.sub_exams.id);
        setSubExamType(response.Exams.sub_exams.category);

        // Update statuses based on exam type
        if (response.Exams.sub_exams.category === 'Numerical') {
          setStatuses([
            `Marks (Out of ${response.Exams.sub_exams.total_marks})`,
          ]);
        } else {
          setStatuses(['Status']);
        }
      }
    } catch (error) {
      console.log('Error in getting exam object:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = date => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  useEffect(() => {
    getClasses();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedExam && selectedCategory) {
      getExamObject(selectedClass, selectedExam, selectedCategory);
      getStudentsOfClass(selectedClass);
    }
  }, [selectedClass, selectedExam, selectedCategory]);

  useEffect(() => {
    if (classId && subExamId) {
      getExams(classId, subExamId);
    }
  }, [classId, subExamId]);

  const handleClassChange = className => {
    setSelectedClass(className);
    const targetClass = classes.find(cls => cls.class_name === className);
    if (targetClass) {
      setClassId(targetClass.id);
    }
  };

  const handleExamChange = examName => {
    setSelectedExam(examName);
  };

  const handleCategoryChange = category => {
    setSelectedCategory(category);
  };

  const renderExamItem = ({item, index}) => {
    const student = students.find(s => Number(s.student_id) === item.student_id);
    let statusDisplay, statusColor;

    if (subExamType === 'Numerical') {
      const percentage = (Number(item.marks) / Number(subExam.total_marks)) * 100;
      statusDisplay = `${item.marks}/${subExam.total_marks}`;
      statusColor = percentage >= 50 ? '#4CAF50' : '#F44336';
    } else {
      if (
        item.marks === true ||
        item.marks === 'true' ||
        item.marks === 'True'
      ) {
        statusDisplay = 'Yes';
        statusColor = '#4CAF50'; // Green for Yes/True
      } else if (
        item.marks === false ||
        item.marks === 'false' ||
        item.marks === 'False'
      ) {
        statusDisplay = 'No';
        statusColor = '#F44336'; // Red for No/False
      } else {
        // For other categorical values, show as is with neutral color
        statusDisplay = item.marks;
        statusColor = '#2196F3'; // Blue for other statuses
      }
    }

    return (
      <View style={styles.row}>
        <Text style={[styles.cell, styles.indexCell]}>{index + 1}</Text>
        <Text style={[styles.cell, styles.nameCell]}>
          {student ? student.name : 'Unknown'}
        </Text>
        <Text style={[styles.cell, styles.idCell]}>{item.student_id}</Text>
        <View style={[styles.statusCell, {backgroundColor: statusColor}]}>
          <Text style={styles.statusText}>{statusDisplay}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Image
              source={require('../assets/arrow.png')}
              style={styles.icon}
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
              {format(selectedDate, 'MMMM d, yyyy')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownRow}>
              <Text style={styles.dropdownLabel}>Class:</Text>
              <CustomDropdown
                data={classes.map(cls => ({
                  label: cls.class_name,
                  value: cls.class_name,
                }))}
                selectedValue={selectedClass}
                onValueChange={handleClassChange}
                placeholder="Select Class"
                style={styles.dropdown}
              />
            </View>

            <View style={styles.dropdownRow}>
              <Text style={styles.dropdownLabel}>Exam Type:</Text>
              <CustomDropdown
                data={examsNames.map(exam => ({
                  label: exam,
                  value: exam,
                }))}
                selectedValue={selectedExam}
                onValueChange={handleExamChange}
                placeholder="Select Exam Type"
                style={styles.dropdown}
              />
            </View>

            <View style={styles.dropdownRow}>
              <Text style={styles.dropdownLabel}>Category:</Text>
              <CustomDropdown
                data={categories.map(cat => ({
                  label: cat,
                  value: cat,
                }))}
                selectedValue={selectedCategory}
                onValueChange={handleCategoryChange}
                placeholder="Select Category"
                style={styles.dropdown}
              />
            </View>
          </View>

          {selectedClass && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>
                {selectedExam} Results - {selectedClass}
              </Text>

              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.srCell]}>#</Text>
                <Text style={[styles.headerCell, styles.nameCell]}>Name</Text>
                <Text style={[styles.headerCell, styles.idCell]}>ID</Text>
                <Text style={[styles.headerCell, styles.statusCell]}>
                  {subExamType === 'Numerical' ? 'Marks' : 'Status'}
                </Text>
              </View>

              {isLoading ? (
                <View style={styles.loaderContainer}>
                  <PencilLoader size={80} color="#5B4DBC" />
                </View>
              ) : (
                <FlatList
                  data={Class_Exam_Results}
                  renderItem={renderExamItem}
                  keyExtractor={item => item.student_id.toString()}
                  ListEmptyComponent={
                    <Text style={styles.noDataText}>
                      {students.length > 0
                        ? 'No exam results available for this selection.'
                        : 'No students found in this class.'}
                    </Text>
                  }
                  scrollEnabled={false}
                />
              )}
            </View>
          )}
        </ScrollView>

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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#5B4DBC',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#5B4DBC',
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    tintColor: 'white',
    width: 24,
    height: 24,
  },
  marginRight: {
    marginRight: 10,
  },
  dateButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  dateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dropdownContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dropdownLabel: {
    width: 100,
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  dropdown: {
    flex: 1,
  },
  resultsContainer: {
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5B4DBC',
    marginBottom: 16,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#5B4DBC',
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
    marginBottom: 8,
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  srCell: {
    flex: 0.8,
  },
  nameCell: {
    flex: 2,
    textAlign: 'left',
    paddingLeft: 8,
  },
  idCell: {
    flex: 1.5,
    textAlign: 'center',
  },
  statusCell: {
    flex: 1.5,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cell: {
    fontSize: 14,
    color: '#333',
  },
  indexCell: {
    flex: 0.8,
    textAlign: 'center',
  },
  statusCell: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    paddingVertical: 4,
    marginHorizontal: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
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
    padding: 16,
    width: '90%',
    maxHeight: '80%',
  },
  closeButton: {
    backgroundColor: '#5B4DBC',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loaderContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    padding: 20,
  },
});
