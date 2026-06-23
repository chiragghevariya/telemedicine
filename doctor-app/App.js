// App entry point for the DOCTOR app. Wraps everything in:
//  - SafeAreaProvider (avoid notches/status bars)
//  - AuthProvider (global login state, doctor-only)
//  - RootNavigator (decides which screens to show)

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/store/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
