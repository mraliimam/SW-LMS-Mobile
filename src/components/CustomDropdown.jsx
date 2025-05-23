import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';

const CustomDropdown = ({data, selectedValue, onValueChange, placeholder, dropdownStyle}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = item => {
    onValueChange(item);
    setModalVisible(false);
  };

  const selectedItem = data?.find(item => item.value === selectedValue);

  return (
    <View>
      <TouchableOpacity
        style={[styles.dropdownButton, dropdownStyle]} // Apply custom style here
        onPress={() => setModalVisible(true)}>
        <Text style={styles.dropdownButtonText}>
          {selectedValue ? (
            <>
              {selectedValue}
              {selectedItem?.teacher && (
                <Text style={styles.teacherText}>{` (${selectedItem.teacher})`}</Text>
              )}
            </>
          ) : (
            placeholder
          )}
        </Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <FlatList
              data={data}
              keyExtractor={item => item.value.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    selectedValue === item.value && styles.selectedItem,
                  ]}
                  onPress={() => handleSelect(item.value)}>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemText}>{item.label}</Text>
                    {item.teacher && (
                      <Text style={styles.teacherText}>
                        {` (${item.teacher})`}
                      </Text>
                    )}
                  </View>
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
    color: 'black',
    fontSize: 16,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  selectedItem: {
    backgroundColor: '#f0f0f0',
  },
  teacherText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 8,
  },

  // Custom styles for each dropdown type
  qaidaDropdown: {
    borderColor: '#FF5733', // Example color for Qaida/Nazra
    backgroundColor: '#FF5733', // Background color
  },
  syllabusDropdown: {
    borderColor: '#33FF57', // Example color for Syllabus
    backgroundColor: '#33FF57', // Background color
  },
});

export default CustomDropdown;
