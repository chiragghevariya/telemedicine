# Telemedicine — Patient App (React Native / Expo)

The patient mobile app for the telemedicine demo. Talks to the Laravel API from
Phase 1 & 2 (auth, doctors, appointments) and does video calls with Agora.

**Stack:** Expo SDK 52 · React Navigation 7 · Axios · React Native Agora · AsyncStorage · react-native-calendars

---

## 1. Before you start — two things you MUST set

1. **API address** — edit `src/config/api.js`, set `API_HOST` to where your Laravel
   server is reachable from the phone:
   | Running on | Use |
   |------------|-----|
   | Physical phone (Expo Go / dev build) | your PC's LAN IP, e.g. `192.168.1.50` |
   | Android emulator | `10.0.2.2` |
   | iOS simulator | `127.0.0.1` |

   Start Laravel so the phone can reach it:
   ```bash
   # in the telemedicine (Laravel) folder
   php artisan serve --host=0.0.0.0 --port=8000
   ```

2. **Agora App ID** — edit `src/config/agora.js`, paste your App ID from
   https://console.agora.io (keep the project in **Testing mode** for the demo).

---

## 2. Install & run

```bash
cd patient-app
npm install

# (recommended) align native module versions with the Expo SDK
npx expo install --fix
```

### Run the normal screens (login, doctors, booking) — Expo Go is fine
```bash
npx expo start
```
Scan the QR code with the Expo Go app. **Everything except the video call works in Expo Go.**

### Run the video call — needs a development build (NOT Expo Go)
`react-native-agora` is a native module, so the video screen needs a real build:
```bash
npx expo prebuild          # generates the native android/ios projects
npx expo run:android       # build & run on a device/emulator
# or: npx expo run:ios
```
In Expo Go, the video screen shows a friendly "needs a development build" message
instead of crashing, so you can still demo the rest of the app.

---

## 3. App structure

```
App.js                      → wraps the app in SafeArea + Auth + Navigation
src/
  config/
    api.js                  → axios instance + JWT interceptor (SET API_HOST HERE)
    agora.js                → Agora App ID (SET IT HERE)
    theme.js                → colors (white bg, blue #0277BD) + spacing
  store/
    AuthContext.js          → login / register / logout + token storage
  navigation/
    RootNavigator.js        → logged-in vs logged-out screens + bottom tabs
  components/
    PrimaryButton, Input, DoctorCard, StatusBadge
  utils/
    helpers.js              → slot generation, date/time helpers, error parsing
  screens/
    SplashScreen            → shown while checking the saved token
    LoginScreen / RegisterScreen
    HomeScreen              → specialty grid, search, top doctors
    DoctorListScreen        → list + specialty filter chips
    DoctorProfileScreen     → photo, bio, fee, "Book Appointment"
    BookingScreen           → calendar + slot grid (green=free, gray=booked)
    AppointmentsScreen      → Upcoming / Past tabs with status badges
    VideoCallScreen         → Agora join channel, local+remote video, mute/end
```

## 4. How it connects to the backend

- On login/register the JWT is saved to `AsyncStorage`; `src/config/api.js` attaches it
  as `Authorization: Bearer <token>` on every request automatically.
- The booking screen builds the full slot grid from the doctor's availability, then calls
  `GET /api/doctors/{id}/slots` to find which are free (green) vs booked (gray).
- Each booked appointment has an `agora_channel_name` from the backend — the video screen
  joins exactly that channel.

## 5. Notes / next steps

- **Choices made for simplicity:** used `@react-navigation/native-stack` (no
  `react-native-gesture-handler` setup needed) instead of `@react-navigation/stack`.
- **Agora token:** the demo joins with an empty token (testing mode). For production,
  add a small backend endpoint that returns a per-channel RTC token and pass it in
  `src/config/agora.js`.
- If `npm install` picks slightly different native versions, `npx expo install --fix`
  realigns them to your Expo SDK.
