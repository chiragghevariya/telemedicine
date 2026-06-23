// Home tab: greeting, search bar, specialty grid (6), and featured doctors.

import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../config/api';
import { useAuth } from '../store/AuthContext';
import DoctorCard from '../components/DoctorCard';
import { colors, radius, spacing } from '../config/theme';
import { specialtyEmoji } from '../utils/helpers';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();

  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Add a "log out" button to the header.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={logout} style={{ marginRight: spacing.md }}>
          <Ionicons name="log-out-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, logout]);

  // Load specialties + a few doctors when the screen first opens.
  useEffect(() => {
    let mounted = true; // guard against setting state after the screen unmounts
    const load = async () => {
      try {
        const [specRes, docRes] = await Promise.all([
          api.get('/specialties'),
          api.get('/doctors', { params: { per_page: 5 } }),
        ]);
        if (mounted) {
          setSpecialties(specRes.data.data);
          setDoctors(docRes.data.data);
        }
      } catch (e) {
        // Keep the UI usable even if loading fails.
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Submit the search -> go to the doctor list with the typed text.
  const onSearch = () => {
    const term = search.trim();
    if (term.length === 0) return;
    navigation.navigate('DoctorList', { search: term });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: spacing.md }}>
      {/* Greeting */}
      <Text style={styles.hello}>Hello{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</Text>
      <Text style={styles.subtitle}>How are you feeling today?</Text>

      {/* Search bar */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors by name"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={onSearch}
          returnKeyType="search"
        />
      </View>

      {/* Specialty grid */}
      <Text style={styles.sectionTitle}>Specialties</Text>
      <View style={styles.grid}>
        {specialties.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={styles.specialtyCard}
            onPress={() => navigation.navigate('DoctorList', { specialtyId: s.id, specialtyName: s.name })}
          >
            <Text style={styles.specialtyEmoji}>{specialtyEmoji(s.name)}</Text>
            <Text style={styles.specialtyName} numberOfLines={1}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Featured doctors */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Top doctors</Text>
        <TouchableOpacity onPress={() => navigation.navigate('DoctorList', {})}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {doctors.map((d) => (
        <DoctorCard
          key={d.id}
          doctor={d}
          onPress={() => navigation.navigate('DoctorProfile', { doctorId: d.id })}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  hello: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2, marginBottom: spacing.md },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm + 2, marginLeft: spacing.sm, fontSize: 15, color: colors.text },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  seeAll: { color: colors.primary, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  specialtyCard: {
    width: '31%',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  specialtyEmoji: { fontSize: 28 },
  specialtyName: { fontSize: 12, color: colors.text, marginTop: 6, fontWeight: '500' },
});
