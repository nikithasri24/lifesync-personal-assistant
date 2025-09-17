import { test, expect } from '@playwright/test';

test.describe('LifeSync Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main navigation', async ({ page }) => {
    await expect(page.getByText('LifeSync')).toBeVisible();
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Habits')).toBeVisible();
    await expect(page.getByText('Tasks')).toBeVisible();
    await expect(page.getByText('Notes')).toBeVisible();
    await expect(page.getByText('Journal')).toBeVisible();
    await expect(page.getByText('Personal Life')).toBeVisible();
  });

  test('should show welcome message', async ({ page }) => {
    await expect(page.getByText('Welcome back!')).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    await expect(page.getByText("Today's Tasks")).toBeVisible();
    await expect(page.getByText('Pending Habits')).toBeVisible();
    await expect(page.getByText('Total Notes')).toBeVisible();
  });

  test('should navigate between sections', async ({ page }) => {
    // Navigate to Habits
    await page.getByText('Habits').click();
    await expect(page.getByText('Build consistent daily routines')).toBeVisible();

    // Navigate to Tasks
    await page.getByText('Tasks').click();
    await expect(page.getByText('Manage your daily tasks and projects')).toBeVisible();

    // Navigate to Notes
    await page.getByText('Notes').click();
    await expect(page.getByText('Capture your thoughts and ideas')).toBeVisible();

    // Navigate to Journal
    await page.getByText('Journal').click();
    await expect(page.getByText('Record your thoughts, feelings, and daily experiences')).toBeVisible();

    // Navigate to Personal Life
    await page.getByText('Personal Life').click();
    await expect(page.getByText('Organize your shopping, recipes, and finances')).toBeVisible();

    // Navigate back to Dashboard
    await page.getByText('Dashboard').click();
    await expect(page.getByText('Welcome back!')).toBeVisible();
  });

  test('should collapse and expand sidebar', async ({ page }) => {
    // Find the menu toggle button
    const menuButton = page.locator('button').first();
    
    // Click to collapse
    await menuButton.click();
    
    // Check if sidebar is collapsed (LifeSync title should not be visible)
    await expect(page.getByText('LifeSync')).not.toBeVisible();
    
    // Click to expand
    await menuButton.click();
    
    // Check if sidebar is expanded (LifeSync title should be visible)
    await expect(page.getByText('LifeSync')).toBeVisible();
  });
});