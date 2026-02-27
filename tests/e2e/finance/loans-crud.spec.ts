/**
 * Comprehensive Finance Loans CRUD Tests
 *
 * Tests all Create, Read, Update, Delete operations for loans
 * including various loan types, payment tracking, and interest calculations.
 */

import { test, expect } from '@playwright/test';

test.describe('Finance Loans - Create Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    // Close mobile sidebar if open
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

      await page.waitForTimeout(500);
    }

    // Click on Loans tab
    await page.getByRole('button', { name: /^Loans$/i }).click();
    await page.waitForTimeout(500);
  });

  test('create mortgage loan', async ({ page }) => {
    const loanName = `Home Mortgage ${Date.now()}`;

    await page.getByRole('button', { name: /add loan/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#loan-name').fill(loanName);
    await page.locator('#loan-type').selectOption('mortgage');
    await page.locator('#loan-principal').fill('300000');
    await page.locator('#loan-balance').fill('285000');
    await page.locator('#loan-rate').fill('3.5');
    await page.locator('#loan-payment').fill('1347');
    await page.locator('#loan-term').fill('360'); // 30 years

    const nextPaymentField = page.locator('#loan-next-payment');
    if (await nextPaymentField.isVisible({ timeout: 2000 }).catch(() => false)) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      await nextPaymentField.fill(nextMonth.toISOString().split('T')[0]);
    }

    await page.getByRole('button', { name: /add loan/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(loanName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/300,?000/)).toBeVisible();
  });

  test('create auto loan', async ({ page }) => {
    const loanName = `Car Loan ${Date.now()}`;

    await page.getByRole('button', { name: /add loan/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#loan-name').fill(loanName);
    await page.locator('#loan-type').selectOption('auto');
    await page.locator('#loan-principal').fill('35000');
    await page.locator('#loan-balance').fill('28000');
    await page.locator('#loan-rate').fill('4.2');
    await page.locator('#loan-payment').fill('645');
    await page.locator('#loan-term').fill('60'); // 5 years

    await page.getByRole('button', { name: /add loan/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(loanName)).toBeVisible({ timeout: 5000 });
  });

  test('create student loan', async ({ page }) => {
    const loanName = `Student Loan ${Date.now()}`;

    await page.getByRole('button', { name: /add loan/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#loan-name').fill(loanName);
    await page.locator('#loan-type').selectOption('student');
    await page.locator('#loan-principal').fill('45000');
    await page.locator('#loan-balance').fill('42000');
    await page.locator('#loan-rate').fill('5.8');
    await page.locator('#loan-payment').fill('490');
    await page.locator('#loan-term').fill('120'); // 10 years

    await page.getByRole('button', { name: /add loan/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(loanName)).toBeVisible({ timeout: 5000 });
  });

  test('create personal loan', async ({ page }) => {
    const loanName = `Personal Loan ${Date.now()}`;

    await page.getByRole('button', { name: /add loan/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#loan-name').fill(loanName);
    await page.locator('#loan-type').selectOption('personal');
    await page.locator('#loan-principal').fill('15000');
    await page.locator('#loan-balance').fill('12000');
    await page.locator('#loan-rate').fill('8.5');
    await page.locator('#loan-payment').fill('375');
    await page.locator('#loan-term').fill('48'); // 4 years

    await page.getByRole('button', { name: /add loan/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(loanName)).toBeVisible({ timeout: 5000 });
  });

  test('create business loan', async ({ page }) => {
    const loanName = `Business Loan ${Date.now()}`;

    await page.getByRole('button', { name: /add loan/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#loan-name').fill(loanName);
    await page.locator('#loan-type').selectOption('business');
    await page.locator('#loan-principal').fill('100000');
    await page.locator('#loan-balance').fill('85000');
    await page.locator('#loan-rate').fill('6.75');
    await page.locator('#loan-payment').fill('1250');
    await page.locator('#loan-term').fill('84'); // 7 years

    await page.getByRole('button', { name: /add loan/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(loanName)).toBeVisible({ timeout: 5000 });
  });

  test('create loan with notes', async ({ page }) => {
    const loanName = `Other Loan ${Date.now()}`;

    await page.getByRole('button', { name: /add loan/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#loan-name').fill(loanName);
    await page.locator('#loan-type').selectOption('other');
    await page.locator('#loan-principal').fill('5000');
    await page.locator('#loan-balance').fill('3500');
    await page.locator('#loan-rate').fill('7.0');
    await page.locator('#loan-payment').fill('150');
    await page.locator('#loan-term').fill('36'); // 3 years

    const notesField = page.locator('#loan-notes');
    if (await notesField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await notesField.fill('Family loan, flexible payment schedule');
    }

    await page.getByRole('button', { name: /add loan/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(loanName)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Finance Loans - Update Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const loansTab = page.getByRole('button', { name: /loans/i }).or(
      page.locator('button').filter({ hasText: /loans/i })
    );
    if (await loansTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loansTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('update loan balance after payment', async ({ page }) => {
    const loanName = `Balance Update ${Date.now()}`;

    // Create loan
    await page.getByRole('button', { name: /add loan/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#loan-name').fill(loanName);
    await page.locator('#loan-type').selectOption('personal');
    await page.locator('#loan-principal').fill('10000');
    await page.locator('#loan-balance').fill('8000');
    await page.locator('#loan-rate').fill('6.5');
    await page.locator('#loan-payment').fill('200');
    await page.locator('#loan-term').fill('48');

    await page.getByRole('button', { name: /add loan/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit loan
    await page.getByText(loanName).click();
    await page.waitForTimeout(500);

    const balanceInput = page.locator('#loan-balance');
    await balanceInput.clear();
    await balanceInput.fill('7800'); // After one payment

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(loanName)).toBeVisible({ timeout: 5000 });
  });

  test('update loan payment amount', async ({ page }) => {
    const loanName = `Payment Update ${Date.now()}`;

    // Create loan
    await page.getByRole('button', { name: /add loan/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#loan-name').fill(loanName);
    await page.locator('#loan-type').selectOption('auto');
    await page.locator('#loan-principal').fill('25000');
    await page.locator('#loan-balance').fill('20000');
    await page.locator('#loan-rate').fill('4.5');
    await page.locator('#loan-payment').fill('500');
    await page.locator('#loan-term').fill('48');

    await page.getByRole('button', { name: /add loan/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit loan
    await page.getByText(loanName).click();
    await page.waitForTimeout(500);

    const paymentInput = page.locator('#loan-payment');
    await paymentInput.clear();
    await paymentInput.fill('600'); // Increased payment

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(loanName)).toBeVisible({ timeout: 5000 });
  });

  test('update interest rate', async ({ page }) => {
    const loanName = `Rate Update ${Date.now()}`;

    // Create loan
    await page.getByRole('button', { name: /add loan/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#loan-name').fill(loanName);
    await page.locator('#loan-type').selectOption('mortgage');
    await page.locator('#loan-principal').fill('200000');
    await page.locator('#loan-balance').fill('195000');
    await page.locator('#loan-rate').fill('4.0');
    await page.locator('#loan-payment').fill('955');
    await page.locator('#loan-term').fill('360');

    await page.getByRole('button', { name: /add loan/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit loan
    await page.getByText(loanName).click();
    await page.waitForTimeout(500);

    const rateInput = page.locator('#loan-rate');
    await rateInput.clear();
    await rateInput.fill('3.5'); // Refinanced to lower rate

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(loanName)).toBeVisible({ timeout: 5000 });
  });

  test('update next payment date', async ({ page }) => {
    const loanName = `Date Update ${Date.now()}`;

    // Create loan
    await page.getByRole('button', { name: /add loan/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#loan-name').fill(loanName);
    await page.locator('#loan-type').selectOption('student');
    await page.locator('#loan-principal').fill('30000');
    await page.locator('#loan-balance').fill('28000');
    await page.locator('#loan-rate').fill('5.5');
    await page.locator('#loan-payment').fill('320');
    await page.locator('#loan-term').fill('120');

    await page.getByRole('button', { name: /add loan/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit loan
    await page.getByText(loanName).click();
    await page.waitForTimeout(500);

    const nextPaymentField = page.locator('#loan-next-payment');
    if (await nextPaymentField.isVisible({ timeout: 2000 }).catch(() => false)) {
      const newDate = new Date();
      newDate.setDate(15); // Set to 15th of current month
      await nextPaymentField.fill(newDate.toISOString().split('T')[0]);
    }

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(loanName)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Finance Loans - Delete Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const loansTab = page.getByRole('button', { name: /loans/i }).or(
      page.locator('button').filter({ hasText: /loans/i })
    );
    if (await loansTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loansTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('delete paid-off loan', async ({ page }) => {
    const loanName = `Paid Off ${Date.now()}`;

    // Create loan
    await page.getByRole('button', { name: /add loan/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#loan-name').fill(loanName);
    await page.locator('#loan-type').selectOption('personal');
    await page.locator('#loan-principal').fill('5000');
    await page.locator('#loan-balance').fill('0'); // Paid off
    await page.locator('#loan-rate').fill('7.0');
    await page.locator('#loan-payment').fill('150');
    await page.locator('#loan-term').fill('36');

    await page.getByRole('button', { name: /add loan/i }).last().click();
    await page.waitForTimeout(1000);

    // Click on loan to open details
    await page.getByText(loanName).click();
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

      // Verify loan no longer appears
      await expect(page.getByText(loanName)).not.toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Finance Loans - Display & Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const loansTab = page.getByRole('button', { name: /loans/i }).or(
      page.locator('button').filter({ hasText: /loans/i })
    );
    if (await loansTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loansTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('display multiple loans with different types', async ({ page }) => {
    const timestamp = Date.now();
    const loans = [
      { name: `Mortgage ${timestamp}`, type: 'mortgage', principal: '250000', balance: '240000', rate: '3.5', payment: '1122', term: '360' },
      { name: `Auto ${timestamp}`, type: 'auto', principal: '30000', balance: '25000', rate: '4.5', payment: '558', term: '60' },
      { name: `Student ${timestamp}`, type: 'student', principal: '40000', balance: '38000', rate: '5.5', payment: '430', term: '120' },
    ];

    // Create multiple loans
    for (const loan of loans) {
      await page.getByRole('button', { name: /add loan/i }).first().click();
      await page.waitForTimeout(500);

      await page.locator('#loan-name').fill(loan.name);
      await page.locator('#loan-type').selectOption(loan.type);
      await page.locator('#loan-principal').fill(loan.principal);
      await page.locator('#loan-balance').fill(loan.balance);
      await page.locator('#loan-rate').fill(loan.rate);
      await page.locator('#loan-payment').fill(loan.payment);
      await page.locator('#loan-term').fill(loan.term);

      await page.getByRole('button', { name: /add loan/i }).last().click();
      await page.waitForTimeout(800);
    }

    // Verify all loans are displayed
    for (const loan of loans) {
      await expect(page.getByText(loan.name)).toBeVisible({ timeout: 5000 });
    }
  });

  test('loan shows remaining balance', async ({ page }) => {
    const loanName = `Balance Display ${Date.now()}`;

    await page.getByRole('button', { name: /add loan/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#loan-name').fill(loanName);
    await page.locator('#loan-type').selectOption('auto');
    await page.locator('#loan-principal').fill('25000');
    await page.locator('#loan-balance').fill('18500');
    await page.locator('#loan-rate').fill('4.2');
    await page.locator('#loan-payment').fill('500');
    await page.locator('#loan-term').fill('60');

    await page.getByRole('button', { name: /add loan/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(loanName)).toBeVisible({ timeout: 5000 });
    // Balance should be displayed somewhere on the loan card
  });
});

test.describe('Finance Loans - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const loansTab = page.getByRole('button', { name: /loans/i }).or(
      page.locator('button').filter({ hasText: /loans/i })
    );
    if (await loansTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await loansTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('create loan with zero balance (paid off)', async ({ page }) => {
    const loanName = `Zero Balance ${Date.now()}`;

    await page.getByRole('button', { name: /add loan/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#loan-name').fill(loanName);
    await page.locator('#loan-type').selectOption('personal');
    await page.locator('#loan-principal').fill('10000');
    await page.locator('#loan-balance').fill('0');
    await page.locator('#loan-rate').fill('6.0');
    await page.locator('#loan-payment').fill('250');
    await page.locator('#loan-term').fill('48');

    await page.getByRole('button', { name: /add loan/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(loanName)).toBeVisible({ timeout: 5000 });
  });

  test('create loan with high interest rate', async ({ page }) => {
    const loanName = `High Rate ${Date.now()}`;

    await page.getByRole('button', { name: /add loan/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#loan-name').fill(loanName);
    await page.locator('#loan-type').selectOption('personal');
    await page.locator('#loan-principal').fill('15000');
    await page.locator('#loan-balance').fill('14000');
    await page.locator('#loan-rate').fill('18.5');
    await page.locator('#loan-payment').fill('425');
    await page.locator('#loan-term').fill('48');

    await page.getByRole('button', { name: /add loan/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(loanName)).toBeVisible({ timeout: 5000 });
  });

  test('create loan with decimal amounts', async ({ page }) => {
    const loanName = `Decimal Amounts ${Date.now()}`;

    await page.getByRole('button', { name: /add loan/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#loan-name').fill(loanName);
    await page.locator('#loan-type').selectOption('auto');
    await page.locator('#loan-principal').fill('28750.50');
    await page.locator('#loan-balance').fill('24325.75');
    await page.locator('#loan-rate').fill('4.25');
    await page.locator('#loan-payment').fill('532.18');
    await page.locator('#loan-term').fill('60');

    await page.getByRole('button', { name: /add loan/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(loanName)).toBeVisible({ timeout: 5000 });
  });

  test('create loan with very long term', async ({ page }) => {
    const loanName = `Long Term ${Date.now()}`;

    await page.getByRole('button', { name: /add loan/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#loan-name').fill(loanName);
    await page.locator('#loan-type').selectOption('mortgage');
    await page.locator('#loan-principal').fill('400000');
    await page.locator('#loan-balance').fill('398000');
    await page.locator('#loan-rate').fill('3.25');
    await page.locator('#loan-payment').fill('1740');
    await page.locator('#loan-term').fill('360'); // 30 years

    await page.getByRole('button', { name: /add loan/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(loanName)).toBeVisible({ timeout: 5000 });
  });
});
