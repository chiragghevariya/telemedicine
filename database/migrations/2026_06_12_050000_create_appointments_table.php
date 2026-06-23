<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the "appointments" table — one row per booked consultation.
     */
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();

            // The patient who booked (a row in users). Delete their appointments
            // automatically if the user account is removed.
            $table->foreignId('patient_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // The doctor being seen. This points at doctor_profiles.id — the same
            // "doctor" id used by /api/doctors and doctor_availability.
            $table->foreignId('doctor_id')
                  ->constrained('doctor_profiles')
                  ->cascadeOnDelete();

            $table->date('appointment_date');   // the calendar day, e.g. 2026-07-01
            $table->time('start_time');         // slot start, e.g. 09:00:00
            $table->time('end_time');           // slot end,   e.g. 09:30:00

            // Where the appointment is in its lifecycle.
            // Allowed values: pending | confirmed | cancelled | completed
            $table->string('status')->default('pending');

            // Unique channel name both sides join for the Agora video call (Phase 3).
            $table->string('agora_channel_name')->nullable()->unique();

            $table->text('notes')->nullable();         // patient's reason for the visit
            $table->text('prescription')->nullable();  // written by the doctor on completion

            $table->timestamps();

            // Makes "find this doctor's appointments on this date" fast (used by slots).
            $table->index(['doctor_id', 'appointment_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
