// Home tab: greeting, search bar, specialty grid (6), and featured doctors.
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../config/api';
import { useAuth } from '../store/AuthContext';
import DoctorCard from '../components/DoctorCard';
import { colors, fonts, radius, spacing } from '../config/theme';
import { specialtyEmoji } from '../utils/helpers';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();

  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={logout} style={{ marginRight: spacing.md }}>
          <Ionicons name="log-out-outline" size={24} color={colors.white} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, logout]);

  useEffect(() => {
    let mounted = true;
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
        // Keep UI usable
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

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

  const patientName = user?.name ? user.name.split(' ')[0] : 'Patient';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Hello Banner */}
        <View style={styles.banner}>
          <Text style={styles.hello}>Hello, {patientName} 👋</Text>
          <Text style={styles.subtitle}>How are you feeling today?</Text>
        </View>

        {/* Search Box */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search doctors by name..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={onSearch}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Specialties Grid */}
        <Text style={styles.sectionTitle}>Medical Specialties</Text>
        <View style={styles.grid}>
          {specialties.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.specialtyCard}
              onPress={() => navigation.navigate('DoctorList', { specialtyId: s.id, specialtyName: s.name })}
            >
              <View style={styles.emojiWrapper}>
                <Text style={styles.specialtyEmoji}>{specialtyEmoji(s.name)}</Text>
              </View>
              <Text style={styles.specialtyName} numberOfLines={1}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Featured Doctors Header */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Top Rated Doctors</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DoctorList', {})}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Doctors list */}
        <View style={styles.doctorsList}>
          {doctors.map((d) => (
            <DoctorCard
              key={d.id}
              doctor={d}
              onPress={() => navigation.navigate('DoctorProfile', { doctorId: d.id })}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  banner: {
    marginBottom: spacing.md,
  },
  hello: { fontSize: 24, ...fonts.bold, color: colors.text },
  subtitle: { fontSize: 14, ...fonts.medium, color: colors.textMuted, marginTop: 4 },
  searchContainer: {
    marginVertical: spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFCFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchInput: { 
    flex: 1, 
    fontSize: 15, 
    ...fonts.regular, 
    color: colors.text 
  },
  sectionTitle: { 
    fontSize: 16, 
    ...fonts.bold, 
    color: colors.text, 
    marginTop: spacing.lg, 
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end',
    marginTop: spacing.lg, 
    marginBottom: spacing.sm,
  },
  seeAll: { 
    fontSize: 14, 
    ...fonts.bold, 
    color: colors.primary,
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  specialtyCard: {
    width: '31%',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(2, 119, 189, 0.08)',
  },
  emojiWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  specialtyEmoji: { fontSize: 22 },
  specialtyName: { 
    fontSize: 12, 
    color: colors.text, 
    marginTop: 4, 
    ...fonts.semiBold 
  },
  doctorsList: {
    marginTop: spacing.xs,
  },
});
