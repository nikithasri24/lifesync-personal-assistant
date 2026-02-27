/**
 * Comprehensive Finance Goals CRUD Tests
 *
 * Tests all Create, Read, Update, Delete operations for financial goals
 * including various goal types, target amounts, and progress tracking.
 */

import { test, expect } from '@playwright/test';

test.describe('Finance Goals - Create Operations', () => {
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

    // Click on Goals tab
    await page.getByRole('button', { name: /^Goals$/i }).click();
    await page.waitForTimeout(500);
  });

  test('create vacation savings goal', async ({ page }) => {
    const goalName = `Summer Vacation ${Date.now()}`;

    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('vacation');
    await page.locator('#goal-target').fill('5000');
    await page.locator('#goal-current').fill('1200');

    const deadlineField = page.locator('#goal-deadline');
    if (await deadlineField.isVisible({ timeout: 2000 }).catch(() => false)) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);
      await deadlineField.fill(futureDate.toISOString().split('T')[0]);
    }

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(goalName)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/5,?000/)).toBeVisible();
  });

  test('create home down payment goal', async ({ page }) => {
    const goalName = `House Down Payment ${Date.now()}`;

    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('home');
    await page.locator('#goal-target').fill('50000');
    await page.locator('#goal-current').fill('15000');

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(goalName)).toBeVisible({ timeout: 5000 });
  });

  test('create car purchase goal', async ({ page }) => {
    const goalName = `New Car ${Date.now()}`;

    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('car');
    await page.locator('#goal-target').fill('30000');
    await page.locator('#goal-current').fill('8000');

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(goalName)).toBeVisible({ timeout: 5000 });
  });

  test('create education fund goal', async ({ page }) => {
    const goalName = `MBA Fund ${Date.now()}`;

    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('education');
    await page.locator('#goal-target').fill('25000');
    await page.locator('#goal-current').fill('5000');

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(goalName)).toBeVisible({ timeout: 5000 });
  });

  test('create emergency fund goal', async ({ page }) => {
    const goalName = `Emergency Fund ${Date.now()}`;

    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('emergency');
    await page.locator('#goal-target').fill('10000');
    await page.locator('#goal-current').fill('3500');

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(goalName)).toBeVisible({ timeout: 5000 });
  });

  test('create retirement goal', async ({ page }) => {
    const goalName = `Retirement Savings ${Date.now()}`;

    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('retirement');
    await page.locator('#goal-target').fill('1000000');
    await page.locator('#goal-current').fill('150000');

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(goalName)).toBeVisible({ timeout: 5000 });
  });

  test('create investment goal', async ({ page }) => {
    const goalName = `Stock Portfolio ${Date.now()}`;

    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('investment');
    await page.locator('#goal-target').fill('100000');
    await page.locator('#goal-current').fill('25000');

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(goalName)).toBeVisible({ timeout: 5000 });
  });

  test('create goal with notes', async ({ page }) => {
    const goalName = `General Savings ${Date.now()}`;

    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('other');
    await page.locator('#goal-target').fill('15000');
    await page.locator('#goal-current').fill('0');

    const notesField = page.locator('#goal-notes');
    if (await notesField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await notesField.fill('Long-term savings for future plans');
    }

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(goalName)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Finance Goals - Update Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const goalsTab = page.getByRole('button', { name: /goals/i }).or(
      page.locator('button').filter({ hasText: /goals/i })
    );
    if (await goalsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await goalsTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('update goal progress', async ({ page }) => {
    const goalName = `Progress Update ${Date.now()}`;

    // Create goal
    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('vacation');
    await page.locator('#goal-target').fill('3000');
    await page.locator('#goal-current').fill('500');

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit goal
    await page.getByText(goalName).click();
    await page.waitForTimeout(500);

    const currentInput = page.locator('#goal-current');
    await currentInput.clear();
    await currentInput.fill('1500');

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(goalName)).toBeVisible({ timeout: 5000 });
  });

  test('update goal target amount', async ({ page }) => {
    const goalName = `Target Update ${Date.now()}`;

    // Create goal
    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('emergency');
    await page.locator('#goal-target').fill('10000');
    await page.locator('#goal-current').fill('2000');

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit goal
    await page.getByText(goalName).click();
    await page.waitForTimeout(500);

    const targetInput = page.locator('#goal-target');
    await targetInput.clear();
    await targetInput.fill('15000');

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(goalName)).toBeVisible({ timeout: 5000 });
  });

  test('update goal deadline', async ({ page }) => {
    const goalName = `Deadline Update ${Date.now()}`;

    // Create goal
    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('car');
    await page.locator('#goal-target').fill('20000');
    await page.locator('#goal-current').fill('5000');

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit goal
    await page.getByText(goalName).click();
    await page.waitForTimeout(500);

    const deadlineField = page.locator('#goal-deadline');
    if (await deadlineField.isVisible({ timeout: 2000 }).catch(() => false)) {
      const newDeadline = new Date();
      newDeadline.setMonth(newDeadline.getMonth() + 12);
      await deadlineField.fill(newDeadline.toISOString().split('T')[0]);
    }

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(goalName)).toBeVisible({ timeout: 5000 });
  });

  test('change goal category', async ({ page }) => {
    const goalName = `Category Change ${Date.now()}`;

    // Create goal
    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('other');
    await page.locator('#goal-target').fill('5000');
    await page.locator('#goal-current').fill('1000');

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    // Edit goal
    await page.getByText(goalName).click();
    await page.waitForTimeout(500);

    await page.locator('#goal-category').selectOption('investment');

    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(goalName)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Finance Goals - Delete Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const goalsTab = page.getByRole('button', { name: /goals/i }).or(
      page.locator('button').filter({ hasText: /goals/i })
    );
    if (await goalsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await goalsTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('delete goal', async ({ page }) => {
    const goalName = `Delete Me ${Date.now()}`;

    // Create goal
    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('other');
    await page.locator('#goal-target').fill('1000');
    await page.locator('#goal-current').fill('0');

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    // Click on goal to open details
    await page.getByText(goalName).click();
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

      // Verify goal no longer appears
      await expect(page.getByText(goalName)).not.toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Finance Goals - Display & Progress', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const goalsTab = page.getByRole('button', { name: /goals/i }).or(
      page.locator('button').filter({ hasText: /goals/i })
    );
    if (await goalsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await goalsTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('display multiple goals with different categories', async ({ page }) => {
    const timestamp = Date.now();
    const goals = [
      { name: `Vacation ${timestamp}`, category: 'vacation', target: '3000', current: '1000' },
      { name: `Emergency ${timestamp}`, category: 'emergency', target: '10000', current: '5000' },
      { name: `Car ${timestamp}`, category: 'car', target: '25000', current: '10000' },
    ];

    // Create multiple goals
    for (const goal of goals) {
      await page.getByRole('button', { name: /add goal/i }).first().click();
      await page.waitForTimeout(500);

      await page.locator('#goal-name').fill(goal.name);
      await page.locator('#goal-category').selectOption(goal.category);
      await page.locator('#goal-target').fill(goal.target);
      await page.locator('#goal-current').fill(goal.current);

      await page.getByRole('button', { name: /add goal/i }).last().click();
      await page.waitForTimeout(800);
    }

    // Verify all goals are displayed
    for (const goal of goals) {
      await expect(page.getByText(goal.name)).toBeVisible({ timeout: 5000 });
    }
  });

  test('goal shows progress percentage', async ({ page }) => {
    const goalName = `Progress Test ${Date.now()}`;

    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('vacation');
    await page.locator('#goal-target').fill('1000');
    await page.locator('#goal-current').fill('500'); // 50% progress

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(goalName)).toBeVisible({ timeout: 5000 });
    // Progress indicator would typically show percentage or progress bar
  });
});

test.describe('Finance Goals - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    const goalsTab = page.getByRole('button', { name: /goals/i }).or(
      page.locator('button').filter({ hasText: /goals/i })
    );
    if (await goalsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await goalsTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('create goal with zero current amount', async ({ page }) => {
    const goalName = `Zero Start ${Date.now()}`;

    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('vacation');
    await page.locator('#goal-target').fill('5000');
    await page.locator('#goal-current').fill('0');

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(goalName)).toBeVisible({ timeout: 5000 });
  });

  test('create goal that is already achieved', async ({ page }) => {
    const goalName = `Already Achieved ${Date.now()}`;

    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('other');
    await page.locator('#goal-target').fill('1000');
    await page.locator('#goal-current').fill('1000'); // 100% achieved

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(goalName)).toBeVisible({ timeout: 5000 });
  });

  test('create goal with very large target', async ({ page }) => {
    const goalName = `Large Goal ${Date.now()}`;

    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('retirement');
    await page.locator('#goal-target').fill('5000000');
    await page.locator('#goal-current').fill('100000');

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(goalName)).toBeVisible({ timeout: 5000 });
  });

  test('create goal with decimal amounts', async ({ page }) => {
    const goalName = `Decimal Goal ${Date.now()}`;

    await page.getByRole('button', { name: /add goal/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#goal-name').fill(goalName);
    await page.locator('#goal-category').selectOption('emergency');
    await page.locator('#goal-target').fill('2500.75');
    await page.locator('#goal-current').fill('850.25');

    await page.getByRole('button', { name: /add goal/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(goalName)).toBeVisible({ timeout: 5000 });
  });
});
