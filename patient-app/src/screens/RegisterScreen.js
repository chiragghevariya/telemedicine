// Patient sign-up.
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, StatusBar,
} from 'react-native';
import { useAuth } from '../store/AuthContext';
import Input from '../components/Input';
import PrimaryButton from '../components/PrimaryButton';
import { colors, fonts, radius, spacing } from '../config/theme';
import { errorMessage } from '../utils/helpers';

export default function RegisterScreen() {
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', password_confirmation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const onRegister = async () => {
    setError('');

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
    } catch (e) {
      setError(errorMessage(e, 'Could not create your account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to connect with qualified medical practitioners</Text>
          </View>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <Input label="Full Name" placeholder="Jane Doe" value={form.name} onChangeText={set('name')} />
            <Input
              label="Email Address"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={form.email}
              onChangeText={set('email')}
            />
            <Input
              label="Phone Number"
              placeholder="e.g. +1 555 123 4567"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={set('phone')}
            />
            <Input
              label="Password"
              placeholder="Minimum 8 characters"
              secureTextEntry
              value={form.password}
              onChangeText={set('password')}
            />
            <Input
              label="Confirm Password"
              placeholder="Re-enter password"
              secureTextEntry
              value={form.password_confirmation}
              onChangeText={set('password_confirmation')}
            />

            <PrimaryButton 
              title="Create Account" 
              onPress={onRegister} 
              loading={loading} 
              style={styles.registerBtn} 
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  title: { 
    fontSize: 26, 
    ...fonts.bold, 
    color: colors.text, 
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 14, 
    ...fonts.medium, 
    color: colors.textMuted, 
    textAlign: 'center', 
    marginTop: 6,
    paddingHorizontal: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
    marginBottom: spacing.lg,
  },
  errorContainer: {
    backgroundColor: '#FDF2F2',
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  error: { 
    color: '#9B1C1C', 
    fontSize: 14, 
    ...fonts.medium,
  },
  registerBtn: {
    marginTop: spacing.md,
  },
});
