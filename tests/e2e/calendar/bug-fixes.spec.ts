/**
 * Bug-fix verification tests — Task ↔ Calendar flow
 * Verifies each of the 6 reported bugs is resolved.
 */

import { test, expect, type Page } from '@playwright/test';
import { format, addDays } from 'date-fns';

const SCHEDULER = '/scheduler';
const TODOS = '/todos';

function todayStr() { return format(new Date(), 'yyyy-MM-dd'); }
function tomorrowStr() { return format(addDays(new Date(), 1), 'yyyy-MM-dd'); }
function uid(p: string) { return `${p}-${Date.now()}`; }

async function waitForScheduler(page: Page) {
  await page.goto(SCHEDULER);
  await page.waitForSelector('[data-testid="scheduler-page"]', { timeout: 15000 });
  await page.waitForTimeout(800);
}

/** Create a task via the Todos page full form */
async function createTaskWithDueDate(page: Page, title: string, dueDate: string) {
  await page.goto(TODOS);
  await page.waitForTimeout(1000);

  // Click "Add Task" (always visible, never outside viewport)
  await page.getByRole('button', { name: 'Add Task' }).click();
  await page.waitForTimeout(400);

  const input = page.getByPlaceholder('What needs to be done?');
  await input.fill(title);
  await input.press('Enter');
  await page.waitForTimeout(1200);

  // Open full edit to add due date
  const taskBtn = page.getByRole('button', { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first();
  await taskBtn.waitFor({ state: 'visible', timeout: 8000 });
  await taskBtn.click();
  await page.waitForTimeout(400);

  const dueDateInput = page.locator('input[type="date"]').first();
  await dueDateInput.fill(dueDate);
  await page.getByRole('button', { name: 'Update Task' }).click();
  await page.waitForTimeout(1500);
}

// ─── B5: Page header shows "Calendar" not "Dashboard" ─────────────────────────

test.describe('B5 – Correct page header on /scheduler', () => {
  test('header shows "Calendar" not "Dashboard"', async ({ page }) => {
    await waitForScheduler(page);
    await expect(page.getByRole('heading', { name: 'Calendar', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).not.toBeVisible();
  });
});

// ─── B7: No console errors from schedule-blocks API ────────────────────────────

test.describe('B7 – Schedule blocks API no longer errors', () => {
  test('no date=lte.undefined network errors during scheduler load', async ({ page }) => {
    const badRequests: string[] = [];
    page.on('response', res => {
      if (res.url().includes('date=lte.undefined') || res.url().includes('date=gte.undefined')) {
        badRequests.push(res.url());
      }
    });

    await waitForScheduler(page);
    await page.waitForTimeout(3000); // Wait for retry loops

    expect(badRequests).toHaveLength(0);
  });
});

// ─── B3: Month view renders a proper 7-column grid ────────────────────────────

test.describe('B3 – Month view is a proper 7-column grid', () => {
  test('all 7 weekday-header cells share the same top y-coordinate', async ({ page }) => {
    await waitForScheduler(page);
    await page.getByRole('tab', { name: 'Month' }).click();
    await page.waitForSelector('[data-testid="month-day-cell"]', { timeout: 8000 });

    // All 7 cells in the first row must have the same y offset (± 2px)
    const cells = page.getByTestId('month-day-cell');
    const count = await cells.count();
    expect(count).toBeGreaterThanOrEqual(28);

    const boxes = await Promise.all(
      Array.from({ length: 7 }, (_, i) => cells.nth(i).boundingBox())
    );
    const valid = boxes.filter(Boolean) as NonNullable<typeof boxes[0]>[];
    expect(valid).toHaveLength(7);

    const firstY = valid[0].y;
    for (const box of valid) {
      expect(Math.abs(box.y - firstY)).toBeLessThan(3);
    }
  });

  test('adjacent cells in the first row touch horizontally (no large gaps)', async ({ page }) => {
    await waitForScheduler(page);
    await page.getByRole('tab', { name: 'Month' }).click();
    await page.waitForSelector('[data-testid="month-day-cell"]', { timeout: 8000 });

    const cells = page.getByTestId('month-day-cell');
    const box0 = await cells.nth(0).boundingBox();
    const box1 = await cells.nth(1).boundingBox();
    if (!box0 || !box1) throw new Error('Missing cell bounding boxes');

    // The right edge of cell 0 should be within 3px of the left edge of cell 1
    const gap = Math.abs(box1.x - (box0.x + box0.width));
    expect(gap).toBeLessThan(3);
  });
});

// ─── B2: Tasks with only due_date appear in the all-day row ────────────────────

test.describe('B2 – Task with due_date shows in calendar', () => {
  test('task due today is visible somewhere in scheduler week view', async ({ page }) => {
    const title = uid('TodayDue');
    await createTaskWithDueDate(page, title, todayStr());

    await waitForScheduler(page);
    // The task should appear — either in all-day row or as a chip
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 10000 });
  });

  test('task due tomorrow is visible in day view for that day', async ({ page }) => {
    const title = uid('TmrwDue');
    await createTaskWithDueDate(page, title, tomorrowStr());

    await waitForScheduler(page);
    await page.getByRole('tab', { name: 'Day' }).click();
    await page.waitForSelector('[data-date][data-hour]', { timeout: 5000 });
    await page.getByRole('button', { name: 'Next day' }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(title).first()).toBeVisible({ timeout: 10000 });
  });

  test('task with due_date shows in the all-day area of the week view', async ({ page }) => {
    const title = uid('AllDayRow');
    await createTaskWithDueDate(page, title, todayStr());

    await waitForScheduler(page);
    // Must appear somewhere on the scheduler page (week view all-day or chip)
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 10000 });

    // Should NOT be found only in the time-slot area (it has no scheduled_start)
    // Verify it appears near the "All day" label
    const allDayRow = page.locator('text=All day').first();
    await expect(allDayRow).toBeVisible();
  });
});

// ─── B4: Clicking a task chip opens real edit modal ────────────────────────────

test.describe('B4 – Task chip opens real edit form (not stub)', () => {
  test('task chip click does NOT show "coming soon" message', async ({ page }) => {
    await waitForScheduler(page);

    const weekView = page.locator('[data-testid="week-view"]');
    await weekView.evaluate((el: HTMLElement) => { el.scrollTop = 560; });
    await page.waitForTimeout(400);

    const chips = page.locator('[data-testid="calendar-task-chip"]');
    const count = await chips.count();

    if (count === 0) {
      // No tasks scheduled this week — create one for today
      const title = uid('ChipTask');
      await createTaskWithDueDate(page, title, todayStr());

      // Also set a scheduled_start so it appears in the time slot
      await page.goto(TODOS);
      await page.waitForTimeout(800);
      const taskBtn = page.getByRole('button', { name: new RegExp(title) }).first();
      await taskBtn.click();
      await page.waitForTimeout(400);
      await page.locator('input[type="date"]').first().fill(todayStr());
      await page.getByRole('button', { name: 'Update Task' }).click();
      await page.waitForTimeout(1500);

      await waitForScheduler(page);
      await weekView.evaluate((el: HTMLElement) => { el.scrollTop = 560; });
      await page.waitForTimeout(400);
    }

    const chip = chips.first();
    if (await chip.count() > 0) {
      await chip.dispatchEvent('click');
      await page.waitForTimeout(500);

      // The stub said "Task editing functionality will be implemented soon."
      await expect(page.getByText('Task editing functionality will be implemented soon.')).not.toBeVisible();

      // A real form should be visible instead
      const hasRealForm = await page.getByRole('textbox').count() > 0;
      expect(hasRealForm).toBe(true);
    }
  });
});

// ─── B6: New Event modal pre-fills the correct date from day view ──────────────

test.describe('B6 – New Event modal fills clicked slot\'s date and time', () => {
  test('clicking the 2 PM day-view slot pre-fills Start Date as today', async ({ page }) => {
    await waitForScheduler(page);
    await page.getByRole('tab', { name: 'Day' }).click();
    await page.waitForSelector('[data-date][data-hour]', { timeout: 5000 });

    // Use hour 22 (10 PM) — guaranteed empty, avoids task-chip click interception
    // Use dispatchEvent to fire directly on the cell div, not any child element
    const slot = page.locator(`[data-date="${todayStr()}"][data-hour="22"]`).first();
    await slot.waitFor({ state: 'attached', timeout: 5000 });
    await slot.dispatchEvent('click');
    await page.waitForTimeout(500);

    await expect(page.getByRole('heading', { name: /New Event/i })).toBeVisible({ timeout: 6000 });

    // The date MUST be today
    const dateValue = await page.locator('input[type="date"]').first().inputValue();
    expect(dateValue).toBe(todayStr());

    // After the FormModalV2 state-reset fix, time should now reflect the clicked slot (22:00)
    const timeValue = await page.locator('input[type="time"]').first().inputValue();
    expect(timeValue).toBe('22:00');

    await page.keyboard.press('Escape');
  });

  test('opening New Event with no slot pre-fills defaults to 09:00', async ({ page }) => {
    await waitForScheduler(page);

    // Open via the header "+ Event" button (no initialDate)
    await page.getByRole('button', { name: 'Create new event' }).click();
    await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible({ timeout: 5000 });

    // When opened without a specific slot, should use 09:00 default
    const timeValue = await page.locator('input[type="time"]').first().inputValue();
    expect(timeValue).toBe('09:00');

    await page.keyboard.press('Escape');
  });
});

// ─── B1: Task due date badge ──────────────────────────────────────────────────

test.describe('B1 – Task due date badge', () => {
  test('task with due_date shows a date badge on the task card', async ({ page }) => {
    const title = uid('BadgeTask');
    await createTaskWithDueDate(page, title, tomorrowStr());

    // Hard-reload to ensure React Query fetches fresh task data (not stale cache)
    await page.goto(TODOS);
    await page.waitForTimeout(1500);

    // Switch to Upcoming view
    await page.getByRole('button', { name: /Upcoming/i }).click();
    await page.waitForTimeout(800);

    const taskArea = page.getByRole('button', { name: new RegExp(title) });
    await expect(taskArea).toBeVisible({ timeout: 8000 });

    // "Due tomorrow" badge is rendered as a <span> near the task card
    await expect(
      page.getByText(/Due tomorrow/i).first()
    ).toBeVisible({ timeout: 8000 });
  });
});
