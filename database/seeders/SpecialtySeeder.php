<?php

namespace Database\Seeders;

use App\Models\Specialty;
use Illuminate\Database\Seeder;

/**
 * Seeds the 6 medical specialties shown in the app.
 */
class SpecialtySeeder extends Seeder
{
    public function run(): void
    {
        $specialties = [
            ['name' => 'General Medicine', 'icon' => 'stethoscope', 'description' => 'Everyday health concerns, check-ups and general advice.'],
            ['name' => 'Cardiology',       'icon' => 'heart-pulse', 'description' => 'Heart and blood-vessel conditions.'],
            ['name' => 'Dermatology',      'icon' => 'skin',        'description' => 'Skin, hair and nail problems.'],
            ['name' => 'Pediatrics',       'icon' => 'baby',        'description' => 'Healthcare for infants, children and teenagers.'],
            ['name' => 'Orthopedics',      'icon' => 'bone',        'description' => 'Bones, joints, muscles and ligaments.'],
            ['name' => 'Psychiatry',       'icon' => 'brain',       'description' => 'Mental health and emotional wellbeing.'],
        ];

        foreach ($specialties as $specialty) {
            // Keyed on name so re-running the seeder updates instead of duplicating.
            Specialty::updateOrCreate(['name' => $specialty['name']], $specialty);
        }
    }
}
