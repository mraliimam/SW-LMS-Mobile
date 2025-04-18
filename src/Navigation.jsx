import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createSharedElementStackNavigator } from 'react-navigation-shared-element';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TransitionPresets } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './screens/HomeScreen';
import SignInScreen from './screens/SignInScreen';
import Attendance from './screens/Attendance';
import ViewAttendance from './screens/ViewAttendence';
import Students from './screens/Students';
import StudentDetail from './screens/StudentDetail';
import Exams from './screens/Exams';
import ViewExamsResults from './screens/ViewExamsResult';

const Stack = createSharedElementStackNavigator();

export default function Navigation() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('SignIn');

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const username = await AsyncStorage.getItem('username');
        setInitialRoute(username ? 'Home' : 'SignIn');
      } catch (error) {
        console.error('Failed to load username from storage:', error);
        setInitialRoute('SignIn');
      } finally {
        setIsLoading(false);
      }
    };

    checkLogin();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5B4DBC" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator

          initialRouteName={initialRoute}

          screenOptions={{
            ...TransitionPresets.SlideFromRightIOS,
            cardStyle: { backgroundColor: 'transparent' },
            cardOverlayEnabled: true,
            headerShown: false,
            cardStyleInterpolator: ({ current: { progress } }) => ({
              cardStyle: {
                opacity: progress,
              },
            }),
          }}
        >
          <Stack.Screen
            name="SignIn"
            component={SignInScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            // options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Attendance"
            component={Attendance}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ViewAttendance"
            component={ViewAttendance}
            // options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Students"
            component={Students}
            // options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Exams"
            component={Exams}
            // options={{ headerShown: false }}
          />
          
          <Stack.Screen
            name="ViewExamsResults"
            component={ViewExamsResults}
            // options={{ headerShown: false }}
          />
          <Stack.Screen
            name="StudentDetail"
            component={StudentDetail}
            // options={{ headerShown: false }}
            sharedElements={(route, otherRoute, showing) => {
              const { student } = route.params;
              return [
                {
                  id: `student.${student.student_id}.avatar`,
                  animation: 'fade',
                  resize: 'stretch',
                  // align: 'center-top',
                },
                {
                  id: `student.${student.student_id}.name`,
                  animation: 'fade',
                  resize: 'stretch',
                  // align: 'left-center',
                },
                {
                  id: `student.${student.student_id}.id`,
                  animation: 'fade',
                  resize: 'stretch',
                  // align: 'left-center',
                },
              ];
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

