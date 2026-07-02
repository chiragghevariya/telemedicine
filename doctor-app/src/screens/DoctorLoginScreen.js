// Doctor login screen with premium telemedicine styling.
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, StatusBar,
} from 'react-native';
import { useAuth } from '../store/AuthContext';
import Input from '../components/Input';
import PrimaryButton from '../components/PrimaryButton';
import { colors, fonts, radius, spacing } from '../config/theme';
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
    } catch (e) {
      setError(errorMessage(e, 'Login failed. Check your details and try again.'));
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
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>👨‍⚕️</Text>
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to access your doctor workspace</Text>
          </View>

          <View style={styles.card}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Email Address"
              placeholder="name@telemed.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Password"
              placeholder="Enter your security password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <PrimaryButton 
              title="Log In to Workspace" 
              onPress={onLogin} 
              loading={loading} 
              style={styles.loginBtn} 
            />
          </View>

          {/* Demo account helper card */}
          <View style={styles.demoCard}>
            <Text style={styles.demoTitle}>💡 Demo Workspace Access</Text>
            <View style={styles.demoRow}>
              <Text style={styles.demoLabel}>Doctor:</Text>
              <Text style={styles.demoValue}>smith@demo.com</Text>
            </View>
            <View style={styles.demoRow}>
              <Text style={styles.demoLabel}>Password:</Text>
              <Text style={styles.demoValue}>password123</Text>
            </View>
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
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  logoText: { fontSize: 40 },
  title: { 
    fontSize: 28, 
    ...fonts.bold, 
    color: colors.text, 
    textAlign: 'center',
  },
  subtitle: { 
    fontSize: 15, 
    ...fonts.medium, 
    color: colors.textMuted, 
    textAlign: 'center', 
    marginTop: 6,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
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
  loginBtn: {
    marginTop: spacing.md,
  },
  demoCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  demoTitle: {
    fontSize: 14,
    ...fonts.bold,
    color: '#D97706',
    marginBottom: 6,
  },
  demoRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  demoLabel: {
    width: 80,
    fontSize: 13,
    ...fonts.semiBold,
    color: '#B45309',
  },
  demoValue: {
    fontSize: 13,
    ...fonts.regular,
    color: '#78350F',
  },
});
