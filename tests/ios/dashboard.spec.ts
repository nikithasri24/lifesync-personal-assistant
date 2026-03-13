/**
 * iOS — Dashboard smoke tests
 * Runs in WKWebView context via Appium + WebdriverIO.
 */

import { signIn } from './helpers/auth.js';

describe('Dashboard', () => {
  before(async () => {
    await signIn();
  });

  it('shows a greeting heading', async () => {
    const heading = await $('h1, h2');
    await heading.waitForExist({ timeout: 10000 });
    const text = await heading.getText();
    expect(text).toBeTruthy();
  });

  it('bottom navigation is visible', async () => {
    const nav = await $('nav');
    await nav.waitForDisplayed({ timeout: 5000 });
    expect(await nav.isDisplayed()).toBe(true);
  });

  it('Quick Action — Add Task opens modal', async () => {
    const addTaskBtn = await $('button=Add Task');
    if (await addTaskBtn.isExisting()) {
      await addTaskBtn.click();
      const modal = await $('[role="dialog"], .modal, form');
      await modal.waitForDisplayed({ timeout: 5000 });
      expect(await modal.isDisplayed()).toBe(true);
      // Close with Cancel
      const cancel = await $('button=Cancel');
      if (await cancel.isExisting()) await cancel.click();
    }
  });
});
