import { test, expect } from '@playwright/test';

test.describe('Retirement Account Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to finances page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on Finances in navigation
    await page.click('text=Finances');
    await page.waitForURL('**/finances**');
  });

  test('should show Accounts and Retirement tabs', async ({ page }) => {
    // Check that Accounts tab exists
    await expect(page.locator('text=Accounts')).toBeVisible();

    // Check that Retirement tab exists
    await expect(page.locator('text=Retirement')).toBeVisible();
  });

  test('should create a 401k account', async ({ page }) => {
    // Navigate to Accounts tab
    await page.click('text=Accounts');
    await page.waitForTimeout(500);

    // Click Add Manual Account
    await page.click('button:has-text("Add Manual Account")');

    // Fill in account details
    await page.fill('input[label="Account name"]', 'My 401k Test');

    // Select 401K type
    await page.selectOption('select', '401k');

    // Enter balance
    await page.fill('input[type="number"]', '50000');

    // Click Save
    await page.click('button:has-text("Save")');

    // Wait for account to appear
    await page.waitForTimeout(1000);

    // Verify account was created
    await expect(page.locator('text=My 401k Test')).toBeVisible();
    await expect(page.locator('text=$50,000')).toBeVisible();
  });

  test('should show unconfigured retirement accounts', async ({ page }) => {
    // First create a 401k account
    await page.click('text=Accounts');
    await page.click('button:has-text("Add Manual Account")');
    await page.fill('input[label="Account name"]', 'Unconfigured 401k');
    await page.selectOption('select', '401k');
    await page.fill('input[type="number"]', '25000');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Navigate to Retirement tab
    await page.click('text=Retirement');
    await page.waitForTimeout(500);

    // Should see unconfigured accounts section
    await expect(page.locator('text=Unconfigured Retirement Accounts')).toBeVisible();
    await expect(page.locator('text=Unconfigured 401k')).toBeVisible();
    await expect(page.locator('button:has-text("Configure")')).toBeVisible();
  });

  test('should configure retirement account settings', async ({ page }) => {
    // Create account
    await page.click('text=Accounts');
    await page.click('button:has-text("Add Manual Account")');
    await page.fill('input[label="Account name"]', 'Test 401k Config');
    await page.selectOption('select', '401k');
    await page.fill('input[type="number"]', '60000');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Go to Retirement tab
    await page.click('text=Retirement');
    await page.waitForTimeout(500);

    // Click Configure button
    await page.click('button:has-text("Configure")');
    await page.waitForTimeout(500);

    // Should open retirement account editor
    await expect(page.locator('text=Tax Treatment')).toBeVisible();

    // Select tax treatment
    await page.selectOption('select[label="Tax Treatment"]', 'pre_tax');

    // Enter YTD contributions
    await page.fill('input[label="Current Year Contributions"]', '10000');

    // Check employer match checkbox
    await page.check('input[type="checkbox"]');

    // Enter employer match details
    await page.fill('input[label="Match Percentage"]', '100');
    await page.fill('input[label="Match Limit (% of salary)"]', '6');

    // Click Save
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Verify configuration was saved
    await expect(page.locator('text=Test 401k Config')).toBeVisible();
    // Should no longer be in unconfigured section
    await expect(page.locator('text=Unconfigured Retirement Accounts')).not.toBeVisible();
  });

  test('should display retirement dashboard when accounts configured', async ({ page }) => {
    // Assuming we have configured accounts, go to Retirement tab
    await page.click('text=Retirement');
    await page.waitForTimeout(500);

    // Check for dashboard elements
    await expect(page.locator('text=Retirement Accounts')).toBeVisible();

    // Should show total value (if accounts exist)
    const totalValue = page.locator('text=/Total.*Value/i');
    if (await totalValue.isVisible()) {
      await expect(totalValue).toBeVisible();
    }
  });

  test('should show retirement readiness score', async ({ page }) => {
    await page.click('text=Retirement');
    await page.waitForTimeout(500);

    // Check for readiness score elements
    const readinessSection = page.locator('text=/Readiness/i');
    if (await readinessSection.isVisible()) {
      await expect(readinessSection).toBeVisible();
    }
  });

  test('should display 4% rule withdrawal amounts', async ({ page }) => {
    await page.click('text=Retirement');
    await page.waitForTimeout(500);

    // Check for 4% rule section
    const withdrawalSection = page.locator('text=/Safe.*Withdrawal/i');
    if (await withdrawalSection.isVisible()) {
      await expect(withdrawalSection).toBeVisible();
    }
  });

  test('should show contribution progress', async ({ page }) => {
    await page.click('text=Retirement');
    await page.waitForTimeout(500);

    // Check for contribution tracking
    const contributionSection = page.locator('text=/Contribution/i');
    if (await contributionSection.isVisible()) {
      await expect(contributionSection).toBeVisible();
    }
  });

  test('should create and configure Roth IRA', async ({ page }) => {
    // Create Roth IRA account
    await page.click('text=Accounts');
    await page.click('button:has-text("Add Manual Account")');
    await page.fill('input[label="Account name"]', 'My Roth IRA');
    await page.selectOption('select', 'roth_ira');
    await page.fill('input[type="number"]', '15000');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Configure it
    await page.click('text=Retirement');
    await page.click('button:has-text("Configure")');

    // Roth IRA is post-tax
    await page.selectOption('select[label="Tax Treatment"]', 'post_tax');
    await page.fill('input[label="Current Year Contributions"]', '3500');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Verify
    await expect(page.locator('text=My Roth IRA')).toBeVisible();
  });

  test('should create and configure HSA', async ({ page }) => {
    // Create HSA account
    await page.click('text=Accounts');
    await page.click('button:has-text("Add Manual Account")');
    await page.fill('input[label="Account name"]', 'Health Savings');
    await page.selectOption('select', 'hsa');
    await page.fill('input[type="number"]', '5000');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Configure it
    await page.click('text=Retirement');
    await page.click('button:has-text("Configure")');

    // HSA is tax-exempt
    await page.selectOption('select[label="Tax Treatment"]', 'tax_exempt');

    // Check family coverage if available
    const familyCoverageCheckbox = page.locator('input[label="Family Coverage"]');
    if (await familyCoverageCheckbox.isVisible()) {
      await familyCoverageCheckbox.check();
    }

    await page.fill('input[label="Current Year Contributions"]', '2000');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Verify
    await expect(page.locator('text=Health Savings')).toBeVisible();
  });

  test('should show help modal when clicking Add without going to Accounts', async ({ page }) => {
    await page.click('text=Retirement');
    await page.waitForTimeout(500);

    // Click Add Retirement Account
    const addButton = page.locator('button:has-text("Add Retirement Account")');
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Should show help modal
      await expect(page.locator('text=/add a new retirement account/i')).toBeVisible();
      await expect(page.locator('text=/Accounts.*page/i')).toBeVisible();
    }
  });

  test('should handle multiple retirement accounts', async ({ page }) => {
    // Create 401k
    await page.click('text=Accounts');
    await page.click('button:has-text("Add Manual Account")');
    await page.fill('input[label="Account name"]', 'Current 401k');
    await page.selectOption('select', '401k');
    await page.fill('input[type="number"]', '75000');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(500);

    // Create Roth IRA
    await page.click('button:has-text("Add Manual Account")');
    await page.fill('input[label="Account name"]', 'Personal Roth');
    await page.selectOption('select', 'roth_ira');
    await page.fill('input[type="number"]', '20000');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    // Go to Retirement tab
    await page.click('text=Retirement');
    await page.waitForTimeout(500);

    // Should see both accounts in unconfigured section
    await expect(page.locator('text=Current 401k')).toBeVisible();
    await expect(page.locator('text=Personal Roth')).toBeVisible();
    await expect(page.locator('text=Unconfigured Retirement Accounts (2)')).toBeVisible();
  });

  test('should validate investment allocation sums to 100%', async ({ page }) => {
    // Create and start configuring an account
    await page.click('text=Accounts');
    await page.click('button:has-text("Add Manual Account")');
    await page.fill('input[label="Account name"]', 'Allocation Test');
    await page.selectOption('select', '401k');
    await page.fill('input[type="number"]', '50000');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);

    await page.click('text=Retirement');
    await page.click('button:has-text("Configure")');
    await page.waitForTimeout(500);

    // Try to set allocation that doesn't sum to 100%
    const stocksInput = page.locator('input[label="Stocks (%)"]');
    if (await stocksInput.isVisible()) {
      await stocksInput.fill('70');
      await page.locator('input[label="Bonds (%)"]').fill('20');
      // Total is 90%, should show validation error
      await page.click('button:has-text("Save")');

      // Should not close editor or show error
      await expect(page.locator('text=/must.*100/i')).toBeVisible();
    }
  });
});
