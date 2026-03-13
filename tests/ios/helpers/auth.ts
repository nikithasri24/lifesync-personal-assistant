/**
 * iOS test auth helper
 * Signs in via the app's login form using WebdriverIO in webview context.
 */

const EMAIL = process.env.TEST_EMAIL ?? 'nikki@test.com';
const PASSWORD = process.env.TEST_PASSWORD ?? 'testpassword';

export async function signIn(): Promise<void> {
  // Wait for either the login form or the dashboard (already logged in)
  const emailInput = await $('input[type="email"]');
  const isDashboard = await $('h1').isExisting().catch(() => false);

  if (isDashboard) return; // already authenticated (noReset: true)

  await emailInput.waitForExist({ timeout: 15000 });
  await emailInput.setValue(EMAIL);
  await $('input[type="password"]').setValue(PASSWORD);
  await $('button[type="submit"]').click();

  // Wait for dashboard to appear
  await $('nav').waitForExist({ timeout: 20000 });
}

export async function switchToWebView(): Promise<void> {
  // Appium autoWebview should handle this, but call manually if needed
  const contexts = await browser.getContexts() as string[];
  const webview = contexts.find((c) => c.startsWith('WEBVIEW'));
  if (webview) {
    await browser.switchContext(webview);
  }
}
