<?php

namespace App\Http\Controllers;

use App\Http\Resources\AppointmentResource;
use App\Mail\AppointmentBooked;
use App\Models\Appointment;
use App\Models\DoctorProfile;
use App\Models\User;
use App\Services\SlotService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class AppointmentController extends Controller
{
    /**
     * Laravel "injects" a SlotService instance here automatically, so we can
     * reuse the slot logic in both the slots() and store() methods.
     */
    public function __construct(protected SlotService $slotService)
    {
    }

    /**
     * GET /api/doctors/{id}/slots?date=YYYY-MM-DD
     * PUBLIC: list the free time slots for a doctor on a given date.
     */
    public function slots(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'date' => ['required', 'date'],
        ]);

        // 404 if the doctor doesn't exist.
        DoctorProfile::findOrFail($id);

        $slots = $this->slotService->getAvailableSlots($id, $request->input('date'));

        return response()->json([
            'doctor_id' => $id,
            'date'      => $request->input('date'),
            'slots'     => $slots, // e.g. ["09:00","09:30","10:00", ...]
        ]);
    }

    /**
     * POST /api/appointments
     * Book an appointment for the logged-in patient.
     */
    public function store(Request $request): JsonResponse
    {
        // 1) Validate the input. appointment_date can't be in the past.
        $data = $request->validate([
            'doctor_id'        => ['required', 'integer', 'exists:doctor_profiles,id'],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'start_time'       => ['required', 'date_format:H:i'], // e.g. "09:00"
            'notes'            => ['nullable', 'string', 'max:1000'],
        ]);

        $doctorId = (int) $data['doctor_id'];
        $date     = $data['appointment_date'];
        $start    = $data['start_time'];

        // 2) Only verified doctors can be booked.
        $doctor = DoctorProfile::findOrFail($doctorId);
        if (! $doctor->is_verified) {
            return response()->json(['message' => 'This doctor is not available for booking.'], 422);
        }

        // 3) Confirm the requested slot is actually free (re-uses the slot logic,
        //    which also rejects days the doctor doesn't work and taken slots).
        $availableSlots = $this->slotService->getAvailableSlots($doctorId, $date);
        if (! in_array($start, $availableSlots, true)) {
            return response()->json([
                'message' => 'That time slot is not available. Please pick another one.',
            ], 422);
        }

        // 4) Work out the end time from the doctor's slot length for that weekday.
        $dayOfWeek    = Carbon::parse($date)->dayOfWeek;
        $availability = $doctor->availabilities()->where('day_of_week', $dayOfWeek)->first();
        $endTime      = Carbon::parse($start)
            ->addMinutes((int) $availability->slot_duration_minutes)
            ->format('H:i:s');

        // 5) Create the appointment (status starts as "pending").
        $appointment = Appointment::create([
            'patient_id'         => Auth::guard('api')->id(), // the logged-in user is the patient
            'doctor_id'          => $doctorId,
            'appointment_date'   => $date,
            'start_time'         => Carbon::parse($start)->format('H:i:s'),
            'end_time'           => $endTime,
            'status'             => Appointment::STATUS_PENDING,
            'agora_channel_name' => $this->makeChannelName(), // unique video-call channel
            'notes'              => $data['notes'] ?? null,
        ]);

        // 6) Load the relations the email + JSON response need.
        $appointment->load(['patient', 'doctor.user']);

        // 7) Send the confirmation email. Wrapped in try/catch so a mail problem
        //    never stops the booking from succeeding.
        try {
            Mail::to($appointment->patient->email)->send(new AppointmentBooked($appointment));
        } catch (\Throwable $e) {
            Log::warning('Appointment confirmation email failed: '.$e->getMessage());
        }

        return response()->json([
            'message' => 'Appointment booked successfully.',
            'data'    => new AppointmentResource($appointment),
        ], 201);
    }

    /**
     * GET /api/appointments
     * Patients see their own bookings; doctors see appointments booked with them.
     */
    public function index(): JsonResponse
    {
        $user            = Auth::guard('api')->user();
        $doctorProfileId = $this->doctorProfileId($user);

        $query = Appointment::query()
            ->with(['patient', 'doctor.user'])
            ->orderByDesc('appointment_date')
            ->orderByDesc('start_time');

        if ($doctorProfileId) {
            // This user is a doctor -> show appointments booked with them.
            $query->where('doctor_id', $doctorProfileId);
        } else {
            // Otherwise treat them as a patient -> show their own bookings.
            $query->where('patient_id', $user->id);
        }

        return AppointmentResource::collection($query->get())->response();
    }

    /**
     * GET /api/appointments/{id}
     */
    public function show(int $id): JsonResponse
    {
        $appointment = Appointment::with(['patient', 'doctor.user'])->findOrFail($id);

        // Only the patient who booked it, or the doctor it's with, may view it.
        $this->authorizeAccess($appointment);

        return response()->json(['data' => new AppointmentResource($appointment)]);
    }

    /**
     * POST /api/appointments/{id}/cancel
     * Either the patient or the doctor can cancel a not-yet-finished appointment.
     */
    public function cancel(int $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);
        $this->authorizeAccess($appointment);

        // Can't cancel something already completed or already cancelled.
        if (in_array($appointment->status, [Appointment::STATUS_COMPLETED, Appointment::STATUS_CANCELLED], true)) {
            return response()->json([
                'message' => "Appointment is already {$appointment->status} and cannot be cancelled.",
            ], 422);
        }

        $appointment->update(['status' => Appointment::STATUS_CANCELLED]);

        return response()->json([
            'message' => 'Appointment cancelled.',
            'data'    => new AppointmentResource($appointment->load(['patient', 'doctor.user'])),
        ]);
    }

    /**
     * POST /api/appointments/{id}/complete
     * DOCTOR ONLY: mark the appointment completed and save the prescription text.
     */
    public function complete(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'prescription' => ['required', 'string'],
        ]);

        $appointment = Appointment::findOrFail($id);

        // Only the doctor this appointment belongs to may complete it.
        $doctorProfileId = $this->doctorProfileId(Auth::guard('api')->user());
        if (! $doctorProfileId || $appointment->doctor_id !== $doctorProfileId) {
            return response()->json([
                'message' => 'Only the assigned doctor can complete this appointment.',
            ], 403);
        }

        // A cancelled appointment can't be completed.
        if ($appointment->status === Appointment::STATUS_CANCELLED) {
            return response()->json(['message' => 'A cancelled appointment cannot be completed.'], 422);
        }

        $appointment->update([
            'status'       => Appointment::STATUS_COMPLETED,
            'prescription' => $data['prescription'],
        ]);

        return response()->json([
            'message' => 'Appointment completed and prescription saved.',
            'data'    => new AppointmentResource($appointment->load(['patient', 'doctor.user'])),
        ]);
    }

    /* ------------------------------------------------------------------------
     | Small private helpers
     * ----------------------------------------------------------------------*/

    /**
     * Return the doctor_profiles.id for a user IF they are a doctor, otherwise null.
     */
    private function doctorProfileId(User $user): ?int
    {
        return $user->doctorProfile?->id;
    }

    /**
     * Abort with 403 unless the current user is the patient or the doctor
     * on this appointment.
     */
    private function authorizeAccess(Appointment $appointment): void
    {
        $user            = Auth::guard('api')->user();
        $doctorProfileId = $this->doctorProfileId($user);

        $isPatient = $appointment->patient_id === $user->id;
        $isDoctor  = $doctorProfileId !== null && $appointment->doctor_id === $doctorProfileId;

        abort_unless($isPatient || $isDoctor, 403, 'You are not allowed to access this appointment.');
    }

    /**
     * Build a unique, Agora-safe channel name (letters + numbers only, < 64 chars).
     */
    private function makeChannelName(): string
    {
        return 'telemed_'.str_replace('-', '', (string) Str::uuid());
    }
}
