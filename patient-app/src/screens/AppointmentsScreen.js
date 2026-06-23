// Lists the patient's appointments, split into "Upcoming" and "Past" tabs.
// Upcoming appointments can be joined (video call) or cancelled.

import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import api from '../config/api';
import StatusBadge from '../components/StatusBadge';
import { colors, radius, spacing } from '../config/theme';
import { shortTime, errorMessage } from '../utils/helpers';

// Which statuses count as "upcoming" vs "past".
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

  // Reload every time this tab comes into focus (e.g. after booking).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // Cancel an appointment (with a confirmation prompt).
  const onCancel = (appointment) => {
    Alert.alert('Cancel appointment?', 'This cannot be undone.', [
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

  // Filter by the active tab.
  const visible = appointments.filter((a) =>
    tab === 'upcoming' ? UPCOMING.includes(a.status) : !UPCOMING.includes(a.status)
  );

  return (
    <View style={styles.screen}>
      {/* Tab switcher */}
      <View style={styles.tabs}>
        <TabButton label="Upcoming" active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <TabButton label="Past" active={tab === 'past'} onPress={() => setTab('past')} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.empty}>No {tab} appointments.</Text>}
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              onJoin={() => navigation.navigate('VideoCall', { channelName: item.agora_channel_name })}
              onCancel={() => onCancel(item)}
            />
          )}
        />
      )}
    </View>
  );
}

// One appointment card.
function AppointmentCard({ appointment, onJoin, onCancel }) {
  const canAct = ['pending', 'confirmed'].includes(appointment.status);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.doctor}>{appointment.doctor?.name || 'Doctor'}</Text>
        <StatusBadge status={appointment.status} />
      </View>

      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
        <Text style={styles.meta}>{appointment.appointment_date}</Text>
        <Ionicons name="time-outline" size={16} color={colors.textMuted} style={{ marginLeft: spacing.md }} />
        <Text style={styles.meta}>{shortTime(appointment.start_time)} - {shortTime(appointment.end_time)}</Text>
      </View>

      {/* Show the prescription on completed appointments. */}
      {appointment.prescription ? (
        <View style={styles.prescription}>
          <Text style={styles.prescriptionLabel}>Prescription</Text>
          <Text style={styles.prescriptionText}>{appointment.prescription}</Text>
        </View>
      ) : null}

      {/* Actions for upcoming appointments */}
      {canAct ? (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.joinBtn]} onPress={onJoin}>
            <Ionicons name="videocam" size={16} color={colors.white} />
            <Text style={styles.joinText}>Join Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function TabButton({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  doctor: { fontSize: 16, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center' },
  meta: { fontSize: 13, color: colors.textMuted, marginLeft: 4 },
  prescription: {
    marginTop: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  prescriptionLabel: { fontSize: 12, fontWeight: '700', color: colors.primary },
  prescriptionText: { fontSize: 13, color: colors.text, marginTop: 2 },
  actions: { flexDirection: 'row', marginTop: spacing.md },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.sm, borderRadius: radius.sm,
  },
  joinBtn: { flex: 1, backgroundColor: colors.primary, marginRight: spacing.sm },
  joinText: { color: colors.white, fontWeight: '700', marginLeft: 6 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.danger },
  cancelText: { color: colors.danger, fontWeight: '700' },
});
