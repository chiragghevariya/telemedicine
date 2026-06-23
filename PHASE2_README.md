# Telemedicine API — Phase 2 (Appointment Booking)

Builds on Phase 1 (auth, doctors, specialties). Phase 2 adds the booking system:
available-slot generation, booking, cancel/complete, and a confirmation email.

> Run `php artisan migrate:fresh --seed` once to create the new `appointments`
> table, then `php artisan serve`.

---

## 1. What's new

| Piece | File |
|-------|------|
| `appointments` table | `database/migrations/2026_06_12_050000_create_appointments_table.php` |
| `Appointment` model | `app/Models/Appointment.php` |
| Slot generation logic | `app/Services/SlotService.php` |
| Booking endpoints | `app/Http/Controllers/AppointmentController.php` |
| JSON shape | `app/Http/Resources/AppointmentResource.php` |
| Confirmation email | `app/Mail/AppointmentBooked.php` + `resources/views/emails/appointment-booked.blade.php` |

---

## 2. New API endpoints

Base URL: `http://127.0.0.1:8000/api`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET  | `/doctors/{id}/slots?date=YYYY-MM-DD` | — | Free time slots for a doctor on a date |
| POST | `/appointments` | Bearer | Book an appointment (patient) |
| GET  | `/appointments` | Bearer | List my appointments (patient = own, doctor = booked with me) |
| GET  | `/appointments/{id}` | Bearer | One appointment (patient or doctor only) |
| POST | `/appointments/{id}/cancel` | Bearer | Cancel (patient or doctor) |
| POST | `/appointments/{id}/complete` | Bearer | Mark complete + save prescription (**doctor only**) |

### How slots are generated (`SlotService::getAvailableSlots`)
1. Find which **weekday** the requested date is (0 = Sun … 6 = Sat).
2. Look up the doctor's `doctor_availability` row for that weekday. No row → no slots.
3. Walk from `start_time` to `end_time` in `slot_duration_minutes` steps → `["09:00","09:30",...]`.
4. Remove slots already taken by a non-cancelled appointment on that date.

### Appointment lifecycle (`status`)
`pending` → (booked) … `completed` (doctor finishes) **or** `cancelled` (either side cancels).
Cancelled slots become bookable again; completed/cancelled appointments can't be cancelled.

### Agora video call
On booking, a unique `agora_channel_name` (e.g. `telemed_da86188d…`) is generated.
In **Phase 3** both the patient and doctor apps will join this channel for the video consult.

---

## 3. Example flow

```bash
# 1) See free slots (public)
curl "http://127.0.0.1:8000/api/doctors/1/slots?date=2026-06-15" -H "Accept: application/json"

# 2) Log in as a patient to get a token
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Accept: application/json" -H "Content-Type: application/json" \
  -d '{"email":"patient1@demo.com","password":"password123"}' | php -r 'echo json_decode(file_get_contents("php://stdin"))->access_token;')

# 3) Book a slot
curl -X POST http://127.0.0.1:8000/api/appointments \
  -H "Accept: application/json" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"doctor_id":1,"appointment_date":"2026-06-15","start_time":"09:00","notes":"Chest pain"}'

# 4) List my appointments
curl http://127.0.0.1:8000/api/appointments -H "Accept: application/json" -H "Authorization: Bearer $TOKEN"

# 5) Doctor completes it (log in as smith@demo.com / password123)
curl -X POST http://127.0.0.1:8000/api/appointments/1/complete \
  -H "Accept: application/json" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DOCTOR_TOKEN" \
  -d '{"prescription":"Take aspirin 75mg daily."}'
```

### Booking request fields
| Field | Required | Notes |
|-------|----------|-------|
| `doctor_id` | yes | `doctor_profiles.id`, must be a **verified** doctor |
| `appointment_date` | yes | `YYYY-MM-DD`, today or later |
| `start_time` | yes | `HH:MM` (must be one of the free slots) |
| `notes` | no | patient's reason for the visit |

`end_time` is calculated automatically from the doctor's slot length, so you don't send it.

---

## 4. Email notification

Booking sends an `AppointmentBooked` email to the patient.
With the default `MAIL_MAILER=log`, it's written to **`storage/logs/laravel.log`** — open that
file to see it. To send real email, set SMTP details in `.env` (e.g. Mailtrap, Gmail, SES).
The email send is wrapped in a `try/catch`, so a mail problem never blocks a booking.

---

## 5. Security hardening also applied (from a code review of Phase 1)

These were fixed while building Phase 2:

- **Verified doctors only** are returned by `GET /api/doctors` and `/doctors/{id}`, and only
  verified doctors can be booked (self-registered doctors stay hidden until approved).
- **`role` is no longer mass-assignable** on `User` — it's set explicitly in code, so request
  data can never make someone an `admin`.
- **Doctor email/phone removed** from the public doctor listing (`DoctorResource`).
- **`fcm_token` removed** from auth responses (`UserResource`).
- **Rate limiting** (`throttle:10,1`) on `/auth/login` and `/auth/register`.
- **Doctor registration wrapped in a DB transaction** (no half-created doctor accounts).
- **`per_page` clamped** to 1–100 and **search wildcards escaped** on the doctor list.
- **Password minimum raised** to 8 characters (`Password::min(8)`).

---

## 6. Coming in Phase 3
- Agora token generation + the actual video/audio call screens
- Push notifications (FCM) for appointment reminders & status changes
