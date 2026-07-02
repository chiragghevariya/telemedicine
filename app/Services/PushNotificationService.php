<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    /**
     * Send a high-priority FCM data message to an Android device.
     * This uses Google FCM HTTP v1 API.
     */
    public function sendAndroidDataMessage(string $fcmToken, array $data): bool
    {
        try {
            $accessToken = $this->getFcmAccessToken();
            if (!$accessToken) {
                Log::error('FCM: Failed to retrieve Google access token.');
                return false;
            }

            $projectId = $this->getFcmProjectId();
            if (!$projectId) {
                Log::error('FCM: Project ID not found in firebase credentials.');
                return false;
            }

            $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            // Important for background waking:
            // Android uses data-only messages to trigger background execution (FCM background handler).
            // Do NOT include a 'notification' block, only include 'data'.
            $payload = [
                'message' => [
                    'token' => $fcmToken,
                    'data' => array_map('strval', $data), // FCM data values must be strings
                    'android' => [
                        'priority' => 'high', // High priority triggers immediate delivery and wake up
                        'ttl' => '0s'        // 0s means deliver now or expire immediately if offline
                    ]
                ]
            ];

            $headers = [
                'Authorization: Bearer ' . $accessToken,
                'Content-Type: application/json'
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                Log::error("FCM Send Error (HTTP {$httpCode}): " . $response);
                return false;
            }

            return true;
        } catch (\Exception $e) {
            Log::error('FCM Send Exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send a standard FCM notification + data message to an Android device.
     * This triggers the system notification banner automatically on the device.
     */
    public function sendAndroidNotificationMessage(string $fcmToken, string $title, string $body, array $data = []): bool
    {
        try {
            $accessToken = $this->getFcmAccessToken();
            if (!$accessToken) {
                Log::error('FCM: Failed to retrieve Google access token.');
                return false;
            }

            $projectId = $this->getFcmProjectId();
            if (!$projectId) {
                Log::error('FCM: Project ID not found in firebase credentials.');
                return false;
            }

            $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

            // Notification block triggers native notification banner presentation
            $payload = [
                'message' => [
                    'token' => $fcmToken,
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                    ],
                    'data' => array_map('strval', $data), // FCM data values must be strings
                    'android' => [
                        'notification' => [
                            'sound' => 'default',
                            'notification_priority' => 'PRIORITY_HIGH',
                        ],
                    ]
                ]
            ];

            $headers = [
                'Authorization: Bearer ' . $accessToken,
                'Content-Type: application/json'
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                Log::error("FCM Send Notification Error (HTTP {$httpCode}): " . $response);
                return false;
            }

            return true;
        } catch (\Exception $e) {
            Log::error('FCM Send Notification Exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Send a VoIP push notification to an iOS device using HTTP/2 APNs.
     * iOS CallKit requires VoIP push notifications (delivered via APNs using
     * a VoIP push certificate or APNs token).
     */
    public function sendIosVoipPush(string $voipToken, array $data, string $bundleId): bool
    {
        try {
            $keyId = env('APNS_KEY_ID');
            $teamId = env('APNS_TEAM_ID');
            $privateKey = env('APNS_PRIVATE_KEY'); // Can be base64 encoded, key string, or file path

            if (empty($keyId) || empty($teamId) || empty($privateKey)) {
                Log::warning('APNs VoIP: APNS credentials not fully set in .env. Skipping iOS VoIP Push.');
                return false;
            }

            $apnsPrivateKey = $this->resolvePrivateKey($privateKey);
            if (!$apnsPrivateKey) {
                Log::error('APNs VoIP: Failed to resolve APNs private key.');
                return false;
            }

            // APNs uses HTTP/2. We must ensure curl supports HTTP/2.
            if (!defined('CURL_HTTP_VERSION_2_0')) {
                Log::error('APNs VoIP: cURL HTTP/2 is not supported on this server.');
                return false;
            }

            // APNs VoIP topic must be <bundle_id>.voip
            $topic = $bundleId . '.voip';
            $jwt = $this->generateApnsJwt($keyId, $teamId, $apnsPrivateKey);

            // APNs servers:
            // Sandbox: api.sandbox.push.apple.com
            // Production: api.push.apple.com
            $isSandbox = env('APNS_SANDBOX', true);
            $apnsServer = $isSandbox ? 'api.sandbox.push.apple.com' : 'api.push.apple.com';
            $url = "https://{$apnsServer}/3/device/{$voipToken}";

            // APNs VoIP payload format
            // Needs to have high priority (10) and push-type 'voip'
            $payload = [
                'aps' => [
                    'content-available' => 1
                ],
                'data' => $data // Pass Call custom attributes
            ];

            $headers = [
                'apns-topic: ' . $topic,
                'apns-push-type: voip',
                'apns-priority: 10',      // Immediate delivery
                'apns-expiration: 0',     // Deliver now or discard (for real-time calling)
                'authorization: bearer ' . $jwt,
                'content-type: application/json'
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_PORT, 443);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_2_0);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            if ($httpCode !== 200) {
                Log::error("APNs VoIP Send Error (HTTP {$httpCode}): " . $response . ' Curl Error: ' . $curlError);
                return false;
            }

            return true;
        } catch (\Exception $e) {
            Log::error('APNs VoIP Exception: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Parse and load Firebase credentials from file/env to get Access Token.
     */
    private function getFcmAccessToken(): ?string
    {
        return Cache::remember('fcm_access_token', 3000, function () {
            $credentials = $this->loadFcmCredentials();
            if (!$credentials) {
                return null;
            }

            // Create JWT assertion
            $now = time();
            $header = json_encode(['alg' => 'RS256', 'typ' => 'JWT']);
            $claimSet = json_encode([
                'iss' => $credentials['client_email'],
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
                'aud' => 'https://oauth2.googleapis.com/token',
                'exp' => $now + 3600,
                'iat' => $now
            ]);

            $base64UrlHeader = $this->base64UrlEncode($header);
            $base64UrlClaimSet = $this->base64UrlEncode($claimSet);

            $signatureInput = $base64UrlHeader . '.' . $base64UrlClaimSet;
            
            $signature = '';
            $privateKey = $credentials['private_key'];
            if (!openssl_sign($signatureInput, $signature, $privateKey, OPENSSL_ALGO_SHA256)) {
                return null;
            }

            $base64UrlSignature = $this->base64UrlEncode($signature);
            $jwt = $signatureInput . '.' . $base64UrlSignature;

            // Request Google OAuth2 Token
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'https://oauth2.googleapis.com/token');
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt
            ]));

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                Log::error('FCM Token Auth Request Error: ' . $response);
                return null;
            }

            $data = json_decode($response, true);
            return $data['access_token'] ?? null;
        });
    }

    private function getFcmProjectId(): ?string
    {
        $credentials = $this->loadFcmCredentials();
        return $credentials['project_id'] ?? null;
    }

    private function loadFcmCredentials(): ?array
    {
        $path = env('FCM_CREDENTIALS_PATH');
        
        if (empty($path)) {
            $path = storage_path('app/firebase/firebase-credentials.json');
        } elseif (!\Illuminate\Support\Str::startsWith($path, '/')) {
            $path = base_path($path);
        }
        
        if (!file_exists($path)) {
            Log::warning("FCM: Credentials file not found at: {$path}. Make sure it is configured.");
            return null;
        }

        $json = file_get_contents($path);
        return json_decode($json, true);
    }

    private function generateApnsJwt(string $keyId, string $teamId, string $privateKey): string
    {
        $header = json_encode(['alg' => 'ES256', 'kid' => $keyId]);
        $claims = json_encode([
            'iss' => $teamId,
            'iat' => time()
        ]);

        $base64UrlHeader = $this->base64UrlEncode($header);
        $base64UrlClaims = $this->base64UrlEncode($claims);
        $signatureInput = $base64UrlHeader . '.' . $base64UrlClaims;

        $signature = '';
        // APNs requires ES256 (ECDSA P-256 + SHA-256). openssl_sign() returns a
        // DER/ASN.1-encoded signature, but JOSE/JWT (RFC 7518) requires the raw
        // concatenation of R and S (32 bytes each = 64 bytes total). Without this
        // conversion APNs rejects the token with HTTP 403 InvalidProviderToken.
        if (!openssl_sign($signatureInput, $signature, $privateKey, OPENSSL_ALGO_SHA256)) {
            throw new \Exception('APNs JWT: openssl_sign failed (check APNS_PRIVATE_KEY).');
        }
        $signature = $this->ecdsaDerToRaw($signature, 32);

        return $signatureInput . '.' . $this->base64UrlEncode($signature);
    }

    /**
     * Convert an ECDSA DER/ASN.1 signature (as produced by openssl_sign) into the
     * raw fixed-width R||S concatenation required by JOSE ES256 (RFC 7518).
     */
    private function ecdsaDerToRaw(string $der, int $partLen): string
    {
        $offset = 0;
        if (strlen($der) < 8 || ord($der[$offset++]) !== 0x30) {
            return $der; // not DER-encoded; leave as-is
        }
        $seqLen = ord($der[$offset++]);
        if ($seqLen & 0x80) {
            $offset += ($seqLen & 0x7f); // skip long-form length bytes
        }
        $readInt = function () use ($der, &$offset, $partLen) {
            $offset++;                       // skip INTEGER tag (0x02)
            $len = ord($der[$offset++]);
            $bytes = substr($der, $offset, $len);
            $offset += $len;
            $bytes = ltrim($bytes, "\x00");  // drop ASN.1 sign/padding zero bytes
            return str_pad($bytes, $partLen, "\x00", STR_PAD_LEFT); // left-pad to 32 bytes
        };
        $r = $readInt();
        $s = $readInt();
        return $r . $s;
    }

    private function resolvePrivateKey(string $key): ?string
    {
        // Check if it's a file path
        if (file_exists($key)) {
            return file_get_contents($key);
        }

        // Check if base64 encoded
        $decoded = base64_decode($key, true);
        if ($decoded !== false && strpos($decoded, 'BEGIN PRIVATE KEY') !== false) {
            return $decoded;
        }

        // Return direct string
        if (strpos($key, 'BEGIN PRIVATE KEY') !== false) {
            return $key;
        }

        return null;
    }

    private function base64UrlEncode(string $data): string
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }
}
