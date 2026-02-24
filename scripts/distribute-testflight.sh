#!/bin/bash

# Distribute Life Weave via TestFlight
# This script guides you through uploading the app to TestFlight

echo "📱 TestFlight Distribution Guide for Life Weave"
echo ""
echo "Prerequisites:"
echo "  ✓ Apple Developer Account (free or paid)"
echo "  ✓ App Store Connect access"
echo "  ✓ Your partner's Apple ID email"
echo ""
echo "Steps to follow:"
echo ""
echo "1️⃣ BUILD & ARCHIVE"
echo "   • Xcode will open the project"
echo "   • Select 'Any iOS Device (arm64)' in device selector"
echo "   • Go to: Product → Archive"
echo "   • Wait for archive to complete (2-5 minutes)"
echo ""
echo "2️⃣ UPLOAD TO APP STORE CONNECT"
echo "   • When archive finishes, Organizer window opens"
echo "   • Select your archive, click 'Distribute App'"
echo "   • Choose: 'App Store Connect'"
echo "   • Click 'Upload'"
echo "   • Select your distribution certificate and provisioning profile"
echo "   • Click 'Upload'"
echo "   • Wait for upload to complete"
echo ""
echo "3️⃣ SET UP TESTFLIGHT (One-time setup)"
echo "   • Go to: https://appstoreconnect.apple.com"
echo "   • Log in with your Apple Developer account"
echo "   • Select 'Life Weave' (or your app)"
echo "   • Go to 'TestFlight' tab"
echo "   • Wait for build to process (10-30 minutes)"
echo ""
echo "4️⃣ ADD TESTERS"
echo "   • In TestFlight tab, click 'Internal Testing' or 'External Testing'"
echo "   • For External Testing (recommended for partners):"
echo "     - Create a test group (e.g., 'Family & Friends')"
echo "     - Add your partner's Apple ID email"
echo "     - Enable the build for this group"
echo "   • For Internal Testing (if you have paid developer account):"
echo "     - Add up to 100 internal testers (iTunes Connect users)"
echo ""
echo "5️⃣ YOUR PARTNER INSTALLS THE APP"
echo "   • They'll receive an email invitation"
echo "   • They install 'TestFlight' app from App Store"
echo "   • They accept the invitation in the email"
echo "   • They can install 'Life Weave' from TestFlight app"
echo ""
echo "BENEFITS OF TESTFLIGHT:"
echo "  ✓ Install on any iPhone (no device connection needed)"
echo "  ✓ Up to 10,000 external testers"
echo "  ✓ Easy to push updates (just upload new archive)"
echo "  ✓ Testers get automatic update notifications"
echo "  ✓ Professional distribution method"
echo ""
echo "Opening Xcode now..."
echo ""

# Build first
echo "Building web assets..."
npm run build:skip-typecheck

# Sync with Capacitor
echo "Syncing with Capacitor..."
npx cap sync ios

# Open Xcode
open ios/App/App.xcodeproj
