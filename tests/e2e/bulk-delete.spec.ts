import { test, expect } from '@playwright/test'

test.describe('Bulk delete tasks to Trash', () => {
  test('Select All then delete; tasks appear in Trash', async ({ page }) => {
    await page.goto('/')

    // Create two tasks
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    for (const name of ['Del A', 'Del B']) {
      await addBtn.click()
      await page.getByRole('textbox', { name: /What needs to be done\?/i })
        .or(page.getByPlaceholder(/What needs to be done\?/i))
        .fill(`${name} ${Date.now()}`)
      await page.getByRole('button', { name: /^Add$/ }).click()
    }

    // Enable bulk mode, Select All, Delete selected
    await page.getByRole('button', { name: /Bulk selection mode/i }).click()
    await page.getByRole('button', { name: /Select All/i }).click()
    await page.getByTitle('Delete selected').click()

    // Verify in Trash
    await page.getByText('Trash', { exact: true }).click()
    await expect(page.getByText(/Del A/).first()).toBeVisible()
    await expect(page.getByText(/Del B/).first()).toBeVisible()
  })
})

