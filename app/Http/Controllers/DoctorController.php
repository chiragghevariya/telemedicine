<?php

namespace App\Http\Controllers;

use App\Http\Resources\DoctorResource;
use App\Models\DoctorProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Read-only endpoints for browsing doctors (used by the patient app).
 */
class DoctorController extends Controller
{
    /**
     * List doctors, with optional specialty filter and name search.
     * GET /api/doctors?specialty_id=2&search=john&per_page=10
     */
    public function index(Request $request): JsonResponse
    {
        // Start the query and eager-load user + specialty in one go.
        // Eager loading avoids the "N+1" problem (one extra query per doctor).
        // Only show VERIFIED doctors publicly (self-registered doctors stay hidden
        // until an admin approves them).
        $query = DoctorProfile::query()
            ->where('is_verified', true)
            ->with(['user', 'specialty']);

        // --- Filter by specialty id, if one was passed ---
        if ($request->filled('specialty_id')) {
            $query->where('specialty_id', $request->integer('specialty_id'));
        }

        // --- Search by the doctor's name (the name lives on the users table) ---
        if ($request->filled('search')) {
            // Escape %, _ and \ so they're treated as literal characters in LIKE,
            // not as wildcards.
            $search = addcslashes((string) $request->string('search'), '%_\\');
            // whereHas filters doctor_profiles by a condition on the related user.
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        // Clamp per_page to a sane range (1–100) so a client can't request a huge
        // page and force the API to load the entire table.
        $perPage = min(max($request->integer('per_page', 15), 1), 100);

        // Highest-rated doctors first, then paginate.
        $doctors = $query->orderByDesc('rating')->paginate($perPage);

        // ->response() returns the paginated collection WITH meta (total, links, etc.).
        return DoctorResource::collection($doctors)->response();
    }

    /**
     * Show one doctor with specialty + weekly availability.
     * GET /api/doctors/{id}      ({id} is the doctor_profiles id)
     */
    public function show(int $id): JsonResponse
    {
        // Only verified doctors are publicly viewable (404 otherwise).
        // findOrFail() automatically returns a 404 response if not found.
        $doctor = DoctorProfile::where('is_verified', true)
            ->with(['user', 'specialty', 'availabilities'])
            ->findOrFail($id);

        return response()->json([
            'data' => new DoctorResource($doctor),
        ]);
    }

    /**
     * Show the CURRENTLY LOGGED-IN doctor's own profile (fee, availability, etc.).
     * Used by the doctor app's Profile screen.
     * GET /api/me/doctor-profile   (requires a doctor's token)
     *
     * Unlike show(), this is not filtered by is_verified — a doctor can always
     * see their own profile even before an admin approves them.
     */
    public function myProfile(): JsonResponse
    {
        $user = Auth::guard('api')->user();

        $profile = DoctorProfile::with(['user', 'specialty', 'availabilities'])
            ->where('user_id', $user->id)
            ->first();

        // The logged-in user might be a patient (no doctor profile).
        if (! $profile) {
            return response()->json(['message' => 'No doctor profile found for this account.'], 404);
        }

        return response()->json([
            'data' => new DoctorResource($profile),
        ]);
    }

    /**
     * Update the logged-in doctor's weekly availability slots.
     * POST /api/me/doctor-profile/availabilities
     */
    public function updateAvailabilities(Request $request): JsonResponse
    {
        $user = Auth::guard('api')->user();

        $profile = DoctorProfile::where('user_id', $user->id)->first();
        if (! $profile) {
            return response()->json(['message' => 'No doctor profile found for this account.'], 404);
        }

        $request->validate([
            'availabilities' => 'required|array',
            'availabilities.*.day_of_week' => 'required|integer|between:0,6',
            'availabilities.*.start_time' => 'required|date_format:H:i',
            'availabilities.*.end_time' => 'required|date_format:H:i|after:availabilities.*.start_time',
            'availabilities.*.slot_duration_minutes' => 'integer|min:10|max:120',
        ]);

        \DB::transaction(function () use ($profile, $request) {
            // Delete all existing availabilities for this doctor
            $profile->availabilities()->delete();

            // Insert new ones
            foreach ($request->input('availabilities') as $availData) {
                $profile->availabilities()->create([
                    'day_of_week' => $availData['day_of_week'],
                    'start_time' => $availData['start_time'],
                    'end_time' => $availData['end_time'],
                    'slot_duration_minutes' => $availData['slot_duration_minutes'] ?? 30,
                ]);
            }
        });

        // Load fresh profile with new availabilities
        $profile->load('availabilities');

        return response()->json([
            'message' => 'Availability updated successfully.',
            'data' => new DoctorResource($profile),
        ]);
    }
}
