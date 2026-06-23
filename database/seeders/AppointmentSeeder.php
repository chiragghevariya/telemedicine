<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Seeds 3 COMPLETED appointments (with prescriptions) so the demo has realistic
 * history to show in the "Past" tab and the doctor's completed list.
 *
 * Runs AFTER DoctorSeeder + PatientSeeder so the accounts already exist.
 */
class AppointmentSeeder extends Seeder
{
    public function run(): void
    {
        // Each row: patient email, doctor email, how many business days ago, time, prescription.
        $completed = [
            [
                'patient' => 'patient1@demo.com', 'doctor' => 'smith@demo.com',
                'days_ago' => 6, 'start' => '09:00:00', 'end' => '09:30:00',
                'prescription' => 'Aspirin 75mg once daily. Monitor blood pressure weekly and follow up in 1 month.',
            ],
            [
                'patient' => 'patient1@demo.com', 'doctor' => 'patel@demo.com',
                'days_ago' => 4, 'start' => '10:00:00', 'end' => '10:30:00',
                'prescription' => 'Paracetamol 500mg as needed for fever. Stay hydrated and rest for 3 days.',
            ],
            [
                'patient' => 'patient2@demo.com', 'doctor' => 'lee@demo.com',
                'days_ago' => 2, 'start' => '11:00:00', 'end' => '11:30:00',
                'prescription' => 'Apply hydrocortisone 1% cream twice daily. Avoid fragranced soaps for 2 weeks.',
            ],
        ];

        foreach ($completed as $index => $info) {
            $patient = User::where('email', $info['patient'])->first();
            $doctorUser = User::where('email', $info['doctor'])->first();
            if (! $patient || ! $doctorUser) {
                continue; // skip if the demo accounts aren't present
            }

            // The appointment's doctor_id points at doctor_profiles.id (not users.id).
            $doctorProfile = DoctorProfile::where('user_id', $doctorUser->id)->first();
            if (! $doctorProfile) {
                continue;
            }

            // A date in the recent past (these appointments are already finished).
            $date = Carbon::now()->subDays($info['days_ago'])->toDateString();

            Appointment::updateOrCreate(
                [
                    'patient_id'       => $patient->id,
                    'doctor_id'        => $doctorProfile->id,
                    'appointment_date' => $date,
                    'start_time'       => $info['start'],
                ],
                [
                    'end_time'           => $info['end'],
                    'status'             => Appointment::STATUS_COMPLETED,
                    'agora_channel_name' => 'telemed_seed_'.($index + 1),
                    'notes'              => 'Demo consultation.',
                    'prescription'       => $info['prescription'],
                ]
            );
        }
    }
}
