// Premium, professional Appointment Detail Screen.
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, StyleSheet, ActivityIndicator, Alert, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../config/api';
import StatusBadge from '../components/StatusBadge';
import PrimaryButton from '../components/PrimaryButton';
import { colors, fonts, radius, spacing } from '../config/theme';
import { shortTime, errorMessage } from '../utils/helpers';

export default function AppointmentDetailScreen({ route, navigation }) {
  const { appointmentId } = route.params ?? {};

  const [appointment, setAppointment] = useState(null);
  const [prescription, setPrescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!appointmentId) { setLoading(false); return; }
    try {
      const res = await api.get(`/appointments/${appointmentId}`);
      setAppointment(res.data.data);
      setPrescription(res.data.data.prescription || '');
    } catch (e) {
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => { load(); }, [load]);

  const onSave = async () => {
    if (!prescription.trim()) {
      Alert.alert('Prescription needed', 'Please write the prescription before saving.');
      return;
    }
    try {
      setSaving(true);
      const res = await api.post(`/appointments/${appointmentId}/complete`, {
        prescription: prescription.trim(),
      });
      setAppointment(res.data.data);
      Alert.alert('Saved', 'Prescription saved and appointment marked completed.');
    } catch (e) {
      Alert.alert('Could not save', errorMessage(e, 'Failed to save the prescription.'));
    } finally {
      setSaving(false);
    }
  };

  const handleJoinCall = async () => {
    try {
      const res = await api.post('/calls/initiate', {
        receiver_id: appointment.patient.id,
        appointment_id: appointment.id,
      });
      navigation.navigate('VideoCall', {
        channelName: res.data.channel_name,
        token: res.data.agora_token,
        callId: res.data.call.id,
      });
    } catch (err) {
      console.error('Failed to initiate video call:', err);
      // Fallback
      navigation.navigate('VideoCall', {
        channelName: appointment.agora_channel_name,
        token: appointment.agora_token,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  if (!appointment) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textMuted }}>Appointment not found.</Text>
      </View>
    );
  }

  const isEditable = appointment.status === 'pending' || appointment.status === 'confirmed';
  const patientInit = (appointment.patient?.name || 'P').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Status Header Block */}
        <View style={styles.statusHeaderCard}>
          <View style={styles.statusHeaderLeft}>
            <Text style={styles.appointmentIdText}>Appointment ID: #{appointment.id}</Text>
            <Text style={styles.createdTimeText}>Video Consultation</Text>
          </View>
          <StatusBadge status={appointment.status} />
        </View>

        {/* Patient Profile Card */}
        <View style={styles.patientProfileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{patientInit}</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{appointment.patient?.name || 'Patient'}</Text>
            <Text style={styles.patientSubText}>Registered Patient</Text>
          </View>
          <View style={styles.patientContactRow}>
            <View style={styles.contactItem}>
              <Ionicons name="mail" size={16} color={colors.textMuted} />
              <Text style={styles.contactText}>{appointment.patient?.email || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Date and Time Details Card */}
        <Text style={styles.sectionTitle}>Schedule Details</Text>
        <View style={styles.dateTimeCard}>
          <View style={styles.dateTimeIconContainer}>
            <Ionicons name="calendar-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.dateTimeTextContainer}>
            <Text style={styles.dateLabel}>{appointment.appointment_date}</Text>
            <Text style={styles.timeLabel}>
              {shortTime(appointment.start_time)} - {shortTime(appointment.end_time)}
            </Text>
          </View>
        </View>

        {/* Notes Card */}
        {appointment.notes ? (
          <View style={styles.notesCard}>
            <Text style={styles.notesCardTitle}>Patient Symptoms / Notes</Text>
            <Text style={styles.notesText}>{appointment.notes}</Text>
          </View>
        ) : null}

        {/* Call Action Button */}
        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
          <PrimaryButton
            title="Start Consultation"
            onPress={handleJoinCall}
            style={styles.joinBtn}
          />
        )}

        {/* Prescription Box */}
        <Text style={styles.sectionTitle}>Prescription & Medical Notes</Text>
        <View style={styles.prescriptionContainer}>
          <TextInput
            style={[
              styles.prescriptionInput,
              !isEditable && styles.prescriptionInputDisabled
            ]}
            placeholder="Specify medicines, dosages, and medical instructions here..."
            placeholderTextColor={colors.textMuted}
            value={prescription}
            onChangeText={setPrescription}
            editable={isEditable}
            multiline
            textAlignVertical="top"
          />
          
          {isEditable ? (
            <View style={styles.editableFooter}>
              <View style={styles.infoAlert}>
                <Ionicons name="information-circle-outline" size={18} color="#D97706" style={{ marginRight: 6 }} />
                <Text style={styles.infoAlertText}>
                  Saving the prescription completes this appointment.
                </Text>
              </View>
              <PrimaryButton 
                title="Complete Visit & Save" 
                onPress={onSave} 
                loading={saving} 
                style={styles.saveBtn}
              />
            </View>
          ) : (
            <View style={[
              styles.statusNotice,
              appointment.status === 'completed' ? styles.successNotice : styles.errorNotice
            ]}>
              <Ionicons 
                name={appointment.status === 'completed' ? 'checkmark-circle-outline' : 'close-circle-outline'} 
                size={20} 
                color={appointment.status === 'completed' ? colors.success : colors.danger} 
                style={{ marginRight: 8 }}
              />
              <Text style={[
                styles.noticeText,
                { color: appointment.status === 'completed' ? '#14532D' : '#7F1D1D' }
              ]}>
                {appointment.status === 'completed'
                  ? 'Consultation completed. Prescription log is locked.'
                  : 'Consultation cancelled. Prescription log is disabled.'}
              </Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  scrollContent: { 
    paddingHorizontal: spacing.lg, 
    paddingTop: spacing.md, 
    paddingBottom: spacing.xxl 
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  statusHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  appointmentIdText: { fontSize: 13, ...fonts.bold, color: colors.textMuted },
  createdTimeText: { fontSize: 16, ...fonts.bold, color: colors.text, marginTop: 2 },
  patientProfileCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 24, ...fonts.bold, color: colors.primary },
  patientInfo: { alignItems: 'center', marginBottom: spacing.md },
  patientName: { fontSize: 18, ...fonts.bold, color: colors.text },
  patientSubText: { fontSize: 12, ...fonts.medium, color: colors.textMuted, marginTop: 2 },
  patientContactRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: '100%',
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  contactItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  contactText: { fontSize: 14, ...fonts.medium, color: colors.text, marginLeft: 6 },
  sectionTitle: { 
    fontSize: 15, 
    ...fonts.bold, 
    color: colors.text, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5,
    marginBottom: spacing.sm 
  },
  dateTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  dateTimeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  dateTimeTextContainer: { flex: 1 },
  dateLabel: { fontSize: 16, ...fonts.bold, color: colors.text },
  timeLabel: { fontSize: 14, ...fonts.medium, color: colors.textMuted, marginTop: 2 },
  notesCard: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E8DBFF',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  notesCardTitle: { fontSize: 13, ...fonts.bold, color: '#6B21A8', marginBottom: 6 },
  notesText: { fontSize: 14, ...fonts.medium, color: '#4C1D95', lineHeight: 20 },
  joinBtn: {
    marginBottom: spacing.xl,
    height: 52,
  },
  prescriptionContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  prescriptionInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 140,
    fontSize: 15,
    ...fonts.regular,
    color: colors.text,
    backgroundColor: '#FAFCFF',
  },
  prescriptionInputDisabled: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    color: colors.textMuted,
  },
  editableFooter: { marginTop: spacing.md },
  infoAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: spacing.md,
  },
  infoAlertText: { fontSize: 13, ...fonts.medium, color: '#B45309', flex: 1 },
  saveBtn: { height: 50 },
  statusNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  successNotice: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  errorNotice: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' },
  noticeText: { fontSize: 13, ...fonts.bold },
});
