// Patient sign-up. Sends name/email/phone/password to the backend (role is
// forced to "patient" inside AuthContext.register).

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuth } from '../store/AuthContext';
import Input from '../components/Input';
import PrimaryButton from '../components/PrimaryButton';
import { colors, spacing } from '../config/theme';
import { errorMessage } from '../utils/helpers';

export default function RegisterScreen() {
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper to update one field of the form.
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const onRegister = async () => {
    setError('');

    // Basic checks before calling the API (the backend validates too).
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in your name, email and password.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
      });
      // Success -> RootNavigator switches to the main app automatically.
    } catch (e) {
      setError(errorMessage(e, 'Could not create your account. Please try again.'));
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
        <Text style={styles.title}>Create your account</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Input label="Full name" placeholder="Jane Doe" value={form.name} onChangeText={set('name')} />
        <Input
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={set('email')}
        />
        <Input
          label="Phone (optional)"
          placeholder="+1 555 123 4567"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={set('phone')}
        />
        <Input
          label="Password"
          placeholder="At least 8 characters"
          secureTextEntry
          value={form.password}
          onChangeText={set('password')}
        />
        <Input
          label="Confirm password"
          placeholder="Re-enter password"
          secureTextEntry
          value={form.password_confirmation}
          onChangeText={set('password_confirmation')}
        />

        <PrimaryButton title="Sign up" onPress={onRegister} loading={loading} style={{ marginTop: spacing.sm }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  title: {
    fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: spacing.lg, textAlign: 'center',
  },
  error: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
});
