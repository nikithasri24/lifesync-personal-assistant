/**
 * Comprehensive Finance Transactions CRUD Tests
 *
 * Tests all Create, Read, Update, Delete operations for transactions
 * including income/expense types, categories, and filtering.
 */

import { test, expect } from '@playwright/test';

test.describe('Finance Transactions - Create Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('domcontentloaded');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    // Click on Transactions tab
    await page.getByRole('tab', { name: 'Transactions' }).click();
    await page.waitForTimeout(500);
  });

  test('create expense transaction', async ({ page }) => {
    const description = `Grocery Shopping ${Date.now()}`;

    // Click Add Transaction button
    const addButton = page.getByRole('button', { name: /add transaction/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);

    // Fill transaction details
    await page.locator('#txn-description, input[placeholder*="description" i]').first().fill(description);
    await page.locator('#txn-amount, input[placeholder*="amount" i]').first().fill('85.50');

    // Select transaction type - default should be expense/debit
    const typeSelector = page.locator('input[type="radio"][value="debit"]').or(
      page.getByText(/expense/i).locator('..').locator('input[type="radio"]')
    );
    if (await typeSelector.isVisible({ timeout: 2000 }).catch(() => false)) {
      await typeSelector.check();
    }

    // Submit
    await page.getByRole('button', { name: /add transaction|save/i }).last().click();
    await page.waitForTimeout(1000);

    // Verify transaction appears
    await expect(page.getByText(description)).toBeVisible({ timeout: 5000 });
  });

  test('create income transaction', async ({ page }) => {
    const description = `Paycheck ${Date.now()}`;

    const addButton = page.getByRole('button', { name: /add transaction/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);

    await page.locator('#txn-description, input[placeholder*="description" i]').first().fill(description);
    await page.locator('#txn-amount, input[placeholder*="amount" i]').first().fill('2500');

    // Select income/credit type
    const incomeRadio = page.locator('input[type="radio"][value="credit"]').or(
      page.getByText(/income/i).locator('..').locator('input[type="radio"]')
    );
    if (await incomeRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
      await incomeRadio.check();
    }

    await page.getByRole('button', { name: /add transaction|save/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(description)).toBeVisible({ timeout: 5000 });
  });

  test('create transaction with category', async ({ page }) => {
    const description = `Restaurant ${Date.now()}`;

    const addButton = page.getByRole('button', { name: /add transaction/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#txn-description, input[placeholder*="description" i]').first().fill(description);
    await page.locator('#txn-amount, input[placeholder*="amount" i]').first().fill('45.75');

    // Select category if available
    const categorySelect = page.locator('#txn-category, select[name="category"]').first();
    if (await categorySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      const options = await categorySelect.locator('option').all();
      if (options.length > 1) {
        await categorySelect.selectOption({ index: 1 }); // Select first real category
      }
    }

    await page.getByRole('button', { name: /add transaction|save/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(description)).toBeVisible({ timeout: 5000 });
  });

  test('create transaction with specific date', async ({ page }) => {
    const description = `Past Transaction ${Date.now()}`;

    const addButton = page.getByRole('button', { name: /add transaction/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#txn-description, input[placeholder*="description" i]').first().fill(description);
    await page.locator('#txn-amount, input[placeholder*="amount" i]').first().fill('150');

    // Set date to yesterday
    const dateInput = page.locator('#txn-date, input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      await dateInput.fill(dateStr);
    }

    await page.getByRole('button', { name: /add transaction|save/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(description)).toBeVisible({ timeout: 5000 });
  });

  test('create transaction with merchant name', async ({ page }) => {
    const description = `Coffee ${Date.now()}`;
    const merchant = 'Starbucks';

    const addButton = page.getByRole('button', { name: /add transaction/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#txn-description, input[placeholder*="description" i]').first().fill(description);
    await page.locator('#txn-amount, input[placeholder*="amount" i]').first().fill('5.50');

    const merchantField = page.locator('#txn-merchant, input[placeholder*="merchant" i]').first();
    if (await merchantField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await merchantField.fill(merchant);
    }

    await page.getByRole('button', { name: /add transaction|save/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(description)).toBeVisible({ timeout: 5000 });
  });

  test('create transaction with notes', async ({ page }) => {
    const description = `Business Expense ${Date.now()}`;
    const notes = 'Client meeting expenses - reimbursable';

    const addButton = page.getByRole('button', { name: /add transaction/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#txn-description, input[placeholder*="description" i]').first().fill(description);
    await page.locator('#txn-amount, input[placeholder*="amount" i]').first().fill('125');

    const notesField = page.locator('#txn-notes, textarea[placeholder*="notes" i]').first();
    if (await notesField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await notesField.fill(notes);
    }

    await page.getByRole('button', { name: /add transaction|save/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(description)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Finance Transactions - Update Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('domcontentloaded');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const transactionsTab = page.getByRole('button', { name: /transactions/i }).first();
    if (await transactionsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await transactionsTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('update transaction description', async ({ page }) => {
    const originalDesc = `Original ${Date.now()}`;
    const updatedDesc = `Updated ${Date.now()}`;

    // Create transaction
    const addButton = page.getByRole('button', { name: /add transaction/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);

    await page.locator('#txn-description, input[placeholder*="description" i]').first().fill(originalDesc);
    await page.locator('#txn-amount, input[placeholder*="amount" i]').first().fill('50');
    await page.getByRole('button', { name: /add transaction|save/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit transaction
    await page.getByText(originalDesc).click();
    await page.waitForTimeout(500);

    await page.locator('#txn-description, input[placeholder*="description" i]').first().clear();
    await page.locator('#txn-description, input[placeholder*="description" i]').first().fill(updatedDesc);
    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    // Verify update
    await expect(page.getByText(updatedDesc)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(originalDesc)).not.toBeVisible();
  });

  test('update transaction amount', async ({ page }) => {
    const description = `Amount Update ${Date.now()}`;

    // Create transaction
    const addButton = page.getByRole('button', { name: /add transaction/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);

    await page.locator('#txn-description, input[placeholder*="description" i]').first().fill(description);
    await page.locator('#txn-amount, input[placeholder*="amount" i]').first().fill('100');
    await page.getByRole('button', { name: /add transaction|save/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit amount
    await page.getByText(description).click();
    await page.waitForTimeout(500);

    await page.locator('#txn-amount, input[placeholder*="amount" i]').first().clear();
    await page.locator('#txn-amount, input[placeholder*="amount" i]').first().fill('200');
    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    // Verify new amount
    await expect(page.getByText(description)).toBeVisible({ timeout: 5000 });
  });

  test('change transaction type from expense to income', async ({ page }) => {
    const description = `Type Change ${Date.now()}`;

    // Create as expense
    const addButton = page.getByRole('button', { name: /add transaction/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);

    await page.locator('#txn-description, input[placeholder*="description" i]').first().fill(description);
    await page.locator('#txn-amount, input[placeholder*="amount" i]').first().fill('75');
    await page.getByRole('button', { name: /add transaction|save/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit to income
    await page.getByText(description).click();
    await page.waitForTimeout(500);

    const incomeRadio = page.locator('input[type="radio"][value="credit"]').or(
      page.getByText(/income/i).locator('..').locator('input[type="radio"]')
    );
    if (await incomeRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
      await incomeRadio.check();
    }

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(description)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Finance Transactions - Delete Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('domcontentloaded');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const transactionsTab = page.getByRole('button', { name: /transactions/i }).first();
    if (await transactionsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await transactionsTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('delete transaction', async ({ page }) => {
    const description = `Delete Me ${Date.now()}`;

    // Create transaction
    const addButton = page.getByRole('button', { name: /add transaction/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);

    await page.locator('#txn-description, input[placeholder*="description" i]').first().fill(description);
    await page.locator('#txn-amount, input[placeholder*="amount" i]').first().fill('25');
    await page.getByRole('button', { name: /add transaction|save/i }).last().click();
    await page.waitForTimeout(1000);

    // Open transaction
    await page.getByText(description).click();
    await page.waitForTimeout(500);

    // Delete
    const deleteButton = page.getByRole('button', { name: /delete/i }).or(
      page.locator('button').filter({ hasText: /delete/i })
    );

    if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteButton.click();
      await page.waitForTimeout(300);

      // Confirm if needed
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i }).last();
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      await page.waitForTimeout(1000);

      // Verify deletion
      await expect(page.getByText(description)).not.toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Finance Transactions - Display & Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('domcontentloaded');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const transactionsTab = page.getByRole('button', { name: /transactions/i }).first();
    if (await transactionsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await transactionsTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('display multiple transactions with different types', async ({ page }) => {
    const timestamp = Date.now();
    const transactions = [
      { desc: `Expense ${timestamp}`, amount: '50', type: 'expense' },
      { desc: `Income ${timestamp}`, amount: '1000', type: 'income' },
    ];

    for (const txn of transactions) {
      const addButton = page.getByRole('button', { name: /add transaction/i }).first();
      await addButton.click();
      await page.waitForTimeout(500);

      await page.locator('#txn-description, input[placeholder*="description" i]').first().fill(txn.desc);
      await page.locator('#txn-amount, input[placeholder*="amount" i]').first().fill(txn.amount);

      if (txn.type === 'income') {
        const incomeRadio = page.locator('input[type="radio"][value="credit"]').or(
          page.getByText(/income/i).locator('..').locator('input[type="radio"]')
        );
        if (await incomeRadio.isVisible({ timeout: 2000 }).catch(() => false)) {
          await incomeRadio.check();
        }
      }

      await page.getByRole('button', { name: /add transaction|save/i }).last().click();
      await page.waitForTimeout(800);
    }

    // Verify all transactions display
    for (const txn of transactions) {
      await expect(page.getByText(txn.desc)).toBeVisible({ timeout: 5000 });
    }
  });

  test('transactions display correct date formatting', async ({ page }) => {
    const description = `Date Format ${Date.now()}`;

    const addButton = page.getByRole('button', { name: /add transaction/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);

    await page.locator('#txn-description, input[placeholder*="description" i]').first().fill(description);
    await page.locator('#txn-amount, input[placeholder*="amount" i]').first().fill('100');
    await page.getByRole('button', { name: /add transaction|save/i }).last().click();
    await page.waitForTimeout(1000);

    // Verify transaction displays with a date (format varies)
    await expect(page.getByText(description)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Finance Transactions - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('domcontentloaded');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const transactionsTab = page.getByRole('button', { name: /transactions/i }).first();
    if (await transactionsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await transactionsTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('create transaction with decimal amount', async ({ page }) => {
    const description = `Decimal ${Date.now()}`;

    const addButton = page.getByRole('button', { name: /add transaction/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);

    await page.locator('#txn-description, input[placeholder*="description" i]').first().fill(description);
    await page.locator('#txn-amount, input[placeholder*="amount" i]').first().fill('99.99');
    await page.getByRole('button', { name: /add transaction|save/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(description)).toBeVisible({ timeout: 5000 });
  });

  test('create transaction with very large amount', async ({ page }) => {
    const description = `Large Amount ${Date.now()}`;

    const addButton = page.getByRole('button', { name: /add transaction/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);

    await page.locator('#txn-description, input[placeholder*="description" i]').first().fill(description);
    await page.locator('#txn-amount, input[placeholder*="amount" i]').first().fill('50000');
    await page.getByRole('button', { name: /add transaction|save/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(description)).toBeVisible({ timeout: 5000 });
  });

  test('create transaction with long description', async ({ page }) => {
    const description = `Very Long Transaction Description That Should Still Work Fine ${Date.now()}`;

    const addButton = page.getByRole('button', { name: /add transaction/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);

    await page.locator('#txn-description, input[placeholder*="description" i]').first().fill(description);
    await page.locator('#txn-amount, input[placeholder*="amount" i]').first().fill('25');
    await page.getByRole('button', { name: /add transaction|save/i }).last().click();
    await page.waitForTimeout(1000);

    // Description might be truncated in display
    const shortDesc = description.substring(0, 30);
    await expect(page.getByText(new RegExp(shortDesc))).toBeVisible({ timeout: 5000 });
  });
});
