# Telemedicine API — Phase 1 (Auth + Doctor Profiles)

Laravel 11 backend for a telemedicine / doctor-appointment app.
**Phase 1** covers project setup, JWT authentication, roles, and doctor/specialty browsing.

- **Auth:** JWT via `tymon/jwt-auth`
- **Roles & permissions:** `spatie/laravel-permission` (`patient`, `doctor`, `admin`)
- **Database:** SQLite by default (zero setup). MySQL instructions are in `.env`.

---

## 1. Requirements

- PHP 8.2+ (this project was built on 8.3)
- Composer
- The `pdo_sqlite` PHP extension (enabled by default here) — or MySQL if you prefer.

---

## 2. Setup (fresh machine)

```bash
composer install              # install PHP dependencies
cp .env.example .env          # if you don't already have a .env
php artisan key:generate      # app encryption key
php artisan jwt:secret        # JWT signing secret
php artisan migrate:fresh --seed   # create tables + demo data
php artisan serve             # start the API at http://127.0.0.1:8000
```

> Already set up in this repo? Just run `php artisan migrate:fresh --seed` to (re)load
> the demo data, then `php artisan serve`.

### Using MySQL (Laragon) instead of SQLite
Open `.env`, comment out `DB_CONNECTION=sqlite`, uncomment the MySQL block, create a
database called `telemedicine` in Laragon, set your MySQL password, then:
```bash
php artisan migrate:fresh --seed
```

---

## 3. Demo accounts

All demo doctors share the password **`password123`**.

| Name      | Email          | Specialty        |
|-----------|----------------|------------------|
| Dr. Smith | smith@demo.com | Cardiology       |
| Dr. Patel | patel@demo.com | General Medicine |
| Dr. Lee   | lee@demo.com   | Dermatology      |

Each doctor is available **Monday–Friday, 09:00–17:00, in 30-minute slots**.

---

## 4. API endpoints

Base URL: `http://127.0.0.1:8000/api`

| Method | Path                | Auth   | Description                                  |
|--------|---------------------|--------|----------------------------------------------|
| POST   | `/auth/register`    | —      | Register a `patient` or `doctor`             |
| POST   | `/auth/login`       | —      | Log in, returns a JWT                        |
| GET    | `/auth/me`          | Bearer | The current logged-in user                   |
| POST   | `/auth/logout`      | Bearer | Invalidate the current token                 |
| GET    | `/specialties`      | —      | List all specialties                         |
| GET    | `/doctors`          | —      | List doctors (`?specialty_id=`, `?search=`, `?per_page=`) |
| GET    | `/doctors/{id}`     | —      | One doctor + specialty + availability        |

Protected routes need the header: `Authorization: Bearer <access_token>`.

### Example requests

**Register a patient**
```bash
curl -X POST http://127.0.0.1:8000/api/auth/register \
  -H "Accept: application/json" -H "Content-Type: application/json" \
  -d '{
        "name": "John Patient",
        "email": "john@example.com",
        "password": "secret123",
        "password_confirmation": "secret123",
        "phone": "+15551234",
        "role": "patient"
      }'
```

**Register a doctor** (doctors must include `specialty_id`)
```bash
curl -X POST http://127.0.0.1:8000/api/auth/register \
  -H "Accept: application/json" -H "Content-Type: application/json" \
  -d '{
        "name": "Dr. Jane Doe",
        "email": "jane@example.com",
        "password": "secret123",
        "password_confirmation": "secret123",
        "role": "doctor",
        "specialty_id": 2,
        "experience_years": 7,
        "consultation_fee": 65
      }'
```

**Log in**
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Accept: application/json" -H "Content-Type: application/json" \
  -d '{"email": "smith@demo.com", "password": "password123"}'
```

**Use the token**
```bash
curl http://127.0.0.1:8000/api/auth/me \
  -H "Accept: application/json" \
  -H "Authorization: Bearer PASTE_TOKEN_HERE"
```

**Browse doctors**
```bash
curl "http://127.0.0.1:8000/api/doctors?specialty_id=2&search=sarah" -H "Accept: application/json"
curl "http://127.0.0.1:8000/api/doctors/1" -H "Accept: application/json"
curl "http://127.0.0.1:8000/api/specialties" -H "Accept: application/json"
```

> Tip: always send `Accept: application/json` so errors come back as JSON, not HTML.

---

## 5. Where things live

```
app/
  Models/            User, Specialty, DoctorProfile, DoctorAvailability
  Http/Controllers/  AuthController, DoctorController, SpecialtyController
  Http/Resources/    UserResource, DoctorResource, SpecialtyResource, DoctorAvailabilityResource
config/
  auth.php           adds the JWT "api" guard
  jwt.php            tymon/jwt-auth config
  permission.php     spatie config
routes/
  api.php            all the API routes above
database/
  migrations/        users (extended), specialties, doctor_profiles, doctor_availability, permission tables
  seeders/           RoleSeeder, SpecialtySeeder, DoctorSeeder (run via DatabaseSeeder)
bootstrap/app.php    enables /api routes, registers role middleware, forces JSON errors for /api
```

### A note on roles
The `users.role` column gives you a quick, readable role on the user record, **and** the same
role is registered with `spatie/laravel-permission` so you can use middleware like
`->middleware('role:doctor')` and checks like `$user->hasRole('doctor')` in later phases.

### `day_of_week` convention
`0 = Sunday, 1 = Monday … 6 = Saturday` (matches Carbon's `->dayOfWeek` and JS `Date.getDay()`).
Demo doctors are seeded for days **1–5** (Mon–Fri).

---

## 6. Coming in later phases
- Appointment booking + slot generation from `doctor_availability`
- Doctor app: accept/decline appointments, write prescriptions
- Agora video/audio consultation
- Push notifications (the `fcm_token` column is already in place)
