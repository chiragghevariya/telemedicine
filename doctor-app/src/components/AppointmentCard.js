// A tappable card summarizing one appointment (patient name, date/time, status).
// Used in the dashboard and the appointment list.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import { colors, radius, spacing } from '../config/theme';
import { shortTime } from '../utils/helpers';

export default function AppointmentCard({ appointment, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.top}>
        {/* The patient who booked this appointment. */}
        <Text style={styles.patient}>{appointment.patient?.name || 'Patient'}</Text>
        <StatusBadge status={appointment.status} />
      </View>

      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
        <Text style={styles.meta}>{appointment.appointment_date}</Text>
        <Ionicons name="time-outline" size={15} color={colors.textMuted} style={{ marginLeft: spacing.md }} />
        <Text style={styles.meta}>{shortTime(appointment.start_time)} - {shortTime(appointment.end_time)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  patient: { fontSize: 16, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center' },
  meta: { fontSize: 13, color: colors.textMuted, marginLeft: 4 },
});
