// Modern, premium appointment card with left avatar and clean details.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import { colors, fonts, radius, spacing } from '../config/theme';
import { shortTime } from '../utils/helpers';

export default function AppointmentCard({ appointment, onPress }) {
  const patientInit = (appointment.patient?.name || 'P').charAt(0).toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.content}>
        {/* Left Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{patientInit}</Text>
        </View>

        {/* Middle Info */}
        <View style={styles.middle}>
          <Text style={styles.patient}>{appointment.patient?.name || 'Patient'}</Text>
          <View style={styles.timeRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.meta}>{appointment.appointment_date}</Text>
          </View>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={styles.meta}>{shortTime(appointment.start_time)} - {shortTime(appointment.end_time)}</Text>
          </View>
        </View>

        {/* Right Badge / Arrow */}
        <View style={styles.right}>
          <StatusBadge status={appointment.status} />
          <Ionicons name="chevron-forward" size={18} color={colors.border} style={{ marginTop: spacing.sm }} />
        </View>
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
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
  middle: {
    flex: 1,
  },
  patient: {
    fontSize: 16,
    ...fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  meta: {
    fontSize: 13,
    ...fonts.medium,
    color: colors.textMuted,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: spacing.sm,
  },
});
