// Shown briefly on startup while AuthContext checks for a saved token.
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Image, StatusBar } from 'react-native';
import { colors, fonts, spacing } from '../config/theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>👨‍⚕️</Text>
        </View>
        <Text style={styles.title}>Telemed</Text>
        <Text style={styles.subtitle}>Doctor Workspace</Text>
      </View>
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} size="small" />
        <Text style={styles.loadingText}>Securing workspace...</Text>
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
    paddingVertical: spacing.xxl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  logoText: {
    fontSize: 50,
  },
  title: {
    fontSize: 32,
    ...fonts.heavy,
    color: colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
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
