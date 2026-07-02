<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use App\Models\VideoCall;
use App\Services\AgoraTokenService;
use App\Services\PushNotificationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class CallController extends Controller
{
    public function __construct(
        protected AgoraTokenService $agoraService,
        protected PushNotificationService $pushService
    ) {}

    /**
     * Update push notification tokens for the authenticated user.
     * POST /api/users/push-tokens
     */
    public function updatePushTokens(Request $request): JsonResponse
    {
        $data = $request->validate([
            'fcm_token' => ['nullable', 'string'],
            'apns_voip_token' => ['nullable', 'string'],
        ]);

        $user = Auth::guard('api')->user();
        
        $updateData = [];
        if ($request->has('fcm_token')) {
            $updateData['fcm_token'] = $data['fcm_token'];
        }
        if ($request->has('apns_voip_token')) {
            $updateData['apns_voip_token'] = $data['apns_voip_token'];
        }

        if (!empty($updateData)) {
            $user->update($updateData);
        }

        return response()->json([
            'message' => 'Push tokens updated successfully.',
            'user' => $user
        ]);
    }

    /**
     * Initiate a real-time call to another user.
     * POST /api/calls/initiate
     */
    public function initiate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'receiver_id' => ['required', 'integer', 'exists:users,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
        ]);

        $caller = Auth::guard('api')->user();
        $receiver = User::findOrFail($data['receiver_id']);

        if ($caller->id === $receiver->id) {
            return response()->json(['message' => 'You cannot call yourself.'], 422);
        }

        // Generate Agora-safe unique channel name
        $channelName = 'call_' . strtolower(Str::random(10)) . '_' . time();

        // Generate Agora tokens for both caller and receiver
        // Agora UIDs must be integers, we use user IDs.
        $callerToken = $this->agoraService->generateToken($channelName, $caller->id);
        $receiverToken = $this->agoraService->generateToken($channelName, $receiver->id);

        // Save call in the database
        $call = VideoCall::create([
            'appointment_id' => $data['appointment_id'] ?? null,
            'channel_name' => $channelName,
            'caller_id' => $caller->id,
            'receiver_id' => $receiver->id,
            'status' => VideoCall::STATUS_INITIATED,
        ]);

        // Push notification payload
        $pushPayload = [
            'event' => 'incoming_call',
            'call_id' => (string) $call->id,
            'channel_name' => $channelName,
            'caller_id' => (string) $caller->id,
            'caller_name' => $caller->name,
            'caller_avatar' => $caller->avatar ?? '',
            'receiver_id' => (string) $receiver->id,
            'agora_token' => $receiverToken,
        ];

        // Send Push Notifications depending on the receiver's platform tokens
        $sentAndroid = false;
        $sentIos = false;

        // 1. Android FCM Data Message (Wake up background/killed)
        if ($receiver->fcm_token) {
            $sentAndroid = $this->pushService->sendAndroidDataMessage($receiver->fcm_token, $pushPayload);
        }

        // 2. iOS APNs VoIP Push (Wake up background/killed to launch CallKit)
        if ($receiver->apns_voip_token) {
            // Adjust bundle IDs depending on recipient role
            $bundleId = $receiver->role === 'doctor' ? 'com.chirag.telemeddoctor' : 'com.chirag.telemedpatient';
            $sentIos = $this->pushService->sendIosVoipPush($receiver->apns_voip_token, $pushPayload, $bundleId);
        }

        return response()->json([
            'message' => 'Call initiated successfully.',
            'call' => $call,
            'agora_token' => $callerToken,
            'channel_name' => $channelName,
            'push_sent' => [
                'android' => $sentAndroid,
                'ios' => $sentIos,
            ]
        ], 201);
    }

    /**
     * Accept an incoming call.
     * POST /api/calls/accept
     */
    public function accept(Request $request): JsonResponse
    {
        $data = $request->validate([
            'call_id' => ['required', 'integer', 'exists:video_calls,id'],
        ]);

        $call = VideoCall::findOrFail($data['call_id']);

        if ($call->status !== VideoCall::STATUS_INITIATED && $call->status !== VideoCall::STATUS_RINGING) {
            return response()->json(['message' => 'Call is not in a ringable state.'], 422);
        }

        $call->update([
            'status' => VideoCall::STATUS_ONGOING,
            'started_at' => Carbon::now(),
        ]);

        // Send signaling notification to caller that the call was accepted
        $caller = $call->caller;
        if ($caller->fcm_token) {
            $this->pushService->sendAndroidDataMessage($caller->fcm_token, [
                'event' => 'call_accepted',
                'call_id' => (string) $call->id,
            ]);
        }
        if ($caller->apns_voip_token) {
            $bundleId = $caller->role === 'doctor' ? 'com.chirag.telemeddoctor' : 'com.chirag.telemedpatient';
            $this->pushService->sendIosVoipPush($caller->apns_voip_token, [
                'event' => 'call_accepted',
                'call_id' => (string) $call->id,
            ], $bundleId);
        }

        return response()->json([
            'message' => 'Call accepted.',
            'call' => $call
        ]);
    }

    /**
     * Decline / Reject a call.
     * POST /api/calls/decline
     */
    public function decline(Request $request): JsonResponse
    {
        $data = $request->validate([
            'call_id' => ['required', 'integer', 'exists:video_calls,id'],
        ]);

        $call = VideoCall::findOrFail($data['call_id']);
        
        $call->update([
            'status' => VideoCall::STATUS_DECLINED,
            'ended_at' => Carbon::now(),
        ]);

        // Send signaling notification to the other party that call was declined
        $user = Auth::guard('api')->user();
        $targetUser = ($user->id === $call->caller_id) ? $call->receiver : $call->caller;

        if ($targetUser->fcm_token) {
            $this->pushService->sendAndroidDataMessage($targetUser->fcm_token, [
                'event' => 'call_declined',
                'call_id' => (string) $call->id,
            ]);
        }
        if ($targetUser->apns_voip_token) {
            $bundleId = $targetUser->role === 'doctor' ? 'com.chirag.telemeddoctor' : 'com.chirag.telemedpatient';
            $this->pushService->sendIosVoipPush($targetUser->apns_voip_token, [
                'event' => 'call_declined',
                'call_id' => (string) $call->id,
            ], $bundleId);
        }

        return response()->json([
            'message' => 'Call declined.',
            'call' => $call
        ]);
    }

    /**
     * End an ongoing call.
     * POST /api/calls/end
     */
    public function end(Request $request): JsonResponse
    {
        $data = $request->validate([
            'call_id' => ['required', 'integer', 'exists:video_calls,id'],
        ]);

        $call = VideoCall::findOrFail($data['call_id']);

        if ($call->status === VideoCall::STATUS_COMPLETED) {
            return response()->json(['message' => 'Call is already completed.', 'call' => $call]);
        }

        $now = Carbon::now();
        $startedAt = $call->started_at ?? $call->created_at;
        $duration = $now->diffInSeconds($startedAt);

        $call->update([
            'status' => VideoCall::STATUS_COMPLETED,
            'ended_at' => $now,
            'duration' => $duration,
        ]);

        // Send signaling to both parties to make sure call screens close
        $user = Auth::guard('api')->user();
        $targetUser = ($user->id === $call->caller_id) ? $call->receiver : $call->caller;

        if ($targetUser->fcm_token) {
            $this->pushService->sendAndroidDataMessage($targetUser->fcm_token, [
                'event' => 'call_ended',
                'call_id' => (string) $call->id,
            ]);
        }
        if ($targetUser->apns_voip_token) {
            $bundleId = $targetUser->role === 'doctor' ? 'com.chirag.telemeddoctor' : 'com.chirag.telemedpatient';
            $this->pushService->sendIosVoipPush($targetUser->apns_voip_token, [
                'event' => 'call_ended',
                'call_id' => (string) $call->id,
            ], $bundleId);
        }

        return response()->json([
            'message' => 'Call ended successfully.',
            'call' => $call
        ]);
    }

    /**
     * Mark a call as missed (no answer).
     * POST /api/calls/missed
     */
    public function missed(Request $request): JsonResponse
    {
        $data = $request->validate([
            'call_id' => ['required', 'integer', 'exists:video_calls,id'],
        ]);

        $call = VideoCall::findOrFail($data['call_id']);

        if ($call->status !== VideoCall::STATUS_INITIATED && $call->status !== VideoCall::STATUS_RINGING) {
            return response()->json(['message' => 'Call status is not ringable.'], 422);
        }

        $call->update([
            'status' => VideoCall::STATUS_MISSED,
            'ended_at' => Carbon::now(),
        ]);

        // Send push to receiver to clear call UI
        $receiver = $call->receiver;
        if ($receiver->fcm_token) {
            $this->pushService->sendAndroidDataMessage($receiver->fcm_token, [
                'event' => 'call_missed',
                'call_id' => (string) $call->id,
            ]);
        }
        if ($receiver->apns_voip_token) {
            $bundleId = $receiver->role === 'doctor' ? 'com.chirag.telemeddoctor' : 'com.chirag.telemedpatient';
            $this->pushService->sendIosVoipPush($receiver->apns_voip_token, [
                'event' => 'call_missed',
                'call_id' => (string) $call->id,
            ], $bundleId);
        }

        return response()->json([
            'message' => 'Call marked as missed.',
            'call' => $call
        ]);
    }
}
