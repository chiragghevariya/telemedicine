<?php

use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\SpecialtyController;
use App\Http\Controllers\CallController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Loaded by bootstrap/app.php. Every route here automatically gets the
| "/api" URL prefix, so "/auth/login" below is reached at "/api/auth/login".
*/

// ---------------------------------------------------------------------------
// Auth (public) — "throttle:10,1" allows max 10 requests/minute per IP to slow
// down brute-force / credential-stuffing on these sensitive endpoints.
// ---------------------------------------------------------------------------
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login',    [AuthController::class, 'login']);
});

// ---------------------------------------------------------------------------
// Public browse routes (no token required)
// ---------------------------------------------------------------------------
Route::get('/specialties', [SpecialtyController::class, 'index']);

Route::get('/doctors',              [DoctorController::class, 'index']);
Route::get('/doctors/{id}',         [DoctorController::class, 'show'])->whereNumber('id');
Route::get('/doctors/{id}/slots',   [AppointmentController::class, 'slots'])->whereNumber('id');

// ---------------------------------------------------------------------------
// Protected routes (require a valid JWT: "Authorization: Bearer <token>")
// 'auth:api' uses the JWT guard we configured in config/auth.php.
// ---------------------------------------------------------------------------
Route::middleware('auth:api')->group(function () {
    // -- current user --
    Route::get('/auth/me',      [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // -- the logged-in doctor's own profile (used by the doctor app) --
    Route::get('/me/doctor-profile', [DoctorController::class, 'myProfile']);
    Route::post('/me/doctor-profile/availabilities', [DoctorController::class, 'updateAvailabilities']);

    // -- appointments --
    Route::get('/appointments',                 [AppointmentController::class, 'index']);
    Route::post('/appointments',                [AppointmentController::class, 'store']);
    Route::get('/appointments/{id}',            [AppointmentController::class, 'show'])->whereNumber('id');
    Route::post('/appointments/{id}/cancel',    [AppointmentController::class, 'cancel'])->whereNumber('id');
    Route::post('/appointments/{id}/complete',  [AppointmentController::class, 'complete'])->whereNumber('id');

    // -- real-time calling --
    Route::post('/users/push-tokens',           [CallController::class, 'updatePushTokens']);
    Route::post('/calls/initiate',              [CallController::class, 'initiate']);
    Route::post('/calls/accept',                [CallController::class, 'accept']);
    Route::post('/calls/decline',               [CallController::class, 'decline']);
    Route::post('/calls/end',                   [CallController::class, 'end']);
    Route::post('/calls/missed',                [CallController::class, 'missed']);
});
