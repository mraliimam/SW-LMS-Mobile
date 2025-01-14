import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const StudentRow = memo(({ item, attendance, statuses, onAttendanceChange, attendanceTaken }) => {
  const studentAttendance = attendance[item.student_id];

  return (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.nameCell]}>{item.name}</Text>
      {statuses.map(status => (
        <TouchableOpacity
          key={status}
          style={[
            styles.radioContainer,
            attendanceTaken && styles.radioContainerTaken
          ]}
          onPress={() => onAttendanceChange(item.student_id, status)}
        >
          <View
            style={[
              styles.radio,
              studentAttendance === (status === 'L/E' ? 'E' : status) ? styles.radioSelected : null,
            ]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#5B4DBC',
    paddingVertical: 12,
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    color: '#333',
  },
  nameCell: {
    flex: 2,
    paddingLeft: 16,
    textAlign: 'left',
  },
  radioContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#5B4DBC',
  },
  radioSelected: {
    backgroundColor: '#5B4DBC',
  },
  leStatus: {
    position: 'absolute',
    fontSize: 10,
    color: '#fff',
  },
  radioContainerTaken: {
    opacity: 0.8,
  },
});

export default StudentRow;

