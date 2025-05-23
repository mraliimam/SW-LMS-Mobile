import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Popup} from '../components/UI/Popup';
import {SafeAreaView} from 'react-native-safe-area-context';

const images = {
  house: require('../assets/house.png'),
  homework: require('../assets/homework.png'),
  Attendance: require('../assets/Attendance.png'),
  calendar: require('../assets/calendar.png'),
  user: require('../assets/user.png'),
  exams: require('../assets/exam.png'),
};

const MenuItem = ({icon, label, onPress}) => {
  return (
    <TouchableOpacity style={[styles.menuItem]} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Image source={images[icon]} style={styles.HomeImages} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen({navigation}) {
  const [popupVisible, setPopupVisible] = useState(false);
  const [type, setType] = useState('Attendance');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true); // New state for loading

  const menuItems = [
    {icon: 'house', label: 'Dashboard'},
    {icon: 'Attendance', label: 'Attendance'},
    {icon: 'user', label: 'Students'},
    {icon: 'exams', label: 'Exams'},
  ];

  useEffect(() => {
    const fetchUsername = async () => {
      const username = await AsyncStorage.getItem('username');
      setUsername(username);
      setLoading(false);
    };

    fetchUsername();
  }, []);

  async function logout() {
    try {
      await AsyncStorage.removeItem('username');
      // console.log('User logged out');
      navigation.reset({
        index: 0,
        routes: [{name: 'SignIn'}],
      });
    } catch (error) {
      console.error('Failed to logout:', error.message);
    }
  }

  const showPopup = type => {
    setPopupVisible(true);
    setType(type);
  };

  const handleAttendancePress = label => {
    if (label == 'Attendance' || label == 'Exams') {
      showPopup(label);
    } else navigation.navigate(label);
  };

  const handlePopupPress = where => {
    navigation.navigate(where);
    setPopupVisible(false);
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#5B4DBC" />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.profileSection}>
              <Image
                source={require('../assets/user.png')}
                style={styles.profileImage}
              />
              <View style={styles.profileInfo}>
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" /> // Show loading spinner
                ) : (
                  <Text style={styles.profileName}>{username}</Text> // Show username once loaded
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton}>
              <Image
                source={require('../assets/menu.png')}
                style={{width: 25, height: 25, tintColor: 'white'}}
              />
            </TouchableOpacity>
          </View>

          {/* Menu Grid */}
          <View style={styles.menuGrid}>
            {menuItems.map((item, index) => (
              <MenuItem
                key={index}
                icon={item.icon}
                label={item.label}
                onPress={() => handleAttendancePress(item.label)}
              />
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => logout()}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
        <Popup
          visible={popupVisible}
          onClose={() => setPopupVisible(false)}
          title="Select">
          <View
            style={{
              // flex: 1,
              flexDirection: 'row-reverse',
              justifyContent: 'space-around',
              alignItems: 'center',
            }}>
            <TouchableOpacity
              style={{
                width: 160,
                height: 50,
                // paddingVertical: 10,
                // paddingHorizontal: 20,
                backgroundColor: '#5B4DBC',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 100,
                marginHorizontal: 12,
              }}
              onPress={() => handlePopupPress(type)}>
              <Text
                style={{
                  color: 'white',
                  fontWeight: '500',
                  alignSelf: 'center',
                }}>
                {type == 'Attendance'
                  ? 'Take Attendance'
                  : 'Upload Exams results'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 160,
                height: 50,
                backgroundColor: '#5B4DBC',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 100,
                alignSelf: 'center',
              }}
              onPress={() =>
                handlePopupPress(
                  type == 'Attendance' ? 'ViewAttendance' : 'ViewExamsResults',
                )
              }>
              <Text
                style={{
                  color: 'white',
                  fontWeight: '500',
                  alignSelf: 'center',
                }}>
                {type == 'Attendance'
                  ? 'View Attendance'
                  : 'View Exams results'}
              </Text>
            </TouchableOpacity>
          </View>
        </Popup>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#5B4DBC'},
  scrollContent: {flexGrow: 1, padding: 20},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 50,
  },
  profileSection: {flexDirection: 'row', alignItems: 'center'},
  profileImage: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  HomeImages: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  profileInfo: {justifyContent: 'center'},
  profileName: {color: 'white', fontSize: 18, fontWeight: '600'},
  profileClass: {color: 'rgba(255, 255, 255, 0.8)', fontSize: 14},
  closeButton: {padding: 8},
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    marginHorizontal: -8,
    marginBottom: -25,
  },
  menuItem: {
    width: '33.33%',
    padding: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 70,
    height: 70,
    maxWidth: 100,
    maxHeight: 100,
    backgroundColor: 'white',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  logoutButton: {
    alignSelf: 'center',
    width: 100,
    borderRadius: 100,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    alignItems: 'center',
    marginTop: 40,
    padding: 10,
  },
  logoutText: {
    color: '#FF4B75',
    fontSize: 16,
    fontWeight: '600',
  },
});
