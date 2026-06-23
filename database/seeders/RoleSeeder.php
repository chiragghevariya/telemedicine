<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

/**
 * Creates the three Spatie roles used by the app.
 * These must exist before we assign roles to users (so run this first).
 */
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['patient', 'doctor', 'admin'] as $role) {
            // firstOrCreate is idempotent: running the seeder twice won't create duplicates.
            // 'web' is Spatie's default guard (matches our User model's default guard).
            Role::firstOrCreate([
                'name'       => $role,
                'guard_name' => 'web',
            ]);
        }
    }
}
