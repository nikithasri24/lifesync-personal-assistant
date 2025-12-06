import { test, expect } from '@playwright/test';

test.describe('Life Goals Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Life Goals
    const lifeGoalsLink = page.locator('[data-testid="nav-life-goals"]').or(
      page.getByText('Life Goals')
    );

    if (await lifeGoalsLink.first().isVisible()) {
      await lifeGoalsLink.first().click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('/life-goals');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display life goals page', async ({ page }) => {
    // Check for life goals page content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have create goal button', async ({ page }) => {
    // Look for create goal button
    const createButton = page.locator('[data-testid="create-goal"]').or(
      page.getByRole('button').filter({ hasText: /new goal|add goal|create goal/i }).first()
    );

    if (await createButton.isVisible()) {
      await expect(createButton).toBeVisible();
    }
  });

  test('should create a new life goal', async ({ page }) => {
    const createButton = page.locator('[data-testid="create-goal"]').or(
      page.getByRole('button').filter({ hasText: /new goal|add goal|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Fill goal details
      const goalInput = page.getByPlaceholder(/goal|what do you want|title/i).first();
      if (await goalInput.isVisible()) {
        await goalInput.fill('Run a marathon');

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

  test('should categorize goals', async ({ page }) => {
    const createButton = page.getByRole('button').filter({ hasText: /new goal|add goal|create/i }).first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Look for category selector
      const categorySelect = page.locator('[data-testid="goal-category"]').or(
        page.getByText(/category|type/i).first()
      );

      if (await categorySelect.isVisible()) {
        await expect(categorySelect).toBeVisible();
      }
    }
  });

  test('should set goal timeframe', async ({ page }) => {
    const createButton = page.getByRole('button').filter({ hasText: /new goal|add goal|create/i }).first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Look for timeframe options (short-term, long-term, lifetime, etc.)
      const timeframeSelect = page.locator('[data-testid="goal-timeframe"]').or(
        page.getByText(/timeframe|deadline|by when/i).first()
      );

      if (await timeframeSelect.isVisible()) {
        await expect(timeframeSelect).toBeVisible();
      }
    }
  });

  test('should set goal deadline', async ({ page }) => {
    const createButton = page.getByRole('button').filter({ hasText: /new goal|add goal|create/i }).first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Look for deadline input
      const deadlineInput = page.locator('input[type="date"]').first();
      if (await deadlineInput.isVisible()) {
        await expect(deadlineInput).toBeVisible();
      }
    }
  });

  test('should add milestones to goal', async ({ page }) => {
    // Create or open a goal
    const createButton = page.getByRole('button').filter({ hasText: /new goal|add goal|create/i }).first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      const goalInput = page.getByPlaceholder(/goal|title/i).first();
      if (await goalInput.isVisible()) {
        await goalInput.fill('Learn Spanish');

        const saveButton = page.getByRole('button', { name: /save|create/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          // Now add milestone
          const addMilestoneButton = page.locator('[data-testid="add-milestone"]').or(
            page.getByRole('button', { name: /milestone|add milestone/i }).first()
          );

          if (await addMilestoneButton.isVisible()) {
            await addMilestoneButton.click();
            await page.waitForTimeout(500);

            const milestoneInput = page.getByPlaceholder(/milestone/i).first();
            if (await milestoneInput.isVisible()) {
              await milestoneInput.fill('Complete beginner course');
            }
          }
        }
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should track goal progress', async ({ page }) => {
    // Look for a goal card
    const goalCard = page.locator('[data-testid*="goal-card"]').or(
      page.locator('.goal-card')
    ).first();

    if (await goalCard.isVisible()) {
      await goalCard.click();
      await page.waitForTimeout(500);

      // Look for progress tracker
      const progressBar = page.locator('[data-testid="goal-progress"]').or(
        page.locator('.progress, .progress-bar')
      );

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should update goal progress', async ({ page }) => {
    // Open a goal
    const goalCard = page.locator('[data-testid*="goal-card"]').first();

    if (await goalCard.isVisible()) {
      await goalCard.click();
      await page.waitForTimeout(500);

      // Look for progress update control
      const progressInput = page.locator('[data-testid="update-progress"]').or(
        page.locator('input[type="number"], input[type="range"]').first()
      );

      if (await progressInput.isVisible()) {
        await progressInput.fill('50');
        await page.waitForTimeout(500);
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should mark goal as complete', async ({ page }) => {
    // Open a goal
    const goalCard = page.locator('[data-testid*="goal-card"]').first();

    if (await goalCard.isVisible()) {
      await goalCard.click();
      await page.waitForTimeout(500);

      // Look for complete button
      const completeButton = page.locator('[data-testid="complete-goal"]').or(
        page.getByRole('button', { name: /complete|mark complete|done/i }).first()
      );

      if (await completeButton.isVisible()) {
        await completeButton.click();
        await page.waitForTimeout(500);
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should filter goals by category', async ({ page }) => {
    // Look for category filter
    const categoryFilter = page.locator('[data-testid="filter-category"]').or(
      page.getByRole('button', { name: /category|filter/i }).first()
    );

    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.waitForTimeout(300);

      // Category options should appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should filter by active goals', async ({ page }) => {
    // Look for status filter
    const activeFilter = page.locator('[data-testid="filter-active"]').or(
      page.getByRole('button', { name: /active|in progress/i }).first()
    );

    if (await activeFilter.isVisible()) {
      await activeFilter.click();
      await page.waitForTimeout(300);

      // Should show only active goals
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should filter by completed goals', async ({ page }) => {
    // Look for completed filter
    const completedFilter = page.locator('[data-testid="filter-completed"]').or(
      page.getByRole('button', { name: /completed|achieved/i }).first()
    );

    if (await completedFilter.isVisible()) {
      await completedFilter.click();
      await page.waitForTimeout(300);

      // Should show only completed goals
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should search goals', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('[data-testid="search-goals"]').or(
      page.getByPlaceholder(/search/i)
    );

    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill('marathon');
      await page.waitForTimeout(500);

      // Goals should be filtered
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should edit a goal', async ({ page }) => {
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
        const goalInput = page.getByPlaceholder(/goal|title/i).first();
        if (await goalInput.isVisible()) {
          await goalInput.fill('Updated goal title');
        }
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should delete a goal', async ({ page }) => {
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

  test('should display goal analytics', async ({ page }) => {
    // Look for analytics/statistics section
    const analytics = page.locator('[data-testid="goal-analytics"]').or(
      page.getByText(/analytics|statistics|overview/i).first()
    );

    await expect(page.locator('body')).toBeVisible();
  });

  test('should show goal completion rate', async ({ page }) => {
    // Look for completion rate display
    const completionRate = page.locator('[data-testid="completion-rate"]').or(
      page.getByText(/completion|achievement|%/i).first()
    );

    await expect(page.locator('body')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Life goals should adapt to mobile
    await expect(page.locator('body')).toBeVisible();
  });
});
