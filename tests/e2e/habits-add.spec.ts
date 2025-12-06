import { test, expect } from '@playwright/test'

test.describe('Habits - add a habit', () => {
  test('adds a habit and shows in the list', async ({ page }) => {
    await page.goto('/')
    // Navigate to Habits tab; assuming a sidebar or header nav item labeled "Habits"
    await page.getByText('Habits', { exact: true }).click()

    const input = page.getByPlaceholder('Morning stretch')
    await input.fill(`Walk ${Date.now()}`)
    await input.press('Enter')

    // Verify the habit appears by name somewhere on the page
    await expect(page.getByText(/Walk \d+/).first()).toBeVisible()
  })
})

