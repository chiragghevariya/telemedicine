<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\DoctorProfile;
use Carbon\Carbon;

/**
 * Turns a doctor's weekly availability into concrete, bookable time slots
 * for a specific date, and removes any slots that are already taken.
 */
class SlotService
{
    /**
     * Get the list of free time slots for a doctor on a given date.
     *
     * @param  int     $doctorId  doctor_profiles.id
     * @param  string  $date      a date string like "2026-07-01"
     * @return array<int, string> e.g. ["09:00", "09:30", "10:00", ...]
     */
    public function getAvailableSlots(int $doctorId, string $date): array
    {
        // 1) Work out which weekday this date falls on (0 = Sun ... 6 = Sat).
        $carbonDate = Carbon::parse($date);
        $dayOfWeek  = $carbonDate->dayOfWeek;

        // 2) Make sure the doctor exists.
        $doctor = DoctorProfile::find($doctorId);
        if (! $doctor) {
            return [];
        }

        // 3) Find the doctor's availability for that weekday.
        //    If they don't work that day, there are no slots.
        $availability = $doctor->availabilities()
            ->where('day_of_week', $dayOfWeek)
            ->first();

        if (! $availability) {
            return [];
        }

        // 4) Build every slot from start_time to end_time, stepping by the slot length.
        //    Example: 09:00, 09:30, 10:00 ... up to (but not past) the end time.
        $allSlots = [];
        $cursor   = Carbon::parse($date.' '.$availability->start_time); // first slot start
        $endTime  = Carbon::parse($date.' '.$availability->end_time);   // clinic closing time
        $step     = (int) $availability->slot_duration_minutes;         // e.g. 30 minutes

        // A slot is valid only if it FINISHES on or before the end time.
        while ($cursor->copy()->addMinutes($step)->lessThanOrEqualTo($endTime)) {
            $allSlots[] = $cursor->format('H:i'); // store as "09:00"
            $cursor->addMinutes($step);
        }

        // 5) Find slots already booked for this doctor on this date.
        //    Cancelled appointments DON'T count — that slot is free again.
        $bookedSlots = Appointment::where('doctor_id', $doctorId)
            ->whereDate('appointment_date', $carbonDate->toDateString())
            ->where('status', '!=', Appointment::STATUS_CANCELLED)
            ->pluck('start_time')                                   // ["09:00:00", ...]
            ->map(fn ($time) => Carbon::parse($time)->format('H:i')) // normalise to "09:00"
            ->all();

        // 6) Return only the slots that are NOT booked (re-indexed as a clean array).
        return array_values(
            array_filter($allSlots, fn ($slot) => ! in_array($slot, $bookedSlots, true))
        );
    }
}
