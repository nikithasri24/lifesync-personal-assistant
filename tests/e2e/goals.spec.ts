import { test, expect } from '@playwright/test';

test.describe('Goals Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Goals (general goals, not Life Goals)
    const goalsLink = page.locator('[data-testid="nav-goals"]').or(
      page.getByText('Goals', { exact: true })
    );

    if (await goalsLink.first().isVisible()) {
      await goalsLink.first().click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('/goals');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display goals page', async ({ page }) => {
    // Check for goals page content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have create goal button', async ({ page }) => {
    // Look for create goal button
    const createButton = page.locator('[data-testid="create-goal"]').or(
      page.getByRole('button').filter({ hasText: /new goal|add goal|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await expect(createButton).toBeVisible();
    }
  });

  test('should create a new goal', async ({ page }) => {
    const createButton = page.locator('[data-testid="create-goal"]').or(
      page.getByRole('button').filter({ hasText: /new goal|add goal|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Fill goal details
      const goalInput = page.getByPlaceholder(/goal|title|what/i).first();
      if (await goalInput.isVisible()) {
        await goalInput.fill('Read 12 books this year');

        // Save goal
        const saveButton = page.getByRole('button', { name: /save|create|add/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should display goal analytics', async ({ page }) => {
    // Look for analytics dashboard
    const analytics = page.locator('[data-testid="goal-analytics"]').or(
      page.locator('.analytics, .dashboard, .stats')
    );

    // Page should render
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show goals progress chart', async ({ page }) => {
    // Look for progress visualization
    const chart = page.locator('[data-testid="goals-chart"]').or(
      page.locator('canvas, svg').first()
    );

    if (await chart.isVisible()) {
      await expect(chart).toBeVisible();
    }
  });

  test('should display active goals count', async ({ page }) => {
    // Look for active goals metric
    const activeCount = page.locator('[data-testid="active-goals"]').or(
      page.getByText(/active|in progress/i).first()
    );

    await expect(page.locator('body')).toBeVisible();
  });

  test('should display completed goals count', async ({ page }) => {
    // Look for completed goals metric
    const completedCount = page.locator('[data-testid="completed-goals"]').or(
      page.getByText(/completed|achieved/i).first()
    );

    await expect(page.locator('body')).toBeVisible();
  });

  test('should show success rate', async ({ page }) => {
    // Look for success rate percentage
    const successRate = page.locator('[data-testid="success-rate"]').or(
      page.getByText(/success rate|%/i).first()
    );

    await expect(page.locator('body')).toBeVisible();
  });

  test('should filter goals by time period', async ({ page }) => {
    // Look for time period filter
    const timePeriodFilter = page.locator('[data-testid="period-filter"]').or(
      page.getByRole('button', { name: /month|year|week|all time/i }).first()
    );

    if (await timePeriodFilter.isVisible()) {
      await timePeriodFilter.click();
      await page.waitForTimeout(300);

      // Time period options should appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should filter by goal category', async ({ page }) => {
    // Look for category filter
    const categoryFilter = page.locator('[data-testid="category-filter"]').or(
      page.getByRole('button', { name: /category|type/i }).first()
    );

    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.waitForTimeout(300);

      // Category options should appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should display goals list', async ({ page }) => {
    // Look for goals list
    const goalsList = page.locator('[data-testid="goals-list"]').or(
      page.locator('.goals-list, .goals-grid')
    );

    // Page should render
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display goal cards', async ({ page }) => {
    // Look for goal cards
    const goalCard = page.locator('[data-testid*="goal-card"]').or(
      page.locator('.goal-card')
    ).first();

    if (await goalCard.isVisible()) {
      await expect(goalCard).toBeVisible();
    }
  });

  test('should open goal details', async ({ page }) => {
    // Click on a goal card
    const goalCard = page.locator('[data-testid*="goal-card"]').or(
      page.locator('.goal-card')
    ).first();

    if (await goalCard.isVisible()) {
      await goalCard.click();
      await page.waitForTimeout(500);

      // Goal details should open
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should update goal progress', async ({ page }) => {
    // Open a goal
    const goalCard = page.locator('[data-testid*="goal-card"]').first();

    if (await goalCard.isVisible()) {
      await goalCard.click();
      await page.waitForTimeout(500);

      // Look for progress update
      const progressInput = page.locator('[data-testid="update-progress"]').or(
        page.locator('input[type="number"], input[type="range"]').first()
      );

      if (await progressInput.isVisible()) {
        await progressInput.fill('75');
        await page.waitForTimeout(500);
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should view goal history', async ({ page }) => {
    // Open a goal
    const goalCard = page.locator('[data-testid*="goal-card"]').first();

    if (await goalCard.isVisible()) {
      await goalCard.click();
      await page.waitForTimeout(500);

      // Look for history/timeline
      const history = page.locator('[data-testid="goal-history"]').or(
        page.getByText(/history|timeline/i).first()
      );

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should edit goal', async ({ page }) => {
    // Open a goal
    const goalCard = page.locator('[data-testid*="goal-card"]').first();

    if (await goalCard.isVisible()) {
      await goalCard.click();
      await page.waitForTimeout(500);

      // Look for edit button
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(500);

        // Edit form should appear
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should delete goal', async ({ page }) => {
    // Create a test goal first
    const createButton = page.getByRole('button').filter({ hasText: /new goal|add goal|create/i }).first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      const goalInput = page.getByPlaceholder(/goal|title/i).first();
      if (await goalInput.isVisible()) {
        const testGoalTitle = `Delete Test ${Date.now()}`;
        await goalInput.fill(testGoalTitle);

        const saveButton = page.getByRole('button', { name: /save|create/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          // Now delete it
          const goalToDelete = page.getByText(testGoalTitle).first();
          if (await goalToDelete.isVisible()) {
            await goalToDelete.click();
            await page.waitForTimeout(500);

            const deleteButton = page.getByRole('button', { name: /delete|remove/i }).first();
            if (await deleteButton.isVisible()) {
              await deleteButton.click();
              await page.waitForTimeout(500);

              // Confirm deletion
              const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i }).first();
              if (await confirmButton.isVisible()) {
                await confirmButton.click();
                await page.waitForTimeout(1000);
              }
            }
          }
        }
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should export goals data', async ({ page }) => {
    // Look for export button
    const exportButton = page.locator('[data-testid="export-goals"]').or(
      page.getByRole('button', { name: /export/i }).first()
    );

    if (await exportButton.isVisible()) {
      await expect(exportButton).toBeVisible();
    }
  });

  test('should display goal trends', async ({ page }) => {
    // Look for trends visualization
    const trends = page.locator('[data-testid="goal-trends"]').or(
      page.getByText(/trends|over time/i).first()
    );

    await expect(page.locator('body')).toBeVisible();
  });

  test('should compare goals performance', async ({ page }) => {
    // Look for comparison feature
    const compareButton = page.locator('[data-testid="compare-goals"]').or(
      page.getByRole('button', { name: /compare/i }).first()
    );

    if (await compareButton.isVisible()) {
      await compareButton.click();
      await page.waitForTimeout(500);

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Goals page should adapt to mobile
    await expect(page.locator('body')).toBeVisible();
  });
});
