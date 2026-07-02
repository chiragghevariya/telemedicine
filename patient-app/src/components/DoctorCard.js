// A tappable card showing a doctor's summary.
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../config/theme';

export default function DoctorCard({ doctor, onPress }) {
  const doctorInit = (doctor.name || '?').replace(/^dr\.\s*/i, '').charAt(0).toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {doctor.avatar ? (
        <Image source={{ uri: doctor.avatar }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarLetter}>{doctorInit}</Text>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name}>{doctor.name}</Text>
        <Text style={styles.specialty}>{doctor.specialty?.name || 'General Practitioner'}</Text>

        <View style={styles.row}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={13} color="#D97706" style={{ marginRight: 2 }} />
            <Text style={styles.ratingText}>{Number(doctor.rating).toFixed(1)}</Text>
          </View>
          <View style={styles.feeBadge}>
            <Text style={styles.feeText}>${doctor.consultation_fee}</Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.border} />
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
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 20,
    ...fonts.bold,
    color: colors.primary,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    ...fonts.bold,
    color: colors.text,
  },
  specialty: {
    fontSize: 13,
    ...fonts.medium,
    color: colors.textMuted,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  ratingText: {
    fontSize: 12,
    ...fonts.bold,
    color: '#B45309',
  },
  feeBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  feeText: {
    fontSize: 12,
    ...fonts.bold,
    color: colors.primary,
  },
});
