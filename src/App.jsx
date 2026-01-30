import React from 'react';
import Navigation from './Navigation';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FlashMessage from 'react-native-flash-message';

export default function App() {
  return (
    <SafeAreaProvider>
      <Navigation />
      <FlashMessage position="top" />
    </SafeAreaProvider>
  );
}
  