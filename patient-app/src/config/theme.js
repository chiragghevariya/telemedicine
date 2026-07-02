// Central place for colors & spacing so the whole app looks consistent.
// White background, blue accent (#0277BD), as requested.

export const colors = {
  primary: '#0277BD',      // main blue accent (buttons, links, active states)
  primaryDark: '#01579B',  // pressed/darker blue
  primaryLight: '#E1F0F8', // very light blue (chips, backgrounds)

  background: '#FFFFFF',   // app background
  card: '#FFFFFF',         // card background
  border: '#E5E7EB',       // light gray borders

  text: '#1A1A1A',         // main text
  textMuted: '#6B7280',    // secondary/gray text

  // Slot states
  slotAvailable: '#10B981', // green = bookable
  slotBooked: '#D1D5DB',    // gray = already taken

  // Appointment status badge colors
  statusPending: '#F59E0B',
  statusConfirmed: '#0277BD',
  statusCompleted: '#10B981',
  statusCancelled: '#EF4444',

  white: '#FFFFFF',
  danger: '#EF4444',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 9999,
};

export const fonts = {
  regular: { fontFamily: 'System', fontWeight: '400' },
  medium: { fontFamily: 'System', fontWeight: '500' },
  semiBold: { fontFamily: 'System', fontWeight: '600' },
  bold: { fontFamily: 'System', fontWeight: '700' },
  heavy: { fontFamily: 'System', fontWeight: '800' },
};
