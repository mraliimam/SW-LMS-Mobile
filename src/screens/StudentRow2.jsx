import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import {wp, hp} from '../components/UI/responsive';

// Pure helper function - no hooks here
const getStatusFromData = (studentData, examName) => {
  const exam = studentData.sub_exams?.find(e => e.sub_exam_name === examName);
  if (!exam) return {display: 'N/A', color: '#F44336'};

  const mark = exam.marks?.toString().toLowerCase();

  if (['yes', 'y', 'true'].includes(mark)) {
    return {display: 'Yes', color: '#4CAF50'};
  } else if (['no', 'n', 'false'].includes(mark)) {
    return {display: 'No', color: '#F44336'};
  }

  if (!isNaN(Number(mark))) {
    const marks = Number(mark);
    const color = marks >= 15 ? '#4CAF50' : '#F44336';
    return {display: `${marks}`, color};
  }

  return {display: 'N/A', color: '#F44336'};
};

const StatusCell = ({item, examName}) => {
  const [studentData, setStudentData] = useState(item);

  useEffect(() => {
    const updateMarksStatus = async () => {
      try {
        const data = await AsyncStorage.getItem('pendingSubmissions');
        const parsedData = JSON.parse(data);
        const newDataFromLocally = Object.values(parsedData || {});

        const updatedStudentData = {...item};

        newDataFromLocally.flat().forEach(entry => {
          entry.students_data.forEach(localStudent => {
            if (String(localStudent.student_id) === String(item.student_id)) {
              localStudent.sub_exam.forEach(localExam => {
                const matchIndex = updatedStudentData.sub_exams.findIndex(
                  exam => exam.sub_exam_id === localExam.sub_exam_id,
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

  const {display, color} = getStatusFromData(studentData, examName);

  return (
    <View style={styles.center}>
      <View style={[styles.statusCircle, {backgroundColor: color}]}>
        <Text style={styles.statusText}>{display}</Text>
      </View>
    </View>
  );
};

const screenWidth = Dimensions.get('window').width;
const isTablet = screenWidth >= 768;

const StudentRow2 = ({item, index}) => {
  // Truncate long names
  const displayName = item?.student_name || 'Unknown';
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
        <Text style={styles.cellText}>{item.student_id}</Text>
      </View>
      <View style={styles.examColumn}>
        <StatusCell item={item} examName="Qaida/Nazra Status" />
      </View>
      <View style={styles.examColumn}>
        <StatusCell item={item} examName="Syllabus Status" />
      </View>
      <View style={styles.examColumn}>
        <StatusCell item={item} examName="Tajweed" />
      </View>
      <View style={styles.examColumn}>
        <StatusCell item={item} examName="Reading" />
      </View>
      <View style={styles.examColumn}>
        <StatusCell item={item} examName="Syllabus" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
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
    paddingHorizontal: wp(1),
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
    paddingHorizontal: wp(0.5),
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCircle: {
    borderRadius: 75,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: isTablet ? hp(1.3) : hp(1.2),
    textAlign: 'center',
  },
});

export default StudentRow2;
