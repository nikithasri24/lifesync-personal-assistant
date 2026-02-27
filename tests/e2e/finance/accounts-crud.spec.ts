/**
 * Comprehensive Finance Accounts CRUD Tests
 *
 * Tests all Create, Read, Update, Delete operations for finance accounts
 * including various account types and edge cases.
 */

import { test, expect } from '@playwright/test';

test.describe('Finance Accounts - Create Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    // Close mobile sidebar if open
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test('create checking account with basic info', async ({ page }) => {
    const accountName = `Checking ${Date.now()}`;

    // Click Add Account button
    await page.getByRole('button', { name: /add account/i }).first().click();
    await page.waitForTimeout(500);

    // Fill account name
    await page.locator('#account-name').fill(accountName);

    // Select account type (should default to checking)
    const typeSelect = page.locator('#account-type');
    await expect(typeSelect).toHaveValue('checking');

    // Enter balance
    await page.locator('#account-balance').fill('1000');

    // Submit form
    await page.getByRole('button', { name: /add account/i }).last().click();
    await page.waitForTimeout(1000);

    // Verify account appears in list
    await expect(page.getByText(accountName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('$1,000')).toBeVisible();
  });

  test('create savings account', async ({ page }) => {
    const accountName = `Savings ${Date.now()}`;

    await page.getByRole('button', { name: /add account/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#account-name').fill(accountName);
    await page.locator('#account-type').selectOption('savings');
    await page.locator('#account-balance').fill('5000');

    await page.getByRole('button', { name: /add account/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(accountName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('$5,000')).toBeVisible();
  });

  test('create credit card with limit and APR', async ({ page }) => {
    const accountName = `Credit Card ${Date.now()}`;

    await page.getByRole('button', { name: /add account/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#account-name').fill(accountName);
    await page.locator('#account-type').selectOption('credit');
    await page.locator('#account-balance').fill('-500'); // Negative for credit balance

    // Credit card specific fields should appear
    await page.waitForTimeout(300);

    const creditLimitField = page.locator('#account-credit-limit');
    if (await creditLimitField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await creditLimitField.fill('5000');

      const aprField = page.locator('#account-apr');
      if (await aprField.isVisible({ timeout: 1000 }).catch(() => false)) {
        await aprField.fill('18.99');
      }
    }

    await page.getByRole('button', { name: /add account/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(accountName)).toBeVisible({ timeout: 5000 });
  });

  test('create investment account', async ({ page }) => {
    const accountName = `Brokerage ${Date.now()}`;

    await page.getByRole('button', { name: /add account/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#account-name').fill(accountName);
    await page.locator('#account-type').selectOption('brokerage');
    await page.locator('#account-balance').fill('25000.50');

    await page.getByRole('button', { name: /add account/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(accountName)).toBeVisible({ timeout: 5000 });
  });

  test('create account with notes', async ({ page }) => {
    const accountName = `Checking with Notes ${Date.now()}`;

    await page.getByRole('button', { name: /add account/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#account-name').fill(accountName);
    await page.locator('#account-balance').fill('2500');

    const notesField = page.locator('#account-notes');
    if (await notesField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await notesField.fill('Primary checking account for bills');
    }

    await page.getByRole('button', { name: /add account/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(accountName)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Finance Accounts - Update Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test('update account name', async ({ page }) => {
    // First create an account
    const originalName = `Account ${Date.now()}`;
    const updatedName = `Updated ${Date.now()}`;

    await page.getByRole('button', { name: /add account/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#account-name').fill(originalName);
    await page.locator('#account-balance').fill('1000');
    await page.getByRole('button', { name: /add account/i }).last().click();
    await page.waitForTimeout(1000);

    // Click on the account to edit
    await page.getByText(originalName).click();
    await page.waitForTimeout(500);

    // Update the name
    await page.locator('#account-name').clear();
    await page.locator('#account-name').fill(updatedName);
    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    // Verify updated name appears
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(originalName)).not.toBeVisible();
  });

  test('update account balance', async ({ page }) => {
    const accountName = `Balance Update ${Date.now()}`;

    // Create account
    await page.getByRole('button', { name: /add account/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#account-name').fill(accountName);
    await page.locator('#account-balance').fill('1000');
    await page.getByRole('button', { name: /add account/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit account
    await page.getByText(accountName).click();
    await page.waitForTimeout(500);

    await page.locator('#account-balance').clear();
    await page.locator('#account-balance').fill('2500');
    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    // Verify new balance
    await expect(page.getByText('$2,500')).toBeVisible({ timeout: 5000 });
  });

  test('change account type', async ({ page }) => {
    const accountName = `Type Change ${Date.now()}`;

    // Create checking account
    await page.getByRole('button', { name: /add account/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#account-name').fill(accountName);
    await page.locator('#account-type').selectOption('checking');
    await page.locator('#account-balance').fill('1000');
    await page.getByRole('button', { name: /add account/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit to change to savings
    await page.getByText(accountName).click();
    await page.waitForTimeout(500);

    await page.locator('#account-type').selectOption('savings');
    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    // Verify account still exists (type change might show different icon)
    await expect(page.getByText(accountName)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Finance Accounts - Delete Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test('delete account', async ({ page }) => {
    const accountName = `Delete Me ${Date.now()}`;

    // Create account
    await page.getByRole('button', { name: /add account/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#account-name').fill(accountName);
    await page.locator('#account-balance').fill('1000');
    await page.getByRole('button', { name: /add account/i }).last().click();
    await page.waitForTimeout(1000);

    // Click on account to open details/edit
    await page.getByText(accountName).click();
    await page.waitForTimeout(500);

    // Look for delete button
    const deleteButton = page.getByRole('button', { name: /delete/i }).or(
      page.locator('button').filter({ hasText: /delete/i })
    );

    if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteButton.click();
      await page.waitForTimeout(300);

      // Confirm deletion if there's a confirmation dialog
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i }).last();
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      await page.waitForTimeout(1000);

      // Verify account no longer appears
      await expect(page.getByText(accountName)).not.toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Finance Accounts - Display & Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test('display multiple accounts with different types', async ({ page }) => {
    const timestamp = Date.now();
    const accounts = [
      { name: `Checking ${timestamp}`, type: 'checking', balance: '1000' },
      { name: `Savings ${timestamp}`, type: 'savings', balance: '5000' },
      { name: `Credit ${timestamp}`, type: 'credit', balance: '-500' },
    ];

    // Create multiple accounts
    for (const account of accounts) {
      await page.getByRole('button', { name: /add account/i }).first().click();
      await page.waitForTimeout(500);

      await page.locator('#account-name').fill(account.name);
      await page.locator('#account-type').selectOption(account.type);
      await page.locator('#account-balance').fill(account.balance);

      await page.getByRole('button', { name: /add account/i }).last().click();
      await page.waitForTimeout(800);
    }

    // Verify all accounts are displayed
    for (const account of accounts) {
      await expect(page.getByText(account.name)).toBeVisible({ timeout: 5000 });
    }
  });

  test('account displays correct currency formatting', async ({ page }) => {
    const accountName = `Format Test ${Date.now()}`;

    await page.getByRole('button', { name: /add account/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#account-name').fill(accountName);
    await page.locator('#account-balance').fill('1234.56');

    await page.getByRole('button', { name: /add account/i }).last().click();
    await page.waitForTimeout(1000);

    // Verify proper currency formatting (should show $1,234.56 or $1,235 depending on format)
    await expect(page.getByText(accountName)).toBeVisible({ timeout: 5000 });
    const balanceText = await page.locator('text=/\\$1,?23[45]/').first();
    await expect(balanceText).toBeVisible({ timeout: 3000 });
  });
});

test.describe('Finance Accounts - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test('create account with zero balance', async ({ page }) => {
    const accountName = `Zero Balance ${Date.now()}`;

    await page.getByRole('button', { name: /add account/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#account-name').fill(accountName);
    await page.locator('#account-balance').fill('0');

    await page.getByRole('button', { name: /add account/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(accountName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('$0')).toBeVisible();
  });

  test('create account with negative balance', async ({ page }) => {
    const accountName = `Negative ${Date.now()}`;

    await page.getByRole('button', { name: /add account/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#account-name').fill(accountName);
    await page.locator('#account-balance').fill('-100');

    await page.getByRole('button', { name: /add account/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(accountName)).toBeVisible({ timeout: 5000 });
  });

  test('create account with very large balance', async ({ page }) => {
    const accountName = `Large Balance ${Date.now()}`;

    await page.getByRole('button', { name: /add account/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#account-name').fill(accountName);
    await page.locator('#account-balance').fill('1000000');

    await page.getByRole('button', { name: /add account/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(accountName)).toBeVisible({ timeout: 5000 });
  });

  test('create account with long name', async ({ page }) => {
    const accountName = `Very Long Account Name That Should Still Work ${Date.now()}`;

    await page.getByRole('button', { name: /add account/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#account-name').fill(accountName);
    await page.locator('#account-balance').fill('1000');

    await page.getByRole('button', { name: /add account/i }).last().click();
    await page.waitForTimeout(1000);

    // Name might be truncated in display, but should still be created
    const shortName = accountName.substring(0, 30);
    await expect(page.getByText(new RegExp(shortName))).toBeVisible({ timeout: 5000 });
  });
});
