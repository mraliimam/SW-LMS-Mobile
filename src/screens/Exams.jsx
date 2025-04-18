import React, {useCallback, useEffect, useState, useMemo} from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ToastAndroid,
  StatusBar,
} from 'react-native';
import CustomDropdown from '../components/CustomDropdown';
import {addExamRecord, getExams} from '../services/ExamsManager';
import PencilLoader from '../components/UI/PencilLoader';
import {
  getAllClasses,
  getExamsByClass,
  getExamsObject,
  getStudents,
  getStudentsByClass,
} from '../api/Signup';
import {useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StudentRowOne from './StudentRow1';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {sub} from 'date-fns';
import {Popup} from '../components/UI/Popup';

const Exams = ({navigation}) => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [subExam, setSubExam] = useState({});
  const [classId, setClassId] = useState(1);
  const [subExamId, setSubExamId] = useState(1);
  const [subExamType, setSubExamType] = useState('Category');
  const [userName, setUserName] = useState('Teacher');
  const [Class_Exam_Results, setClassExamResults] = useState([]);
  const [examsNames, setExamNames] = useState([
    'Internal Exam 1',
    'Internal Exam 2',
    'Final Exam',
  ]);
  const [classes, setClasses] = useState([]);
  const [categories, setCategories] = useState([
    'Qaida/Nazra',
    'Syllabus Status',
    'Tajweed',
    'Reading',
    'Syllabus',
  ]);
  const [categoriesToSend, setCategoriesToSend] = useState([]);
  const [selectedClass, setSelectedClass] = useState(
    classes.length > 0 ? classes[0].class_name : 'Boys Qaida 1',
  );
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [selectedExam, setSelectedExam] = useState('Internal Exam 1');
  const [selectedCategory, setSelectedCategory] = useState('Qaida/Nazra');
  const [selectedCategory1, setSelectedCategory1] = useState({
    category: 'Category',
    id: 1,
    main_exam_id: 1,
    name: 'Qaida/Nazra',
    total_marks: 'Yes/No',
  });
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [attendance, setAttendance] = useState({});
  const [submissionData, setSubmissionData] = useState({
    username: userName,
    sub_exam_id: subExamId,
    students_data: [],
  });
  const insets = useSafeAreaInsets();
  const getClasses = async () => {
    try {
      // setLoading(true)
      const repsonse = await getAllClasses('Teacher');
      setClasses(repsonse.Classes);
    } catch {
      console.log('error in getting classes');
    } finally {
      // setLoading(false)
    }
  };
  const getStudentsOfClass = async nome => {
    try {
      const targetClass = classes.find(
        cls => cls.class_name === nome ?? selectedClass,
      );
      // setLoading(true)
      const data = {
        username: 'Teacher',
        class_id: targetClass ? targetClass.id : 1,
      };

      const repsonse = await getStudentsByClass(data);
      setStudents(repsonse.Students);
    } catch {
      console.log('error in getting classes');
    } finally {
      // setLoading(false)
    }
  };

  const getExams = async (classId, subId) => {
    try {
      const data = {
        username: 'Teacher',
        class_id: classId ?? 1,
        sub_exam_id: subId ?? 1,
      };
      // setLoading(true)
      const repsonse = await getExamsByClass(data);
      setClassExamResults(repsonse.Class_Exam_Results);
    } catch {
      console.log('error in getting classes');
    } finally {
      // setLoading(false)
    }
  };
  const getObject = async (sClass, exam, subExam) => {
    try {
      const data = {
        username: 'Teacher',
        class_name: sClass,
        exam_name: exam,
        sub_exam_name: subExam,
      };
      // setLoading(true)
      const repsonse = await getExamsObject(data);
      setSubExam(repsonse.Exams.sub_exams);
      setSubExamId(repsonse.Exams.sub_exams.id);
      setSubmissionData(prev => ({
        ...prev,
        sub_exam_id: repsonse.Exams.sub_exams.id,
      }));
      setSubExamType(repsonse.Exams.sub_exams.category);

      // setClasses(repsonse.Classes);
    } catch {
      console.log('error in getting classes');
    } finally {
      // setLoading(false)
    }
  };
  const statuses = useMemo(() => {
    return subExam.category === 'Numerical'
      ? [subExam.total_marks]
      : ['Yes', 'No'];
  }, [subExam]);

  const handleMarkChange = useCallback(
    (studentId, value) => {
      if (subExamType === 'Numerical') {
        setMarks(prev => ({...prev, [studentId]: value}));
        setSubmissionData(prev => {
          const existingIndex = prev.students_data.findIndex(
            s => s.student_id === studentId,
          );

          const newStudentsData = [...prev.students_data];
          const numericValue = parseInt(value) || 0;

          if (existingIndex >= 0) {
            newStudentsData[existingIndex] = {
              student_id: studentId,
              marks: numericValue,
            };
          } else {
            newStudentsData.push({
              student_id: studentId,
              marks: numericValue,
            });
          }

          return {
            ...prev,
            students_data: newStudentsData,
          };
        });
      } else {
        setAttendance(prev => ({...prev, [studentId]: value}));

        setSubmissionData(prev => {
          const existingIndex = prev.students_data.findIndex(
            s => s.student_id === studentId,
          );

          const newStudentsData = [...prev.students_data];
          const numericValue = value === 'Yes' ? true : false;

          if (existingIndex >= 0) {
            newStudentsData[existingIndex] = {
              student_id: studentId,
              marks: numericValue,
            };
          } else {
            newStudentsData.push({
              student_id: studentId,
              marks: numericValue,
            });
          }

          return {
            ...prev,
            students_data: newStudentsData,
          };
        });
      }
    },
    [subExamType],
  );
  
  
  useEffect(() => {
    getClasses();
    getObject(selectedClass, selectedExam, selectedCategory);
    getStudentsOfClass(selectedClass);
    getExams(classId, subExamId);
  }, []);
  useEffect(() => {
    getExams(classId, subExamId);
  }, [classId, subExamId]);

  const handleSubmit = async () => {
    setSendLoading(true);
    try {
      const response = await addExamRecord(submissionData);
      setPopupMessage(response.Message);
      setPopupVisible(true);
    } catch (error) {
      console.log('Error submitting attendance:', error);
      ToastAndroid.show(error.error, ToastAndroid.SHORT);
    } finally {
      setSendLoading(false);
    }
  };

  const renderItem = useCallback(
    ({item, index}) => {
      // Find existing result
      const studentResult = Class_Exam_Results.find(
        result => 
          Number(result.student_id) === Number(item.student_id) && 
          Number(result.sub_exam_id) === Number(subExamId)
      );
  
      let currentValue;
      if (subExamType === 'Numerical') {
        currentValue = marks[item.student_id] !== undefined 
          ? marks[item.student_id] 
          : studentResult 
            ? studentResult.marks.toString() // Ensure string for input
            : '';
      } else {
        // For boolean (Yes/No) marks
        currentValue = attendance[item.student_id] !== undefined
          ? attendance[item.student_id] // Use local state
          : studentResult
            ? studentResult.marks === "True" || studentResult.marks === true
              ? 'Yes'
              : 'No'
            : ''; // Default empty
      }
  
      return (
        <StudentRowOne
          index={index + 1}
          item={item}
          statuses={statuses}
          onAttendanceChange={handleMarkChange}
          currentValue={currentValue}
          // isEditing={isEditingExisting}
        />
      );
    },
    [marks, attendance, statuses, handleMarkChange, Class_Exam_Results, subExamId, subExamType],
  );
  const handleNew = abc => {
    setLoadingData(true);
    setSelectedClass(abc);
    getStudentsOfClass(abc);
    const target = classes.find(cls => cls.class_name === abc);
    setClassId(target.id);
    getObject(abc, selectedExam, selectedCategory);
    setLoadingData(false);
  };
  const handleExamType = abc => {
    setLoadingData(true);
    setSelectedExam(abc);
    getObject(selectedClass, abc, selectedCategory);
    setLoadingData(false);
  };
  const handleExamCategory = abc => {
    setLoadingData(true);
    setSelectedCategory(abc);
    getObject(selectedClass, selectedExam, abc);
    setLoadingData(false);  
  };

  return (
    <View style={{...styles.container, paddingTop: insets.top}}>
      <View style={styles.container1}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <Image
              source={require('../assets/arrow.png')}
              style={{width: 24, height: 24, tintColor: 'white'}}
            />
          </TouchableOpacity>
          <Text style={styles.label}>Exams</Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <PencilLoader size={100} color="#5B4DBC" />
          </View>
        ) : (
          <View style={styles.content}>
            <View style={styles.item}>
              <Text style={styles.selectionItem}>Select Class: </Text>
              <View style={{flex: 1}}>
                <CustomDropdown
                  data={classes.map(cls => ({
                    label: cls.class_name,
                    value: cls.class_name,
                    teacher: cls.teacher_name,
                  }))}
                  selectedValue={selectedClass}
                  // onValueChange={setSelectedClass}
                  onValueChange={ss => handleNew(ss)}
                  placeholder="Select Class"
                />
              </View>
            </View>
            <View style={styles.item}>
              <Text style={styles.selectionItem}>Select Type: </Text>
              <View style={{flex: 1}}>
                <CustomDropdown
                  data={examsNames.map(exam => ({
                    label: exam,
                    value: exam,
                  }))}
                  selectedValue={selectedExam}
                  onValueChange={abc => handleExamType(abc)}
                  placeholder="Select Exam Type"
                />
              </View>
            </View>
            <View style={styles.item}>
              <Text style={styles.selectionItem}>Select Category: </Text>
              <View style={{flex: 1}}>
                <CustomDropdown
                  data={categories.map(cat => ({
                    label: cat,
                    value: cat,
                  }))}
                  selectedValue={selectedCategory}
                  onValueChange={abc => handleExamCategory(abc)}
                  placeholder="Select Category"
                />
              </View>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.srCell]}>Sr</Text>
              <Text style={[styles.headerCell, styles.nameCell]}>Name</Text>
              <Text style={[styles.headerCell, styles.idCell]}>ID</Text>
              {statuses.map(status => (
                <Text key={status} style={styles.headerCell}>
                  {status}
                </Text>
              ))}
            </View>

            {(Class_Exam_Results || Class_Exam_Results.length > 0) ? (
              <FlatList
              data={students}
              // data={studentss}
              renderItem={renderItem}
              keyExtractor={item => item.student_id.toString()}
              contentContainerStyle={styles.listContent}
              initialNumToRender={10} // Render only 10 items initially
              maxToRenderPerBatch={10} // Add 10 items per batch
              windowSize={21} // Render items within 1 screen height
              removeClippedSubviews={true} // Unmount offscreen items (may help)
            />
              
            ): (
              <View style={styles.loaderContainer}>
                <PencilLoader size={100} color="#5B4DBC" />
                <Text style={{color: 'black', fontSize: 16, marginTop: 10}}>
                  Loading Table Data
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.submitButton,
                // submissionData.students_data.length < students.length ||
                (submissionData.sub_exam_id == null ||
                  submissionData.username == '') &&
                  styles.disabledSubmitButton,
              ]}
              disabled={
                // submissionData.students_data.length < students ||
                submissionData.sub_exam_id == null ||
                submissionData.username == '' ||
                sendLoading
              }>
              <Text style={{color: 'white'}}>
                {sendLoading ? 'Submitting...' : 'Submit Attendance'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Popup
        visible={popupVisible}
        onClose={() => setPopupVisible(false)}
        title="Message">
        <Text>{popupMessage}</Text>
      </Popup>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5B4DBC',
  },
  container1: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: '#5B4DBC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: 'white',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '500',
    color: 'black',
    textAlign: 'center',
    marginLeft: -40,
  },
  selectionItem: {fontSize: 20, color: '#5B4DBC', fontWeight: 'bold'},
  item: {flexDirection: 'row', alignItems: 'center', marginBottom: 20},
  content: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#5B4DBC',
    paddingVertical: 12,
    marginTop: 16,
  },
  headerCell: {
    flex: 1,
    // textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
  },
  srCell: {
    flex: 0.8,
    paddingLeft: 8,
  },
  nameCell: {
    flex: 2,
    paddingLeft: 16,
    textAlign: 'left',
  },
  idCell: {
    flex: 1.5,
    paddingLeft: 16,
    textAlign: 'left',
  },
  listContent: {
    paddingBottom: 20,
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
});

export default Exams;
