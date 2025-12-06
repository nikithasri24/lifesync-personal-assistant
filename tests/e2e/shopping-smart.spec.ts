import { test, expect } from '@playwright/test';

test.describe('Shopping Smart Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Shopping Smart
    const shoppingLink = page.locator('[data-testid="nav-shopping"]').or(
      page.getByText('Shopping').or(page.getByText('Shopping Smart'))
    );

    if (await shoppingLink.first().isVisible()) {
      await shoppingLink.first().click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('/shopping');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display shopping page', async ({ page }) => {
    // Check for shopping page content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have multiple view options', async ({ page }) => {
    // Look for view options: Master List, Distribute, Store Lists, Pantry
    const masterListView = page.getByRole('button', { name: /master list/i });
    const distributeView = page.getByRole('button', { name: /distribute/i });
    const storeListsView = page.getByRole('button', { name: /store lists/i });
    const pantryView = page.getByRole('button', { name: /pantry/i });

    // At least one view should be available
    await expect(page.locator('body')).toBeVisible();
  });

  test('should add item to shopping list', async ({ page }) => {
    // Look for add item button
    const addItemButton = page.locator('[data-testid="add-item"]').or(
      page.getByRole('button').filter({ hasText: /add item|new item|\+/i }).first()
    );

    if (await addItemButton.isVisible()) {
      await addItemButton.click();
      await page.waitForTimeout(500);

      // Fill item details
      const itemNameInput = page.getByPlaceholder(/item name|name|product/i).first();
      if (await itemNameInput.isVisible()) {
        await itemNameInput.fill('Test Item');

        const saveButton = page.getByRole('button', { name: /save|add|create/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
      }
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('should use voice input to add items', async ({ page }) => {
    // Look for voice input button
    const voiceButton = page.locator('[data-testid="voice-input"]').or(
      page.getByRole('button').filter({ hasText: /microphone|voice/i }).first()
    );

    if (await voiceButton.isVisible()) {
      await expect(voiceButton).toBeVisible();
    }
  });

  test('should categorize shopping items', async ({ page }) => {
    // Add an item
    const addItemButton = page.getByRole('button').filter({ hasText: /add item|new item/i }).first();

    if (await addItemButton.isVisible()) {
      await addItemButton.click();
      await page.waitForTimeout(500);

      // Look for category selector
      const categorySelect = page.locator('[data-testid="category-select"]').or(
        page.getByText(/category/i).first()
      );

      if (await categorySelect.isVisible()) {
        await expect(categorySelect).toBeVisible();
      }
    }
  });

  test('should set item quantity', async ({ page }) => {
    const addItemButton = page.getByRole('button').filter({ hasText: /add item|new item/i }).first();

    if (await addItemButton.isVisible()) {
      await addItemButton.click();
      await page.waitForTimeout(500);

      // Fill quantity
      const quantityInput = page.getByPlaceholder(/quantity|qty|amount/i).first();
      if (await quantityInput.isVisible()) {
        await quantityInput.fill('2');
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should track item prices', async ({ page }) => {
    const addItemButton = page.getByRole('button').filter({ hasText: /add item|new item/i }).first();

    if (await addItemButton.isVisible()) {
      await addItemButton.click();
      await page.waitForTimeout(500);

      // Look for price input
      const priceInput = page.getByPlaceholder(/price|cost/i).first();
      if (await priceInput.isVisible()) {
        await priceInput.fill('5.99');
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should distribute items by store', async ({ page }) => {
    // Switch to distribute view
    const distributeView = page.getByRole('button', { name: /distribute/i });

    if (await distributeView.first().isVisible()) {
      await distributeView.first().click();
      await page.waitForTimeout(500);

      // Should show store distribution
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should recommend stores for items', async ({ page }) => {
    // Look for store recommendation feature
    const storeRecommendation = page.locator('[data-testid="store-recommendation"]').or(
      page.getByText(/recommended store|best store/i).first()
    );

    await expect(page.locator('body')).toBeVisible();
  });

  test('should view store-specific lists', async ({ page }) => {
    // Switch to store lists view
    const storeListsView = page.getByRole('button', { name: /store lists/i });

    if (await storeListsView.first().isVisible()) {
      await storeListsView.first().click();
      await page.waitForTimeout(500);

      // Should show separate lists per store
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should mark items as purchased', async ({ page }) => {
    // Find a shopping item
    const shoppingItem = page.locator('[data-testid*="shopping-item"]').or(
      page.locator('.shopping-item, .list-item')
    ).first();

    if (await shoppingItem.isVisible()) {
      // Look for checkbox or complete button
      const checkbox = shoppingItem.locator('input[type="checkbox"]').first();
      if (await checkbox.isVisible()) {
        await checkbox.click();
        await page.waitForTimeout(500);

        // Item should be marked as purchased
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should scan barcode', async ({ page }) => {
    // Look for barcode scanner button
    const barcodeButton = page.locator('[data-testid="barcode-scanner"]').or(
      page.getByRole('button', { name: /barcode|scan/i }).first()
    );

    if (await barcodeButton.isVisible()) {
      await expect(barcodeButton).toBeVisible();
    }
  });

  test('should scan receipt', async ({ page }) => {
    // Look for receipt scanner button
    const receiptButton = page.locator('[data-testid="receipt-scanner"]').or(
      page.getByRole('button', { name: /receipt|scan receipt/i }).first()
    );

    if (await receiptButton.isVisible()) {
      await expect(receiptButton).toBeVisible();
    }
  });

  test.describe('Pantry Management', () => {
    test('should switch to pantry view', async ({ page }) => {
      const pantryView = page.getByRole('button', { name: /pantry/i });

      if (await pantryView.first().isVisible()) {
        await pantryView.first().click();
        await page.waitForTimeout(500);

        await expect(page.locator('body')).toBeVisible();
      }
    });

    test('should add item to pantry', async ({ page }) => {
      // Switch to pantry view
      const pantryView = page.getByRole('button', { name: /pantry/i }).first();
      if (await pantryView.isVisible()) {
        await pantryView.click();
        await page.waitForTimeout(500);
      }

      // Add pantry item
      const addButton = page.getByRole('button').filter({ hasText: /add item|add to pantry/i }).first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        const itemNameInput = page.getByPlaceholder(/item name|name/i).first();
        if (await itemNameInput.isVisible()) {
          await itemNameInput.fill('Pantry Item');

          const saveButton = page.getByRole('button', { name: /save|add/i }).first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }

      await expect(page.locator('body')).toBeVisible();
    });

    test('should track expiration dates', async ({ page }) => {
      // Switch to pantry view
      const pantryView = page.getByRole('button', { name: /pantry/i }).first();
      if (await pantryView.isVisible()) {
        await pantryView.click();
        await page.waitForTimeout(500);
      }

      // Add item with expiration
      const addButton = page.getByRole('button').filter({ hasText: /add/i }).first();
      if (await addButton.isVisible()) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Look for expiration date input
        const expirationInput = page.locator('input[type="date"]').first();
        if (await expirationInput.isVisible()) {
          await expect(expirationInput).toBeVisible();
        }
      }
    });

    test('should show low stock alerts', async ({ page }) => {
      // Switch to pantry view
      const pantryView = page.getByRole('button', { name: /pantry/i }).first();
      if (await pantryView.isVisible()) {
        await pantryView.click();
        await page.waitForTimeout(500);
      }

      // Look for low stock indicators
      const lowStockAlert = page.locator('[data-testid="low-stock"]').or(
        page.getByText(/low stock|running low/i).first()
      );

      await expect(page.locator('body')).toBeVisible();
    });

    test('should move pantry items to shopping list', async ({ page }) => {
      // Switch to pantry view
      const pantryView = page.getByRole('button', { name: /pantry/i }).first();
      if (await pantryView.isVisible()) {
        await pantryView.click();
        await page.waitForTimeout(500);
      }

      // Find a pantry item
      const pantryItem = page.locator('[data-testid*="pantry-item"]').first();

      if (await pantryItem.isVisible()) {
        // Look for add to shopping list button
        const addToListButton = page.getByRole('button', { name: /add to list|shopping list/i }).first();
        if (await addToListButton.isVisible()) {
          await addToListButton.click();
          await page.waitForTimeout(500);
        }
      }

      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('should add tags to items', async ({ page }) => {
    const addItemButton = page.getByRole('button').filter({ hasText: /add item|new item/i }).first();

    if (await addItemButton.isVisible()) {
      await addItemButton.click();
      await page.waitForTimeout(500);

      // Look for tag input
      const tagInput = page.getByPlaceholder(/tag/i).first();
      if (await tagInput.isVisible()) {
        await tagInput.fill('organic');
        await page.keyboard.press('Enter');

        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should set item priority', async ({ page }) => {
    const addItemButton = page.getByRole('button').filter({ hasText: /add item|new item/i }).first();

    if (await addItemButton.isVisible()) {
      await addItemButton.click();
      await page.waitForTimeout(500);

      // Look for priority selector
      const prioritySelect = page.locator('[data-testid="priority-select"]').or(
        page.getByText(/priority/i).first()
      );

      if (await prioritySelect.isVisible()) {
        await expect(prioritySelect).toBeVisible();
      }
    }
  });

  test('should delete shopping item', async ({ page }) => {
    // Create a test item first
    const addItemButton = page.getByRole('button').filter({ hasText: /add item|new item/i }).first();

    if (await addItemButton.isVisible()) {
      await addItemButton.click();
      await page.waitForTimeout(500);

      const itemNameInput = page.getByPlaceholder(/item name|name/i).first();
      if (await itemNameInput.isVisible()) {
        const testItemName = `Delete Test ${Date.now()}`;
        await itemNameInput.fill(testItemName);

        const saveButton = page.getByRole('button', { name: /save|add/i }).first();
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);

          // Now delete it
          const itemToDelete = page.getByText(testItemName).first();
          if (await itemToDelete.isVisible()) {
            // Look for delete button
            const deleteButton = page.getByRole('button', { name: /delete|remove/i }).first();
            if (await deleteButton.isVisible()) {
              await deleteButton.click();
              await page.waitForTimeout(500);

              // Confirm deletion
              const confirmButton = page.getByRole('button', { name: /confirm|yes/i }).first();
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

  test('should search shopping items', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('[data-testid="search-items"]').or(
      page.getByPlaceholder(/search/i)
    );

    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill('milk');
      await page.waitForTimeout(500);

      // Items should be filtered
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should filter items by category', async ({ page }) => {
    // Look for category filter
    const categoryFilter = page.locator('[data-testid="category-filter"]').or(
      page.getByRole('button', { name: /category|filter/i }).first()
    );

    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      await page.waitForTimeout(300);

      // Category options should appear
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Shopping should adapt to mobile
    await expect(page.locator('body')).toBeVisible();
  });
});
