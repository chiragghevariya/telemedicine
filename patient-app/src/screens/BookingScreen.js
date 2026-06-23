// Booking flow:
//   1. Pick a date on the calendar (past dates disabled).
//   2. We build the full slot grid for that weekday from the doctor's availability,
//      then ask the API which of those slots are still free.
//      -> green = available, gray = already booked.
//   3. Pick a green slot, optionally add notes, and confirm.

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

import api from '../config/api';
import PrimaryButton from '../components/PrimaryButton';
import { colors, radius, spacing } from '../config/theme';
import {
  weekdayOf, generateSlots, todayString, errorMessage,
} from '../utils/helpers';

export default function BookingScreen({ route, navigation }) {
  const { doctor } = route.params ?? {}; // full doctor object (includes availabilities)
  const availabilities = doctor?.availabilities || [];

  const [selectedDate, setSelectedDate] = useState(null);
  const [allSlots, setAllSlots] = useState([]);        // every slot for that weekday
  const [availableSlots, setAvailableSlots] = useState([]); // free slots from the API
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');

  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  // When a date is tapped, build the grid + fetch which slots are free.
  const onSelectDate = async (dateString) => {
    setSelectedDate(dateString);
    setSelectedSlot(null);

    // Find the doctor's working hours for that weekday (0 = Sun ... 6 = Sat).
    const weekday = weekdayOf(dateString);
    const availability = availabilities.find((a) => a.day_of_week === weekday);

    if (!availability) {
      // Doctor doesn't work that day.
      setAllSlots([]);
      setAvailableSlots([]);
      return;
    }

    // Full list of slots for the day (e.g. 09:00 ... 16:30).
    const slots = generateSlots(
      availability.start_time,
      availability.end_time,
      availability.slot_duration_minutes
    );
    setAllSlots(slots);

    // Ask the API which of those are still free.
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

  // Confirm the booking.
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

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text style={styles.doctorName}>{doctor.name}</Text>
        <Text style={styles.fee}>Consultation fee: ${doctor.consultation_fee}</Text>

        {/* Calendar */}
        <Text style={styles.sectionTitle}>Pick a date</Text>
        <Calendar
          minDate={todayString()}            // can't book in the past
          onDayPress={(day) => onSelectDate(day.dateString)}
          markedDates={
            selectedDate
              ? { [selectedDate]: { selected: true, selectedColor: colors.primary } }
              : {}
          }
          theme={{
            todayTextColor: colors.primary,
            arrowColor: colors.primary,
          }}
        />

        {/* Slots */}
        {selectedDate ? (
          <>
            <Text style={styles.sectionTitle}>Pick a time</Text>

            {slotsLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.md }} />
            ) : allSlots.length === 0 ? (
              <Text style={styles.muted}>The doctor is not available on this day.</Text>
            ) : (
              <View style={styles.slotGrid}>
                {allSlots.map((slot) => {
                  const isAvailable = availableSlots.includes(slot);
                  const isSelected = selectedSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      disabled={!isAvailable}
                      onPress={() => setSelectedSlot(slot)}
                      style={[
                        styles.slot,
                        isAvailable ? styles.slotAvailable : styles.slotBooked,
                        isSelected && styles.slotSelected,
                      ]}
                    >
                      <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Legend */}
            <View style={styles.legend}>
              <View style={[styles.legendDot, { backgroundColor: colors.slotAvailable }]} />
              <Text style={styles.legendText}>Available</Text>
              <View style={[styles.legendDot, { backgroundColor: colors.slotBooked, marginLeft: spacing.md }]} />
              <Text style={styles.legendText}>Booked</Text>
            </View>

            {/* Notes */}
            <Text style={styles.sectionTitle}>Notes (optional)</Text>
            <TextInput
              style={styles.notes}
              placeholder="Describe your symptoms..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </>
        ) : (
          <Text style={styles.muted}>Select a date to see available time slots.</Text>
        )}
      </ScrollView>

      {/* Confirm button */}
      <View style={styles.footer}>
        <PrimaryButton
          title={selectedSlot ? `Confirm ${selectedSlot}` : 'Select a time slot'}
          onPress={onConfirm}
          disabled={!selectedSlot}
          loading={booking}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  doctorName: { fontSize: 20, fontWeight: '800', color: colors.text },
  fee: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  muted: { color: colors.textMuted, marginTop: spacing.sm },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  slot: {
    width: '23%',
    marginRight: '2%',
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  slotAvailable: { backgroundColor: colors.slotAvailable },
  slotBooked: { backgroundColor: colors.slotBooked },
  slotSelected: { backgroundColor: colors.primary },
  slotText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  slotTextSelected: { color: colors.white },
  legend: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 6 },
  legendText: { fontSize: 12, color: colors.textMuted },
  notes: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    color: colors.text,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
});
