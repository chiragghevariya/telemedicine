<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DoctorProfile extends Model
{
    /**
     * Mass-assignable columns.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'specialty_id',
        'bio',
        'experience_years',
        'consultation_fee',
        'rating',
        'is_verified',
    ];

    /**
     * Make sure values come back as the right PHP type.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'experience_years' => 'integer',
        'consultation_fee' => 'decimal:2',
        'rating'           => 'decimal:2',
        'is_verified'      => 'boolean',
    ];

    /**
     * The user account (name, email, avatar, phone...) behind this doctor.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The doctor's specialty (Cardiology, etc.).
     */
    public function specialty(): BelongsTo
    {
        return $this->belongsTo(Specialty::class);
    }

    /**
     * The doctor's weekly availability rows.
     * The foreign key on doctor_availability is "doctor_id".
     */
    public function availabilities(): HasMany
    {
        return $this->hasMany(DoctorAvailability::class, 'doctor_id');
    }

    /**
     * Appointments booked with this doctor.
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'doctor_id');
    }
}
