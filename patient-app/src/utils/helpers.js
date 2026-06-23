// Small helper functions shared across screens.

// Map a specialty name to an emoji (so we don't need an icon library for these).
const SPECIALTY_EMOJI = {
  'General Medicine': '🩺',
  Cardiology: '❤️',
  Dermatology: '🧴',
  Pediatrics: '👶',
  Orthopedics: '🦴',
  Psychiatry: '🧠',
};

export function specialtyEmoji(name) {
  return SPECIALTY_EMOJI[name] || '🏥';
}

// "09:00:00" -> "09:00"
export function shortTime(time) {
  return typeof time === 'string' ? time.slice(0, 5) : time;
}

// Turn a "YYYY-MM-DD" string into a weekday number (0 = Sun ... 6 = Sat).
// We build the date from parts to avoid timezone surprises.
export function weekdayOf(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

// Build every slot between start and end, stepping by `stepMinutes`.
// Mirrors the backend SlotService: e.g. ("09:00:00","17:00:00",30) -> ["09:00",...,"16:30"]
export function generateSlots(startTime, endTime, stepMinutes) {
  const slots = [];
  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const pad = (n) => String(n).padStart(2, '0');

  let cursor = toMinutes(startTime);
  const end = toMinutes(endTime);

  // A slot is valid only if it FINISHES on or before the end time.
  while (cursor + stepMinutes <= end) {
    slots.push(`${pad(Math.floor(cursor / 60))}:${pad(cursor % 60)}`);
    cursor += stepMinutes;
  }
  return slots;
}

// Today's date as "YYYY-MM-DD" (local time) — used to block past dates in the calendar.
export function todayString() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Pull a readable message out of an Axios error (Laravel sends { message, errors }).
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.message || fallback;
}
