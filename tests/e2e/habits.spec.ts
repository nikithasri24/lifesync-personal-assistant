import { test, expect } from '@playwright/test';

test.describe('Habits Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText('Habits').click();
  });

  test('should display habits page', async ({ page }) => {
    await expect(page.getByText('Build consistent daily routines')).toBeVisible();
    await expect(page.getByText('Add Habit')).toBeVisible();
  });

  test('should show empty state initially', async ({ page }) => {
    await expect(page.getByText('No habits yet')).toBeVisible();
    await expect(page.getByText('Get started by creating your first habit.')).toBeVisible();
  });

  test('should open habit form when Add Habit is clicked', async ({ page }) => {
    await page.getByText('Add Habit').click();
    await expect(page.getByText('Add New Habit')).toBeVisible();
    await expect(page.getByPlaceholder('e.g., Morning meditation')).toBeVisible();
  });

  test('should create a new habit', async ({ page }) => {
    // Click Add Habit button
    await page.getByText('Add Habit').click();
    
    // Fill out the form
    await page.getByPlaceholder('e.g., Morning meditation').fill('Daily Exercise');
    await page.getByPlaceholder('Describe your habit...').fill('30 minutes of physical activity');
    await page.getByRole('combobox').first().selectOption('daily');
    await page.getByRole('spinbutton').fill('1');
    await page.getByRole('combobox').last().selectOption('fitness');
    
    // Select a color (click the first color option)
    await page.locator('button[style*="background-color"]').first().click();
    
    // Submit the form
    await page.getByText('Create Habit').click();
    
    // Verify habit was created
    await expect(page.getByText('Daily Exercise')).toBeVisible();
    await expect(page.getByText('30 minutes of physical activity')).toBeVisible();
    await expect(page.getByText('Fitness', { exact: false })).toBeVisible();
  });

  test('should complete a habit', async ({ page }) => {
    // First create a habit
    await page.getByText('Add Habit').click();
    await page.getByPlaceholder('e.g., Morning meditation').fill('Test Habit');
    await page.getByText('Create Habit').click();
    
    // Complete the habit
    await page.getByText('Mark Complete').click();
    
    // Verify completion
    await expect(page.getByText('Completed Today!')).toBeVisible();
  });

  test('should cancel habit form', async ({ page }) => {
    await page.getByText('Add Habit').click();
    await page.getByText('Cancel').click();
    
    // Form should be closed
    await expect(page.getByText('Add New Habit')).not.toBeVisible();
  });
});