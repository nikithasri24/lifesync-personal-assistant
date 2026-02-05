/**
 * E2E Tests for Finance Module Merged Mode
 *
 * Tests the complete user flow for couples using Finance in merged mode
 */

import { test, expect } from '@playwright/test';

test.describe('Finance Merged Mode', () => {

  test.beforeEach(async ({ page }) => {
    // Login and enable merged mode
    await page.goto('/login');
    // TODO: Add login steps
    // TODO: Enable finance merged mode permission
  });

  test('should show owner filter on all Finance pages', async ({ page }) => {
    const pages = [
      '/finances/transactions',
      '/finances/accounts',
      '/finances/budgets',
      '/finances/goals',
      '/finances/dashboard'
    ];

    for (const path of pages) {
      await page.goto(path);

      // Check if OwnerFilter is visible
      const ownerFilter = page.locator('select, button').filter({ hasText: /All|Mine|Partner/ });
      await expect(ownerFilter).toBeVisible();

      console.log(`✅ ${path} has owner filter`);
    }
  });

  test('should allow adding transaction on behalf of partner', async ({ page }) => {
    await page.goto('/finances/transactions');

    // Open Quick Add Transaction
    await page.click('button:has-text("Add Transaction")');

    // Fill in transaction details
    await page.fill('input[placeholder*="description"]', 'Partner Grocery Shopping');
    await page.fill('input[type="number"]', '125.50');

    // Check for owner selection dropdown (should only appear in merged mode)
    const ownerSelect = page.locator('select:has-text("Me"), select:has-text("Partner")');
    await expect(ownerSelect).toBeVisible();

    // Select partner
    await ownerSelect.selectOption(/Partner/);

    // Submit
    await page.click('button:has-text("Add Transaction")');

    // Verify success
    await expect(page.locator('text=/successfully|added/i')).toBeVisible();
  });

  test('should filter transactions by owner', async ({ page }) => {
    await page.goto('/finances/transactions');

    // Get total transaction count
    const allCount = await page.locator('[data-testid="transaction-row"]').count();

    // Filter to "Mine"
    await page.selectOption('select[data-testid="owner-filter"]', 'mine');
    const myCount = await page.locator('[data-testid="transaction-row"]').count();

    // Filter to "Partner"
    await page.selectOption('select[data-testid="owner-filter"]', 'partner');
    const partnerCount = await page.locator('[data-testid="transaction-row"]').count();

    // Verify filtering works
    expect(myCount + partnerCount).toBeLessThanOrEqual(allCount);

    console.log(`Total: ${allCount}, Mine: ${myCount}, Partner: ${partnerCount}`);
  });

  test('should allow creating shared goal', async ({ page }) => {
    await page.goto('/finances/goals');

    // Click Create Goal
    await page.click('button:has-text("Create Goal")');

    // Fill in goal details
    await page.fill('input[placeholder*="name"]', 'House Down Payment');
    await page.fill('input[type="number"]', '100000');
    await page.fill('input[type="date"]', '2027-12-31');

    // Check for shared goal checkbox (should only appear in merged mode)
    const sharedCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /shared goal/i });
    await expect(sharedCheckbox).toBeVisible();

    // Check the shared goal option
    await sharedCheckbox.check();

    // Submit
    await page.click('button:has-text("Save")');

    // Verify goal was created
    await expect(page.locator('text=/House Down Payment/i')).toBeVisible();
  });

  test('should persist owner filter selection across navigation', async ({ page }) => {
    await page.goto('/finances/transactions');

    // Set filter to "Mine"
    await page.selectOption('select[data-testid="owner-filter"]', 'mine');

    // Navigate away and back
    await page.goto('/finances/accounts');
    await page.goto('/finances/transactions');

    // Check if filter is still "Mine"
    const filterValue = await page.locator('select[data-testid="owner-filter"]').inputValue();
    expect(filterValue).toBe('mine');
  });

  test('should display owner badges on all entities', async ({ page }) => {
    await page.goto('/finances/dashboard');

    // Check for owner badges on accounts, transactions, budgets, goals
    const ownerBadges = page.locator('[data-testid="owner-badge"], .owner-badge, text=/Me|Partner/i');
    const badgeCount = await ownerBadges.count();

    expect(badgeCount).toBeGreaterThan(0);
    console.log(`Found ${badgeCount} owner badges on dashboard`);
  });

  test('should show split metrics in merged mode', async ({ page }) => {
    await page.goto('/finances/dashboard');

    // Look for split metrics (only visible in merged mode when filter is "All")
    const splitMetrics = page.locator('text=/My spending|Partner spending|Household/i');
    await expect(splitMetrics.first()).toBeVisible();
  });

  test('should allow creating account on behalf of partner', async ({ page }) => {
    await page.goto('/finances/dashboard');

    // Click Add Account
    await page.click('button:has-text("Add Account")');

    // Fill in account details
    await page.fill('input[placeholder*="account name"]', 'Partner Checking');
    await page.selectOption('select', 'checking');
    await page.fill('input[type="number"]', '5000');

    // Check for owner selection (should appear in merged mode)
    const ownerSelect = page.locator('select:has-text("Me"), select:has-text("Partner")');
    await expect(ownerSelect).toBeVisible();

    // Select partner
    await ownerSelect.selectOption(/Partner/);

    // Submit
    await page.click('button:has-text("Save")');

    // Verify account was created
    await expect(page.locator('text=/Partner Checking/i')).toBeVisible();
  });

});

test.describe('Finance Non-Merged Mode', () => {

  test('should NOT show owner filter when not in merged mode', async ({ page }) => {
    // TODO: Login as user without merged mode enabled
    await page.goto('/finances/transactions');

    // Owner filter should not be visible
    const ownerFilter = page.locator('[data-testid="owner-filter"]');
    await expect(ownerFilter).not.toBeVisible();
  });

  test('should NOT show owner selection in modals when not merged', async ({ page }) => {
    await page.goto('/finances/transactions');

    // Open Quick Add Transaction
    await page.click('button:has-text("Add Transaction")');

    // Owner selection should not be visible
    const ownerSelect = page.locator('select:has-text("Who made this purchase")');
    await expect(ownerSelect).not.toBeVisible();
  });

});
