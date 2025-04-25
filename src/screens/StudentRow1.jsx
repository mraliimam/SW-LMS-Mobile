import React, {memo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import CustomDropdown from '../components/CustomDropdown';

const StudentRowOne = memo(({item, onAttendanceChange, index}) => {
  const [status, setStatus] = useState({}); // To hold statuses for each exam
  const [marks, setMarks] = useState({}); // To hold marks for each exam
  // Handle status change for any exam
  const handleStatusChange = (examName, selectedStatus) => {
    // console.log(
    //   `Selected status for=========================== ${examName}: ${selectedStatus}`,
    // );
    setStatus(prev => ({...prev, [examName]: selectedStatus}));
    onAttendanceChange(item.student_id, selectedStatus, examName);
  };

  // Handle marks change for any exam
  const handleMarkChange = (examName, value) => {
    const numericValue = parseInt(value, 10);

    // Restrict based on exam type
    if (
      (examName === 'Tajweed' || examName === 'Reading') &&
      numericValue > 30
    ) {
      return;
    }

    if (examName === 'Syllabus' && numericValue > 40) {
      return;
    }

    setMarks(prev => ({...prev, [examName]: value}));
    onAttendanceChange(item.student_id, value, examName);
  };

  // Function to render either dropdown or text input based on exam name
  const renderInput = exam => {
    const {exam_name, marks_obtained, total_marks} = exam;

    // For dropdown inputs (Yes/No)
    if (exam_name === 'Qaida/Nazra Status' || exam_name === 'Syllabus Status') {
      return (
        <View style={{width: 150, left: 30}}>
          <CustomDropdown
            data={[
              {label: 'Yes', value: 'Yes'},
              {label: 'No', value: 'No'},
            ]}
            onValueChange={selected => handleStatusChange(exam_name, selected)}
            value={
              status[exam_name] ||
              (marks_obtained !== 'N/A' ? marks_obtained : '')
            }
            placeholder={
              status[exam_name] ||
              (marks_obtained !== 'N/A' ? marks_obtained : 'Select')
            }
            dropdownStyle={{
              width: 50,
              height: 40,
              top: 6,
              justifyContent: 'center',
            }}
          />
        </View>
      );
    }

    // For marks input
    if (
      exam_name === 'Tajweed' ||
      exam_name === 'Reading' ||
      exam_name === 'Syllabus'
    ) {
      return (
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={
              marks[exam_name] !== undefined
                ? marks[exam_name]
                : marks_obtained !== 'N/A'
                ? marks_obtained
                : ''
            }
            onChangeText={value => handleMarkChange(exam_name, value)}
            maxLength={2}
            placeholder="0"
            placeholderTextColor="#999"
          />
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.SrCell]}>{index}</Text>
      <Text style={[styles.cell, styles.nameCell]}>{item.student_name}</Text>
      <Text style={[styles.cell, {width: 100, textAlign: 'left', right: 10}]}>
        {item.student_id}
      </Text>

      {item?.exams?.map((exam, idx) => (
        <View key={idx} style={styles.examWrapper}>
          {renderInput(exam)}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#5B4DBC',
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  nameCell: {
    flex: 4,
    textAlign: 'left',
  },
  SrCell: {
    flex: 1,
    paddingLeft: 16,
    textAlign: 'left',
  },
  idcell: {
    flex: 2,
    paddingLeft: 16,
    textAlign: 'left',
  },
  dropdownWrapper: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    width: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 35,
    gap: 100,
    top: 5,
  },
  input: {
    width: 50,
    height: 35,
    borderWidth: 1,
    borderColor: '#5B4DBC',
    borderRadius: 5,
    textAlign: 'center',
    paddingVertical: 0,
    fontSize: 16,
    includeFontPadding: false,
    color: '#333',
  },
  maxMarkText: {
    fontSize: 14,
    color: '#666',
    right: 35,
  },
  examWrapper: {
    marginBottom: 10,
  },
});

export default StudentRowOne;
