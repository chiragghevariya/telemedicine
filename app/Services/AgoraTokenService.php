<?php

namespace App\Services;

use Peterujah\Agora\Agora;
use Peterujah\Agora\User;
use Peterujah\Agora\Roles;
use Peterujah\Agora\Builders\RtcToken;

class AgoraTokenService
{
    protected string $appId;
    protected string $appCertificate;

    public function __construct()
    {
        $this->appId = config('services.agora.app_id') ?? env('AGORA_APP_ID');
        $this->appCertificate = config('services.agora.app_certificate') ?? env('AGORA_APP_CERTIFICATE');
    }

    /**
     * Generate an Agora RTC Token for a given channel and user ID.
     *
     * @param string $channelName
     * @param int $uid
     * @param int $expireSeconds
     * @return string
     */
    public function generateToken(string $channelName, int $uid, int $expireSeconds = 3600): string
    {
        if (empty($this->appId) || empty($this->appCertificate)) {
            throw new \Exception('Agora credentials are not configured.');
        }

        // Initialize Peterujah Agora client
        $client = new Agora($this->appId, $this->appCertificate);
        $client->setExpiration(time() + $expireSeconds);

        // Initialize User
        $user = new User($uid);
        $user->setChannel($channelName);
        $user->setRole(Roles::RTC_PUBLISHER);
        $user->setPrivilegeExpire(time() + $expireSeconds);

        // Generate and return the token
        return RtcToken::buildTokenWithUid($client, $user);
    }
}
