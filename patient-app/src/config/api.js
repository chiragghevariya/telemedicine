// Axios instance used by the whole app to talk to the Laravel backend.
// It automatically attaches the saved JWT token to every request.

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// IMPORTANT: set this to where your Laravel API is reachable FROM THE PHONE.
//   - Physical phone (Expo Go):        your computer's LAN IP, e.g. 192.168.1.50
//   - Android emulator:                10.0.2.2
//   - iOS simulator:                   127.0.0.1
// Find your computer's IP with `ipconfig` (Windows) / `ifconfig` (Mac/Linux),
// and make sure `php artisan serve --host=0.0.0.0` is running so the phone can reach it.
// ---------------------------------------------------------------------------
export const API_HOST = '192.168.1.100'; // <-- CHANGE ME
export const API_BASE_URL = `http://${API_HOST}:8000/api`;

// The key we use to store the token in AsyncStorage (phone storage).
export const TOKEN_KEY = 'token';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// --- Request interceptor: add "Authorization: Bearer <token>" if we have one ---
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// AuthContext registers a callback here so that when the server rejects our
// token (401), we can also clear the logged-in user and bounce back to login
// *immediately* (not just on the next app launch).
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

// --- Response interceptor: if the token is rejected (401), forget it ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      if (onUnauthorized) onUnauthorized(); // tell AuthContext to log out
    }
    return Promise.reject(error);
  }
);

export default api;
