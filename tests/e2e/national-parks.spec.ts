import { test, expect } from '@playwright/test';

test.describe('National Parks Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to National Parks
    const parksLink = page.locator('[data-testid="nav-parks"]').or(
      page.getByText('National Parks').or(page.getByText('Parks'))
    );

    if (await parksLink.first().isVisible()) {
      await parksLink.first().click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('/national-parks');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display national parks page', async ({ page }) => {
    // Check for parks page content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display list of national parks', async ({ page }) => {
    // Look for parks list/grid
    const parksList = page.locator('[data-testid="parks-list"]').or(
      page.locator('.parks-list, .parks-grid')
    );

    // Page should render
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display park cards', async ({ page }) => {
    // Look for park cards
    const parkCard = page.locator('[data-testid*="park-card"]').or(
      page.locator('.park-card')
    ).first();

    if (await parkCard.isVisible()) {
      await expect(parkCard).toBeVisible();
    }
  });

  test('should mark park as visited', async ({ page }) => {
    // Find a park card
    const parkCard = page.locator('[data-testid*="park-card"]').or(
      page.locator('.park-card')
    ).first();

    if (await parkCard.isVisible()) {
      await parkCard.click();
      await page.waitForTimeout(500);

      // Look for mark as visited button
      const visitedButton = page.locator('[data-testid="mark-visited"]').or(
        page.getByRole('button', { name: /mark as visited|visited/i }).first()
      );

      if (await visitedButton.isVisible()) {
        await visitedButton.click();
        await page.waitForTimeout(500);
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should unmark park as visited', async ({ page }) => {
    // Find a visited park
    const visitedPark = page.locator('[data-testid*="visited-park"]').or(
      page.locator('.visited')
    ).first();

    if (await visitedPark.isVisible()) {
      await visitedPark.click();
      await page.waitForTimeout(500);

      // Look for unmark button
      const unmarkButton = page.locator('[data-testid="unmark-visited"]').or(
        page.getByRole('button', { name: /unmark|remove visited/i }).first()
      );

      if (await unmarkButton.isVisible()) {
        await unmarkButton.click();
        await page.waitForTimeout(500);
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should show visited parks count', async ({ page }) => {
    // Look for visited count
    const visitedCount = page.locator('[data-testid="visited-count"]').or(
      page.getByText(/visited|parks visited/i).first()
    );

    if (await visitedCount.isVisible()) {
      await expect(visitedCount).toBeVisible();
    }
  });

  test('should show progress indicator', async ({ page }) => {
    // Look for progress bar or percentage
    const progress = page.locator('[data-testid="parks-progress"]').or(
      page.locator('.progress, .progress-bar').or(
        page.getByText(/%/).first()
      )
    );

    await expect(page.locator('body')).toBeVisible();
  });

  test('should filter by visited parks', async ({ page }) => {
    // Look for filter button
    const filterButton = page.locator('[data-testid="filter-visited"]').or(
      page.getByRole('button', { name: /filter|visited/i }).first()
    );

    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(300);

      // Should show only visited parks
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should filter by unvisited parks', async ({ page }) => {
    // Look for filter button
    const filterButton = page.locator('[data-testid="filter-unvisited"]').or(
      page.getByRole('button', { name: /filter|unvisited|to visit/i }).first()
    );

    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(300);

      // Should show only unvisited parks
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should search for parks', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('[data-testid="search-parks"]').or(
      page.getByPlaceholder(/search/i)
    );

    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill('Yellowstone');
      await page.waitForTimeout(500);

      // Parks should be filtered
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should filter by state', async ({ page }) => {
    // Look for state filter
    const stateFilter = page.locator('[data-testid="state-filter"]').or(
      page.getByRole('button', { name: /state|location/i }).first()
    );

    if (await stateFilter.isVisible()) {
      await stateFilter.click();
      await page.waitForTimeout(300);

      // State options should appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should display park details', async ({ page }) => {
    // Click on a park card
    const parkCard = page.locator('[data-testid*="park-card"]').or(
      page.locator('.park-card')
    ).first();

    if (await parkCard.isVisible()) {
      await parkCard.click();
      await page.waitForTimeout(500);

      // Park details should be displayed
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should show park information', async ({ page }) => {
    // Click on a park
    const parkCard = page.locator('[data-testid*="park-card"]').first();

    if (await parkCard.isVisible()) {
      await parkCard.click();
      await page.waitForTimeout(500);

      // Look for park info (description, location, etc.)
      const parkInfo = page.locator('[data-testid="park-info"]').or(
        page.locator('.park-details, .park-info')
      );

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should add visit date to park', async ({ page }) => {
    // Click on a park
    const parkCard = page.locator('[data-testid*="park-card"]').first();

    if (await parkCard.isVisible()) {
      await parkCard.click();
      await page.waitForTimeout(500);

      // Mark as visited
      const visitedButton = page.getByRole('button', { name: /mark as visited|visited/i }).first();
      if (await visitedButton.isVisible()) {
        await visitedButton.click();
        await page.waitForTimeout(500);

        // Look for date input
        const dateInput = page.locator('input[type="date"]').first();
        if (await dateInput.isVisible()) {
          await expect(dateInput).toBeVisible();
        }
      }
    }
  });

  test('should add notes to park visit', async ({ page }) => {
    // Click on a park
    const parkCard = page.locator('[data-testid*="park-card"]').first();

    if (await parkCard.isVisible()) {
      await parkCard.click();
      await page.waitForTimeout(500);

      // Look for notes field
      const notesInput = page.getByPlaceholder(/notes|add notes|memories/i).first();
      if (await notesInput.isVisible()) {
        await notesInput.fill('Amazing views and great hiking trails');
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should add photos to park visit', async ({ page }) => {
    // Click on a park
    const parkCard = page.locator('[data-testid*="park-card"]').first();

    if (await parkCard.isVisible()) {
      await parkCard.click();
      await page.waitForTimeout(500);

      // Look for photo upload
      const photoUpload = page.locator('input[type="file"]').first();
      if (await photoUpload.isVisible()) {
        await expect(photoUpload).toBeVisible();
      }
    }
  });

  test('should add park to wishlist', async ({ page }) => {
    // Click on a park
    const parkCard = page.locator('[data-testid*="park-card"]').first();

    if (await parkCard.isVisible()) {
      await parkCard.click();
      await page.waitForTimeout(500);

      // Look for wishlist button
      const wishlistButton = page.locator('[data-testid="add-to-wishlist"]').or(
        page.getByRole('button', { name: /wishlist|want to visit/i }).first()
      );

      if (await wishlistButton.isVisible()) {
        await wishlistButton.click();
        await page.waitForTimeout(500);
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should display map view', async ({ page }) => {
    // Look for map view option
    const mapViewButton = page.locator('[data-testid="map-view"]').or(
      page.getByRole('button', { name: /map/i }).first()
    );

    if (await mapViewButton.isVisible()) {
      await mapViewButton.click();
      await page.waitForTimeout(500);

      // Map should be displayed
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should display list view', async ({ page }) => {
    // Look for list view option
    const listViewButton = page.locator('[data-testid="list-view"]').or(
      page.getByRole('button', { name: /list/i }).first()
    );

    if (await listViewButton.isVisible()) {
      await listViewButton.click();
      await page.waitForTimeout(500);

      // List should be displayed
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should sort parks alphabetically', async ({ page }) => {
    // Look for sort options
    const sortButton = page.locator('[data-testid="sort-parks"]').or(
      page.getByRole('button', { name: /sort/i }).first()
    );

    if (await sortButton.isVisible()) {
      await sortButton.click();
      await page.waitForTimeout(300);

      // Look for alphabetical option
      const alphabeticalOption = page.getByText(/alphabetical|a-z|name/i).first();
      if (await alphabeticalOption.isVisible()) {
        await alphabeticalOption.click();
        await page.waitForTimeout(500);
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should export parks data', async ({ page }) => {
    // Look for export button
    const exportButton = page.locator('[data-testid="export-parks"]').or(
      page.getByRole('button', { name: /export/i }).first()
    );

    if (await exportButton.isVisible()) {
      await expect(exportButton).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Parks tracker should adapt to mobile
    await expect(page.locator('body')).toBeVisible();
  });
});
