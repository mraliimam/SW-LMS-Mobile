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

export default function ViewExamsResults() {
  const [selectedDate, setSelectedDate] = useState(new Date());
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
  const [selectedExam, setSelectedExam] = useState(examsNames[0]);
  const [statuses, setStatuses] = useState(['Results']);
  const [subExam, setSubExam] = useState({});
  const [classId, setClassId] = useState(null);
  const [subExamId, setSubExamId] = useState(null);
  const [subExamType, setSubExamType] = useState('');
  const [examResult, setExamResult] = useState([]);

  const students = Class_Exam_Results?.students;
  const exams = examResult?.sub_exams;
  const result = students?.map(student => {
    const subExamResults = exams.map(exam => {
      const found = student.sub_exams.find(se => se.sub_exam_id === exam.id);
      return {
        exam_name: exam.name,
        total_marks: exam.total_marks,
        marks_obtained: found ? found.marks : 'N/A',
      };
    });

    return {
      student_id: student.student_id,
      student_name: student.student_name,
      exams: subExamResults,
    };
  });

  const getClasses = async () => {
    try {
      setIsLoading(true);
      const response = await getAllClasses('Teacher');
      setClasses(response.Classes);
      if (response.Classes.length > 0) {
        setSelectedClass(response.Classes?.[0].class_name);
      }
    } catch (error) {
      console.log('Error in getting classes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  //getClassExamRecords///
  const getExams = async (classId, subExamId) => {
    try {
      if (!classId || !subExamId) return;

      setIsLoading(true);
      const data = {
        username: 'Teacher',
        class_id: classId,
        exam_id: subExamId,
      };

      const response = await getExamsByClass(data);

      setClassExamResults(response.Class_Exam_Results);
    } catch (error) {
      console.log('Error in getting exams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /// getExams ///
  const getExamObject = async (selectedClass, examName) => {
    try {
      setIsLoading(true);
      const data = {
        username: 'Teacher',
        class_name: selectedClass,
        exam_name: examName,
      };

      const response = await getExamsObject(data);

      setExamResult(response?.Exams);
      if (response.Exams && response.Exams.sub_exams) {
        setSubExam(response.Exams.sub_exams);
        setClassId(response?.Exams?.class_id);
        setSubExamId(response?.Exams?.sub_exams?.[0]?.main_exam_id);
        setSubExamType(response.Exams.sub_exams.category);
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
    if (selectedClass && selectedExam) {
      getExamObject(selectedClass, selectedExam);
    }
  }, [selectedClass, selectedExam]);

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

  const renderExamItem = ({item, index}) => {
    const getStatus = examName => {
      const exam = item.exams.find(e => e.exam_name === examName);
      if (!exam) return {display: 'N/A', color: '#F44336'};

      if (exam.total_marks.toLowerCase() === 'yes/no') {
        const mark = exam.marks_obtained?.toString().toLowerCase();
        if (mark === 'yes' || mark === 'y' || mark === 'true') {
          return {display: 'Yes', color: '#4CAF50'}; // Green for Yes
        } else if (mark === 'no' || mark === 'n' || mark === 'false') {
          return {display: 'No', color: '#F44336'}; // Red for No
        } else {
          return {display: 'N/A', color: '#F44336'}; // Default Red for N/A
        }
      }

      const isNumerical =
        !isNaN(Number(exam.total_marks)) && !isNaN(Number(exam.marks_obtained));

      if (isNumerical) {
        const marks = Number(exam.marks_obtained);
        const total = Number(exam.total_marks);
        const color = marks >= 15 ? '#4CAF50' : '#F44336';

        return {
          display: `${marks}/${total}`,
          color,
        };
      }

      return {display: 'N/A', color: '#F44336'};
    };

    const renderStatusCell = examName => {
      const {display, color} = getStatus(examName);
      return (
        <View
          style={[
            styles.cell,
            styles.idCell,
            {alignItems: 'center', justifyContent: 'center'},
          ]}>
          <View
            style={{
              backgroundColor: color,
              borderRadius: 75,
              height: 45,
              width: 45,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 12,
                textAlign: 'center',
              }}>
              {display}
            </Text>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.row}>
        <Text style={[styles.cell, styles.indexCell]}>{index + 1}</Text>
        <Text style={[styles.cell, styles.nameCell]}>
          {item?.student_name || 'Unknown'}
        </Text>
        <Text style={[styles.cell, styles.idCell]}>{item.student_id}</Text>

        {renderStatusCell('Qaida/Nazra Status')}
        {renderStatusCell('Syllabus Status')}
        {renderStatusCell('Tajweed')}
        {renderStatusCell('Reading')}
        {renderStatusCell('Syllabus')}
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
                  teacher: cls.teacher_name,
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
          </View>

          {selectedClass && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>
                {selectedExam} Results - {selectedClass}
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tableHeader}>
                  <View>
                    <View style={{flexDirection: 'row'}}>
                      <Text style={[styles.headerCell, styles.srCell]}>#</Text>
                      <Text style={[styles.headerCell, styles.nameCell]}>
                        Name
                      </Text>
                      <Text style={[styles.headerCell, {width: 100}]}>ID</Text>
                      <Text style={[styles.headerCell, styles.idCell]}>
                        Qaida/Nazra Status (Y/N)
                      </Text>
                      <Text style={[styles.headerCell, styles.idCell]}>
                        Syllabus Status(Y/N)
                      </Text>
                      <Text style={[styles.headerCell, styles.idCell]}>
                        Tajweed (30)
                      </Text>
                      <Text style={[styles.headerCell, styles.idCell]}>
                        Reading (30)
                      </Text>
                      <Text style={[styles.headerCell, styles.idCell]}>
                        Syllabus (40)
                      </Text>
                    </View>
                    {isLoading ? (
                      <View style={styles.loaderContainer}>
                        <PencilLoader size={80} color="#5B4DBC" />
                      </View>
                    ) : (
                      <FlatList
                        data={result}
                        renderItem={renderExamItem}
                        keyExtractor={item => item.student_id.toString()}
                        ListEmptyComponent={
                          <Text style={styles.noDataText}>
                            {result?.length > 0
                              ? 'No exam results available for this selection.'
                              : 'No students found in this class.'}
                          </Text>
                        }
                        scrollEnabled={false}
                      />
                    )}
                  </View>
                </View>
              </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#5B4DBC',
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
    marginBottom: 8,
    width: 1000,
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
