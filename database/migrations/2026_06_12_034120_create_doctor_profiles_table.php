<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the "doctor_profiles" table.
     * This holds the doctor-specific information attached to a user account.
     */
    public function up(): void
    {
        Schema::create('doctor_profiles', function (Blueprint $table) {
            $table->id();

            // The user account that owns this profile. ->unique() = one profile per user.
            // ->constrained('users') creates a foreign key to users.id.
            // ->cascadeOnDelete() = if the user is deleted, delete this profile too.
            $table->foreignId('user_id')
                  ->unique()
                  ->constrained('users')
                  ->cascadeOnDelete();

            // The doctor's specialty. Nullable so a doctor can exist without one yet.
            // ->nullOnDelete() = if the specialty is deleted, just set this to NULL.
            $table->foreignId('specialty_id')
                  ->nullable()
                  ->constrained('specialties')
                  ->nullOnDelete();

            $table->text('bio')->nullable();                          // short "about me"
            $table->unsignedInteger('experience_years')->default(0);  // years of practice
            $table->decimal('consultation_fee', 8, 2)->default(0);    // price per consultation
            $table->decimal('rating', 3, 2)->default(0);              // average rating 0.00 - 5.00
            $table->boolean('is_verified')->default(false);           // has an admin approved this doctor?

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_profiles');
    }
};
