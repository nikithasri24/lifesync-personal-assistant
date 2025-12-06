import { test, expect } from '@playwright/test'

test.describe('Habits E2E', () => {
  test('add, complete, edit, reset, delete', async ({ page }) => {
    // Open app
    await page.goto('/')

    // Navigate to Habits via sidebar
    await page.getByRole('button', { name: 'Habits' }).click({ trial: true }).catch(async () => {
      // Some sidebars use links/spans
      const maybeNav = page.getByText('Habits', { exact: true })
      if (await maybeNav.count()) await maybeNav.first().click()
    })

    // Ensure page has loaded
    await expect(page.getByRole('heading', { name: 'Habit tracker' })).toBeVisible()

    // Fill Add a habit form
    await page.getByTestId('habit-add-name').fill('Hydrate')
    await page.getByTestId('habit-add-submit').click()

    // Expect the new habit card appears
    await expect(page.getByText('Hydrate')).toBeVisible()

    // Complete today
    await page.getByTestId(/habit-complete-/).first().click()
    // Badge updates to "Completed today"
    const firstCard = page.locator('[data-testid^="habit-card-"]').first()
    await expect(firstCard.getByText(/Completed today/i)).toBeVisible()

    // Reset today returns to Today x/y
    await firstCard.getByRole('button', { name: /reset today/i }).click()
    await expect(firstCard.getByText(/Today\s+\d+\/\d+/)).toBeVisible()

    // Optional: Category flow if multiple categories exist
    // Add a second habit and choose a different category if available
    const categorySelect = page.getByLabel('Category').first()
    const optionCount = await categorySelect.locator('option').count()
    if (optionCount >= 2) {
      await page.getByTestId('habit-add-name').fill('Category test')
      const secondOption = categorySelect.locator('option').nth(1)
      const secondOptionValue = await secondOption.getAttribute('value')
      const secondOptionLabel = (await secondOption.textContent())?.trim() || ''
      await categorySelect.selectOption(secondOptionValue!)
      await page.getByTestId('habit-add-submit').click()

      // The new habit card should show the chosen category label
      const newCard = page.locator('article', { hasText: 'Category test' }).first()
      await expect(newCard.getByText(new RegExp(`${secondOptionLabel}\s+•`))).toBeVisible()

      // Edit category back to the first option in the first card
      await firstCard.getByRole('button', { name: /^Edit$/ }).click()
      const editCategory = firstCard.getByLabel('Category')
      const firstOption = editCategory.locator('option').first()
      const firstOptionValue = await firstOption.getAttribute('value')
      const firstOptionLabel = (await firstOption.textContent())?.trim() || ''
      await editCategory.selectOption(firstOptionValue!)
      await firstCard.getByRole('button', { name: /save changes/i }).click()

      // After saving, first card should reflect the first category label
      await expect(firstCard.getByText(new RegExp(`${firstOptionLabel}\s+•`))).toBeVisible()
    }

    // Edit
    await page.getByTestId(/habit-edit-/).first().click()
    await page.getByTestId('habit-edit-name').fill('Hydrate more')
    await page.getByTestId('habit-save-changes').click()
    await expect(page.getByText('Hydrate more')).toBeVisible()

    // Reset today (button labeled Reset today)
    await page.getByTestId(/habit-reset-today-/).first().click()

    // Delete
    await page.getByTestId(/habit-delete-/).first().click()
    await expect(page.getByText('Hydrate more')).toHaveCount(0)

    // Multi-target flow: create a habit with target 3 and complete 3x
    await page.getByTestId('habit-add-name').fill('Multi target habit')
    const targetInput = page.getByLabel('Target count').first()
    await targetInput.fill('3')
    await page.getByTestId('habit-add-submit').click()

    const multiCard = page.locator('article', { hasText: 'Multi target habit' }).first()
    await expect(multiCard.getByText(/Today\s+0\/3/)).toBeVisible()

    const multiComplete = multiCard.getByTestId(/habit-complete-/)
    await multiComplete.click()
    await expect(multiCard.getByText(/Today\s+1\/3/)).toBeVisible()
    await multiComplete.click()
    await expect(multiCard.getByText(/Today\s+2\/3/)).toBeVisible()
    await multiComplete.click()
    await expect(multiCard.getByText(/Completed today\s*\(3\/3\)/)).toBeVisible()
    await expect(multiCard.getByRole('button', { name: /completed today/i })).toBeDisabled()

    // Edit target upwards restores ability to complete again:
    // 1) Create a habit with target 1, complete it (disabled)
    // 2) Edit target to 2 -> badge becomes Today 1/2 and button re-enables
    // 3) Complete again -> Completed today (2/2)
    await page.getByTestId('habit-add-name').fill('Inc target')
    await page.getByTestId('habit-add-submit').click()

    const incCard = page.locator('article', { hasText: 'Inc target' }).first()
    // Complete once: should be Completed today (1/1) and disabled
    await incCard.getByRole('button', { name: /complete today/i }).click()
    await expect(incCard.getByText(/Completed today/)).toBeVisible()
    await expect(incCard.getByRole('button', { name: /completed today/i })).toBeDisabled()

    // Edit: increase target to 2
    await incCard.getByRole('button', { name: /^Edit$/ }).click()
    const incTargetInput = incCard.getByLabel('Target count')
    await incTargetInput.fill('2')
    await incCard.getByRole('button', { name: /save changes/i }).click()

    // Button re-enabled and badge shows Today 1/2
    await expect(incCard.getByText(/Today\s+1\/2/)).toBeVisible()
    await expect(incCard.getByRole('button', { name: /complete today/i })).toBeEnabled()

    // Complete second time -> Completed today (2/2)
    await incCard.getByRole('button', { name: /complete today/i }).click()
    await expect(incCard.getByText(/Completed today\s*\(2\/2\)/)).toBeVisible()
    await expect(incCard.getByRole('button', { name: /completed today/i })).toBeDisabled()
  })

  test('frequency labels and reset streak', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Habits' }).click({ trial: true }).catch(async () => {
      const maybeNav = page.getByText('Habits', { exact: true })
      if (await maybeNav.count()) await maybeNav.first().click()
    })
    await expect(page.getByRole('heading', { name: 'Habit tracker' })).toBeVisible()

    // Weekly
    await page.getByTestId('habit-add-name').fill('Weekly One')
    await page.getByLabel('Frequency').first().selectOption('weekly')
    await page.getByTestId('habit-add-submit').click()
    const weeklyCard = page.locator('article', { hasText: 'Weekly One' }).first()
    await expect(weeklyCard.getByText(/\s•\s*weekly/i)).toBeVisible()

    // Monthly
    await page.getByTestId('habit-add-name').fill('Monthly One')
    await page.getByLabel('Frequency').first().selectOption('monthly')
    await page.getByTestId('habit-add-submit').click()
    const monthlyCard = page.locator('article', { hasText: 'Monthly One' }).first()
    await expect(monthlyCard.getByText(/\s•\s*monthly/i)).toBeVisible()

    // Reset streak clears progress and streak
    await page.getByTestId('habit-add-name').fill('Streak Case')
    await page.getByTestId('habit-add-submit').click()
    const streakCard = page.locator('article', { hasText: 'Streak Case' }).first()

    // Complete once to increment progress
    await streakCard.getByRole('button', { name: /complete today/i }).click()
    // Reset streak
    await streakCard.getByRole('button', { name: /reset streak/i }).click()
    await expect(streakCard.getByText(/Progress:\s*0/i)).toBeVisible()
    await expect(streakCard.getByText(/Streak:\s*0/i)).toBeVisible()
  })

  test('custom frequency with target > 1 progresses correctly', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Habits' }).click({ trial: true }).catch(async () => {
      const maybeNav = page.getByText('Habits', { exact: true })
      if (await maybeNav.count()) await maybeNav.first().click()
    })
    await expect(page.getByRole('heading', { name: 'Habit tracker' })).toBeVisible()

    // Add custom frequency habit with target 2
    await page.getByTestId('habit-add-name').fill('Custom progress')
    await page.getByLabel('Frequency').first().selectOption('custom')
    await page.getByLabel('Target count').first().fill('2')
    await page.getByTestId('habit-add-submit').click()

    const customCard = page.locator('article', { hasText: 'Custom progress' }).first()
    await expect(customCard.getByText(/Other\s+•\s*custom/i)).toBeVisible()
    await expect(customCard.getByText(/Today\s+0\/2/)).toBeVisible()

    // Complete twice -> Completed today (2/2)
    const completeBtn = customCard.getByRole('button', { name: /complete today/i })
    await completeBtn.click()
    await expect(customCard.getByText(/Today\s+1\/2/)).toBeVisible()
    await completeBtn.click()
    await expect(customCard.getByText(/Completed today\s*\(2\/2\)/)).toBeVisible()

    // Reset today then re-complete to restore Completed today
    await customCard.getByRole('button', { name: /reset today/i }).click()
    await expect(customCard.getByText(/Today\s+0\/2/)).toBeVisible()
    await expect(customCard.getByRole('button', { name: /complete today/i })).toBeEnabled()
    await customCard.getByRole('button', { name: /complete today/i }).click()
    await expect(customCard.getByText(/Today\s+1\/2/)).toBeVisible()
    await customCard.getByRole('button', { name: /complete today/i }).click()
    await expect(customCard.getByText(/Completed today\s*\(2\/2\)/)).toBeVisible()
  })

  test('weekly/monthly multi-target complete then reset today', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Habits' }).click({ trial: true }).catch(async () => {
      const maybeNav = page.getByText('Habits', { exact: true })
      if (await maybeNav.count()) await maybeNav.first().click()
    })
    await expect(page.getByRole('heading', { name: 'Habit tracker' })).toBeVisible()

    // Weekly 2/day
    await page.getByTestId('habit-add-name').fill('Weekly MT')
    await page.getByLabel('Frequency').first().selectOption('weekly')
    await page.getByLabel('Target count').first().fill('2')
    await page.getByTestId('habit-add-submit').click()
    const weeklyCard = page.locator('article', { hasText: 'Weekly MT' }).first()
    await expect(weeklyCard.getByText(/\s•\s*weekly/i)).toBeVisible()
    await weeklyCard.getByRole('button', { name: /complete today/i }).click()
    await expect(weeklyCard.getByText(/Today\s+1\/2/)).toBeVisible()
    await weeklyCard.getByRole('button', { name: /complete today/i }).click()
    await expect(weeklyCard.getByText(/Completed today\s*\(2\/2\)/)).toBeVisible()
    await weeklyCard.getByRole('button', { name: /reset today/i }).click()
    await expect(weeklyCard.getByText(/Today\s+0\/2/)).toBeVisible()
    // After reset today, Complete should be re-enabled (like custom case)
    await expect(weeklyCard.getByRole('button', { name: /complete today/i })).toBeEnabled()
    // And re-completing should advance progress again
    await weeklyCard.getByRole('button', { name: /complete today/i }).click()
    await expect(weeklyCard.getByText(/Today\s+1\/2/)).toBeVisible()

    // Monthly 2/day
    await page.getByTestId('habit-add-name').fill('Monthly MT')
    await page.getByLabel('Frequency').first().selectOption('monthly')
    await page.getByLabel('Target count').first().fill('2')
    await page.getByTestId('habit-add-submit').click()
    const monthlyCard = page.locator('article', { hasText: 'Monthly MT' }).first()
    await expect(monthlyCard.getByText(/\s•\s*monthly/i)).toBeVisible()
    await monthlyCard.getByRole('button', { name: /complete today/i }).click()
    await expect(monthlyCard.getByText(/Today\s+1\/2/)).toBeVisible()
    await monthlyCard.getByRole('button', { name: /complete today/i }).click()
    await expect(monthlyCard.getByText(/Completed today\s*\(2\/2\)/)).toBeVisible()
    await monthlyCard.getByRole('button', { name: /reset today/i }).click()
    await expect(monthlyCard.getByText(/Today\s+0\/2/)).toBeVisible()
    // After reset today, Complete should be re-enabled
    await expect(monthlyCard.getByRole('button', { name: /complete today/i })).toBeEnabled()
    // Re-complete should advance progress
    await monthlyCard.getByRole('button', { name: /complete today/i }).click()
    await expect(monthlyCard.getByText(/Today\s+1\/2/)).toBeVisible()
  })
})
