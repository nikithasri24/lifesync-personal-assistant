import { test, expect } from '@playwright/test'

test.describe('Subtask Quick Add tokens (smoke)', () => {
  test('creates a subtask with @today and #tags via quick add', async ({ page }) => {
    await page.goto('/')

    // Open Quick Add and create a parent task
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const quickAdd = page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
    const parentTitle = `Parent E2E ${Date.now()}`
    await quickAdd.fill(parentTitle)
    await page.locator('form button[type="submit"]').click()

    // Scope to the parent task container
    const parentSection = page.locator('div', { has: page.getByText(parentTitle) }).first()

    // Fill the subtask quick add
    const subInput = parentSection.getByPlaceholder(/^Add a subtask/)
    await subInput.fill('Write tests #qa @today !high')
    await parentSection.getByRole('button', { name: 'Add Task' }).click()

    // Verify subtask text appears
    await expect(parentSection.getByText('Write tests').first()).toBeVisible()

    // Verify due date chip shows today (e.g., "Sep 27")
    const today = new Date()
    const month = today.toLocaleString('en-US', { month: 'short' })
    const day = today.getDate()
    await expect(parentSection.getByText(new RegExp(`^${month} ${day}$`))).toBeVisible()
  })
})

