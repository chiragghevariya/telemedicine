// A small colored pill showing an appointment's status.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../config/theme';

// Map each status to its color.
const STATUS_COLORS = {
  pending: colors.statusPending,
  confirmed: colors.statusConfirmed,
  completed: colors.statusCompleted,
  cancelled: colors.statusCancelled,
};

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || colors.textMuted;

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{String(status).toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  text: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
