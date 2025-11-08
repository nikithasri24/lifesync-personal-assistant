import { test, expect } from '@playwright/test'

test.describe('Star toggle persistence', () => {
  test('starred state persists after reload', async ({ page }) => {
    await page.goto('/')

    // Quick add
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Persist Star ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.getByRole('button', { name: /^Add$/ }).click()

    const row = page.getByText(title).first()
    const starBtn = row.locator('xpath=ancestor::div[contains(@class,"group")]//button[@title="Star task"]').first()
    await starBtn.click()

    await page.getByText('Starred', { exact: true }).click()
    await expect(page.getByText(title).first()).toBeVisible()

    await page.reload()
    await page.getByText('Starred', { exact: true }).click()
    await expect(page.getByText(title).first()).toBeVisible()
  })
})

