<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DoctorAvailability extends Model
{
    /**
     * Eloquent would normally guess the table name "doctor_availabilities".
     * Our table is "doctor_availability", so we set it explicitly.
     *
     * @var string
     */
    protected $table = 'doctor_availability';

    /**
     * Mass-assignable columns.
     *
     * @var list<string>
     */
    protected $fillable = [
        'doctor_id',
        'day_of_week',
        'start_time',
        'end_time',
        'slot_duration_minutes',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'day_of_week'           => 'integer',
        'slot_duration_minutes' => 'integer',
    ];

    /**
     * The doctor (profile) this availability belongs to.
     */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(DoctorProfile::class, 'doctor_id');
    }
}
