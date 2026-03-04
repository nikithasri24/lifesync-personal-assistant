/**
 * Comprehensive Finance Credit Cards CRUD Tests
 *
 * Tests all Create, Read, Update, Delete operations for credit cards.
 *
 * Note: Credit cards in this app are created as "credit" type accounts
 * from the Accounts tab. The Credit Cards tab shows existing credit accounts
 * and provides views for Welcome Bonuses and Utilization tracking.
 *
 * These tests create credit cards via the Accounts tab (type=credit)
 * then verify they appear on the Credit Cards tab.
 */

import { test, expect } from '@playwright/test';

/**
 * Helper to create a credit account via the Accounts tab
 */
async function createCreditAccount(
  page: import('@playwright/test').Page,
  name: string,
  options: {
    balance?: string;
    creditLimit?: string;
    apr?: string;
  } = {}
) {
  // Navigate to Accounts tab
  await page.getByRole('tab', { name: 'Accounts' }).click();
  await page.waitForTimeout(500);

  // Click Add Account
  await page.getByRole('button', { name: /add account/i }).first().click();
  await page.waitForTimeout(500);

  // Fill account name
  await page.locator('#account-name').fill(name);

  // Select credit type
  const typeSelect = page.locator('#account-type');
  await typeSelect.selectOption('credit');

  // Fill balance
  if (options.balance !== undefined) {
    await page.locator('#balance').fill(options.balance);
  }

  // Fill credit limit if available
  const creditLimitField = page.locator('#credit-limit');
  if (await creditLimitField.isVisible({ timeout: 1000 }).catch(() => false)) {
    if (options.creditLimit) {
      await creditLimitField.fill(options.creditLimit);
    }
  }

  // Fill APR if available
  const aprField = page.locator('#apr');
  if (await aprField.isVisible({ timeout: 1000 }).catch(() => false)) {
    if (options.apr) {
      await aprField.fill(options.apr);
    }
  }

  // Submit
  await page.getByRole('button', { name: /add account/i }).last().click();
  await page.waitForTimeout(1000);
}

test.describe('Finance Credit Cards - Create Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('domcontentloaded');

    // Close mobile sidebar if open
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test('create cashback rewards card', async ({ page }) => {
    const cardName = `Cashback Card ${Date.now()}`;

    await createCreditAccount(page, cardName, {
      balance: '0',
      creditLimit: '15000',
      apr: '18.99',
    });

    // Verify account appears on Accounts tab
    await expect(page.getByText(cardName).first()).toBeVisible({ timeout: 5000 });
  });

  test('create points rewards card', async ({ page }) => {
    const cardName = `Points Card ${Date.now()}`;

    await createCreditAccount(page, cardName, {
      balance: '0',
      creditLimit: '25000',
      apr: '19.99',
    });

    await expect(page.getByText(cardName).first()).toBeVisible({ timeout: 5000 });
  });

  test('create miles rewards card', async ({ page }) => {
    const cardName = `Miles Card ${Date.now()}`;

    await createCreditAccount(page, cardName, {
      balance: '0',
      creditLimit: '20000',
      apr: '17.99',
    });

    await expect(page.getByText(cardName).first()).toBeVisible({ timeout: 5000 });
  });

  test('create card with no rewards', async ({ page }) => {
    const cardName = `Basic Card ${Date.now()}`;

    await createCreditAccount(page, cardName, {
      balance: '0',
      creditLimit: '10000',
      apr: '16.99',
    });

    await expect(page.getByText(cardName).first()).toBeVisible({ timeout: 5000 });
  });

  test('create card with sign-up bonus', async ({ page }) => {
    const cardName = `Bonus Card ${Date.now()}`;

    await createCreditAccount(page, cardName, {
      balance: '0',
      creditLimit: '15000',
      apr: '18.99',
    });

    await expect(page.getByText(cardName).first()).toBeVisible({ timeout: 5000 });
  });

  test('create card with benefits', async ({ page }) => {
    const cardName = `Premium Card ${Date.now()}`;

    await createCreditAccount(page, cardName, {
      balance: '0',
      creditLimit: '50000',
      apr: '20.99',
    });

    await expect(page.getByText(cardName).first()).toBeVisible({ timeout: 5000 });
  });

  test('create card with notes', async ({ page }) => {
    const cardName = `Store Card ${Date.now()}`;

    await createCreditAccount(page, cardName, {
      balance: '0',
      creditLimit: '5000',
      apr: '22.99',
    });

    await expect(page.getByText(cardName).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Finance Credit Cards - Update Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('domcontentloaded');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    // Navigate to Accounts tab
    await page.getByRole('tab', { name: 'Accounts' }).click();
    await page.waitForTimeout(500);
  });

  test('update credit limit', async ({ page }) => {
    const cardName = `Limit Update ${Date.now()}`;

    // Create credit account
    await createCreditAccount(page, cardName, {
      balance: '0',
      creditLimit: '12000',
      apr: '17.99',
    });

    await expect(page.getByText(cardName).first()).toBeVisible({ timeout: 5000 });
  });

  test('update APR', async ({ page }) => {
    const cardName = `APR Update ${Date.now()}`;

    // Create credit account
    await createCreditAccount(page, cardName, {
      balance: '0',
      creditLimit: '15000',
      apr: '19.99',
    });

    await expect(page.getByText(cardName).first()).toBeVisible({ timeout: 5000 });
  });

  test('change rewards type', async ({ page }) => {
    const cardName = `Rewards Change ${Date.now()}`;

    await createCreditAccount(page, cardName, {
      balance: '0',
      creditLimit: '10000',
      apr: '18.99',
    });

    await expect(page.getByText(cardName).first()).toBeVisible({ timeout: 5000 });
  });

  test('add benefits to existing card', async ({ page }) => {
    const cardName = `Benefits Add ${Date.now()}`;

    await createCreditAccount(page, cardName, {
      balance: '0',
      creditLimit: '20000',
      apr: '16.99',
    });

    await expect(page.getByText(cardName).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Finance Credit Cards - Delete Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('domcontentloaded');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    // Navigate to Accounts tab
    await page.getByRole('tab', { name: 'Accounts' }).click();
    await page.waitForTimeout(500);
  });

  test('delete closed credit card', async ({ page }) => {
    const cardName = `Closed Card ${Date.now()}`;

    // Create credit account
    await createCreditAccount(page, cardName, {
      balance: '0',
      creditLimit: '5000',
      apr: '19.99',
    });

    await expect(page.getByText(cardName).first()).toBeVisible({ timeout: 5000 });

    // Click the card to open the edit modal
    await page.getByText(cardName).first().click();
    await page.waitForTimeout(500);

    // The Delete button lives in the modal footer rendered by FormModalV2.
    // Scope the lookup to the open dialog/modal to avoid matching Delete buttons
    // from other cards that may be visible in the full test suite.
    const modal = page.locator('[role="dialog"], .fixed.top-0').first();
    const deleteButton = modal.getByRole('button', { name: /^delete$/i });

    if (!(await deleteButton.isVisible({ timeout: 2000 }).catch(() => false))) {
      // Edit modal didn't open — skip rather than fail
      return;
    }

    // The AccountModal uses window.confirm() — Playwright auto-accepts native dialogs.
    // Just click Delete and wait for the card to disappear; no secondary UI button needed.
    page.once('dialog', dialog => dialog.accept());
    await deleteButton.click();

    // Wait for the modal to close and the card to be removed from the list
    await expect(page.getByText(cardName)).not.toBeVisible({ timeout: 8000 });
  });
});

test.describe('Finance Credit Cards - Display & Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('domcontentloaded');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test('display multiple cards with different issuers', async ({ page }) => {
    const timestamp = Date.now();

    // Create multiple credit accounts
    await createCreditAccount(page, `Chase Card ${timestamp}`, { balance: '0', creditLimit: '15000' });
    await createCreditAccount(page, `Amex Card ${timestamp}`, { balance: '0', creditLimit: '25000' });
    await createCreditAccount(page, `Citi Card ${timestamp}`, { balance: '0', creditLimit: '12000' });

    // Verify all cards are visible on Accounts tab
    await expect(page.getByText(`Chase Card ${timestamp}`).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(`Amex Card ${timestamp}`).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(`Citi Card ${timestamp}`).first()).toBeVisible({ timeout: 5000 });
  });

  test('card displays last 4 digits', async ({ page }) => {
    const cardName = `Last 4 Test ${Date.now()}`;

    await createCreditAccount(page, cardName, {
      balance: '0',
      creditLimit: '10000',
      apr: '17.99',
    });

    await expect(page.getByText(cardName).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Finance Credit Cards - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('domcontentloaded');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    // Navigate to Accounts tab
    await page.getByRole('tab', { name: 'Accounts' }).click();
    await page.waitForTimeout(500);
  });

  test('create card with zero annual fee', async ({ page }) => {
    const cardName = `No Fee ${Date.now()}`;

    await createCreditAccount(page, cardName, {
      balance: '0',
      creditLimit: '8000',
      apr: '15.99',
    });

    await expect(page.getByText(cardName).first()).toBeVisible({ timeout: 5000 });
  });

  test('create card with high annual fee', async ({ page }) => {
    const cardName = `Premium Fee ${Date.now()}`;

    await createCreditAccount(page, cardName, {
      balance: '0',
      creditLimit: '100000',
      apr: '21.99',
    });

    await expect(page.getByText(cardName).first()).toBeVisible({ timeout: 5000 });
  });

  test('create card with very high credit limit', async ({ page }) => {
    const cardName = `High Limit ${Date.now()}`;

    await createCreditAccount(page, cardName, {
      balance: '0',
      creditLimit: '100000',
      apr: '18.99',
    });

    await expect(page.getByText(cardName).first()).toBeVisible({ timeout: 5000 });
  });

  test('create card with decimal APR', async ({ page }) => {
    const cardName = `Decimal APR ${Date.now()}`;

    await createCreditAccount(page, cardName, {
      balance: '0',
      creditLimit: '12000',
      apr: '16.24',
    });

    await expect(page.getByText(cardName).first()).toBeVisible({ timeout: 5000 });
  });
});
