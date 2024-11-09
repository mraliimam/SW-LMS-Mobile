import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  StatusBar,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform
} from 'react-native';
import LOGO from 'react-native-vector-icons/FontAwesome';
import EYE from 'react-native-vector-icons/Entypo';
import { Popup } from '../components/UI/Popup';

const { width, height } = Dimensions.get('window');

export default function SignInScreen({ navigation }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const passwordInputRef = useRef();

  const [isLoading, setIsLoading] = useState(false);
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const HandleSignup = async () => {
    if (isLoading) return; 
    if (phoneNumber === '' || password === '') {
      showPopup('Please Fill All Fields');
      return;
    }
    if (phoneNumber.length <= 2) {
      showPopup('Please Enter Correct Phone Number');
      return;
    }
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (phoneNumber === '1111111111' && password === 'admin') {
        navigation.navigate('Home');
      } else {
        showPopup('Incorrect Phone Number or Password');
      }
    } catch (error) {
      showPopup('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showPopup = (message) => {
    setPopupMessage(message);
    setPopupVisible(true);
  }

  const handlePhoneNumberChange = (text) => {
    const formattedNumber = text.replace(/[^0-9]/g, '').slice(0, 10);
    setPhoneNumber(formattedNumber);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -200}
    >
      <ImageBackground 
        source={require('../assets/background.jpg')} 
        style={styles.backgroundImage}
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <StatusBar backgroundColor="transparent" translucent />
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LOGO name="graduation-cap" size={50} color="#FF4B75" />
            </View>
            <Text style={styles.brandText}>SW-LMS</Text>
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Sign In</Text>
          </View>

          <View style={styles.card}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.phoneInputContainer}>
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="1122112211"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={handlePhoneNumberChange}
                    placeholderTextColor={'#d6d6d6'}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordInputRef.current.focus()}
                  />
                </View>
              </View>
          
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.passwordInput}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••••"
                    placeholderTextColor={'#d6d6d6'}
                  />
                  <TouchableOpacity onPress={togglePasswordVisibility} style={styles.eyeButton}>
                    <EYE 
                      style={{ opacity: 0.4 }}
                      name={showPassword ? "eye-with-line" : "eye"}
                      size={20} 
                      color="#666666" 
                    />
                  </TouchableOpacity>
                </View>
          </View>

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={HandleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password</Text>
          </TouchableOpacity>
          </View>

            <Popup
              visible={popupVisible}
              onClose={() => setPopupVisible(false)}
              title="Message"
            >
              <Text>{popupMessage}</Text>
            </Popup>
            </ScrollView>
            </ImageBackground>
            </KeyboardAvoidingView>
            );
            }

            const styles = StyleSheet.create({
              container: {
                flex: 1,
              },
              backgroundImage: {
                width: width,
                height: height,
                flex: 1,
              },
              scrollViewContent: {
                flexGrow: 1,
                justifyContent: 'center',
              },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 90,
    height: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandText: {
    color: '#FF4B75',
    fontSize: 24,
    fontWeight: '600',
    marginTop: 12,
  },
  titleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 40,
    fontWeight: '500',
    color: 'white',
    margin: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    color: 'black',
    padding: 2,
  },
  countryCode: {
    fontSize: 28,
    fontWeight: '900',
    color: 'black',
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '900',
    color: '#1A1A1A',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#E0E0E0',
    padding: 2,
  },
  passwordInput: {
    flex: 1,
    fontSize: 28,
    color: '#1A1A1A',
  },
  eyeButton: {
    padding: 10,
  },
  button: {
    backgroundColor: '#FF4B75',
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: '#FFB3C0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#FF4B75',
    fontSize: 14,
  },
});
