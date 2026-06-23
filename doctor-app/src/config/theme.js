// Central colors & spacing for the DOCTOR app.
// White background, TEAL accent (#00796B) — visually distinct from the patient app's blue.

export const colors = {
  primary: '#00796B',      // teal accent (buttons, active states)
  primaryDark: '#00695C',  // pressed/darker teal
  primaryLight: '#E0F2F1', // very light teal (chips, backgrounds)

  background: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E5E7EB',

  text: '#1A1A1A',
  textMuted: '#6B7280',

  // Appointment status badge colors
  statusPending: '#F59E0B',
  statusConfirmed: '#00796B',
  statusCompleted: '#10B981',
  statusCancelled: '#EF4444',

  white: '#FFFFFF',
  danger: '#EF4444',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 8, md: 12, lg: 16 };
