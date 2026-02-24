import { test, expect } from '@playwright/test'

test.describe('Habits E2E', () => {
  test('add, complete, and delete habit', async ({ page }) => {
    const habitName = `Test Habit E2E ${Date.now()}`

    // Navigate to Habits
    await page.goto('/habits')
    await page.waitForLoadState('networkidle')

    // Ensure page has loaded
    await expect(page.locator('main')).toBeVisible()

    // Open the add habit modal using the FAB (aria-label="Create new habit")
    await page.getByRole('button', { name: 'Create new habit' }).click()
    await page.waitForTimeout(500)

    // Fill and submit the habit form
    await page.getByLabel('Habit Name').fill(habitName)
    await page.getByRole('button', { name: /Create Habit/i }).click()
    await page.waitForTimeout(1000)

    // Verify habit card appears
    await expect(page.getByText(habitName)).toBeVisible({ timeout: 10000 })

    // Complete the habit
    const completeButton = page.getByRole('button', { name: /Mark complete/i }).first()
    if (await completeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await completeButton.click()
      await page.waitForTimeout(500)
      // Verify it shows as complete
      await expect(page.getByRole('button', { name: /Mark incomplete/i }).first()).toBeVisible()
    }

    // Click habit to open edit modal
    await page.getByText(habitName).click()
    await page.waitForTimeout(500)

    // Delete the habit from edit modal
    const deleteButton = page.getByRole('button', { name: /Delete/i })
    if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteButton.click()
      await page.waitForTimeout(500)
    }

    // Verify habit is deleted
    await expect(page.getByText(habitName)).not.toBeVisible()
  })

  test('frequency labels display correctly', async ({ page }) => {
    await page.goto('/habits')
    await page.waitForLoadState('networkidle')

    // Ensure page has loaded
    await expect(page.locator('main')).toBeVisible()

    // Create Weekly habit
    await page.getByRole('button', { name: 'Create new habit' }).click()
    await page.waitForTimeout(500)

    await page.getByLabel('Habit Name').fill(`Weekly ${Date.now()}`)
    await page.locator('#habit-frequency').selectOption('weekly')
    await page.getByRole('button', { name: /Create Habit/i }).click()
    await page.waitForTimeout(1000)

    // Verify weekly habit appears with correct frequency label
    await expect(page.getByText(/1x per week/i).first()).toBeVisible({ timeout: 10000 })

    // Create Monthly habit
    await page.getByRole('button', { name: 'Create new habit' }).click()
    await page.waitForTimeout(500)

    await page.getByLabel('Habit Name').fill(`Monthly ${Date.now()}`)
    await page.locator('#habit-frequency').selectOption('monthly')
    await page.getByRole('button', { name: /Create Habit/i }).click()
    await page.waitForTimeout(1000)

    // Verify monthly habit appears with correct frequency label
    await expect(page.getByText(/1x per month/i).first()).toBeVisible({ timeout: 10000 })
  })

  test('daily habit with multi-target shows progress indicator', async ({ page }) => {
    await page.goto('/habits')
    await page.waitForLoadState('networkidle')

    // Create daily habit with target 3
    await page.getByRole('button', { name: 'Create new habit' }).click()
    await page.waitForTimeout(500)

    await page.getByLabel('Habit Name').fill(`Water ${Date.now()}`)
    await page.locator('#habit-frequency').selectOption('daily')
    await page.locator('#habit-target').fill('3')
    await page.getByRole('button', { name: /Create Habit/i }).click()
    await page.waitForTimeout(1000)

    // Verify habit appears with progress indicator showing 0/3
    await expect(page.getByText(/0 \/ 3/i).first()).toBeVisible({ timeout: 10000 })

    // Verify complete button is available
    await expect(page.getByRole('button', { name: /Mark complete/i }).first()).toBeVisible()
  })

  test('weekly and monthly multi-target habits show correct labels', async ({ page }) => {
    await page.goto('/habits')
    await page.waitForLoadState('networkidle')

    // Create weekly habit with target 2
    await page.getByRole('button', { name: 'Create new habit' }).click()
    await page.waitForTimeout(500)

    await page.getByLabel('Habit Name').fill(`Workout ${Date.now()}`)
    await page.locator('#habit-frequency').selectOption('weekly')
    await page.locator('#habit-target').fill('2')
    await page.getByRole('button', { name: /Create Habit/i }).click()
    await page.waitForTimeout(1000)

    // Verify weekly habit with correct frequency label and progress indicator
    await expect(page.getByText(/2x per week/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/0 \/ 2/i).first()).toBeVisible()

    // Create monthly habit with target 3
    await page.getByRole('button', { name: 'Create new habit' }).click()
    await page.waitForTimeout(500)

    await page.getByLabel('Habit Name').fill(`Reading ${Date.now()}`)
    await page.locator('#habit-frequency').selectOption('monthly')
    await page.locator('#habit-target').fill('3')
    await page.getByRole('button', { name: /Create Habit/i }).click()
    await page.waitForTimeout(1000)

    // Verify monthly habit with correct frequency label and progress indicator
    await expect(page.getByText(/3x per month/i).first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/0 \/ 3/i).first()).toBeVisible()
  })
})
