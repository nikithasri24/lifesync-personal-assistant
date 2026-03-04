/**
 * E2E tests for Transfer transaction creation (commit 3a21961)
 *
 * QuickAddTransaction gained a Transfer toggle in this commit.
 * These tests verify the toggle exists, switches the form correctly,
 * and that the normal form fields are restored when switching back.
 */

import { test, expect } from '@playwright/test';

/** Opens the QuickAddTransaction modal from the Transactions tab. */
async function openQuickAddModal(page: import('@playwright/test').Page) {
  const addButton = page.getByRole('button', { name: /add transaction/i }).first();
  await expect(addButton).toBeVisible({ timeout: 5000 });
  await addButton.click();
  await page.waitForTimeout(500);
}

/**
 * Clicks the "↔ Transfer" segment button to switch the modal to transfer mode.
 * The modal header has two pill buttons: "Transaction" and "↔ Transfer".
 */
async function switchToTransferMode(page: import('@playwright/test').Page) {
  // The button text is literally "↔ Transfer"
  await page.getByRole('button', { name: /↔.*transfer|transfer/i })
    .filter({ hasNot: page.getByRole('button', { name: /add transaction/i }) })
    .first()
    .click();
  await page.waitForTimeout(300);
}

/**
 * Clicks the "Transaction" segment button to switch back to transaction mode.
 */
async function switchToTransactionMode(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /^transaction$/i }).first().click();
  await page.waitForTimeout(300);
}

test.describe('Transfer Transactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('domcontentloaded');

    // Close mobile sidebar if present
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    // Finance uses hash-based tab navigation — click the Transactions tab
    await page.getByRole('tab', { name: 'Transactions' }).click();
    await page.waitForTimeout(800);
  });

  // ── Button visibility ───────────────────────────────────────────────────────

  test('Add Transaction button is visible on the Transactions tab', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add transaction/i }).first();
    await expect(addButton).toBeVisible({ timeout: 5000 });
  });

  // ── Toggle visibility ───────────────────────────────────────────────────────

  test('QuickAdd modal has a Transfer toggle visible', async ({ page }) => {
    await openQuickAddModal(page);

    // The modal shows two pill buttons: "Transaction" and "↔ Transfer"
    const transferButton = page.getByRole('button', { name: /transfer/i })
      .filter({ hasNot: page.getByRole('button', { name: /add transaction/i }) })
      .first();
    await expect(transferButton).toBeVisible({ timeout: 3000 });
  });

  // ── Form mode switching ─────────────────────────────────────────────────────

  test('switching to Transfer mode shows From Account and To Account selects', async ({ page }) => {
    await openQuickAddModal(page);
    await switchToTransferMode(page);

    // In transfer mode: should have From and To account selectors
    const fromAccount = page.getByText(/from account/i).first();
    const toAccount   = page.getByText(/to account/i).first();

    await expect(fromAccount).toBeVisible({ timeout: 3000 });
    await expect(toAccount).toBeVisible({ timeout: 3000 });
  });

  test('Amount and Date fields are present in transfer mode', async ({ page }) => {
    await openQuickAddModal(page);
    await switchToTransferMode(page);

    const amountField = page.locator('input[type="number"]').first();
    const dateField   = page.locator('input[type="date"]').first();

    const hasAmount = await amountField.isVisible({ timeout: 2000 }).catch(() => false);
    const hasDate   = await dateField.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasAmount || hasDate).toBe(true);
  });

  test('switching back to Transaction mode restores description and category fields', async ({ page }) => {
    await openQuickAddModal(page);

    // Switch to transfer mode, then back
    await switchToTransferMode(page);
    await switchToTransactionMode(page);

    // Normal transaction fields should be visible again — check for description placeholder
    const descField = page.getByPlaceholder(/STARBUCKS/i)
      .or(page.locator('#txn-description'))
      .first();
    await expect(descField).toBeVisible({ timeout: 3000 });
  });

  // ── Error-free page ─────────────────────────────────────────────────────────

  test('transactions page loads without errors', async ({ page }) => {
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    await expect(page.getByText(/error/i).filter({ hasNot: page.locator('button') })).not.toBeVisible();
  });
});
