// All of the doctor's appointments, filterable by status tabs.

import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import api from '../config/api';
import AppointmentCard from '../components/AppointmentCard';
import { colors, radius, spacing } from '../config/theme';

// The status filter tabs. 'all' shows everything.
const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

export default function AppointmentListScreen({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.data);
    } catch (e) {
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Apply the active status filter.
  const visible = filter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === filter);

  return (
    <View style={styles.screen}>
      {/* Status filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.tab, filter === f && styles.tabActive]}
          >
            <Text style={[styles.tabText, filter === f && styles.tabTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: spacing.md }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<Text style={styles.empty}>No {filter === 'all' ? '' : filter} appointments.</Text>}
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: item.id })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabs: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.white,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.text, fontSize: 13 },
  tabTextActive: { color: colors.white, fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
});
