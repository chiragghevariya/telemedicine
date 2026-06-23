// Global authentication state for the DOCTOR app.
// Only users whose role is "doctor" are allowed to log in here.

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY, setUnauthorizedHandler } from '../config/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // If any API call returns 401 (token expired), clear the user so the
  // navigator sends the doctor back to the login screen.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  // On startup, load the user if a token is saved (and it's a doctor).
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          const res = await api.get('/auth/me');
          if (res.data.user?.role === 'doctor') {
            setUser(res.data.user);
          } else {
            // A non-doctor token somehow ended up here — remove it.
            await AsyncStorage.removeItem(TOKEN_KEY);
          }
        }
      } catch (e) {
        // Don't delete the token on a network error (offline) — only the 401
        // interceptor removes it. This lets the next launch retry.
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  // POST /api/auth/login — reject non-doctor accounts.
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.user?.role !== 'doctor') {
      // We never saved the token, so nothing to clean up.
      throw new Error('This is the doctor app. Please log in with a doctor account.');
    }
    await AsyncStorage.setItem(TOKEN_KEY, res.data.access_token);
    setUser(res.data.user);
  };

  // POST /api/auth/logout, then forget the token locally.
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore network errors on logout
    }
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
