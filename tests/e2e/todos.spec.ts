import { test, expect } from '@playwright/test';

test.describe('Tasks Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByText('Tasks').click();
  });

  test('should display tasks page', async ({ page }) => {
    await expect(page.getByText('Manage your daily tasks and projects')).toBeVisible();
    await expect(page.getByText('Add Task')).toBeVisible();
  });

  test('should show filters', async ({ page }) => {
    await expect(page.getByText('All')).toBeVisible();
    await expect(page.getByText('Active')).toBeVisible();
    await expect(page.getByText('Completed')).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    // Click Add Task button
    await page.getByText('Add Task').click();
    
    // Fill out the form
    await page.getByPlaceholder('What needs to be done?').fill('Buy groceries');
    await page.getByPlaceholder('Add more details...').fill('Get milk, bread, and eggs');
    await page.getByRole('combobox').first().selectOption('high');
    await page.getByRole('spinbutton').fill('60');
    
    // Add a tag
    await page.getByPlaceholder('Add a tag...').fill('shopping');
    await page.getByText('Add', { exact: true }).click();
    
    // Submit the form
    await page.getByText('Create Task').click();
    
    // Verify task was created
    await expect(page.getByText('Buy groceries')).toBeVisible();
    await expect(page.getByText('Get milk, bread, and eggs')).toBeVisible();
    await expect(page.getByText('high')).toBeVisible();
    await expect(page.getByText('shopping')).toBeVisible();
  });

  test('should toggle task completion', async ({ page }) => {
    // First create a task
    await page.getByText('Add Task').click();
    await page.getByPlaceholder('What needs to be done?').fill('Test Task');
    await page.getByText('Create Task').click();
    
    // Toggle completion
    await page.locator('button').filter({ hasText: /^$/ }).first().click();
    
    // Verify task is completed (should show as checked)
    await expect(page.locator('[data-testid="completed-task"]').or(page.locator('.text-green-600'))).toBeVisible();
  });

  test('should filter tasks', async ({ page }) => {
    // Create a task first
    await page.getByText('Add Task').click();
    await page.getByPlaceholder('What needs to be done?').fill('Test Task');
    await page.getByText('Create Task').click();
    
    // Complete the task
    await page.locator('button').filter({ hasText: /^$/ }).first().click();
    
    // Filter to show only completed tasks
    await page.getByText('Completed').click();
    await expect(page.getByText('Test Task')).toBeVisible();
    
    // Filter to show only active tasks
    await page.getByText('Active').click();
    await expect(page.getByText('No tasks yet')).toBeVisible();
    
    // Show all tasks
    await page.getByText('All').click();
    await expect(page.getByText('Test Task')).toBeVisible();
  });

  test('should delete a task', async ({ page }) => {
    // Create a task first
    await page.getByText('Add Task').click();
    await page.getByPlaceholder('What needs to be done?').fill('Task to Delete');
    await page.getByText('Create Task').click();
    
    // Delete the task
    await page.locator('button[title="Delete"]').or(page.getByRole('button').last()).click();
    
    // Verify task is deleted
    await expect(page.getByText('Task to Delete')).not.toBeVisible();
  });
});