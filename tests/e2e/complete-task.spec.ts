import { test, expect } from '@playwright/test'

test.describe('Complete task flow', () => {
  test('marks a task as completed and appears in Completed view', async ({ page }) => {
    await page.goto('/')

    // Quick add
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Complete Me ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    // Click submit button inside modal (not the FAB)
    await page.locator('form button[type="submit"]').click()

    // Click the status button (left checkbox) in the row of this task
    const row = page.getByText(title).first()
    const statusButton = row.locator('xpath=ancestor::div[contains(@class,"group")]//button').first()
    await statusButton.click()

    // Switch to Completed and verify
    await page.getByText('Completed', { exact: true }).click()
    await expect(page.getByText(title).first()).toBeVisible()
  })
})

