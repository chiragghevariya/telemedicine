<?php

namespace App\Http\Controllers;

use App\Http\Resources\SpecialtyResource;
use App\Models\Specialty;
use Illuminate\Http\JsonResponse;

/**
 * Read-only endpoint that lists all specialties.
 * The apps use this to build the specialty filter / dropdown.
 */
class SpecialtyController extends Controller
{
    /**
     * GET /api/specialties
     */
    public function index(): JsonResponse
    {
        // Alphabetical order so the list is predictable in the UI.
        $specialties = Specialty::orderBy('name')->get();

        return SpecialtyResource::collection($specialties)->response();
    }
}
