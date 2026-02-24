import { test, expect } from '@playwright/test'

// SKIPPED: Drag and drop functionality not implemented in V2 UI
// V2 uses modal editing for task status/date changes instead of drag and drop
test.describe.skip('Drag task to Today (sidebar)', () => {
  test('sets due date to today when dropped on Today', async ({ page }) => {
    await page.goto('/')

    // Quick add a task in the sidebar
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Drop To Today ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.locator('form button[type="submit"]').click()

    // Locate the task and the Today sidebar item
    const task = page.getByText(title).first()
    const todayNav = page.getByRole('button', { name: /^Today$/ }).first()
      .or(page.getByText(/^Today$/).first())

    // Drag the task over the Today nav item
    await task.dragTo(todayNav)

    // Switch to Today view explicitly and verify the task and chip
    await page.getByText('Today', { exact: true }).click()
    await expect(page.getByText(title).first()).toBeVisible()
    const today = new Date()
    const month = today.toLocaleString('en-US', { month: 'short' })
    const day = today.getDate()
    await expect(page.getByText(new RegExp(`^${month} ${day}$`))).toBeVisible()
  })
})

