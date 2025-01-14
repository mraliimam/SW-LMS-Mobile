import React, { useEffect, useState, useCallback, memo } from 'react'
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Dimensions,
  RefreshControl
} from 'react-native'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { SharedElement } from 'react-navigation-shared-element'
import { getStudents } from '../api/Signup'
import AsyncStorage from '@react-native-async-storage/async-storage'
import PencilLoader from '../components/UI/PencilLoader'
import Icon from 'react-native-vector-icons/Ionicons'
import { Picker } from '@react-native-picker/picker'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const CACHE_KEY = 'STUDENTS_DATA'
const CACHE_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

const StudentItem = memo(({ item, onPress }) => (
  <TouchableOpacity
    style={styles.studentItem}
    onPress={() => onPress(item)}
  >
    <SharedElement id={`student.${item.student_id}.avatar`}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>{item.name[0]}</Text>
      </View>
    </SharedElement>
    <View style={styles.studentInfo}>
      <SharedElement id={`student.${item.student_id}.name`}>
        <Text style={styles.studentName}>{item.name}</Text>
      </SharedElement>
      <SharedElement id={`student.${item.student_id}.id`}>
        <Text style={styles.studentId}>ID: {item.student_id}</Text>
      </SharedElement>
    </View>
  </TouchableOpacity>
))

const Students = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)
  const navigation = useNavigation()
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchStudents = useCallback(async (forceRefresh = false) => {
    setIsLoading(true)
    setError(null)
    try {
      let studentsData = null
      if (!forceRefresh) {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY)
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData)
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            studentsData = data
          }
        }
      }

      if (!studentsData) {
        const storedUsername = await AsyncStorage.getItem('username')
        const response = await getStudents(storedUsername || '')
        if (response && response.Records) {
          studentsData = response.Records
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
            data: studentsData,
            timestamp: Date.now()
          }))
        } else {
          throw new Error('Invalid response format')
        }
      }

      setStudents(studentsData)
      const uniqueClasses = [...new Set(studentsData.map(student => student.current_class))]
      setClasses(uniqueClasses)
      setSelectedClass(uniqueClasses[0] || '')
      setFilteredStudents(studentsData.filter(student => student.current_class === uniqueClasses[0]))
    } catch (error) {
      console.error('Error fetching students:', error)
      setError('Failed to load students. Please try again.')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchStudents()
    }, [fetchStudents])
  )

  useEffect(() => {
    const searchFiltered = students.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_id.includes(searchQuery)
    )
    
    const classFiltered = searchQuery
      ? searchFiltered
      : students.filter(student => student.current_class === selectedClass)
    
    setFilteredStudents(classFiltered)
  }, [searchQuery, students, selectedClass])

  const navigateToStudentDetail = useCallback((student) => {
    navigation.navigate('StudentDetail', { student })
  }, [navigation])

  const renderStudentItem = useCallback(({ item }) => (
    <StudentItem item={item} onPress={navigateToStudentDetail} />
  ), [navigateToStudentDetail])

  const handleClassChange = useCallback((itemValue) => {
    setSelectedClass(itemValue)
    setSearchQuery('') // Clear search query when changing class
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchStudents(true)
  }, [fetchStudents])

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchStudents(true)}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or ID"
            value={searchQuery}
            placeholderTextColor={'#666'}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedClass}
          onValueChange={handleClassChange}
          style={styles.picker}
          >
          {classes.map((className) => (
            <Picker.Item key={className} label={className} value={className} />
          ))}
        </Picker>
      </View>
      {isLoading ? (
        <View style={styles.centerContainer}>
          <PencilLoader size={100} color="#5B4DBC" />
        </View>
      ) : (      
        <FlatList
          data={filteredStudents}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item.student_id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No students found</Text>
          }
          windowSize={5}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 10
  },
  header: {
    flexDirection: "row",
    width: '100%',
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    color: "#5B4DBC"
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: '#5B4DBC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 8,
    flex: 1,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#333',
    height: 40,
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  picker: {
    color: 'black',
    height: 50,
    width: '100%',
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  listContent: {
    paddingTop: 8,
  },
  studentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    width: (SCREEN_WIDTH - 48) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#5B4DBC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  studentInfo: {
    alignItems: 'center',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
    textAlign: 'center',
  },
  studentId: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default Students

