<?php

namespace Database\Seeders;

use App\Models\DoctorAvailability;
use App\Models\DoctorProfile;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeds 3 demo doctors, each with a user account, a doctor profile, and a
 * Monday–Friday 9am–5pm availability split into 30-minute slots.
 *
 * Login for every demo doctor:  email below  /  password: "password123"
 */
class DoctorSeeder extends Seeder
{
    public function run(): void
    {
        $demoDoctors = [
            [
                'name' => 'Dr. Smith', 'email' => 'smith@demo.com',
                'specialty' => 'Cardiology', 'experience_years' => 15,
                'consultation_fee' => 90.00, 'rating' => 4.90,
                'bio' => 'Consultant cardiologist with 15 years of experience in heart care.',
            ],
            [
                'name' => 'Dr. Patel', 'email' => 'patel@demo.com',
                'specialty' => 'General Medicine', 'experience_years' => 9,
                'consultation_fee' => 50.00, 'rating' => 4.70,
                'bio' => 'General physician for everyday health concerns and check-ups.',
            ],
            [
                'name' => 'Dr. Lee', 'email' => 'lee@demo.com',
                'specialty' => 'Dermatology', 'experience_years' => 11,
                'consultation_fee' => 65.00, 'rating' => 4.80,
                'bio' => 'Dermatologist focused on skin health and cosmetic care.',
            ],
        ];

        foreach ($demoDoctors as $info) {
            // 1) Create (or reuse) the doctor's user account.
            //    The password is hashed automatically by the model cast.
            $user = User::updateOrCreate(
                ['email' => $info['email']],
                [
                    'name'     => $info['name'],
                    'password' => 'password123',
                    'phone'    => '+1-555-0100',
                ]
            );

            // 'role' is not mass-assignable, so set it explicitly then save.
            $user->role = 'doctor';
            $user->save();

            // 2) Make sure the user has the "doctor" Spatie role.
            $user->assignRole('doctor');

            // 3) Look the specialty up by name (works whatever its id happens to be).
            $specialty = Specialty::where('name', $info['specialty'])->first();

            // 4) Create (or update) the doctor profile.
            $profile = DoctorProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'specialty_id'     => $specialty?->id,
                    'bio'              => $info['bio'],
                    'experience_years' => $info['experience_years'],
                    'consultation_fee' => $info['consultation_fee'],
                    'rating'           => $info['rating'],
                    'is_verified'      => true, // demo doctors are pre-verified
                ]
            );

            // 5) Add availability for Monday(1) through Friday(5), 9am–5pm, 30-min slots.
            foreach (range(1, 5) as $dayOfWeek) {
                DoctorAvailability::updateOrCreate(
                    ['doctor_id' => $profile->id, 'day_of_week' => $dayOfWeek],
                    [
                        'start_time'            => '09:00:00',
                        'end_time'              => '17:00:00',
                        'slot_duration_minutes' => 30,
                    ]
                );
            }
        }
    }
}
