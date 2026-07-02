// Shown for a moment on startup while AuthContext checks for a saved token.
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { colors, fonts, spacing } from '../config/theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🩺</Text>
        </View>
        <Text style={styles.title}>Telemed</Text>
        <Text style={styles.subtitle}>Connecting you to doctors</Text>
      </View>
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={styles.loadingText}>Initializing portal...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  logoText: {
    fontSize: 44,
  },
  title: {
    fontSize: 32,
    ...fonts.heavy,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    ...fonts.medium,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  footer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    ...fonts.regular,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
