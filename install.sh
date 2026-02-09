#!/bin/bash
set -euo pipefail

APP_NAME="Pegboard"
REPO="chadbyte/pegboard"
INSTALL_DIR="/Applications"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[*]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[x]${NC} $1"; exit 1; }

# Check macOS
[[ "$(uname)" == "Darwin" ]] || error "This installer is for macOS only."

# Check architecture
ARCH="$(uname -m)"
if [[ "$ARCH" != "arm64" ]]; then
  warn "This build is for Apple Silicon (arm64). Your machine is $ARCH."
  warn "The app may run via Rosetta 2 but is not officially supported."
fi

# Get latest release download URL
info "Fetching latest release..."
DOWNLOAD_URL=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
  | grep "browser_download_url.*mac-arm64.*\.zip" \
  | head -1 \
  | cut -d '"' -f 4)

if [[ -z "$DOWNLOAD_URL" ]]; then
  error "Could not find a download URL. Check https://github.com/${REPO}/releases"
fi

VERSION=$(echo "$DOWNLOAD_URL" | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1)
info "Found ${APP_NAME} ${VERSION:-latest}"

# Download
TMPDIR_PATH=$(mktemp -d)
ZIP_PATH="${TMPDIR_PATH}/${APP_NAME}.zip"

info "Downloading..."
curl -fSL --progress-bar "$DOWNLOAD_URL" -o "$ZIP_PATH"

# Remove old version if exists
if [[ -d "${INSTALL_DIR}/${APP_NAME}.app" ]]; then
  warn "Removing existing ${APP_NAME}.app..."
  rm -rf "${INSTALL_DIR}/${APP_NAME}.app"
fi

# Extract and install
info "Installing to ${INSTALL_DIR}..."
unzip -q "$ZIP_PATH" -d "$TMPDIR_PATH"

# Find the .app bundle (may be nested in a folder)
APP_BUNDLE=$(find "$TMPDIR_PATH" -name "${APP_NAME}.app" -maxdepth 2 -type d | head -1)

if [[ -z "$APP_BUNDLE" ]]; then
  error "Could not find ${APP_NAME}.app in the downloaded archive."
fi

mv "$APP_BUNDLE" "${INSTALL_DIR}/"

# Clear quarantine attribute (unsigned app)
xattr -cr "${INSTALL_DIR}/${APP_NAME}.app" 2>/dev/null || true

# Cleanup
rm -rf "$TMPDIR_PATH"

info "${APP_NAME} installed successfully!"
echo ""
echo "  Open from Spotlight or run:"
echo "    open -a ${APP_NAME}"
echo ""
