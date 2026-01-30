// components/NumberModalPicker.js
import React from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const NumberModalPicker = ({visible, onClose, onSelect, max = 40}) => {
  const numbers = Array.from({length: max + 1}, (_, i) => i);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.title}>Select Marks</Text>
          <FlatList
            data={numbers}
            keyExtractor={item => item.toString()}
            numColumns={8}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.numberBox}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}>
                <Text style={styles.numberText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default NumberModalPicker;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    width: '90%',
    borderRadius: 10,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color:'#000'
  },
  numberBox: {
    width: '12.5%',
    aspectRatio: 1,
    margin: 3,
    backgroundColor: '#5B4DBC',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  numberText: {
    fontSize: 16,
    fontWeight: '500',
  },
  closeBtn: {
    marginTop: 15,
    backgroundColor: '#5B4DBC',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontWeight: '600',
  },
});
