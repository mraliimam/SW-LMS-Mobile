import React, {memo, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import CustomDropdown from '../components/CustomDropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NumberModalPicker from '../components/NumberModalPicker';
import {wp, hp} from '../components/UI/responsive';

const StudentRowOne = memo(({item, onAttendanceChange, index}) => {
  const [studentData, setStudentData] = useState(item);
  const [visibleModal, setVisibleModal] = useState({});
  // console.log(studentData, 'studentData');
  useEffect(() => {
    const updateMarksStatus = async () => {
      try {
        const data = await AsyncStorage.getItem('pendingSubmissions');
        const parsedData = JSON.parse(data);
        const newDataFromLocally = Object.values(parsedData || {});
        // console.log(JSON.stringify(newDataFromLocally), 'newDataFromLocally');

        const updatedStudentData = {...item};

        newDataFromLocally.flat().forEach(entry => {
          entry.students_data.forEach(localStudent => {
            if (String(localStudent.student_id) === String(item.student_id)) {
              localStudent.sub_exam.forEach(localExam => {
                const matchIndex = updatedStudentData.sub_exams.findIndex(
                  exam => exam.sub_exam_id === localExam.sub_exam_id, // ✅ match by ID instead
                );
                if (matchIndex !== -1) {
                  updatedStudentData.sub_exams[matchIndex].marks =
                    localExam.marks;
                }
              });
            }
          });
        });

        setStudentData(updatedStudentData);
      } catch (error) {
        console.error('❌ Error updating marks status:', error);
      }
    };

    updateMarksStatus();
  }, [item]);

  const [, forceUpdate] = useState(false);

  const statusRef = useRef({});
  const marksRef = useRef({});
  // To hold marks for each exam
  // Handle status change for any exam
  // const handleStatusChange = (examName, selectedStatus) => {
  //   // console.log(
  //   //   `Selected status for=========================== ${examName}: ${selectedStatus}`,
  //   // );
  //   setStatus(prev => ({...prev, [examName]: selectedStatus}));
  //   onAttendanceChange(item.student_id, selectedStatus, examName);
  // };
  const handleStatusChange = (examName, selectedStatus, sub_exam_id) => {
    statusRef.current[examName] = selectedStatus;
    forceUpdate(prev => !prev); // force re-render
    onAttendanceChange(
      studentData.student_id,
      selectedStatus,
      examName,
      sub_exam_id,
    );
  };

  // Handle marks change for any exam
  const handleMarkChange = (examName, value, sub_exam_id) => {
    const numericValue = parseInt(value, 10);

    if (
      (examName === 'Tajweed' || examName === 'Reading') &&
      numericValue > 30
    ) {
      return;
    }

    if (examName === 'Syllabus' && numericValue > 40) {
      return;
    }

    marksRef.current[examName] = value;
    forceUpdate(prev => !prev);
    onAttendanceChange(studentData.student_id, value, examName, sub_exam_id);
  };

  // Function to render either dropdown or text input based on exam name
  const renderInput = exam => {
    const {sub_exam_name, marks, sub_exam_id} = exam;

    if (
      sub_exam_name === 'Qaida/Nazra Status' ||
      sub_exam_name === 'Syllabus Status'
    ) {
      const screenWidth = Dimensions.get('window').width;
      const isTablet = screenWidth >= 768;
      
      return (
        <View style={styles.dropdownContainer}>
          <CustomDropdown
            data={[
              {label: 'Yes', value: 'Yes'},
              {label: 'No', value: 'No'},
            ]}
            onValueChange={selected =>
              handleStatusChange(sub_exam_name, selected, sub_exam_id)
            }
            value={
              statusRef.current[sub_exam_name] || (marks !== 'N/A' ? marks : '')
            }
            placeholder={
              statusRef.current[sub_exam_name] ||
              (marks !== 'N/A' ? marks : 'Select')
            }
            dropdownStyle={{
              width: isTablet ? wp(10) : wp(12),
              height: isTablet ? hp(4) : hp(5),
              justifyContent: 'center',
              alignItems: 'center',
              padding: 0,
              paddingHorizontal: wp(0.3),
              paddingVertical: hp(0.5),
            }}
          />
        </View>
      );
    }

    if (
      sub_exam_name === 'Tajweed' ||
      sub_exam_name === 'Reading' ||
      sub_exam_name === 'Syllabus'
    ) {
      const screenWidth = Dimensions.get('window').width;
      const isTablet = screenWidth >= 768;
      
      return (
        <View style={styles.inputWrapper}>
          <TouchableOpacity
            style={[styles.modalInput, {
              width: isTablet ? wp(10) : wp(12),
              height: isTablet ? hp(4) : hp(5),
            }]}
            onPress={() =>
              setVisibleModal(prev => ({...prev, [sub_exam_name]: true}))
            }>
            <Text style={[styles.modalInputText, {
              fontSize: isTablet ? hp(1.5) : hp(1.4),
            }]}>
              {marksRef.current[sub_exam_name] !== undefined
                ? marksRef.current[sub_exam_name]
                : marks !== 'N/A'
                ? String(marks)
                : ''}
            </Text>
          </TouchableOpacity>

          <NumberModalPicker
            visible={!!visibleModal[sub_exam_name]}
            onClose={() =>
              setVisibleModal(prev => ({...prev, [sub_exam_name]: false}))
            }
            onSelect={value =>
              handleMarkChange(sub_exam_name, value, sub_exam_id)
            }
            max={sub_exam_name === 'Syllabus' ? 40 : 30}
          />
        </View>
      );
    }

    return null;
  };

  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth >= 768;
  
  // Truncate long names
  const displayName = studentData.student_name || 'Unknown';
  const maxLength = isTablet ? 25 : 18;
  const truncatedName = displayName.length > maxLength 
    ? displayName.substring(0, maxLength - 3) + '...' 
    : displayName;

  return (
    <View style={styles.row}>
      <View style={styles.indexColumn}>
        <Text style={styles.cellText}>{index}</Text>
      </View>
      <View style={styles.nameColumn}>
        <Text 
          style={[styles.cellText, {textAlign: 'left'}]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {truncatedName}
        </Text>
      </View>
      <View style={styles.idColumn}>
        <Text style={styles.cellText}>{studentData.student_id}</Text>
      </View>

      {[
        'Qaida/Nazra Status',
        'Syllabus Status',
        'Tajweed',
        'Reading',
        'Syllabus',
      ].map((examName, idx) => {
        const foundExam = studentData.sub_exams?.find(
          e => e.sub_exam_name === examName,
        );
        const exam = foundExam || {sub_exam_name: examName, marks: 'N/A'};

        return (
          <View key={idx} style={styles.examColumn}>
            {renderInput(exam)}
          </View>
        );
      })}
    </View>
  );
});

const screenWidth = Dimensions.get('window').width;
const isTablet = screenWidth >= 768;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
    alignItems: 'center',
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
    minHeight: hp(6),
  },
  cellText: {
    color: '#000',
    fontSize: isTablet ? hp(1.5) : hp(1.4),
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
  dropdownContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  inputWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#5B4DBC',
    borderRadius: wp(1.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInputText: {
    color: '#333',
    fontWeight: '500',
  },
});

export default StudentRowOne;
