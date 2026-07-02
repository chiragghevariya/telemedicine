// Shows one doctor's full profile and a "Book Appointment" button.
import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../config/api';
import PrimaryButton from '../components/PrimaryButton';
import { colors, fonts, radius, spacing } from '../config/theme';

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

  const displayName = doctor.name || '';
  const formattedName = displayName.toLowerCase().startsWith('dr.') ? displayName : `Dr. ${displayName}`;
  const doctorInit = displayName.replace(/^dr\.\s*/i, '').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            {doctor.avatar ? (
              <Image source={{ uri: doctor.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarLetter}>{doctorInit}</Text>
              </View>
            )}
            <Text style={styles.name}>{formattedName}</Text>
            <Text style={styles.specialty}>{doctor.specialty?.name || 'General Practitioner'}</Text>
          </View>

          {/* Quick stats grid */}
          <View style={styles.statsRow}>
            <Stat icon="star" label="Rating" value={Number(doctor.rating).toFixed(1)} iconColor="#D97706" bg="#FEF3C7" />
            <Stat icon="briefcase" label="Experience" value={`${doctor.experience_years} yrs`} iconColor={colors.primary} bg={colors.primaryLight} />
            <Stat icon="cash" label="Consult Fee" value={`$${doctor.consultation_fee}`} iconColor="#00BAB3" bg="#E0F8F7" />
          </View>

          {/* About */}
          <View style={styles.aboutCard}>
            <Text style={styles.sectionTitle}>About Doctor</Text>
            <Text style={styles.bio}>{doctor.bio || 'No bio details provided by the doctor.'}</Text>
          </View>
        </ScrollView>

        {/* Sticky book button */}
        <View style={styles.footer}>
          <PrimaryButton
            title="Book Appointment Slot"
            onPress={() => navigation.navigate('Booking', { doctor })}
            style={styles.bookBtn}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Stat({ icon, label, value, iconColor, bg }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIconBadge, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: spacing.md,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarPlaceholder: { 
    backgroundColor: colors.primaryLight, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  avatarLetter: { 
    fontSize: 32, 
    ...fonts.bold, 
    color: colors.primary 
  },
  name: { fontSize: 22, ...fonts.bold, color: colors.text },
  specialty: { fontSize: 15, ...fonts.medium, color: colors.textMuted, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  stat: { flex: 1, alignItems: 'center' },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: { fontSize: 15, ...fonts.bold, color: colors.text, marginTop: 4 },
  statLabel: { fontSize: 12, ...fonts.medium, color: colors.textMuted, marginTop: 2 },
  aboutCard: {
    backgroundColor: '#FAFCFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionTitle: { 
    fontSize: 15, 
    ...fonts.bold, 
    color: colors.text, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5,
    marginBottom: spacing.sm 
  },
  bio: { fontSize: 14, ...fonts.medium, color: colors.text, lineHeight: 22 },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  bookBtn: {
    height: 50,
  },
});
