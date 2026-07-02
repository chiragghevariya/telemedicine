// Agora video consultation screen (same as the patient app).
// "End call" returns to the appointment detail screen.
//
// IMPORTANT: react-native-agora is a NATIVE module — it requires a development build.
// Run the app with: npx expo run:android

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AGORA_APP_ID, AGORA_TOKEN } from '../config/agora';
import { colors, fonts, radius, spacing } from '../config/theme';
import api from '../config/api';
import { useAuth } from '../store/AuthContext';
import CallManager from '../services/CallManager';

// Load the native module defensively so the app doesn't crash in Expo Go.
let Agora = null;
try {
  // eslint-disable-next-line global-require
  Agora = require('react-native-agora');
} catch (e) {
  Agora = null;
}

// Ask for camera + mic permission on Android (iOS uses the Info.plist strings).
async function requestPermissions() {
  if (Platform.OS === 'android') {
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);
    console.log('[PermissionsAndroid] Camera and Mic request results:', results);
    return (
      results[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
      results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
    );
  }
  return true;
}

export default function VideoCallScreen({ route, navigation }) {
  const { channelName, token, callId } = route.params ?? {};
  const { user } = useAuth();

  const engineRef = useRef(null);
  const joinedRef = useRef(false);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0); // 0 = no one else yet
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [engineReady, setEngineReady] = useState(false); // true once the engine + preview are ready
  const [isFrontCamera, setIsFrontCamera] = useState(true); // UI hint only; real state lives in the engine
  const [switchingCamera, setSwitchingCamera] = useState(false); // debounce for rapid taps
  const [speakerOn, setSpeakerOn] = useState(true); // start on the loudspeaker like Meet/WhatsApp
  const [error, setError] = useState('');

  useEffect(() => {
    let connectTimeout = null;

    const start = async () => {
      if (!Agora || !Agora.createAgoraRtcEngine) {
        setError('Video calls require a development build.\nRun: npx expo run:android');
        return;
      }
      if (!AGORA_APP_ID || AGORA_APP_ID.startsWith('PASTE_')) {
        setError('Please set your Agora App ID in src/config/agora.js');
        return;
      }
      if (!channelName) {
        setError('No video channel was found for this appointment.');
        return;
      }

      try {
        const granted = await requestPermissions();
        if (!granted) {
          setError('Camera and Microphone permissions are required for video calls.');
          return;
        }

        const engine = Agora.createAgoraRtcEngine();
        engineRef.current = engine;
        engine.initialize({ appId: AGORA_APP_ID });

        engine.registerEventHandler({
          onJoinChannelSuccess: () => { 
            console.log('[Agora] Local user successfully joined channel:', channelName);
            joinedRef.current = true;
            setJoined(true);
            // Enforce loudspeaker at call start (some devices reset the route on join).
            try { engine.setEnableSpeakerphone(true); } catch (err) { /* noop */ }
            // NOTE: Do NOT call engine.setupLocalVideo() here. In react-native-agora v4
            // the local <RtcSurfaceView> binds the camera to its own native view; a
            // manual view-less setupLocalVideo unbinds it and turns the self-view black.
          },
          onUserJoined: (_connection, uid) => {
            console.log('[Agora] Remote user joined call with uid:', uid);
            setRemoteUid(uid);
          },
          onUserOffline: () => {
            console.log('[Agora] Remote user went offline');
            setRemoteUid(0);
          },
          onLocalVideoStateChanged: (source, state, error) => {
            console.log(`[Agora] Local Video State Changed: source=${source}, state=${state}, error=${error}`);
          },
        });

        engine.enableVideo();
        engine.startPreview();

        // Engine + local capture are ready. Only now is it safe to mount the local
        // <RtcSurfaceView> — mounting it earlier binds to an uninitialized engine and
        // renders black. The component itself performs setupLocalVideo with its view.
        setEngineReady(true);

        // Configure profile and role explicitly before joining to avoid negotiation failures
        engine.setChannelProfile(Agora.ChannelProfileType.ChannelProfileCommunication);
        engine.setClientRole(Agora.ClientRoleType.ClientRoleBroadcaster);

        // Default the call to the loudspeaker (must be set BEFORE joinChannel to take
        // effect as the initial route). Toggled live afterwards via setEnableSpeakerphone.
        try { engine.setDefaultAudioRouteToSpeakerphone(true); } catch (err) { /* noop */ }

        // Join using the dynamic token passed from call invitation, falling back to static token
        // Use user database ID as Agora UID (matching the dynamic token signature)
        engine.joinChannel(token || AGORA_TOKEN, channelName, user?.id || 0, {});

        connectTimeout = setTimeout(() => {
          if (!joinedRef.current) {
            setError('Could not connect to the call. Check your internet connection and Agora App ID, then try again.');
          }
        }, 20000);
      } catch (e) {
        setError('Could not start the video call. Check your Agora App ID and that you are running a development build.');
      }
    };

    start();

    return () => {
      if (connectTimeout) clearTimeout(connectTimeout);
      try {
        engineRef.current?.leaveChannel();
        engineRef.current?.release();
      } catch (e) {
        // ignore cleanup errors
      }
    };
  }, []);


  const toggleMute = () => {
    const next = !muted;
    engineRef.current?.muteLocalAudioStream(next);
    setMuted(next);
  };

  // Flip the audio route between loudspeaker (true) and earpiece (false) live.
  // setEnableSpeakerphone changes the route immediately with no channel/audio interruption.
  const toggleSpeaker = () => {
    const next = !speakerOn;
    try {
      engineRef.current?.setEnableSpeakerphone(next);
      setSpeakerOn(next);
    } catch (err) {
      console.warn('[Agora] setEnableSpeakerphone failed:', err);
    }
  };

  // Flip front <-> back camera on the LIVE capture. In react-native-agora v4
  // engine.switchCamera() toggles the active camera without leaving the channel,
  // remounting the view, or touching audio — local preview and the remote stream
  // update automatically. The switchingCamera flag debounces rapid taps.
  const switchCamera = () => {
    if (switchingCamera || !engineRef.current) return;
    setSwitchingCamera(true);
    try {
      engineRef.current.switchCamera();
      setIsFrontCamera((prev) => !prev);
    } catch (err) {
      console.warn('[Agora] switchCamera failed:', err);
    } finally {
      setTimeout(() => setSwitchingCamera(false), 600);
    }
  };

  const toggleCamera = () => {
    const next = !cameraOn;
    engineRef.current?.muteLocalVideoStream(!next); // true to mute, false to unmute
    setCameraOn(next);
  };

  const endCall = async () => {
    try {
      if (callId) {
        await api.post('/calls/end', { call_id: callId });
      }
    } catch (e) {
      console.warn('Failed to end call on backend:', e);
    } finally {
      // Tear down the native CallKeep connection + foreground-service notification
      // on this device (the in-app End button otherwise never notifies RNCallKeep).
      CallManager.endCurrentCall();
      navigation.goBack();
    }
  };

  // Show the fallback if there's an error OR the native module isn't available.
  // We check Agora *synchronously* here: `error` is only set later (in the effect),
  // so without this guard the first render would crash on Agora.RtcSurfaceView.
  const agoraUnavailable = !Agora || !Agora.createAgoraRtcEngine;
  const shownError = error || (agoraUnavailable
    ? 'Video calls require a development build.\nRun: npx expo run:android'
    : '');

  if (shownError) {
    return (
      <View style={styles.fallback}>
        <Ionicons name="videocam-off" size={56} color={colors.white} />
        <Text style={styles.fallbackText}>{shownError}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const RtcSurfaceView = Agora.RtcSurfaceView;
  const RtcTextureView = Agora.RtcTextureView; // Android-only inline renderer (no separate SurfaceView layer)

  return (
    <View style={styles.container}>
      {/* Remote video (the patient) fills the screen. */}
      {remoteUid !== 0 ? (
        <RtcSurfaceView key={remoteUid} style={styles.remote} canvas={{ uid: remoteUid }} />
      ) : (
        <View style={[styles.remote, styles.waiting]}>
          <Ionicons name="medical" size={40} color="rgba(255,255,255,0.2)" style={{ marginBottom: spacing.md }} />
          <Text style={styles.waitingText}>
            {joined ? 'Waiting for patient to join…' : 'Connecting to channel…'}
          </Text>
        </View>
      )}

      {/* Floating Info Header Chip */}
      <View style={styles.headerOverlay}>
        <View style={styles.infoChip}>
          <View style={styles.activeDot} />
          <Text style={styles.infoChipText}>Video Visit</Text>
        </View>
      </View>

      {/* Local video (you, the doctor). */}
      <View style={styles.localWrap}>
        {cameraOn ? (
          engineReady ? (
            // Android: RtcTextureView renders the local preview INLINE inside the rounded
            // container. RtcSurfaceView (a native SurfaceView) composites in its own layer,
            // ignoring borderRadius/overflow, which showed a second full-size rectangle
            // behind the PiP. iOS keeps RtcSurfaceView (RtcTextureView is Android-only).
            Platform.OS === 'android' ? (
              <RtcTextureView
                style={styles.local}
                canvas={{ uid: 0, renderMode: 1 }}
              />
            ) : (
              <RtcSurfaceView
                style={styles.local}
                canvas={{ uid: 0, renderMode: 1 }}
                zOrderMediaOverlay={true}
              />
            )
          ) : (
            <View style={styles.local} />
          )
        ) : (
          <View style={styles.cameraOffPlaceholder}>
            <Ionicons name="videocam-off" size={24} color={colors.white} />
            <Text style={styles.cameraOffText}>Camera Off</Text>
          </View>
        )}
      </View>

      {/* Meet/Zoom styled Controls Bar */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlsBar}>
          <TouchableOpacity 
            style={[styles.ctrlBtn, muted && styles.ctrlBtnMuted]} 
            onPress={toggleMute}
            activeOpacity={0.8}
          >
            <Ionicons name={muted ? 'mic-off' : 'mic'} size={24} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctrlBtn, speakerOn && styles.ctrlBtnActive]}
            onPress={toggleSpeaker}
            activeOpacity={0.8}
          >
            <Ionicons
              name={speakerOn ? 'volume-high' : 'volume-low'}
              size={24}
              color={speakerOn ? '#0F172A' : colors.white}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctrlBtn, !cameraOn && styles.ctrlBtnMuted]}
            onPress={toggleCamera}
            activeOpacity={0.8}
          >
            <Ionicons name={cameraOn ? 'videocam' : 'videocam-off'} size={24} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctrlBtn, (switchingCamera || !cameraOn) && { opacity: 0.5 }]}
            onPress={switchCamera}
            disabled={switchingCamera || !cameraOn}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-reverse" size={24} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.ctrlBtn, styles.endBtn]}
            onPress={endCall}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  remote: { flex: 1 },
  waiting: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F172A' },
  waitingText: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 15, ...fonts.medium },
  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1000,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 8,
  },
  infoChipText: {
    color: colors.white,
    fontSize: 13,
    ...fonts.bold,
  },
  localWrap: {
    position: 'absolute', 
    top: 50, 
    right: 20, 
    width: 100, 
    height: 140,
    borderWidth: 1.5, 
    borderColor: 'rgba(255, 255, 255, 0.5)',
    zIndex: 999, 
    elevation: 10,
    backgroundColor: '#1E293B',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  local: { width: 97, height: 137 },
  cameraOffPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
  },
  cameraOffText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    ...fonts.bold,
    marginTop: 4,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  controlsBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md - 2,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ctrlBtn: {
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center', 
    justifyContent: 'center', 
    marginHorizontal: spacing.sm,
  },
  ctrlBtnMuted: {
    backgroundColor: colors.danger,
  },
  ctrlBtnActive: {
    backgroundColor: colors.white,
  },
  endBtn: { 
    backgroundColor: colors.danger, 
    transform: [{ rotate: '135deg' }],
  },
  fallback: { flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  fallbackText: { color: colors.white, textAlign: 'center', marginTop: spacing.md, lineHeight: 22, ...fonts.medium },
  backBtn: {
    marginTop: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderWidth: 1.5, borderColor: colors.white, borderRadius: radius.sm,
  },
  backText: { color: colors.white, ...fonts.bold },
});
