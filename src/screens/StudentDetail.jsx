import React, { useCallback, useState, useEffect } from 'react'
import { View, Text, StyleSheet,Image, TouchableOpacity, Animated, Platform } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import { SharedElement } from 'react-navigation-shared-element'
import Icon from 'react-native-vector-icons/Ionicons'
import AttendanceChart from '../components/AttendanceChart'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getStudentAttendance } from '../api/Signup'
import { Button } from 'react-native'
import { DatePickerModal } from 'react-native-paper-dates'
import { Provider as PaperProvider } from 'react-native-paper'
import { registerTranslation } from 'react-native-paper-dates'
import PencilLoader from '../components/UI/PencilLoader'

registerTranslation('en', {
  save: 'Save',
  selectSingle: 'Select date',
  selectMultiple: 'Select dates',
  selectRange: 'Select period',
  notAccordingToDateFormat: (inputFormat) =>
    `Date format must be ${inputFormat}`,
  mustBeHigherThan: (date) => `Must be later then ${date}`,
  mustBeLowerThan: (date) => `Must be earlier then ${date}`,
  mustBeBetween: (startDate, endDate) =>
    `Must be between ${startDate} - ${endDate}`,
  dateIsDisabled: 'Day is not allowed',
  previous: 'Previous',
  next: 'Next',
  typeInDate: 'Type in date',
  pickDateFromCalendar: 'Pick date from calendar',
  close: 'Close',
})
const StudentDetail = () => {
  const route = useRoute()
  const navigation = useNavigation()
  const { student } = route.params
  const scrollY = new Animated.Value(100)

  const [attendanceData, setAttendanceData] = useState([])
  const [dateRange, setDateRange] = useState('30') // '7', '30', or 'custom'
  const [visible, setVisible] = useState(false)
  const [range, setRange] = useState({ 
    startDate: undefined, 
    endDate: undefined 
  })
  const [loading, setLoading] = useState(true)

  const onDismiss = useCallback(() => {
    setVisible(false)
  }, [setVisible])

  const onConfirm = useCallback(
    ({ startDate, endDate }) => {
      setVisible(false)
      setRange({ startDate, endDate })
      if (startDate && endDate) {
        fetchAttendanceData(0, startDate, endDate)
      }
    },
    [setVisible]
  )

  const fetchAttendanceData = async (days, customStart = null, customEnd = null) => {
    let fromDate, toDate

    if (customStart && customEnd) {
      fromDate = customStart
      toDate = customEnd
    } else {
      toDate = new Date()
      fromDate = new Date()
      fromDate.setDate(toDate.getDate() - days)
    }

    const data = {
      studentID: student.student_id,
      dateFrom: fromDate.toISOString().split('T')[0],
      dateTo: toDate.toISOString().split('T')[0]
    }

    try {
      console.log('data:>',data)
      const response = await getStudentAttendance(data)
      // console.log('imp response :>',response)
      if (response.Student_Attendance) {
        // Updated status mapping to include H and E
        const formattedData = response.Student_Attendance.map(item => ({
          date: item.date_added,
          status: item.status === 'P' ? 'present' : 
                 item.status === 'A' ? 'absent' : 
                 item.status === 'L' ? 'late' : 
                 item.status === 'X' ? 'holiday' :
                 item.status === 'H' ? 'holiday' :
                 item.status === 'E' ? 'excused' : 'absent'
        }))
        setAttendanceData(formattedData)
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (dateRange === 'custom' && range.startDate && range.endDate) {
      fetchAttendanceData(0, range.startDate, range.endDate)
    } else {
      fetchAttendanceData(dateRange === '7' ? 7 : 30)
    }
  }, [dateRange, student.student_id, range])

  const renderExamResults = useCallback(() => {
    if (!student.exams_result || student.exams_result.length === 0) {
      return <Text style={styles.noExams}>No exam results available</Text>
    }
    return student.exams_result.map((exam, index) => (
      <View key={index} style={styles.examContainer}>
        <Text style={styles.examName}>{exam.main_exam_name}</Text>
        {exam.sub_exams.map((subExam, subIndex) => (
          <View key={subIndex} style={styles.subExamContainer}>
            <Text style={styles.subExamName}>{subExam.sub_exam_name}</Text>
            <Text style={styles.subExamDetails}>
              Date: {subExam.date_added} | Marks: {subExam.marks}
            </Text>
          </View>
        ))}
      </View>
    ))
  }, [student.exams_result])

  const renderDateFilters = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity 
        style={[styles.filterButton, dateRange === '7' && styles.activeFilter]}
        onPress={() => setDateRange('7')}>
        <Text style={[
          styles.filterText, 
          dateRange === '7' && styles.activeFilterText
        ]}>7 Days</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.filterButton, dateRange === '30' && styles.activeFilter]}
        onPress={() => setDateRange('30')}>
        <Text style={[
          styles.filterText, 
          dateRange === '30' && styles.activeFilterText
        ]}>30 Days</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.filterButton, dateRange === 'custom' && styles.activeFilter]}
        onPress={() => {
          setDateRange('custom')
          setVisible(true)
        }}>
        <Text style={[
          styles.filterText, 
          dateRange === 'custom' && styles.activeFilterText
        ]}>Custom</Text>
      </TouchableOpacity>
      <DatePickerModal
        locale="en"
        mode="range"
        visible={visible}
        onDismiss={onDismiss}
        startDate={range.startDate}
        endDate={range.endDate}
        onConfirm={onConfirm}
        validRange={{
          startDate: new Date(2022, 1, 1),  
          endDate: new Date(),  
        }}
      />
    </View>
  )

  return (
    <PaperProvider>
      <Animated.ScrollView
      style={styles.scrollView}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
      scrollEventThrottle={100}
    >
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          {/* <Icon name="arrow-back" size={24} color="#5B4DBC" /> */}
          <Image source={require('../assets/arrow.png')} style={{ width: 24, height: 24 , tintColor: '#5B4DBC'}} />
        </TouchableOpacity>
        
       
          <View style={styles.header}>
            <SharedElement id={`student.${student.student_id}.avatar`}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>{student.name[0]}</Text>
              </View>
            </SharedElement>
            <SharedElement id={`student.${student.student_id}.name`}>
              <Text style={styles.studentName}>{student.name}</Text>
            </SharedElement>
            <SharedElement id={`student.${student.student_id}.id`}>
              <Text style={styles.studentId}>ID: {student.student_id}</Text>
            </SharedElement>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              {/* <Icon name="person" size={20} color="#666" style={styles.infoIcon} /> */}
              <Image source={require('../assets/usericon.png')} style={{ width: 19, height:19 , tintColor: '#666',marginRight:10}} />
              <Text style={styles.infoLabel}>Father's Name:</Text>
              <Text style={styles.infoValue}>{student.father_name}</Text>
            </View>
            <View style={styles.infoRow}>
              {/* <Icon name="calendar" size={20} color="#666" style={styles.infoIcon} /> */}
              <Image source={require('../assets/calendar.png')} style={{ width: 19, height:19 , tintColor: '#666',marginRight:10}} />
              <Text style={styles.infoLabel}>Date of Birth:</Text>
              <Text style={styles.infoValue}>{student.dob}</Text>
            </View>
            <View style={styles.infoRow}>
              <Image source={require('../assets/graduate-hat.png')} style={{ width: 27, height:27 , tintColor: '#666',marginRight:10,marginLeft:-5}} />
              <Text style={styles.infoLabel}>Current Class:</Text>
              <Text style={styles.infoValue}>{student.current_class}</Text>
            </View>
            <View style={styles.infoRow}>
              <Image source={require('../assets/phone.png')} style={{ width: 19, height:19 , tintColor: '#666',marginRight:10}} />
              <Text style={styles.infoLabel}>Phone Number:</Text>
              <Text style={styles.infoValue}>{student.phone_number}</Text>
            </View>
          </View>
     
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Exam Results</Text>
            {renderExamResults()}
          </View>

          {student.passed_classes && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Passed Classes</Text>
              <Text style={styles.passedClasses}>{student.passed_classes}</Text>
            </View>
          )}
         
          <View style={styles.chartContainer}>
            {renderDateFilters()}
            {loading ? (
                         <View style={styles.centerContainer}>
                         <PencilLoader size={200} color="#5B4DBC" />
                       </View>   ) : (

              <AttendanceChart attendanceData={attendanceData} />
            )}
          </View>
      </SafeAreaView>  
        </Animated.ScrollView>
    </PaperProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5B4DBC',
  },
  centerContainer: {
    // flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    color: "#5B4DBC"
  },
  scrollView: {
    flex: 1,
  },
  chartContainer: {
    margin: 15,
    borderRadius: 20,
  },
  backButton: {
    left :10,
    width: 40,
    height: 40,
    backgroundColor: "white",
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#5B4DBC',
    // padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#5B4DBC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth:1,
    borderColor:'white',
    borderRadius:100,
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',

  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  studentId: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    width: 120,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    margin: 15,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  examContainer: {
    marginBottom: 15,
  },
  examName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  subExamContainer: {
    marginLeft: 15,
    marginBottom: 5,
  },
  subExamName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  subExamDetails: {
    fontSize: 14,
    color: '#666',
  },
  noExams: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  passedClasses: {
    fontSize: 16,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#5B4DBC',
    borderColor: 'white',
    borderWidth: 2,

    
  },
  activeFilter: {
    // borderColor: 'black',
    // borderWidth: 2,
    backgroundColor: 'white',
  },
  filterText: {
    color: 'white',
    fontWeight: '500',
  },
  customDateContainer: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  dateText: {
    color: '#333',
    fontSize: 12,
  },
  activeFilterText: {
    color: 'black',
  },
})

export default StudentDetail

