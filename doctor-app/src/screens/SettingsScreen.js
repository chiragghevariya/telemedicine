// Premium Settings Screen.
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../config/theme';
import { useAuth } from '../store/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { logout } = useAuth();
  const [biometrics, setBiometrics] = React.useState(true);
  const [notifications, setNotifications] = React.useState(true);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Configure security and workspace preferences</Text>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Workspace Card */}
        <Text style={styles.sectionTitle}>Account Preference</Text>
        <View style={styles.card}>
          <SettingRow 
            icon="notifications-outline" 
            label="Push Notifications" 
            right={
              <Switch 
                value={notifications} 
                onValueChange={setNotifications}
                trackColor={{ false: '#d1d1d1', true: colors.primaryLight }}
                thumbColor={notifications ? colors.primary : '#f4f3f4'}
              />
            }
          />
          <View style={styles.separator} />
          <SettingRow 
            icon="finger-print-outline" 
            label="Biometric Authentication" 
            right={
              <Switch 
                value={biometrics} 
                onValueChange={setBiometrics}
                trackColor={{ false: '#d1d1d1', true: colors.primaryLight }}
                thumbColor={biometrics ? colors.primary : '#f4f3f4'}
              />
            }
          />
        </View>

        {/* Schedule Preferences */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <SettingRow 
            icon="time-outline" 
            label="Configure Availability Slots" 
            onPress={() => navigation.navigate('AvailabilityEditor')}
            showArrow
          />
          <View style={styles.separator} />
          <SettingRow 
            icon="shield-checkmark-outline" 
            label="Security & Privacy Settings" 
            onPress={() => {}}
            showArrow
          />
        </View>

        {/* Support */}
        <Text style={styles.sectionTitle}>Help & Info</Text>
        <View style={styles.card}>
          <SettingRow 
            icon="help-circle-outline" 
            label="Help & Center Support" 
            onPress={() => {}}
            showArrow
          />
          <View style={styles.separator} />
          <SettingRow 
            icon="document-text-outline" 
            label="Terms of Service & License" 
            onPress={() => {}}
            showArrow
          />
        </View>

        {/* Log out */}
        <TouchableOpacity style={styles.logoutRow} onPress={logout}>
          <Ionicons name="log-out" size={20} color={colors.danger} style={{ marginRight: spacing.sm }} />
          <Text style={styles.logoutText}>Sign Out of Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ icon, label, onPress, right, showArrow }) {
  const Component = onPress ? TouchableOpacity : View;
  return (
    <Component style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {right ? right : null}
      {showArrow && !right ? (
        <Ionicons name="chevron-forward" size={18} color={colors.border} />
      ) : null}
    </Component>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { fontSize: 24, ...fonts.bold, color: colors.text },
  subtitle: { fontSize: 13, ...fonts.medium, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { 
    fontSize: 13, 
    ...fonts.bold, 
    color: colors.textMuted, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowLabel: {
    fontSize: 15,
    ...fonts.bold,
    color: colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: radius.md,
    height: 50,
    marginTop: spacing.xl,
  },
  logoutText: {
    fontSize: 15,
    ...fonts.bold,
    color: colors.danger,
  },
});
