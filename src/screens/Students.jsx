import React, { useEffect, useState, useCallback, memo } from 'react'
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Dimensions
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { SharedElement } from 'react-navigation-shared-element'
import { getStudents } from '../api/Signup'
import AsyncStorage from '@react-native-async-storage/async-storage'
import PencilLoader from '../components/UI/PencilLoader'
import Icon from 'react-native-vector-icons/Ionicons'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import StudentDetail from './StudentDetail'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

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

  const fetchStudents = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const storedUsername = await AsyncStorage.getItem('username')
      const response = await getStudents(storedUsername || '')
      if (response && response.Records) {
        setStudents(response.Records)
        setFilteredStudents(response.Records)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      setError('Failed to load students. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  useEffect(() => {
    const filtered = students.filter(student =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_id.includes(searchQuery)
    )
    setFilteredStudents(filtered)
  }, [searchQuery, students])

  const navigateToStudentDetail = useCallback((student) => {
    console.log(student)
    navigation.navigate('StudentDetail', { student })
  }, [navigation])

  const renderStudentItem = useCallback(({ item }) => (
    <StudentItem item={item} onPress={navigateToStudentDetail} />
  ), [navigateToStudentDetail])

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStudents}>
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
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop:10
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
    width: (SCREEN_WIDTH - 48) / 2, // Adjust width based on screen size
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

