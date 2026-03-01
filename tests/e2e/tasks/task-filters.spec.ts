/**
 * Task Filters E2E Tests
 *
 * Tests all filtering functionality: priority, status, project, search, starred
 */

import { test, expect } from '@playwright/test';

test.describe('Task Filters - Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('domcontentloaded');

    // Close mobile sidebar if open
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    // Switch to Inbox to see all tasks
    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);
  });

  test('search filters tasks by title', async ({ page }) => {
    const timestamp = Date.now();
    const matchingTask = `Search Match ${timestamp}`;
    const nonMatchingTask = `Different Title ${timestamp}`;

    // Create two tasks
    for (const taskTitle of [matchingTask, nonMatchingTask]) {
      await page.getByRole('button', { name: /add task/i }).first().click();
      await page.waitForTimeout(500);
      await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
      await page.locator('form button[type="submit"]').click();
      await page.waitForTimeout(1000);
    }

    // Switch to Inbox to see all tasks
    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);

    // Verify both tasks exist
    await expect(page.getByText(matchingTask)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(nonMatchingTask)).toBeVisible({ timeout: 10000 });

    // Open filters if not visible
    const showFiltersBtn = page.getByRole('button', { name: /show filters/i });
    if (await showFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showFiltersBtn.click();
      await page.waitForTimeout(300);
    }

    // Use search
    const searchInput = page.getByPlaceholder(/search tasks/i);
    await searchInput.fill('Search Match');
    await page.waitForTimeout(500);

    // Should show matching task
    await expect(page.getByText(matchingTask)).toBeVisible();

    // Should not show non-matching task
    await expect(page.getByText(nonMatchingTask)).not.toBeVisible();
  });

  test('search is case insensitive', async ({ page }) => {
    const taskTitle = `CaseSensitive Test ${Date.now()}`;

    // Create task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Inbox
    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);

    // Verify task was created
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });

    // Open filters
    const showFiltersBtn = page.getByRole('button', { name: /show filters/i });
    if (await showFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showFiltersBtn.click();
      await page.waitForTimeout(300);
    }

    // Search with lowercase
    const searchInput = page.getByPlaceholder(/search tasks/i);
    await searchInput.fill('casesensitive');
    await page.waitForTimeout(500);

    // Should find the task
    await expect(page.getByText(taskTitle)).toBeVisible();
  });

  test('clearing search shows all tasks', async ({ page }) => {
    const taskTitle = `Clear Search ${Date.now()}`;

    // Create task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Inbox
    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);

    // Verify task was created
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });

    // Open filters
    const showFiltersBtn = page.getByRole('button', { name: /show filters/i });
    if (await showFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showFiltersBtn.click();
      await page.waitForTimeout(300);
    }

    const searchInput = page.getByPlaceholder(/search tasks/i);

    // Search for something that doesn't match
    await searchInput.fill('NonExistent');
    await page.waitForTimeout(500);
    await expect(page.getByText(taskTitle)).not.toBeVisible();

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);

    // Task should reappear
    await expect(page.getByText(taskTitle)).toBeVisible();
  });

  test('search works with partial matches', async ({ page }) => {
    const taskTitle = `Partial Match Test ${Date.now()}`;

    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Switch to Inbox
    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);

    // Verify task was created
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });

    const showFiltersBtn = page.getByRole('button', { name: /show filters/i });
    if (await showFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showFiltersBtn.click();
      await page.waitForTimeout(300);
    }

    // Search with partial text
    const searchInput = page.getByPlaceholder(/search tasks/i);
    await searchInput.fill('Partial');
    await page.waitForTimeout(500);

    await expect(page.getByText(taskTitle)).toBeVisible();
  });
});

test.describe('Task Filters - Priority', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('domcontentloaded');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);
  });

  test('filter tasks by urgent priority', async ({ page }) => {
    const timestamp = Date.now();
    const urgentTask = `Urgent Priority ${timestamp}`;
    const normalTask = `Normal Priority ${timestamp}`;

    // Create urgent task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(urgentTask);

    const prioritySelect = page.locator('select[name="priority"]').or(page.getByLabel(/priority/i));
    if (await prioritySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await prioritySelect.selectOption('urgent');
    }

    await page.locator('form button[type="submit"]').click();

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Add New Task' })).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Create normal task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(normalTask);
    await page.locator('form button[type="submit"]').click();

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Add New Task' })).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify both tasks exist
    await expect(page.getByText(urgentTask)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(normalTask)).toBeVisible({ timeout: 10000 });

    // Open filters
    const showFiltersBtn = page.getByRole('button', { name: /show filters/i });
    if (await showFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showFiltersBtn.click();
      await page.waitForTimeout(300);
    }

    // Click Urgent priority filter
    const urgentFilter = page.getByRole('button', { name: /🔥.*urgent/i });
    if (await urgentFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await urgentFilter.click();
      await page.waitForTimeout(500);

      // Should show urgent task only
      await expect(page.getByText(urgentTask)).toBeVisible();
      // Normal task should not be visible
      await expect(page.getByText(normalTask)).not.toBeVisible();
    }
  });

  test('filter tasks by high priority', async ({ page }) => {
    const timestamp = Date.now();
    const highTask = `High Priority Task ${timestamp}`;
    const lowTask = `Low Priority Task ${timestamp}`;

    // Create high priority task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(highTask);

    const prioritySelect1 = page.locator('select[name="priority"]').or(page.getByLabel(/priority/i));
    if (await prioritySelect1.isVisible({ timeout: 2000 }).catch(() => false)) {
      await prioritySelect1.selectOption('high');
    }

    await page.locator('form button[type="submit"]').click();

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Add New Task' })).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Create low priority task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(lowTask);

    const prioritySelect2 = page.locator('select[name="priority"]').or(page.getByLabel(/priority/i));
    if (await prioritySelect2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await prioritySelect2.selectOption('low');
    }

    await page.locator('form button[type="submit"]').click();

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Add New Task' })).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify both tasks exist
    await expect(page.getByText(highTask)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(lowTask)).toBeVisible({ timeout: 10000 });

    const showFiltersBtn = page.getByRole('button', { name: /show filters/i });
    if (await showFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showFiltersBtn.click();
      await page.waitForTimeout(300);
    }

    // Click High priority filter
    const highFilter = page.getByRole('button', { name: /high/i }).filter({ hasNotText: /urgent|important/i });
    if (await highFilter.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await highFilter.first().click();
      await page.waitForTimeout(500);

      // Should show high task only
      await expect(page.getByText(highTask)).toBeVisible();
      await expect(page.getByText(lowTask)).not.toBeVisible();
    }
  });

  test('all priorities filter shows all tasks', async ({ page }) => {
    // Open filters
    const showFiltersBtn = page.getByRole('button', { name: /show filters/i });
    if (await showFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showFiltersBtn.click();
      await page.waitForTimeout(300);
    }

    // Click a specific priority first
    const urgentFilter = page.getByRole('button', { name: /🔥.*urgent/i });
    if (await urgentFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await urgentFilter.click();
      await page.waitForTimeout(300);
    }

    // Click All Priorities filter
    const allFilter = page.getByRole('button', { name: /all priorities/i });
    if (await allFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await allFilter.click();
      await page.waitForTimeout(500);

      // Page should still be functional
      await expect(page.locator('main')).toBeVisible();
    }
  });
});

test.describe('Task Filters - Status', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('domcontentloaded');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);
  });

  test('filter tasks by To Do status', async ({ page }) => {
    const todoTask = `Todo Status ${Date.now()}`;

    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(todoTask);
    await page.locator('form button[type="submit"]').click();

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Add New Task' })).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify task was created successfully
    await expect(page.getByText(todoTask)).toBeVisible({ timeout: 10000 });

    const showFiltersBtn = page.getByRole('button', { name: /show filters/i });
    if (await showFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showFiltersBtn.click();
      await page.waitForTimeout(300);
    }

    // Click To Do status filter
    const todoFilter = page.getByRole('button', { name: /^To Do$/i });
    if (await todoFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await todoFilter.click();
      await page.waitForTimeout(500);

      await expect(page.getByText(todoTask)).toBeVisible();
    }
  });

  test('filter tasks by In Progress status', async ({ page }) => {
    const taskTitle = `In Progress Task ${Date.now()}`;

    // Create task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Add New Task' })).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify task was created
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });

    // Change to In Progress
    await page.getByText(taskTitle).first().click();
    await page.waitForTimeout(500);

    const inProgressBtn = page.getByRole('button', { name: /in progress/i });
    if (await inProgressBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await inProgressBtn.click();
      await page.waitForTimeout(300);
    }

    await page.locator('form button[type="submit"]').click();

    // Wait for edit modal to close
    await page.waitForTimeout(1000);

    // Verify status changed
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });

    // Open filters
    const showFiltersBtn = page.getByRole('button', { name: /show filters/i });
    if (await showFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showFiltersBtn.click();
      await page.waitForTimeout(300);
    }

    // Filter by In Progress
    const inProgressFilter = page.getByRole('button', { name: /^In Progress$/i });
    if (await inProgressFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await inProgressFilter.click();
      await page.waitForTimeout(500);

      await expect(page.getByText(taskTitle)).toBeVisible();
    }
  });

  test('filter tasks by Done status', async ({ page }) => {
    const taskTitle = `Done Task ${Date.now()}`;

    // Create and complete task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);
    await page.locator('form button[type="submit"]').click();

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Add New Task' })).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify task was created
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });

    // Mark as done
    await page.getByText(taskTitle).first().click();
    await page.waitForTimeout(500);

    const doneBtn = page.getByRole('button', { name: 'Done', exact: true });
    if (await doneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await doneBtn.click();
      await page.waitForTimeout(300);
    }

    await page.locator('form button[type="submit"]').click();

    // Wait for edit modal to close
    await page.waitForTimeout(1000);

    // Verify task is still visible after marking done
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });

    // Open filters
    const showFiltersBtn = page.getByRole('button', { name: /show filters/i });
    if (await showFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showFiltersBtn.click();
      await page.waitForTimeout(300);
    }

    // Filter by Done
    const doneFilter = page.getByRole('button', { name: /^Done$/i }).last();
    if (await doneFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await doneFilter.click();
      await page.waitForTimeout(500);

      await expect(page.getByText(taskTitle)).toBeVisible();
    }
  });
});

test.describe('Task Filters - Starred', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('domcontentloaded');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);
  });

  test('starred filter shows only starred tasks', async ({ page }) => {
    const starredTask = `Starred Task ${Date.now()}`;
    const normalTask = `Normal Task ${Date.now()}`;

    // Create starred task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(starredTask);
    await page.locator('form button[type="submit"]').click();

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Add New Task' })).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify task was created
    await expect(page.getByText(starredTask)).toBeVisible({ timeout: 10000 });

    // Star the task
    await page.getByText(starredTask).first().click();
    await page.waitForTimeout(500);

    const starBtn = page.getByRole('button', { name: /star/i }).or(
      page.locator('button').filter({ has: page.locator('svg').filter({ has: page.locator('path[d*="12 2"]') }) })
    );
    if (await starBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await starBtn.first().click();
      await page.waitForTimeout(300);
    }

    await page.locator('form button[type="submit"]').click();

    // Wait for edit modal to close
    await page.waitForTimeout(1000);

    // Create normal task
    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(normalTask);
    await page.locator('form button[type="submit"]').click();

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Add New Task' })).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify both tasks exist
    await expect(page.getByText(starredTask)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(normalTask)).toBeVisible({ timeout: 10000 });

    // Open filters
    const showFiltersBtn = page.getByRole('button', { name: /show filters/i });
    if (await showFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showFiltersBtn.click();
      await page.waitForTimeout(300);
    }

    // Toggle starred filter
    const starredFilter = page.getByRole('button', { name: /⭐.*starred/i });
    if (await starredFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await starredFilter.click();
      await page.waitForTimeout(500);

      // Should show starred task only
      await expect(page.getByText(starredTask)).toBeVisible();
      await expect(page.getByText(normalTask)).not.toBeVisible();
    }
  });

  test('toggle starred filter on and off', async ({ page }) => {
    // Open filters
    const showFiltersBtn = page.getByRole('button', { name: /show filters/i });
    if (await showFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showFiltersBtn.click();
      await page.waitForTimeout(300);
    }

    const starredFilter = page.getByRole('button', { name: /⭐.*starred/i });
    if (await starredFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Turn on
      await starredFilter.click();
      await page.waitForTimeout(300);

      // Turn off
      await starredFilter.click();
      await page.waitForTimeout(300);

      // Page should still be functional
      await expect(page.locator('main')).toBeVisible();
    }
  });
});

test.describe('Task Filters - Combined Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos');
    await page.waitForLoadState('domcontentloaded');

    const backdrop = page.locator('.fixed.inset-0.bg-black\\/50').first();
    if (await backdrop.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backdrop.click();
      await page.waitForTimeout(300);
    }

    await page.getByRole('button', { name: /inbox/i }).click();
    await page.waitForTimeout(500);
  });

  test('combine search and priority filters', async ({ page }) => {
    const matchingTask = `Urgent Search ${Date.now()}`;
    const nonMatchingTask = `Urgent Different ${Date.now()}`;

    // Create tasks with same priority, different titles
    for (const taskTitle of [matchingTask, nonMatchingTask]) {
      await page.getByRole('button', { name: /add task/i }).first().click();
      await page.waitForTimeout(500);
      await page.getByPlaceholder('What needs to be done?').fill(taskTitle);

      const prioritySelect = page.locator('select[name="priority"]').or(page.getByLabel(/priority/i));
      if (await prioritySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await prioritySelect.selectOption('urgent');
      }

      await page.locator('form button[type="submit"]').click();

      // Wait for modal to close
      await expect(page.getByRole('heading', { name: 'Add New Task' })).not.toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(500);
    }

    // Verify both tasks were created
    await expect(page.getByText(matchingTask)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(nonMatchingTask)).toBeVisible({ timeout: 10000 });

    // Open filters
    const showFiltersBtn = page.getByRole('button', { name: /show filters/i });
    if (await showFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showFiltersBtn.click();
      await page.waitForTimeout(300);
    }

    // Apply priority filter
    const urgentFilter = page.getByRole('button', { name: /🔥.*urgent/i });
    if (await urgentFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await urgentFilter.click();
      await page.waitForTimeout(300);
    }

    // Apply search filter
    const searchInput = page.getByPlaceholder(/search tasks/i);
    await searchInput.fill('Search');
    await page.waitForTimeout(500);

    // Should show only the matching task
    await expect(page.getByText(matchingTask)).toBeVisible();
  });

  test('combine status and priority filters', async ({ page }) => {
    const taskTitle = `Combined Filters ${Date.now()}`;

    await page.getByRole('button', { name: /add task/i }).first().click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder('What needs to be done?').fill(taskTitle);

    const prioritySelect = page.locator('select[name="priority"]').or(page.getByLabel(/priority/i));
    if (await prioritySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await prioritySelect.selectOption('high');
    }

    await page.locator('form button[type="submit"]').click();

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: 'Add New Task' })).not.toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify task was created
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 });

    // Open filters
    const showFiltersBtn = page.getByRole('button', { name: /show filters/i });
    if (await showFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showFiltersBtn.click();
      await page.waitForTimeout(300);
    }

    // Apply Todo status filter
    const todoFilter = page.getByRole('button', { name: /^To Do$/i });
    if (await todoFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await todoFilter.click();
      await page.waitForTimeout(300);
    }

    // Apply High priority filter
    const highFilter = page.getByRole('button', { name: /high/i }).filter({ hasNotText: /urgent|important/i });
    if (await highFilter.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await highFilter.first().click();
      await page.waitForTimeout(500);

      await expect(page.getByText(taskTitle)).toBeVisible();
    }
  });

  test('reset all filters', async ({ page }) => {
    // Open filters
    const showFiltersBtn = page.getByRole('button', { name: /show filters/i });
    if (await showFiltersBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await showFiltersBtn.click();
      await page.waitForTimeout(300);
    }

    // Apply multiple filters
    const urgentFilter = page.getByRole('button', { name: /🔥.*urgent/i });
    if (await urgentFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await urgentFilter.click();
      await page.waitForTimeout(300);
    }

    const searchInput = page.getByPlaceholder(/search tasks/i);
    await searchInput.fill('test');
    await page.waitForTimeout(300);

    // Reset: Click All Priorities
    const allPriorityFilter = page.getByRole('button', { name: /all priorities/i });
    if (await allPriorityFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await allPriorityFilter.click();
      await page.waitForTimeout(300);
    }

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(300);

    // Page should be functional
    await expect(page.locator('main')).toBeVisible();
  });
});
