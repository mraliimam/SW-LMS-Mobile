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
  ScrollView,
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
import StudentRowOne from './StudentRow1';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Popup} from '../components/UI/Popup';

const Exams = ({navigation}) => {
  const [button, setButton] = useState(false);
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
  const [statuse, setStatuses] = useState(['Results']);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(
    classes.length > 0 ? classes[0].class_name : 'Boys Qaida 1',
  );
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [selectedExam, setSelectedExam] = useState('Internal Exam 1');
  const [marks, setMarks] = useState({});
  const [attendance, setAttendance] = useState({});
  const [submissionData, setSubmissionData] = useState({
    username: userName,
    exam_id: subExamId,
    students_data: [],
  });
  const [subExamNewId, setSubExamNewId] = useState();

  const [classNewId, setClassNewId] = useState();

  // console.log(subExamNewId, '========log');

  console.log(JSON.stringify(submissionData, null, 2), '=========');

  const insets = useSafeAreaInsets();
  const [examResult, setExamResult] = useState([]);
  // console.log(Class_Exam_Results?.students, 'Class_Exam_Results=====================');
  // console.log(examResult?.sub_exams, 'examResult=====================');

  const students = Class_Exam_Results?.students || []; // Default to empty array if undefined
  const exams = examResult?.sub_exams || []; // Default to empty array if undefined

  const result = students.map(student => {
    const subExamResults = exams.map(exam => {
      const found = student.sub_exams?.find(se => se.sub_exam_id === exam.id);
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

  useEffect(() => {
    setSubmissionData(prev => ({
      ...prev,
      exam_id: subExamId,
    }));
  }, [subExamId]);
  // console.log('Result:', result);

  const getClasses = async () => {
    try {
      setLoading(true);
      const response = await getAllClasses('Teacher');
      setClasses(response.Classes);
      if (response.Classes.length > 0) {
        setSelectedClass(response.Classes?.[0].class_name);
      }
    } catch (error) {
      console.log('Error in getting classes:', error);
    } finally {
      setLoading(false);
    }
  };

  //getClassExamRecords///
  const getExams = async (classNewId, subExamId) => {
    // console.log(classNewId, subExamId, 'getExamsByClass');

    try {
      if (!classNewId || !subExamId) return;

      setLoading(true);
      const data = {
        username: 'Teacher',
        class_id: classNewId,
        exam_id: subExamId,
      };

      const response = await getExamsByClass(data);
      // console.log(response, 'response======================:::::::::::');
      setClassExamResults(response.Class_Exam_Results);
    } catch (error) {
      console.log('Error in getting exams:', error);
    } finally {
      setLoading(false);
    }
  };

  /// getExams ///
  const getObject = async (selectedClass, examName) => {
    // console.log(selectedClass, examName, 'getExams');

    try {
      setLoading(true);
      const data = {
        username: 'Teacher',
        class_name: selectedClass,
        exam_name: examName,
      };

      const response = await getExamsObject(data);
      // console.log(
      //   'Exam object response:::::::::::::::::::::::::::::::::::::::::::::',
      //   response?.Exams?.sub_exams,
      // );
      setExamResult(response?.Exams);
      if (response.Exams && response.Exams.sub_exams) {
        setSubExam(response.Exams.sub_exams);
        setSubExamId(response?.Exams?.sub_exams?.[0]?.main_exam_id);
        setSubExamType(response.Exams.sub_exams.category);
        setClassNewId(response?.Exams?.class_id);
        setSubExamNewId(response?.Exams?.sub_exams);

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
      setLoading(false);
    }
  };

  const statuses = useMemo(() => {
    return subExam.category === 'Numerical'
      ? [subExam.total_marks]
      : ['Yes', 'No'];
  }, [subExam]);

  useEffect(() => {
    getClasses();
    getObject(selectedClass, selectedExam);
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

  // console.log(subExamNewId, '========================');

  const handleMarkChange = (studentId, value, examName) => {
    setButton(true);
    console.log(studentId, value, examName, '<< input values');
    const studentIdNum = Number(studentId);
    const exam = subExamNewId.find(item => item.name === examName);
    const examId = exam?.id;

    console.log(examId, '-------- sub_exam_id');

    if (!examId) {
      console.log('Exam not found for examName:', examName);
      return;
    }

    // Update attendance (optional UI state)
    setAttendance(prev => ({
      ...prev,
      [studentIdNum]: {
        ...prev[studentIdNum],
        [examName]: value,
      },
    }));

    // Update submission data
    setSubmissionData(prev => {
      const updatedStudents = [...prev.students_data];
      const studentIndex = updatedStudents.findIndex(
        s => s.student_id === studentId,
      );

      if (studentIndex !== -1) {
        const examIndex = updatedStudents[studentIndex].sub_exam.findIndex(
          e => e.sub_exam_id === examId,
        );

        if (examIndex !== -1) {
          // ✅ Update existing mark
          updatedStudents[studentIndex].sub_exam[examIndex].marks = value;
        } else {
          // ✅ Push new sub_exam
          updatedStudents[studentIndex].sub_exam.push({
            sub_exam_id: examId,
            marks: value,
          });
        }
      } else {
        // ✅ First time student
        updatedStudents.push({
          student_id: studentIdNum,
          sub_exam: [{sub_exam_id: examId, marks: value}],
        });
      }

      return {
        ...prev,
        students_data: updatedStudents,
      };
    });
  };

  const renderItem = useCallback(
    ({item, index}) => {
      return (
        <StudentRowOne
          index={index + 1}
          item={item}
          onAttendanceChange={handleMarkChange}
        />
      );
    },
    [
      marks,
      attendance,
      statuses,
      handleMarkChange,
      Class_Exam_Results,
      subExamId,
      subExamType,
    ],
  );
  const handleNew = abc => {
    setLoadingData(true);
    setSelectedClass(abc);
    const target = classes.find(cls => cls.class_name === abc);
    setClassId(target.id);
    getObject(abc, selectedExam);
    setLoadingData(false);
  };
  const handleExamType = abc => {
    setLoadingData(true);
    setSelectedExam(abc);
    getObject(selectedClass, abc);
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
            
            <ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tableHeader}>
                  <View>
                    <View style={{flexDirection: 'row'}}>
                      <Text style={[styles.headerCell, styles.srCell]}>#</Text>
                      <Text style={[styles.headerCell, styles.nameCell]}>
                        Name
                      </Text>
                      <Text style={[styles.headerCell, {right: 30}]}>ID</Text>
                      <Text style={[styles.headerCell, {right: 50}]}>
                        Qaida/Nazra (Y/N)
                      </Text>
                      <Text style={[styles.headerCell, {right: 30}]}>
                        Syllabus (Y/N)
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
                    {result || result?.length > 0 ? (
                      // <FlatList
                      //   data={result}
                      //   renderItem={renderItem}
                      //   keyExtractor={item => item.student_id.toString()}
                      //   contentContainerStyle={styles.listContent}
                      //   initialNumToRender={10} // Render only 10 items initially
                      //   maxToRenderPerBatch={10} // Add 10 items per batch
                      //   windowSize={21} // Render items within 1 screen height
                      //   removeClippedSubviews={true} // Unmount offscreen items (may help)
                      // />
                      <FlatList
                        data={result}
                        renderItem={renderItem}
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
                    ) : (
                      <View style={styles.loaderContainer}>
                        <PencilLoader size={100} color="#5B4DBC" />
                        <Text
                          style={{color: 'black', fontSize: 16, marginTop: 10}}>
                          Loading Table Data
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </ScrollView>
            </ScrollView>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!button || sendLoading}
              style={[
                styles.submitButton,
                (!button || sendLoading) && styles.disabledSubmitButton,
              ]}>
              <Text style={styles.submitButtonText}>
                {sendLoading ? 'Submitting...' : 'Submit Exam'}
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
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
    marginBottom: 8,
    width: 1000,
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
    flex: 1,
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
