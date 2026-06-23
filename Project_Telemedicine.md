# Project 2: Telemedicine & Doctor Appointment App

**Version:** 1.0
**Stack:** React Native (Expo) · Laravel 11 · MySQL · Agora Video SDK · Firebase FCM

---

## Overview

A telemedicine application with two React Native apps — one for patients and one for doctors — backed by a Laravel REST API. The system handles doctor discovery, appointment slot management, live video consultations via Agora SDK, and prescription management.

---

## System Components

| Component | Technology | Description |
|-----------|-----------|-------------|
| Patient App | React Native (Expo) | Find doctors, book slots, join video call |
| Doctor App | React Native (Expo) | Manage schedule, consult patients, write prescriptions |
| Backend API | Laravel 11 | REST API, slot engine, appointment lifecycle |
| Database | MySQL | All application data |
| Video | Agora RTC SDK | Live video and audio consultation |
| Notifications | Firebase FCM | Appointment reminders and updates |

---

## Database Schema

| Table | Key Columns |
|-------|------------|
| users | id, name, email, password, phone, avatar, role, fcm_token |
| specialties | id, name, icon, description |
| doctor_profiles | id, user_id, specialty_id, bio, experience_years, consultation_fee, rating, is_verified |
| doctor_availability | id, doctor_id, day_of_week (0–6), start_time, end_time, slot_duration_minutes |
| appointments | id, patient_id, doctor_id, appointment_date, start_time, end_time, status, agora_channel_name, notes, prescription |

---

## Appointment Status Flow

```
pending → confirmed → completed
        ↘ cancelled
```

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Patient or doctor registration |
| POST | /api/auth/login | No | Login, returns JWT |
| GET | /api/auth/me | Yes | Authenticated user details |

### Doctors & Specialties
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/specialties | No | All specialties |
| GET | /api/doctors | Yes | List with specialty filter and name search |
| GET | /api/doctors/{id} | Yes | Doctor profile, specialty, fee |
| GET | /api/doctors/{id}/slots?date= | Yes | Available time slots for a date |

### Appointments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/appointments | Yes | Book appointment, generates agora_channel_name |
| GET | /api/appointments | Yes | Patient or doctor own appointments |
| GET | /api/appointments/{id} | Yes | Appointment detail |
| POST | /api/appointments/{id}/cancel | Yes | Cancel appointment |
| POST | /api/appointments/{id}/complete | Yes (doctor) | Mark done, save prescription |

---

## Build Phases

### Phase 1 — Laravel Backend: Setup, Auth & Doctor Profiles

```
I am building a telemedicine appointment app backend using Laravel 11.
This is Phase 1: Project setup, authentication, and doctor profiles.

Please create the following step by step:

1. Laravel 11 project with packages:
   - tymon/jwt-auth
   - spatie/laravel-permission (roles: patient, doctor, admin)

2. Database migrations:
   - users (id, name, email, password, phone, avatar, role, fcm_token)
   - doctor_profiles (id, user_id, specialty_id, bio, experience_years,
     consultation_fee, rating, is_verified)
   - specialties (id, name, icon, description)
   - doctor_availability (id, doctor_id, day_of_week [0-6], start_time,
     end_time, slot_duration_minutes)

3. Seeders:
   - 6 specialties: General Medicine, Cardiology, Dermatology,
     Pediatrics, Orthopedics, Psychiatry
   - 3 demo doctors with profiles and availability
     (Mon–Fri 9am–5pm, 30-minute slots)

4. API endpoints:
   - POST /api/auth/register (patient or doctor)
   - POST /api/auth/login
   - GET  /api/doctors (list with specialty filter + name search)
   - GET  /api/doctors/{id} (profile, specialty, fee)
   - GET  /api/specialties

5. DoctorController with full working code for all above.

Add clear comments on every important line.
```

---

### Phase 2 — Laravel Backend: Appointments & Slot Management

```
This is Phase 2 of the telemedicine Laravel backend.
Phase 1 is complete: auth, doctor profiles, and specialties are working.

Now create appointment booking logic:

1. New migration:
   - appointments (id, patient_id, doctor_id, appointment_date, start_time,
     end_time, status [pending/confirmed/cancelled/completed],
     agora_channel_name, notes, prescription)

2. SlotService (app/Services/SlotService.php):
   - Method: getAvailableSlots($doctorId, $date)
   - Read doctor availability for the given day_of_week
   - Generate all time slots based on slot_duration_minutes
     (e.g. 09:00, 09:30, 10:00...)
   - Remove slots already booked for that date
   - Return array of available time strings

3. API endpoints:
   - GET  /api/doctors/{id}/slots?date=YYYY-MM-DD
   - POST /api/appointments (book slot, auto-generate agora_channel_name as UUID)
   - GET  /api/appointments (own appointments for patient or doctor)
   - GET  /api/appointments/{id}
   - POST /api/appointments/{id}/cancel
   - POST /api/appointments/{id}/complete (doctor only — save prescription text)

4. AppointmentController with full working code.

5. Email notification on booking using Laravel Mail (simple Mailable class).

Add clear comments on every line.
```

---

### Phase 3 — React Native: Patient App

```
This is Phase 3 — the React Native patient app for the telemedicine project.
The Laravel backend from Phases 1 and 2 is complete.

Stack: React Native (Expo), React Navigation, Axios, React Native Agora.

Create the full project with these files and screens:

1. Project setup:
   - Dependencies: expo, @react-navigation/native, @react-navigation/stack,
     @react-navigation/bottom-tabs, axios, react-native-agora,
     @react-native-async-storage/async-storage, react-native-calendars
   - src/config/api.js: Axios instance with JWT Authorization header interceptor
   - src/store/AuthContext.js: login, logout, token read/write to AsyncStorage

2. Screens:
   - SplashScreen: check stored token → redirect to home or login
   - LoginScreen + RegisterScreen (patient role)
   - HomeScreen: specialty grid (6 icons), search bar, featured doctors list
   - DoctorListScreen: doctors filtered by specialty, with filter chips
   - DoctorProfileScreen: avatar, bio, fee, experience, Book Appointment button
   - BookingScreen:
       Calendar date picker
       Time slot grid fetched from API (available = green, booked = gray)
       Confirm button
   - AppointmentsScreen: upcoming and past tabs with status badge
   - VideoCallScreen:
       Initialize Agora RTC Engine with channel name from appointment
       Show local video (small overlay) and remote video (full screen)
       Mute and end call buttons

3. UI: white background, blue accent (#0277BD).

Add clear comments on every component and function.
```

---

### Phase 4 — React Native: Doctor App

```
This is Phase 4 — the React Native doctor app for the telemedicine project.

Stack: React Native (Expo), React Navigation, Axios, React Native Agora.
Create a SEPARATE Expo project for the doctor app.

Reuse the same src/config/api.js and src/store/AuthContext.js pattern.

Screens:

1. DoctorLoginScreen: email + password login
2. DashboardScreen:
   - Today's appointment count card
   - Next appointment card (patient name, time, Join Call button)
   - This week's total appointments count
3. AppointmentListScreen:
   - All appointments in a FlatList
   - Filter tabs: Upcoming / Completed / Cancelled
4. AppointmentDetailScreen:
   - Patient name and contact
   - Date and time
   - Join Video Call button (uses agora_channel_name from API)
   - Multiline prescription text input
   - Save Prescription button: POST /api/appointments/{id}/complete
5. VideoCallScreen: same Agora integration as patient app
6. ProfileScreen: doctor name, specialty, consultation fee, availability summary

UI accent: #00796B.
Add clear comments on every component and function.
```

---

### Phase 5 — Seed Data & Documentation

```
This is Phase 5 — seed data and documentation for the telemedicine project.
All code from Phases 1–4 is complete.

1. Laravel Seeders:
   - 3 doctors:
       Dr. Smith — Cardiology — smith@demo.com / password123
       Dr. Patel — General Medicine — patel@demo.com / password123
       Dr. Lee — Dermatology — lee@demo.com / password123
   - Each doctor: availability Mon–Fri 9am–5pm, 30-minute slots
   - 2 patient accounts: patient1@demo.com / password123
   - 3 completed appointments with prescription text saved

2. README.md for the GitHub repository:
   - Project title and description
   - Screenshots placeholder section
   - Full feature list
   - Tech stack table (React Native, Laravel, Agora, MySQL)
   - Installation steps: backend, patient app, doctor app
   - Demo credentials table
   - API reference table: method, endpoint, auth required, description

3. 60-second screen recording script:
   - List each screen to show in order
   - Flow: patient login → find doctor → book slot → switch to doctor app →
     accept and join call → enter prescription → switch back to patient app
     showing completed status
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Patient | patient1@demo.com | password123 |
| Patient | patient2@demo.com | password123 |
| Doctor | smith@demo.com | password123 |
| Doctor | patel@demo.com | password123 |
| Doctor | lee@demo.com | password123 |

---

## Environment Variables

```env
APP_NAME=TelemedicineApp
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_DATABASE=telemedicine
DB_USERNAME=root
DB_PASSWORD=

JWT_SECRET=
JWT_TTL=60

MAIL_MAILER=smtp
MAIL_HOST=
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=

AGORA_APP_ID=
AGORA_APP_CERTIFICATE=

FIREBASE_SERVER_KEY=
```
