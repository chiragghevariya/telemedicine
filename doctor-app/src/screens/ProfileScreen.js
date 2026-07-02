// Premium, professional Doctor Profile Screen.
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import api from '../config/api';
import { useAuth } from '../store/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import { colors, fonts, radius, spacing } from '../config/theme';
import { dayName, shortTime } from '../utils/helpers';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      api.get('/me/doctor-profile')
        .then((res) => { if (mounted) setProfile(res.data.data); })
        .catch(() => { if (mounted) setProfile(null); })
        .finally(() => { if (mounted) setLoading(false); });
      return () => { mounted = false; };
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const availabilities = (profile?.availabilities || [])
    .slice()
    .sort((a, b) => a.day_of_week - b.day_of_week);

  const displayName = profile?.name || user?.name || '';
  const formattedName = displayName.toLowerCase().startsWith('dr.') ? displayName : `Dr. ${displayName}`;

  const doctorInitials = displayName
    .split(' ')
    .filter((n) => n.toLowerCase() !== 'dr.' && n.toLowerCase() !== 'dr')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'Dr';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{doctorInitials}</Text>
          </View>
          <Text style={styles.name}>{formattedName}</Text>
          <Text style={styles.specialty}>{profile?.specialty?.name || 'General Practitioner'}</Text>
          {profile?.is_verified ? (
            <View style={styles.verified}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={styles.verifiedText}>Verified Doctor</Text>
            </View>
          ) : (
            <View style={styles.pending}>
              <Ionicons name="alert-circle" size={16} color={colors.statusPending} />
              <Text style={styles.pendingText}>Pending Verification</Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <Stat icon="cash" label="Consult" value={profile ? `$${profile.consultation_fee}` : '—'} />
          <Stat icon="briefcase" label="Experience" value={profile ? `${profile.experience_years} yrs` : '—'} />
          <Stat icon="star" label="Rating" value={profile ? `${profile.rating} ★` : '—'} />
        </View>

        {/* Contact Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <Row icon="mail" text={user?.email || '—'} />
          {user?.phone ? <Row icon="call" text={user.phone} /> : null}
        </View>

        {/* Weekly Availability Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Weekly Availability</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AvailabilityEditor')}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>

          {availabilities.length === 0 ? (
            <Text style={styles.muted}>No availability schedule configured yet.</Text>
          ) : (
            availabilities.map((a) => (
              <View key={a.id} style={styles.availRow}>
                <View style={styles.dayCol}>
                  <Text style={styles.availDay}>{dayName(a.day_of_week)}</Text>
                </View>
                <View style={styles.timeCol}>
                  <Text style={styles.availTime}>
                    {shortTime(a.start_time)} - {shortTime(a.end_time)}
                  </Text>
                  <Text style={styles.availDuration}>
                    {a.slot_duration_minutes} min duration
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <PrimaryButton 
            title="Edit Availability" 
            onPress={() => navigation.navigate('AvailabilityEditor')} 
            style={styles.editBtn}
          />
          <PrimaryButton 
            title="Log Out of Portal" 
            onPress={logout} 
            style={styles.logoutBtn}
            textStyle={styles.logoutText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ icon, label, value }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statIconBadge}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Row({ icon, text }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  scrollContent: { 
    paddingHorizontal: spacing.lg, 
    paddingTop: spacing.md, 
    paddingBottom: spacing.xxl 
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarLetter: { fontSize: 32, ...fonts.bold, color: colors.primary },
  name: { fontSize: 22, ...fonts.bold, color: colors.text },
  specialty: { fontSize: 15, ...fonts.medium, color: colors.textMuted, marginTop: 4 },
  verified: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill },
  verifiedText: { color: colors.success, marginLeft: 4, fontSize: 13, ...fonts.bold },
  pending: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill },
  pendingText: { color: colors.statusPending, marginLeft: 4, fontSize: 13, ...fonts.bold },
  statsRow: {
    flexDirection: 'row', 
    justifyContent: 'space-around',
    backgroundColor: colors.card, 
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md, 
    marginBottom: spacing.lg,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  stat: { flex: 1, alignItems: 'center' },
  statIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: { fontSize: 16, ...fonts.bold, color: colors.text, marginTop: 4 },
  statLabel: { fontSize: 12, color: colors.textMuted },
  card: {
    backgroundColor: colors.card, 
    borderWidth: 1, 
    borderColor: colors.border,
    borderRadius: radius.md, 
    padding: spacing.md, 
    marginBottom: spacing.md,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  editLink: { fontSize: 14, ...fonts.bold, color: colors.primary },
  cardTitle: { fontSize: 14, ...fonts.bold, color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rowText: { fontSize: 15, ...fonts.medium, color: colors.text, marginLeft: 8 },
  muted: { color: colors.textMuted },
  availRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: spacing.sm, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border,
  },
  dayCol: { width: 100 },
  availDay: { fontSize: 15, ...fonts.semiBold, color: colors.text },
  timeCol: { flex: 1, alignItems: 'flex-end' },
  availTime: { fontSize: 14, ...fonts.bold, color: colors.text },
  availDuration: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  actions: { marginTop: spacing.md },
  editBtn: { marginBottom: spacing.sm },
  logoutBtn: { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.danger, shadowOpacity: 0, elevation: 0 },
  logoutText: { color: colors.danger },
});
