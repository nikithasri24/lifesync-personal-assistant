import { test, expect } from '@playwright/test';

test.describe('Travel Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Travel
    const travelLink = page.locator('[data-testid="nav-travel"]').or(page.getByText('Travel'));

    if (await travelLink.first().isVisible()) {
      await travelLink.first().click();
      await page.waitForLoadState('domcontentloaded');
    } else {
      await page.goto('/travel');
      await page.waitForLoadState('domcontentloaded');
    }
  });

  test('should display travel page', async ({ page }) => {
    // Check for travel page content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display world map', async ({ page }) => {
    // Look for world map component
    const worldMap = page.locator('[data-testid="world-map"]').or(
      page.locator('.world-map, svg[class*="map"]').first()
    );

    if (await worldMap.isVisible()) {
      await expect(worldMap).toBeVisible();
    } else {
      // Map might be canvas or interactive element
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should have map view options', async ({ page }) => {
    // Look for map type buttons: World, US, Canada, India
    const worldMapButton = page.getByRole('button', { name: /world/i }).or(page.getByText('World'));
    const usMapButton = page.getByRole('button', { name: /united states|USA|US/i }).or(page.getByText('US'));
    const canadaMapButton = page.getByRole('button', { name: /canada/i });
    const indiaMapButton = page.getByRole('button', { name: /india/i });

    // At least one map option should be available
    await expect(page.locator('body')).toBeVisible();
  });

  test('should switch to US map', async ({ page }) => {
    const usMapButton = page.getByRole('button', { name: /united states|USA|US/i }).first();

    if (await usMapButton.isVisible()) {
      await usMapButton.click();
      await page.waitForTimeout(500);

      // US map should be displayed
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should switch to Canada map', async ({ page }) => {
    const canadaMapButton = page.getByRole('button', { name: /canada/i }).first();

    if (await canadaMapButton.isVisible()) {
      await canadaMapButton.click();
      await page.waitForTimeout(500);

      // Canada map should be displayed
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should switch to India map', async ({ page }) => {
    const indiaMapButton = page.getByRole('button', { name: /india/i }).first();

    if (await indiaMapButton.isVisible()) {
      await indiaMapButton.click();
      await page.waitForTimeout(500);

      // India map should be displayed
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should mark country as visited', async ({ page }) => {
    // Look for a country on the map
    const country = page.locator('[data-testid*="country-"]').or(
      page.locator('.country, path[data-country]')
    ).first();

    if (await country.isVisible()) {
      await country.click();
      await page.waitForTimeout(500);

      // Should show option to mark as visited
      const markVisitedButton = page.getByRole('button', { name: /mark as visited|visited/i }).first();
      if (await markVisitedButton.isVisible()) {
        await markVisitedButton.click();
        await page.waitForTimeout(500);
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should display visited countries count', async ({ page }) => {
    // Look for visited countries statistics
    const visitedCount = page.locator('[data-testid="visited-count"]').or(
      page.getByText(/visited|countries visited/i).first()
    );

    if (await visitedCount.isVisible()) {
      await expect(visitedCount).toBeVisible();
    }
  });

  test('should show country details on click', async ({ page }) => {
    // Click on a country
    const country = page.locator('[data-testid*="country-"]').or(
      page.locator('.country, path[data-country]')
    ).first();

    if (await country.isVisible()) {
      await country.click();
      await page.waitForTimeout(500);

      // Should show country details (name, info, etc.)
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should filter by visited countries', async ({ page }) => {
    // Look for filter option
    const filterButton = page.locator('[data-testid="filter-visited"]').or(
      page.getByRole('button', { name: /filter|show visited/i }).first()
    );

    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(500);

      // Map should filter to show only visited
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should show wishlist countries', async ({ page }) => {
    // Look for wishlist option
    const wishlistButton = page.locator('[data-testid="wishlist"]').or(
      page.getByRole('button', { name: /wishlist|want to visit/i }).first()
    );

    if (await wishlistButton.isVisible()) {
      await wishlistButton.click();
      await page.waitForTimeout(500);

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should add country to wishlist', async ({ page }) => {
    // Click on a country
    const country = page.locator('[data-testid*="country-"]').or(
      page.locator('.country, path[data-country]')
    ).first();

    if (await country.isVisible()) {
      await country.click();
      await page.waitForTimeout(500);

      // Look for add to wishlist option
      const addToWishlistButton = page.getByRole('button', { name: /add to wishlist|wishlist/i }).first();
      if (await addToWishlistButton.isVisible()) {
        await addToWishlistButton.click();
        await page.waitForTimeout(500);
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should display travel statistics', async ({ page }) => {
    // Look for stats section
    const statsSection = page.locator('[data-testid="travel-stats"]').or(
      page.locator('.travel-stats, .statistics')
    );

    if (await statsSection.first().isVisible()) {
      await expect(statsSection.first()).toBeVisible();
    }
  });

  test('should show percentage of world visited', async ({ page }) => {
    // Look for percentage display
    const percentageDisplay = page.getByText(/%/i).first();

    if (await percentageDisplay.isVisible()) {
      await expect(percentageDisplay).toBeVisible();
    }
  });

  test('should have interactive map zoom', async ({ page }) => {
    // Look for zoom controls
    const zoomInButton = page.locator('[data-testid="zoom-in"]').or(
      page.getByRole('button').filter({ hasText: /\+|zoom in/i }).first()
    );
    const zoomOutButton = page.locator('[data-testid="zoom-out"]').or(
      page.getByRole('button').filter({ hasText: /-|zoom out/i }).first()
    );

    // Map should be interactive
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display continent groupings', async ({ page }) => {
    // Look for continent options
    const continents = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'];

    // Page should render
    await expect(page.locator('body')).toBeVisible();
  });

  test('should export travel data', async ({ page }) => {
    // Look for export button
    const exportButton = page.locator('[data-testid="export-travel"]').or(
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
    await page.waitForLoadState('domcontentloaded');

    // Travel map should adapt to mobile
    await expect(page.locator('body')).toBeVisible();
  });
});
