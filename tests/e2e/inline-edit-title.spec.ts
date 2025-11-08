import { test, expect } from '@playwright/test'

test.describe('Inline edit task title', () => {
  test('renames a task and persists after reload', async ({ page }) => {
    await page.goto('/')

    // Quick add a task
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Inline Edit ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.getByRole('button', { name: /^Add$/ }).click()

    const row = page.getByText(title).first()
    await row.click()

    const input = page.getByDisplayValue(title)
    const newTitle = `${title} Renamed`
    await input.fill(newTitle)
    await input.press('Enter')

    // Verify immediately
    await expect(page.getByText(newTitle).first()).toBeVisible()

    // Reload and verify persistence
    await page.reload()
    await expect(page.getByText(newTitle).first()).toBeVisible()
  })
})

