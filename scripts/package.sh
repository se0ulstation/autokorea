#!/usr/bin/env bash
# Package AutoKorea for Chrome Web Store upload.
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
OUT_DIR="dist"
ZIP_NAME="autokorea-v${VERSION}.zip"
ZIP_PATH="${OUT_DIR}/${ZIP_NAME}"

mkdir -p "$OUT_DIR"
rm -f "$ZIP_PATH"

# Sanity checks before packaging
test -f manifest.json || { echo "manifest.json missing"; exit 1; }
test -f icons/16.png && test -f icons/48.png && test -f icons/128.png \
  || { echo "icons missing — run scripts/make-icons.py"; exit 1; }
python3 -c "import json; json.load(open('manifest.json'))" \
  || { echo "manifest.json invalid JSON"; exit 1; }

bash "$(dirname "$0")/test.sh"

zip -r "$ZIP_PATH" \
  manifest.json \
  icons \
  src \
  -x "*.DS_Store" "*/.*"

echo
echo "✅ Packaged: $ZIP_PATH"
ls -lh "$ZIP_PATH"
echo
echo "Next: upload to https://chrome.google.com/webstore/devconsole/"
