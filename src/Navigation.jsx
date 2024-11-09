// navigation.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import SignInScreen from './screens/SignInScreen';
import Attendance from './screens/Attendance';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  return (
    <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Attendance" component={Attendance} 
      // options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  </NavigationContainer>
  );
}
