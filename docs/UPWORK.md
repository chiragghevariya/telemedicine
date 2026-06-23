# Upwork Portfolio Pack — Telemedicine & Doctor Appointment App

Copy-paste material for your Upwork profile, proposals, and demo video.

---

## 1. Portfolio Description (~200 words)

**Telemedicine & Doctor Appointment Platform**

I designed and delivered a complete telemedicine solution that lets a clinic run
consultations entirely online. The system pairs two native mobile apps — one for
patients, one for doctors — with a robust REST API backend.

Patients can browse doctors by specialty, view profiles and fees, book appointment
slots from a real-time availability calendar, and join secure live video
consultations. Doctors get a dedicated app to manage their schedule, see daily and
weekly workloads, run video calls, and issue digital prescriptions saved straight to
the patient's record.

Technically, I built both mobile apps with **React Native (Expo)** and React
Navigation, the backend with **Laravel** (JWT authentication, role-based access,
intelligent appointment-slot generation, and email notifications), and integrated the
**Agora Video SDK** for low-latency HD video/audio calls. Data is stored in **MySQL**.

The result: the clinic enabled its doctors to **handle 3x more patients without
physical visits**, eliminated phone-tag scheduling, and gave patients a modern,
app-store-quality booking and consultation experience.

Delivered end-to-end — API, both apps, database design, seed data, and documentation —
and architected to extend cleanly with payments and push notifications.

---

## 2. 10 Upwork Job Titles This Demo Is Perfect For

1. Telemedicine App Developer (React Native + Laravel)
2. Build a Doctor Appointment Booking App (iOS & Android)
3. React Native Developer for Healthcare / Medical App
4. Video Consultation App — Agora Integration Expert
5. Full-Stack Mobile Developer (Laravel API + React Native)
6. Healthcare Platform: Patient & Doctor Mobile Apps
7. Laravel REST API Developer for a Mobile App Backend
8. On-Demand Appointment Scheduling App Developer
9. Build a Telehealth MVP with Live Video Calls
10. React Native + Agora Live Video Calling Specialist

---

## 3. 60-Second Demo Video Script

**Goal:** show the full patient → doctor → video → prescription loop in one minute.
Record the patient phone on the left and the doctor phone on the right where possible.

| Time | On screen | What to say (voiceover) |
|------|-----------|--------------------------|
| 0:00–0:07 | Patient app splash → Home (specialty grid) | "This is a telemedicine app I built — patients book doctors and consult by video. Here's the patient app." |
| 0:07–0:16 | Tap **Cardiology** → doctor list → open **Dr. Smith** profile | "They browse by specialty, then open a doctor to see the bio, rating, and consultation fee." |
| 0:16–0:30 | **Booking**: pick a date on the calendar → slot grid appears (green = free, gray = booked) → tap a green slot → **Confirm** | "Booking pulls the doctor's real availability — green slots are free, gray are taken. Pick one, confirm, and it's booked instantly." |
| 0:30–0:38 | Patient **Appointments** tab → upcoming card → tap **Join Call** | "The appointment shows up here with a status badge, and the patient can jump straight into the video call." |
| 0:38–0:48 | Switch to **Doctor app** → Dashboard (today's count, next appointment) → open appointment detail | "Now the doctor's app — a dashboard with today's appointments and patient details." |
| 0:48–0:57 | **Video call** connected (both faces) → doctor types a **prescription** → **Save** | "They consult over live HD video powered by Agora, then write and save a prescription — which completes the visit." |
| 0:57–1:00 | Prescription now visible on the patient's past appointment | "And the patient instantly has their prescription. React Native, Laravel, and Agora — full stack, end to end." |

**Recording tips**
- Use the seeded demo data so there's history to show (`patient1@demo.com` / `password123`).
- For the video-call segment, run a development build (`npx expo run:android`) on two
  devices/emulators joined to the same appointment.
- Keep cuts tight; aim for ~7–10 seconds per scene. Add soft background music and captions.
