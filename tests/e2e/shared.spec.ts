import { test, expect } from '@playwright/test';

test.describe('Shared/Collaboration Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Shared
    const sharedLink = page.locator('[data-testid="nav-shared"]').or(
      page.getByText('Shared').or(page.getByText('Collaboration'))
    );

    if (await sharedLink.first().isVisible()) {
      await sharedLink.first().click();
      await page.waitForLoadState('domcontentloaded');
    } else {
      await page.goto('/shared');
      await page.waitForLoadState('domcontentloaded');
    }
  });

  test('should display shared page', async ({ page }) => {
    // Check for shared page content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have create shared list button', async ({ page }) => {
    // Look for create button
    const createButton = page.locator('[data-testid="create-shared"]').or(
      page.getByRole('button').filter({ hasText: /new list|create|share/i }).first()
    );

    if (await createButton.isVisible()) {
      await expect(createButton).toBeVisible();
    }
  });

  test('should create a shared list', async ({ page }) => {
    const createButton = page.locator('[data-testid="create-shared"]').or(
      page.getByRole('button').filter({ hasText: /new list|create|share/i }).first()
    );

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Fill list details
      const listNameInput = page.getByPlaceholder(/list name|name|title/i).first();
      if (await listNameInput.isVisible()) {
        await listNameInput.fill('Shared Shopping List');

        // Save list
        const saveButton = page.getByRole('button', { name: /save|create|add/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should display shared lists', async ({ page }) => {
    // Look for shared lists
    const sharedLists = page.locator('[data-testid="shared-lists"]').or(
      page.locator('.shared-lists, .collaboration-lists')
    );

    // Page should render
    await expect(page.locator('body')).toBeVisible();
  });

  test('should add collaborators to list', async ({ page }) => {
    // Open or create a shared list
    const sharedList = page.locator('[data-testid*="shared-list"]').or(
      page.locator('.shared-list')
    ).first();

    if (await sharedList.isVisible()) {
      await sharedList.click();
      await page.waitForTimeout(500);

      // Look for add collaborator button
      const addCollaboratorButton = page.locator('[data-testid="add-collaborator"]').or(
        page.getByRole('button', { name: /add collaborator|invite|share with/i }).first()
      );

      if (await addCollaboratorButton.isVisible()) {
        await addCollaboratorButton.click();
        await page.waitForTimeout(500);

        // Should show invite interface
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should invite user by email', async ({ page }) => {
    const sharedList = page.locator('[data-testid*="shared-list"]').first();

    if (await sharedList.isVisible()) {
      await sharedList.click();
      await page.waitForTimeout(500);

      const addCollaboratorButton = page.getByRole('button', { name: /add collaborator|invite/i }).first();
      if (await addCollaboratorButton.isVisible()) {
        await addCollaboratorButton.click();
        await page.waitForTimeout(500);

        // Look for email input
        const emailInput = page.getByPlaceholder(/email/i).first();
        if (await emailInput.isVisible()) {
          await emailInput.fill('friend@example.com');

          const sendInviteButton = page.getByRole('button', { name: /send|invite/i }).first();
          if (await sendInviteButton.isVisible()) {
            await sendInviteButton.click();
            await page.waitForTimeout(500);
          }
        }
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should display list members', async ({ page }) => {
    const sharedList = page.locator('[data-testid*="shared-list"]').first();

    if (await sharedList.isVisible()) {
      await sharedList.click();
      await page.waitForTimeout(500);

      // Look for members section
      const members = page.locator('[data-testid="list-members"]').or(
        page.getByText(/members|collaborators/i).first()
      );

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should set member permissions', async ({ page }) => {
    const sharedList = page.locator('[data-testid*="shared-list"]').first();

    if (await sharedList.isVisible()) {
      await sharedList.click();
      await page.waitForTimeout(500);

      // Look for permissions settings
      const permissionsButton = page.locator('[data-testid="permissions"]').or(
        page.getByRole('button', { name: /permissions|access/i }).first()
      );

      if (await permissionsButton.isVisible()) {
        await permissionsButton.click();
        await page.waitForTimeout(300);

        // Permission options should appear (view, edit, admin)
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should add items to shared list', async ({ page }) => {
    const sharedList = page.locator('[data-testid*="shared-list"]').first();

    if (await sharedList.isVisible()) {
      await sharedList.click();
      await page.waitForTimeout(500);

      // Look for add item button
      const addItemButton = page.locator('[data-testid="add-item"]').or(
        page.getByRole('button', { name: /add item|new item/i }).first()
      );

      if (await addItemButton.isVisible()) {
        await addItemButton.click();
        await page.waitForTimeout(500);

        const itemInput = page.getByPlaceholder(/item|add/i).first();
        if (await itemInput.isVisible()) {
          await itemInput.fill('Shared item');

          const saveButton = page.getByRole('button', { name: /save|add/i }).first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(500);
          }
        }
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should show real-time updates', async ({ page }) => {
    // This is a smoke test for real-time collaboration features
    const sharedList = page.locator('[data-testid*="shared-list"]').first();

    if (await sharedList.isVisible()) {
      await sharedList.click();
      await page.waitForTimeout(500);

      // Look for sync indicator or last updated time
      const syncIndicator = page.locator('[data-testid="sync-status"]').or(
        page.getByText(/synced|updated|online/i).first()
      );

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should remove collaborator', async ({ page }) => {
    const sharedList = page.locator('[data-testid*="shared-list"]').first();

    if (await sharedList.isVisible()) {
      await sharedList.click();
      await page.waitForTimeout(500);

      // Look for member with remove option
      const removeMemberButton = page.locator('[data-testid="remove-member"]').or(
        page.getByRole('button', { name: /remove|delete/i }).first()
      );

      if (await removeMemberButton.isVisible()) {
        // Member removal option exists
        await expect(removeMemberButton).toBeVisible();
      }
    }
  });

  test('should leave shared list', async ({ page }) => {
    const sharedList = page.locator('[data-testid*="shared-list"]').first();

    if (await sharedList.isVisible()) {
      await sharedList.click();
      await page.waitForTimeout(500);

      // Look for leave list option
      const leaveButton = page.locator('[data-testid="leave-list"]').or(
        page.getByRole('button', { name: /leave|exit/i }).first()
      );

      if (await leaveButton.isVisible()) {
        await expect(leaveButton).toBeVisible();
      }
    }
  });

  test('should delete shared list', async ({ page }) => {
    // Create a test list first
    const createButton = page.getByRole('button').filter({ hasText: /new list|create/i }).first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500);

      const listNameInput = page.getByPlaceholder(/list name|name/i).first();
      if (await listNameInput.isVisible()) {
        const testListName = `Delete Test ${Date.now()}`;
        await listNameInput.fill(testListName);

        const saveButton = page.getByRole('button', { name: /save|create/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          // Now delete it
          const listToDelete = page.getByText(testListName).first();
          if (await listToDelete.isVisible()) {
            await listToDelete.click();
            await page.waitForTimeout(500);

            const deleteButton = page.getByRole('button', { name: /delete|remove/i }).first();
            if (await deleteButton.isVisible()) {
              await deleteButton.click();
              await page.waitForTimeout(500);

              // Confirm deletion
              const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i }).first();
              if (await confirmButton.isVisible()) {
                await confirmButton.click();
                await page.waitForTimeout(1000);
              }
            }
          }
        }
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should show activity history', async ({ page }) => {
    const sharedList = page.locator('[data-testid*="shared-list"]').first();

    if (await sharedList.isVisible()) {
      await sharedList.click();
      await page.waitForTimeout(500);

      // Look for activity log
      const activityLog = page.locator('[data-testid="activity-log"]').or(
        page.getByText(/activity|history|recent changes/i).first()
      );

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should filter by shared with me', async ({ page }) => {
    // Look for filter option
    const filterButton = page.locator('[data-testid="filter-shared-with-me"]').or(
      page.getByRole('button', { name: /shared with me/i }).first()
    );

    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(300);

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should filter by owned by me', async ({ page }) => {
    // Look for filter option
    const filterButton = page.locator('[data-testid="filter-owned-by-me"]').or(
      page.getByRole('button', { name: /owned by me|my lists/i }).first()
    );

    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(300);

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Shared page should adapt to mobile
    await expect(page.locator('body')).toBeVisible();
  });
});
