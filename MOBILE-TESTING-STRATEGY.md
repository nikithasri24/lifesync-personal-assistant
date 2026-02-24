# Mobile App Testing Strategy (iOS & Android)

## Overview

LifeSync is a **hybrid app** built with Capacitor, meaning the same codebase runs as:
- 🌐 **Web app** (browser)
- 📱 **iOS app** (native)
- 🤖 **Android app** (native)

This document outlines how to test both platforms efficiently without duplicating effort.

---

## Test Pyramid for Mobile

```
            /\
           /  \  Manual Testing on Real Devices
          /----\  (Final validation, platform-specific edge cases)
         /      \
        /--------\ Native E2E Tests (Appium/Detox)
       /          \ (Critical flows on iOS/Android simulators)
      /------------\
     /              \ Mobile Web E2E Tests (Playwright)
    /                \ (Most scenarios via mobile browsers)
   /------------------\
  /____________________\ Unit & Component Tests (Vitest)
                        (Same as web - business logic doesn't change)
```

---

## 1. Testing Approach by Layer

### Layer 1: Unit & Component Tests (Shared - Already Covered ✅)

**What**: Business logic, React components, hooks
**Where**: `src/**/*.test.{ts,tsx}`
**Platform**: Platform-agnostic (works on web + mobile)
**Coverage**: 80%+ of logic

```bash
# Same tests run for web AND mobile
npm test
```

**Why it works**: Your business logic (task creation, habit tracking, etc.) is the same whether the user is on web, iOS, or Android.

---

### Layer 2: Mobile Web E2E Tests (Playwright with Mobile Browsers)

**What**: Full app testing in mobile browser viewports
**Where**: `tests/e2e/mobile/`
**Platform**: Mobile browsers (iOS Safari, Android Chrome)
**Coverage**: ~90% of functionality

This is the **most efficient** approach - test mobile behavior without building native apps!

#### Setup Mobile Browser Testing

**Update `playwright.config.ts`:**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    // ... existing desktop browsers ...

    // Mobile browsers
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 13'],
        // iOS-specific settings
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        // Android-specific settings
      },
    },
    {
      name: 'Tablet',
      use: {
        ...devices['iPad Pro'],
      },
    },
  ],
});
```

#### Mobile-Specific Test Example

```typescript
// tests/e2e/mobile/navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation', () => {
  test.use({
    ...devices['iPhone 13'],
  });

  test('should show bottom tab navigation on mobile @mobile', async ({ page }) => {
    await page.goto('/');

    // Mobile should show bottom tabs instead of sidebar
    const bottomNav = page.getByTestId('bottom-navigation');
    await expect(bottomNav).toBeVisible();

    // Sidebar should be hidden
    const sidebar = page.getByTestId('sidebar');
    await expect(sidebar).not.toBeVisible();
  });

  test('should support swipe gestures @mobile', async ({ page }) => {
    await page.goto('/todos');

    const task = page.getByRole('listitem').first();

    // Simulate swipe left
    await task.swipe('left');

    // Delete button should appear
    await expect(page.getByRole('button', { name: /delete/i })).toBeVisible();
  });

  test('modals should slide from bottom on mobile @mobile', async ({ page }) => {
    await page.goto('/');

    // Open modal
    await page.getByRole('button', { name: /add task/i }).click();

    const modal = page.getByRole('dialog');

    // Modal should have bottom-aligned mobile styles
    const styles = await modal.evaluate(el => window.getComputedStyle(el));
    expect(styles.bottom).toBe('0px'); // Mobile modals anchor to bottom
  });

  test('should have proper touch target sizes @mobile', async ({ page }) => {
    await page.goto('/');

    // All interactive elements should be >= 44x44px (Apple guideline)
    const buttons = page.getByRole('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
```

**Run mobile web tests:**
```bash
# All mobile browsers
npm run test:e2e -- --project="Mobile Safari" --project="Mobile Chrome"

# iOS Safari only
npm run test:e2e -- --project="Mobile Safari"

# Android Chrome only
npm run test:e2e -- --project="Mobile Chrome"
```

---

### Layer 3: Native App E2E Tests (Appium - Critical Flows Only)

**What**: Native features that can't be tested in browser
**Where**: `tests/native/`
**Platform**: iOS Simulator, Android Emulator, Real Devices
**Coverage**: ~10% (native-only features)

**When to use**:
- ✅ Push notifications
- ✅ Camera/photo uploads
- ✅ Biometric authentication (Face ID, fingerprint)
- ✅ Native navigation
- ✅ App store builds
- ✅ Offline functionality
- ✅ Background sync

#### Setup Appium Testing

**Install Appium:**
```bash
npm install -g appium
npm install --save-dev @wdio/appium-service webdriverio
appium driver install xcuitest  # iOS
appium driver install uiautomator2  # Android
```

**Create `wdio.conf.ts` for WebDriverIO:**

```typescript
// tests/native/wdio.conf.ts
export const config: WebdriverIO.Config = {
  runner: 'local',
  specs: ['./tests/native/**/*.spec.ts'],

  capabilities: [
    // iOS Simulator
    {
      platformName: 'iOS',
      'appium:platformVersion': '17.0',
      'appium:deviceName': 'iPhone 15',
      'appium:app': '/path/to/ios/build/LifeSync.app',
      'appium:automationName': 'XCUITest',
    },
    // Android Emulator
    {
      platformName: 'Android',
      'appium:platformVersion': '14',
      'appium:deviceName': 'Pixel 7',
      'appium:app': '/path/to/android/build/app-release.apk',
      'appium:automationName': 'UiAutomator2',
    },
  ],

  services: ['appium'],
  framework: 'mocha',
};
```

#### Native Test Example

```typescript
// tests/native/push-notifications.spec.ts
import { browser, $ } from '@wdio/globals';

describe('Push Notifications (Native)', () => {
  it('should receive push notification for Together message', async () => {
    // Send test notification
    await sendTestPushNotification({
      title: 'New message from partner',
      body: 'Test message',
    });

    // Notification should appear in notification center
    if (browser.isIOS) {
      await browser.execute('mobile: backgroundApp', { seconds: -1 });
      const notification = await $('~New message from partner');
      await expect(notification).toBeDisplayed();
    } else {
      // Android notification handling
      await browser.openNotifications();
      const notification = await $('android=new UiSelector().text("New message from partner")');
      await expect(notification).toBeDisplayed();
    }

    // Tap notification
    await notification.click();

    // Should open Together page
    const togetherPage = await $('~Together');
    await expect(togetherPage).toBeDisplayed();
  });

  it('should request camera permission for barcode scanner', async () => {
    await browser.url('capacitor://app/shopping-smart');

    // Tap barcode scan button
    await $('~Scan barcode').click();

    // Should show camera permission dialog
    if (browser.isIOS) {
      const alert = await browser.getAlertText();
      expect(alert).toContain('camera');
      await browser.acceptAlert();
    } else {
      // Android handles permissions differently
      await browser.execute('mobile: shell', {
        command: 'pm grant com.lifesync.app android.permission.CAMERA',
      });
    }

    // Camera view should open
    const camera = await $('~Camera');
    await expect(camera).toBeDisplayed();
  });
});
```

**Run native tests:**
```bash
# iOS Simulator
npm run test:native:ios

# Android Emulator
npm run test:native:android

# Both platforms
npm run test:native
```

---

### Layer 4: Manual Testing on Real Devices (Final Validation)

**What**: Platform-specific edge cases, final polish
**When**: Before each release
**Duration**: 1-2 hours per platform

**Test on real devices:**
- 📱 iOS: iPhone (latest 2 versions)
- 🤖 Android: Pixel or Samsung (latest 2 versions)

**Focus areas:**
- Performance on real hardware
- Touch gestures feel natural
- Camera/biometric features work
- Push notifications work
- App store build installs correctly
- No crashes or freezes

---

## 2. Capacitor-Specific Testing

### Testing Capacitor Plugins

Many features use Capacitor plugins. Test these with mocks in unit tests, and real behavior in native tests.

```typescript
// src/hooks/useCamera.test.ts (Unit test with mock)
import { describe, it, expect, vi } from 'vitest';
import { Camera } from '@capacitor/camera';

vi.mock('@capacitor/camera');

describe('useCamera', () => {
  it('should request camera permission', async () => {
    const mockCheckPermissions = vi.fn().mockResolvedValue({ camera: 'granted' });
    vi.mocked(Camera.checkPermissions).mockImplementation(mockCheckPermissions);

    const { requestPermission } = useCamera();
    await requestPermission();

    expect(mockCheckPermissions).toHaveBeenCalled();
  });
});
```

```typescript
// tests/native/camera.spec.ts (Native test - real behavior)
describe('Camera Plugin (Native)', () => {
  it('should capture photo from camera', async () => {
    await $('~Scan receipt').click();
    await $('~Take photo').click();

    // Native camera opens
    // Tap shutter button (platform-specific)
    if (browser.isIOS) {
      await $('~PhotoCapture').click();
    } else {
      await $('com.android.camera2:id/shutter_button').click();
    }

    // Photo should appear in app
    const photo = await $('~Receipt photo');
    await expect(photo).toBeDisplayed();
  });
});
```

---

## 3. Test Execution Strategy

### Local Development

```bash
# Fast: Unit tests (business logic)
npm test

# Medium: Mobile web tests (most UI scenarios)
npm run test:e2e -- --project="Mobile Safari"

# Slow: Native tests (native features only)
npm run test:native:ios
```

### Pre-Release Testing

```bash
# 1. All unit tests
npm test -- --run

# 2. Mobile web E2E (all scenarios)
npm run test:e2e -- --project="Mobile Safari" --project="Mobile Chrome"

# 3. Native E2E (critical flows)
npm run test:native

# 4. Manual testing on real devices (1-2 hours)
# - Install TestFlight build (iOS)
# - Install APK (Android)
# - Run through critical user flows
```

### CI/CD Pipeline

```yaml
# .github/workflows/mobile-test.yml
name: Mobile Tests

on: [push, pull_request]

jobs:
  mobile-web-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e -- --project="Mobile Safari" --project="Mobile Chrome"

  ios-native-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run cap:build:ios
      - run: npm run test:native:ios

  android-native-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run cap:build:android
      - run: npm run test:native:android
```

---

## 4. Mobile-Specific Test Scenarios

### From Your QA Plan - Mobile Adaptations

| Desktop Test Scenario | Mobile Adaptation | Test Type |
|----------------------|-------------------|-----------|
| Click FAB button | Tap FAB button, verify touch target size | Mobile Web E2E |
| ESC closes modal | Swipe down closes modal | Mobile Web E2E |
| Backdrop click closes modal | Tap outside modal closes | Mobile Web E2E |
| Sidebar navigation | Bottom tab navigation | Mobile Web E2E |
| Hover effects | Long-press or tap feedback | Mobile Web E2E |
| Voice input via browser | Voice input via native speech API | Native E2E |
| Barcode scanner (browser) | Camera-based barcode scan | Native E2E |
| Browser notifications | Native push notifications | Native E2E |
| File upload | Camera + photo library access | Native E2E |

---

## 5. Cloud Device Testing (Optional but Recommended)

For broader device coverage without buying 50 phones:

### BrowserStack

```bash
npm install --save-dev browserstack-local

# Run on real iOS devices
npm run test:browserstack:ios

# Run on real Android devices
npm run test:browserstack:android
```

**Covers**:
- 100+ real iOS devices (iPhone 15, 14, 13, SE, etc.)
- 100+ real Android devices (Samsung, Pixel, OnePlus, etc.)
- Different OS versions
- Different screen sizes

### Sauce Labs

Similar to BrowserStack, good for parallel testing.

---

## 6. Platform-Specific Considerations

### iOS-Specific Tests

```typescript
test.describe('iOS Specific', () => {
  test.use({ ...devices['iPhone 13'] });

  test('should show iOS-style modals', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /add task/i }).click();

    const modal = page.getByRole('dialog');

    // iOS modals slide from bottom
    await expect(modal).toHaveCSS('border-radius', '24px 24px 0px 0px');
  });

  test('should use iOS date picker', async ({ page }) => {
    await page.goto('/todos');
    await page.getByRole('textbox', { name: /due date/i }).click();

    // iOS native date picker should appear
    const datePicker = page.locator('[type="date"]');
    await expect(datePicker).toBeVisible();
  });

  test('should support safe area insets', async ({ page }) => {
    await page.goto('/');

    // Check notch/island spacing
    const header = page.getByRole('banner');
    const paddingTop = await header.evaluate(el =>
      window.getComputedStyle(el).paddingTop
    );

    // Should have safe area spacing on devices with notch
    expect(parseInt(paddingTop)).toBeGreaterThanOrEqual(44);
  });
});
```

### Android-Specific Tests

```typescript
test.describe('Android Specific', () => {
  test.use({ ...devices['Pixel 5'] });

  test('should handle Android back button', async ({ page }) => {
    await page.goto('/todos');
    await page.getByRole('button', { name: /add task/i }).click();

    // Modal opens
    await expect(page.getByRole('dialog')).toBeVisible();

    // Simulate Android back button
    await page.keyboard.press('Escape'); // Or use Appium's back button

    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should use Android Material design', async ({ page }) => {
    await page.goto('/');

    const button = page.getByRole('button').first();
    const borderRadius = await button.evaluate(el =>
      window.getComputedStyle(el).borderRadius
    );

    // Android buttons typically have smaller radius than iOS
    expect(parseInt(borderRadius)).toBeLessThan(12);
  });
});
```

---

## 7. Package.json Scripts for Mobile Testing

Add to `package.json`:

```json
{
  "scripts": {
    // Mobile web tests (Playwright)
    "test:mobile:web": "playwright test --project='Mobile Safari' --project='Mobile Chrome'",
    "test:mobile:ios-web": "playwright test --project='Mobile Safari'",
    "test:mobile:android-web": "playwright test --project='Mobile Chrome'",

    // Native tests (Appium)
    "test:native": "wdio run tests/native/wdio.conf.ts",
    "test:native:ios": "wdio run tests/native/wdio.conf.ts --spec tests/native/**/*.ios.spec.ts",
    "test:native:android": "wdio run tests/native/wdio.conf.ts --spec tests/native/**/*.android.spec.ts",

    // Cloud testing
    "test:browserstack": "wdio run tests/browserstack.conf.ts",
    "test:saucelabs": "wdio run tests/saucelabs.conf.ts",

    // Full mobile test suite
    "test:mobile:all": "npm run test:mobile:web && npm run test:native",

    // Build for testing
    "test:mobile:prepare": "npm run build && npm run cap:sync"
  }
}
```

---

## 8. Test Data Cleanup on Mobile

Mobile apps maintain local state - ensure cleanup:

```typescript
// tests/mobile/fixtures/cleanup.ts
import { browser } from '@wdio/globals';

export async function clearAppData() {
  if (browser.isIOS) {
    // Reset iOS app
    await browser.reset();
  } else if (browser.isAndroid) {
    // Clear Android app data
    await browser.execute('mobile: clearApp', {
      appId: 'com.lifesync.app',
    });
  }
}

export async function clearCache() {
  // Clear web cache (works in mobile browser)
  await browser.execute(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
```

---

## 9. Mobile Test Checklist

### Before Each Release

#### Automated Tests ✅
- [ ] Run all unit tests (`npm test`)
- [ ] Run mobile web E2E tests (`npm run test:mobile:web`)
- [ ] Run native E2E tests (`npm run test:native`)
- [ ] Check test coverage (`npm run test:coverage`)

#### Manual Testing on Real Devices
##### iOS (iPhone)
- [ ] Install TestFlight build
- [ ] Test critical flows (create task, habit, note)
- [ ] Test camera/barcode scanner
- [ ] Test push notifications
- [ ] Test biometric auth (Face ID)
- [ ] Check performance (no lag, no crashes)
- [ ] Verify safe area insets (notch/island)

##### Android (Pixel/Samsung)
- [ ] Install APK
- [ ] Test critical flows (create task, habit, note)
- [ ] Test camera/barcode scanner
- [ ] Test push notifications
- [ ] Test fingerprint auth
- [ ] Check performance (no lag, no crashes)
- [ ] Test back button behavior

---

## 10. Troubleshooting

### "Appium can't find element"

**Solution**: Use accessibility IDs instead of XPath:

```typescript
// ❌ Fragile
await $('//XCUIElementTypeButton[@name="Add Task"]');

// ✅ Reliable
await $('~Add Task'); // Accessibility ID
```

### "Tests pass in browser but fail on native"

**Solution**: Check for browser API usage:

```typescript
// ❌ Won't work on native
navigator.clipboard.writeText('...');

// ✅ Use Capacitor plugin
import { Clipboard } from '@capacitor/clipboard';
await Clipboard.write({ string: '...' });
```

### "iOS Simulator not found"

```bash
# List available simulators
xcrun simctl list devices

# Create new simulator
xcrun simctl create "iPhone 15" "iPhone 15" "iOS17.0"
```

### "Android Emulator not starting"

```bash
# List AVDs
emulator -list-avds

# Start emulator
emulator -avd Pixel_7_API_34
```

---

## 11. Summary: Testing Efficiency

### Time Investment vs Coverage

| Approach | Setup Time | Execution Time | Coverage |
|----------|------------|----------------|----------|
| **Mobile Web E2E** (Playwright) | 1 hour | 5-10 min | 90% |
| **Native E2E** (Appium) | 4-8 hours | 15-30 min | 10% (native-only) |
| **Manual Testing** | 0 | 1-2 hours | Final validation |

**Recommended Strategy**:
1. ✅ Use **Mobile Web E2E** for 90% of testing (fastest, easiest)
2. ✅ Use **Native E2E** only for platform-specific features
3. ✅ Use **Manual Testing** for final polish and edge cases

---

## 12. Next Steps

### Week 1: Setup
- [ ] Configure Playwright for mobile browsers
- [ ] Write first mobile web E2E test
- [ ] Test on iOS Safari and Android Chrome

### Week 2: Mobile Web Tests
- [ ] Port desktop E2E tests to mobile
- [ ] Add mobile-specific tests (swipe, touch, etc.)
- [ ] Verify responsive layouts

### Week 3: Native Setup
- [ ] Install Appium
- [ ] Configure WebDriverIO
- [ ] Set up iOS Simulator and Android Emulator

### Week 4: Native Tests
- [ ] Write tests for push notifications
- [ ] Write tests for camera features
- [ ] Write tests for biometric auth

### Week 5: Integration
- [ ] Add mobile tests to CI/CD
- [ ] Set up cloud testing (optional)
- [ ] Document test procedures

---

**Last Updated**: February 23, 2026
**Status**: ✅ Ready to implement
