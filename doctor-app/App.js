import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { AuthProvider } from './src/store/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import CallManager from './src/services/CallManager';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Register FCM background message handler at the root level before React Native registration
if (Platform.OS === 'android' && !isExpoGo) {
  try {
    const { getMessaging, setBackgroundMessageHandler } = require('@react-native-firebase/messaging');
    setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
      console.log('[ReactNativeJS] [FCM Background] Doctor App received message:', JSON.stringify(remoteMessage));
      await CallManager.handleIncomingDataMessage(remoteMessage);
    });
  } catch (e) {
    console.warn('Failed to set root background message handler:', e);
  }

  // Notifee: create the incoming-call channel and handle notification taps while
  // the app is in the background/killed. "Accept" launches the app (via
  // launchActivity) and CallManager.checkPendingCall() resumes the call; "Decline"
  // declines on the backend and dismisses the notification.
  try {
    const notifeeModule = require('@notifee/react-native');
    const notifee = notifeeModule.default;
    const { AndroidImportance, EventType } = notifeeModule;
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const api = require('./src/config/api').default;

    notifee
      .createChannel({ id: 'incoming_calls', name: 'Incoming Calls', importance: AndroidImportance.HIGH })
      .catch(() => {});

    notifee.onBackgroundEvent(async ({ type, detail }) => {
      const { pressAction, notification } = detail;
      if (type === EventType.ACTION_PRESS && pressAction?.id === 'decline') {
        try {
          const raw = await AsyncStorage.getItem('pending_call');
          if (raw) {
            const c = JSON.parse(raw);
            await api.post('/calls/decline', { call_id: parseInt(c.call_id) }).catch(() => {});
          }
        } catch (err) {
          // ignore
        }
        await AsyncStorage.removeItem('pending_call');
        if (notification?.id) await notifee.cancelNotification(notification.id);
      }
      // 'accept' / body press use launchActivity:'default' -> the app launches and
      // CallManager.checkPendingCall() (fired when auth is ready) opens VideoCallScreen.
    });
  } catch (e) {
    console.warn('Failed to set up Notifee background handler:', e);
  }
}

export default function App() {
  useEffect(() => {
    // Only initialize CallManager if NOT in Expo Go (to prevent native module crashes)
    if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
      CallManager.initialize();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
