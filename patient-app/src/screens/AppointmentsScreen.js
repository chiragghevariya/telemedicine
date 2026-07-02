// Lists the patient's appointments, split into "Upcoming" and "Past" tabs.
import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import api from '../config/api';
import StatusBadge from '../components/StatusBadge';
import { colors, fonts, radius, spacing } from '../config/theme';
import { shortTime, errorMessage } from '../utils/helpers';

const UPCOMING = ['pending', 'confirmed'];

export default function AppointmentsScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [tab, setTab] = useState('upcoming'); // 'upcoming' | 'past'
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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const onCancel = (appointment) => {
    Alert.alert('Cancel appointment?', 'This action cannot be undone.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/appointments/${appointment.id}/cancel`);
            load();
          } catch (e) {
            Alert.alert('Error', errorMessage(e, 'Could not cancel the appointment.'));
          }
        },
      },
    ]);
  };

  const visible = appointments.filter((a) =>
    tab === 'upcoming' ? UPCOMING.includes(a.status) : !UPCOMING.includes(a.status)
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Consultations</Text>
        <Text style={styles.subtitle}>Check upcoming visits and past prescriptions</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabsContainer}>
        <TabButton label="Upcoming Visits" active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <TabButton label="Past Records" active={tab === 'past'} onPress={() => setTab('past')} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-clear-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No {tab} appointments.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              onJoin={async () => {
                try {
                  const res = await api.post('/calls/initiate', {
                    receiver_id: item.doctor.user_id,
                    appointment_id: item.id,
                  });
                  navigation.navigate('VideoCall', {
                    channelName: res.data.channel_name,
                    token: res.data.agora_token,
                    callId: res.data.call.id,
                  });
                } catch (err) {
                  console.error('Failed to initiate video call:', err);
                  navigation.navigate('VideoCall', {
                    channelName: item.agora_channel_name,
                    token: item.agora_token,
                  });
                }
              }}
              onCancel={() => onCancel(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function AppointmentCard({ appointment, onJoin, onCancel }) {
  const canAct = ['pending', 'confirmed'].includes(appointment.status);
  
  const displayName = appointment.doctor?.name || 'Doctor';
  const formattedDoctorName = displayName.toLowerCase().startsWith('dr.') ? displayName : `Dr. ${displayName}`;
  const doctorInit = displayName.replace(/^dr\.\s*/i, '').charAt(0).toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.cardMain}>
        {/* Left Side Doctor Initials Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{doctorInit}</Text>
        </View>

        {/* Middle Info */}
        <View style={styles.info}>
          <View style={styles.cardTop}>
            <Text style={styles.doctor} numberOfLines={1}>{formattedDoctorName}</Text>
            <StatusBadge status={appointment.status} />
          </View>

          <View style={styles.timeRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.meta}>{appointment.appointment_date}</Text>
          </View>
          
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.meta}>
              {shortTime(appointment.start_time)} - {shortTime(appointment.end_time)}
            </Text>
          </View>
        </View>
      </View>

      {/* Notes / Reason for Visit */}
      {appointment.notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesTitle}>Reason for visit:</Text>
          <Text style={styles.notesText}>{appointment.notes}</Text>
        </View>
      ) : null}

      {/* Prescription Log */}
      {appointment.prescription ? (
        <View style={styles.prescriptionBox}>
          <View style={styles.prescriptionHeader}>
            <Ionicons name="document-text-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.prescriptionLabel}>Prescription Notes</Text>
          </View>
          <Text style={styles.prescriptionText}>{appointment.prescription}</Text>
        </View>
      ) : null}

      {/* Actions */}
      {canAct && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.joinBtn]} onPress={onJoin} activeOpacity={0.8}>
            <Ionicons name="videocam" size={16} color={colors.white} style={{ marginRight: 6 }} />
            <Text style={styles.joinText}>Join Consultation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={onCancel} activeOpacity={0.8}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function TabButton({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress} activeOpacity={0.9}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { fontSize: 24, ...fonts.bold, color: colors.text },
  subtitle: { fontSize: 13, ...fonts.medium, color: colors.textMuted, marginTop: 2 },
  tabsContainer: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  tab: { 
    flex: 1, 
    paddingVertical: spacing.md - 2, 
    alignItems: 'center', 
    borderBottomWidth: 2, 
    borderBottomColor: 'transparent' 
  },
  tabActive: { 
    borderBottomColor: colors.primary 
  },
  tabText: { 
    fontSize: 14, 
    color: colors.textMuted, 
    ...fonts.semiBold 
  },
  tabTextActive: { 
    color: colors.primary, 
    ...fonts.bold 
  },
  listContent: { 
    paddingHorizontal: spacing.lg, 
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    fontSize: 14,
    ...fonts.medium,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 18,
    ...fonts.bold,
    color: colors.primary,
  },
  info: {
    flex: 1,
  },
  cardTop: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginBottom: 4,
  },
  doctor: { fontSize: 16, ...fonts.bold, color: colors.text, flex: 1, marginRight: spacing.sm },
  timeRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginTop: 2,
  },
  meta: { fontSize: 13, ...fonts.medium, color: colors.textMuted },
  notesBox: {
    backgroundColor: '#FAFCFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  notesTitle: { fontSize: 12, ...fonts.bold, color: colors.textMuted },
  notesText: { fontSize: 13, ...fonts.medium, color: colors.text, marginTop: 2 },
  prescriptionBox: {
    marginTop: spacing.md,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  prescriptionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  prescriptionLabel: { fontSize: 13, ...fonts.bold, color: '#166534' },
  prescriptionText: { fontSize: 13, ...fonts.medium, color: '#14532D' },
  actions: { flexDirection: 'row', marginTop: spacing.md },
  actionBtn: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    height: 40, 
    borderRadius: radius.sm,
  },
  joinBtn: { 
    flex: 2, 
    backgroundColor: colors.primary, 
    marginRight: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  joinText: { color: colors.white, ...fonts.bold },
  cancelBtn: { 
    flex: 1, 
    borderWidth: 1.5, 
    borderColor: colors.danger,
    backgroundColor: colors.white,
  },
  cancelText: { color: colors.danger, ...fonts.bold },
});
