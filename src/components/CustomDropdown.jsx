import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';

const CustomDropdown = ({ data, selectedValue, onValueChange, placeholder }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [teacher, setTeacher] = useState('');
  console.log('data:>',data)

// useEffect(() => {
//   const fetchData = async () => {
//     try {
//       const storedValue = await AsyncStorage.getItem('username');
//       if (storedValue !== null) {
//         setTeacher(storedValue);
//       }
//     } catch (error) {
//       console.error('Error retrieving stored value:', error);
//     }
//   }  

//   fetchData();
// }, []);
// console.log('here is the teacher name :>>',teacher);
  const handleSelect = (item) => {
    onValueChange(item);
    setModalVisible(false);
  };
  const transformLabel = (label) => {
    const parts = label.split('_'); 
    if (parts.length === 2) {
      const prefix = parts[0];
      const rest = parts[1];
      const gender = prefix === 'B' ? 'Boys' : prefix === 'G' ? 'Girls' : prefix;
      return `${gender} ${rest}`;
    }
    return label;
  };
  return (
    <View>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}>
       <Text style={styles.dropdownButtonText}>
          {selectedValue ? transformLabel(selectedValue) : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <FlatList
              data={data}
              keyExtractor={(item) => item.value.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => handleSelect(item.value)}
                >
                  <Text style={styles.itemText}>{transformLabel(item.label)}</Text>
                  <Text style={styles.itemText}>{""}</Text>
                  <Text style={styles.itemText}>{`(${item.teacher})`}</Text>
                  </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#5B4DBC',
    backgroundColor: '#fff',
    borderRadius: 30,
  },
  dropdownButtonText: {
    color: 'black',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    color:"black",
    fontSize: 16,
  },
});

export default CustomDropdown; 