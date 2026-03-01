import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Check if we're already logged in
  const isLoggedIn = await page.locator('[data-testid="nav-shopping"]').isVisible().catch(() => false);

  if (isLoggedIn) {
    // Already logged in, save the state
    await page.context().storageState({ path: authFile });
    return;
  }

  // Look for email input (login form)
  const emailInput = page.locator('input[type="email"]').or(
    page.getByPlaceholder(/email/i)
  ).first();

  await expect(emailInput).toBeVisible({ timeout: 10000 });

  // Fill in test credentials
  await emailInput.fill('test1@lifesync.app');

  const passwordInput = page.locator('input[type="password"]').or(
    page.getByPlaceholder(/password/i)
  ).first();

  await passwordInput.fill('TestAccount123!');

  // Click sign in button
  const signInButton = page.getByRole('button', { name: /sign in/i });
  await signInButton.click();

  // Wait for successful login (navigation to dashboard or any protected route)
  await page.waitForLoadState('domcontentloaded');

  // Verify we're logged in by checking for navigation elements
  const navElement = page.locator('[data-testid="nav-shopping"]').or(
    page.getByText('Shopping').or(page.locator('nav'))
  ).first();

  await expect(navElement).toBeVisible({ timeout: 15000 });

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});
