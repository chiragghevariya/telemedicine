// Modern, translucent status badge.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../config/theme';

const STATUS_THEMES = {
  pending: { bg: '#FFFBEB', text: '#D97706' },
  confirmed: { bg: '#E0F8F7', text: '#008B8B' },
  completed: { bg: '#DEF7EC', text: '#03543F' },
  cancelled: { bg: '#FDF2F2', text: '#9B1C1C' },
};

export default function StatusBadge({ status }) {
  const theme = STATUS_THEMES[status] || { bg: '#F3F4F6', text: '#374151' };

  return (
    <View style={[styles.badge, { backgroundColor: theme.bg }]}>
      <Text style={[styles.text, { color: theme.text }]}>
        {String(status).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    ...fonts.bold,
    letterSpacing: 0.5,
  },
});
