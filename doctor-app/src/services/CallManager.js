import { Platform, PermissionsAndroid, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { TOKEN_KEY } from '../config/api';
import { navigationRef } from '../navigation/navigationRef';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let RNCallKeep = null;
let getMessaging = null, getToken = null, onMessage = null, onTokenRefresh = null, setBackgroundMessageHandler = null;

if (!isExpoGo) {
  try {
    RNCallKeep = require('react-native-callkeep').default || require('react-native-callkeep');
    const messagingInstance = require('@react-native-firebase/messaging');
    getMessaging = messagingInstance.getMessaging;
    getToken = messagingInstance.getToken;
    onMessage = messagingInstance.onMessage;
    onTokenRefresh = messagingInstance.onTokenRefresh;
    setBackgroundMessageHandler = messagingInstance.setBackgroundMessageHandler;
  } catch (e) {
    console.warn('Failed to load native modules in development build:', e);
  }
}

let VoipPushNotification = null;
if (Platform.OS === 'ios' && !isExpoGo) {
  try {
    VoipPushNotification = require('react-native-voip-push-notification').default || require('react-native-voip-push-notification');
  } catch (e) {
    console.warn('VoIP Push Notification module not found');
  }
}

// Notifee is used ONLY for the killed / screen-off incoming-call path. Foreground
// and background calls keep using CallKeep, which already works.
let notifee = null, AndroidImportance = null, AndroidCategory = null, AndroidVisibility = null, EventType = null;
if (!isExpoGo) {
  try {
    const notifeeModule = require('@notifee/react-native');
    notifee = notifeeModule.default;
    AndroidImportance = notifeeModule.AndroidImportance;
    AndroidCategory = notifeeModule.AndroidCategory;
    AndroidVisibility = notifeeModule.AndroidVisibility;
    EventType = notifeeModule.EventType;
  } catch (e) {
    console.warn('Notifee module not found');
  }
}

// Persisted incoming-call payload (survives process death) + notification identifiers.
const PENDING_CALL_KEY = 'pending_call';
const INCOMING_CALL_CHANNEL_ID = 'incoming_calls';
const INCOMING_CALL_NOTIFICATION_ID = 'incoming_call';
const PENDING_CALL_TTL_MS = 60000; // ignore a pending call older than 60s

const options = {
  ios: {
    appName: 'Telemed Doctor',
  },
  android: {
    alertTitle: 'Permissions required',
    alertDescription: 'This app needs to access your phone accounts to make calls.',
    cancelButton: 'Cancel',
    okButton: 'ok',
    imageName: 'phone_accounts_icon',
    additionalPermissions: [],
    foregroundService: {
      channelId: 'com.telemed.doctor.callkeep',
      channelName: 'Foreground Service for CallKeep',
      notificationTitle: 'Ongoing video consultation',
      notificationIcon: 'ic_launcher',
    },
  },
};

class CallManager {
  currentCallId = null;
  currentChannelName = null;
  currentAgoraToken = null;
  callKeepInitialized = false;

  async setupCallKeep(skipPermissions = false) {
    if (isExpoGo || !RNCallKeep) {
      console.log('CallKeep setup skipped in Expo Go.');
      return;
    }
    if (this.callKeepInitialized) return;

    if (Platform.OS === 'android' && !skipPermissions) {
      try {
        const isForeground = AppState.currentState === 'active';
        if (isForeground) {
          const permissionsToRequest = [
            PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
            PermissionsAndroid.PERMISSIONS.CALL_PHONE,
          ];
          // POST_NOTIFICATIONS (Android 13+) is required for the killed-state
          // Notifee incoming-call notification to be shown.
          if (PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS) {
            permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
          }
          const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest);
          console.log('Android Telecom permissions:', granted);
        } else {
          // Check silently in background/headless to prevent IllegalStateException
          const readPhoneGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);
          const callPhoneGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
          console.log('Android Telecom background check:', { readPhoneGranted, callPhoneGranted });
        }
      } catch (err) {
        console.warn('Failed to check/request Telecom permissions:', err);
      }
    }

    try {
      await RNCallKeep.setup(options);
      RNCallKeep.setAvailable(true);
      this.callKeepInitialized = true;
      this.setupRetryCount = 0; // reset on success
      console.log('CallKeep setup completed successfully.');
    } catch (err) {
      console.warn('CallKeep setup failed:', err);
      // Retry if activity is not attached yet and we are in the foreground
      if (err.message && err.message.includes("Activity doesn't exist")) {
        this.setupRetryCount = (this.setupRetryCount || 0) + 1;
        if (this.setupRetryCount <= 3) {
          console.log(`[CallManager] Retrying CallKeep setup in 1000ms (Attempt ${this.setupRetryCount})...`);
          setTimeout(() => {
            this.setupCallKeep(skipPermissions);
          }, 1000);
        }
      }
    }
  }

  initialize() {
    if (isExpoGo) {
      console.log('CallManager: Running in Expo Go. Native features disabled.');
      return;
    }
    this.registerEventListeners();
    
    if (Platform.OS === 'ios') {
      this.setupCallKeep();
      this.setupIosVoip();
    } else {
      // Defer permission request on startup to avoid IllegalStateException on cold starts
      setTimeout(() => {
        this.setupCallKeep(false);
      }, 2000);

      // Re-run CallKeep setup + resume any accepted Notifee call when the app
      // transitions to the foreground (covers "app was in background and the user
      // tapped Accept" — the activity is brought forward here).
      AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          this.setupCallKeep(false);
          this.checkPendingCall();
        }
      });

      // Handle taps on the Notifee incoming-call notification while the app is in
      // the foreground (Accept -> open the call, Decline -> decline on backend).
      this.registerNotifeeForegroundEvent();

      this.setupAndroidFcm();
    }
  }

  async syncPushToken() {
    if (isExpoGo) return;

    try {
      const tokenExists = await AsyncStorage.getItem(TOKEN_KEY);
      if (!tokenExists) {
        console.log('Skipping push token sync: User is not logged in.');
        return;
      }

      if (Platform.OS === 'ios') {
        // iOS VoipPushNotification registers asynchronously and calls the event listener.
        // We trigger it here to ensure it registers.
        if (typeof VoipPushNotification !== 'undefined' && VoipPushNotification.registerVoipToken) {
          VoipPushNotification.registerVoipToken();
        }
      } else {
        const messagingInstance = getMessaging();
        const fcmToken = await getToken(messagingInstance);
        if (fcmToken) {
          await api.post('/users/push-tokens', { fcm_token: fcmToken });
          console.log('FCM Push Token synced successfully:', fcmToken);
        }
      }
    } catch (err) {
      console.warn('Push token sync failed:', err);
    }
  }

  setupIosVoip() {
    // Register VoIP push token
    VoipPushNotification.addEventListener('register', async (token) => {
      try {
        const tokenExists = await AsyncStorage.getItem(TOKEN_KEY);
        if (!tokenExists) return;
        // Sync VoIP token with Laravel Backend
        await api.post('/users/push-tokens', { apns_voip_token: token });
      } catch (err) {
        console.warn('VoIP token registration failed:', err);
      }
    });

    VoipPushNotification.addEventListener('notification', (notification) => {
      const { call_id, caller_name, channel_name, agora_token } = notification.data;

      // Store call state for the answer flow. On iOS the incoming call is reported to
      // CallKit natively in AppDelegate.pushRegistry(_:didReceiveIncomingPushWith:...)
      // — that MUST happen synchronously inside the push handler — so we do NOT call
      // displayIncomingCall here (doing so would double-report the same call UUID).
      this.currentCallId = call_id;
      this.currentChannelName = channel_name;
      this.currentAgoraToken = agora_token;

      VoipPushNotification.onVoipNotificationCompleted(notification.uuid);
    });

    this.syncPushToken();
  }

  setupAndroidFcm() {
    const messagingInstance = getMessaging();

    // Register background message handler for FCM
    // This runs when the app is in background or killed state
    setBackgroundMessageHandler(messagingInstance, async (remoteMessage) => {
      this.handleIncomingDataMessage(remoteMessage);
    });

    // Foreground listener
    onMessage(messagingInstance, async (remoteMessage) => {
      this.handleIncomingDataMessage(remoteMessage);
    });

    // Retrieve and register FCM token
    this.syncPushToken();

    // Token refresh listener
    onTokenRefresh(messagingInstance, token => {
      this.syncPushToken();
    });
  }

  async handleIncomingDataMessage(remoteMessage) {
    if (remoteMessage.data && remoteMessage.data.event === 'incoming_call') {
      const { call_id, caller_name, channel_name, agora_token } = remoteMessage.data;

      this.currentCallId = call_id;
      this.currentChannelName = channel_name;
      this.currentAgoraToken = agora_token;

      // Notifee is the incoming-call UI in ALL app states (foreground, background,
      // killed, locked). CallKeep.displayIncomingCall is intentionally NOT used —
      // CallKeep only manages the ACTIVE call after the user accepts.
      await this.persistPendingCall({ call_id, caller_name, channel_name, agora_token });
      await this.showIncomingCallNotification({ caller_name });
    }

    // Any terminal call event tears down whichever incoming surface is showing:
    // the CallKeep connection (foreground/background) and/or the Notifee
    // notification + persisted pending call (killed).
    const terminalEvents = ['call_ended', 'call_declined', 'call_missed'];
    if (remoteMessage.data && terminalEvents.includes(remoteMessage.data.event)) {
      this.endCurrentCall();
    }
  }

  /** Persist the incoming call so it survives the app being killed. */
  async persistPendingCall({ call_id, caller_name, channel_name, agora_token }) {
    try {
      await AsyncStorage.setItem(PENDING_CALL_KEY, JSON.stringify({
        call_id, caller_name, channel_name, agora_token, ts: Date.now(),
      }));
    } catch (err) {
      console.warn('[CallManager] persistPendingCall failed:', err);
    }
  }

  /** Show the killed/screen-off incoming-call notification (tap Accept -> launch app). */
  async showIncomingCallNotification({ caller_name }) {
    if (!notifee) return;
    try {
      await notifee.createChannel({
        id: INCOMING_CALL_CHANNEL_ID,
        name: 'Incoming Calls',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
      });
      await notifee.displayNotification({
        id: INCOMING_CALL_NOTIFICATION_ID,
        title: 'Incoming call',
        body: `${caller_name || 'Someone'} is calling…`,
        android: {
          channelId: INCOMING_CALL_CHANNEL_ID,
          category: AndroidCategory.CALL,
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          smallIcon: 'ic_launcher',
          ongoing: true,
          autoCancel: false,
          // Launch the app (full-screen even over the lock screen — USE_FULL_SCREEN_INTENT
          // is granted) when the user taps the body or Accept.
          fullScreenAction: { id: 'accept', launchActivity: 'default' },
          pressAction: { id: 'accept', launchActivity: 'default' },
          actions: [
            { title: 'Accept', pressAction: { id: 'accept', launchActivity: 'default' } },
            { title: 'Decline', pressAction: { id: 'decline' } },
          ],
        },
      });
    } catch (err) {
      console.warn('[CallManager] showIncomingCallNotification failed:', err);
    }
  }

  /** Remove the killed-state incoming-call notification (if any). */
  async clearIncomingCallNotification() {
    if (!notifee) return;
    try {
      await notifee.cancelNotification(INCOMING_CALL_NOTIFICATION_ID);
    } catch (err) {
      // ignore
    }
  }

  /** Handle Accept/Decline taps on the incoming notification while the app is foreground. */
  registerNotifeeForegroundEvent() {
    if (!notifee) return;
    notifee.onForegroundEvent(async ({ type, detail }) => {
      const { pressAction } = detail;
      if (type === EventType.ACTION_PRESS && pressAction?.id === 'decline') {
        await this.declineFromNotification();
      } else if (type === EventType.ACTION_PRESS || type === EventType.PRESS) {
        // Accept action or notification body press -> resume the call.
        await this.checkPendingCall();
      }
    });
  }

  /** Decline the pending call on the backend and clear all incoming-call state. */
  async declineFromNotification() {
    try {
      const raw = await AsyncStorage.getItem(PENDING_CALL_KEY);
      if (raw) {
        const c = JSON.parse(raw);
        try {
          await api.post('/calls/decline', { call_id: parseInt(c.call_id) });
        } catch (err) {
          // ignore backend error; still clear local state below
        }
      }
    } catch (err) {
      // ignore
    } finally {
      this.cleanupCallState(); // removes the pending record + cancels the notification
    }
  }

  /**
   * On app launch/resume, if a call was accepted from the killed/screen-off
   * notification, accept it on the backend and open VideoCallScreen. Safe to
   * call repeatedly — it removes the pending record first, so it is idempotent.
   */
  async checkPendingCall() {
    try {
      const raw = await AsyncStorage.getItem(PENDING_CALL_KEY);
      if (!raw) return;
      await AsyncStorage.removeItem(PENDING_CALL_KEY);
      this.clearIncomingCallNotification();

      const call = JSON.parse(raw);
      if (!call || !call.channel_name) return;
      if (Date.now() - (call.ts || 0) > PENDING_CALL_TTL_MS) {
        console.log('[CallManager] Pending call is stale, ignoring.');
        return;
      }

      // Restore in-memory state so call ending/decline work after resume.
      this.currentCallId = call.call_id;
      this.currentChannelName = call.channel_name;
      this.currentAgoraToken = call.agora_token;

      // Accept on the backend (unchanged contract). Best-effort: if the call is no
      // longer ringable the backend rejects it and we simply don't navigate.
      try {
        await api.post('/calls/accept', { call_id: parseInt(call.call_id) });
      } catch (err) {
        console.warn('[CallManager] Pending call accept failed:', err?.response?.data || err?.message);
        return;
      }

      // NOTE: We intentionally do NOT call RNCallKeep.startCall()/setCurrentCallActive()
      // here. On a managed phone account that starts a Telecom ConnectionService and
      // renders Android's native call screen on top of VideoCallScreen. The Notifee
      // Accept must go straight to Agora with no native call UI. CallKeep stays
      // available only for teardown (endCurrentCall -> endAllCalls) and audio if ever needed.

      // Navigate once the navigation container is ready.
      const navigateToCall = () => {
        if (navigationRef.isReady()) {
          navigationRef.navigate('VideoCall', {
            channelName: call.channel_name,
            token: call.agora_token,
            callId: call.call_id,
          });
        } else {
          setTimeout(navigateToCall, 100);
        }
      };
      navigateToCall();
    } catch (err) {
      console.warn('[CallManager] checkPendingCall failed:', err);
    }
  }

  /**
   * Terminate the active CallKeep call on THIS device and clear stored state.
   * Ending the CallKeep connection also stops the VoiceConnectionService
   * foreground service, which removes the "Ongoing video consultation" notification.
   */
  endCurrentCall() {
    try {
      if (RNCallKeep && this.callKeepInitialized) {
        RNCallKeep.endAllCalls();
      }
    } catch (err) {
      console.warn('[CallManager] endCurrentCall failed:', err);
    } finally {
      this.cleanupCallState();
    }
  }

  registerEventListeners() {
    RNCallKeep.addEventListener('answerCall', async ({ callUUID }) => {
      const triggerTime = new Date().toISOString();
      console.log(`[CallManager] answerCall event triggered at: ${triggerTime} for UUID: ${callUUID}`);
      console.log(`[CallManager] Stored currentCallId: ${this.currentCallId}`);

      // We determine the database call_id to send.
      // We prefer this.currentCallId (which is the actual integer ID from FCM), 
      // falling back to callUUID if it's a number.
      const dbCallId = this.currentCallId ? parseInt(this.currentCallId) : parseInt(callUUID);

      console.log(`[CallManager] Sending accept API call for dbCallId: ${dbCallId}`);
      
      try {
        const response = await api.post('/calls/accept', { call_id: dbCallId });
        console.log('[CallManager] Accept API response status:', response.status);

        if (response.status === 200 || response.status === 201) {
          // 1. Immediately set call active to clear native ring
          if (RNCallKeep && this.callKeepInitialized) {
            console.log(`[CallManager] Calling setCurrentCallActive for UUID: ${callUUID}`);
            RNCallKeep.setCurrentCallActive(callUUID);
          }

          // 2. Bring app to foreground
          console.log('[CallManager] Calling backToForeground');
          RNCallKeep.backToForeground();

          // 3. Implement navigation retry / delay logic to wait for app to be ready
          const navigateToCall = () => {
            try {
              if (navigationRef.isReady()) {
                console.log(`[CallManager] navigationRef is ready. Navigating to VideoCall at: ${new Date().toISOString()}`);
                navigationRef.navigate('VideoCall', {
                  channelName: this.currentChannelName,
                  token: this.currentAgoraToken,
                  callId: this.currentCallId,
                });
              } else {
                console.warn('[CallManager] navigationRef is not ready yet. Retrying in 100ms...');
                setTimeout(navigateToCall, 100);
              }
            } catch (err) {
              console.error('[CallManager] Navigation error: ', err);
            }
          };

          // Wait 500ms for backToForeground transition to stabilize the UI thread
          setTimeout(navigateToCall, 500);
        } else {
          throw new Error(`Non-200 response code: ${response.status}`);
        }
      } catch (error) {
        if (error.response) {
          console.error('[CallManager] Failed to accept call on backend. Response data:', error.response.data, 'Status:', error.response.status);
        } else {
          console.error('[CallManager] Failed to accept call on backend: ', error.message || error);
        }
        
        // Stop the ringtone/incoming screen explicitly if API fails to prevent ghost ringing
        if (RNCallKeep && this.callKeepInitialized) {
          console.log(`[CallManager] Stopping CallKeep ringtone due to API failure for UUID: ${callUUID}`);
          RNCallKeep.endCall(callUUID);
        }
      }
    });

    RNCallKeep.addEventListener('endCall', async ({ callUUID }) => {
      try {
        // Inform backend call has been declined or hung up
        await api.post('/calls/decline', { call_id: callUUID });
      } catch (error) {
        console.error('Failed to decline call: ', error);
      } finally {
        this.cleanupCallState();
      }
    });
  }

  cleanupCallState() {
    this.currentCallId = null;
    this.currentChannelName = null;
    this.currentAgoraToken = null;
    AsyncStorage.removeItem(PENDING_CALL_KEY).catch(() => {});
    this.clearIncomingCallNotification();
  }
}

export default new CallManager();
