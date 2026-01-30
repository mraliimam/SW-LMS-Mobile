import React, {memo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {heightPercentageToDP as hp, widthPercentageToDP as wp} from 'react-native-responsive-screen';

const getStatusColor = status => {
  switch (status) {
    case 'P':
      return '#4CAF50';
    case 'A':
      return '#F44336';
    case 'H':
      return '#FFC107';
    case 'L':
      return '#FF9800';
    case 'E':
      return '#2196F3';
    default:
      return '#9E9E9E';
  }
};

const AttendenceRow = memo(({item, attendance, index}) => {
  const studentAttendance = attendance[item.student_id];
  
  const bgColor = getStatusColor(studentAttendance);

  return (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.SrCell]}>{index}</Text>
      <Text style={[styles.cell, styles.nameCell]}>
        {item.name}
      </Text>
      <Text style={[styles.cell, styles.idcell]}>{item.student_id}</Text>
      <View style={[styles.statusBox, {backgroundColor: bgColor}]}>
        <Text style={styles.radioText}>{studentAttendance || 'N/A'}</Text>
      </View>
    </View>
  );
});

export default AttendenceRow;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#5B4DBC',
    paddingVertical: hp('1.5%'),
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    textAlign: 'center',
    color: '#333',
    fontSize: hp('1.7%'),
  },
  nameCell: {
    flex: 2,
    textAlign: 'left',
    width: wp('45%'),
    fontSize: hp('1.7%'),
  },
  SrCell: {
    flex: 1,
    paddingLeft: wp('4%'),
    textAlign: 'left',
    fontSize: hp('1.7%'),
  },
  idcell: {
    flex: 2,
    paddingLeft: wp('2%'),
    textAlign: 'center',
    fontSize: hp('1.7%'),
  },
  statusBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp('0.5%'),
    paddingHorizontal: wp('2%'),
    borderRadius: wp('10%'),
  },
  radioText: {
    color: '#fff',
    fontSize: hp('1.4%'),
    fontWeight: 'bold',
  },
});
