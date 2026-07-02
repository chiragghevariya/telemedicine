const { withProjectBuildGradle } = require('@expo/config-plugins');

// Notifee ships its native `app.notifee:core` artifact as a LOCAL maven repo
// inside the node module (node_modules/@notifee/react-native/android/libs) and
// depends on it with a DYNAMIC version (`app.notifee:core:+`).
//
// A dynamic `+` version makes Gradle fetch maven-metadata.xml from EVERY repo to
// list versions — including jitpack — which hangs/fails on machines that can't
// reach jitpack. We register the local repo with `exclusiveContent` so Gradle
// looks for the `app.notifee` group ONLY in the local repo (instant, offline)
// and never queries jitpack/mavenCentral for it.
const MARKER = 'notifee-local-repo';
const REPO_BLOCK = `        exclusiveContent { // ${MARKER}
            forRepository {
                maven { url "$rootDir/../node_modules/@notifee/react-native/android/libs" }
            }
            filter { includeGroup "app.notifee" }
        }`;

function addNotifeeRepo(contents) {
  if (contents.includes(MARKER)) return contents;
  return contents.replace(
    /allprojects\s*\{\s*repositories\s*\{/,
    (match) => `${match}\n${REPO_BLOCK}`
  );
}

module.exports = function withNotifeeRepo(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = addNotifeeRepo(config.modResults.contents);
    }
    return config;
  });
};
