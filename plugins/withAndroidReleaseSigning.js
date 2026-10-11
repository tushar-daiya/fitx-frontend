// Expo config plugin: sign *release* Android builds with the upload keystore.
//
// `expo prebuild` generates a release build type that is signed with the DEBUG
// key, which Google Play rejects. This adds a separate signing config that is
// used when these environment variables are set (scripts/build-android-release.sh
// sets them from credentials.json); without them the build falls back to the
// default, so CI / quick verification builds still work.
//
//   FITX_UPLOAD_STORE_FILE, FITX_UPLOAD_STORE_PASSWORD,
//   FITX_UPLOAD_KEY_ALIAS,  FITX_UPLOAD_KEY_PASSWORD
//
// The config is named "fitxUpload" (not "release") so it can't clash with the
// one EAS Build injects.
const { withAppBuildGradle } = require("@expo/config-plugins");

const SIGNING = `
        fitxUpload {
            if (System.getenv('FITX_UPLOAD_STORE_FILE')) {
                storeFile file(System.getenv('FITX_UPLOAD_STORE_FILE'))
                storePassword System.getenv('FITX_UPLOAD_STORE_PASSWORD')
                keyAlias System.getenv('FITX_UPLOAD_KEY_ALIAS')
                keyPassword System.getenv('FITX_UPLOAD_KEY_PASSWORD')
            }
        }`;

module.exports = function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let g = cfg.modResults.contents;
    if (g.includes("fitxUpload")) return cfg; // already applied
    // 1) add the signing config after the debug one
    g = g.replace(/(signingConfigs\s*\{\s*debug\s*\{[\s\S]*?\n\s{8}\})/, `$1${SIGNING}`);
    // 2) use it for the release build type when the env vars are present
    g = g.replace(
      /(release\s*\{[^}]*?)signingConfig signingConfigs\.debug/,
      "$1signingConfig System.getenv('FITX_UPLOAD_STORE_FILE') ? signingConfigs.fitxUpload : signingConfigs.debug"
    );
    if (!g.includes("signingConfigs.fitxUpload")) {
      throw new Error("withAndroidReleaseSigning: could not patch android/app/build.gradle (template changed?)");
    }
    cfg.modResults.contents = g;
    return cfg;
  });
};
