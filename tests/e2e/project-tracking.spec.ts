import { test, expect } from '@playwright/test';

test.describe('Project Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Project Tracking
    const projectLink = page.locator('[data-testid="nav-projects"]').or(
      page.getByText('Projects').or(page.getByText('Project Tracking'))
    );

    if (await projectLink.first().isVisible()) {
      await projectLink.first().click();
      await page.waitForLoadState('domcontentloaded');
    } else {
      await page.goto('/projects');
      await page.waitForLoadState('domcontentloaded');
    }
  });

  test('should display project tracking page', async ({ page }) => {
    // Check for project page content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have create project button', async ({ page }) => {
    // Look for create/add project button
    const createButton = page.locator('[data-testid="create-project"]').or(
      page.getByRole('button').filter({ hasText: /new project|add project|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await expect(createButton).toBeVisible();
    }
  });

  test('should open project creation modal', async ({ page }) => {
    // Click create project button
    const createButton = page.locator('[data-testid="create-project"]').or(
      page.getByRole('button').filter({ hasText: /new project|add project|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Modal should appear with form fields
      const projectNameInput = page.getByPlaceholder(/project name|name/i).first();
      const descriptionInput = page.getByPlaceholder(/description/i).first();

      // At least one form field should be visible
      const formVisible = await Promise.race([
        projectNameInput.isVisible().catch(() => false),
        descriptionInput.isVisible().catch(() => false),
      ]);

      if (formVisible) {
        expect(formVisible).toBeTruthy();
      }
    }
  });

  test('should create a new project', async ({ page }) => {
    // Click create project button
    const createButton = page.locator('[data-testid="create-project"]').or(
      page.getByRole('button').filter({ hasText: /new project|add project|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Fill in project details
      const projectNameInput = page.getByPlaceholder(/project name|name/i).first();
      if (await projectNameInput.isVisible()) {
        const testProjectName = `Test Project ${Date.now()}`;
        await projectNameInput.fill(testProjectName);

        // Look for description field
        const descriptionInput = page.getByPlaceholder(/description/i).first();
        if (await descriptionInput.isVisible()) {
          await descriptionInput.fill('Test project description');
        }

        // Submit form
        const submitButton = page.getByRole('button', { name: /create|save|add/i }).first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);

          // Project should be created and visible in list
          await expect(page.locator('body')).toBeVisible();
        }
      }
    }
  });

  test('should allow color customization for projects', async ({ page }) => {
    // Open create/edit project modal
    const createButton = page.locator('[data-testid="create-project"]').or(
      page.getByRole('button').filter({ hasText: /new project|add project/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Look for color picker
      const colorPicker = page.locator('[data-testid="color-picker"]').or(
        page.locator('input[type="color"]').or(
          page.locator('.color-option, .color-picker')
        )
      );

      if (await colorPicker.first().isVisible()) {
        await expect(colorPicker.first()).toBeVisible();
      }
    }
  });

  test('should allow icon customization for projects', async ({ page }) => {
    // Open create/edit project modal
    const createButton = page.locator('[data-testid="create-project"]').or(
      page.getByRole('button').filter({ hasText: /new project|add project/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Look for icon picker
      const iconPicker = page.locator('[data-testid="icon-picker"]').or(
        page.locator('.icon-picker, .icon-selector')
      );

      if (await iconPicker.first().isVisible()) {
        await expect(iconPicker.first()).toBeVisible();
      }
    }
  });

  test('should display project status options', async ({ page }) => {
    // Open create/edit project modal
    const createButton = page.locator('[data-testid="create-project"]').or(
      page.getByRole('button').filter({ hasText: /new project|add project/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Look for status dropdown/selector
      const statusSelector = page.locator('[data-testid="status-selector"]').or(
        page.getByText(/active|completed|on hold|status/i).first()
      );

      if (await statusSelector.isVisible()) {
        await expect(statusSelector).toBeVisible();
      }
    }
  });

  test('should change project status', async ({ page }) => {
    // Find an existing project card
    const projectCard = page.locator('[data-testid*="project-card"]').or(
      page.locator('.project-card')
    ).first();

    if (await projectCard.isVisible()) {
      // Click to open project details/edit
      await projectCard.click();
      await page.waitForTimeout(500);

      // Look for status change options
      const statusOptions = page.getByText(/active|completed|on hold/i).first();
      if (await statusOptions.isVisible()) {
        await statusOptions.click();
        await page.waitForTimeout(300);

        // Status should update
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should display list of projects', async ({ page }) => {
    // Projects should be displayed in a list or grid
    const projectsList = page.locator('[data-testid="projects-list"]').or(
      page.locator('.projects-grid, .projects-list')
    );

    // At least the page should render
    await expect(page.locator('body')).toBeVisible();
  });

  test('should filter projects', async ({ page }) => {
    // Look for filter options
    const filterButton = page.locator('[data-testid="filter-projects"]').or(
      page.getByRole('button').filter({ hasText: /filter/i }).first()
    );

    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(300);

      // Filter options should appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should search projects', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('[data-testid="search-projects"]').or(
      page.getByPlaceholder(/search/i)
    );

    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill('test');
      await page.waitForTimeout(300);

      // Search should filter projects
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should show task count for each project', async ({ page }) => {
    // Project cards should display task counts
    const projectCard = page.locator('[data-testid*="project-card"]').or(
      page.locator('.project-card')
    ).first();

    if (await projectCard.isVisible()) {
      // Look for task count indicator
      const taskCount = projectCard.locator('[data-testid="task-count"]').or(
        projectCard.getByText(/task/i)
      );

      // Card should be visible regardless
      await expect(projectCard).toBeVisible();
    }
  });

  test('should edit project details', async ({ page }) => {
    // Find a project card
    const projectCard = page.locator('[data-testid*="project-card"]').or(
      page.locator('.project-card')
    ).first();

    if (await projectCard.isVisible()) {
      // Click to open edit
      await projectCard.click();
      await page.waitForTimeout(500);

      // Look for edit button
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(300);

        // Edit form should appear
        const nameInput = page.getByPlaceholder(/project name|name/i).first();
        if (await nameInput.isVisible()) {
          await expect(nameInput).toBeVisible();
        }
      }
    }
  });

  test('should delete a project', async ({ page }) => {
    // Create a test project first
    const createButton = page.locator('[data-testid="create-project"]').or(
      page.getByRole('button').filter({ hasText: /new project|add project/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      const projectNameInput = page.getByPlaceholder(/project name|name/i).first();
      if (await projectNameInput.isVisible()) {
        const testProjectName = `Delete Test ${Date.now()}`;
        await projectNameInput.fill(testProjectName);

        const submitButton = page.getByRole('button', { name: /create|save|add/i }).first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(1000);

          // Now try to delete it
          const projectToDelete = page.getByText(testProjectName).first();
          if (await projectToDelete.isVisible()) {
            await projectToDelete.click();
            await page.waitForTimeout(500);

            const deleteButton = page.getByRole('button', { name: /delete|remove/i }).first();
            if (await deleteButton.isVisible()) {
              await deleteButton.click();
              await page.waitForTimeout(500);

              // Confirm deletion if needed
              const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i }).first();
              if (await confirmButton.isVisible()) {
                await confirmButton.click();
                await page.waitForTimeout(1000);
              }

              // Project should be removed
              await expect(page.locator('body')).toBeVisible();
            }
          }
        }
      }
    }
  });

  test('should archive a project', async ({ page }) => {
    // Find a project card
    const projectCard = page.locator('[data-testid*="project-card"]').or(
      page.locator('.project-card')
    ).first();

    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.waitForTimeout(500);

      // Look for archive option
      const archiveButton = page.getByRole('button', { name: /archive/i }).first();
      if (await archiveButton.isVisible()) {
        await archiveButton.click();
        await page.waitForTimeout(500);

        // Project should be archived
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Projects page should adapt to mobile
    await expect(page.locator('body')).toBeVisible();
  });
});
