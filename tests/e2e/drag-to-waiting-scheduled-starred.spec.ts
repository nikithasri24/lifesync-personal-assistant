import { test, expect } from '@playwright/test'

/**
 * SKIPPED: V1 UI Test - Sidebar Drag Targets Deprecated
 *
 * This test is for V1 UI which had sidebar navigation items as drag targets.
 * V2 UI doesn't have sidebar drag targets - it uses status sections in List view.
 *
 * V2 Equivalent: See drag-status-sections-v2.spec.ts
 * - Drag between To Do, In Progress, Waiting, Done status sections
 * - 7 comprehensive tests covering all V2 drag scenarios
 */
test.describe.skip('Drag to Waiting/Scheduled/Starred', () => {
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

