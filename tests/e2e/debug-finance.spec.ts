import { test, expect } from '@playwright/test';

test('debug finance page loading', async ({ page }) => {
  console.log('=== Starting Finance debug test ===');

  await page.goto('/finances');
  await page.waitForLoadState('networkidle');
  console.log('Page loaded, URL:', page.url());

  // Take screenshot of initial state
  await page.screenshot({ path: 'test-results/finance-debug-1-initial.png' });

  // Check page title and heading
  const title = await page.title();
  console.log('Page title:', title);

  // Check for main content
  const headings = await page.locator('h1, h2, h3').allTextContents();
  console.log('Headings on page:', headings);

  // Check for tab buttons
  const allButtons = await page.locator('button').allTextContents();
  console.log('All button texts:', allButtons.slice(0, 20));

  // Check what role the Accounts button actually has
  const accountsButton = page.locator('button').filter({ hasText: 'Accounts' }).first();
  const role = await accountsButton.getAttribute('role');
  const ariaLabel = await accountsButton.getAttribute('aria-label');
  const textContent = await accountsButton.textContent();
  console.log('Accounts button role:', role);
  console.log('Accounts button aria-label:', ariaLabel);
  console.log('Accounts button text:', textContent);

  // Try clicking with locator instead
  console.log('Clicking Accounts tab with locator...');
  await accountsButton.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/finance-debug-2-after-accounts-click.png' });

  // Try to find Add Account button with getByRole (exact selector from tests)
  console.log('Looking for Add Account button with getByRole...');
  const addAccountByRole = page.getByRole('button', { name: /add account/i });
  const addAccountCount = await addAccountByRole.count();
  console.log('getByRole Add Account count:', addAccountCount);

  if (addAccountCount > 0) {
    const isVisible = await addAccountByRole.first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log('getByRole Add Account visible:', isVisible);

    if (isVisible) {
      console.log('SUCCESS: Found Add Account button with getByRole!');
      await addAccountByRole.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/finance-debug-3-after-add-click.png' });

      // Check if modal opened
      const modalVisible = await page.locator('#account-name').isVisible({ timeout: 3000 }).catch(() => false);
      console.log('Modal opened (account-name field visible):', modalVisible);
    } else {
      console.log('ISSUE: getByRole found button but it is not visible');
    }
  } else {
    console.log('ISSUE: getByRole could not find Add Account button');

    // Fallback: try with locator
    const addByLocator = await page.locator('button:has-text("Add Account")').count();
    console.log('Fallback locator found:', addByLocator, 'Add Account buttons');
  }

  await page.screenshot({ path: 'test-results/finance-debug-3-final.png' });
  console.log('=== Debug test complete ===');
});
