// One appointment in full: patient info, join video call, and write/save the
// prescription (which marks the appointment "completed").

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../config/api';
import StatusBadge from '../components/StatusBadge';
import PrimaryButton from '../components/PrimaryButton';
import { colors, radius, spacing } from '../config/theme';
import { shortTime, errorMessage } from '../utils/helpers';

export default function AppointmentDetailScreen({ route, navigation }) {
  const { appointmentId } = route.params ?? {};

  const [appointment, setAppointment] = useState(null);
  const [prescription, setPrescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load the appointment details.
  const load = useCallback(async () => {
    if (!appointmentId) { setLoading(false); return; } // no id passed -> nothing to load
    try {
      const res = await api.get(`/appointments/${appointmentId}`);
      setAppointment(res.data.data);
      setPrescription(res.data.data.prescription || ''); // prefill if already written
    } catch (e) {
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => { load(); }, [load]);

  // Save the prescription. NOTE: the backend route is POST (the brief said PUT,
  // but Phase 2 implemented it as POST /api/appointments/{id}/complete).
  // This call also sets the appointment's status to "completed".
  const onSave = async () => {
    if (!prescription.trim()) {
      Alert.alert('Prescription needed', 'Please write the prescription before saving.');
      return;
    }
    try {
      setSaving(true);
      const res = await api.post(`/appointments/${appointmentId}/complete`, {
        prescription: prescription.trim(),
      });
      setAppointment(res.data.data);
      Alert.alert('Saved', 'Prescription saved and appointment marked completed.');
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e, 'Failed to save the prescription.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }
  if (!appointment) {
    return <View style={styles.center}><Text style={{ color: colors.textMuted }}>Appointment not found.</Text></View>;
  }

  // Only a pending/confirmed appointment can be completed. A completed or
  // cancelled one is final, so the prescription becomes read-only.
  const isEditable = appointment.status === 'pending' || appointment.status === 'confirmed';

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.md }}>
      {/* Status */}
      <View style={styles.statusRow}>
        <Text style={styles.sectionTitle}>Status</Text>
        <StatusBadge status={appointment.status} />
      </View>

      {/* Patient info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Patient</Text>
        <Row icon="person" text={appointment.patient?.name || '—'} />
        <Row icon="mail" text={appointment.patient?.email || '—'} />
      </View>

      {/* Date & time */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>When</Text>
        <Row icon="calendar" text={appointment.appointment_date} />
        <Row icon="time" text={`${shortTime(appointment.start_time)} - ${shortTime(appointment.end_time)}`} />
      </View>

      {/* Patient's notes (their reason for the visit) */}
      {appointment.notes ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patient notes</Text>
          <Text style={styles.notes}>{appointment.notes}</Text>
        </View>
      ) : null}

      {/* Join video call */}
      <PrimaryButton
        title="Join Video Call"
        onPress={() => navigation.navigate('VideoCall', { channelName: appointment.agora_channel_name })}
        style={{ marginVertical: spacing.md }}
      />

      {/* Prescription */}
      <Text style={styles.sectionTitle}>Prescription</Text>
      <TextInput
        style={styles.prescription}
        placeholder="Write the prescription here..."
        placeholderTextColor={colors.textMuted}
        value={prescription}
        onChangeText={setPrescription}
        editable={isEditable}
        multiline
      />

      {isEditable ? (
        <>
          <Text style={styles.helper}>Saving the prescription marks this appointment as completed.</Text>
          <PrimaryButton title="Save Prescription" onPress={onSave} loading={saving} />
        </>
      ) : (
        <Text style={styles.muted}>
          {appointment.status === 'completed'
            ? 'This appointment is completed — the prescription above is final.'
            : "This appointment was cancelled, so it can't be completed."}
        </Text>
      )}
    </ScrollView>
  );
}

// A small icon + text row.
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
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  rowText: { fontSize: 15, color: colors.text, marginLeft: 8 },
  notes: { fontSize: 15, color: colors.text, lineHeight: 21 },
  prescription: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
    color: colors.text,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  helper: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },
  muted: { color: colors.textMuted, marginTop: spacing.sm },
});
