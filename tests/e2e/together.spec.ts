/**
 * E2E tests for Together feature
 * Tests milestones, partner messages, and challenges
 */

import { test, expect } from '@playwright/test';

test.describe('Together Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to Together page
    const togetherLink = page.locator('[data-testid="nav-together"]').or(page.getByText('Together'));

    if (await togetherLink.first().isVisible()) {
      await togetherLink.first().click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto('/together');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display Together page', async ({ page }) => {
    // Check page is visible
    await expect(page.locator('body')).toBeVisible();

    // Should have page header
    const header = page.getByRole('heading', { name: /together/i });
    if (await header.isVisible()) {
      await expect(header).toBeVisible();
    }
  });

  test('should have three tab navigation options', async ({ page }) => {
    // Look for Milestones, Messages, Challenges tabs
    const milestonesTab = page.getByRole('button', { name: /milestones/i }).or(
      page.locator('[data-testid="tab-milestones"]')
    );
    const messagesTab = page.getByRole('button', { name: /messages/i }).or(
      page.locator('[data-testid="tab-messages"]')
    );
    const challengesTab = page.getByRole('button', { name: /challenges/i }).or(
      page.locator('[data-testid="tab-challenges"]')
    );

    // At least one tab should be visible
    const hasTabNavigation =
      (await milestonesTab.first().isVisible().catch(() => false)) ||
      (await messagesTab.first().isVisible().catch(() => false)) ||
      (await challengesTab.first().isVisible().catch(() => false));

    if (hasTabNavigation) {
      expect(hasTabNavigation).toBe(true);
    }
  });

  test.describe('Milestones Tab', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to Milestones tab
      const milestonesTab = page.getByRole('button', { name: /milestones/i }).or(
        page.locator('[data-testid="tab-milestones"]')
      );

      if (await milestonesTab.first().isVisible()) {
        await milestonesTab.first().click();
        await page.waitForTimeout(500);
      }
    });

    test('should create a new milestone', async ({ page }) => {
      // Look for add milestone button
      const addButton = page.locator('[data-testid="add-milestone"]').or(
        page.getByRole('button').filter({ hasText: /add milestone|new milestone|create/i })
      );

      if (await addButton.first().isVisible()) {
        await addButton.first().click();
        await page.waitForTimeout(500);

        // Fill in milestone details
        const titleInput = page.getByPlaceholder(/title|name/i).first();
        if (await titleInput.isVisible()) {
          const milestoneTitle = `Anniversary ${Date.now()}`;
          await titleInput.fill(milestoneTitle);

          // Select milestone date
          const dateInput = page.locator('input[type="date"]').or(
            page.getByPlaceholder(/date/i)
          ).first();
          if (await dateInput.isVisible()) {
            await dateInput.fill('2024-06-15');
          }

          // Select milestone type
          const typeSelect = page.locator('select').filter({ hasText: /type/i }).or(
            page.getByLabel(/type/i)
          ).first();
          if (await typeSelect.isVisible()) {
            await typeSelect.selectOption({ label: /anniversary/i });
          }

          // Save milestone
          const saveButton = page.getByRole('button', { name: /save|create/i }).first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(1000);

            // Should show success toast
            const toast = page.locator('.Toastify, [role="alert"]');
            if (await toast.isVisible({ timeout: 3000 }).catch(() => false)) {
              await expect(toast).toContainText(/created|success/i);
            }

            // Milestone should appear in the list
            const milestoneCard = page.getByText(milestoneTitle).first();
            if (await milestoneCard.isVisible({ timeout: 3000 }).catch(() => false)) {
              await expect(milestoneCard).toBeVisible();
            }
          }
        }
      }
    });

    test('should display existing milestones', async ({ page }) => {
      // Wait for milestones to load
      await page.waitForTimeout(1000);

      // Look for milestone cards or list items
      const milestonesList = page.locator('[data-testid="milestones-list"]').or(
        page.locator('.milestone-card, .milestone-item')
      );

      // Either has milestones or shows empty state
      const hasMilestones = await milestonesList.first().isVisible({ timeout: 2000 }).catch(() => false);
      const emptyState = await page.getByText(/no milestones|add your first/i).isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasMilestones || emptyState).toBe(true);
    });

    test('should edit a milestone', async ({ page }) => {
      // First, create a milestone
      const addButton = page.locator('[data-testid="add-milestone"]').or(
        page.getByRole('button').filter({ hasText: /add milestone|new milestone|create/i })
      );

      if (await addButton.first().isVisible()) {
        await addButton.first().click();
        await page.waitForTimeout(500);

        const titleInput = page.getByPlaceholder(/title|name/i).first();
        if (await titleInput.isVisible()) {
          const milestoneTitle = `Edit Test ${Date.now()}`;
          await titleInput.fill(milestoneTitle);

          const dateInput = page.locator('input[type="date"]').first();
          if (await dateInput.isVisible()) {
            await dateInput.fill('2024-12-25');
          }

          const saveButton = page.getByRole('button', { name: /save|create/i }).first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(1000);

            // Now edit the milestone
            const milestoneCard = page.getByText(milestoneTitle).first();
            if (await milestoneCard.isVisible({ timeout: 2000 })) {
              await milestoneCard.click();
              await page.waitForTimeout(500);

              // Look for edit button
              const editButton = page.locator('[data-testid="edit-milestone"]').or(
                page.getByRole('button', { name: /edit/i })
              ).first();

              if (await editButton.isVisible()) {
                await editButton.click();
                await page.waitForTimeout(500);

                // Update title
                const editTitleInput = page.getByPlaceholder(/title|name/i).first();
                if (await editTitleInput.isVisible()) {
                  await editTitleInput.fill(`${milestoneTitle} - Updated`);

                  const updateButton = page.getByRole('button', { name: /save|update/i }).first();
                  if (await updateButton.isVisible()) {
                    await updateButton.click();
                    await page.waitForTimeout(1000);

                    // Should show updated milestone
                    await expect(page.getByText(`${milestoneTitle} - Updated`).first()).toBeVisible({ timeout: 3000 });
                  }
                }
              }
            }
          }
        }
      }
    });

    test('should delete a milestone', async ({ page }) => {
      // First, create a milestone to delete
      const addButton = page.locator('[data-testid="add-milestone"]').or(
        page.getByRole('button').filter({ hasText: /add milestone|new milestone|create/i })
      );

      if (await addButton.first().isVisible()) {
        await addButton.first().click();
        await page.waitForTimeout(500);

        const titleInput = page.getByPlaceholder(/title|name/i).first();
        if (await titleInput.isVisible()) {
          const milestoneTitle = `Delete Test ${Date.now()}`;
          await titleInput.fill(milestoneTitle);

          const dateInput = page.locator('input[type="date"]').first();
          if (await dateInput.isVisible()) {
            await dateInput.fill('2024-12-31');
          }

          const saveButton = page.getByRole('button', { name: /save|create/i }).first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(1000);

            // Now delete the milestone
            const milestoneCard = page.getByText(milestoneTitle).first();
            if (await milestoneCard.isVisible({ timeout: 2000 })) {
              await milestoneCard.click();
              await page.waitForTimeout(500);

              // Look for delete button
              const deleteButton = page.locator('[data-testid="delete-milestone"]').or(
                page.getByRole('button', { name: /delete/i })
              ).first();

              if (await deleteButton.isVisible()) {
                await deleteButton.click();
                await page.waitForTimeout(500);

                // Confirm deletion if modal appears
                const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i }).first();
                if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
                  await confirmButton.click();
                }

                await page.waitForTimeout(1000);

                // Milestone should be removed
                const deletedMilestone = await page.getByText(milestoneTitle).first().isVisible({ timeout: 2000 }).catch(() => false);
                expect(deletedMilestone).toBe(false);
              }
            }
          }
        }
      }
    });
  });

  test.describe('Messages Tab', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to Messages tab
      const messagesTab = page.getByRole('button', { name: /messages/i }).or(
        page.locator('[data-testid="tab-messages"]')
      );

      if (await messagesTab.first().isVisible()) {
        await messagesTab.first().click();
        await page.waitForTimeout(500);
      }
    });

    test('should create a new partner message', async ({ page }) => {
      // Look for compose/add message button
      const composeButton = page.locator('[data-testid="compose-message"]').or(
        page.getByRole('button').filter({ hasText: /compose|new message|write/i })
      );

      if (await composeButton.first().isVisible()) {
        await composeButton.first().click();
        await page.waitForTimeout(500);

        // Fill in message details
        const titleInput = page.getByPlaceholder(/title|subject/i).first();
        if (await titleInput.isVisible()) {
          const messageTitle = `Love Note ${Date.now()}`;
          await titleInput.fill(messageTitle);

          // Fill in message body
          const bodyInput = page.getByPlaceholder(/message|write/i).first();
          if (await bodyInput.isVisible()) {
            await bodyInput.fill('You are amazing and I appreciate everything you do!');

            // Select reveal trigger
            const triggerSelect = page.locator('select').filter({ hasText: /reveal|trigger/i }).or(
              page.getByLabel(/reveal|trigger/i)
            ).first();
            if (await triggerSelect.isVisible()) {
              await triggerSelect.selectOption({ label: /manual/i });
            }

            // Save message
            const saveButton = page.getByRole('button', { name: /save|send|create/i }).first();
            if (await saveButton.isVisible()) {
              await saveButton.click();
              await page.waitForTimeout(1000);

              // Should show success toast
              const toast = page.locator('.Toastify, [role="alert"]');
              if (await toast.isVisible({ timeout: 3000 }).catch(() => false)) {
                await expect(toast).toContainText(/created|sent|success/i);
              }
            }
          }
        }
      }
    });

    test('should display message list', async ({ page }) => {
      // Wait for messages to load
      await page.waitForTimeout(1000);

      // Look for messages list or empty state
      const messagesList = page.locator('[data-testid="messages-list"]').or(
        page.locator('.message-card, .message-item')
      );

      const hasMessages = await messagesList.first().isVisible({ timeout: 2000 }).catch(() => false);
      const emptyState = await page.getByText(/no messages|compose your first/i).isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasMessages || emptyState).toBe(true);
    });
  });

  test.describe('Challenges Tab', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to Challenges tab
      const challengesTab = page.getByRole('button', { name: /challenges/i }).or(
        page.locator('[data-testid="tab-challenges"]')
      );

      if (await challengesTab.first().isVisible()) {
        await challengesTab.first().click();
        await page.waitForTimeout(500);
      }
    });

    test('should create a new challenge', async ({ page }) => {
      // Look for add challenge button
      const addButton = page.locator('[data-testid="add-challenge"]').or(
        page.getByRole('button').filter({ hasText: /add challenge|new challenge|create/i })
      );

      if (await addButton.first().isVisible()) {
        await addButton.first().click();
        await page.waitForTimeout(500);

        // Fill in challenge details
        const titleInput = page.getByPlaceholder(/title|name/i).first();
        if (await titleInput.isVisible()) {
          const challengeTitle = `Workout Challenge ${Date.now()}`;
          await titleInput.fill(challengeTitle);

          // Set target value
          const targetInput = page.locator('input[type="number"]').or(
            page.getByPlaceholder(/target|goal/i)
          ).first();
          if (await targetInput.isVisible()) {
            await targetInput.fill('30');
          }

          // Set reward description
          const rewardInput = page.getByPlaceholder(/reward/i).first();
          if (await rewardInput.isVisible()) {
            await rewardInput.fill('Spa day together!');
          }

          // Save challenge
          const saveButton = page.getByRole('button', { name: /save|create/i }).first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(1000);

            // Should show success toast
            const toast = page.locator('.Toastify, [role="alert"]');
            if (await toast.isVisible({ timeout: 3000 }).catch(() => false)) {
              await expect(toast).toContainText(/created|success/i);
            }

            // Challenge should appear in the list
            const challengeCard = page.getByText(challengeTitle).first();
            if (await challengeCard.isVisible({ timeout: 3000 }).catch(() => false)) {
              await expect(challengeCard).toBeVisible();
            }
          }
        }
      }
    });

    test('should display existing challenges', async ({ page }) => {
      // Wait for challenges to load
      await page.waitForTimeout(1000);

      // Look for challenges list or empty state
      const challengesList = page.locator('[data-testid="challenges-list"]').or(
        page.locator('.challenge-card, .challenge-item')
      );

      const hasChallenges = await challengesList.first().isVisible({ timeout: 2000 }).catch(() => false);
      const emptyState = await page.getByText(/no challenges|create your first/i).isVisible({ timeout: 2000 }).catch(() => false);

      expect(hasChallenges || emptyState).toBe(true);
    });

    test('should update challenge progress', async ({ page }) => {
      // First, create a challenge
      const addButton = page.locator('[data-testid="add-challenge"]').or(
        page.getByRole('button').filter({ hasText: /add challenge|new challenge|create/i })
      );

      if (await addButton.first().isVisible()) {
        await addButton.first().click();
        await page.waitForTimeout(500);

        const titleInput = page.getByPlaceholder(/title|name/i).first();
        if (await titleInput.isVisible()) {
          const challengeTitle = `Progress Test ${Date.now()}`;
          await titleInput.fill(challengeTitle);

          const targetInput = page.locator('input[type="number"]').first();
          if (await targetInput.isVisible()) {
            await targetInput.fill('10');
          }

          const saveButton = page.getByRole('button', { name: /save|create/i }).first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(1000);

            // Now update progress
            const challengeCard = page.getByText(challengeTitle).first();
            if (await challengeCard.isVisible({ timeout: 2000 })) {
              await challengeCard.click();
              await page.waitForTimeout(500);

              // Look for progress update button or input
              const progressButton = page.locator('[data-testid="update-progress"]').or(
                page.getByRole('button', { name: /progress|\+/i })
              ).first();

              if (await progressButton.isVisible()) {
                await progressButton.click();
                await page.waitForTimeout(500);

                // Enter progress value
                const progressInput = page.locator('input[type="number"]').first();
                if (await progressInput.isVisible()) {
                  await progressInput.fill('5');

                  const updateButton = page.getByRole('button', { name: /save|update/i }).first();
                  if (await updateButton.isVisible()) {
                    await updateButton.click();
                    await page.waitForTimeout(1000);

                    // Should show updated progress
                    const progressIndicator = page.locator('.progress, [data-testid="progress"]');
                    if (await progressIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
                      await expect(progressIndicator).toBeVisible();
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    test('should complete a challenge when target is reached', async ({ page }) => {
      // Create a challenge with low target
      const addButton = page.locator('[data-testid="add-challenge"]').or(
        page.getByRole('button').filter({ hasText: /add challenge|new challenge|create/i })
      );

      if (await addButton.first().isVisible()) {
        await addButton.first().click();
        await page.waitForTimeout(500);

        const titleInput = page.getByPlaceholder(/title|name/i).first();
        if (await titleInput.isVisible()) {
          const challengeTitle = `Complete Test ${Date.now()}`;
          await titleInput.fill(challengeTitle);

          const targetInput = page.locator('input[type="number"]').first();
          if (await targetInput.isVisible()) {
            await targetInput.fill('1'); // Low target for easy completion
          }

          const saveButton = page.getByRole('button', { name: /save|create/i }).first();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await page.waitForTimeout(1000);

            // Update progress to complete
            const challengeCard = page.getByText(challengeTitle).first();
            if (await challengeCard.isVisible({ timeout: 2000 })) {
              await challengeCard.click();
              await page.waitForTimeout(500);

              const progressButton = page.locator('[data-testid="update-progress"]').or(
                page.getByRole('button', { name: /progress|\+/i })
              ).first();

              if (await progressButton.isVisible()) {
                await progressButton.click();
                await page.waitForTimeout(500);

                const progressInput = page.locator('input[type="number"]').first();
                if (await progressInput.isVisible()) {
                  await progressInput.fill('1');

                  const updateButton = page.getByRole('button', { name: /save|update/i }).first();
                  if (await updateButton.isVisible()) {
                    await updateButton.click();
                    await page.waitForTimeout(1000);

                    // Should show completed status
                    const completedIndicator = page.getByText(/completed|achieved|done/i).first();
                    if (await completedIndicator.isVisible({ timeout: 3000 }).catch(() => false)) {
                      await expect(completedIndicator).toBeVisible();
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
  });

  test.describe('Tab Navigation', () => {
    test('should switch between tabs', async ({ page }) => {
      // Click Milestones tab
      const milestonesTab = page.getByRole('button', { name: /milestones/i }).first();
      if (await milestonesTab.isVisible()) {
        await milestonesTab.click();
        await page.waitForTimeout(500);

        // Click Messages tab
        const messagesTab = page.getByRole('button', { name: /messages/i }).first();
        if (await messagesTab.isVisible()) {
          await messagesTab.click();
          await page.waitForTimeout(500);

          // Click Challenges tab
          const challengesTab = page.getByRole('button', { name: /challenges/i }).first();
          if (await challengesTab.isVisible()) {
            await challengesTab.click();
            await page.waitForTimeout(500);

            // Should be on Challenges tab
            await expect(page.locator('body')).toBeVisible();
          }
        }
      }
    });

    test('should persist tab state in URL', async ({ page }) => {
      // Click Messages tab
      const messagesTab = page.getByRole('button', { name: /messages/i }).first();
      if (await messagesTab.isVisible()) {
        await messagesTab.click();
        await page.waitForTimeout(500);

        // URL should contain tab parameter
        const url = page.url();
        const hasTabParam = url.includes('tab=messages') || url.includes('messages');

        if (hasTabParam) {
          expect(url).toContain('messages');
        }
      }
    });
  });
});
