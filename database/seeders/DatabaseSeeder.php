<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Clear Spatie's cached roles/permissions so newly-seeded roles are
        // immediately usable when we assign them to the demo doctors.
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // Order matters: roles must exist before doctors are assigned roles,
        // and specialties must exist before doctor profiles reference them.
        $this->call([
            RoleSeeder::class,        // 1) roles: patient, doctor, admin
            SpecialtySeeder::class,   // 2) the 6 specialties
            DoctorSeeder::class,      // 3) 3 demo doctors + profiles + availability
            PatientSeeder::class,     // 4) 2 demo patient accounts
            AppointmentSeeder::class, // 5) 3 completed appointments with prescriptions
        ]);
    }
}
