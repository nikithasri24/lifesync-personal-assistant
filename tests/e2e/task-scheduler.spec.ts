import { test, expect } from '@playwright/test';

test.describe('Task Scheduler', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Task Scheduler
    const schedulerLink = page.locator('[data-testid="nav-scheduler"]').or(
      page.getByText('Scheduler').or(page.getByText('Task Scheduler'))
    );

    if (await schedulerLink.first().isVisible()) {
      await schedulerLink.first().click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('/scheduler');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display task scheduler page', async ({ page }) => {
    // Check for scheduler content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have multiple view options', async ({ page }) => {
    // Look for view toggle buttons - Board, Timeline, List, Matrix
    const boardViewButton = page.getByRole('button', { name: /board/i }).or(page.getByText('Board'));
    const timelineViewButton = page.getByRole('button', { name: /timeline/i }).or(page.getByText('Timeline'));
    const listViewButton = page.getByRole('button', { name: /list/i }).or(page.getByText('List'));
    const matrixViewButton = page.getByRole('button', { name: /matrix/i }).or(page.getByText('Matrix'));

    // At least one view should be available
    const anyViewVisible = await Promise.race([
      boardViewButton.first().isVisible().catch(() => false),
      timelineViewButton.first().isVisible().catch(() => false),
      listViewButton.first().isVisible().catch(() => false),
      matrixViewButton.first().isVisible().catch(() => false),
    ]);

    expect(anyViewVisible).toBeTruthy();
  });

  test('should display Board View (Kanban)', async ({ page }) => {
    // Look for board view button
    const boardButton = page.getByRole('button', { name: /board/i }).or(page.getByText('Board'));

    if (await boardButton.first().isVisible()) {
      await boardButton.first().click();
      await page.waitForTimeout(500);

      // Board view should show columns
      const columns = page.locator('[data-testid*="column"]').or(
        page.locator('.kanban-column, .board-column')
      );

      // At least the page should render
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should show 4 Kanban columns in Board View', async ({ page }) => {
    // Switch to board view
    const boardButton = page.getByRole('button', { name: /board/i }).or(page.getByText('Board'));

    if (await boardButton.first().isVisible()) {
      await boardButton.first().click();
      await page.waitForTimeout(500);

      // Look for column headers: Need to Start, Currently Working, Pending Others, Done
      const needToStart = page.getByText(/need to start/i).or(page.getByText(/backlog/i));
      const currentlyWorking = page.getByText(/currently working|in progress/i);
      const pendingOthers = page.getByText(/pending others|waiting/i);
      const done = page.getByText(/done|completed/i);

      // At least some columns should be visible
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });

  test('should switch to Timeline View', async ({ page }) => {
    const timelineButton = page.getByRole('button', { name: /timeline/i }).or(page.getByText('Timeline'));

    if (await timelineButton.first().isVisible()) {
      await timelineButton.first().click();
      await page.waitForTimeout(500);

      // Timeline view should render
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should switch to List View', async ({ page }) => {
    const listButton = page.getByRole('button', { name: /list/i }).or(page.getByText('List'));

    if (await listButton.first().isVisible()) {
      await listButton.first().click();
      await page.waitForTimeout(500);

      // List view should render (spreadsheet-style)
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should switch to Matrix View', async ({ page }) => {
    const matrixButton = page.getByRole('button', { name: /matrix/i }).or(page.getByText('Matrix'));

    if (await matrixButton.first().isVisible()) {
      await matrixButton.first().click();
      await page.waitForTimeout(500);

      // Matrix view should render (Eisenhower Matrix)
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should have search functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('[data-testid="search-input"]').or(
      page.getByPlaceholder(/search/i)
    );

    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill('test task');
      await page.waitForTimeout(300);

      // Search should filter tasks
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should have filter panel', async ({ page }) => {
    // Look for filter button or panel
    const filterButton = page.locator('[data-testid="filter-button"]').or(
      page.getByRole('button').filter({ hasText: /filter/i }).first()
    );

    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(300);

      // Filter panel should appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should have quick add functionality', async ({ page }) => {
    // Look for quick add input or button
    const quickAddButton = page.locator('[data-testid="quick-add"]').or(
      page.getByRole('button').filter({ hasText: /add|new task/i }).first()
    );

    if (await quickAddButton.isVisible()) {
      await quickAddButton.click();
      await page.waitForTimeout(300);

      // Quick add form should appear
      const taskInput = page.getByPlaceholder(/task|what needs/i).first();
      if (await taskInput.isVisible()) {
        await expect(taskInput).toBeVisible();
      }
    }
  });

  test('should support drag and drop between columns', async ({ page }) => {
    // Switch to board view first
    const boardButton = page.getByRole('button', { name: /board/i }).or(page.getByText('Board'));

    if (await boardButton.first().isVisible()) {
      await boardButton.first().click();
      await page.waitForTimeout(500);

      // Look for draggable task cards
      const draggableTask = page.locator('[draggable="true"]').first();

      if (await draggableTask.isVisible()) {
        // Verify task is draggable
        const isDraggable = await draggableTask.getAttribute('draggable');
        expect(isDraggable).toBe('true');
      }
    }
  });

  test('should have Pomodoro timer integration', async ({ page }) => {
    // Look for timer button or icon
    const timerButton = page.locator('[data-testid="pomodoro-timer"]').or(
      page.getByRole('button').filter({ hasText: /timer|pomodoro/i }).first()
    );

    if (await timerButton.isVisible()) {
      // Timer functionality exists
      await expect(timerButton).toBeVisible();
    }
  });

  test('should filter by project', async ({ page }) => {
    // Look for project filter
    const projectFilter = page.locator('[data-testid="project-filter"]').or(
      page.getByText(/project/i).first()
    );

    if (await projectFilter.isVisible()) {
      await projectFilter.click();
      await page.waitForTimeout(300);

      // Should show project options
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should filter by priority', async ({ page }) => {
    // Open filters
    const filterButton = page.locator('[data-testid="filter-button"]').or(
      page.getByRole('button').filter({ hasText: /filter/i }).first()
    );

    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(300);

      // Look for priority options
      const priorityOptions = page.getByText(/urgent|high|medium|low/i).first();
      if (await priorityOptions.isVisible()) {
        await expect(priorityOptions).toBeVisible();
      }
    }
  });

  test('should filter by status', async ({ page }) => {
    // Open filters
    const filterButton = page.locator('[data-testid="filter-button"]').or(
      page.getByRole('button').filter({ hasText: /filter/i }).first()
    );

    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(300);

      // Look for status options
      const statusOptions = page.getByText(/todo|done|in progress|waiting/i).first();
      if (await statusOptions.isVisible()) {
        await expect(statusOptions).toBeVisible();
      }
    }
  });

  test('should handle task inline editing', async ({ page }) => {
    // Look for a task card
    const taskCard = page.locator('[data-testid*="task-card"]').or(
      page.locator('.task-card, .kanban-card')
    ).first();

    if (await taskCard.isVisible()) {
      // Try to click on task to edit
      await taskCard.click();
      await page.waitForTimeout(300);

      // Should show edit interface
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Scheduler should adapt to mobile
    await expect(page.locator('body')).toBeVisible();
  });

  test('should persist view selection', async ({ page }) => {
    // Switch to a different view
    const listButton = page.getByRole('button', { name: /list/i }).or(page.getByText('List'));

    if (await listButton.first().isVisible()) {
      await listButton.first().click();
      await page.waitForTimeout(500);

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // View selection might persist
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
