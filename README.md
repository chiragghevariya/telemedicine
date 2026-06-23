# 🩺 Telemedicine & Doctor Appointment App

A full-stack telemedicine platform that lets patients **find doctors, book appointment
slots, and have live video consultations**, while doctors **manage their schedule, review
patients, and write prescriptions** — all from native mobile apps backed by a Laravel API.

Built as a complete, production-shaped demo: a **Laravel 11 REST API**, a **React Native
patient app**, and a **separate React Native doctor app**, with **Agora** powering real-time
video/audio calls.

---

## 📱 Screenshots

> _Replace these placeholders with real screenshots (put images in `docs/screenshots/`)._

| Patient — Home | Patient — Booking | Doctor — Dashboard | Video Call |
|:---:|:---:|:---:|:---:|
| ![Home](docs/screenshots/home.png) | ![Booking](docs/screenshots/booking.png) | ![Dashboard](docs/screenshots/dashboard.png) | ![Video Call](docs/screenshots/video.png) |

---

## ✨ Features

**Patient app**
- 🔐 Register / login (JWT auth)
- 🔎 Browse doctors by specialty, search by name
- 👨‍⚕️ Doctor profiles — bio, fee, rating, experience
- 📅 Book appointments from a live slot grid (green = free, gray = booked)
- 🎥 One-tap video consultation (Agora)
- 🗂️ Appointment history with status badges (upcoming / past)

**Doctor app**
- 📊 Dashboard — today's count, next appointment, weekly workload
- 🗓️ All appointments with status filter tabs
- 🎥 Join the same video channel as the patient
- 📝 Write & save prescriptions (marks the visit completed)
- 👤 Own profile — fee, rating, weekly availability

**Backend**
- 🔑 JWT authentication + role-based access (patient / doctor / admin)
- 🧮 Smart slot generation from each doctor's weekly availability
- 📧 Email confirmation on booking
- 🛡️ Hardened: verified-doctors-only listings, rate-limited auth, no PII leaks

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile apps (patient + doctor) | **React Native** (Expo) |
| Navigation | React Navigation |
| Real-time video / audio | **Agora** RTC SDK |
| Backend API | **Laravel 11** (PHP 8.3) |
| Authentication | JWT (`tymon/jwt-auth`) |
| Roles & permissions | `spatie/laravel-permission` |
| Database | **MySQL** |
| HTTP client | Axios |

---

## 🏗️ Project structure

```
telemedicine/         → Laravel 11 API (this folder)
  app/  database/  routes/ ...
patient-app/          → React Native patient app (Expo)
doctor-app/           → React Native doctor app (Expo)
```

---

## 🚀 Setup

### 1. Backend (Laravel API)

```bash
# from the project root
composer install
cp .env.example .env        # if you don't have a .env yet
php artisan key:generate
php artisan jwt:secret
```

Configure the database in `.env` (MySQL):
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=telemedicine
DB_USERNAME=root
DB_PASSWORD=
```
> Create a database named `telemedicine` first. _(Prefer zero setup? The repo also works
> with SQLite — set `DB_CONNECTION=sqlite` and create `database/database.sqlite`.)_

Then create the tables + demo data and start the server:
```bash
php artisan migrate:fresh --seed
php artisan serve --host=0.0.0.0 --port=8000
```

### 2. Patient app

```bash
cd patient-app
npm install
npx expo install --fix
# set API_HOST in src/config/api.js  +  AGORA_APP_ID in src/config/agora.js
npx expo start
```

### 3. Doctor app

```bash
cd doctor-app
npm install
npx expo install --fix
# set API_HOST in src/config/api.js  +  AGORA_APP_ID in src/config/agora.js
npx expo start
```

> **Video calls** use a native module (`react-native-agora`) and need a development build:
> `npx expo prebuild && npx expo run:android`. Everything else runs in Expo Go.

---

## 🔑 Demo credentials

All demo accounts use the password **`password123`**.

| Role | Email |
|------|-------|
| Patient | `patient1@demo.com` |
| Patient | `patient2@demo.com` |
| Doctor (Cardiology) | `smith@demo.com` |
| Doctor (General Medicine) | `patel@demo.com` |
| Doctor (Dermatology) | `lee@demo.com` |

The demo data includes 3 doctors (Mon–Fri 9am–5pm availability) and 3 completed
appointments with prescriptions.

---

## 📡 API reference (main endpoints)

Base URL: `http://<host>:8000/api` · Protected routes need `Authorization: Bearer <token>`

| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 1 | POST | `/auth/register` | — | Register a patient (or doctor) |
| 2 | POST | `/auth/login` | — | Log in, returns a JWT |
| 3 | GET | `/specialties` | — | List medical specialties |
| 4 | GET | `/doctors` | — | List doctors (`?specialty_id=`, `?search=`) |
| 5 | GET | `/doctors/{id}` | — | Doctor profile + weekly availability |
| 6 | GET | `/doctors/{id}/slots?date=` | — | Free time slots for a date |
| 7 | POST | `/appointments` | ✅ | Book an appointment |
| 8 | GET | `/appointments` | ✅ | List my appointments (patient or doctor) |
| 9 | POST | `/appointments/{id}/complete` | ✅ | Complete visit + save prescription (doctor) |
| 10 | GET | `/me/doctor-profile` | ✅ | Logged-in doctor's own profile |

---

## 📄 License

Released for portfolio / demonstration purposes.
