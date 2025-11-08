import { test, expect } from '@playwright/test'

test.describe('Quick Add parsing (project, date, priority, tags)', () => {
  test('creates a task with tokens and shows under the project', async ({ page }) => {
    await page.goto('/')

    // Create a project via the sidebar Projects section
    const projHeader = page.locator('div:has(> h3:has-text("Projects"))')
    await projHeader.getByRole('button').first().click()
    await page.getByPlaceholder('Project name').fill('Acme Website')
    await page.getByPlaceholder('Project description').fill('E2E Project')
    await page.getByRole('button', { name: 'Create Project' }).click()

    // Quick Add a task with tokens
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
    const text = 'Design mock #project:"Acme Website" #design @tomorrow !high'
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(text)
    await page.getByRole('button', { name: /^Add$/ }).click()

    // Filter by project to ensure it was assigned
    await page.getByText('Acme Website', { exact: true }).first().click()

    // Verify the task appears under that project
    await expect(page.getByText('Design mock').first()).toBeVisible()

    // Verify date chip shows tomorrow
    const month = tomorrow.toLocaleString('en-US', { month: 'short' })
    const day = tomorrow.getDate()
    await expect(page.getByText(new RegExp(`^${month} ${day}$`))).toBeVisible()
  })
})

