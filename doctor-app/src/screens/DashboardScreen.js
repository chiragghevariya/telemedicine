// Doctor dashboard: today's count, the next appointment, and a weekly summary.

import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import api from '../config/api';
import { useAuth } from '../store/AuthContext';
import { colors, radius, spacing } from '../config/theme';
import { shortTime, todayString, daysFromToday } from '../utils/helpers';

const UPCOMING = ['pending', 'confirmed'];

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.data);
    } catch (e) {
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload whenever the dashboard comes into focus.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  // ---- Work out the numbers ----
  const today = todayString();
  const weekEnd = daysFromToday(6); // today + the next 6 days = a 7-day window

  const notCancelled = (a) => a.status !== 'cancelled';

  const todayCount = appointments.filter((a) => a.appointment_date === today && notCancelled(a)).length;
  // "This week" = upcoming workload (pending/confirmed) within the next 7 days,
  // so it reads as "appointments still to do", not past completed ones.
  const weekCount = appointments.filter(
    (a) => UPCOMING.includes(a.status) && a.appointment_date >= today && a.appointment_date <= weekEnd
  ).length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  // The next upcoming appointment (soonest pending/confirmed from today onward).
  const next = appointments
    .filter((a) => UPCOMING.includes(a.status) && a.appointment_date >= today)
    .sort((a, b) =>
      (a.appointment_date + a.start_time).localeCompare(b.appointment_date + b.start_time)
    )[0];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ padding: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <Text style={styles.hello}>Welcome{user?.name ? `, ${user.name}` : ''} 👋</Text>

      {/* Summary stat cards */}
      <View style={styles.stats}>
        <StatCard label="Today" value={todayCount} icon="today" />
        <StatCard label="This Week" value={weekCount} icon="calendar" />
        <StatCard label="Completed" value={completedCount} icon="checkmark-done" />
      </View>

      {/* Next appointment */}
      <Text style={styles.sectionTitle}>Next appointment</Text>
      {next ? (
        <View style={styles.nextCard}>
          <Text style={styles.nextPatient}>{next.patient?.name || 'Patient'}</Text>
          <View style={styles.nextRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.white} />
            <Text style={styles.nextMeta}>{next.appointment_date}</Text>
            <Ionicons name="time-outline" size={16} color={colors.white} style={{ marginLeft: spacing.md }} />
            <Text style={styles.nextMeta}>{shortTime(next.start_time)}</Text>
          </View>

          <View style={styles.nextActions}>
            <TouchableOpacity
              style={styles.joinBtn}
              onPress={() => navigation.navigate('VideoCall', { channelName: next.agora_channel_name })}
            >
              <Ionicons name="videocam" size={16} color={colors.primary} />
              <Text style={styles.joinText}>Join Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.detailBtn}
              onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: next.id })}
            >
              <Text style={styles.detailText}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.muted}>No upcoming appointments.</Text>
      )}

      <TouchableOpacity style={styles.viewAll} onPress={() => navigation.navigate('Appointments')}>
        <Text style={styles.viewAllText}>View all appointments</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  hello: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 4 },
  statLabel: { fontSize: 12, color: colors.textMuted },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  muted: { color: colors.textMuted },
  nextCard: { backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md },
  nextPatient: { fontSize: 18, fontWeight: '800', color: colors.white },
  nextRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  nextMeta: { color: colors.white, marginLeft: 4 },
  nextActions: { flexDirection: 'row', marginTop: spacing.md },
  joinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white, borderRadius: radius.sm, paddingVertical: spacing.sm,
    flex: 1, marginRight: spacing.sm,
  },
  joinText: { color: colors.primary, fontWeight: '700', marginLeft: 6 },
  detailBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.white, borderRadius: radius.sm, paddingVertical: spacing.sm,
  },
  detailText: { color: colors.white, fontWeight: '700' },
  viewAll: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  viewAllText: { color: colors.primary, fontWeight: '600', marginRight: 6 },
});
