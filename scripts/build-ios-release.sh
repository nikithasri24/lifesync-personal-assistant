#!/bin/bash

# Build iOS app in Release mode for testing on device
# This creates a standalone app that doesn't require Xcode connection

echo "📱 Building Life Weave for iOS (Release mode)..."

# Step 1: Build the web assets
echo "1️⃣ Building web assets..."
npm run build:skip-typecheck

# Step 2: Sync with Capacitor
echo "2️⃣ Syncing with Capacitor..."
npx cap sync ios

# Step 3: Open Xcode
echo "3️⃣ Opening Xcode..."
echo ""
echo "✅ Next steps in Xcode:"
echo "   1. Select 'Any iOS Device (arm64)' or your iPhone from the device selector"
echo "   2. Go to Product → Archive"
echo "   3. When archive completes, click 'Distribute App'"
echo "   4. Choose 'Development' distribution"
echo "   5. Select your development team"
echo "   6. Choose 'Export' and save the .ipa file"
echo "   7. Drag the .app file to your iPhone in Finder to install"
echo ""
echo "OR for quick testing:"
echo "   1. Edit Scheme (Product → Scheme → Edit Scheme)"
echo "   2. Change Build Configuration to 'Release'"
echo "   3. Run the app (⌘R)"
echo ""

open ios/App/App.xcodeproj
