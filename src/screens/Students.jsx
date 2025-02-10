import React, { useEffect, useState, useCallback, memo } from 'react'
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Dimensions,
  Image,
  RefreshControl,
} from 'react-native'
import NetInfo from '@react-native-community/netinfo';
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { SharedElement } from 'react-navigation-shared-element'
import { getStudents, getAttendance } from '../api/Signup'
import AsyncStorage from '@react-native-async-storage/async-storage'
import PencilLoader from '../components/UI/PencilLoader'
import CustomDropdown from '../components/CustomDropdown'
import { SafeAreaView } from 'react-native-safe-area-context'
import { format } from 'date-fns'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const CACHE_KEY = 'STUDENTS_DATA'
const TEACHERS_CACHE_KEY = 'TEACHERS_DATA'
const CACHE_EXPIRY = 24 * 60 * 60 * 1000
const StudentItem = memo(({ item, onPress }) => (
  <TouchableOpacity
    style={styles.studentItem}
    onPress={() => onPress(item)}>
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
  const [selectedDate, setSelectedDate] = useState(null);
  const [username, setUsername] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [teachersData, setTeachersData] = useState([]);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    fetchUsername();
  }, []);

  const fetchUsername = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      setUsername(storedUsername);
      if (storedUsername) {
        const today = new Date();
        setSelectedDate(today);
        fetchAttendance(storedUsername, format(today, 'yyyy-MM-dd'));
      }
    } catch (error) {
      console.error('Error fetching username:', error);
    }
  };

  const fetchAttendance = useCallback(
    async (user, date) => {
      setIsLoading(true);
      try {
        const response = await getAttendance({ username: user, dateFor: date });
        // console.log('response:>',response)
        if (response && response.Classes) {
          setAttendanceData(response.Classes);
          if (response.Classes.length > 0 && !selectedClass) {
            setSelectedClass(response.Classes[0].class_name.toString());
          }
        } else {
          setAttendanceData([]);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
        setAttendanceData([]);
      } finally {
        setIsLoading(false);
      }
    },
    [selectedClass]
  );

  const fetchTeachersData = useCallback(async () => {
    try {
      const netInfo = await NetInfo.fetch();
      let teachersData;

      if (netInfo.isConnected) {
        const response = await getAttendance({ 
          username: await AsyncStorage.getItem('username'), 
          dateFor: format(new Date(), 'yyyy-MM-dd') 
        });
        
        if (response && response.Classes) {
          teachersData = response.Classes;
          await AsyncStorage.setItem(TEACHERS_CACHE_KEY, JSON.stringify({
            data: teachersData,
            timestamp: Date.now()
          }));
        }
      } else {
        const cachedData = await AsyncStorage.getItem(TEACHERS_CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            teachersData = data;
          }
        }
      }

      if (teachersData) {
        // console.log('Setting teachers data:', teachersData);
        setTeachersData(teachersData);
      }
    } catch (error) {
      console.error('Error fetching teachers data:', error);
      try {
        const cachedData = await AsyncStorage.getItem(TEACHERS_CACHE_KEY);
        if (cachedData) {
          const { data } = JSON.parse(cachedData);
          // console.log('Setting cached teachers data:', data);
          setTeachersData(data);
        }
      } catch (cacheError) {
        console.error('Error reading cached teachers data:', cacheError);
      }
    }
  }, []);

  useEffect(() => {
    fetchTeachersData();
  }, [fetchTeachersData]);

  const fetchStudents = useCallback(async (forceRefresh = false) => {
    if (!initialLoadComplete) {
      setIsLoading(true);
    }

    let hasCachedData = false;
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          setStudents(data);
          const uniqueClasses = [...new Set(data.map(student => student.current_class))];
          setClasses(uniqueClasses);
          setSelectedClass(prevClass => prevClass || uniqueClasses[0]);
          setFilteredStudents(data.filter(student => 
            student.current_class === (selectedClass || uniqueClasses[0])
          ));
          hasCachedData = true;
          setIsLoading(false);
        }
      }
    } catch (cacheError) {
      console.error('Error reading cached data:', cacheError);
    }

    try {
      const netInfo = await NetInfo.fetch();
      
      if (netInfo.isConnected) {
        const storedUsername = await AsyncStorage.getItem('username');
        const response = await getStudents(storedUsername || '');
        
        if (response && response.Records) {
          const studentsData = response.Records;
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
            data: studentsData,
            timestamp: Date.now()
          }));
          
          setStudents(studentsData);
          const uniqueClasses = [...new Set(studentsData.map(student => student.current_class))];
          setClasses(uniqueClasses);
          setSelectedClass(prevClass => prevClass || uniqueClasses[0]);
          setFilteredStudents(studentsData.filter(student => 
            student.current_class === (selectedClass || uniqueClasses[0])
          ));
          setError(null);
        }
      } else if (!hasCachedData) {
        setError('No internet connection available');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      if (!hasCachedData) {
        setError('Failed to load students. Please check your internet connection.');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setInitialLoadComplete(true);
    }
  }, [selectedClass, initialLoadComplete]);

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
      return () => {
        // Cleanup if needed
      };
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
    setSearchQuery('')
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchStudents(true)
  }, [fetchStudents])

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        fetchStudents(true);
        fetchTeachersData();
      }
    });
    return () => unsubscribe();
  }, [fetchStudents, fetchTeachersData]);

  if (isLoading && !initialLoadComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <PencilLoader size={100} color="#5B4DBC" />
        </View>
      </SafeAreaView>
    );
  }

  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Image source={require('../assets/arrow.png')} style={{ width: 24, height: 24 , tintColor: 'white'}} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Image source={require('../assets/search.png')} style={{ width: 24, height: 24 , marginRight: 8}} />
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
        <CustomDropdown
          data={classes.map((className) => {
            const classData = teachersData.find(c => c.class_name === className);
            // console.log('Class data for', className, ':', classData);
            return {
              label: className,
              value: className,
              teacher: classData ? classData.teacher_name : ''
            };
          })}
          selectedValue={selectedClass}
          onValueChange={handleClassChange}
          placeholder="Select a class"
        />
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
    width: '100%',
    paddingHorizontal: 32,
    paddingBottom: 6,
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

