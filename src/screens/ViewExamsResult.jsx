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
  Dimensions,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import StudentRow2 from './StudentRow2';
import {hp, wp} from '../components/UI/responsive';

const ViewExamsResults = ({navigation}) => {
  const [button, setButton] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [subExam, setSubExam] = useState({});
  const [classId, setClassId] = useState(1);
  const [subExamId, setSubExamId] = useState();
  const [subExamType, setSubExamType] = useState('Category');
  const [userName, setUserName] = useState('Teacher');
  const [Class_Exam_Results, setClassExamResults] = useState([]);
  
  // Responsive design
  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth >= 768;
  const [examsNames, setExamNames] = useState([
    'Internal Exam 1',
    'Internal Exam 2',
    'Final Exam',
  ]);
  const [statuse, setStatuses] = useState(['Results']);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(
    classes?.length > 0 ? classes[0].class_name : 'Boys Qaida 1',
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

  const [examList, setExamList] = useState([]);
  // console.log(examList, 'examList');

  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const filteredResults = examList?.Class_Exam_Results?.filter(
    item =>
      item.class_name === selectedClass && item.exam_name === selectedExam,
  );
  // console.log(filteredResults?.[0]?.students, 'filteredResults');

  useEffect(() => {
    const getExamList = async () => {
      try {
        const storedData = await AsyncStorage.getItem('EXAM_LIST');
        if (storedData !== null) {
          const parsedList = JSON.parse(storedData);
          setExamList(parsedList);
        } else {
          console.log('No exam list found in local storage');
        }
      } catch (error) {
        console.error('Error fetching exam list:', error);
      }
    };

    getExamList();
  }, [isConnected]);

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
        sub_exam_name: exam.name,
        total_marks: exam.total_marks,
        marks: found ? found.marks : 'N/A',
      };
    });

    return {
      student_id: student.student_id,
      student_name: student.student_name,
      sub_exams: subExamResults,
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

      const netState = await NetInfo.fetch();

      if (netState.isConnected) {
        // Online: Fetch from API
        const response = await getAllClasses('Teacher');
        setClasses(response.Classes);

        // Save to AsyncStorage
        await AsyncStorage.setItem(
          'CLASS_LIST',
          JSON.stringify(response.Classes),
        );

        if (response.Classes.length > 0) {
          setSelectedClass(response.Classes?.[0].class_name);
        }

        // console.log('Classes loaded from API');
      } else {
        // Offline: Load from AsyncStorage
        const storedData = await AsyncStorage.getItem('CLASS_LIST');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          setClasses(parsed);

          if (parsed.length > 0) {
            setSelectedClass(parsed[0].class_name);
          }

          console.log('Classes loaded from local storage');
        } else {
          console.log('No local class data found');
        }
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
      if (!classNewId || !subExamId) {
        console.log('getExams: Missing classNewId or subExamId');
        return;
      }

      setLoading(true);
      const netState = await NetInfo.fetch();
      
      if (!netState.isConnected) {
        // Offline: Try to load from AsyncStorage
        try {
          const storedData = await AsyncStorage.getItem('EXAM_LIST');
          if (storedData) {
            const parsed = JSON.parse(storedData);
            const filtered = parsed?.Class_Exam_Results?.filter(
              item => item.class_id === classNewId && item.exam_id === subExamId
            );
            if (filtered && filtered.length > 0) {
              setClassExamResults({students: filtered[0].students || []});
              setLoading(false);
              return;
            }
          }
        } catch (storageError) {
          console.log('Error loading from storage:', storageError);
        }
      }

      const data = {
        username: 'Teacher',
        class_id: classNewId,
        exam_id: subExamId,
      };

      const response = await getExamsByClass(data);
      
      if (response && response.Class_Exam_Results) {
        setClassExamResults(response.Class_Exam_Results);
        // Save to AsyncStorage for offline use
        if (netState.isConnected) {
          try {
            const existingData = await AsyncStorage.getItem('EXAM_LIST');
            const examList = existingData ? JSON.parse(existingData) : {Class_Exam_Results: []};
            examList.Class_Exam_Results.push({
              class_id: classNewId,
              exam_id: subExamId,
              students: response.Class_Exam_Results.students || [],
            });
            await AsyncStorage.setItem('EXAM_LIST', JSON.stringify(examList));
          } catch (storageError) {
            console.log('Error saving to storage:', storageError);
          }
        }
      } else {
        console.log('No exam results found');
        setClassExamResults({students: []});
      }
    } catch (error) {
      console.log('Error in getting exams:', error);
      setClassExamResults({students: []});
    } finally {
      setLoading(false);
    }
  };

  /// getExams ///
  const getObject = async (selectedClass, examName) => {
    // console.log(selectedClass, examName, 'getExams');

    try {
      setLoading(true);
      const netState = await NetInfo.fetch();
      
      if (!netState.isConnected) {
        // Offline: Try to load from AsyncStorage
        try {
          const storedData = await AsyncStorage.getItem('EXAM_OBJECTS');
          if (storedData) {
            const parsed = JSON.parse(storedData);
            const found = parsed.find(
              item => item.class_name === selectedClass && item.exam_name === examName
            );
            if (found && found.Exams) {
              setExamResult(found.Exams);
              if (found.Exams.sub_exams) {
                setSubExam(found.Exams.sub_exams);
                setSubExamId(found.Exams.sub_exams?.[0]?.main_exam_id);
                setSubExamType(found.Exams.sub_exams.category || 'Category');
                setClassNewId(found.Exams.class_id);
                setSubExamNewId(found.Exams.sub_exams);
              }
              setLoading(false);
              return;
            }
          }
        } catch (storageError) {
          console.log('Error loading from storage:', storageError);
        }
      }

      const data = {
        username: 'Teacher',
        class_name: selectedClass,
        exam_name: examName,
      };

      const response = await getExamsObject(data);
      
      if (response && response.Exams) {
        setExamResult(response.Exams);
        if (response.Exams.sub_exams) {
          setSubExam(response.Exams.sub_exams);
          setSubExamId(response.Exams.sub_exams?.[0]?.main_exam_id);
          setSubExamType(response.Exams.sub_exams.category || 'Category');
          setClassNewId(response.Exams.class_id);
          setSubExamNewId(response.Exams.sub_exams);
          
          // Save to AsyncStorage for offline use
          if (netState.isConnected) {
            try {
              const existingData = await AsyncStorage.getItem('EXAM_OBJECTS');
              const examObjects = existingData ? JSON.parse(existingData) : [];
              const existingIndex = examObjects.findIndex(
                item => item.class_name === selectedClass && item.exam_name === examName
              );
              if (existingIndex >= 0) {
                examObjects[existingIndex] = {class_name: selectedClass, exam_name: examName, Exams: response.Exams};
              } else {
                examObjects.push({class_name: selectedClass, exam_name: examName, Exams: response.Exams});
              }
              await AsyncStorage.setItem('EXAM_OBJECTS', JSON.stringify(examObjects));
            } catch (storageError) {
              console.log('Error saving to storage:', storageError);
            }
          }
          
          await AsyncStorage.setItem(
            'subExamNewId',
            JSON.stringify(response.Exams.sub_exams),
          );

          // Update statuses based on exam type
          if (response.Exams.sub_exams.category === 'Numerical') {
            setStatuses([
              `Marks (Out of ${response.Exams.sub_exams.total_marks})`,
            ]);
          } else {
            setStatuses(['Status']);
          }
        }
      } else {
        console.log('No exam object found or error:', response?.error);
        setExamResult({});
        setSubExam({});
      }
    } catch (error) {
      console.log('Error in getting exam object:', error);
      setExamResult({});
      setSubExam({});
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

  // const handleSubmit = async () => {
  //   setSendLoading(true);
  //   const netState = await NetInfo.fetch();

  //   if (!netState.isConnected) {
  //     // Save locally if offline
  //     try {
  //       const pending =
  //         JSON.parse(await AsyncStorage.getItem('pendingSubmissions')) || [];
  //       const pendingSubmission = {
  //         ...submissionData,
  //         data: student_id, // ✅ Add this line
  //       };

  //       await AsyncStorage.setItem(
  //         'pendingSubmissions',
  //         JSON.stringify([...pending, pendingSubmission]),
  //       );
  //       ToastAndroid.show('Saved locally (offline)', ToastAndroid.SHORT);
  //       navigation.navigate('Home');
  //     } catch (err) {
  //       console.log('Error saving offline:', err);
  //     } finally {
  //       setSendLoading(false);
  //     }
  //     return;
  //   }

  //   // Normal online submission
  //   try {
  //     const response = await addExamRecord(submissionData);
  //     setPopupMessage(response.Message);
  //     setPopupVisible(true);
  //   } catch (error) {
  //     console.log('Error submitting attendance:', error);
  //     ToastAndroid.show(error.error, ToastAndroid.SHORT);
  //   } finally {
  //     setSendLoading(false);
  //   }
  // };

  const renderItem = useCallback(
    ({item, index}) => {
      return <StudentRow2 index={index + 1} item={item} />;
    },
    [marks, attendance, statuses, Class_Exam_Results, subExamId, subExamType],
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
              style={{width: 20, height: 20, tintColor: 'white'}}
            />
          </TouchableOpacity>
          <Text style={styles.label}>View Exams</Text>
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
                  data={classes?.map(cls => ({
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

            <ScrollView style={styles.scrollContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={!isTablet}>
                <View style={styles.tableContainer}>
                  <View style={styles.tableHeader}>
                    <View style={styles.headerRow}>
                      <View style={[styles.headerCellContainer, styles.indexColumn]}>
                        <Text style={styles.headerText}>#</Text>
                      </View>
                      <View style={[styles.headerCellContainer, styles.nameColumn]}>
                        <Text style={[styles.headerText, {textAlign: 'left'}]}>Name</Text>
                      </View>
                      <View style={[styles.headerCellContainer, styles.idColumn]}>
                        <Text style={styles.headerText}>ID</Text>
                      </View>
                      <View style={[styles.headerCellContainer, styles.examColumn]}>
                        <Text style={styles.headerText}>Qaida/Nazra{'\n'}(Y/N)</Text>
                      </View>
                      <View style={[styles.headerCellContainer, styles.examColumn]}>
                        <Text style={styles.headerText}>Syllabus{'\n'}(Y/N)</Text>
                      </View>
                      <View style={[styles.headerCellContainer, styles.examColumn]}>
                        <Text style={styles.headerText}>Tajweed{'\n'}(30)</Text>
                      </View>
                      <View style={[styles.headerCellContainer, styles.examColumn]}>
                        <Text style={styles.headerText}>Reading{'\n'}(30)</Text>
                      </View>
                      <View style={[styles.headerCellContainer, styles.examColumn]}>
                        <Text style={styles.headerText}>Syllabus{'\n'}(40)</Text>
                      </View>
                    </View>
                  </View>
                  <View>
                    {result || result?.length > 0 ? (
                      <FlatList
                        data={
                          isConnected ? result : filteredResults?.[0]?.students
                        }
                        renderItem={renderItem}
                        keyExtractor={item => item?.student_id}
                        ListEmptyComponent={
                          <View style={styles.emptyContainer}>
                            <Text style={styles.noDataText}>
                              {result?.length > 0
                                ? 'No exam results available for this selection.'
                                : 'No students found in this class.'}
                            </Text>
                          </View>
                        }
                        scrollEnabled={false}
                      />
                    ) : (
                      <View style={styles.loaderContainer}>
                        <PencilLoader size={isTablet ? 120 : 100} color="#5B4DBC" />
                        <Text style={styles.loadingText}>
                          Loading Table Data
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </ScrollView>
            </ScrollView>

            {/* <TouchableOpacity
              onPress={handleSubmit}
              disabled={!button || sendLoading}
              style={[
                styles.submitButton,
                (!button || sendLoading) && styles.disabledSubmitButton,
              ]}>
              <Text style={styles.submitButtonText}>
                {sendLoading ? 'Submitting...' : 'Submit Exam'}
              </Text>
            </TouchableOpacity> */}
            <View style={{height: hp(2)}} />
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

const screenWidth = Dimensions.get('window').width;
const isTablet = screenWidth >= 768;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5B4DBC',
  },
  container1: {
    flex: 1,
    backgroundColor: 'white',
    padding: wp(4),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
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
    fontSize: hp(2.5),
    fontWeight: '500',
    color: 'black',
    textAlign: 'center',
    marginLeft: -40,
  },
  selectionItem: {
    fontSize: hp(1.8),
    color: '#5B4DBC',
    fontWeight: 'bold',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  tableContainer: {
    minWidth: wp(100),
  },
  tableHeader: {
    backgroundColor: '#F5F5F5',
    borderRadius: wp(1.5),
    paddingVertical: hp(1.5),
    marginBottom: hp(0.5),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2),
  },
  headerCellContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(0.5),
  },
  headerText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: isTablet ? hp(1.6) : hp(1.4),
    textAlign: 'center',
  },
  indexColumn: {
    width: isTablet ? wp(5) : wp(8),
  },
  nameColumn: {
    width: isTablet ? wp(22) : wp(28),
    paddingHorizontal: wp(1),
  },
  idColumn: {
    width: isTablet ? wp(10) : wp(12),
  },
  examColumn: {
    width: isTablet ? wp(11) : wp(13),
    paddingHorizontal: wp(0.5),
  },
  loaderContainer: {
    paddingVertical: hp(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'black',
    fontSize: hp(1.8),
    marginTop: hp(1),
  },
  emptyContainer: {
    paddingVertical: hp(5),
    alignItems: 'center',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: hp(1.6),
    fontWeight: '500',
  },
  label: {
    marginRight: wp(4),
    fontSize: hp(2.5),
    fontWeight: '500',
    color: 'black',
    textAlign: 'center',
    marginBottom: hp(1),
    flex: 1,
  },
  listContent: {
    paddingBottom: hp(2),
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.5),
    borderRadius: wp(5),
    borderWidth: 1,
    backgroundColor: '#5B4DBC',
    marginTop: hp(2),
  },
  disabledSubmitButton: {
    backgroundColor: '#A9A9A9',
    opacity: 0.7,
  },
});

export default ViewExamsResults;
