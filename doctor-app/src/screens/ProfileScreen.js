// The logged-in doctor's own profile: specialty, fee, rating, and weekly availability.
// Data comes from GET /api/me/doctor-profile (added in the backend for the doctor app).

import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import api from '../config/api';
import { useAuth } from '../store/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import { colors, radius, spacing } from '../config/theme';
import { dayName, shortTime } from '../utils/helpers';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reload the profile each time the tab comes into focus, so things like a
  // newly-approved "verified" badge show up without restarting the app.
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
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  // Sort availability by weekday so it reads Mon → Sun nicely.
  const availabilities = (profile?.availabilities || [])
    .slice()
    .sort((a, b) => a.day_of_week - b.day_of_week);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.md }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{(user?.name || profile?.name || '?').charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{profile?.name || user?.name}</Text>
        <Text style={styles.specialty}>{profile?.specialty?.name || 'General'}</Text>
        {profile?.is_verified ? (
          <View style={styles.verified}>
            <Ionicons name="checkmark-circle" size={16} color={colors.statusCompleted} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        ) : (
          <Text style={styles.pending}>Pending verification</Text>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Stat icon="cash" label="Fee" value={profile ? `$${profile.consultation_fee}` : '—'} />
        <Stat icon="briefcase" label="Experience" value={profile ? `${profile.experience_years} yrs` : '—'} />
        <Stat icon="star" label="Rating" value={profile ? profile.rating : '—'} />
      </View>

      {/* Contact (from the logged-in user) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact</Text>
        <Row icon="mail" text={user?.email || '—'} />
        {user?.phone ? <Row icon="call" text={user.phone} /> : null}
      </View>

      {/* Availability */}
      <Text style={styles.sectionTitle}>Weekly availability</Text>
      {availabilities.length === 0 ? (
        <Text style={styles.muted}>No availability set.</Text>
      ) : (
        availabilities.map((a) => (
          <View key={a.id} style={styles.availRow}>
            <Text style={styles.availDay}>{dayName(a.day_of_week)}</Text>
            <Text style={styles.availTime}>
              {shortTime(a.start_time)} - {shortTime(a.end_time)}  •  {a.slot_duration_minutes} min slots
            </Text>
          </View>
        ))
      )}

      <PrimaryButton title="Log out" onPress={logout} style={{ marginTop: spacing.xl }} />
    </ScrollView>
  );
}

function Stat({ icon, label, value }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={20} color={colors.primary} />
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
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
  },
  avatarLetter: { fontSize: 36, fontWeight: '700', color: colors.primary },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  specialty: { fontSize: 15, color: colors.textMuted, marginTop: 2 },
  verified: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  verifiedText: { color: colors.statusCompleted, marginLeft: 4, fontWeight: '600' },
  pending: { color: colors.statusPending, marginTop: 6, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: colors.primaryLight, borderRadius: radius.md,
    paddingVertical: spacing.md, marginBottom: spacing.lg,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4 },
  statLabel: { fontSize: 12, color: colors.textMuted },
  card: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  rowText: { fontSize: 15, color: colors.text, marginLeft: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  muted: { color: colors.textMuted },
  availRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  availDay: { fontSize: 15, fontWeight: '600', color: colors.text },
  availTime: { fontSize: 13, color: colors.textMuted },
});
