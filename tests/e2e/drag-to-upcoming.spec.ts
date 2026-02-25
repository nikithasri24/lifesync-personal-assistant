import { test, expect } from '@playwright/test'

/**
 * SKIPPED: V1 UI Test - Sidebar Drag Targets Deprecated
 *
 * This test is for V1 UI which had "Next 7 days" sidebar item as drag target.
 * V2 UI doesn't have sidebar drag targets or "Upcoming" view.
 *
 * V2 Alternative: Use drag-to-calendar feature (tested in drag-to-calendar-date.spec.ts)
 * - Drag tasks to calendar dates within next 7 days to schedule them
 */
test.describe.skip('Drag task to Upcoming (Next 7 days)', () => {
  test('moves task into Upcoming view when dropped', async ({ page }) => {
    await page.goto('/')

    // Quick add a task
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Drop To Upcoming ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.locator('form button[type="submit"]').click()

    const task = page.getByText(title).first()
    const upcomingNav = page.getByText('Next 7 days', { exact: true })
      .or(page.getByRole('button', { name: /Next 7 days/i }))

    await task.dragTo(upcomingNav)

    await upcomingNav.click()
    await expect(page.getByText(title).first()).toBeVisible()
  })
})

