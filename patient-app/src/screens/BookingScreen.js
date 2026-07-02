// Booking flow.
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, SafeAreaView, StatusBar,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

import api from '../config/api';
import PrimaryButton from '../components/PrimaryButton';
import { colors, fonts, radius, spacing } from '../config/theme';
import {
  weekdayOf, generateSlots, todayString, errorMessage,
} from '../utils/helpers';

export default function BookingScreen({ route, navigation }) {
  const { doctor } = route.params ?? {};
  const availabilities = doctor?.availabilities || [];

  const [selectedDate, setSelectedDate] = useState(null);
  const [allSlots, setAllSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');

  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  const isSlotInPast = (dateString, slotTime) => {
    if (dateString !== todayString()) return false;
    
    const [slotHour, slotMin] = slotTime.split(':').map(Number);
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    
    if (slotHour < currentHour) return true;
    if (slotHour === currentHour && slotMin <= currentMin) return true;
    
    return false;
  };

  const onSelectDate = async (dateString) => {
    setSelectedDate(dateString);
    setSelectedSlot(null);

    const weekday = weekdayOf(dateString);
    const availability = availabilities.find((a) => a.day_of_week === weekday);

    if (!availability) {
      setAllSlots([]);
      setAvailableSlots([]);
      return;
    }

    const slots = generateSlots(
      availability.start_time,
      availability.end_time,
      availability.slot_duration_minutes
    );
    setAllSlots(slots);

    try {
      setSlotsLoading(true);
      const res = await api.get(`/doctors/${doctor.id}/slots`, { params: { date: dateString } });
      setAvailableSlots(res.data.slots);
    } catch (e) {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const onConfirm = async () => {
    if (!selectedDate || !selectedSlot) return;
    try {
      setBooking(true);
      await api.post('/appointments', {
        doctor_id: doctor.id,
        appointment_date: selectedDate,
        start_time: selectedSlot,
        notes: notes.trim() || undefined,
      });
      Alert.alert('Booked!', 'Your appointment has been booked successfully.', [
        { text: 'OK', onPress: () => navigation.navigate('Main', { screen: 'Appointments' }) },
      ]);
    } catch (e) {
      Alert.alert('Booking failed', errorMessage(e, 'Could not book this slot. Try another one.'));
    } finally {
      setBooking(false);
    }
  };

  const displayName = doctor.name || '';
  const formattedName = displayName.toLowerCase().startsWith('dr.') ? displayName : `Dr. ${displayName}`;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Doctor Header Info Card */}
          <View style={styles.doctorHeaderCard}>
            <View style={styles.headerDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.doctorName}>{formattedName}</Text>
              <Text style={styles.fee}>Consultation fee: ${doctor.consultation_fee}</Text>
            </View>
          </View>

          {/* Calendar Picker Section */}
          <Text style={styles.sectionTitle}>Select Visit Date</Text>
          <View style={styles.calendarContainer}>
            <Calendar
              minDate={todayString()}
              onDayPress={(day) => onSelectDate(day.dateString)}
              markedDates={
                selectedDate
                  ? { [selectedDate]: { selected: true, selectedColor: colors.primary } }
                  : {}
              }
              theme={{
                todayTextColor: colors.primary,
                arrowColor: colors.primary,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.white,
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
              }}
            />
          </View>

          {/* Slots & Notes Section */}
          {selectedDate ? (
            <>
              <Text style={styles.sectionTitle}>Select Time Slot</Text>

              {slotsLoading ? (
                <View style={styles.loaderContainer}>
                  <ActivityIndicator color={colors.primary} size="small" />
                </View>
              ) : allSlots.length === 0 ? (
                <View style={styles.errorBox}>
                  <Ionicons name="calendar-outline" size={24} color={colors.textMuted} style={{ marginBottom: 6 }} />
                  <Text style={styles.muted}>The doctor is not working on this weekday.</Text>
                </View>
              ) : (
                <View style={styles.slotContainer}>
                  <View style={styles.slotGrid}>
                    {allSlots.map((slot) => {
                      const passed = isSlotInPast(selectedDate, slot);
                      const isAvailable = availableSlots.includes(slot) && !passed;
                      const isSelected = selectedSlot === slot;
                      return (
                        <TouchableOpacity
                          key={slot}
                          disabled={!isAvailable}
                          onPress={() => setSelectedSlot(slot)}
                          activeOpacity={0.8}
                          style={[
                            styles.slot,
                            isAvailable ? styles.slotAvailable : styles.slotBooked,
                            isSelected && styles.slotSelected,
                          ]}
                        >
                          <Text style={[
                            styles.slotText,
                            isAvailable ? styles.slotTextAvailable : styles.slotTextBooked,
                            isSelected && styles.slotTextSelected
                          ]}>
                            {slot}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  
                  {/* Legend Indicator */}
                  <View style={styles.legend}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#DEF7EC' }]} />
                      <Text style={styles.legendText}>Available</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#F3F4F6' }]} />
                      <Text style={styles.legendText}>Booked</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Notes Input Field */}
              <Text style={styles.sectionTitle}>Symptoms or Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Describe your symptoms or reason for visit (optional)..."
                placeholderTextColor={colors.textMuted}
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />
            </>
          ) : (
            <View style={styles.selectPrompt}>
              <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
              <Text style={styles.promptText}>Select a date above to check available time slots.</Text>
            </View>
          )}
        </ScrollView>

        {/* Footer sticky action */}
        <View style={styles.footer}>
          <PrimaryButton
            title={selectedSlot ? `Confirm Booking (${selectedSlot})` : 'Select Date & Time'}
            onPress={onConfirm}
            disabled={!selectedSlot}
            loading={booking}
            style={styles.confirmBtn}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl },
  doctorHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFCFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  headerDot: {
    width: 6,
    height: 36,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },
  doctorName: { fontSize: 18, ...fonts.bold, color: colors.text },
  fee: { fontSize: 13, ...fonts.medium, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { 
    fontSize: 14, 
    ...fonts.bold, 
    color: colors.text, 
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.lg, 
    marginBottom: spacing.sm 
  },
  calendarContainer: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  loaderContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  errorBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: '#F9FAFB',
    borderRadius: radius.md,
  },
  muted: { fontSize: 13, ...fonts.medium, color: colors.textMuted },
  slotContainer: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  slotGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
  },
  slot: {
    width: '23%',
    marginRight: '2%',
    marginBottom: spacing.sm,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  slotAvailable: { 
    backgroundColor: '#DEF7EC', 
    borderColor: '#DEF7EC' 
  },
  slotBooked: { 
    backgroundColor: '#F3F4F6', 
    borderColor: '#F3F4F6' 
  },
  slotSelected: { 
    backgroundColor: colors.primary, 
    borderColor: colors.primary 
  },
  slotText: { 
    fontSize: 13, 
    ...fonts.bold 
  },
  slotTextAvailable: { color: '#03543F' },
  slotTextBooked: { color: '#9CA3AF' },
  slotTextSelected: { color: colors.white },
  legend: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: spacing.sm, 
    borderTopWidth: 1, 
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.md },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendText: { fontSize: 12, ...fonts.medium, color: colors.textMuted },
  notesInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 100,
    backgroundColor: '#FAFCFF',
    fontSize: 14,
    color: colors.text,
    ...fonts.regular,
  },
  selectPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  promptText: { fontSize: 13, color: colors.textMuted, marginLeft: 6, ...fonts.medium },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  confirmBtn: { height: 50 },
});
