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
import {getAllClasses, getExamsByClass, getExamsObject} from '../api/Signup';
import StudentRowOne from './StudentRow1';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Popup} from '../components/UI/Popup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {showMessage} from 'react-native-flash-message';
import {wp, hp} from '../components/UI/responsive';

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
    classes?.length > 0 ? classes[0]?.class_name : 'Boys Qaida 1',
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

  const insets = useSafeAreaInsets();
  const [examResult, setExamResult] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [examList, setExamList] = useState(null);
  const [localSubExamId, setLocalSubExamId] = useState(null);
  const [studenID, setStudenID] = useState(null);
  const [examNameForExanId, setexamNameForExanId] = useState(null);
  
  // Responsive design
  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth >= 768;

  console.log(JSON.stringify(submissionData, null, 2), '=========');

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const getExamList = async () => {
      try {
        const storedData = await AsyncStorage.getItem('EXAM_LIST');
        if (storedData !== null) {
          const parsedList = JSON.parse(storedData);
          // Ensure the structure is correct - should be {Class_Exam_Results: []} or array
          if (parsedList) {
            // If it's already in the correct format, use it
            if (parsedList.Class_Exam_Results || Array.isArray(parsedList)) {
              setExamList(parsedList);
            } else {
              // If it's just an array, wrap it
              setExamList({Class_Exam_Results: Array.isArray(parsedList) ? parsedList : []});
            }
          } else {
            setExamList({Class_Exam_Results: []});
          }
        } else {
          console.log('No exam list found in local storage');
          setExamList({Class_Exam_Results: []});
          if (!isConnected) {
            showMessage({
              message: 'Warning',
              description: `Please turn on the internet to store data in cache. After that, you can use the application in offline mode.`,
              type: 'danger',
            });
          }
        }
      } catch (error) {
        console.error('Error fetching exam list:', error);
        setExamList({Class_Exam_Results: []});
      }
    };

    getExamList();
  }, [isConnected]);

  // Handle both object format {Class_Exam_Results: []} and direct array
  const getExamData = () => {
    if (!examList) return [];
    if (Array.isArray(examList)) {
      return examList;
    } else if (examList.Class_Exam_Results) {
      return Array.isArray(examList.Class_Exam_Results) ? examList.Class_Exam_Results : [];
    }
    return [];
  };

  const filteredResults = getExamData().filter(
    item =>
      item.class_name === selectedClass && item.exam_name === selectedExam,
  );

  useEffect(() => {
    if (!examList) return;
    
    // Handle both object format {Class_Exam_Results: []} and direct array
    let examData;
    if (Array.isArray(examList)) {
      examData = examList;
    } else if (examList.Class_Exam_Results) {
      examData = examList.Class_Exam_Results;
    } else {
      return;
    }

    if (Array.isArray(examData) && examData.length > 0) {
      const selectedExamData = examData.find(
        item =>
          item?.class_name === selectedClass &&
          item?.exam_name === selectedExam,
      );
      if (selectedExamData) {
        setSubExamId(selectedExamData?.main_exam_id);
        console.log(
          selectedExamData?.main_exam_id,
          '=selectedExamData==============',
        );
      } else {
        console.log('No matching exam found');
      }
    } else {
      // Empty array or not an array - this is fine, just log for debugging
      if (examData && !Array.isArray(examData)) {
        console.warn('examList.Class_Exam_Results is not an array:', typeof examData);
      }
    }
  }, [examList, selectedClass, selectedExam]);

  // Handle Class_Exam_Results - it might be an object with students property or directly an array
  const students = Array.isArray(Class_Exam_Results) 
    ? Class_Exam_Results 
    : (Class_Exam_Results?.students || []); // Default to empty array if undefined
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
  // console.log(JSON.stringify(result),'result');

  useEffect(() => {
    setSubmissionData(prev => ({
      ...prev,
      exam_id: subExamId,
    }));
  }, [subExamId]);

  //get classes
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

          // console.log('Classes loaded from local storage');
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
      if (!classNewId || !subExamId) return;

      setLoading(true);
      const data = {
        username: 'Teacher',
        class_id: classNewId,
        exam_id: subExamId,
      };

      const response = await getExamsByClass(data);
      // console.log(response, 'response======================:::::::::::');
      // Handle response structure - it might be {Class_Exam_Results: {...}} or just the object
      if (response) {
        if (response.Class_Exam_Results) {
          setClassExamResults(response.Class_Exam_Results);
        } else if (Array.isArray(response)) {
          // If response is directly an array (shouldn't happen but handle it)
          setClassExamResults({students: response});
        } else {
          // If response is the Class_Exam_Results object directly
          setClassExamResults(response);
        }
      } else {
        setClassExamResults({students: []});
      }
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
      const netState = await NetInfo.fetch();
      
      // Try to load from cache first if offline or if API fails
      if (!netState.isConnected) {
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
      
      if (response && response.Exams && response.Exams.sub_exams) {
        setExamResult(response.Exams);
        setSubExam(response.Exams.sub_exams);
        setSubExamId(response.Exams.sub_exams?.[0]?.main_exam_id);
        setSubExamType(response.Exams.sub_exams.category || 'Category');
        setClassNewId(response.Exams.class_id);
        setSubExamNewId(response.Exams.sub_exams);
        
        // Save to cache for offline use
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

        // Update statuses based on exam type
        if (response.Exams.sub_exams.category === 'Numerical') {
          setStatuses([
            `Marks (Out of ${response.Exams.sub_exams.total_marks})`,
          ]);
        } else {
          setStatuses(['Status']);
        }
      } else {
        console.log('No matching exam found');
        // Try to load from cache as fallback
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
            }
          }
        } catch (storageError) {
          console.log('Error loading from storage fallback:', storageError);
        }
      }
    } catch (error) {
      console.log('Error in getting exam object:', error);
      // Try to load from cache as fallback
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
          }
        }
      } catch (storageError) {
        console.log('Error loading from storage in catch:', storageError);
      }
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
  const handleSubmit = async () => {
    setSendLoading(true);

    const netState = await NetInfo.fetch();
    const isOnline = netState.isConnected;

    const examId = submissionData.exam_id;

    if (!examId) {
      ToastAndroid.show('Exam ID missing!', ToastAndroid.SHORT);
      setSendLoading(false);
      return;
    }

    // Validate and clean submission data to ensure sub_exam_id is present
    const cleanedSubmissionData = {
      username: submissionData.username || 'Teacher',
      exam_id: submissionData.exam_id,
      students_data: submissionData.students_data.map(student => ({
        student_id: student.student_id,
        sub_exam: student.sub_exam.map(subExam => ({
          sub_exam_id: subExam.sub_exam_id,
          marks: subExam.marks,
        })).filter(subExam => subExam.sub_exam_id !== undefined && subExam.sub_exam_id !== null),
      })).filter(student => student.sub_exam.length > 0),
    };

    // Validate that all sub_exams have sub_exam_id
    const hasMissingIds = cleanedSubmissionData.students_data.some(student =>
      student.sub_exam.some(subExam => !subExam.sub_exam_id)
    );

    if (hasMissingIds) {
      ToastAndroid.show('Some exam records are missing sub_exam_id. Please try again.', ToastAndroid.LONG);
      setSendLoading(false);
      console.error('Submission data with missing sub_exam_id:', JSON.stringify(cleanedSubmissionData, null, 2));
      return;
    }

    if (cleanedSubmissionData.students_data.length === 0) {
      ToastAndroid.show('No valid exam records to submit!', ToastAndroid.SHORT);
      setSendLoading(false);
      return;
    }

    console.log('Final submission data:', JSON.stringify(cleanedSubmissionData, null, 2));

    if (isOnline) {
      // ✅ Online: Try direct API call
      try {
        const response = await addExamRecord(cleanedSubmissionData);
        setPopupMessage(response.Message);
        setPopupVisible(true);

        // ✅ CLEAR after success
        setSubmissionData({
          username: 'Teacher',
          exam_id: examId,
          students_data: [],
        });
        setAttendance({});
        setButton(false);

        // Optional: Clear from AsyncStorage if any
        const raw = await AsyncStorage.getItem('pendingSubmissions');
        if (raw) {
          const pending = JSON.parse(raw);
          delete pending[examId];
          await AsyncStorage.setItem(
            'pendingSubmissions',
            JSON.stringify(pending),
          );
        }
      } catch (error) {
        console.log('❌ Error submitting online:', error);
        ToastAndroid.show(
          error?.error || 'Submission failed!',
          ToastAndroid.SHORT,
        );
      } finally {
        setSendLoading(false);
      }
    } else {
      // ❌ Offline: Save locally
      try {
        await saveOfflineSubmission(cleanedSubmissionData);
        ToastAndroid.show(
          '📴 Saved offline. Will sync when online.',
          ToastAndroid.SHORT,
        );
        navigation.goBack();
        // ✅ Optional clear form UI after offline save
        setSubmissionData({
          username: 'Teacher',
          exam_id: examId,
          students_data: [],
        });
        setAttendance({});
        setButton(false);
      } catch (err) {
        console.log('❌ Failed to save offline:', err);
        ToastAndroid.show('Failed to save data offline.', ToastAndroid.SHORT);
      } finally {
        setSendLoading(false);
      }
    }
  };

  const saveOfflineSubmission = async newSubmission => {
    console.log(JSON.stringify(newSubmission), 'newSubmission');

    try {
      const raw = await AsyncStorage.getItem('pendingSubmissions');
      const pending = raw ? JSON.parse(raw) : {};

      const examKey = String(newSubmission.exam_id);

      if (!pending[examKey]) {
        pending[examKey] = [];
      }

      // Wrap and push without merging
      pending[examKey].push({
        username: newSubmission.username || 'Teacher',
        exam_id: newSubmission.exam_id,
        students_data: newSubmission.students_data,
      });

      await AsyncStorage.setItem('pendingSubmissions', JSON.stringify(pending));
      console.log('✅ Saved to offline:', JSON.stringify(pending));
    } catch (err) {
      console.log('❌ Error saving offline:', err);
    }
  };

  useEffect(() => {
    if (!examList || !studenID || !examNameForExanId) return;
    
    // Handle both object format {Class_Exam_Results: []} and direct array
    let examData;
    if (Array.isArray(examList)) {
      examData = examList;
    } else if (examList.Class_Exam_Results) {
      examData = examList.Class_Exam_Results;
    } else {
      return;
    }
    
    if (Array.isArray(examData) && examData.length > 0) {
      const selectedExamData = examData.find(
        item =>
          item.class_name === selectedClass && item.exam_name === selectedExam,
      );
      if (selectedExamData) {
        const students = selectedExamData.students || [];
        const student = students.find(
          student => student.student_id === studenID,
        );
        if (student) {
          const subExams = student.sub_exams || [];
          const matchingSubExam = subExams.find(
            sub => sub.sub_exam_name === examNameForExanId,
          );
          if (matchingSubExam) {
            console.log(
              matchingSubExam,
              '-=-=-sub_exam_id==============================',
            );
            setLocalSubExamId(matchingSubExam.sub_exam_id);
          } else {
            console.log('Sub exam not found for:', examNameForExanId);
          }
        } else {
          console.warn(`Student with ID ${studenID} not found`);
        }
      } else {
        console.warn('No matching exam found');
      }
    } else {
      // Empty array or not an array - this is fine, just log for debugging
      if (examData && !Array.isArray(examData)) {
        console.warn('examList.Class_Exam_Results is not an array:', typeof examData);
      }
    }
  }, [studenID, isConnected, examNameForExanId, examList, selectedClass, selectedExam]);

  // console.log(subExamNewId, '========================');

  const handleMarkChange = async (studentId, value, examName, sub_exam_id) => {
    console.log(
      studentId,
      value,
      examName,
      sub_exam_id,
      '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< input values',
    );
    setButton(true);
    const studentIdNum = Number(studentId);
    const exam = subExamNewId?.find(item => item.name === examName);

    let examId;
    
    // Priority 1: Use provided sub_exam_id (from existing student data)
    if (sub_exam_id) {
      examId = sub_exam_id;
      console.log(examId, '-------- resolved examId from sub_exam_id param');
    } 
    // Priority 2: Try to get from subExamNewId (from API response)
    else if (exam?.id) {
      examId = exam.id;
      console.log(examId, '-------- resolved examId from subExamNewId');
    }
    // Priority 3: Try to get from existing student data in Class_Exam_Results
    else if (Class_Exam_Results?.students) {
      const student = Class_Exam_Results.students.find(s => s.student_id === studentIdNum);
      if (student?.sub_exams) {
        const matchingSubExam = student.sub_exams.find(
          sub => sub.sub_exam_name === examName
        );
        if (matchingSubExam?.sub_exam_id) {
          examId = matchingSubExam.sub_exam_id;
          console.log(examId, '-------- resolved examId from student data');
        }
      }
    }
    
    // Priority 4: Try to get from cached exam objects (async)
    if (!examId && !isConnected) {
      try {
        const storedData = await AsyncStorage.getItem('EXAM_OBJECTS');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          const found = parsed.find(
            item => item.class_name === selectedClass && item.exam_name === selectedExam
          );
          if (found?.Exams?.sub_exams) {
            const cachedExam = found.Exams.sub_exams.find(e => e.name === examName);
            if (cachedExam?.id) {
              examId = cachedExam.id;
              console.log(examId, '-------- resolved examId from cache');
            }
          }
        }
      } catch (err) {
        console.log('Error loading from cache:', err);
      }
    }

    // If still no examId, show error
    if (!examId) {
      console.error('Could not resolve examId for:', examName);
      showMessage({
        message: 'Exam ID Not Found',
        description: `Unable to find exam ID for "${examName}". Please ensure you have internet connection or try refreshing.`,
        type: 'danger',
      });
      return;
    }

    console.log(examId, '-------- final resolved examId');

    // Update UI attendance state
    setAttendance(prev => ({
      ...prev,
      [studentIdNum]: {
        ...prev[studentIdNum],
        [examName]: value,
      },
    }));

    // Update submissionData
    setSubmissionData(prev => {
      const updatedStudents = [...prev.students_data];
      const studentIndex = updatedStudents.findIndex(
        s => s.student_id === studentIdNum,
      );

      if (studentIndex !== -1) {
        // Ensure sub_exam array exists
        if (!updatedStudents[studentIndex].sub_exam) {
          updatedStudents[studentIndex].sub_exam = [];
        }
        
        const subExamList = updatedStudents[studentIndex].sub_exam;
        const subExamIndex = subExamList.findIndex(
          se => se.sub_exam_id === examId,
        );

        if (subExamIndex !== -1) {
          // Update existing entry, ensure sub_exam_id is preserved
          subExamList[subExamIndex] = {
            ...subExamList[subExamIndex], // Preserve any other properties
            sub_exam_id: examId, // Ensure sub_exam_id is set
            marks: value,
          };
        } else {
          // Add new entry with sub_exam_id
          subExamList.push({
            sub_exam_id: examId,
            marks: value,
          });
        }
      } else {
        // Add new student with sub_exam array containing sub_exam_id
        updatedStudents.push({
          student_id: studentIdNum,
          sub_exam: [{
            sub_exam_id: examId,
            marks: value,
          }],
        });
      }

      const newData = {
        ...prev,
        students_data: updatedStudents,
      };
      
      // Debug log to verify structure
      console.log('Updated submissionData:', JSON.stringify(newData, null, 2));

      return newData;
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
      <View style={[styles.container1, {padding: isTablet ? wp(3) : wp(4)}]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, {
              width: isTablet ? wp(6) : wp(6),
              height: isTablet ? wp(6) : wp(6),
            }]}>
            <Image
              source={require('../assets/arrow.png')}
              style={{
                width: isTablet ? wp(3) : wp(6),
                height: isTablet ? wp(3) : wp(6),
                tintColor: 'white'
              }}
            />
          </TouchableOpacity>
          <Text style={[styles.label, {
            fontSize: isTablet ? hp(2.5) : hp(2.2),
          }]}>Exams</Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <PencilLoader size={100} color="#5B4DBC" />
          </View>
        ) : (
          <View style={styles.content}>
            <View style={[styles.item, {
              marginBottom: isTablet ? hp(2) : hp(2.5),
            }]}>
              <Text style={[styles.selectionItem, {
                fontSize: isTablet ? hp(2) : hp(1.8),
              }]}>Select Class: </Text>
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

            <ScrollView style={styles.scrollContainer}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={!isTablet}
                contentContainerStyle={styles.horizontalScrollContent}>
                <View style={styles.tableContainer}>
                  <View style={styles.tableHeader}>
                    <View style={styles.headerRow}>
                      <View style={styles.indexColumn}>
                        <Text style={styles.headerCell}>#</Text>
                      </View>
                      <View style={styles.nameColumn}>
                        <Text style={[styles.headerCell, {textAlign: 'left'}]}>
                          Name
                        </Text>
                      </View>
                      <View style={styles.idColumn}>
                        <Text style={styles.headerCell}>ID</Text>
                      </View>
                      <View style={styles.examColumn}>
                        <Text style={styles.headerCell}>
                          Qaida/Nazra{'\n'}(Y/N)
                        </Text>
                      </View>
                      <View style={styles.examColumn}>
                        <Text style={styles.headerCell}>
                          Syllabus{'\n'}(Y/N)
                        </Text>
                      </View>
                      <View style={styles.examColumn}>
                        <Text style={styles.headerCell}>
                          Tajweed{'\n'}(30)
                        </Text>
                      </View>
                      <View style={styles.examColumn}>
                        <Text style={styles.headerCell}>
                          Reading{'\n'}(30)
                        </Text>
                      </View>
                      <View style={styles.examColumn}>
                        <Text style={styles.headerCell}>
                          Syllabus{'\n'}                           (40)
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{height: hp(0.5)}} />
                  {result || result?.length > 0 ? (
                    <FlatList
                      data={
                        isConnected ? result : filteredResults?.[0]?.students
                      }
                      renderItem={renderItem}
                      keyExtractor={item => item.student_id.toString()}
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
                      <Text style={[styles.loadingText, {
                        fontSize: isTablet ? hp(2) : hp(1.6),
                        marginTop: hp(1),
                      }]}>
                        Loading Table Data
                      </Text>
                    </View>
                  )}
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
              <Text style={[styles.submitButtonText, {
                fontSize: isTablet ? hp(2) : hp(1.8),
              }]}>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  backButton: {
    borderRadius: 100,
    backgroundColor: '#5B4DBC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    tintColor: 'white',
  },
  title: {
    flex: 1,
    fontWeight: '500',
    color: 'black',
    textAlign: 'center',
    marginLeft: -40,
  },
  selectionItem: {
    color: '#5B4DBC',
    fontWeight: 'bold',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  horizontalScrollContent: {
    paddingBottom: hp(1),
  },
  tableContainer: {
    minWidth: isTablet ? wp(100) : wp(120),
  },
  loaderContainer: {
    paddingVertical: hp(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'black',
  },
  emptyContainer: {
    paddingVertical: hp(5),
    alignItems: 'center',
  },
  label: {
    marginRight: wp(4),
    fontWeight: '500',
    color: 'black',
    textAlign: 'center',
    marginBottom: hp(1),
    flex: 1,
  },
  tableHeader: {
    paddingVertical: hp(1.5),
    backgroundColor: '#F5F5F5',
    borderRadius: wp(1.5),
    marginBottom: hp(0.5),
    marginTop: hp(1),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: isTablet ? hp(1.6) : hp(1.4),
    textAlign: 'center',
  },
  indexColumn: {
    width: isTablet ? wp(5) : wp(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameColumn: {
    width: isTablet ? wp(22) : wp(28),
    justifyContent: 'center',
    paddingLeft: wp(2),
    paddingRight: wp(1),
  },
  idColumn: {
    width: isTablet ? wp(10) : wp(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  examColumn: {
    width: isTablet ? wp(11) : wp(13),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  listContent: {
    paddingBottom: hp(2.5),
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: hp(1.6),
    paddingVertical: hp(3),
    fontWeight: '500',
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
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Exams;
