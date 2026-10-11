#!/usr/bin/env bash
# Local, signed Android release build (Play Store .aab).
#
#   cd fitX-frontend && ./scripts/build-android-release.sh
#
# Guards against the usual mistakes: wrong Java, an un-bumped versionCode, an
# AAB signed with the debug key or a different key than the one Play expects.
# Output: build-output/fitx-<version>-<versionCode>.aab
set -euo pipefail
cd "$(dirname "$0")/.."

LAST_LIVE_VERSION_CODE=19            # update after each Play release
CREDENTIALS="${CREDENTIALS_FILE:-credentials.json}"
OUT_DIR="build-output"

say() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
die() { printf '\033[31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

say "1/7 Java"
if [[ -z "${JAVA_HOME:-}" ]]; then
  for c in "$HOME/.sdkman/candidates/java/17"*/ "/Library/Java/JavaVirtualMachines/"*17*/Contents/Home; do
    [[ -x "$c/bin/javac" ]] && { export JAVA_HOME="${c%/}"; break; }
  done
fi
[[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/javac" ]] || die "JDK 17 not found. Install it (e.g. 'sdk install java 17.0.12-oracle') or set JAVA_HOME."
JV="$("$JAVA_HOME/bin/javac" -version 2>&1 | awk '{print $2}' | cut -d. -f1)"
[[ "$JV" == "17" ]] || die "JAVA_HOME is JDK $JV; use JDK 17 (Android Studio's bundled Java 25 breaks the native build)."
echo "JDK 17 at $JAVA_HOME"
[[ -n "${ANDROID_HOME:-}" && -d "$ANDROID_HOME" ]] || die "ANDROID_HOME is not set / missing."

say "2/7 Versions"
VERSION="$(node -p "require('./app.json').expo.android.version || require('./app.json').expo.version")"
CODE="$(node -p "require('./app.json').expo.android.versionCode")"
echo "version $VERSION, versionCode $CODE (last live: $LAST_LIVE_VERSION_CODE)"
(( CODE > LAST_LIVE_VERSION_CODE )) || die "versionCode $CODE must be greater than the live $LAST_LIVE_VERSION_CODE. Bump expo.android.versionCode in app.json."

say "3/7 Signing credentials"
[[ -f "$CREDENTIALS" ]] || die "$CREDENTIALS not found."
CRED_ABS="$(node -p "require('path').resolve('$CREDENTIALS')")"
export FITX_UPLOAD_STORE_FILE="$(node -p "const c=require('$CRED_ABS'); require('path').resolve(require('path').dirname('$CRED_ABS'), c.android.keystore.keystorePath)")"
export FITX_UPLOAD_STORE_PASSWORD="$(node -p "require('$CRED_ABS').android.keystore.keystorePassword")"
export FITX_UPLOAD_KEY_ALIAS="$(node -p "require('$CRED_ABS').android.keystore.keyAlias")"
export FITX_UPLOAD_KEY_PASSWORD="$(node -p "require('$CRED_ABS').android.keystore.keyPassword")"
[[ -f "$FITX_UPLOAD_STORE_FILE" ]] || die "keystore not found at $FITX_UPLOAD_STORE_FILE"
EXPECTED="$("$JAVA_HOME/bin/keytool" -list -v -keystore "$FITX_UPLOAD_STORE_FILE" -alias "$FITX_UPLOAD_KEY_ALIAS" \
  -storepass "$FITX_UPLOAD_STORE_PASSWORD" 2>/dev/null | awk '/SHA1:/{print $2; exit}')"
[[ -n "$EXPECTED" ]] || die "could not read the keystore (wrong password/alias?)"
echo "upload key SHA-1: $EXPECTED"
echo "  -> compare with Play Console > Setup > App signing > 'Upload key certificate' (must match for updates)"

say "4/7 Install + type-check"
pnpm install --frozen-lockfile
npx tsc --noEmit -p .

say "5/7 Generate the Android project"
npx expo prebuild -p android --clean --no-install

say "6/7 Build the release bundle (10-20 min)"
# GRADLE_ARGS lets you limit ABIs for a quick test, e.g. GRADLE_ARGS="-PreactNativeArchitectures=arm64-v8a"
( cd android && ./gradlew :app:bundleRelease --console=plain ${GRADLE_ARGS:-} )
AAB="android/app/build/outputs/bundle/release/app-release.aab"
[[ -f "$AAB" ]] || die "bundle not produced"

say "7/7 Verify signature"
ACTUAL="$("$JAVA_HOME/bin/keytool" -printcert -jarfile "$AAB" 2>/dev/null | awk '/SHA1:/{print $2; exit}')"
echo "bundle signed with SHA-1: $ACTUAL"
[[ "$ACTUAL" == "$EXPECTED" ]] || die "bundle is NOT signed with the upload key (got '$ACTUAL', expected '$EXPECTED'). Do not upload it."
mkdir -p "$OUT_DIR"
OUT="$OUT_DIR/fitx-$VERSION-$CODE.aab"
cp "$AAB" "$OUT"
printf '\n\033[32mOK\033[0m  %s  (%s MB)\n' "$OUT" "$(du -m "$OUT" | cut -f1)"
shasum -a 256 "$OUT"
echo "Upload this file in Play Console. Then set LAST_LIVE_VERSION_CODE=$CODE in this script."
