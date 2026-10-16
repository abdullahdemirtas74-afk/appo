#!/usr/bin/env bash
# Creates a release keystore for Play Store signing. Keep the output OFF git.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${ROOT}/signing"
mkdir -p "$OUT_DIR"
KEYSTORE="${OUT_DIR}/appo-release.keystore"

if [[ -f "$KEYSTORE" ]]; then
  echo "Keystore already exists: $KEYSTORE"
  exit 0
fi

keytool -genkeypair \
  -v \
  -storetype PKCS12 \
  -keystore "$KEYSTORE" \
  -alias appo \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=AppO, OU=Mobile, O=AppO, L=Rumilly, ST=Haute-Savoie, C=FR"

cat > "${OUT_DIR}/keystore.properties.example" <<'EOF'
storeFile=../signing/appo-release.keystore
storePassword=CHANGE_ME
keyAlias=appo
keyPassword=CHANGE_ME
EOF

echo ""
echo "Created $KEYSTORE"
echo "Copy keystore.properties.example → android/key.properties and fill passwords."
echo "NEVER commit signing/ or key.properties."
