<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Shapes how a single availability row is returned in JSON.
 */
class DoctorAvailabilityResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                    => $this->id,
            'day_of_week'           => $this->day_of_week,            // 0 = Sun ... 6 = Sat
            'start_time'            => $this->start_time,             // e.g. "09:00:00"
            'end_time'              => $this->end_time,               // e.g. "17:00:00"
            'slot_duration_minutes' => $this->slot_duration_minutes,  // e.g. 30
        ];
    }
}
