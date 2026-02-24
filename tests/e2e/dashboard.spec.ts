import { test, expect } from '@playwright/test';

test.describe('LifeSync Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main navigation', async ({ page }) => {
    await expect(page.getByText('life weave')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Habits' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Tasks' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Notes' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Journal' })).toBeVisible();
    // Check for "Personal" heading (not "Personal Life")
    await expect(page.getByRole('heading', { name: 'Personal' })).toBeVisible();
  });

  test('should show welcome message', async ({ page }) => {
    // Actual message is "☀️ Good morning, Test1!" (time-based greeting)
    await expect(page.getByText(/Good (morning|afternoon|evening)/i)).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    // Actual stats cards show numeric stats with labels
    // Look for the number and label pattern (e.g., "5" followed by "Tasks Today")
    await expect(page.getByText('Tasks Today')).toBeVisible();

    // Check for at least one stat card by looking for a number pattern
    const statNumbers = page.locator('div').filter({ hasText: /^\d+$/ }).first();
    await expect(statNumbers).toBeVisible();
  });

  test('should navigate between sections', async ({ page }) => {
    // Navigate to Habits
    await page.getByRole('link', { name: 'Habits' }).click();
    await page.waitForLoadState('networkidle');
    // Verify page loaded by checking main element
    await expect(page.locator('main')).toBeVisible();

    // Navigate to Tasks
    await page.getByRole('link', { name: 'Tasks' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Organize and track your to-dos/i)).toBeVisible();

    // Navigate to Notes
    await page.getByRole('link', { name: 'Notes' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();

    // Navigate to Journal
    await page.getByRole('link', { name: 'Journal' }).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();

    // Navigate back to Dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
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