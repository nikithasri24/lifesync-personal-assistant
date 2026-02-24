import { test, expect } from '@playwright/test'

test.describe('Star toggle', () => {
  test('stars a task and shows it in Starred', async ({ page }) => {
    await page.goto('/')

    // Quick add
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Star Me ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.locator('form button[type="submit"]').click()

    // Click star action button in the row
    const row = page.getByText(title).first()
    const starBtn = row.locator('xpath=ancestor::div[contains(@class,"group")]//button[@title="Star task"]').first()
    await starBtn.click()

    // Navigate to Starred and verify
    await page.getByText('Starred', { exact: true }).click()
    await expect(page.getByText(title).first()).toBeVisible()
  })
})

