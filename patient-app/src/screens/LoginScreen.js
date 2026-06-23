// Email + password login. On success, AuthContext sets the user and the
// navigator automatically switches to the main app.

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../store/AuthContext';
import Input from '../components/Input';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing } from '../config/theme';
import { errorMessage } from '../utils/helpers';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      await login(email.trim(), password);
      // No navigation needed — RootNavigator swaps screens once user is set.
    } catch (e) {
      setError(errorMessage(e, 'Login failed. Check your details and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🩺</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to book your appointment</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Input
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Password"
          placeholder="Your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <PrimaryButton title="Log in" onPress={onLogin} loading={loading} style={{ marginTop: spacing.sm }} />

        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkMuted}>New here? </Text>
          <Text style={styles.link}>Create an account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logo: { fontSize: 56, textAlign: 'center' },
  title: {
    fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg,
  },
  error: {
    color: colors.danger, marginBottom: spacing.md, textAlign: 'center',
  },
  linkRow: {
    flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg,
  },
  linkMuted: { color: colors.textMuted },
  link: { color: colors.primary, fontWeight: '700' },
});
