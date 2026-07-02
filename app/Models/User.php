<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;          // gives the model assignRole(), hasRole(), etc.
use Tymon\JWTAuth\Contracts\JWTSubject;         // lets this model be turned into a JWT

// "implements JWTSubject" is required by tymon/jwt-auth so a token can be issued for a user.
class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     * NOTE: these must include every column we set via create()/update().
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'avatar',
        'fcm_token',
        'apns_voip_token',
        // NOTE: 'role' is deliberately NOT mass-assignable. It drives authorization,
        // so we never let it be set straight from request data — it's assigned
        // explicitly in code (see AuthController::register and DoctorSeeder).
    ];

    /**
     * The attributes hidden from JSON output (never expose the password hash).
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Attribute casting.
     * 'password' => 'hashed' means any plain password we set is automatically
     * bcrypt-hashed, so we never have to call Hash::make() ourselves.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | JWTSubject methods (required by tymon/jwt-auth)
    |--------------------------------------------------------------------------
    */

    /**
     * The value stored in the token's "sub" claim — here, the user's id.
     */
    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    /**
     * Extra key/value pairs embedded inside the JWT payload.
     * We add the role so the apps can read it straight from the token.
     *
     * @return array<string, mixed>
     */
    public function getJWTCustomClaims(): array
    {
        return [
            'role' => $this->role,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * A doctor user has exactly one doctor profile (one-to-one).
     * Patients simply won't have one.
     */
    public function doctorProfile(): HasOne
    {
        return $this->hasOne(DoctorProfile::class);
    }

    /**
     * Appointments this user booked AS A PATIENT.
     */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'patient_id');
    }
}
