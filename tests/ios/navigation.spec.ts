/**
 * iOS — Bottom navigation smoke tests
 */

import { signIn } from './helpers/auth.js';

const NAV_TABS = [
  { label: 'Tasks', urlFragment: 'todos' },
  { label: 'Habits', urlFragment: 'habits' },
  { label: 'Finance', urlFragment: 'finances' },
  { label: 'Together', urlFragment: 'together' },
];

describe('Bottom Navigation', () => {
  before(async () => {
    await signIn();
  });

  for (const tab of NAV_TABS) {
    it(`navigates to ${tab.label}`, async () => {
      // Find nav link by text or aria-label
      const link = await $(`aria/${tab.label}`) ?? await $(`=${tab.label}`);
      await link.waitForExist({ timeout: 5000 });
      await link.click();

      // Page content loads (any h1/h2 heading)
      const heading = await $('h1, h2');
      await heading.waitForExist({ timeout: 10000 });
      expect(await heading.isDisplayed()).toBe(true);
    });
  }
});
