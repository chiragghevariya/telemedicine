<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Shapes how a doctor (doctor_profiles row + its related data) is returned in JSON.
 *
 * The same resource is used for the list endpoint and the single-doctor endpoint.
 * "whenLoaded" only includes a relation if the controller eager-loaded it, so:
 *   - the list endpoint shows the specialty,
 *   - the detail endpoint shows the specialty AND the availability list.
 */
class DoctorResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, // this is doctor_profiles.id

            // --- Public fields from the related user account ---
            // NOTE: we deliberately do NOT expose the doctor's email/phone here,
            // because /api/doctors is a public endpoint. Only show what a patient
            // needs to browse: name + avatar.
            'name'   => $this->user?->name,
            'avatar' => $this->user?->avatar,

            // --- Doctor profile fields ---
            'bio'              => $this->bio,
            'experience_years' => $this->experience_years,
            'consultation_fee' => $this->consultation_fee,
            'rating'           => $this->rating,
            'is_verified'      => $this->is_verified,

            // --- Nested relations (only present when eager-loaded) ---
            'specialty'      => new SpecialtyResource($this->whenLoaded('specialty')),
            'availabilities' => DoctorAvailabilityResource::collection($this->whenLoaded('availabilities')),
        ];
    }
}
