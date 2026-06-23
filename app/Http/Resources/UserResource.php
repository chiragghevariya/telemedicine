<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Shapes how a User is returned in JSON (e.g. in login/register responses).
 * Using a Resource keeps sensitive fields (like the password hash) out of the output.
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'     => $this->id,
            'name'   => $this->name,
            'email'  => $this->email,
            'phone'  => $this->phone,
            'avatar' => $this->avatar,
            'role'   => $this->role,
            // NOTE: fcm_token is intentionally NOT returned. It's a write-only
            // push-notification token the device already owns — no need to echo it back.
        ];
    }
}
