/**
 * WebdriverIO + Appium config for iOS
 *
 * Simulator (default):
 *   npm run test:ios
 *
 * Real device (USB):
 *   APPIUM_UDID=<device-udid> APPIUM_PLATFORM_VERSION=18.0 npm run test:ios:device
 *
 * Find your device UDID:
 *   xcrun xctrace list devices
 *
 * Build the .app first (simulator):
 *   npm run ios:build:sim
 */

import { execSync } from 'child_process';
import path from 'path';
import type { Options } from '@wdio/types';

const SIM_APP_PATH = path.resolve('ios/build/Build/Products/Debug-iphonesimulator/App.app');
const DEVICE_IPA_PATH = path.resolve('ios/build/App.ipa'); // produced by `npm run ios:build:device`

const isDevice = !!process.env.APPIUM_UDID;

function resolveApp() {
  if (isDevice) return DEVICE_IPA_PATH;
  // For simulator: use the .app in the local build folder
  return SIM_APP_PATH;
}

export const config: Options.Testrunner = {
  runner: 'local',
  specs: ['./tests/ios/**/*.spec.ts'],
  exclude: [],

  maxInstances: 1,

  capabilities: [
    isDevice
      ? {
          // ── Real device ──────────────────────────────────────────────
          platformName: 'iOS',
          'appium:automationName': 'XCUITest',
          'appium:udid': process.env.APPIUM_UDID,
          'appium:platformVersion': process.env.APPIUM_PLATFORM_VERSION ?? '18.0',
          'appium:deviceName': 'iPhone',
          'appium:app': resolveApp(),
          'appium:bundleId': 'com.lifesync.app',
          'appium:autoWebview': true,
          'appium:autoWebviewTimeout': 15000,
          'appium:newCommandTimeout': 240,
          'appium:noReset': true, // keep data between runs (faster)
        }
      : {
          // ── Simulator ────────────────────────────────────────────────
          platformName: 'iOS',
          'appium:automationName': 'XCUITest',
          'appium:deviceName': process.env.APPIUM_SIM_NAME ?? 'iPhone 16',
          'appium:platformVersion': process.env.APPIUM_PLATFORM_VERSION ?? '18.2',
          'appium:app': resolveApp(),
          'appium:bundleId': 'com.lifesync.app',
          'appium:autoWebview': true,
          'appium:autoWebviewTimeout': 15000,
          'appium:newCommandTimeout': 240,
          'appium:noReset': true,
        },
  ],

  logLevel: 'warn',
  bail: 0,
  waitforTimeout: 15000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  services: [
    [
      'appium',
      {
        command: 'appium',
        args: { port: 4723, relaxedSecurity: true },
        logFileName: 'logs/appium.log',
      },
    ],
  ],

  port: 4723,
  path: '/',

  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
  },

  reporters: ['spec'],

  /**
   * After a test run: print the Appium log path so it's easy to find on failure.
   */
  onComplete() {
    console.log('\nAppium log → logs/appium.log');
  },
};
