// App.js

import React, { useEffect } from 'react';
import Navigation from './Navigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { startAttendanceSync } from './services/AttendanceSync';

export default function App() {
  useEffect(() => {
    startAttendanceSync();
    return () => {
      // Clean up if needed
    };
  }, []);

  return <Navigation />;
}
