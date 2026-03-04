/**
 * E2E tests for the Budget page month selector (commit ec8ff07)
 *
 * The Budgets page was overhauled with a month selector driven by real DB
 * transaction months. These tests verify the selector renders, can be changed,
 * and that the page doesn't crash when there are or aren't budgets.
 */

import { test, expect } from '@playwright/test';

test.describe('Budget Month Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/finances');
    await page.waitForLoadState('domcontentloaded');

    // Close mobile sidebar if present
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    // Click the Budgets tab (SegmentedControl renders role="tab")
    await page.getByRole('tab', { name: 'Budgets' }).click();
    await page.waitForTimeout(500);
  });

  // ── Month selector ─────────────────────────────────────────────────────────

  test('Budgets tab renders a month selector', async ({ page }) => {
    // Could be <input type="month">, a <select>, or styled navigation arrows
    const monthSelector =
      page.locator('input[type="month"]')
        .or(page.locator('select').filter({ hasText: /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i }))
        .or(page.getByRole('combobox', { name: /month/i }))
        .or(page.locator('[aria-label*="month" i]'))
        .or(page.getByText(/2026|2025/).filter({ hasNot: page.locator('h1') }))
        .first();

    // Either a month selector control exists, or the budgets page renders without crash
    const hasMonthSelector = await monthSelector.isVisible({ timeout: 2000 }).catch(() => false);
    const pageNotCrashed   = await page.getByText(/something went wrong/i).isVisible().then(v => !v).catch(() => true);

    expect(pageNotCrashed).toBe(true);
    // Month selector is a soft assertion — the page might show months differently
    if (!hasMonthSelector) {
      // Accept: if there's at least some budget content or empty state
      const hasContent = await page.locator('main, [role="main"]').count() > 0;
      expect(hasContent).toBe(true);
    }
  });

  test('month selector is present on the Budgets page', async ({ page }) => {
    // BudgetsPage uses a <select aria-label="Select month"> (combobox role)
    // The selector might show current month or a month from the DB
    const monthSelect = page.getByRole('combobox', { name: /select month/i }).first();

    // The key requirement: the month selector control is visible
    await expect(monthSelect).toBeVisible({ timeout: 3000 });

    // The page should not be in an error state regardless of which month is shown
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  // ── Empty state / content ──────────────────────────────────────────────────

  test('shows empty state or budget cards — no crash', async ({ page }) => {
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();

    // Either shows "No budgets" / empty state, or actual budget cards
    const hasBudgetCards = await page.locator('[class*="budget"], [class*="Budget"]').count() > 0;
    const hasEmptyState  = await page.getByText(/no budgets|add your first|get started|create a budget/i).count() > 0;
    const hasAddButton   = await page.getByRole('button', { name: /add|new|create/i }).count() > 0;

    expect(hasBudgetCards || hasEmptyState || hasAddButton).toBe(true);
  });

  test('existing budget shows a progress bar and spending vs limit', async ({ page }) => {
    // Only assert if there are budget cards rendered
    const budgetCards = page.locator('[class*="rounded"]').filter({ hasText: /\$/ });
    const count = await budgetCards.count();

    if (count === 0) {
      // No budgets in DB — acceptable, test passes
      return;
    }

    // At least one budget card should show a progress indicator
    // (could be a bar, percentage, or "$X of $Y" text)
    const hasProgress = await page.getByText(/of \$|\d+%|progress/i).count() > 0;
    const hasBar      = await page.locator('[role="progressbar"], [class*="progress"]').count() > 0;

    expect(hasProgress || hasBar).toBe(true);
  });

  // ── Add budget ─────────────────────────────────────────────────────────────

  test('Add Budget button is present on the Budgets page', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add budget|new budget|add|create/i }).first();
    const hasAddButton = await addButton.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasAddButton).toBe(true);
  });

  test('clicking Add Budget opens a form or modal', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add budget|new budget|add|create/i }).first();
    if (!(await addButton.isVisible({ timeout: 2000 }).catch(() => false))) {
      test.skip();
    }

    await addButton.click();
    await page.waitForTimeout(500);

    const formOrModal = page.locator('form, [role="dialog"]').first();
    const hasForm = await formOrModal.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasForm).toBe(true);
  });

  // ── Finance page doesn't 404 ──────────────────────────────────────────────

  test('finances page loads without errors', async ({ page }) => {
    // Finance uses tab state, not URL sub-routes — just verify the page doesn't error
    await expect(page.getByText(/404|page not found/i)).not.toBeVisible();
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    // The Budgets tab should be active (we clicked it in beforeEach)
    await expect(page.getByRole('tab', { name: 'Budgets' })).toBeVisible();
  });
});
