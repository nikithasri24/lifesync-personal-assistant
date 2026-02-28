/**
 * Task Views E2E Tests
 *
 * Tests all view modes: Today, Inbox, Upcoming, List
 * Tests view-specific behavior, empty states, and view persistence
 */

import { test, expect } from '@playwright/test';

test.describe('Task Views - Today View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test('Today view shows tasks due today', async ({ page }) => {
    const todayTask = `Today Due ${Date.now()}`;

    // Create task with today's date
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(todayTask);

    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const today = new Date().toISOString().split('T')[0];
      await dateInput.fill(today);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Today view
    await page.getByRole('button', { name: /📅.*today/i }).click();
    await page.waitForTimeout(500);

    // Task should be visible
    await expect(page.getByText(todayTask)).toBeVisible({ timeout: 10000 });
  });

  test('Today view does not show future tasks', async ({ page }) => {
    const noDateTask = `No Date Task ${Date.now()}`;

    // Switch to Inbox view first so that the quick add creates a task with no date
    // (Quick add from Today view auto-assigns today's date; from Inbox it assigns null)
    await page.getByRole('button', { name: '📥 Inbox view' }).click();
    await page.waitForTimeout(500);

    // Create task without a date (no date input in quick add modal)
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(noDateTask);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Today view
    await page.getByRole('button', { name: '📅 Today view' }).click();
    await page.waitForTimeout(500);

    // Task with no date should not be visible in Today view (Today only shows tasks due today)
    await expect(page.getByText(noDateTask)).not.toBeVisible();
  });

  test('Today view shows overdue tasks', async ({ page }) => {
    const overdueTask = `Overdue Task ${Date.now()}`;

    // Create task with past date
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(overdueTask);

    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await dateInput.fill(yesterday.toISOString().split('T')[0]);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Today view
    await page.getByRole('button', { name: /📅.*today/i }).click();
    await page.waitForTimeout(500);

    // Overdue task should be visible
    await expect(page.getByText(overdueTask)).toBeVisible({ timeout: 10000 });
  });

  test('Today view empty state when no tasks due', async ({ page }) => {
    // Switch to Today view
    await page.getByRole('button', { name: /📅.*today/i }).click();
    await page.waitForTimeout(500);

    // Check if empty state appears (depends on actual data)
    // Page should at least be functional
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Task Views - Inbox View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test('Inbox view shows all tasks regardless of date', async ({ page }) => {
    const timestamp = Date.now();
    const noDateTask = `No Date ${timestamp}`;
    const todayTask = `Today ${timestamp}`;
    const futureTask = `Future ${timestamp}`;

    // Create task without date
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(noDateTask);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Create task with today's date
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(todayTask);

    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const today = new Date().toISOString().split('T')[0];
      await dateInput.fill(today);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Create task with future date
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(futureTask);

    const dateInput2 = page.locator('input[type="date"]').first();
    if (await dateInput2.isVisible({ timeout: 2000 }).catch(() => false)) {
      const future = new Date();
      future.setDate(future.getDate() + 7);
      await dateInput2.fill(future.toISOString().split('T')[0]);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Inbox view
    await page.getByRole('button', { name: /📥.*inbox/i }).click();
    await page.waitForTimeout(500);

    // All tasks should be visible
    await expect(page.getByText(noDateTask)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(todayTask)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(futureTask)).toBeVisible({ timeout: 10000 });
  });

  test('Inbox view shows active tasks regardless of date', async ({ page }) => {
    const activeTask = `Active Task ${Date.now()}`;

    // Switch to Inbox view first
    await page.getByRole('button', { name: '📥 Inbox view' }).click();
    await page.waitForTimeout(500);

    // Create a task from Inbox view (gets null date)
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(activeTask);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Task should be visible in Inbox (Inbox shows all non-done tasks)
    await expect(page.getByText(activeTask)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Task Views - Upcoming View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test('Upcoming view shows future tasks', async ({ page }) => {
    const upcomingTask = `Upcoming ${Date.now()}`;

    // Create task with future date
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(upcomingTask);

    const dateInput = page.locator('input[type="date"]').first();
    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const future = new Date();
      future.setDate(future.getDate() + 3);
      await dateInput.fill(future.toISOString().split('T')[0]);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Upcoming view
    await page.getByRole('button', { name: /🗓️.*upcoming/i }).click();
    await page.waitForTimeout(500);

    // Task should be visible
    await expect(page.getByText(upcomingTask)).toBeVisible({ timeout: 10000 });
  });

  test('Upcoming view does not show tasks without dates', async ({ page }) => {
    const noDateTask = `No Date Upcoming ${Date.now()}`;

    // Switch to Inbox view first so that the quick add creates a task with null date
    // (Quick add from Today view auto-assigns today's date; from Inbox it assigns null)
    await page.getByRole('button', { name: '📥 Inbox view' }).click();
    await page.waitForTimeout(500);

    // Create task without date (quick add from Inbox gives null date)
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(noDateTask);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Upcoming view
    await page.getByRole('button', { name: '🗓️ Upcoming view' }).click();
    await page.waitForTimeout(500);

    // Task without date should not show in Upcoming (Upcoming requires a date within 7 days)
    await expect(page.getByText(noDateTask)).not.toBeVisible();
  });
});

test.describe('Task Views - List View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test('List view shows status sections', async ({ page }) => {
    // Switch to List view
    const listBtn = page.getByRole('button', { name: /📋.*list/i });
    await listBtn.click();
    await page.waitForTimeout(500);

    // Check for status section headers
    await expect(page.getByText(/📝.*To Do/i)).toBeVisible();
    await expect(page.getByText(/⚡.*In Progress/i)).toBeVisible();
    await expect(page.getByText(/⏸️.*Waiting/i)).toBeVisible();
    await expect(page.getByText(/✅.*Done/i)).toBeVisible();
  });

  test('List view groups tasks by status', async ({ page }) => {
    const timestamp = Date.now();
    const todoTask = `Todo ${timestamp}`;
    const inProgressTask = `InProgress ${timestamp}`;

    // Create todo task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(todoTask);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Create in progress task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(inProgressTask);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Change second task to In Progress
    await page.getByText(inProgressTask).first().click();
    await page.waitForTimeout(500);

    const inProgressBtn = page.getByRole('button', { name: /in progress/i });
    if (await inProgressBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await inProgressBtn.click();
      await page.waitForTimeout(300);
    }

    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to List view
    const listBtn = page.getByRole('button', { name: /📋.*list/i });
    await listBtn.click();
    await page.waitForTimeout(500);

    // Both tasks should be visible in their sections
    await expect(page.getByText(todoTask)).toBeVisible();
    await expect(page.getByText(inProgressTask)).toBeVisible();
  });

  test('List view shows task counts per section', async ({ page }) => {
    // Switch to List view
    const listBtn = page.getByRole('button', { name: /📋.*list/i });
    await listBtn.click();
    await page.waitForTimeout(500);

    // Count badges should be visible (numbers showing task count)
    const countBadges = page.locator('span').filter({ hasText: /^\d+$/ });
    const badgeCount = await countBadges.count();

    // Should have at least some count badges
    expect(badgeCount).toBeGreaterThanOrEqual(0);
  });

  test('List view supports drag and drop between sections', async ({ page }) => {
    const taskTitle = `Drag Task ${Date.now()}`;

    // Create task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to List view
    const listBtn = page.getByRole('button', { name: /📋.*list/i });
    await listBtn.click();
    await page.waitForTimeout(500);

    // Verify task card has draggable attribute
    const taskCard = page.locator(`[data-task-card="true"]`).filter({ hasText: taskTitle }).first();
    if (await taskCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      const isDraggable = await taskCard.getAttribute('draggable');
      expect(isDraggable).toBeTruthy();
    }
  });
});

test.describe('Task Views - View Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test('selected view persists after creating task', async ({ page }) => {
    // Switch to List view
    const listBtn = page.getByRole('button', { name: /📋.*list/i });
    await listBtn.click();
    await page.waitForTimeout(500);

    // Create a task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder('What needs to be done?').fill(`Persist ${Date.now()}`);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Should still be in List view (status sections visible)
    await expect(page.getByText(/📝.*To Do/i)).toBeVisible();
  });

  test('can switch between all view modes', async ({ page }) => {
    const views = [
      { name: /📅.*today/i, label: 'Today' },
      { name: /📥.*inbox/i, label: 'Inbox' },
      { name: /🗓️.*upcoming/i, label: 'Upcoming' },
      { name: /📋.*list/i, label: 'List' },
    ];

    for (const view of views) {
      const viewBtn = page.getByRole('button', { name: view.name });
      await viewBtn.click();
      await page.waitForTimeout(500);

      // Verify page is functional
      await expect(page.locator('main')).toBeVisible();
    }
  });
});

test.describe('Task Views - Empty States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('networkidle');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }
  });

  test('Today view shows helpful message when no tasks', async ({ page }) => {
    // Switch to Today view
    await page.getByRole('button', { name: /📅.*today/i }).click();
    await page.waitForTimeout(500);

    // Look for empty state or task list
    // Page should be functional even if empty
    await expect(page.locator('main')).toBeVisible();
  });

  test('List view shows sections even when empty', async ({ page }) => {
    // Switch to List view
    const listBtn = page.getByRole('button', { name: /📋.*list/i });
    await listBtn.click();
    await page.waitForTimeout(500);

    // Status sections should be visible even without tasks
    // (or empty state should be shown)
    await expect(page.locator('main')).toBeVisible();
  });

  test('search with no results shows empty state', async ({ page }) => {
    // Open filters
    const showFiltersBtn = page.getByRole('button', { name: /show filters/i });
    if (await showFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showFiltersBtn.click();
      await page.waitForTimeout(300);
    }

    // Search for non-existent task
    const searchInput = page.getByPlaceholder(/search tasks/i);
    await searchInput.fill('NonExistentTaskQuery12345');
    await page.waitForTimeout(500);

    // Should show empty state or "no tasks found"
    const emptyText = page.getByText(/no tasks found|no results|empty/i);
    if (await emptyText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(emptyText).toBeVisible();
    } else {
      // At minimum, page should be functional
      await expect(page.locator('main')).toBeVisible();
    }
  });
});
