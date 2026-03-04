/**
 * Non-Finance Pages Smoke Test
 *
 * Visits every app route and asserts:
 * 1. Page loads without an error boundary crash
 * 2. Page has meaningful content (not a blank white screen)
 * 3. Key UI element expected for that page is visible
 *
 * Run:
 *   npx playwright test tests/e2e/pages-smoke.spec.ts --project=chromium
 */

import { test, expect, type Page } from '@playwright/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

async function nav(page: Page, path: string) {
  await page.goto(path);
  // networkidle waits for Supabase fetches + React lazy chunks to complete
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() =>
    page.waitForLoadState('domcontentloaded')
  );
  // Dismiss mobile sidebar if present
  const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
  if (await backdrop.isVisible({ timeout: 800 }).catch(() => false)) {
    await backdrop.click();
    await page.waitForTimeout(200);
  }
  // Belt-and-suspenders: if loading text is still visible, wait for it to clear
  const isLoading = await page.getByText(/Loading page\.\.\.|Loading\.\.\./).first()
    .isVisible({ timeout: 500 }).catch(() => false);
  if (isLoading) {
    await page.waitForSelector('text=/Loading page\\.\\.\\.|Loading\\.\\.\\./', { state: 'hidden', timeout: 10000 }).catch(() => {});
  }
  await page.waitForTimeout(200);
}

async function assertNoError(page: Page) {
  await expect(page.getByText(/Something went wrong/i).first()).not.toBeVisible({ timeout: 3000 });
  await expect(page.getByText(/Minified React error/i).first()).not.toBeVisible();
}

async function anyVisible(page: Page, locators: ReturnType<Page['locator']>[]): Promise<boolean> {
  for (const loc of locators) {
    if (await loc.first().isVisible({ timeout: 3000 }).catch(() => false)) return true;
  }
  return false;
}

// ── Smoke suite ───────────────────────────────────────────────────────────────

test.describe('App pages — no crash', () => {
  const routes = [
    '/',
    '/assistant',
    '/calendar',
    '/focus',
    '/habits',
    '/todos',
    '/notes',
    '/projects',
    '/journal',
    '/self-care',
    '/goals',
    '/travel',
    '/shopping',
    '/meals',
    '/nutrition',
    '/together',
    '/shared',
    '/more',
  ];

  for (const route of routes) {
    test(`${route} — no crash`, async ({ page }) => {
      await nav(page, route);
      await assertNoError(page);
    });
  }
});

// ── Per-page content checks ───────────────────────────────────────────────────

test.describe('App pages — content checks', () => {
  test('Dashboard — shows greeting or overview', async ({ page }) => {
    await nav(page, '/');
    await assertNoError(page);
    const ok = await anyVisible(page, [
      page.getByText(/good morning|good afternoon|good evening/i),
      page.getByText(/overview|dashboard/i),
      page.getByText(/today/i),
      page.getByText(/habit/i),
      page.getByText(/task/i),
    ]);
    expect(ok, 'Dashboard showed no greeting or overview').toBe(true);
  });

  test('AI Assistant — shows input or greeting', async ({ page }) => {
    await nav(page, '/assistant');
    await assertNoError(page);
    const ok = await anyVisible(page, [
      page.locator('textarea, input[type="text"]').filter({ hasText: '' }),
      page.getByPlaceholder(/ask|message|type/i),
      page.getByText(/assistant|hello|hi|how can/i),
      page.getByRole('button', { name: /send|submit/i }),
    ]);
    expect(ok, 'Assistant showed no input or greeting').toBe(true);
  });

  test('Calendar — shows calendar grid or events', async ({ page }) => {
    await nav(page, '/calendar');
    await assertNoError(page);
    const ok = await anyVisible(page, [
      page.getByRole('grid'),
      page.getByText(/january|february|march|april|may|june|july|august|september|october|november|december/i),
      page.getByText(/today/i),
      page.getByRole('button', { name: /add event|new event/i }),
      page.locator('[class*="calendar"]'),
    ]);
    expect(ok, 'Calendar showed no grid or events').toBe(true);
  });

  test('Focus — shows timer or focus session UI', async ({ page }) => {
    await nav(page, '/focus');
    await assertNoError(page);
    const ok = await anyVisible(page, [
      page.getByText(/focus|pomodoro|timer|session/i),
      page.getByRole('button', { name: /start|pause|stop|focus/i }),
      page.locator('[class*="timer"]'),
      page.getByText(/\d+:\d+/),  // timer display like "25:00"
    ]);
    expect(ok, 'Focus showed no timer or session UI').toBe(true);
  });

  test('Habits — shows habit list or Add Habit button', async ({ page }) => {
    await nav(page, '/habits');
    await assertNoError(page);
    const ok = await anyVisible(page, [
      page.getByRole('button', { name: /add habit|new habit/i }),
      page.getByText(/habit/i),
      page.getByText(/streak/i),
      page.getByText(/today/i),
      page.getByText(/no habits/i),
    ]);
    expect(ok, 'Habits showed no habits or Add Habit button').toBe(true);
  });

  test('Tasks/Todos — shows tasks or Add Task button', async ({ page }) => {
    await nav(page, '/todos');
    await assertNoError(page);
    const ok = await anyVisible(page, [
      page.getByRole('button', { name: /add task|new task/i }),
      page.getByText(/task/i),
      page.getByText(/todo/i),
      page.getByText(/no tasks/i),
      page.getByText(/all tasks/i),
      page.locator('[class*="task"]'),
    ]);
    expect(ok, 'Tasks showed no tasks or Add Task button').toBe(true);
  });

  test('Notes — shows notes or Add Note button', async ({ page }) => {
    await nav(page, '/notes');
    await assertNoError(page);
    const ok = await anyVisible(page, [
      page.getByRole('button', { name: /add note|new note/i }),
      page.getByText(/note/i),
      page.getByText(/no notes/i),
      page.locator('[class*="note"]'),
    ]);
    expect(ok, 'Notes showed no notes or Add Note button').toBe(true);
  });

  test('Projects — shows projects or Add Project button', async ({ page }) => {
    await nav(page, '/projects');
    await assertNoError(page);
    const ok = await anyVisible(page, [
      page.getByRole('button', { name: /add project|new project/i }),
      page.getByText(/project/i),
      page.getByText(/no projects/i),
      page.locator('[class*="project"]'),
    ]);
    expect(ok, 'Projects showed no projects or Add Project button').toBe(true);
  });

  test('Journal — shows journal entries or New Entry button', async ({ page }) => {
    await nav(page, '/journal');
    await assertNoError(page);
    const ok = await anyVisible(page, [
      page.getByRole('button', { name: /new entry|add entry|write/i }),
      page.getByText(/journal/i),
      page.getByText(/entry|entries/i),
      page.getByText(/no entries/i),
      page.getByText(/today/i),
    ]);
    expect(ok, 'Journal showed no entries or New Entry button').toBe(true);
  });

  test('Self Care — shows routines or Add Routine button', async ({ page }) => {
    await nav(page, '/self-care');
    await assertNoError(page);
    const ok = await anyVisible(page, [
      page.getByRole('button', { name: /add|new/i }),
      page.getByText(/self.?care|routine|skin|wellness/i),
      page.getByText(/no routines/i),
      page.locator('h1, h2'),
    ]);
    expect(ok, 'Self Care showed no routines or UI').toBe(true);
  });

  test('Life Goals — shows goals or Add Goal button', async ({ page }) => {
    await nav(page, '/goals');
    await assertNoError(page);
    const ok = await anyVisible(page, [
      page.getByRole('button', { name: /add goal|new goal/i }),
      page.getByText(/goal/i),
      page.getByText(/dream|vision|milestone/i),
      page.getByText(/no goals/i),
    ]);
    expect(ok, 'Life Goals showed no goals or Add Goal button').toBe(true);
  });

  test('Travel — shows trips or Add Trip button', async ({ page }) => {
    await nav(page, '/travel');
    await assertNoError(page);
    const ok = await anyVisible(page, [
      page.getByRole('button', { name: /add trip|new trip|plan/i }),
      page.getByText(/trip|travel|destination|itinerary/i),
      page.getByText(/no trips/i),
    ]);
    expect(ok, 'Travel showed no trips or Add Trip button').toBe(true);
  });

  test('Shopping — shows lists or Add Item button', async ({ page }) => {
    await nav(page, '/shopping');
    await assertNoError(page);
    const ok = await anyVisible(page, [
      page.getByRole('button', { name: /add item|add|new/i }),
      page.getByText(/shopping|grocery|list|item/i),
      page.getByText(/no items/i),
      page.getByText(/pantry/i),
    ]);
    expect(ok, 'Shopping showed no items or Add button').toBe(true);
  });

  test('Meal Planning — shows meal plan or plan meals button', async ({ page }) => {
    await nav(page, '/meals');
    await assertNoError(page);
    const ok = await anyVisible(page, [
      page.getByRole('button', { name: /plan|add meal|add/i }),
      page.getByText(/meal|breakfast|lunch|dinner|week/i),
      page.getByText(/no meals/i),
      page.getByText(/monday|tuesday|wednesday|thursday|friday|saturday|sunday/i),
    ]);
    expect(ok, 'Meal Planning showed no meal plan').toBe(true);
  });

  test('Nutrition — shows diary or log button', async ({ page }) => {
    await nav(page, '/nutrition');
    await assertNoError(page);
    const ok = await anyVisible(page, [
      page.getByRole('button', { name: /log|add|track/i }),
      page.getByText(/nutrition|calorie|protein|carb|macro/i),
      page.getByText(/food diary|daily log/i),
      page.getByText(/no entries/i),
    ]);
    expect(ok, 'Nutrition showed no food diary or log button').toBe(true);
  });

  test('Together — shows partner connection or activities', async ({ page }) => {
    await nav(page, '/together');
    await assertNoError(page);
    const ok = await anyVisible(page, [
      page.getByText(/together/i),
      page.getByText(/partner|connect|shared/i),
      page.getByText(/activity|challenge/i),
      page.locator('h1, h2'),
    ]);
    expect(ok, 'Together showed no content').toBe(true);
  });

  test('More — shows additional pages or settings', async ({ page }) => {
    await nav(page, '/more');
    await assertNoError(page);
    const ok = await anyVisible(page, [
      page.getByText(/more|settings|profile|account/i),
      page.locator('h1, h2'),
      page.getByRole('link'),
      page.getByRole('button'),
    ]);
    expect(ok, 'More page showed no content').toBe(true);
  });
});
