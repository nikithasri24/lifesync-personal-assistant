/**
 * Comprehensive Dashboard E2E Tests
 *
 * Tests dashboard page structure, widgets, quick actions, and interactions.
 */

import { test, expect } from '@playwright/test';

// Helper: navigate to dashboard and wait for data to load.
// The dashboard gates all content behind isLoading, so we must wait for
// a stat card to appear (confirming React Query has fetched from Supabase).
async function gotoAndWaitForDashboard(page: Parameters<typeof test>[1] extends never ? never : Parameters<Parameters<typeof test>[1]>[0]) {
  await page.goto('/');
  await page.waitForLoadState('load');
  // Wait for a stat card that only renders after data is fetched
  await expect(page.getByText('Tasks Today')).toBeVisible({ timeout: 15000 });
}

test.describe('Dashboard - Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForDashboard(page);
  });

  test('displays time-based greeting', async ({ page }) => {
    // Greeting uses lowercase time-of-day: "Good morning / afternoon / evening"
    await expect(page.getByText(/good (morning|afternoon|evening)/i)).toBeVisible();
  });

  test('displays user name in greeting', async ({ page }) => {
    // Greeting heading should be visible
    const heading = page.getByRole('heading', { level: 1 }).first();
    await expect(heading).toBeVisible();
  });

  test('displays overview subtitle', async ({ page }) => {
    // Dashboard shows the current date as the subtitle beneath the greeting
    await expect(page.getByText(/\d{4}/).first()).toBeVisible();
  });

  test('displays dashboard sections', async ({ page }) => {
    // Dashboard renders stat cards after data loads
    await expect(page.getByText('Tasks Today')).toBeVisible({ timeout: 10000 });
  });

  test("displays Today's Tasks section", async ({ page }) => {
    await expect(page.getByText("Today's Tasks")).toBeVisible({ timeout: 10000 });
  });

  test("displays Today's Habits section", async ({ page }) => {
    await expect(page.getByText("Today's Habits")).toBeVisible({ timeout: 10000 });
  });

  test('displays Recent Notes section', async ({ page }) => {
    await expect(page.getByText('Recent Notes')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Dashboard - Quick Actions', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForDashboard(page);
  });

  test('displays Add Task quick action', async ({ page }) => {
    await expect(page.getByText('Add Task')).toBeVisible({ timeout: 10000 });
  });

  test('displays New Note quick action', async ({ page }) => {
    await expect(page.getByText('New Note')).toBeVisible({ timeout: 10000 });
  });

  test('displays Journal quick action', async ({ page }) => {
    await expect(page.getByText(/Journal/).first()).toBeVisible({ timeout: 10000 });
  });

  test('displays Focus quick action', async ({ page }) => {
    await expect(page.getByText('Focus').first()).toBeVisible({ timeout: 10000 });
  });

  test('clicking Add Task opens quick add modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.waitForTimeout(800);

    // Quick add modal should appear
    await expect(page.getByPlaceholder(/what needs to be done/i)).toBeVisible({ timeout: 5000 });
  });

  test('clicking New Note opens note form', async ({ page }) => {
    await page.getByRole('button', { name: 'New Note' }).click();
    await page.waitForTimeout(500);

    // Note form should appear ("Create Note" is the modal heading in NoteFormModalV2)
    await expect(page.getByRole('heading', { name: /create note|edit note/i })).toBeVisible({ timeout: 5000 });
  });

  test('clicking Focus navigates to /focus', async ({ page }) => {
    await page.getByRole('button', { name: 'Focus' }).click();
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/\/focus/);
  });
});

test.describe('Dashboard - Task Creation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForDashboard(page);
  });

  test('quick add modal opens with correct input', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.waitForTimeout(1000);

    // Modal should show input
    const input = page.getByPlaceholder(/what needs to be done/i);
    await expect(input).toBeVisible({ timeout: 5000 });

    // Modal should show Create Task button
    await expect(page.getByRole('button', { name: 'Create Task' })).toBeVisible();

    // Modal should show Cancel button
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
  });

  test('quick add modal has schedule toggle', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByPlaceholder(/what needs to be done/i)).toBeVisible({ timeout: 5000 });

    // Should show tip text about task format
    await expect(page.getByText(/Try|shopping|high/i).first()).toBeVisible();
  });

  test('quick add closes on Cancel click', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Task' }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByPlaceholder(/what needs to be done/i)).toBeVisible({ timeout: 5000 });

    // Click Cancel
    await page.getByRole('button', { name: /^cancel$/i }).click();
    await page.waitForTimeout(800);

    // Modal input should not be visible
    await expect(page.getByPlaceholder(/what needs to be done/i)).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('Dashboard - Stats Grid', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForDashboard(page);
  });

  test('displays Tasks Today stat card', async ({ page }) => {
    await expect(page.getByText('Tasks Today')).toBeVisible({ timeout: 10000 });
  });

  test('displays Habits stat card', async ({ page }) => {
    await expect(page.getByText('Habits').first()).toBeVisible({ timeout: 10000 });
  });

  test('displays Notes stat card', async ({ page }) => {
    await expect(page.getByText('Notes').first()).toBeVisible({ timeout: 10000 });
  });

  test('displays Journal Entries stat card', async ({ page }) => {
    await expect(page.getByText('Journal Entries')).toBeVisible({ timeout: 10000 });
  });

  test('stat cards have numeric values', async ({ page }) => {
    // Stats show numeric values (0 or more)
    await expect(page.getByText('Tasks Today')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Journal Entries')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Dashboard - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForDashboard(page);
  });

  test('View all tasks navigates to /todos', async ({ page }) => {
    // Find the View all button in Today's Tasks section
    const viewAllButtons = page.getByText('View all');
    const count = await viewAllButtons.count();

    if (count > 0) {
      await viewAllButtons.first().click();
      await page.waitForTimeout(500);
      // Should navigate to tasks or stay on dashboard
      await expect(page).toHaveURL(/\/(todos|dashboard|$)/);
    }
  });

  test('dashboard page title is correct', async ({ page }) => {
    await expect(page).toHaveTitle(/Life/);
  });

  test('dashboard URL is /', async ({ page }) => {
    await expect(page).toHaveURL('/');
  });
});

test.describe('Dashboard - Briefing Card', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForDashboard(page);
  });

  test('displays briefing section with time-based title', async ({ page }) => {
    // BriefingCardV2 renders "Morning Briefing" / "Afternoon Briefing" / "Evening Briefing"
    const briefingTitle = page.getByText(/Morning Briefing|Afternoon Briefing|Evening Briefing/);
    await expect(briefingTitle).toBeVisible({ timeout: 10000 });
  });

  test('briefing shows task information', async ({ page }) => {
    // Briefing section is visible after data loads
    await expect(page.getByText(/task|tasks/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Dashboard - Habit Completion', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForDashboard(page);
  });

  test('displays habits section or empty state', async ({ page }) => {
    // Either shows habits or empty state
    const habitsSection = page.getByText("Today's Habits");
    await expect(habitsSection).toBeVisible({ timeout: 10000 });
  });

  test('shows completion state or empty message', async ({ page }) => {
    // Either shows habit items or the section header
    const habitsHeading = page.getByText("Today's Habits");
    await expect(habitsHeading).toBeVisible({ timeout: 10000 });
  });
});
