const { withAndroidManifest, withPlugins } = require('@expo/config-plugins');

function withCallKeepAndroidManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // 1. Add permissions
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }
    const permissions = [
      'android.permission.BIND_TELECOM_CONNECTION_SERVICE',
      'android.permission.READ_PHONE_STATE',
      'android.permission.CALL_PHONE',
      'android.permission.MANAGE_OWN_CALLS',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.WAKE_LOCK',
      // Android 14 (API 34) call foreground-service + lock-screen requirements
      'android.permission.FOREGROUND_SERVICE_PHONE_CALL',
      'android.permission.FOREGROUND_SERVICE_MICROPHONE',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.USE_FULL_SCREEN_INTENT',
    ];
    permissions.forEach((perm) => {
      const exists = androidManifest.manifest['uses-permission'].some(
        (p) => p.$['android:name'] === perm
      );
      if (!exists) {
        androidManifest.manifest['uses-permission'].push({
          $: { 'android:name': perm },
        });
      }
    });

    // 2. Add VoiceConnectionService
    if (!mainApplication.service) {
      mainApplication.service = [];
    }
    const serviceName = 'io.wazo.callkeep.VoiceConnectionService';
    const serviceExists = mainApplication.service.some(
      (s) => s.$['android:name'] === serviceName
    );
    if (!serviceExists) {
      mainApplication.service.push({
        $: {
          'android:name': serviceName,
          'android:label': 'Wazo',
          'android:permission': 'android.permission.BIND_TELECOM_CONNECTION_SERVICE',
          'android:exported': 'true',
          'android:foregroundServiceType': 'phoneCall|microphone',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.telecom.ConnectionService',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });
}

module.exports = function withCallKeep(config) {
  return withPlugins(config, [withCallKeepAndroidManifest]);
};
