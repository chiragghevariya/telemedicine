// Lists doctors, filtered by specialty chips and/or a search term.
// Opened from Home (with a specialty or search) or "See all".

import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';

import api from '../config/api';
import DoctorCard from '../components/DoctorCard';
import { colors, radius, spacing } from '../config/theme';

export default function DoctorListScreen({ route, navigation }) {
  // Values passed in from the previous screen (any of these may be undefined).
  const initialSpecialtyId = route.params?.specialtyId ?? null;
  const specialtyName = route.params?.specialtyName ?? null;
  const search = route.params?.search ?? '';

  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState(initialSpecialtyId);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // If we arrived from a specialty tile, show its name as the screen title.
  useLayoutEffect(() => {
    if (specialtyName) navigation.setOptions({ title: specialtyName });
  }, [specialtyName, navigation]);

  // Load the specialty list once (for the filter chips).
  useEffect(() => {
    api.get('/specialties')
      .then((res) => setSpecialties(res.data.data))
      .catch(() => {});
  }, []);

  // (Re)load doctors whenever the selected specialty changes.
  useEffect(() => {
    let mounted = true; // guard against setting state after leaving the screen
    const load = async () => {
      setLoading(true);
      try {
        // Ask for a big page so the demo shows everyone (no infinite scroll here).
        const params = { per_page: 50 };
        if (selectedSpecialtyId) params.specialty_id = selectedSpecialtyId;
        if (search) params.search = search;

        const res = await api.get('/doctors', { params });
        if (mounted) setDoctors(res.data.data);
      } catch (e) {
        if (mounted) setDoctors([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [selectedSpecialtyId]); // search comes from params and doesn't change here

  return (
    <View style={styles.screen}>
      {/* Filter chips: "All" + each specialty */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <Chip
            label="All"
            active={!selectedSpecialtyId}
            onPress={() => setSelectedSpecialtyId(null)}
          />
          {specialties.map((s) => (
            <Chip
              key={s.id}
              label={s.name}
              active={selectedSpecialtyId === s.id}
              onPress={() => setSelectedSpecialtyId(s.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Doctor list */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={({ item }) => (
            <DoctorCard
              doctor={item}
              onPress={() => navigation.navigate('DoctorProfile', { doctorId: item.id })}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No doctors found.</Text>
          }
        />
      )}
    </View>
  );
}

// A single filter chip.
function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chipsRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextActive: { color: colors.white, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
