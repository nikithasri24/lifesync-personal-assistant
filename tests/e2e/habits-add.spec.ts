import { test, expect } from '@playwright/test'

test.describe('Habits - add a habit', () => {
  test('adds a habit and shows in the list', async ({ page }) => {
    const habitName = `Walk ${Date.now()}`

    await page.goto('/habits')
    await page.waitForLoadState('networkidle')

    // Open the add habit modal using the FAB
    await page.getByRole('button', { name: 'Create new habit' }).click()
    await page.waitForTimeout(500)

    // Fill the habit name field
    await page.getByLabel('Habit Name').fill(habitName)

    // Submit the form
    await page.getByRole('button', { name: /Create Habit/i }).click()
    await page.waitForTimeout(1000)

    // Verify the habit appears in the list
    await expect(page.getByText(habitName)).toBeVisible({ timeout: 10000 })
  })
})

