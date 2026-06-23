<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the "doctor_availability" table.
     * Each row says: "this doctor is available on this weekday, between these times,
     * split into slots of N minutes." The booking logic (Phase 2) turns these rows
     * into concrete bookable time slots.
     */
    public function up(): void
    {
        Schema::create('doctor_availability', function (Blueprint $table) {
            $table->id();

            // Which doctor this availability belongs to (doctor_profiles.id).
            // Delete the availability automatically if the doctor profile is removed.
            $table->foreignId('doctor_id')
                  ->constrained('doctor_profiles')
                  ->cascadeOnDelete();

            // Day of the week: 0 = Sunday, 1 = Monday ... 6 = Saturday.
            // (Matches Carbon's ->dayOfWeek and JavaScript's Date.getDay().)
            $table->unsignedTinyInteger('day_of_week');

            $table->time('start_time');                                   // e.g. 09:00:00
            $table->time('end_time');                                     // e.g. 17:00:00
            $table->unsignedSmallInteger('slot_duration_minutes')->default(30); // length of each slot

            $table->timestamps();

            // A doctor should only have one availability row per weekday.
            $table->unique(['doctor_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_availability');
    }
};
