# LifeSync iOS App

## Setup Instructions

### Prerequisites
- Xcode 15+ installed
- Apple Developer account (for device testing and App Store)
- CocoaPods (optional, Capacitor uses SPM by default)

### Initial Setup

1. **Build the web app first:**
   ```bash
   npm run build
   ```

2. **Sync Capacitor:**
   ```bash
   npx cap sync ios
   ```

3. **Open in Xcode:**
   ```bash
   npx cap open ios
   ```

### Xcode Configuration

#### 1. Signing & Capabilities
- Select the "App" target
- Go to "Signing & Capabilities" tab
- Select your Team
- Add the following capabilities:
  - **HealthKit** (already in entitlements)
  - **Push Notifications**
  - **Background Modes** → Remote notifications

#### 2. HealthKit Setup
The entitlements file (`App.entitlements`) already includes HealthKit.
In Xcode:
1. Click "+ Capability"
2. Add "HealthKit"
3. Check "Clinical Health Records" if needed

#### 3. Info.plist Permissions
All required permission descriptions are already configured:
- Speech Recognition
- Microphone
- HealthKit (read/write)
- Location (when in use + always)
- Calendar
- Reminders
- Face ID

### Building for Device

1. Connect your iPhone
2. Select your device in Xcode
3. Click Run (⌘R)

### App Store Submission

1. **Update version numbers:**
   - In Xcode: Target → General → Version & Build
   - In `capacitor.config.ts`: Update `appId` if needed

2. **Create App Store Connect record:**
   - Go to App Store Connect
   - Create new app with bundle ID: `io.ionic.starter` (or your custom ID)

3. **Archive and upload:**
   - Product → Archive
   - Distribute App → App Store Connect

### Troubleshooting

#### HealthKit not working
- Ensure HealthKit capability is added in Xcode
- Check that entitlements file is linked to target
- Verify Info.plist has usage descriptions

#### Push notifications not working
- Add Push Notifications capability
- Configure APNs key in Apple Developer portal
- Add key to your backend (Supabase secrets)

#### Build errors after sync
```bash
npx cap sync ios --force
```

### Native Plugins Used

- `@capacitor/push-notifications` - Push notifications
- `@capacitor/local-notifications` - Local reminders
- `@nicholasbraun/capacitor-healthkit` - HealthKit access
- `@capacitor-community/speech-recognition` - Voice input

