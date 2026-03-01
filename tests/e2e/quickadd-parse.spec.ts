import { test, expect } from '@playwright/test'

test.describe('Quick Add parsing (project, date, priority, tags)', () => {
  test('creates a task with tokens and shows under the project', async ({ page }) => {
    await page.goto('/')

    // Create a project via the Projects page
    await page.goto('/projects')
    await page.waitForLoadState('domcontentloaded')

    const createButton = page.locator('[data-testid="create-project"]').or(
      page.getByRole('button').filter({ hasText: /new project|add project|create/i }).first()
    )

    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click()
      await page.waitForTimeout(500)
      await page.getByPlaceholder(/Project name|name/i).fill('Acme Website')

      const descInput = page.getByPlaceholder(/description/i)
      if (await descInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await descInput.fill('E2E Project')
      }

      await page.getByRole('button', { name: /Create Project|Save|Add/i }).click()
      await page.waitForTimeout(1000)
    }

    // Go back to todos
    await page.goto('/')

    // Quick Add a task with tokens
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
    const text = 'Design mock #project:"Acme Website" #design @tomorrow !high'
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(text)
    await page.locator('form button[type="submit"]').click()

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

