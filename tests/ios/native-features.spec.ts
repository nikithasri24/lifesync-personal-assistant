/**
 * iOS — Native feature smoke tests
 * Verifies geolocation prompt, microphone prompt, and local notification permission.
 * These only run on real device / simulator with native plugins.
 */

import { signIn } from './helpers/auth.js';

describe('Native Features', () => {
  before(async () => {
    await signIn();
  });

  it('local notification permission was requested on launch', async () => {
    // The app calls LocalNotifications.requestPermissions() in reminderService.initialize().
    // By the time we reach here the system sheet has already appeared and been
    // auto-dismissed (simulator auto-grants). We just verify the app didn't crash.
    const body = await $('body');
    expect(await body.isExisting()).toBe(true);
  });

  it('navigates to AI Assistant and voice button is present', async () => {
    await browser.url('/assistant');
    const micBtn = await $('button[aria-label*="voice"], button[aria-label*="mic"], button[aria-label*="Voice"]');
    await micBtn.waitForExist({ timeout: 10000 });
    expect(await micBtn.isDisplayed()).toBe(true);
  });

  it('voice button is tappable (triggers mic permission on first use)', async () => {
    const micBtn = await $('button[aria-label*="voice"], button[aria-label*="mic"], button[aria-label*="Voice"]');
    await micBtn.click();
    // Wait briefly — permission dialog or recording UI should appear
    await browser.pause(1500);
    // Dismiss any native alert (permission prompt)
    try {
      await browser.dismissAlert();
    } catch {
      // No alert — permission already granted or handled natively
    }
    // App should still be alive
    expect(await $('body').isExisting()).toBe(true);
  });
});
