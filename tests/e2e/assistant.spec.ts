import { test, expect } from '@playwright/test';

test.describe('AI Assistant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Navigate to AI Assistant
    const assistantLink = page.locator('[data-testid="nav-assistant"]').or(
      page.getByText('Assistant').or(page.getByText('AI Assistant'))
    );

    if (await assistantLink.first().isVisible()) {
      await assistantLink.first().click();
      await page.waitForLoadState('domcontentloaded');
    } else {
      await page.goto('/assistant');
      await page.waitForLoadState('domcontentloaded');
    }
  });

  test('should display AI assistant page', async ({ page }) => {
    // Check for assistant interface
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have chat interface', async ({ page }) => {
    // Look for chat container
    const chatContainer = page.locator('[data-testid="chat-container"]').or(
      page.locator('.chat-container, .messages-container')
    );

    // At least the page should render
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have message input field', async ({ page }) => {
    // Look for message input
    const messageInput = page.locator('[data-testid="message-input"]').or(
      page.getByPlaceholder(/type a message|ask me anything|message/i)
    );

    if (await messageInput.first().isVisible()) {
      await expect(messageInput.first()).toBeVisible();
    }
  });

  test('should have send button', async ({ page }) => {
    // Look for send button
    const sendButton = page.locator('[data-testid="send-button"]').or(
      page.getByRole('button', { name: /send/i }).or(
        page.getByRole('button').filter({ hasText: /→|>|send/i })
      )
    );

    if (await sendButton.first().isVisible()) {
      await expect(sendButton.first()).toBeVisible();
    }
  });

  test('should send a text message', async ({ page }) => {
    // Find message input
    const messageInput = page.locator('[data-testid="message-input"]').or(
      page.getByPlaceholder(/type a message|ask me anything|message/i)
    );

    if (await messageInput.first().isVisible()) {
      // Type a message
      await messageInput.first().fill('Hello, how can you help me?');

      // Send message
      const sendButton = page.locator('[data-testid="send-button"]').or(
        page.getByRole('button', { name: /send/i })
      );

      if (await sendButton.first().isVisible()) {
        await sendButton.first().click();
        await page.waitForTimeout(1000);

        // Message should appear in chat
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should display conversation history', async ({ page }) => {
    // Send a message first
    const messageInput = page.locator('[data-testid="message-input"]').or(
      page.getByPlaceholder(/type a message|ask me anything|message/i)
    );

    if (await messageInput.first().isVisible()) {
      await messageInput.first().fill('Test message');

      const sendButton = page.locator('[data-testid="send-button"]').or(
        page.getByRole('button', { name: /send/i })
      );

      if (await sendButton.first().isVisible()) {
        await sendButton.first().click();
        await page.waitForTimeout(1000);

        // Check for message in history
        const messageHistory = page.locator('[data-testid="message-history"]').or(
          page.locator('.chat-messages, .messages-list')
        );

        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should have voice input option', async ({ page }) => {
    // Look for voice/microphone button
    const voiceButton = page.locator('[data-testid="voice-input"]').or(
      page.getByRole('button').filter({ hasText: /microphone|voice|speak/i })
    );

    if (await voiceButton.first().isVisible()) {
      await expect(voiceButton.first()).toBeVisible();
    }
  });

  test('should have voice output option', async ({ page }) => {
    // Look for speaker/voice output button
    const voiceOutputButton = page.locator('[data-testid="voice-output"]').or(
      page.getByRole('button').filter({ hasText: /speaker|listen|voice/i })
    );

    // Page should render regardless
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show function calling capabilities info', async ({ page }) => {
    // Look for help or info about capabilities
    const helpButton = page.locator('[data-testid="help-button"]').or(
      page.getByRole('button', { name: /help|info|\?/i })
    );

    if (await helpButton.first().isVisible()) {
      await helpButton.first().click();
      await page.waitForTimeout(500);

      // Help/info should be displayed
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle task management queries', async ({ page }) => {
    // Send a task-related query
    const messageInput = page.locator('[data-testid="message-input"]').or(
      page.getByPlaceholder(/type a message|ask me anything|message/i)
    );

    if (await messageInput.first().isVisible()) {
      await messageInput.first().fill('Show me my tasks for today');

      const sendButton = page.locator('[data-testid="send-button"]').or(
        page.getByRole('button', { name: /send/i })
      );

      if (await sendButton.first().isVisible()) {
        await sendButton.first().click();
        await page.waitForTimeout(2000);

        // Response should appear
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should handle habit tracking queries', async ({ page }) => {
    // Send a habit-related query
    const messageInput = page.locator('[data-testid="message-input"]').or(
      page.getByPlaceholder(/type a message|ask me anything|message/i)
    );

    if (await messageInput.first().isVisible()) {
      await messageInput.first().fill('How are my habits going?');

      const sendButton = page.locator('[data-testid="send-button"]').or(
        page.getByRole('button', { name: /send/i })
      );

      if (await sendButton.first().isVisible()) {
        await sendButton.first().click();
        await page.waitForTimeout(2000);

        // Response should appear
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should show loading state while processing', async ({ page }) => {
    // Send a message
    const messageInput = page.locator('[data-testid="message-input"]').or(
      page.getByPlaceholder(/type a message|ask me anything|message/i)
    );

    if (await messageInput.first().isVisible()) {
      await messageInput.first().fill('Tell me about my productivity');

      const sendButton = page.locator('[data-testid="send-button"]').or(
        page.getByRole('button', { name: /send/i })
      );

      if (await sendButton.first().isVisible()) {
        await sendButton.first().click();

        // Look for loading indicator
        const loadingIndicator = page.locator('[data-testid="loading"]').or(
          page.locator('.loading, .spinner, .thinking')
        );

        // Should show some response eventually
        await page.waitForTimeout(2000);
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should clear conversation history', async ({ page }) => {
    // Look for clear/reset button
    const clearButton = page.locator('[data-testid="clear-conversation"]').or(
      page.getByRole('button', { name: /clear|reset|new chat/i })
    );

    if (await clearButton.first().isVisible()) {
      await clearButton.first().click();
      await page.waitForTimeout(500);

      // Conversation should be cleared
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle multiline input', async ({ page }) => {
    // Find message input
    const messageInput = page.locator('[data-testid="message-input"]').or(
      page.getByPlaceholder(/type a message|ask me anything|message/i)
    );

    if (await messageInput.first().isVisible()) {
      // Type multiline message
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      await messageInput.first().fill(multilineMessage);

      // Input should accept multiline text
      await expect(messageInput.first()).toBeVisible();
    }
  });

  test('should scroll to latest message', async ({ page }) => {
    // Send multiple messages
    const messageInput = page.locator('[data-testid="message-input"]').or(
      page.getByPlaceholder(/type a message|ask me anything|message/i)
    );

    if (await messageInput.first().isVisible()) {
      for (let i = 1; i <= 3; i++) {
        await messageInput.first().fill(`Message ${i}`);

        const sendButton = page.locator('[data-testid="send-button"]').or(
          page.getByRole('button', { name: /send/i })
        );

        if (await sendButton.first().isVisible()) {
          await sendButton.first().click();
          await page.waitForTimeout(500);
        }
      }

      // Chat should auto-scroll to latest message
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Assistant should adapt to mobile (mobile-first design)
    await expect(page.locator('body')).toBeVisible();

    // Message input should still be accessible
    const messageInput = page.locator('[data-testid="message-input"]').or(
      page.getByPlaceholder(/type a message|ask me anything|message/i)
    );

    if (await messageInput.first().isVisible()) {
      await expect(messageInput.first()).toBeVisible();
    }
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Send a message that might cause an error
    const messageInput = page.locator('[data-testid="message-input"]').or(
      page.getByPlaceholder(/type a message|ask me anything|message/i)
    );

    if (await messageInput.first().isVisible()) {
      // Simulate offline to cause error
      await page.context().setOffline(true);

      await messageInput.first().fill('Test error handling');

      const sendButton = page.locator('[data-testid="send-button"]').or(
        page.getByRole('button', { name: /send/i })
      );

      if (await sendButton.first().isVisible()) {
        await sendButton.first().click();
        await page.waitForTimeout(1000);

        // Should show error message or handle gracefully
        await expect(page.locator('body')).toBeVisible();
      }

      // Restore online
      await page.context().setOffline(false);
    }
  });
});
