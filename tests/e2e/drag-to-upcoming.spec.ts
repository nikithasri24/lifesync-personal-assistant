import { test, expect } from '@playwright/test'

test.describe('Drag task to Upcoming (Next 7 days)', () => {
  test('moves task into Upcoming view when dropped', async ({ page }) => {
    await page.goto('/')

    // Quick add a task
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Drop To Upcoming ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.getByRole('button', { name: /^Add$/ }).click()

    const task = page.getByText(title).first()
    const upcomingNav = page.getByText('Next 7 days', { exact: true })
      .or(page.getByRole('button', { name: /Next 7 days/i }))

    await task.dragTo(upcomingNav)

    await upcomingNav.click()
    await expect(page.getByText(title).first()).toBeVisible()
  })
})

