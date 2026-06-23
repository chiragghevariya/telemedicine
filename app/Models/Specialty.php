<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Specialty extends Model
{
    /**
     * Columns that can be mass-assigned (e.g. via create() / updateOrCreate()).
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'icon',
        'description',
    ];

    /**
     * One specialty can belong to many doctors.
     */
    public function doctorProfiles(): HasMany
    {
        return $this->hasMany(DoctorProfile::class);
    }
}
