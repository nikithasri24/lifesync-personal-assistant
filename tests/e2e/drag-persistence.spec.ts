import { test, expect } from '@playwright/test'

// SKIPPED: Drag and drop functionality not implemented in V2 UI
// V2 uses modal editing for task status/date changes instead of drag and drop
test.describe.skip('Drag-to-group persistence after reload', () => {
  test('Waiting For persists after reload', async ({ page }) => {
    await page.goto('/')
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Persist Waiting ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.locator('form button[type="submit"]').click()
    const task = page.getByText(title).first()
    const waiting = page.getByText('Waiting For', { exact: true }).first()
      .or(page.getByRole('button', { name: /Waiting For/i }))
    await task.dragTo(waiting)
    await waiting.click()
    await expect(page.getByText(title).first()).toBeVisible()
    await page.reload()
    await expect(page.getByText(title).first()).toBeVisible()
  })

  test('Scheduled persists after reload', async ({ page }) => {
    await page.goto('/')
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Persist Scheduled ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.locator('form button[type="submit"]').click()
    const task = page.getByText(title).first()
    const scheduled = page.getByText('Scheduled', { exact: true }).first()
      .or(page.getByRole('button', { name: /Scheduled/i }))
    await task.dragTo(scheduled)
    await scheduled.click()
    await expect(page.getByText(title).first()).toBeVisible()
    await page.reload()
    await expect(page.getByText(title).first()).toBeVisible()
  })

  test('Project assignment persists after reload', async ({ page }) => {
    await page.goto('/')

    // Create a project via the Projects page
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    const createButton = page.locator('[data-testid="create-project"]').or(
      page.getByRole('button').filter({ hasText: /new project|add project|create/i }).first()
    )

    const projectName = `Persist Project ${Date.now()}`
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click()
      await page.waitForTimeout(500)
      await page.getByPlaceholder(/Project name|name/i).fill(projectName)

      const descInput = page.getByPlaceholder(/description/i)
      if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descInput.fill('E2E Project Persistence')
      }

      await page.getByRole('button', { name: /Create Project|Save|Add/i }).click()
      await page.waitForTimeout(1000)
    }

    // Go back to todos
    await page.goto('/')

    // Create a task
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Persist To Project ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.locator('form button[type="submit"]').click()

    const task = page.getByText(title).first()
    const projectNav = page.getByText(projectName, { exact: true }).first()
    await task.dragTo(projectNav)
    await projectNav.click()
    await expect(page.getByText(title).first()).toBeVisible()
    await page.reload()
    await expect(page.getByText(title).first()).toBeVisible()
  })
})

