import { test, expect } from '@playwright/test'

test.describe('Drag task to a Project', () => {
  test('assigns the task to the project when dropped', async ({ page }) => {
    await page.goto('/')

    // Create a project via sidebar Projects modal
    const projHeader = page.locator('div:has(> h3:has-text("Projects"))')
    await projHeader.getByRole('button').first().click()
    const projectName = `Playground ${Date.now()}`
    await page.getByPlaceholder('Project name').fill(projectName)
    await page.getByPlaceholder('Project description').fill('E2E Project')
    await page.getByRole('button', { name: 'Create Project' }).click()

    // Quick add a task
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const title = `Assign Me ${Date.now()}`
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(title)
    await page.getByRole('button', { name: /^Add$/ }).click()

    // Drag the task to the project in the sidebar list
    const task = page.getByText(title).first()
    const projectNav = page.getByText(projectName, { exact: true }).first()
    await task.dragTo(projectNav)

    // Click the project and verify the task is visible there
    await projectNav.click()
    await expect(page.getByText(title).first()).toBeVisible()
  })
})

