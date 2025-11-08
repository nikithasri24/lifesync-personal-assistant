import { test, expect } from '@playwright/test'

test.describe('Drag task to calendar date', () => {
  test('sets due date when dropped on a calendar day cell', async ({ page }) => {
    await page.goto('/')

    // Quick add a task
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Calendar Drop ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.getByRole('button', { name: /^Add$/ }).click()

    // Go to Calendar view
    await page.getByText('Calendar', { exact: true }).click()

    // Choose a target date (tomorrow) by its day number in the month grid
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
    const dayNum = tomorrow.getDate().toString()

    // Locate the task and the calendar cell by visible day number
    const task = page.getByText(title).first()
    const calendarDay = page.locator('div').filter({ hasText: new RegExp(`^${dayNum}$`) }).first()

    // Drag onto the calendar day
    await task.dragTo(calendarDay)

    // Return to Today list and verify due date chip matches tomorrow
    await page.getByText('Today', { exact: true }).click()
    const month = tomorrow.toLocaleString('en-US', { month: 'short' })
    const day = tomorrow.getDate()
    await expect(page.getByText(title).first()).toBeVisible()
    await expect(page.getByText(new RegExp(`^${month} ${day}$`))).toBeVisible()
  })
})

