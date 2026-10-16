#!/usr/bin/env bash
# Build a signed (or unsigned if no key.properties) Play Store AAB.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${ANDROID_HOME:-}${ANDROID_SDK_ROOT:-}" ]]; then
  echo "Set ANDROID_HOME (Android SDK) before building."
  exit 1
fi

npm run sync:android
cd android

if [[ ! -f local.properties ]]; then
  SDK="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
  echo "sdk.dir=${SDK}" > local.properties
fi

./gradlew bundleRelease
echo ""
echo "AAB: android/app/build/outputs/bundle/release/app-release.aab"
