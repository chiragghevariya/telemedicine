<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\DoctorProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Handles registration, login and the current-user / logout endpoints.
 * Authentication is done with JWT (tymon/jwt-auth) using the "api" guard.
 */
class AuthController extends Controller
{
    /**
     * Register a new patient or doctor, then return a JWT so they're logged in.
     * POST /api/auth/register
     */
    public function register(Request $request): JsonResponse
    {
        // 1) Validate the input. "confirmed" means a matching password_confirmation
        //    field must also be sent. The doctor-only fields are validated too.
        //    Password::min(8) enforces a sane minimum length; you can chain
        //    ->mixedCase()->numbers()->uncompromised() for stricter rules.
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'phone'    => ['nullable', 'string', 'max:30'],
            // Only patients and doctors can self-register; admins are seeded.
            'role'     => ['required', Rule::in(['patient', 'doctor'])],

            // These only apply when role = doctor:
            'specialty_id'     => ['nullable', 'required_if:role,doctor', 'exists:specialties,id'],
            'bio'              => ['nullable', 'string'],
            'experience_years' => ['nullable', 'integer', 'min:0'],
            'consultation_fee' => ['nullable', 'numeric', 'min:0'],
        ]);

        // 2) Create the user (+ doctor profile) inside a database transaction so we
        //    can never end up with a half-created doctor (user saved but profile
        //    failed). If anything throws, the whole thing is rolled back.
        $user = DB::transaction(function () use ($data) {
            // The model's 'hashed' cast hashes the password for us.
            $user = User::create([
                'name'     => $data['name'],
                'email'    => $data['email'],
                'password' => $data['password'],
                'phone'    => $data['phone'] ?? null,
            ]);

            // 'role' is set explicitly (it's not mass-assignable, for security).
            $user->role = $data['role'];
            $user->save();

            // Assign the matching Spatie role (so role-based checks work later).
            $user->assignRole($data['role']);

            // If they signed up as a doctor, create their (unverified) profile.
            if ($data['role'] === 'doctor') {
                DoctorProfile::create([
                    'user_id'          => $user->id,
                    'specialty_id'     => $data['specialty_id'],
                    'bio'              => $data['bio'] ?? null,
                    'experience_years' => $data['experience_years'] ?? 0,
                    'consultation_fee' => $data['consultation_fee'] ?? 0,
                    'is_verified'      => false, // an admin verifies doctors later
                ]);
            }

            return $user;
        });

        // 3) Issue a JWT for the brand-new user (logs them straight in).
        $token = Auth::guard('api')->login($user);

        // 4) Send back the token + user (201 = "created").
        return $this->respondWithToken($token, $user, 201);
    }

    /**
     * Log in with email + password and return a JWT.
     * POST /api/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // attempt() checks the credentials. On success it returns a JWT string;
        // on failure it returns false.
        $token = Auth::guard('api')->attempt($credentials);

        if (! $token) {
            return response()->json([
                'message' => 'Invalid email or password.',
            ], 401);
        }

        return $this->respondWithToken($token, Auth::guard('api')->user());
    }

    /**
     * Return the currently authenticated user.
     * GET /api/auth/me   (requires a valid token)
     */
    public function me(): JsonResponse
    {
        return response()->json([
            'user' => new UserResource(Auth::guard('api')->user()),
        ]);
    }

    /**
     * Log out by invalidating the current token.
     * POST /api/auth/logout   (requires a valid token)
     */
    public function logout(): JsonResponse
    {
        Auth::guard('api')->logout();

        return response()->json(['message' => 'Successfully logged out.']);
    }

    /**
     * Helper that builds a consistent token response used by register() and login().
     */
    protected function respondWithToken(string $token, User $user, int $status = 200): JsonResponse
    {
        return response()->json([
            'access_token' => $token,
            'token_type'   => 'bearer',
            // getTTL() is in minutes; multiply by 60 to give the client seconds.
            'expires_in'   => Auth::guard('api')->factory()->getTTL() * 60,
            'user'         => new UserResource($user),
        ], $status);
    }
}
