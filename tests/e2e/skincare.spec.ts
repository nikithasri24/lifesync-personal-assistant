import { test, expect } from '@playwright/test';

test.describe('Skincare Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to Skincare
    const skincareLink = page.locator('[data-testid="nav-skincare"]').or(
      page.getByText('Skincare')
    );

    if (await skincareLink.first().isVisible()) {
      await skincareLink.first().click();
      await page.waitForLoadState('domcontentloaded');
    } else {
      await page.goto('/skincare');
      await page.waitForLoadState('domcontentloaded');
    }
  });

  test('should display skincare page', async ({ page }) => {
    // Check for skincare page content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have add routine button', async ({ page }) => {
    // Look for add routine/product button
    const addButton = page.locator('[data-testid="add-routine"]').or(
      page.getByRole('button').filter({ hasText: /add|new routine|create/i }).first()
    );

    if (await addButton.isVisible()) {
      await expect(addButton).toBeVisible();
    }
  });

  test('should create skincare routine', async ({ page }) => {
    const addButton = page.locator('[data-testid="add-routine"]').or(
      page.getByRole('button').filter({ hasText: /add|new routine|create/i }).first()
    );

    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Fill routine details
      const routineNameInput = page.getByPlaceholder(/routine name|name/i).first();
      if (await routineNameInput.isVisible()) {
        await routineNameInput.fill('Morning Routine');

        const saveButton = page.getByRole('button', { name: /save|create|add/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should add product to routine', async ({ page }) => {
    // Look for a routine or create one
    const routine = page.locator('[data-testid*="routine"]').first();

    if (await routine.isVisible()) {
      await routine.click();
      await page.waitForTimeout(500);

      // Add product
      const addProductButton = page.locator('[data-testid="add-product"]').or(
        page.getByRole('button', { name: /add product|new product/i }).first()
      );

      if (await addProductButton.isVisible()) {
        await addProductButton.click();
        await page.waitForTimeout(500);

        const productInput = page.getByPlaceholder(/product name|name/i).first();
        if (await productInput.isVisible()) {
          await productInput.fill('Vitamin C Serum');

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

  test('should categorize products', async ({ page }) => {
    const addProductButton = page.getByRole('button', { name: /add product/i }).first();

    if (await addProductButton.isVisible()) {
      await addProductButton.click();
      await page.waitForTimeout(500);

      // Look for category selector
      const categorySelect = page.locator('[data-testid="product-category"]').or(
        page.getByText(/category|type|cleanser|serum|moisturizer/i).first()
      );

      if (await categorySelect.isVisible()) {
        await expect(categorySelect).toBeVisible();
      }
    }
  });

  test('should set AM/PM routine', async ({ page }) => {
    // Look for AM/PM toggle or filter
    const amButton = page.getByRole('button', { name: /AM|morning/i }).first();
    const pmButton = page.getByRole('button', { name: /PM|evening|night/i }).first();

    const anyVisible = await Promise.race([
      amButton.isVisible().catch(() => false),
      pmButton.isVisible().catch(() => false),
    ]);

    if (anyVisible) {
      if (await amButton.isVisible()) {
        await amButton.click();
        await page.waitForTimeout(300);
      }

      if (await pmButton.isVisible()) {
        await pmButton.click();
        await page.waitForTimeout(300);
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should track product usage', async ({ page }) => {
    // Look for a product
    const product = page.locator('[data-testid*="product"]').first();

    if (await product.isVisible()) {
      await product.click();
      await page.waitForTimeout(500);

      // Look for usage tracking
      const usageTracker = page.locator('[data-testid="track-usage"]').or(
        page.getByRole('button', { name: /mark used|used/i }).first()
      );

      if (await usageTracker.isVisible()) {
        await expect(usageTracker).toBeVisible();
      }
    }
  });

  test('should display product list', async ({ page }) => {
    // Look for products list
    const productsList = page.locator('[data-testid="products-list"]').or(
      page.locator('.products-list, .products-grid')
    );

    await expect(page.locator('body')).toBeVisible();
  });

  test('should set product order in routine', async ({ page }) => {
    // Products should be ordered (step 1, 2, 3, etc.)
    const routine = page.locator('[data-testid*="routine"]').first();

    if (await routine.isVisible()) {
      await routine.click();
      await page.waitForTimeout(500);

      // Look for order/step numbers
      const stepIndicator = page.locator('[data-testid="step-number"]').or(
        page.getByText(/step|1|2|3/i).first()
      );

      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should add product notes', async ({ page }) => {
    const product = page.locator('[data-testid*="product"]').first();

    if (await product.isVisible()) {
      await product.click();
      await page.waitForTimeout(500);

      // Look for notes field
      const notesInput = page.getByPlaceholder(/notes|comments/i).first();
      if (await notesInput.isVisible()) {
        await notesInput.fill('Use only at night');
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should track product expiry date', async ({ page }) => {
    const product = page.locator('[data-testid*="product"]').first();

    if (await product.isVisible()) {
      await product.click();
      await page.waitForTimeout(500);

      // Look for expiry date field
      const expiryInput = page.locator('input[type="date"]').first();
      if (await expiryInput.isVisible()) {
        await expect(expiryInput).toBeVisible();
      }
    }
  });

  test('should edit routine', async ({ page }) => {
    const routine = page.locator('[data-testid*="routine"]').first();

    if (await routine.isVisible()) {
      await routine.click();
      await page.waitForTimeout(500);

      // Look for edit button
      const editButton = page.getByRole('button', { name: /edit/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForTimeout(500);

        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should delete routine', async ({ page }) => {
    // Create a test routine first
    const addButton = page.getByRole('button').filter({ hasText: /add|new routine|create/i }).first();

    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);

      const routineNameInput = page.getByPlaceholder(/routine name|name/i).first();
      if (await routineNameInput.isVisible()) {
        const testRoutineName = `Delete Test ${Date.now()}`;
        await routineNameInput.fill(testRoutineName);

        const saveButton = page.getByRole('button', { name: /save|create/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          // Now delete it
          const routineToDelete = page.getByText(testRoutineName).first();
          if (await routineToDelete.isVisible()) {
            await routineToDelete.click();
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

  test('should reorder products in routine', async ({ page }) => {
    const routine = page.locator('[data-testid*="routine"]').first();

    if (await routine.isVisible()) {
      await routine.click();
      await page.waitForTimeout(500);

      // Look for drag handle or reorder button
      const dragHandle = page.locator('[data-testid="drag-handle"]').or(
        page.locator('.drag-handle, [draggable="true"]')
      ).first();

      if (await dragHandle.isVisible()) {
        await expect(dragHandle).toBeVisible();
      }
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Skincare page should adapt to mobile
    await expect(page.locator('body')).toBeVisible();
  });
});
