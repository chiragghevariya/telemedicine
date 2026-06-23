// A tappable card showing a doctor's summary (used in lists & the home screen).

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../config/theme';

export default function DoctorCard({ doctor, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Avatar, or a placeholder circle with the first letter of the name. */}
      {doctor.avatar ? (
        <Image source={{ uri: doctor.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarLetter}>{(doctor.name || '?').charAt(0)}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name}>{doctor.name}</Text>
        <Text style={styles.specialty}>{doctor.specialty?.name || 'General'}</Text>

        <View style={styles.row}>
          <Ionicons name="star" size={14} color={colors.statusPending} />
          <Text style={styles.meta}>{doctor.rating}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.meta}>${doctor.consultation_fee}</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  specialty: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  meta: {
    fontSize: 13,
    color: colors.text,
    marginLeft: 4,
  },
  dot: {
    marginHorizontal: 6,
    color: colors.textMuted,
  },
});
