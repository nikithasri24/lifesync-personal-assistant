import { test, expect } from '@playwright/test'

test.describe('Bulk archive tasks', () => {
  test('selects all and archives; tasks appear in Archived view', async ({ page }) => {
    await page.goto('/')

    // Create two tasks
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const t1 = `Bulk T1 ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(t1)
    await page.getByRole('button', { name: /^Add$/ }).click()

    await addBtn.click()
    const t2 = `Bulk T2 ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(t2)
    await page.getByRole('button', { name: /^Add$/ }).click()

    // Enable bulk mode and select all
    await page.getByRole('button', { name: /Bulk selection mode/i }).click()
    await page.getByRole('button', { name: /Select All/i }).click()

    // Archive selected
    await page.getByTitle('Archive selected').click()

    // Switch to Archived
    await page.getByText('Archived', { exact: true }).click()
    await expect(page.getByText(t1).first()).toBeVisible()
    await expect(page.getByText(t2).first()).toBeVisible()
  })
})
