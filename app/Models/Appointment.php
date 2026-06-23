<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    /**
     * The allowed status values.
     * Using constants (instead of typing the strings everywhere) prevents typos.
     */
    public const STATUS_PENDING   = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_COMPLETED = 'completed';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'patient_id',
        'doctor_id',
        'appointment_date',
        'start_time',
        'end_time',
        'status',
        'agora_channel_name',
        'notes',
        'prescription',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        // Return the date as "2026-07-01" (a plain day, not a full timestamp).
        'appointment_date' => 'date:Y-m-d',
    ];

    /**
     * The patient (a user) who booked this appointment.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * The doctor (doctor profile) this appointment is with.
     */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(DoctorProfile::class, 'doctor_id');
    }
}
