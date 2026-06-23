// Doctor login. Only doctor accounts are allowed (checked in AuthContext.login).

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuth } from '../store/AuthContext';
import Input from '../components/Input';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing } from '../config/theme';
import { errorMessage } from '../utils/helpers';

export default function DoctorLoginScreen() {
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
      // On success, RootNavigator swaps to the dashboard automatically.
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
        <Text style={styles.logo}>👨‍⚕️</Text>
        <Text style={styles.title}>Doctor Portal</Text>
        <Text style={styles.subtitle}>Log in to manage your appointments</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Input
          label="Email"
          placeholder="doctor@example.com"
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

        {/* Demo hint */}
        <Text style={styles.hint}>Demo: smith@demo.com / password123</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  logo: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: spacing.sm },
  subtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.lg },
  error: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
  hint: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: spacing.lg },
});
