// Shows one doctor's full profile and a "Book Appointment" button.

import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../config/api';
import PrimaryButton from '../components/PrimaryButton';
import { colors, radius, spacing } from '../config/theme';

export default function DoctorProfileScreen({ route, navigation }) {
  const { doctorId } = route.params ?? {};

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/doctors/${doctorId}`)
      .then((res) => setDoctor(res.data.data))
      .catch(() => setDoctor(null))
      .finally(() => setLoading(false));
  }, [doctorId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textMuted }}>Doctor not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {/* Header: avatar + name + specialty */}
        <View style={styles.header}>
          {doctor.avatar ? (
            <Image source={{ uri: doctor.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarLetter}>{(doctor.name || '?').charAt(0)}</Text>
            </View>
          )}
          <Text style={styles.name}>{doctor.name}</Text>
          <Text style={styles.specialty}>{doctor.specialty?.name || 'General'}</Text>
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <Stat icon="star" label="Rating" value={doctor.rating} />
          <Stat icon="briefcase" label="Experience" value={`${doctor.experience_years} yrs`} />
          <Stat icon="cash" label="Fee" value={`$${doctor.consultation_fee}`} />
        </View>

        {/* About */}
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.bio}>{doctor.bio || 'No bio provided.'}</Text>
      </ScrollView>

      {/* Sticky book button */}
      <View style={styles.footer}>
        <PrimaryButton
          title="Book Appointment"
          onPress={() => navigation.navigate('Booking', { doctor })}
        />
      </View>
    </View>
  );
}

// One stat box (rating / experience / fee).
function Stat({ icon, label, value }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: spacing.md },
  avatarPlaceholder: { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 40, fontWeight: '700', color: colors.primary },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  specialty: { fontSize: 15, color: colors.textMuted, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 4 },
  statLabel: { fontSize: 12, color: colors.textMuted },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  bio: { fontSize: 15, color: colors.text, lineHeight: 22 },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
});
