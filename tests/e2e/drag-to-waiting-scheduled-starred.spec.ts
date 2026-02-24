import { test, expect } from '@playwright/test'

test.describe('Drag to Waiting/Scheduled/Starred', () => {
  test('drag to Waiting and Scheduled and Starred', async ({ page }) => {
    await page.goto('/')

    // Quick add a task
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Drag Multi ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.locator('form button[type="submit"]').click()

    const task = page.getByText(title).first()

    // Drag to Waiting For
    const waiting = page.getByText('Waiting For', { exact: true }).first()
      .or(page.getByRole('button', { name: /Waiting For/i }))
    await task.dragTo(waiting)
    await waiting.click()
    await expect(page.getByText(title).first()).toBeVisible()

    // Drag to Scheduled
    const scheduled = page.getByText('Scheduled', { exact: true }).first()
      .or(page.getByRole('button', { name: /Scheduled/i }))
    await task.dragTo(scheduled)
    await scheduled.click()
    await expect(page.getByText(title).first()).toBeVisible()

    // Drag to Starred
    const starred = page.getByText('Starred', { exact: true }).first()
      .or(page.getByRole('button', { name: /Starred/i }))
    await task.dragTo(starred)
    await starred.click()
    await expect(page.getByText(title).first()).toBeVisible()
  })
})

