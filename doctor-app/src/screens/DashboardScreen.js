// Premium, professional Doctor Dashboard Screen.
import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import api from '../config/api';
import { useAuth } from '../store/AuthContext';
import { colors, fonts, radius, spacing } from '../config/theme';
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

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // Calculate statistics
  const today = todayString();
  const weekEnd = daysFromToday(6);
  const notCancelled = (a) => a.status !== 'cancelled';

  const todayCount = appointments.filter((a) => a.appointment_date === today && notCancelled(a)).length;
  const weekCount = appointments.filter(
    (a) => UPCOMING.includes(a.status) && a.appointment_date >= today && a.appointment_date <= weekEnd
  ).length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;

  // Filter list of today's appointments
  const todayAppointments = appointments
    .filter((a) => a.appointment_date === today && notCancelled(a))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Get the next upcoming appointment
  const next = appointments
    .filter((a) => UPCOMING.includes(a.status) && a.appointment_date >= today)
    .sort((a, b) =>
      (a.appointment_date + a.start_time).localeCompare(b.appointment_date + b.start_time)
    )[0];

  // Derive recent unique patients
  const seenPatientIds = new Set();
  const recentPatients = [];
  appointments.forEach(a => {
    if (a.patient && !seenPatientIds.has(a.patient.id)) {
      seenPatientIds.add(a.patient.id);
      recentPatients.push(a.patient);
    }
  });

  const handleJoinCall = async (appt) => {
    try {
      const res = await api.post('/calls/initiate', {
        receiver_id: appt.patient.id,
        appointment_id: appt.id,
      });
      navigation.navigate('VideoCall', {
        channelName: res.data.channel_name,
        token: res.data.agora_token,
        callId: res.data.call.id,
      });
    } catch (err) {
      console.error('Failed to initiate video call:', err);
      // Fallback
      navigation.navigate('VideoCall', {
        channelName: appt.agora_channel_name,
        token: appt.agora_token,
      });
    }
  };

  const displayName = user?.name || 'Doctor';
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
      
      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning,</Text>
          <Text style={styles.doctorName}>{formattedName}</Text>
        </View>
        <TouchableOpacity style={styles.profileIndicator} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.avatarInitials}>
            {doctorInitials}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Statistics section */}
        <View style={styles.statsRow}>
          <StatCard label="Today" value={todayCount} icon="today" color="#E8F2FF" iconColor={colors.primary} />
          <StatCard label="This Week" value={weekCount} icon="calendar" color="#E6F9F8" iconColor={colors.secondary} />
          <StatCard label="Completed" value={completedCount} icon="checkmark-done" color="#EAF6ED" iconColor={colors.success} />
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <ActionButton 
            label="Appointments" 
            icon="calendar-outline" 
            color="#E8F2FF" 
            textColor={colors.primary}
            onPress={() => navigation.navigate('Appointments')} 
          />
          <ActionButton 
            label="My Schedule" 
            icon="time-outline" 
            color="#E6F9F8" 
            textColor={colors.secondary}
            onPress={() => navigation.navigate('AvailabilityEditor')} 
          />
          <ActionButton 
            label="My Profile" 
            icon="person-outline" 
            color="#FFF2E8" 
            textColor="#E76F51"
            onPress={() => navigation.navigate('Profile')} 
          />
        </View>

        {/* Next Appointment Hero Card */}
        {next && (
          <View style={styles.heroSection}>
            <Text style={styles.sectionTitle}>Up Next</Text>
            <View style={styles.nextHeroCard}>
              <View style={styles.heroHeader}>
                <View style={styles.patientAvatar}>
                  <Text style={styles.avatarText}>{(next.patient?.name || 'P').charAt(0)}</Text>
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.heroPatientName}>{next.patient?.name || 'Patient'}</Text>
                  <Text style={styles.heroPatientSub}>Video Consultation</Text>
                </View>
                <View style={styles.badge}>
                  <Ionicons name="time" size={14} color={colors.white} />
                  <Text style={styles.badgeText}>{shortTime(next.start_time)}</Text>
                </View>
              </View>

              <View style={styles.heroDivider} />

              <View style={styles.heroMetaRow}>
                <Ionicons name="calendar-outline" size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.heroMetaText}>{next.appointment_date}</Text>
                <View style={styles.verticalDivider} />
                <Ionicons name="medical-outline" size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.heroMetaText}>General Care</Text>
              </View>

              <View style={styles.heroActions}>
                <TouchableOpacity style={styles.heroJoinBtn} onPress={() => handleJoinCall(next)}>
                  <Ionicons name="videocam" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.heroJoinText}>Start Consultation</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.heroDetailBtn} 
                  onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: next.id })}
                >
                  <Text style={styles.heroDetailText}>Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Today's Schedule List */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {todayAppointments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-clear-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>No appointments scheduled for today.</Text>
            </View>
          ) : (
            todayAppointments.map((appt) => (
              <View key={appt.id} style={styles.apptItem}>
                <View style={styles.apptTimeCol}>
                  <Text style={styles.apptTime}>{shortTime(appt.start_time)}</Text>
                  <Text style={styles.apptTimeMuted}>30m</Text>
                </View>
                <View style={styles.apptCard}>
                  <View style={styles.apptCardMain}>
                    <Text style={styles.apptPatientName}>{appt.patient?.name}</Text>
                    <Text style={styles.apptType}>Video Visit</Text>
                  </View>
                  <TouchableOpacity 
                    style={[
                      styles.apptJoinIcon,
                      appt.status === 'completed' && styles.apptCompletedBadge
                    ]} 
                    onPress={() => {
                      if (appt.status !== 'completed') {
                        handleJoinCall(appt);
                      } else {
                        navigation.navigate('AppointmentDetail', { appointmentId: appt.id });
                      }
                    }}
                  >
                    <Ionicons 
                      name={appt.status === 'completed' ? 'checkmark' : 'videocam'} 
                      size={20} 
                      color={appt.status === 'completed' ? colors.success : colors.white} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recent Patients */}
        {recentPatients.length > 0 && (
          <View style={styles.patientsSection}>
            <Text style={styles.sectionTitle}>Recent Patients</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.patientsScroll}>
              {recentPatients.map((patient) => (
                <View key={patient.id} style={styles.patientAvatarCard}>
                  <View style={styles.patientItemAvatar}>
                    <Text style={styles.patientAvatarText}>{(patient.name || 'P').charAt(0)}</Text>
                  </View>
                  <Text style={styles.patientItemName} numberOfLines={1}>{patient.name.split(' ')[0]}</Text>
                  <Text style={styles.patientItemMuted}>Patient</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, icon, color, iconColor }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBadge, { backgroundColor: color }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({ label, icon, color, textColor, onPress }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
      <View style={[styles.actionIconBadge, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color={textColor} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: { fontSize: 13, ...fonts.medium, color: colors.textMuted },
  doctorName: { fontSize: 20, ...fonts.bold, color: colors.text, marginTop: 2 },
  profileIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  avatarInitials: { color: colors.white, fontSize: 16, ...fonts.semiBold },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  statIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: { fontSize: 24, ...fonts.bold, color: colors.text, marginTop: 4 },
  statLabel: { fontSize: 12, ...fonts.medium, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { 
    fontSize: 18, 
    ...fonts.bold, 
    color: colors.text, 
    marginHorizontal: spacing.lg, 
    marginTop: spacing.xl, 
    marginBottom: spacing.sm 
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginHorizontal: 4,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  actionIconBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionLabel: { fontSize: 13, ...fonts.semiBold, color: colors.text },
  heroSection: { paddingHorizontal: spacing.md },
  nextHeroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
    marginHorizontal: 4,
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center' },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, ...fonts.bold, color: colors.white },
  patientInfo: { flex: 1, marginLeft: spacing.md },
  heroPatientName: { fontSize: 18, ...fonts.bold, color: colors.white },
  heroPatientSub: { fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 12, ...fonts.bold, color: colors.white, marginLeft: 4 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.15)', marginVertical: spacing.md },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center' },
  heroMetaText: { fontSize: 14, ...fonts.medium, color: 'rgba(255, 255, 255, 0.9)', marginLeft: 6 },
  verticalDivider: { width: 1, height: 16, backgroundColor: 'rgba(255, 255, 255, 0.3)', marginHorizontal: spacing.md },
  heroActions: { flexDirection: 'row', marginTop: spacing.lg },
  heroJoinBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.white, borderRadius: radius.md, height: 46,
    flex: 2, marginRight: spacing.sm,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  heroJoinText: { color: colors.primary, fontSize: 15, ...fonts.bold },
  heroDetailBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.4)', borderRadius: radius.md, height: 46,
  },
  heroDetailText: { color: colors.white, fontSize: 15, ...fonts.bold },
  listSection: { paddingHorizontal: spacing.lg },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: spacing.xl, marginBottom: spacing.sm },
  viewAllLink: { fontSize: 14, ...fonts.bold, color: colors.primary },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.xl,
  },
  emptyText: { fontSize: 14, ...fonts.medium, color: colors.textMuted, marginTop: spacing.md },
  apptItem: { flexDirection: 'row', marginBottom: spacing.md, alignItems: 'center' },
  apptTimeCol: { width: 60, marginRight: spacing.sm },
  apptTime: { fontSize: 15, ...fonts.bold, color: colors.text },
  apptTimeMuted: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  apptCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  apptCardMain: { flex: 1 },
  apptPatientName: { fontSize: 16, ...fonts.bold, color: colors.text },
  apptType: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  apptJoinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  apptCompletedBadge: {
    backgroundColor: '#EAF6ED',
    shadowOpacity: 0,
  },
  patientsSection: { marginTop: spacing.sm },
  patientsScroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  patientAvatarCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    width: 100,
    marginRight: spacing.md,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  patientItemAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  patientAvatarText: { fontSize: 18, ...fonts.bold, color: colors.secondary },
  patientItemName: { fontSize: 13, ...fonts.bold, color: colors.text, textAlign: 'center', marginTop: 4 },
  patientItemMuted: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
