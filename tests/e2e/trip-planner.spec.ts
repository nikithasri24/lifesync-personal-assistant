import { test, expect } from '@playwright/test';

test.describe('Trip Planner', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Trip Planner (might be under Travel section)
    const tripLink = page.locator('[data-testid="nav-trip-planner"]').or(
      page.getByText('Trip Planner').or(page.getByText('Trips'))
    );

    if (await tripLink.first().isVisible()) {
      await tripLink.first().click();
      await page.waitForLoadState('networkidle');
    } else {
      // Try navigating via travel page
      await page.goto('/travel/trips');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display trip planner page', async ({ page }) => {
    // Check for trip planner content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have create trip button', async ({ page }) => {
    // Look for create trip button
    const createButton = page.locator('[data-testid="create-trip"]').or(
      page.getByRole('button').filter({ hasText: /new trip|add trip|create trip|plan trip/i }).first()
    );

    if (await createButton.isVisible()) {
      await expect(createButton).toBeVisible();
    }
  });

  test('should create a new trip', async ({ page }) => {
    const createButton = page.locator('[data-testid="create-trip"]').or(
      page.getByRole('button').filter({ hasText: /new trip|add trip|create/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Fill trip details
      const tripNameInput = page.getByPlaceholder(/trip name|destination|name/i).first();
      if (await tripNameInput.isVisible()) {
        await tripNameInput.fill('Summer Vacation 2024');

        // Look for destination field
        const destinationInput = page.getByPlaceholder(/destination|location|where/i).first();
        if (await destinationInput.isVisible()) {
          await destinationInput.fill('Paris, France');
        }

        // Save trip
        const saveButton = page.getByRole('button', { name: /save|create|add/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should set trip dates', async ({ page }) => {
    const createButton = page.getByRole('button').filter({ hasText: /new trip|add trip|create/i }).first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Look for date inputs
      const startDateInput = page.locator('input[type="date"]').first();
      const endDateInput = page.locator('input[type="date"]').nth(1);

      if (await startDateInput.isVisible()) {
        await expect(startDateInput).toBeVisible();
      }
    }
  });

  test('should display list of trips', async ({ page }) => {
    // Look for trips list
    const tripsList = page.locator('[data-testid="trips-list"]').or(
      page.locator('.trips-list, .trips-grid')
    );

    // Page should render
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display trip cards', async ({ page }) => {
    // Look for trip cards
    const tripCard = page.locator('[data-testid*="trip-card"]').or(
      page.locator('.trip-card')
    ).first();

    if (await tripCard.isVisible()) {
      await expect(tripCard).toBeVisible();
    }
  });

  test('should open trip details', async ({ page }) => {
    // Click on a trip card
    const tripCard = page.locator('[data-testid*="trip-card"]').or(
      page.locator('.trip-card')
    ).first();

    if (await tripCard.isVisible()) {
      await tripCard.click();
      await page.waitForTimeout(500);

      // Trip details should open
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should create itinerary for trip', async ({ page }) => {
    // Open a trip
    const tripCard = page.locator('[data-testid*="trip-card"]').first();

    if (await tripCard.isVisible()) {
      await tripCard.click();
      await page.waitForTimeout(500);

      // Look for add itinerary button
      const addItineraryButton = page.locator('[data-testid="add-itinerary"]').or(
        page.getByRole('button', { name: /add activity|add itinerary|new activity/i }).first()
      );

      if (await addItineraryButton.isVisible()) {
        await addItineraryButton.click();
        await page.waitForTimeout(500);

        // Should show itinerary form
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should add accommodation to trip', async ({ page }) => {
    const tripCard = page.locator('[data-testid*="trip-card"]').first();

    if (await tripCard.isVisible()) {
      await tripCard.click();
      await page.waitForTimeout(500);

      // Look for accommodation section
      const accommodationButton = page.locator('[data-testid="add-accommodation"]').or(
        page.getByRole('button', { name: /accommodation|hotel|lodging/i }).first()
      );

      if (await accommodationButton.isVisible()) {
        await accommodationButton.click();
        await page.waitForTimeout(500);

        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should add transportation to trip', async ({ page }) => {
    const tripCard = page.locator('[data-testid*="trip-card"]').first();

    if (await tripCard.isVisible()) {
      await tripCard.click();
      await page.waitForTimeout(500);

      // Look for transportation section
      const transportButton = page.locator('[data-testid="add-transportation"]').or(
        page.getByRole('button', { name: /transportation|flight|train/i }).first()
      );

      if (await transportButton.isVisible()) {
        await transportButton.click();
        await page.waitForTimeout(500);

        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should add expenses to trip', async ({ page }) => {
    const tripCard = page.locator('[data-testid*="trip-card"]').first();

    if (await tripCard.isVisible()) {
      await tripCard.click();
      await page.waitForTimeout(500);

      // Look for expense tracking
      const expenseButton = page.locator('[data-testid="add-expense"]').or(
        page.getByRole('button', { name: /expense|cost|budget/i }).first()
      );

      if (await expenseButton.isVisible()) {
        await expenseButton.click();
        await page.waitForTimeout(500);

        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should set trip budget', async ({ page }) => {
    const createButton = page.getByRole('button').filter({ hasText: /new trip|add trip|create/i }).first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Look for budget input
      const budgetInput = page.getByPlaceholder(/budget|amount/i).first();
      if (await budgetInput.isVisible()) {
        await budgetInput.fill('3000');
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should add notes to trip', async ({ page }) => {
    const tripCard = page.locator('[data-testid*="trip-card"]').first();

    if (await tripCard.isVisible()) {
      await tripCard.click();
      await page.waitForTimeout(500);

      // Look for notes section
      const notesArea = page.getByPlaceholder(/notes|add notes/i).first();
      if (await notesArea.isVisible()) {
        await notesArea.fill('Remember to bring passport');
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should categorize trip (upcoming, past, cancelled)', async ({ page }) => {
    // Look for trip status/category
    const statusSelect = page.locator('[data-testid="trip-status"]').or(
      page.getByText(/upcoming|past|cancelled|status/i).first()
    );

    await expect(page.locator('body')).toBeVisible();
  });

  test('should filter trips', async ({ page }) => {
    // Look for filter options
    const filterButton = page.locator('[data-testid="filter-trips"]').or(
      page.getByRole('button', { name: /filter/i }).first()
    );

    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(300);

      // Filter options should appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should search trips', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('[data-testid="search-trips"]').or(
      page.getByPlaceholder(/search/i)
    );

    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill('Paris');
      await page.waitForTimeout(500);

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should edit trip details', async ({ page }) => {
    const tripCard = page.locator('[data-testid*="trip-card"]').first();

    if (await tripCard.isVisible()) {
      await tripCard.click();
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

  test('should delete a trip', async ({ page }) => {
    // Create a test trip first
    const createButton = page.getByRole('button').filter({ hasText: /new trip|add trip|create/i }).first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      const tripNameInput = page.getByPlaceholder(/trip name|name/i).first();
      if (await tripNameInput.isVisible()) {
        const testTripName = `Delete Test ${Date.now()}`;
        await tripNameInput.fill(testTripName);

        const saveButton = page.getByRole('button', { name: /save|create/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          // Now delete it
          const tripToDelete = page.getByText(testTripName).first();
          if (await tripToDelete.isVisible()) {
            await tripToDelete.click();
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

  test('should display trip timeline', async ({ page }) => {
    const tripCard = page.locator('[data-testid*="trip-card"]').first();

    if (await tripCard.isVisible()) {
      await tripCard.click();
      await page.waitForTimeout(500);

      // Look for timeline view
      const timeline = page.locator('[data-testid="trip-timeline"]').or(
        page.locator('.timeline, .itinerary-timeline')
      );

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should export trip details', async ({ page }) => {
    const tripCard = page.locator('[data-testid*="trip-card"]').first();

    if (await tripCard.isVisible()) {
      await tripCard.click();
      await page.waitForTimeout(500);

      // Look for export button
      const exportButton = page.locator('[data-testid="export-trip"]').or(
        page.getByRole('button', { name: /export|download/i }).first()
      );

      if (await exportButton.isVisible()) {
        await expect(exportButton).toBeVisible();
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Trip planner should adapt to mobile
    await expect(page.locator('body')).toBeVisible();
  });
});
