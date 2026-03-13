import type { CapacitorConfig } from '@capacitor/cli';

// Live-reload support: CAPACITOR_DEV=true npx cap sync
// Override URL with CAPACITOR_DEV_URL (defaults to 192.168.1.240:5173)
const devServerUrl = process.env.CAPACITOR_DEV_URL ?? 'http://192.168.1.240:5173';
const isDevMode = process.env.CAPACITOR_DEV === 'true';

const config: CapacitorConfig = {
  appId: 'com.lifesync.app',
  appName: 'Life Weave',
  webDir: 'dist',

  // Injected when CAPACITOR_DEV=true — do not set manually
  ...(isDevMode
    ? { server: { url: devServerUrl, cleartext: true } }
    : {}),

  // Plugin configurations
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#4F46E5', // Indigo to match app theme
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#4F46E5',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#4F46E5',
      sound: 'notification.wav',
    },
  },

  // iOS specific configuration
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    preferredContentMode: 'mobile',
  },

  // Android specific configuration
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true, // Disable in production
  },
};

export default config;
