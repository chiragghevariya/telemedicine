import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Modal, FlatList, ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../config/api';
import { colors, fonts, radius, spacing } from '../config/theme';
import PrimaryButton from '../components/PrimaryButton';

const DAYS = [
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
  { label: 'Sunday', value: 0 },
];

const SLOT_OPTIONS = [15, 30, 45, 60];

// Generate time options from 06:00 to 23:00 in 30-minute intervals
const TIME_OPTIONS = [];
for (let h = 6; h <= 23; h++) {
  const hrStr = h.toString().padStart(2, '0');
  TIME_OPTIONS.push(`${hrStr}:00`);
  TIME_OPTIONS.push(`${hrStr}:30`);
}

export default function AvailabilityEditorScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Weekly availability state
  // Keyed by day_of_week (0-6)
  const [availabilities, setAvailabilities] = useState({});

  // Time picker modal state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeDay, setActiveDay] = useState(null);
  const [activeField, setActiveField] = useState(null); // 'start_time' or 'end_time'

  useEffect(() => {
    // Fetch current availability from doctor profile
    api.get('/me/doctor-profile')
      .then((res) => {
        const rawAvail = res.data?.data?.availabilities || [];
        const mapped = {};
        
        // Initialize all days as disabled/empty first
        DAYS.forEach(d => {
          mapped[d.value] = {
            enabled: false,
            start_time: '09:00',
            end_time: '17:00',
            slot_duration_minutes: 30,
          };
        });

        // Overlay with actual backend database records
        rawAvail.forEach(item => {
          // Backend returns start_time/end_time as "HH:MM:SS" (e.g. "09:00:00"). Slice to "HH:MM"
          const start = item.start_time ? item.start_time.slice(0, 5) : '09:00';
          const end = item.end_time ? item.end_time.slice(0, 5) : '17:00';

          mapped[item.day_of_week] = {
            enabled: true,
            start_time: start,
            end_time: end,
            slot_duration_minutes: item.slot_duration_minutes || 30,
          };
        });

        setAvailabilities(mapped);
      })
      .catch((err) => {
        console.warn('Failed to load profile for availability editor:', err);
        Alert.alert('Error', 'Could not load your availability profile. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const toggleDay = (dayValue) => {
    setAvailabilities(prev => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        enabled: !prev[dayValue].enabled
      }
    }));
  };

  const setSlotDuration = (dayValue, duration) => {
    setAvailabilities(prev => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        slot_duration_minutes: duration
      }
    }));
  };

  const openTimePicker = (dayValue, field) => {
    setActiveDay(dayValue);
    setActiveField(field);
    setPickerVisible(true);
  };

  const selectTime = (time) => {
    setAvailabilities(prev => {
      const dayData = { ...prev[activeDay] };
      dayData[activeField] = time;

      // Basic validation: ensure end_time > start_time. If not, auto-adjust end_time
      if (activeField === 'start_time') {
        const [startH, startM] = time.split(':').map(Number);
        const [endH, endM] = dayData.end_time.split(':').map(Number);
        if (startH > endH || (startH === endH && startM >= endM)) {
          // Auto-adjust end time to start time + 1 hour (clamped to 23:30)
          const newEndH = Math.min(startH + 1, 23);
          dayData.end_time = `${newEndH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;
        }
      } else if (activeField === 'end_time') {
        const [endH, endM] = time.split(':').map(Number);
        const [startH, startM] = dayData.start_time.split(':').map(Number);
        if (endH < startH || (endH === startH && endM <= startM)) {
          // Auto-adjust start time to end time - 1 hour (clamped to 06:00)
          const newStartH = Math.max(endH - 1, 6);
          dayData.start_time = `${newStartH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
        }
      }

      return {
        ...prev,
        [activeDay]: dayData
      };
    });
    setPickerVisible(false);
  };

  const handleSave = async () => {
    // Construct request payload
    const payloadList = [];
    
    for (const [dayVal, data] of Object.entries(availabilities)) {
      if (data.enabled) {
        payloadList.push({
          day_of_week: parseInt(dayVal, 10),
          start_time: data.start_time,
          end_time: data.end_time,
          slot_duration_minutes: data.slot_duration_minutes,
        });
      }
    }

    setSaving(true);
    try {
      await api.post('/me/doctor-profile/availabilities', {
        availabilities: payloadList
      });
      
      Alert.alert('Success', 'Availability schedule updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      console.warn('Failed to save availabilities:', err);
      const errMsg = err.response?.data?.message || 'Could not update availability schedule. Please check your time slots.';
      Alert.alert('Save Failed', errMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading availability profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Text style={styles.introText}>
          Specify the days and working hours you are available for remote video consultations.
        </Text>

        {DAYS.map(day => {
          const config = availabilities[day.value] || { enabled: false, start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30 };
          return (
            <View key={day.value} style={[styles.dayCard, config.enabled && styles.dayCardActive]}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayLabel}>{day.label}</Text>
                <Switch
                  value={config.enabled}
                  onValueChange={() => toggleDay(day.value)}
                  trackColor={{ false: '#d1d1d1', true: colors.primaryLight }}
                  thumbColor={config.enabled ? colors.primary : '#f4f3f4'}
                />
              </View>

              {config.enabled && (
                <View style={styles.configContainer}>
                  {/* Time selectors row */}
                  <View style={styles.row}>
                    <View style={styles.halfCol}>
                      <Text style={styles.inputLabel}>Start Time</Text>
                      <TouchableOpacity 
                        style={styles.timeButton}
                        onPress={() => openTimePicker(day.value, 'start_time')}
                      >
                        <Ionicons name="time-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.timeButtonText}>{config.start_time}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.halfCol}>
                      <Text style={styles.inputLabel}>End Time</Text>
                      <TouchableOpacity 
                        style={styles.timeButton}
                        onPress={() => openTimePicker(day.value, 'end_time')}
                      >
                        <Ionicons name="time-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.timeButtonText}>{config.end_time}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Slot duration row */}
                  <Text style={styles.inputLabel}>Slot Duration</Text>
                  <View style={styles.durationRow}>
                    {SLOT_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.durationButton,
                          config.slot_duration_minutes === opt && styles.durationButtonActive
                        ]}
                        onPress={() => setSlotDuration(day.value, opt)}
                      >
                        <Text style={[
                          styles.durationButtonText,
                          config.slot_duration_minutes === opt && styles.durationButtonTextActive
                        ]}>
                          {opt} min
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.saveContainer}>
          <PrimaryButton 
            title="Save Availability Schedule" 
            onPress={handleSave} 
            loading={saving}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {activeField === 'start_time' ? 'Start' : 'End'} Time
              </Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={TIME_OPTIONS}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.timeOption}
                  onPress={() => selectTime(item)}
                >
                  <Text style={styles.timeOptionText}>{item}</Text>
                  {availabilities[activeDay]?.[activeField] === item && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={{ paddingBottom: spacing.lg }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.lg },
  loadingText: { marginTop: spacing.md, color: colors.textMuted, fontSize: 15, ...fonts.medium },
  introText: {
    fontSize: 14, color: colors.textMuted, lineHeight: 20, ...fonts.medium,
    marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.lg
  },
  dayCard: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, marginHorizontal: spacing.lg, marginBottom: spacing.md,
    padding: spacing.md,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 1,
  },
  dayCardActive: { borderColor: colors.primary, borderWidth: 1.5 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayLabel: { fontSize: 16, ...fonts.bold, color: colors.text },
  configContainer: { marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  halfCol: { width: '48%' },
  inputLabel: { fontSize: 12, ...fonts.bold, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 },
  timeButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 44, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: '#FAFCFF',
  },
  timeButtonText: { fontSize: 15, ...fonts.bold, color: colors.text },
  durationRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  durationButton: {
    flex: 1, height: 38, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginRight: 6, backgroundColor: '#FAFCFF',
  },
  durationButtonActive: {
    borderColor: colors.primary, backgroundColor: colors.primaryLight,
  },
  durationButtonText: { fontSize: 13, ...fonts.semiBold, color: colors.textMuted },
  durationButtonTextActive: { color: colors.primary },
  saveContainer: { paddingHorizontal: spacing.lg, marginTop: spacing.lg, alignItems: 'center', marginBottom: spacing.xl },
  saveButton: { width: '100%', height: 50 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 24, 40, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, maxHeight: '60%' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 16, ...fonts.bold, color: colors.text },
  timeOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
  },
  timeOptionText: { fontSize: 16, ...fonts.semiBold, color: colors.text },
  separator: { height: 1, backgroundColor: colors.border },
});
