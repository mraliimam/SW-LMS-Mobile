import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Importing images at the top
const images = {
  house: require('../assets/house.png'),
  homework: require('../assets/homework.png'),
  Attendance: require('../assets/Attendance.png'),
  feedetails: require('../assets/feedetails.png'),
  exam: require('../assets/exam.png'),
  report: require('../assets/report.png'),
  calendar: require('../assets/calendar.png'),
  'notice-board': require('../assets/notice-board.png'),
  multimedia: require('../assets/multimedia.png'),
  'academic-year': require('../assets/academic-year.png'),
  user: require('../assets/user.png'),
};

const MenuItem = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity style={[styles.menuItem,{justifyContent:"space-around"}]} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Image source={images[icon]} style={styles.HomeImages} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen({navigation}) {
  const menuItems = [
    { icon: 'house', label: 'Dashboard' },
    { icon: 'homework', label: 'Homework' },
    { icon: 'Attendance', label: 'Attendance' },
    { icon: 'feedetails', label: 'Fee Details' },
    { icon: 'exam', label: 'Examination' },
    { icon: 'report', label: 'Report Cards' },
    { icon: 'calendar', label: 'Calendar' },
    { icon: 'notice-board', label: 'Notice Board' },
    { icon: 'multimedia', label: 'Multimedia' },
    { icon: 'academic-year', label: 'Academic Year' },
    { icon: 'user', label: 'Profile' },
  ];

  return (
<>
    <StatusBar barStyle="light-content"  backgroundColor="#5B4DBC" />
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
              <Text style={styles.profileName}>Saad Sultan</Text>
              <Text style={styles.profileClass}>Class VII B</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton}>
            <Icon name="menu" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Menu Grid */}
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <MenuItem
            key={index}
              icon={item.icon}
              label={item.label}
              onPress={() => navigation.navigate(item.label)}
              />
            ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={()=>navigation.navigate('SignIn')}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
            </>
  );
}
const styles = StyleSheet.create({
  container: {
    paddingTop: StatusBar.currentHeight-20,
    flex: 1,
    backgroundColor: '#5B4DBC',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 50,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    justifyContent: 'center',
    alignItems : 'center',
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  HomeImages: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems : 'center',
    borderRadius: 10,
  },
  profileInfo: {
    justifyContent: 'center',
  },
  profileName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  profileClass: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  closeButton: {
    padding: 8,
  },
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
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 80,
    height: 80,
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

    alignSelf:'center',
    width:100,
    borderRadius:100,
    height:45,
    justifyContent:'center',
    alignItems:"center",
    backgroundColor: 'white',
    alignItems: 'center',
    marginTop: 90,
    padding: 10,
  },
  logoutText: {
    color: '#FF4B75',
    fontSize: 16,
    fontWeight: '500',
  },
});