#!/usr/bin/env bash
# Build the Capacitor iOS app for the simulator.
# Output: ios/build/Build/Products/Debug-iphonesimulator/App.app
#
# Usage: npm run ios:build:sim
#        SIMULATOR_NAME="iPhone 15" npm run ios:build:sim

set -e

SIM_NAME="${SIMULATOR_NAME:-iPhone 16}"
WORKSPACE="ios/App/App.xcworkspace"
SCHEME="App"
BUILD_DIR="ios/build"

echo "▶ Building for simulator: $SIM_NAME"

xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -destination "platform=iOS Simulator,name=$SIM_NAME" \
  -derivedDataPath "$BUILD_DIR" \
  -quiet \
  build

APP_PATH="$BUILD_DIR/Build/Products/Debug-iphonesimulator/App.app"

if [ -d "$APP_PATH" ]; then
  echo "✅ Built: $APP_PATH"
else
  echo "❌ Build succeeded but App.app not found at expected path"
  exit 1
fi
