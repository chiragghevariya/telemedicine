// Decides which screens the user can see based on whether they're logged in.
//
// - While we're checking storage for a token  -> SplashScreen
// - Logged OUT  -> Login / Register
// - Logged IN   -> Main (bottom tabs) + the detail screens (doctor, booking, video)
//
// Because this is driven by the `user` from AuthContext, logging in/out
// automatically swaps the screens — no manual navigation needed.

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../store/AuthContext';
import { colors } from '../config/theme';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import DoctorListScreen from '../screens/DoctorListScreen';
import DoctorProfileScreen from '../screens/DoctorProfileScreen';
import BookingScreen from '../screens/BookingScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import VideoCallScreen from '../screens/VideoCallScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// The two bottom tabs shown once you're logged in.
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        // Pick an icon based on the tab name.
        tabBarIcon: ({ color, size }) => {
          const iconName = route.name === 'Home' ? 'home' : 'calendar';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Find a Doctor' }} />
      <Tab.Screen name="Appointments" component={AppointmentsScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();

  // Still checking for a saved token -> show the splash screen.
  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
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
            <Stack.Screen name="DoctorList" component={DoctorListScreen} options={{ title: 'Doctors' }} />
            <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} options={{ title: 'Doctor' }} />
            <Stack.Screen name="Booking" component={BookingScreen} options={{ title: 'Book Appointment' }} />
            <Stack.Screen name="VideoCall" component={VideoCallScreen} options={{ headerShown: false }} />
          </>
        ) : (
          // ---- Logged OUT ----
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create account' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
