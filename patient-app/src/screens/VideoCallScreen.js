// Agora video consultation screen.
//
// IMPORTANT: react-native-agora is a NATIVE module. It does NOT work in Expo Go.
// You must create a development build:  npx expo prebuild  &&  npx expo run:android
// (or run:ios). In Expo Go this screen shows a friendly "needs a dev build" message.

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AGORA_APP_ID, AGORA_TOKEN } from '../config/agora';
import { colors, spacing } from '../config/theme';

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
    await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);
  }
}

export default function VideoCallScreen({ route, navigation }) {
  const { channelName } = route.params;

  const engineRef = useRef(null);
  const joinedRef = useRef(false);                // true once we've joined the channel
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0); // 0 = no one else yet
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let connectTimeout = null;

    const start = async () => {
      // Guard 1: native module missing (Expo Go).
      if (!Agora || !Agora.createAgoraRtcEngine) {
        setError('Video calls require a development build (not Expo Go).\nRun: npx expo prebuild && npx expo run:android');
        return;
      }
      // Guard 2: Agora App ID not configured yet.
      if (!AGORA_APP_ID || AGORA_APP_ID.startsWith('PASTE_')) {
        setError('Please set your Agora App ID in src/config/agora.js');
        return;
      }
      // Guard 3: no channel name was provided for this appointment.
      if (!channelName) {
        setError('No video channel was found for this appointment.');
        return;
      }

      try {
        await requestPermissions();

        const engine = Agora.createAgoraRtcEngine();
        engineRef.current = engine;
        engine.initialize({ appId: AGORA_APP_ID });

        // React to call events.
        engine.registerEventHandler({
          onJoinChannelSuccess: () => { joinedRef.current = true; setJoined(true); },
          onUserJoined: (_connection, uid) => setRemoteUid(uid),     // doctor joined
          onUserOffline: () => setRemoteUid(0),                       // doctor left
        });

        engine.enableVideo();
        engine.startPreview();

        // Join the unique channel the backend generated for this appointment.
        engine.joinChannel(AGORA_TOKEN, channelName, 0, {
          channelProfile: Agora.ChannelProfileType.ChannelProfileCommunication,
          clientRoleType: Agora.ClientRoleType.ClientRoleBroadcaster,
        });

        // If we can't connect within 20s, stop showing "Connecting…" and show an error.
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

    // Leave + clean up when the screen closes.
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

  const endCall = () => {
    // Cleanup runs in the useEffect return; just close the screen.
    navigation.goBack();
  };

  // ---- Fallback UI (Expo Go / not configured / error) ----
  // Check Agora *synchronously* here: `error` is only set later (in the effect),
  // so without this guard the first render would crash on Agora.RtcSurfaceView
  // when the native module isn't available.
  const agoraUnavailable = !Agora || !Agora.createAgoraRtcEngine;
  const shownError = error || (agoraUnavailable
    ? 'Video calls require a development build (not Expo Go).\nRun: npx expo prebuild && npx expo run:android'
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

  return (
    <View style={styles.container}>
      {/* Remote video (the doctor) fills the screen. */}
      {remoteUid !== 0 ? (
        <RtcSurfaceView style={styles.remote} canvas={{ uid: remoteUid }} />
      ) : (
        <View style={[styles.remote, styles.waiting]}>
          <Text style={styles.waitingText}>
            {joined ? 'Waiting for the doctor to join…' : 'Connecting…'}
          </Text>
        </View>
      )}

      {/* Local video (you) in a small floating box. */}
      <View style={styles.localWrap}>
        <RtcSurfaceView style={styles.local} canvas={{ uid: 0 }} />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.ctrlBtn, muted && styles.ctrlBtnActive]} onPress={toggleMute}>
          <Ionicons name={muted ? 'mic-off' : 'mic'} size={26} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.ctrlBtn, styles.endBtn]} onPress={endCall}>
          <Ionicons name="call" size={26} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  remote: { flex: 1 },
  waiting: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' },
  waitingText: { color: colors.white, fontSize: 16 },
  localWrap: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 110,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.white,
  },
  local: { flex: 1 },
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  ctrlBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
  },
  ctrlBtnActive: { backgroundColor: 'rgba(255,255,255,0.4)' },
  endBtn: { backgroundColor: colors.danger, transform: [{ rotate: '135deg' }] },
  fallback: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  fallbackText: {
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },
  backBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: 8,
  },
  backText: { color: colors.white, fontWeight: '700' },
});
