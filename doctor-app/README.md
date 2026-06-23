# Telemedicine — Doctor App (React Native / Expo)

The doctor-facing mobile app for the telemedicine demo. A **separate** Expo project
from the patient app, with a **teal (#00796B)** accent so the two are easy to tell apart.

**Stack:** Expo SDK 52 · React Navigation 7 (native-stack + bottom-tabs) · Axios · React Native Agora · AsyncStorage

---

## 1. Before you start — two things you MUST set

1. **API address** — edit `src/config/api.js`, set `API_HOST`:
   | Running on | Use |
   |------------|-----|
   | Physical phone (Expo Go) | your PC's LAN IP, e.g. `192.168.1.50` |
   | Android emulator | `10.0.2.2` |
   | iOS simulator | `127.0.0.1` |

   Start Laravel so the phone can reach it: `php artisan serve --host=0.0.0.0 --port=8000`

2. **Agora App ID** — edit `src/config/agora.js`. Use the **same** App ID as the patient
   app so the doctor and patient join the same channel.

---

## 2. Install & run

```bash
cd doctor-app
npm install
npx expo install --fix        # align native versions with the Expo SDK

npx expo start                # all screens except video work in Expo Go
```

Video call (native module → needs a development build, not Expo Go):
```bash
npx expo prebuild
npx expo run:android          # or run:ios
```

**Log in with a doctor account.** Demo: `smith@demo.com` / `password123`
(patient accounts are rejected at login).

---

## 3. Screens

| Screen | What it does |
|--------|--------------|
| DoctorLogin | Login (doctor accounts only) |
| Dashboard | Today's count, next appointment (+ Join), weekly summary |
| Appointments | All appointments with status filter tabs |
| AppointmentDetail | Patient info, Join Video Call, write & save prescription |
| VideoCall | Agora channel join, local+remote video, mute/end |
| Profile | Own profile: fee, rating, experience, weekly availability, logout |

## 4. How it connects to the backend (Phase 1 & 2 + one addition)

- Login uses `POST /api/auth/login` and only allows users with `role: "doctor"`.
- Appointments come from `GET /api/appointments` (the backend returns the appointments
  booked with the logged-in doctor).
- **Saving a prescription** calls `POST /api/appointments/{id}/complete` with
  `{ prescription }` — this also marks the appointment **completed**.
  (The brief said `PUT`; the Phase 2 backend implemented it as `POST`, so the app uses POST.)
- The Profile screen uses a small endpoint added for this app:
  **`GET /api/me/doctor-profile`** → the logged-in doctor's profile + availability.
- The video call joins the appointment's `agora_channel_name` from the backend — the
  same channel the patient app joins.

## 5. Notes
- A separate AsyncStorage token key (`doctor_token`) is used so the doctor and patient
  apps can be installed side by side without clashing.
- For production video, replace the empty Agora token with one from a token server.
