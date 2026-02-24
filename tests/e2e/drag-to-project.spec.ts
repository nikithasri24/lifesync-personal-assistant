import { test, expect } from '@playwright/test'

// SKIPPED: Drag and drop functionality not implemented in V2 UI
// V2 uses modal editing for task project assignment instead of drag and drop
test.describe.skip('Drag task to a Project', () => {
  test('assigns the task to the project when dropped', async ({ page }) => {
    await page.goto('/')

    // Create a project via the Projects page
    await page.goto('/projects')
    await page.waitForLoadState('networkidle')

    const createButton = page.locator('[data-testid="create-project"]').or(
      page.getByRole('button').filter({ hasText: /new project|add project|create/i }).first()
    )

    const projectName = `Playground ${Date.now()}`
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click()
      await page.waitForTimeout(500)
      await page.getByPlaceholder(/Project name|name/i).fill(projectName)

      const descInput = page.getByPlaceholder(/description/i)
      if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descInput.fill('E2E Project')
      }

      await page.getByRole('button', { name: /Create Project|Save|Add/i }).click()
      await page.waitForTimeout(1000)
    }

    // Go back to todos
    await page.goto('/')

    // Quick add a task
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Assign Me ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.locator('form button[type="submit"]').click()

    // Drag the task to the project in the sidebar list
    const task = page.getByText(title).first()
    const projectNav = page.getByText(projectName, { exact: true }).first()
    await task.dragTo(projectNav)

    // Click the project and verify the task is visible there
    await projectNav.click()
    await expect(page.getByText(title).first()).toBeVisible()
  })
})

