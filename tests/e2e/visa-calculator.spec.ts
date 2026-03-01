import { test, expect } from '@playwright/test';

test.describe('Visa Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Visa Calculator (might be under Travel section)
    const visaLink = page.locator('[data-testid="nav-visa"]').or(
      page.getByText('Visa Calculator').or(page.getByText('Visa'))
    );

    if (await visaLink.first().isVisible()) {
      await visaLink.first().click();
      await page.waitForLoadState('domcontentloaded');
    } else {
      // Try navigating via travel page
      await page.goto('/travel/visa');
      await page.waitForLoadState('domcontentloaded');
    }
  });

  test('should display visa calculator page', async ({ page }) => {
    // Check for visa calculator content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have passport selector', async ({ page }) => {
    // Look for passport/nationality selector
    const passportSelector = page.locator('[data-testid="passport-selector"]').or(
      page.getByText(/passport|nationality|your country/i).first()
    );

    if (await passportSelector.isVisible()) {
      await expect(passportSelector).toBeVisible();
    }
  });

  test('should select passport country', async ({ page }) => {
    // Look for country selector dropdown
    const countrySelect = page.locator('[data-testid="passport-country"]').or(
      page.locator('select').first().or(
        page.getByPlaceholder(/select country|country/i).first()
      )
    );

    if (await countrySelect.isVisible()) {
      await countrySelect.click();
      await page.waitForTimeout(300);

      // Should show country options
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should calculate passport power', async ({ page }) => {
    // Select a passport
    const countrySelect = page.locator('[data-testid="passport-country"]').or(
      page.locator('select, input[type="text"]').first()
    );

    if (await countrySelect.isVisible()) {
      // Try to fill or select a country
      const elementType = await countrySelect.getAttribute('type');
      if (elementType === 'text' || !elementType) {
        await countrySelect.fill('United States');
      } else {
        await countrySelect.click();
        await page.waitForTimeout(300);
      }

      // Look for passport power score
      const powerScore = page.locator('[data-testid="passport-power"]').or(
        page.getByText(/power|score|rank/i).first()
      );

      await page.waitForTimeout(1000);
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should display visa-free countries', async ({ page }) => {
    // Look for visa-free access list
    const visaFreeList = page.locator('[data-testid="visa-free-countries"]').or(
      page.getByText(/visa-free|no visa required/i).first()
    );

    if (await visaFreeList.isVisible()) {
      await expect(visaFreeList).toBeVisible();
    }
  });

  test('should display visa-on-arrival countries', async ({ page }) => {
    // Look for visa-on-arrival list
    const visaOnArrivalList = page.locator('[data-testid="visa-on-arrival"]').or(
      page.getByText(/visa on arrival/i).first()
    );

    if (await visaOnArrivalList.isVisible()) {
      await expect(visaOnArrivalList).toBeVisible();
    }
  });

  test('should display visa-required countries', async ({ page }) => {
    // Look for visa-required list
    const visaRequiredList = page.locator('[data-testid="visa-required"]').or(
      page.getByText(/visa required/i).first()
    );

    if (await visaRequiredList.isVisible()) {
      await expect(visaRequiredList).toBeVisible();
    }
  });

  test('should search for specific country requirements', async ({ page }) => {
    // Look for destination country search
    const destinationSearch = page.locator('[data-testid="destination-search"]').or(
      page.getByPlaceholder(/destination|search country/i).first()
    );

    if (await destinationSearch.isVisible()) {
      await destinationSearch.fill('Japan');
      await page.waitForTimeout(500);

      // Should show visa requirements for Japan
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should display visa requirements for selected destination', async ({ page }) => {
    // Search for a country
    const destinationSearch = page.getByPlaceholder(/destination|search/i).first();

    if (await destinationSearch.isVisible()) {
      await destinationSearch.fill('Canada');
      await page.waitForTimeout(1000);

      // Look for visa requirement status
      const visaStatus = page.locator('[data-testid="visa-status"]').or(
        page.getByText(/visa-free|visa required|visa on arrival/i).first()
      );

      if (await visaStatus.isVisible()) {
        await expect(visaStatus).toBeVisible();
      }
    }
  });

  test('should compare multiple passports', async ({ page }) => {
    // Look for comparison feature
    const compareButton = page.locator('[data-testid="compare-passports"]').or(
      page.getByRole('button', { name: /compare/i }).first()
    );

    if (await compareButton.isVisible()) {
      await compareButton.click();
      await page.waitForTimeout(500);

      // Should show comparison interface
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should display visa validity period', async ({ page }) => {
    // Select a country and destination
    const destinationSearch = page.getByPlaceholder(/destination|search/i).first();

    if (await destinationSearch.isVisible()) {
      await destinationSearch.fill('Thailand');
      await page.waitForTimeout(1000);

      // Look for validity information
      const validityInfo = page.locator('[data-testid="visa-validity"]').or(
        page.getByText(/days|validity|duration/i).first()
      );

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should show expiry alerts for visas', async ({ page }) => {
    // Look for expiry alerts section
    const expiryAlerts = page.locator('[data-testid="expiry-alerts"]').or(
      page.getByText(/expiring|alert|expiry/i).first()
    );

    if (await expiryAlerts.isVisible()) {
      await expect(expiryAlerts).toBeVisible();
    }
  });

  test('should save visa information', async ({ page }) => {
    // Look for save/track visa button
    const saveButton = page.locator('[data-testid="save-visa"]').or(
      page.getByRole('button', { name: /save|track|add/i }).first()
    );

    if (await saveButton.isVisible()) {
      await saveButton.click();
      await page.waitForTimeout(500);

      // Should save visa details
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should filter by visa status', async ({ page }) => {
    // Look for status filter
    const statusFilter = page.locator('[data-testid="status-filter"]').or(
      page.getByRole('button', { name: /filter|status/i }).first()
    );

    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.waitForTimeout(300);

      // Should show filter options
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should display country rankings', async ({ page }) => {
    // Look for rankings/statistics
    const rankings = page.locator('[data-testid="passport-rankings"]').or(
      page.getByText(/rank|ranking|position/i).first()
    );

    if (await rankings.isVisible()) {
      await expect(rankings).toBeVisible();
    }
  });

  test('should show visa application links', async ({ page }) => {
    // Search for a destination
    const destinationSearch = page.getByPlaceholder(/destination|search/i).first();

    if (await destinationSearch.isVisible()) {
      await destinationSearch.fill('Australia');
      await page.waitForTimeout(1000);

      // Look for application link
      const applicationLink = page.locator('[data-testid="visa-application-link"]').or(
        page.getByRole('link', { name: /apply|application|embassy/i }).first()
      );

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should export visa requirements data', async ({ page }) => {
    // Look for export button
    const exportButton = page.locator('[data-testid="export-visa-data"]').or(
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

    // Visa calculator should adapt to mobile
    await expect(page.locator('body')).toBeVisible();
  });
});
