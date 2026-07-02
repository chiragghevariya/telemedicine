// Global authentication state.
// Any screen can call useAuth() to read the current user or log in/out.

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY, setUnauthorizedHandler } from '../config/api';
import CallManager from '../services/CallManager';

const AuthContext = createContext(null);

// Handy hook so screens can do: const { user, login } = useAuth();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);      // the logged-in user, or null
  const [loading, setLoading] = useState(true); // true while we check storage on startup

  // If any API call returns 401 (e.g. the token expired mid-session), the axios
  // interceptor clears the token; this also clears the user so the navigator
  // sends them back to the login screen right away.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  // Sync Push Token whenever user authentication changes
  useEffect(() => {
    if (user) {
      CallManager.syncPushToken();
      // If the app was launched by accepting a killed/screen-off incoming-call
      // notification, resume it now that the user (and their id) is loaded.
      CallManager.checkPendingCall();
    }
  }, [user]);

  // When the app starts, see if a token is already saved and, if so, load the user.
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          // The request interceptor adds the token for us.
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        }
      } catch (e) {
        // Note: we DON'T delete the token here. If this failed because the token
        // is invalid, the 401 interceptor already removed it. If it failed for a
        // network reason (offline), we keep the token so the next launch can retry.
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  // Save the token + user after a successful login/register.
  const saveSession = async (data) => {
    await AsyncStorage.setItem(TOKEN_KEY, data.access_token);
    setUser(data.user);
  };

  // POST /api/auth/login
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    await saveSession(res.data);
  };

  // POST /api/auth/register — this is the patient app, so role is always "patient".
  const register = async ({ name, email, phone, password, password_confirmation }) => {
    const res = await api.post('/auth/register', {
      name,
      email,
      phone,
      password,
      password_confirmation,
      role: 'patient',
    });
    await saveSession(res.data);
  };

  // POST /api/auth/logout, then forget the token locally.
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout — we clear local state regardless.
    }
    await AsyncStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
