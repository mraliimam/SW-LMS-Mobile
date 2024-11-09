import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  FlatList,
  ImageBackground,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
const { width, height } = Dimensions.get('window');
export default function Attendance() {
  const [selectedClass, setSelectedClass] = useState('')
  const [attendance, setAttendance] = useState({
    Ahmad: '',
    Ashir: '',
    ali: '',
    umer: '',
    saad: '',
    abdullah: '',
    gale: '',
    sandy: '',
    sun: '',
    moon: '',
    shoes: '',
    hen: '',
    mom: '',
  })

  const classes = ['Biology', 'Physics', 'Chemistry', 'Mathematics']
  const statuses = ['P', 'A', 'H', 'L', 'E']

  const handleAttendanceChange = (student, status) => {
    setAttendance(prev => ({
      ...prev,
      [student]: status,
    }))
  }

  const handleSubmit = () => {
    console.log('Attendance submitted:', attendance)
  }

  const renderItem = ({ item: student }) => (
    <View style={styles.row}>
      <Text style={[styles.cell, styles.nameCell]}>{student}</Text>
      {statuses.map(status => (
        <TouchableOpacity
          key={status}
          style={styles.radioContainer}
          onPress={() => handleAttendanceChange(student, status)}>
          <View
            style={[
              styles.radio,
              attendance[student] === status && styles.radioSelected,
            ]}
          />
        </TouchableOpacity>
      ))}
    </View>
  )

  return (
    <>
     

      <StatusBar barStyle="light-content" backgroundColor="#5B4DBC" />
      <SafeAreaView style={styles.container}>
        <View style={styles.selectContainer}>
          <Text style={styles.label}>Select Class</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedClass}
              onValueChange={setSelectedClass}
              mode="dropdown"
              style={styles.picker}
            >
              <Picker.Item label="Select Class" value="" />
              {classes.map(className => (
                <Picker.Item key={className} label={className} value={className} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerCell, styles.nameCell]}>Student Name</Text>
            {statuses.map(status => (
              <Text key={status} style={styles.headerCell}>
                {status}
              </Text>
            ))}
          </View>

          <FlatList
            data={Object.keys(attendance)}
            renderItem={renderItem}
            keyExtractor={item => item}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Attendance</Text>
        </TouchableOpacity>
      </SafeAreaView>
      {/* </ImageBackground> */}

    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  selectContainer: {
 
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: 'black',
  },
  pickerContainer: {
    borderRadius: 8,
    borderWidth: 1,
    justifyContent:"center",
    alignItems:"center",
    borderColor: '#5B4DBC',
    backgroundColor: '#fff',
    borderRadius: 30,
    // overflow: 'hidden',
  },
  backgroundImage: {
    width: width,
    padding: 16,
    height: height,
    flex: 1,
  },
  picker: {
    height: 50,
    width: '100%',
    color:'black'
  },
  tableContainer: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#5B4DBC',
    backgroundColor: '#fff',
    marginBottom: 24,
    flex: 1,
  },
  headerRow: {
    // borderRadius:100,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#5B4DBC',
    paddingVertical: 12,
  },
  row: {
    borderRadius:20,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#5B4DBC',
    paddingVertical: 12,
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333',
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
  submitButton: {
    backgroundColor: '#5B4DBC',
    padding: 16,
    borderRadius: 28,
    alignItems: 'center',
    marginTop: 'auto',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})