import { test, expect } from '@playwright/test'

test.describe('Task reorder persistence (smoke)', () => {
  test('drag to reorder and persist across reload', async ({ page }) => {
    await page.goto('/')

    // Open Quick Add
    const addButton = page.getByRole('button', { name: /Add task|Add to /i })
    await addButton.first().click()

    const input = page.getByRole('textbox', { name: /What needs to be done\?/i })
      .or(page.getByPlaceholder(/What needs to be done\?/i))

    const t1 = `AA Task ${Date.now()}`
    const t2 = `BB Task ${Date.now()}`

    // Create first task
    await input.fill(t1)
    await page.locator('form button[type="submit"]').click()

    // Create second task
    await addButton.first().click()
    await input.fill(t2)
    await page.locator('form button[type="submit"]').click()

    // Ensure both tasks rendered
    const t1Loc = page.getByText(t1).first()
    const t2Loc = page.getByText(t2).first()
    await expect(t1Loc).toBeVisible()
    await expect(t2Loc).toBeVisible()

    // Drag t2 above t1
    await t2Loc.dragTo(t1Loc)

    // Read positions
    const pos = async (loc: typeof t1Loc) => loc.evaluate((el) => el.getBoundingClientRect().top)
    const top1After = await pos(t1Loc)
    const top2After = await pos(t2Loc)
    expect(top2After).toBeLessThan(top1After)

    // Reload and verify order persisted
    await page.reload()
    const t1AfterReload = page.getByText(t1).first()
    const t2AfterReload = page.getByText(t2).first()
    await expect(t1AfterReload).toBeVisible()
    await expect(t2AfterReload).toBeVisible()
    const a1 = await t1AfterReload.evaluate((el) => el.getBoundingClientRect().top)
    const a2 = await t2AfterReload.evaluate((el) => el.getBoundingClientRect().top)
    expect(a2).toBeLessThan(a1)
  })
})

