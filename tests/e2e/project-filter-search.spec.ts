import { test, expect } from '@playwright/test'

test.describe('Project filter combined with search', () => {
  test('filters by project then by search within that project', async ({ page }) => {
    await page.goto('/')

    // Create project
    const projHeader = page.locator('div:has(> h3:has-text("Projects"))')
    await projHeader.getByRole('button').first().click()
    const pname = `FilterProj ${Date.now()}`
    await page.getByPlaceholder('Project name').fill(pname)
    await page.getByPlaceholder('Project description').fill('desc')
    await page.getByRole('button', { name: 'Create Project' }).click()

    // Create two tasks into that project with tokens
    const addBtn = page.getByRole('button', { name: /Add task|Add to /i }).first()
    await addBtn.click()
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(`Alpha X #project:"${pname}"`)
    await page.getByRole('button', { name: /^Add$/ }).click()

    await addBtn.click()
    await page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))
      .fill(`Beta Y #project:"${pname}"`)
    await page.getByRole('button', { name: /^Add$/ }).click()

    // Filter by project then search
    await page.getByText(pname, { exact: true }).first().click()
    await expect(page.getByText('Alpha X').first()).toBeVisible()
    await expect(page.getByText('Beta Y').first()).toBeVisible()

    const search = page.getByPlaceholder('Search tasks...')
    await search.fill('Beta')
    await expect(page.getByText('Beta Y').first()).toBeVisible()
    await expect(page.getByText('Alpha X').first()).toHaveCount(0)
  })
})

