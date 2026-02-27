/**
 * Comprehensive Finance Credit Cards CRUD Tests
 *
 * Tests all Create, Read, Update, Delete operations for credit cards
 * including rewards programs, sign-up bonuses, and benefits tracking.
 */

import { test, expect } from '@playwright/test';

test.describe('Finance Credit Cards - Create Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    // Close mobile sidebar if open
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    // Navigate to Credit Cards tab
    const cardsTab = page.getByRole('button', { name: /credit cards|cards/i }).or(
      page.locator('button').filter({ hasText: /credit cards|cards/i })
    );
    if (await cardsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cardsTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('create cashback rewards card', async ({ page }) => {
    const cardName = `Cashback Card ${Date.now()}`;

    await page.getByRole('button', { name: /add card/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#card-name').fill(cardName);
    await page.locator('#card-issuer').fill('Chase');
    await page.locator('#card-last4').fill('1234');
    await page.locator('#card-limit').fill('15000');
    await page.locator('#card-apr').fill('18.99');
    await page.locator('#card-fee').fill('0');
    await page.locator('#card-rewards').selectOption('cashback');

    const rateField = page.locator('#card-rate');
    if (await rateField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rateField.fill('2% on all purchases');
    }

    await page.getByRole('button', { name: /add card/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(cardName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/1234/)).toBeVisible();
  });

  test('create points rewards card', async ({ page }) => {
    const cardName = `Points Card ${Date.now()}`;

    await page.getByRole('button', { name: /add card/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#card-name').fill(cardName);
    await page.locator('#card-issuer').fill('American Express');
    await page.locator('#card-last4').fill('5678');
    await page.locator('#card-limit').fill('25000');
    await page.locator('#card-apr').fill('19.99');
    await page.locator('#card-fee').fill('95');
    await page.locator('#card-rewards').selectOption('points');

    const rateField = page.locator('#card-rate');
    if (await rateField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rateField.fill('3x points on travel, 2x on dining');
    }

    await page.getByRole('button', { name: /add card/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(cardName)).toBeVisible({ timeout: 5000 });
  });

  test('create miles rewards card', async ({ page }) => {
    const cardName = `Miles Card ${Date.now()}`;

    await page.getByRole('button', { name: /add card/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#card-name').fill(cardName);
    await page.locator('#card-issuer').fill('Capital One');
    await page.locator('#card-last4').fill('9012');
    await page.locator('#card-limit').fill('20000');
    await page.locator('#card-apr').fill('17.99');
    await page.locator('#card-fee').fill('0');
    await page.locator('#card-rewards').selectOption('miles');

    const rateField = page.locator('#card-rate');
    if (await rateField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rateField.fill('1.5 miles per dollar');
    }

    await page.getByRole('button', { name: /add card/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(cardName)).toBeVisible({ timeout: 5000 });
  });

  test('create card with no rewards', async ({ page }) => {
    const cardName = `Basic Card ${Date.now()}`;

    await page.getByRole('button', { name: /add card/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#card-name').fill(cardName);
    await page.locator('#card-issuer').fill('Discover');
    await page.locator('#card-last4').fill('3456');
    await page.locator('#card-limit').fill('10000');
    await page.locator('#card-apr').fill('16.99');
    await page.locator('#card-fee').fill('0');
    await page.locator('#card-rewards').selectOption('none');

    await page.getByRole('button', { name: /add card/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(cardName)).toBeVisible({ timeout: 5000 });
  });

  test('create card with sign-up bonus', async ({ page }) => {
    const cardName = `Bonus Card ${Date.now()}`;

    await page.getByRole('button', { name: /add card/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#card-name').fill(cardName);
    await page.locator('#card-issuer').fill('Chase');
    await page.locator('#card-last4').fill('7890');
    await page.locator('#card-limit').fill('15000');
    await page.locator('#card-apr').fill('18.99');
    await page.locator('#card-fee').fill('95');
    await page.locator('#card-rewards').selectOption('points');

    const bonusField = page.locator('#card-bonus');
    if (await bonusField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await bonusField.fill('60,000 bonus points');
    }

    const bonusReqField = page.locator('#card-bonus-req');
    if (await bonusReqField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await bonusReqField.fill('$4,000 spend in 3 months');
    }

    const bonusDeadlineField = page.locator('#card-bonus-deadline');
    if (await bonusDeadlineField.isVisible({ timeout: 2000 }).catch(() => false)) {
      const deadline = new Date();
      deadline.setMonth(deadline.getMonth() + 3);
      await bonusDeadlineField.fill(deadline.toISOString().split('T')[0]);
    }

    await page.getByRole('button', { name: /add card/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(cardName)).toBeVisible({ timeout: 5000 });
  });

  test('create card with benefits', async ({ page }) => {
    const cardName = `Premium Card ${Date.now()}`;

    await page.getByRole('button', { name: /add card/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#card-name').fill(cardName);
    await page.locator('#card-issuer').fill('American Express');
    await page.locator('#card-last4').fill('2468');
    await page.locator('#card-limit').fill('50000');
    await page.locator('#card-apr').fill('20.99');
    await page.locator('#card-fee').fill('550');
    await page.locator('#card-rewards').selectOption('points');

    const benefitsField = page.locator('#card-benefits');
    if (await benefitsField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await benefitsField.fill('Airport lounge access, $200 airline credit, Global Entry');
    }

    await page.getByRole('button', { name: /add card/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(cardName)).toBeVisible({ timeout: 5000 });
  });

  test('create card with notes', async ({ page }) => {
    const cardName = `Store Card ${Date.now()}`;

    await page.getByRole('button', { name: /add card/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#card-name').fill(cardName);
    await page.locator('#card-issuer').fill('Target');
    await page.locator('#card-last4').fill('1357');
    await page.locator('#card-limit').fill('5000');
    await page.locator('#card-apr').fill('22.99');
    await page.locator('#card-fee').fill('0');
    await page.locator('#card-rewards').selectOption('none');

    const notesField = page.locator('#card-notes');
    if (await notesField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await notesField.fill('Store card for Target purchases only');
    }

    await page.getByRole('button', { name: /add card/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(cardName)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Finance Credit Cards - Update Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const cardsTab = page.getByRole('button', { name: /credit cards|cards/i }).or(
      page.locator('button').filter({ hasText: /credit cards|cards/i })
    );
    if (await cardsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cardsTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('update credit limit', async ({ page }) => {
    const cardName = `Limit Update ${Date.now()}`;

    // Create card
    await page.getByRole('button', { name: /add card/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#card-name').fill(cardName);
    await page.locator('#card-issuer').fill('Citi');
    await page.locator('#card-last4').fill('4321');
    await page.locator('#card-limit').fill('12000');
    await page.locator('#card-apr').fill('17.99');
    await page.locator('#card-fee').fill('0');
    await page.locator('#card-rewards').selectOption('cashback');

    await page.getByRole('button', { name: /add card/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit card
    await page.getByText(cardName).click();
    await page.waitForTimeout(500);

    const limitInput = page.locator('#card-limit');
    await limitInput.clear();
    await limitInput.fill('18000'); // Increased limit

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(cardName)).toBeVisible({ timeout: 5000 });
  });

  test('update APR', async ({ page }) => {
    const cardName = `APR Update ${Date.now()}`;

    // Create card
    await page.getByRole('button', { name: /add card/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#card-name').fill(cardName);
    await page.locator('#card-issuer').fill('Bank of America');
    await page.locator('#card-last4').fill('8765');
    await page.locator('#card-limit').fill('15000');
    await page.locator('#card-apr').fill('19.99');
    await page.locator('#card-fee').fill('0');
    await page.locator('#card-rewards').selectOption('cashback');

    await page.getByRole('button', { name: /add card/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit card
    await page.getByText(cardName).click();
    await page.waitForTimeout(500);

    const aprInput = page.locator('#card-apr');
    await aprInput.clear();
    await aprInput.fill('17.99'); // Reduced APR

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(cardName)).toBeVisible({ timeout: 5000 });
  });

  test('change rewards type', async ({ page }) => {
    const cardName = `Rewards Change ${Date.now()}`;

    // Create card
    await page.getByRole('button', { name: /add card/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#card-name').fill(cardName);
    await page.locator('#card-issuer').fill('Wells Fargo');
    await page.locator('#card-last4').fill('5555');
    await page.locator('#card-limit').fill('10000');
    await page.locator('#card-apr').fill('18.99');
    await page.locator('#card-fee').fill('0');
    await page.locator('#card-rewards').selectOption('cashback');

    await page.getByRole('button', { name: /add card/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit card
    await page.getByText(cardName).click();
    await page.waitForTimeout(500);

    await page.locator('#card-rewards').selectOption('points');

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(cardName)).toBeVisible({ timeout: 5000 });
  });

  test('add benefits to existing card', async ({ page }) => {
    const cardName = `Benefits Add ${Date.now()}`;

    // Create card
    await page.getByRole('button', { name: /add card/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#card-name').fill(cardName);
    await page.locator('#card-issuer').fill('Citi');
    await page.locator('#card-last4').fill('6789');
    await page.locator('#card-limit').fill('20000');
    await page.locator('#card-apr').fill('16.99');
    await page.locator('#card-fee').fill('95');
    await page.locator('#card-rewards').selectOption('miles');

    await page.getByRole('button', { name: /add card/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit card
    await page.getByText(cardName).click();
    await page.waitForTimeout(500);

    const benefitsField = page.locator('#card-benefits');
    if (await benefitsField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await benefitsField.fill('Free checked bag, priority boarding');
    }

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(cardName)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Finance Credit Cards - Delete Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const cardsTab = page.getByRole('button', { name: /credit cards|cards/i }).or(
      page.locator('button').filter({ hasText: /credit cards|cards/i })
    );
    if (await cardsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cardsTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('delete closed credit card', async ({ page }) => {
    const cardName = `Closed Card ${Date.now()}`;

    // Create card
    await page.getByRole('button', { name: /add card/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#card-name').fill(cardName);
    await page.locator('#card-issuer').fill('Discover');
    await page.locator('#card-last4').fill('9999');
    await page.locator('#card-limit').fill('5000');
    await page.locator('#card-apr').fill('19.99');
    await page.locator('#card-fee').fill('0');
    await page.locator('#card-rewards').selectOption('cashback');

    await page.getByRole('button', { name: /add card/i }).last().click();
    await page.waitForTimeout(1000);

    // Click on card to open details
    await page.getByText(cardName).click();
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

      // Verify card no longer appears
      await expect(page.getByText(cardName)).not.toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Finance Credit Cards - Display & Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const cardsTab = page.getByRole('button', { name: /credit cards|cards/i }).or(
      page.locator('button').filter({ hasText: /credit cards|cards/i })
    );
    if (await cardsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cardsTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('display multiple cards with different issuers', async ({ page }) => {
    const timestamp = Date.now();
    const cards = [
      { name: `Chase Card ${timestamp}`, issuer: 'Chase', last4: '1111', limit: '15000', rewards: 'cashback' },
      { name: `Amex Card ${timestamp}`, issuer: 'American Express', last4: '2222', limit: '25000', rewards: 'points' },
      { name: `Citi Card ${timestamp}`, issuer: 'Citi', last4: '3333', limit: '12000', rewards: 'miles' },
    ];

    // Create multiple cards
    for (const card of cards) {
      await page.getByRole('button', { name: /add card/i }).first().click();
      await page.waitForTimeout(500);

      await page.locator('#card-name').fill(card.name);
      await page.locator('#card-issuer').fill(card.issuer);
      await page.locator('#card-last4').fill(card.last4);
      await page.locator('#card-limit').fill(card.limit);
      await page.locator('#card-apr').fill('18.99');
      await page.locator('#card-fee').fill('0');
      await page.locator('#card-rewards').selectOption(card.rewards);

      await page.getByRole('button', { name: /add card/i }).last().click();
      await page.waitForTimeout(800);
    }

    // Verify all cards are displayed
    for (const card of cards) {
      await expect(page.getByText(card.name)).toBeVisible({ timeout: 5000 });
    }
  });

  test('card displays last 4 digits', async ({ page }) => {
    const cardName = `Last 4 Test ${Date.now()}`;

    await page.getByRole('button', { name: /add card/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#card-name').fill(cardName);
    await page.locator('#card-issuer').fill('Visa');
    await page.locator('#card-last4').fill('4242');
    await page.locator('#card-limit').fill('10000');
    await page.locator('#card-apr').fill('17.99');
    await page.locator('#card-fee').fill('0');
    await page.locator('#card-rewards').selectOption('cashback');

    await page.getByRole('button', { name: /add card/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(cardName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/4242/)).toBeVisible();
  });
});

test.describe('Finance Credit Cards - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const cardsTab = page.getByRole('button', { name: /credit cards|cards/i }).or(
      page.locator('button').filter({ hasText: /credit cards|cards/i })
    );
    if (await cardsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cardsTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('create card with zero annual fee', async ({ page }) => {
    const cardName = `No Fee ${Date.now()}`;

    await page.getByRole('button', { name: /add card/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#card-name').fill(cardName);
    await page.locator('#card-issuer').fill('Discover');
    await page.locator('#card-last4').fill('5000');
    await page.locator('#card-limit').fill('8000');
    await page.locator('#card-apr').fill('15.99');
    await page.locator('#card-fee').fill('0');
    await page.locator('#card-rewards').selectOption('cashback');

    await page.getByRole('button', { name: /add card/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(cardName)).toBeVisible({ timeout: 5000 });
  });

  test('create card with high annual fee', async ({ page }) => {
    const cardName = `Premium Fee ${Date.now()}`;

    await page.getByRole('button', { name: /add card/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#card-name').fill(cardName);
    await page.locator('#card-issuer').fill('American Express');
    await page.locator('#card-last4').fill('1000');
    await page.locator('#card-limit').fill('100000');
    await page.locator('#card-apr').fill('21.99');
    await page.locator('#card-fee').fill('695');
    await page.locator('#card-rewards').selectOption('points');

    await page.getByRole('button', { name: /add card/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(cardName)).toBeVisible({ timeout: 5000 });
  });

  test('create card with very high credit limit', async ({ page }) => {
    const cardName = `High Limit ${Date.now()}`;

    await page.getByRole('button', { name: /add card/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#card-name').fill(cardName);
    await page.locator('#card-issuer').fill('Chase');
    await page.locator('#card-last4').fill('8888');
    await page.locator('#card-limit').fill('100000');
    await page.locator('#card-apr').fill('18.99');
    await page.locator('#card-fee').fill('550');
    await page.locator('#card-rewards').selectOption('points');

    await page.getByRole('button', { name: /add card/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(cardName)).toBeVisible({ timeout: 5000 });
  });

  test('create card with decimal APR', async ({ page }) => {
    const cardName = `Decimal APR ${Date.now()}`;

    await page.getByRole('button', { name: /add card/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#card-name').fill(cardName);
    await page.locator('#card-issuer').fill('Citi');
    await page.locator('#card-last4').fill('7777');
    await page.locator('#card-limit').fill('12000');
    await page.locator('#card-apr').fill('16.24');
    await page.locator('#card-fee').fill('0');
    await page.locator('#card-rewards').selectOption('cashback');

    await page.getByRole('button', { name: /add card/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(cardName)).toBeVisible({ timeout: 5000 });
  });
});
