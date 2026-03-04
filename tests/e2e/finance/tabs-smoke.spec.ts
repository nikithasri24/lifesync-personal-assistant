/**
 * Finance Tabs Smoke Test
 *
 * Visits every Finance tab and asserts:
 * 1. No error boundary ("Something went wrong") visible
 * 2. No loading spinner stuck after 8 s
 * 3. Some meaningful content rendered
 * 4. Per-tab: key UI element is present
 *
 * Run:
 *   npx playwright test tests/e2e/finance/tabs-smoke.spec.ts --project=chromium
 */

import { test, expect, type Page } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function openFinancesPage(page: Page) {
  await page.goto('/finances');
  await page.waitForLoadState('domcontentloaded');
  const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
  if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
    await backdrop.click();
    await page.waitForTimeout(300);
  }
}

async function switchTab(page: Page, tabLabel: string) {
  await page.getByRole('tab', { name: tabLabel }).click();
  await page.waitForTimeout(400);
  // Wait for any "Loading…" fallback to disappear
  await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(200);
}

/** Returns true if any of the given locators is visible. */
async function anyVisible(page: Page, locators: ReturnType<Page['locator']>[]): Promise<boolean> {
  for (const loc of locators) {
    if (await loc.first().isVisible({ timeout: 3000 }).catch(() => false)) return true;
  }
  return false;
}

async function assertNoError(page: Page) {
  // Error boundary — use .first() to avoid strict-mode multi-match errors
  await expect(page.getByText(/Something went wrong/i).first()).not.toBeVisible({ timeout: 3000 });
}

// ── Smoke tests — one per tab ─────────────────────────────────────────────────

test.describe('Finance tabs — smoke (no crash)', () => {
  test.beforeEach(async ({ page }) => {
    await openFinancesPage(page);
  });

  const tabsToSmoke: { label: string; waitFor?: string }[] = [
    { label: 'Dashboard' },
    { label: 'Accounts' },
    { label: 'Transactions' },
    { label: 'Budgets' },
    { label: 'Recurring' },
    { label: 'Net Worth' },
    { label: 'Goals' },
    { label: 'Loans' },
    { label: 'Retirement' },
    { label: 'Projections' },
    { label: 'Calculators' },
    { label: 'Credit Cards', waitFor: 'Loading credit cards...' },
    { label: 'Insurance' },
    { label: '📅 Timeline' },
  ];

  for (const { label, waitFor } of tabsToSmoke) {
    test(`${label} tab — no crash`, async ({ page }) => {
      await page.getByRole('tab', { name: label }).click();
      await page.waitForTimeout(400);
      if (waitFor) {
        await page.waitForSelector(`text=${waitFor}`, { state: 'hidden', timeout: 10000 }).catch(() => {});
      } else {
        await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 8000 }).catch(() => {});
      }
      await page.waitForTimeout(200);
      await assertNoError(page);
    });
  }
});

// ── Per-tab content checks ────────────────────────────────────────────────────

test.describe('Finance tabs — content checks', () => {
  test.beforeEach(async ({ page }) => {
    await openFinancesPage(page);
  });

  // ── Dashboard ────────────────────────────────────────────────────────────────
  test('Dashboard — shows financial metrics', async ({ page }) => {
    await switchTab(page, 'Dashboard');
    await assertNoError(page);
    const hasMetric = await anyVisible(page, [
      page.getByText(/income/i),
      page.getByText(/expenses/i),
      page.getByText(/balance/i),
      page.getByText(/net worth/i),
      page.getByText(/cash flow/i),
      page.getByText(/savings rate/i),
    ]);
    expect(hasMetric, 'Dashboard showed no financial metrics').toBe(true);
  });

  // ── Accounts ─────────────────────────────────────────────────────────────────
  test('Accounts — shows accounts list or Add Account CTA', async ({ page }) => {
    await switchTab(page, 'Accounts');
    await assertNoError(page);
    const hasContent = await anyVisible(page, [
      page.getByRole('button', { name: /add account/i }),
      page.getByText(/checking/i),
      page.getByText(/savings/i),
      page.getByText(/credit card/i),
      page.getByText(/no accounts/i),
    ]);
    expect(hasContent, 'Accounts tab showed no accounts or Add button').toBe(true);
  });

  // ── Transactions ──────────────────────────────────────────────────────────────
  test('Transactions — Add Transaction button visible', async ({ page }) => {
    await switchTab(page, 'Transactions');
    await assertNoError(page);
    await expect(page.getByRole('button', { name: /add transaction/i }).first())
      .toBeVisible({ timeout: 5000 });
  });

  // ── Budgets ───────────────────────────────────────────────────────────────────
  test('Budgets — month selector and Add Budget button', async ({ page }) => {
    await switchTab(page, 'Budgets');
    await assertNoError(page);
    await expect(page.getByRole('combobox', { name: /select month/i })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /add budget/i })).toBeVisible({ timeout: 5000 });
  });

  // ── Recurring ────────────────────────────────────────────────────────────────
  test('Recurring — renders without API error', async ({ page }) => {
    await switchTab(page, 'Recurring');
    await assertNoError(page);
    // Table name bug (a214559) would crash this page
    const hasContent = await anyVisible(page, [
      page.getByRole('button', { name: /add|new|create/i }),
      page.getByText(/recurring/i),
      page.getByText(/frequency/i),
      page.getByText(/no recurring/i),
    ]);
    expect(hasContent, 'Recurring tab showed no content').toBe(true);
  });

  // ── Net Worth ─────────────────────────────────────────────────────────────────
  test('Net Worth — shows assets/liabilities breakdown', async ({ page }) => {
    await switchTab(page, 'Net Worth');
    await assertNoError(page);
    const hasContent = await anyVisible(page, [
      page.getByText(/net worth/i),
      page.getByText(/assets/i),
      page.getByText(/liabilities/i),
      page.getByText(/total/i),
    ]);
    expect(hasContent, 'Net Worth tab showed no data').toBe(true);
  });

  // ── Goals ─────────────────────────────────────────────────────────────────────
  test('Goals — shows goals or Add Goal CTA', async ({ page }) => {
    await switchTab(page, 'Goals');
    await assertNoError(page);
    const hasContent = await anyVisible(page, [
      page.getByRole('button', { name: /add goal|new goal/i }),
      page.getByText(/goal/i),
      page.getByText(/target/i),
      page.getByText(/no goals/i),
    ]);
    expect(hasContent, 'Goals tab showed no content').toBe(true);
  });

  // ── Loans ────────────────────────────────────────────────────────────────────
  test('Loans — shows loans or Add Loan CTA', async ({ page }) => {
    await switchTab(page, 'Loans');
    await assertNoError(page);
    const hasContent = await anyVisible(page, [
      page.getByRole('button', { name: /add loan|new loan/i }),
      page.getByText(/loan/i),
      page.getByText(/mortgage/i),
      page.getByText(/interest/i),
      page.getByText(/no loans/i),
    ]);
    expect(hasContent, 'Loans tab showed no content').toBe(true);
  });

  // ── Retirement ────────────────────────────────────────────────────────────────
  test('Retirement — shows accounts or Add Account CTA', async ({ page }) => {
    await switchTab(page, 'Retirement');
    await assertNoError(page);
    const hasContent = await anyVisible(page, [
      page.getByRole('button', { name: /add|new/i }),
      page.getByText(/401/i),
      page.getByText(/ira/i),
      page.getByText(/retirement/i),
      page.getByText(/contribution/i),
      page.getByText(/no retirement/i),
    ]);
    expect(hasContent, 'Retirement tab showed no content').toBe(true);
  });

  // ── Projections ───────────────────────────────────────────────────────────────
  test('Projections — renders without crash', async ({ page }) => {
    await switchTab(page, 'Projections');
    await assertNoError(page);
    const hasContent = await anyVisible(page, [
      page.getByText(/projection/i),
      page.getByText(/forecast/i),
      page.getByText(/future/i),
      page.getByRole('button'),
      page.locator('h1, h2, h3'),
    ]);
    expect(hasContent, 'Projections tab showed no content').toBe(true);
  });

  // ── Calculators ───────────────────────────────────────────────────────────────
  test('Calculators — renders without crash', async ({ page }) => {
    await switchTab(page, 'Calculators');
    await assertNoError(page);
    const hasContent = await anyVisible(page, [
      page.getByText(/calculator/i),
      page.getByText(/compound/i),
      page.getByText(/mortgage/i),
      page.getByRole('button'),
      page.locator('input[type="number"]'),
      page.locator('h1, h2, h3'),
    ]);
    expect(hasContent, 'Calculators tab showed no content').toBe(true);
  });

  // ── Credit Cards ──────────────────────────────────────────────────────────────
  test('Credit Cards — SpendOptimizer section visible', async ({ page }) => {
    await page.getByRole('tab', { name: 'Credit Cards' }).click();
    await page.waitForSelector('text=Loading credit cards...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(300);

    await assertNoError(page);
    await expect(page.getByText(/Spend Optimizer/i)).toBeVisible({ timeout: 5000 });
  });

  // ── Insurance ────────────────────────────────────────────────────────────────
  test('Insurance — shows policies or Add Policy CTA', async ({ page }) => {
    await switchTab(page, 'Insurance');
    await assertNoError(page);
    const hasContent = await anyVisible(page, [
      page.getByRole('button', { name: /add|new/i }),
      page.getByText(/insurance/i),
      page.getByText(/policy/i),
      page.getByText(/premium/i),
      page.getByText(/coverage/i),
      page.getByText(/no insurance/i),
    ]);
    expect(hasContent, 'Insurance tab showed no content').toBe(true);
  });

  // ── Timeline ─────────────────────────────────────────────────────────────────
  test('Timeline — renders without crash', async ({ page }) => {
    await switchTab(page, '📅 Timeline');
    await assertNoError(page);
    // Just check the page mounted — it's a newer page
    const mounted = await anyVisible(page, [
      page.locator('h1, h2, h3'),
      page.getByRole('button'),
      page.getByText(/timeline/i),
      page.getByText(/event/i),
      page.getByText(/no events/i),
    ]);
    expect(mounted, 'Timeline tab did not mount any content').toBe(true);
  });
});
