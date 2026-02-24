/**
 * Test Account Management
 *
 * Provides helper functions for test authentication and account management.
 */

import { Page } from '@playwright/test';

export const TEST_ACCOUNTS = {
  account1: {
    email: process.env.TEST_ACCOUNT_1_EMAIL || 'test1@lifesync.app',
    password: process.env.TEST_ACCOUNT_1_PASSWORD || 'TestAccount123!',
    name: 'Test User 1',
  },
  account2: {
    email: process.env.TEST_ACCOUNT_2_EMAIL || 'test2@lifesync.app',
    password: process.env.TEST_ACCOUNT_2_PASSWORD || 'TestAccount456!',
    name: 'Test User 2',
  },
} as const;

/**
 * Login helper - authenticates a user
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Check if already authenticated by looking for main dashboard content
  const isDashboard = await page.getByRole('heading', { name: /good (morning|afternoon|evening)/i })
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  if (isDashboard) {
    return; // Already logged in
  }

  // Not logged in - fill login form using the exact selectors from error-context
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wait for redirect to dashboard - look for dashboard heading
  await page.waitForURL('/', { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  // Verify we're actually on dashboard
  await page.getByRole('heading', { name: /good (morning|afternoon|evening)/i }).waitFor({ timeout: 5000 });
}

/**
 * Login with Test Account 1
 */
export async function loginAsAccount1(page: Page): Promise<void> {
  const { email, password } = TEST_ACCOUNTS.account1;
  await loginAs(page, email, password);
}

/**
 * Login with Test Account 2
 */
export async function loginAsAccount2(page: Page): Promise<void> {
  const { email, password } = TEST_ACCOUNTS.account2;
  await loginAs(page, email, password);
}

/**
 * Logout helper
 */
export async function logout(page: Page): Promise<void> {
  // Find and click logout button
  const logoutButton = page.getByRole('button', { name: /log.*out/i });
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL('/auth', { timeout: 5000 });
  }
}

/**
 * Create two partner browser contexts for multi-user testing
 */
export async function createPartnerPages(browser: any): Promise<[Page, Page]> {
  // Account 1
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();
  await loginAsAccount1(page1);

  // Account 2
  const context2 = await browser.newContext();
  const page2 = await context2.newPage();
  await loginAsAccount2(page2);

  return [page1, page2];
}

/**
 * Clear all test data for a user
 */
export async function clearTestData(page: Page): Promise<void> {
  // This would call your API or Supabase directly to clean up test data
  // Implementation depends on your cleanup strategy
  console.log('Clearing test data...');
}
