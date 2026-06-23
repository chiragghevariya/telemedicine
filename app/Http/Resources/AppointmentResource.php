<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Shapes how an Appointment is returned in JSON.
 * Patient/doctor details are only included when the controller eager-loads them.
 */
class AppointmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'status'             => $this->status,
            'appointment_date'   => $this->appointment_date?->format('Y-m-d'),
            'start_time'         => $this->start_time,
            'end_time'           => $this->end_time,
            'agora_channel_name' => $this->agora_channel_name,
            'notes'              => $this->notes,
            'prescription'       => $this->prescription,

            // Compact patient summary (only when the "patient" relation is loaded).
            'patient' => $this->whenLoaded('patient', fn () => [
                'id'    => $this->patient->id,
                'name'  => $this->patient->name,
                'email' => $this->patient->email,
            ]),

            // Compact doctor summary (only when the "doctor" relation is loaded).
            // The doctor's name lives on the related user account (doctor.user).
            'doctor' => $this->whenLoaded('doctor', fn () => [
                'id'   => $this->doctor->id,
                'name' => $this->doctor->user?->name,
                'fee'  => $this->doctor->consultation_fee,
            ]),
        ];
    }
}
