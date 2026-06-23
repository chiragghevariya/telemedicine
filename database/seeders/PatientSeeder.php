<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeds 2 demo patient accounts.
 *
 * Login:  patient1@demo.com / password123
 *         patient2@demo.com / password123
 */
class PatientSeeder extends Seeder
{
    public function run(): void
    {
        $patients = [
            ['name' => 'John Patient', 'email' => 'patient1@demo.com'],
            ['name' => 'Emma Patient', 'email' => 'patient2@demo.com'],
        ];

        foreach ($patients as $info) {
            // Create (or reuse) the patient's user account (password auto-hashed).
            $user = User::updateOrCreate(
                ['email' => $info['email']],
                [
                    'name'     => $info['name'],
                    'password' => 'password123',
                    'phone'    => '+1-555-0200',
                ]
            );

            // 'role' is not mass-assignable, so set it explicitly then save.
            $user->role = 'patient';
            $user->save();

            // Give them the "patient" Spatie role.
            $user->assignRole('patient');
        }
    }
}
