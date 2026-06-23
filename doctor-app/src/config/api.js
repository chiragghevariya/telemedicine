// Axios instance for the DOCTOR app. Same pattern as the patient app:
// attaches the saved JWT to every request automatically.

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// IMPORTANT: set this to where your Laravel API is reachable FROM THE PHONE.
//   - Physical phone (Expo Go):  your computer's LAN IP, e.g. 192.168.1.50
//   - Android emulator:          10.0.2.2
//   - iOS simulator:             127.0.0.1
// Run Laravel with:  php artisan serve --host=0.0.0.0
// ---------------------------------------------------------------------------
export const API_HOST = '192.168.1.100'; // <-- CHANGE ME
export const API_BASE_URL = `http://${API_HOST}:8000/api`;

export const TOKEN_KEY = 'doctor_token'; // separate key from the patient app

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

// AuthContext registers a callback here so a server 401 logs the doctor out in the UI.
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
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default api;
