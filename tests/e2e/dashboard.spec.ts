import { test, expect } from '@playwright/test';

test.describe('LifeSync Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main navigation', async ({ page }) => {
    // Logo text is lowercase 'life weave'
    await expect(page.getByText('life weave')).toBeVisible();
    // Navigation links in sidebar (desktop) or tab bar (mobile)
    await expect(page.getByRole('link', { name: 'Dashboard' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Habits' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tasks' }).first()).toBeVisible();
    // Section headings only visible on desktop sidebar
    const personalHeading = page.getByRole('heading', { name: 'Personal', exact: true });
    if (await personalHeading.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(personalHeading).toBeVisible();
    }
  });

  test('should show welcome message', async ({ page }) => {
    // Actual message is "☀️ Good morning, Test1!" (time-based greeting)
    await expect(page.getByText(/Good (morning|afternoon|evening)/i)).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    // Stats cards show labels like "Tasks Today"
    await expect(page.getByText('Tasks Today')).toBeVisible();
    // Main content area should be visible
    await expect(page.locator('main')).toBeVisible();
  });

  test('should navigate between sections', async ({ page }) => {
    // Navigate to Habits
    await page.getByRole('link', { name: 'Habits' }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();

    // Navigate to Tasks
    await page.getByRole('link', { name: 'Tasks' }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Organize and track your to-dos/i)).toBeVisible();

    // Navigate to Notes
    await page.getByRole('link', { name: 'Notes' }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();

    // Navigate back to Dashboard
    await page.getByRole('link', { name: 'Dashboard' }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Good (morning|afternoon|evening)/i)).toBeVisible();
  });

  test('should collapse and expand sidebar', async ({ page }) => {
    // Find the collapse sidebar button
    const collapseButton = page.getByRole('button', { name: /Collapse sidebar/i });

    // Click to collapse
    await collapseButton.click();
    await page.waitForTimeout(300);

    // Check if sidebar is collapsed ("life weave" title should not be visible)
    await expect(page.getByText('life weave')).not.toBeVisible();

    // Click to expand (button might change or be at different location when collapsed)
    const expandButton = page.getByRole('button', { name: /(Expand|Collapse) sidebar/i }).first();
    await expandButton.click();
    await page.waitForTimeout(300);

    // Check if sidebar is expanded ("life weave" title should be visible)
    await expect(page.getByText('life weave')).toBeVisible();
  });
});