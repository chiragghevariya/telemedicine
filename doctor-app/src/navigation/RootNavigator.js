// Decides which screens the doctor can see based on login state.
//
// - While checking storage for a token  -> SplashScreen
// - Logged OUT  -> DoctorLogin
// - Logged IN   -> bottom tabs (Dashboard / Appointments / Profile)
//                  + detail & video screens stacked on top

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../store/AuthContext';
import { colors } from '../config/theme';
import { navigationRef } from './navigationRef';

import SplashScreen from '../screens/SplashScreen';
import DoctorLoginScreen from '../screens/DoctorLoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AppointmentListScreen from '../screens/AppointmentListScreen';
import AppointmentDetailScreen from '../screens/AppointmentDetailScreen';
import VideoCallScreen from '../screens/VideoCallScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AvailabilityEditorScreen from '../screens/AvailabilityEditorScreen';
import PatientListScreen from '../screens/PatientListScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => {
          const icons = { 
            Dashboard: 'grid', 
            Appointments: 'calendar', 
            Patients: 'people',
            Profile: 'person' 
          };
          return <Ionicons name={icons[route.name] || 'ellipse'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Appointments" component={AppointmentListScreen} />
      <Tab.Screen name="Patients" component={PatientListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
        }}
      >
        {user ? (
          // ---- Logged IN ----
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} options={{ title: 'Appointment' }} />
            <Stack.Screen name="VideoCall" component={VideoCallScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AvailabilityEditor" component={AvailabilityEditorScreen} options={{ title: 'Manage Schedule' }} />
          </>
        ) : (
          // ---- Logged OUT ----
          <Stack.Screen name="DoctorLogin" component={DoctorLoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
