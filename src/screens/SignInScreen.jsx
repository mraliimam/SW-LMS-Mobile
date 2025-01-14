import React, { useState, useRef,useEffect } from 'react';
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
  Platform,
  Keyboard,
  EmitterSubscription,
} from 'react-native';
import LOGO from 'react-native-vector-icons/FontAwesome';
import EYE from 'react-native-vector-icons/Entypo';
import { Popup } from '../components/UI/Popup';
import {login} from '../api/Signup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
const { width, height } = Dimensions.get('window');

export default function SignInScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const passwordInputRef = useRef(null);

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSignIn = async () => {
    if (isLoading) return;
    if (username === '' || password === '') {
      showPopup('Please Fill All Fields');
      return;
    }

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      showPopup('No Internet Connection. Please check your network settings.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await login(username, password);
      console.log('the response:>>', JSON.stringify(response))
      if(response.success || response.Message) {
        await AsyncStorage.setItem('username', username);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        });
      } else {
        showPopup('Incorrect User Name or Password');
      }
    } catch (error) {
      if (!networkState.isConnected) {
        showPopup('No Internet Connection. Please check your network settings.');
      } else {
        showPopup('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const showPopup = (message) => {
    setPopupMessage(message);
    setPopupVisible(true);
  }
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <ImageBackground 
        source={require('../assets/background.jpg')} 
        style={styles.backgroundImage}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollViewContent,
            { paddingBottom: keyboardHeight }
          ]}
          keyboardShouldPersistTaps="handled"
        >
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
              <Text style={styles.label}>User Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                placeholderTextColor={'#d6d6d6'}
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
              />
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
              onPress={()=>handleSignIn()}
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
    padding: 29,
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
  input: {
    fontSize: 18,
    color: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  passwordInput: {
    flex: 1,
    fontSize: 18,
    color: '#1A1A1A',
    paddingVertical: 8,
  },
  eyeButton: {
    padding: 10,
  },
  button: {
    backgroundColor: '#FF4B75',
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
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