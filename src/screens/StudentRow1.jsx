import React, { memo } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

const StudentRowOne = memo(({ item, statuses, onAttendanceChange, currentValue, index }) => {
    const maxMark = statuses[0] ? parseInt(statuses[0]) : 30;
  
    const handleMarkChange = (text) => {
      if (text === '' || /^\d+$/.test(text)) {
        const num = text === '' ? 0 : parseInt(text);
        if (num <= maxMark) {
          onAttendanceChange(item.student_id, text);
        }
      }
    };
  
    return (
      <View style={styles.row}>
        <Text style={[styles.cell, styles.SrCell]}>{index}</Text>
        <Text style={[styles.cell, styles.nameCell]}>{item.name}</Text>
        <Text style={[styles.cell, styles.idcell]}>{item.student_id}</Text>
        
        {statuses.length === 2 ? (
          // Radio buttons for Yes/No
          statuses.map(status => (
            <TouchableOpacity
              key={status}
              style={styles.radioContainer}
              onPress={() => onAttendanceChange(item.student_id, status)}>
              <View style={[
                styles.radio,
                currentValue === status && styles.radioSelected
              ]}>
                {/* {currentValue === status && <View style={styles.radioInner} />} */}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          // Numeric input
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={currentValue?.toString()}
              onChangeText={handleMarkChange}
              maxLength={2}
              placeholder="0"
            />
            <Text style={styles.maxMarkText}>/ {maxMark}</Text>
          </View>
        )}
      </View>
    );
  });

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#5B4DBC',
    paddingVertical: 12,
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    backgroundColor: '#5B4DBC',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  inputWrapper: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
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
  },
  maxMarkText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
});

export default StudentRowOne;