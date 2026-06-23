<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the "specialties" table.
     * A specialty is a category of doctor, e.g. Cardiology or Pediatrics.
     */
    public function up(): void
    {
        Schema::create('specialties', function (Blueprint $table) {
            $table->id();                                // auto-increment primary key
            $table->string('name');                      // display name, e.g. "Cardiology"
            $table->string('icon')->nullable();          // icon name/url the app shows next to it
            $table->text('description')->nullable();     // short explanation of the specialty
            $table->timestamps();                        // created_at / updated_at
        });
    }

    /**
     * Drop the table when rolling back.
     */
    public function down(): void
    {
        Schema::dropIfExists('specialties');
    }
};
