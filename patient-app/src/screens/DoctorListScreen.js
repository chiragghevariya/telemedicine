// Lists doctors, filtered by specialty chips.
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../config/api';
import DoctorCard from '../components/DoctorCard';
import { colors, fonts, radius, spacing } from '../config/theme';

export default function DoctorListScreen({ route, navigation }) {
  const initialSpecialtyId = route.params?.specialtyId ?? null;
  const specialtyName = route.params?.specialtyName ?? null;
  const search = route.params?.search ?? '';

  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState(initialSpecialtyId);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    if (specialtyName) {
      navigation.setOptions({ title: specialtyName });
    } else {
      navigation.setOptions({ title: 'Find Doctors' });
    }
  }, [specialtyName, navigation]);

  useEffect(() => {
    api.get('/specialties')
      .then((res) => setSpecialties(res.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
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
  }, [selectedSpecialtyId]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Specialty Filter Scroll Bar */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <Chip
            label="All Specialities"
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
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <DoctorCard
              doctor={item}
              onPress={() => navigation.navigate('DoctorProfile', { doctorId: item.id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={styles.empty}>No doctors found for this selection.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
  },
  chipsRow: { 
    paddingHorizontal: spacing.lg, 
    paddingVertical: spacing.sm 
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.card,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chipText: { 
    color: colors.textMuted, 
    fontSize: 13, 
    ...fonts.semiBold 
  },
  chipTextActive: { 
    color: colors.white, 
    ...fonts.bold 
  },
  listContent: { 
    paddingHorizontal: spacing.lg, 
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyContainer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: spacing.xxl * 2,
  },
  empty: { 
    fontSize: 14, 
    ...fonts.medium, 
    color: colors.textMuted, 
    marginTop: spacing.md, 
    textAlign: 'center' 
  },
});
