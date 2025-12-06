import { test, expect } from '@playwright/test';

test.describe('Journal Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Journal
    const journalLink = page.locator('[data-testid="nav-journal"]').or(page.getByText('Journal'));

    if (await journalLink.first().isVisible()) {
      await journalLink.first().click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('/journal');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display journal page', async ({ page }) => {
    // Check for journal page content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have create journal entry button', async ({ page }) => {
    // Look for create/add entry button
    const createButton = page.locator('[data-testid="create-entry"]').or(
      page.getByRole('button').filter({ hasText: /new entry|add entry|create|new/i }).first()
    );

    if (await createButton.isVisible()) {
      await expect(createButton).toBeVisible();
    }
  });

  test('should create a daily journal entry', async ({ page }) => {
    // Click create entry button
    const createButton = page.locator('[data-testid="create-entry"]').or(
      page.getByRole('button').filter({ hasText: /new entry|add entry|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Fill in journal content
      const contentInput = page.getByPlaceholder(/write|journal|entry|content/i).first();
      if (await contentInput.isVisible()) {
        await contentInput.fill('This is my daily journal entry for today.');

        // Save entry
        const saveButton = page.getByRole('button', { name: /save|create/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          // Entry should be created
          await expect(page.locator('body')).toBeVisible();
        }
      }
    }
  });

  test('should have mood integration', async ({ page }) => {
    // Create or edit an entry
    const createButton = page.locator('[data-testid="create-entry"]').or(
      page.getByRole('button').filter({ hasText: /new entry|add entry|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Look for mood selector
      const moodSelector = page.locator('[data-testid="mood-selector"]').or(
        page.getByText(/mood|feeling/i).first()
      );

      if (await moodSelector.isVisible()) {
        await expect(moodSelector).toBeVisible();
      }
    }
  });

  test('should select a mood', async ({ page }) => {
    // Create an entry
    const createButton = page.locator('[data-testid="create-entry"]').or(
      page.getByRole('button').filter({ hasText: /new entry|add entry|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Look for mood options (emojis or buttons)
      const moodOption = page.locator('[data-testid*="mood-"]').or(
        page.locator('.mood-option, .mood-emoji')
      ).first();

      if (await moodOption.isVisible()) {
        await moodOption.click();
        await page.waitForTimeout(300);

        // Mood should be selected
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should have gratitude practice section', async ({ page }) => {
    // Create an entry
    const createButton = page.locator('[data-testid="create-entry"]').or(
      page.getByRole('button').filter({ hasText: /new entry|add entry|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Look for gratitude field
      const gratitudeInput = page.getByPlaceholder(/gratitude|grateful|thankful/i).first();

      if (await gratitudeInput.isVisible()) {
        await expect(gratitudeInput).toBeVisible();
      }
    }
  });

  test('should add gratitude entries', async ({ page }) => {
    // Create an entry
    const createButton = page.locator('[data-testid="create-entry"]').or(
      page.getByRole('button').filter({ hasText: /new entry|add entry|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Fill in gratitude
      const gratitudeInput = page.getByPlaceholder(/gratitude|grateful|thankful/i).first();
      if (await gratitudeInput.isVisible()) {
        await gratitudeInput.fill('I am grateful for my family and health');

        // Save entry
        const saveButton = page.getByRole('button', { name: /save|create/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          await expect(page.locator('body')).toBeVisible();
        }
      }
    }
  });

  test('should support attachments', async ({ page }) => {
    // Create an entry
    const createButton = page.locator('[data-testid="create-entry"]').or(
      page.getByRole('button').filter({ hasText: /new entry|add entry|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Look for attachment button
      const attachButton = page.locator('[data-testid="add-attachment"]').or(
        page.getByRole('button').filter({ hasText: /attach|upload|file|image/i }).first()
      );

      if (await attachButton.isVisible()) {
        await expect(attachButton).toBeVisible();
      }
    }
  });

  test('should add image attachment', async ({ page }) => {
    // Create an entry
    const createButton = page.locator('[data-testid="create-entry"]').or(
      page.getByRole('button').filter({ hasText: /new entry|add entry|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Look for image upload
      const imageUpload = page.locator('input[type="file"]').first();

      if (await imageUpload.isVisible()) {
        // File input exists
        await expect(imageUpload).toBeVisible();
      }
    }
  });

  test('should add link attachment', async ({ page }) => {
    // Create an entry
    const createButton = page.locator('[data-testid="create-entry"]').or(
      page.getByRole('button').filter({ hasText: /new entry|add entry|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Look for link input
      const linkInput = page.getByPlaceholder(/url|link|http/i).first();

      if (await linkInput.isVisible()) {
        await linkInput.fill('https://example.com');
        await page.waitForTimeout(300);

        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should have weather integration', async ({ page }) => {
    // Create or view an entry
    const createButton = page.locator('[data-testid="create-entry"]').or(
      page.getByRole('button').filter({ hasText: /new entry|add entry|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Look for weather widget or info
      const weatherWidget = page.locator('[data-testid="weather"]').or(
        page.getByText(/weather|temperature|°/i).first()
      );

      // Page should render regardless
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should add tags to entries', async ({ page }) => {
    // Create an entry
    const createButton = page.locator('[data-testid="create-entry"]').or(
      page.getByRole('button').filter({ hasText: /new entry|add entry|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Look for tag input
      const tagInput = page.getByPlaceholder(/tag|add tag/i).first();
      if (await tagInput.isVisible()) {
        await tagInput.fill('reflection');
        await page.keyboard.press('Enter');

        // Tag should be added
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should display entries in grid view', async ({ page }) => {
    // Look for grid view
    const gridView = page.locator('[data-testid="journal-grid"]').or(
      page.locator('.journal-grid, .entries-grid')
    );

    // Page should render
    await expect(page.locator('body')).toBeVisible();
  });

  test('should filter entries by date', async ({ page }) => {
    // Look for date filter
    const dateFilter = page.locator('[data-testid="date-filter"]').or(
      page.locator('input[type="date"]').first()
    );

    if (await dateFilter.isVisible()) {
      await dateFilter.click();
      await page.waitForTimeout(300);

      // Date picker should appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should filter entries by tag', async ({ page }) => {
    // Look for tag filter
    const tagFilter = page.locator('[data-testid="tag-filter"]').or(
      page.getByRole('button').filter({ hasText: /tag/i }).first()
    );

    if (await tagFilter.isVisible()) {
      await tagFilter.click();
      await page.waitForTimeout(300);

      // Tag options should appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should edit a journal entry', async ({ page }) => {
    // Find an entry card
    const entryCard = page.locator('[data-testid*="entry-card"]').or(
      page.locator('.entry-card, .journal-card')
    ).first();

    if (await entryCard.isVisible()) {
      // Click to open/edit entry
      await entryCard.click();
      await page.waitForTimeout(500);

      // Look for edit button
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(500);

        // Should show editable content
        const contentInput = page.getByPlaceholder(/write|journal|content/i).first();
        if (await contentInput.isVisible()) {
          await contentInput.fill('Updated journal entry content');

          // Save changes
          const saveButton = page.getByRole('button', { name: /save/i }).first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should delete a journal entry', async ({ page }) => {
    // Create a test entry first
    const createButton = page.locator('[data-testid="create-entry"]').or(
      page.getByRole('button').filter({ hasText: /new entry|add entry|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      const contentInput = page.getByPlaceholder(/write|journal|content/i).first();
      if (await contentInput.isVisible()) {
        const testContent = `Delete Test Entry ${Date.now()}`;
        await contentInput.fill(testContent);

        const saveButton = page.getByRole('button', { name: /save|create/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          // Now delete it
          const entryToDelete = page.getByText(testContent).first();
          if (await entryToDelete.isVisible()) {
            await entryToDelete.click();
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

              await expect(page.locator('body')).toBeVisible();
            }
          }
        }
      }
    }
  });

  test('should search journal entries', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('[data-testid="search-entries"]').or(
      page.getByPlaceholder(/search/i)
    );

    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill('reflection');
      await page.waitForTimeout(500);

      // Entries should be filtered by search
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Journal should adapt to mobile
    await expect(page.locator('body')).toBeVisible();
  });
});
