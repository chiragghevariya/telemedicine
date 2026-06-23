// Small helper functions shared across the doctor app's screens.

// Day-of-week number (0-6) to a readable name. Matches the backend (0 = Sunday).
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export function dayName(n) {
  return DAY_NAMES[n] ?? '';
}

// "09:00:00" -> "09:00"
export function shortTime(time) {
  return typeof time === 'string' ? time.slice(0, 5) : time;
}

// Today's date as "YYYY-MM-DD" (local time).
export function todayString() {
  return dateToString(new Date());
}

// A date that is `days` from today, as "YYYY-MM-DD". e.g. daysFromToday(6) = a week out.
export function daysFromToday(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return dateToString(d);
}

function dateToString(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Pull a readable message out of an error (Axios/Laravel {message} or a thrown Error).
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.message || error?.message || fallback;
}
