/**
 * Selfcare Setup - Categories & Items Tests
 *
 * Tests for the Setup tab: managing categories and personal care items
 */

import { test, expect } from '@playwright/test';

test.describe('Selfcare Setup - Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/selfcare');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('displays all four tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: '✨ Routine' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '📅 Schedule' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '🧴 Products' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '⚙️ Setup' })).toBeVisible();
  });

  test('navigate to Routine tab', async ({ page }) => {
    await page.getByRole('tab', { name: '✨ Routine' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('tab', { name: '✨ Routine' })).toBeVisible();
  });

  test('navigate to Schedule tab', async ({ page }) => {
    await page.getByRole('tab', { name: '📅 Schedule' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('tab', { name: '📅 Schedule' })).toBeVisible();
  });

  test('navigate to Products tab', async ({ page }) => {
    await page.getByRole('tab', { name: '🧴 Products' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: /add product/i })).toBeVisible();
  });

  test('navigate to Setup tab', async ({ page }) => {
    await page.getByRole('tab', { name: '⚙️ Setup' }).click();
    await page.waitForTimeout(300);
    await expect(page.getByRole('button', { name: /add category/i })).toBeVisible();
  });
});

test.describe('Selfcare Setup - Category Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/selfcare');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.getByRole('tab', { name: '⚙️ Setup' }).click();
    await page.waitForTimeout(500);
  });

  test('displays add category button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add category/i })).toBeVisible();
  });

  test('create a new category', async ({ page }) => {
    const categoryName = `Body Care ${Date.now()}`;

    await page.getByRole('button', { name: /add category/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: /add category/i })).toBeVisible({ timeout: 5000 });

    // Fill category name
    const nameInput = page.locator('input[placeholder*="Hair"]').or(page.locator('input[required]')).first();
    await nameInput.fill(categoryName);

    await page.getByRole('button', { name: /add category/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(categoryName)).toBeVisible({ timeout: 5000 });
  });

  test('cancel category creation', async ({ page }) => {
    await page.getByRole('button', { name: /add category/i }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /cancel/i }).click();
    await page.waitForTimeout(300);

    // Modal should close
    await expect(page.getByRole('heading', { name: /add category/i })).not.toBeVisible();
  });

  test('display categories with item counts', async ({ page }) => {
    // Selfcare page should show auto-initialized categories
    // Look for common skincare category names or item count text
    await expect(page.getByText(/\d+ item/)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Selfcare Setup - Item Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/selfcare');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.getByRole('tab', { name: '⚙️ Setup' }).click();
    await page.waitForTimeout(500);
  });

  test('add item to existing category', async ({ page }) => {
    const itemName = `Test Item ${Date.now()}`;

    // Click first "+ Add" button in any category
    await page.getByRole('button', { name: '+ Add' }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: /add item/i })).toBeVisible({ timeout: 5000 });

    // Fill item name
    const nameInput = page.locator('input[required]').first();
    await nameInput.fill(itemName);

    await page.getByRole('button', { name: /add item/i }).last().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(itemName)).toBeVisible({ timeout: 5000 });
  });

  test('toggle item active state', async ({ page }) => {
    // Find first checkbox in items list
    const checkbox = page.locator('input[type="checkbox"]').first();
    const isChecked = await checkbox.isChecked();

    await checkbox.click();
    await page.waitForTimeout(500);

    // State should have toggled
    expect(await checkbox.isChecked()).toBe(!isChecked);
  });

  test('edit existing item', async ({ page }) => {
    // Click first Edit button
    const editButton = page.getByRole('button', { name: /^Edit$/i }).first();
    await editButton.click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: /edit item/i })).toBeVisible({ timeout: 5000 });

    // Modal should open with edit mode
    await page.getByRole('button', { name: /cancel/i }).click();
    await page.waitForTimeout(300);
  });

  test('cancel item creation', async ({ page }) => {
    await page.getByRole('button', { name: '+ Add' }).first().click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /cancel/i }).click();
    await page.waitForTimeout(300);

    await expect(page.getByRole('heading', { name: /add item/i })).not.toBeVisible();
  });
});

test.describe('Selfcare - Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/selfcare');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('displays page header', async ({ page }) => {
    await expect(page.getByText(/skincare routines/i)).toBeVisible();
  });

  test('displays ✨ emoji in header', async ({ page }) => {
    await expect(page.getByText('✨')).toBeVisible();
  });

  test('displays terracotta gradient header', async ({ page }) => {
    const header = page.locator('[style*="linear-gradient"]').first();
    await expect(header).toBeVisible();
  });

  test('switches between all tabs without error', async ({ page }) => {
    const tabs = ['routine', 'schedule', 'products', 'setup'];

    for (const tab of tabs) {
      await page.getByRole('tab', { name: new RegExp(tab, 'i') }).click();
      await page.waitForTimeout(300);
      // Page should not show an error
      await expect(page.locator('[data-testid="error"]')).not.toBeVisible();
    }
  });
});
