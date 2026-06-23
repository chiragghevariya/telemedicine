// Shown briefly on startup while AuthContext checks for a saved token.

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing } from '../config/theme';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>👨‍⚕️</Text>
      <Text style={styles.title}>Telemedicine</Text>
      <Text style={styles.subtitle}>Doctor Portal</Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 64 },
  title: { fontSize: 26, fontWeight: '800', color: colors.primary, marginTop: spacing.md },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs },
});
