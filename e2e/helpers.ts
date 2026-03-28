import { Page } from '@playwright/test';

/**
 * Helper function to login with passkey
 * @param page - Playwright page object
 * @param passkey - Optional passkey (defaults to APP_PASSKEY from env)
 */
export async function login(page: Page, passkey?: string) {
  const appPasskey = passkey || process.env.APP_PASSKEY;

  if (!appPasskey) {
    throw new Error('APP_PASSKEY environment variable is not set');
  }

  // Navigate to login page
  await page.goto('/login');

  // Wait for form to be visible
  await page.waitForSelector('input#passkey', { state: 'visible' });

  // Fill in passkey (using ID selector)
  await page.fill('input#passkey', appPasskey);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Helper function to logout
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  // Click logout button if it exists
  const logoutButton = page.locator('button:has-text("Logout")').first();
  const isVisible = await logoutButton.isVisible().catch(() => false);

  if (isVisible) {
    await logoutButton.click();
  }

  // Clear cookies to ensure logged out
  await page.context().clearCookies();
}

/**
 * Simple helper to wait for dialog to be visible
 * @param page - Playwright page object
 */
async function waitForDialog(page: Page) {
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 });
}

/**
 * Helper function to create a test college via the multi-step form
 * @param page - Playwright page object
 * @param data - College data
 */
export async function createCollege(page: Page, data: {
  name: string;
  category?: 'REACH' | 'MATCH' | 'SAFETY';
  strategy?: 'ED' | 'EA' | 'RD';
}) {
  // Ensure we're on dashboard
  await page.goto('/dashboard');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Click "Add College" button - try multiple selectors
  const addButton = page.locator('button:has-text("Add College"), button').filter({ hasText: /add|plus|\+/i }).first();
  await addButton.click();

  // Wait for dialog to appear
  await waitForDialog(page);
  await page.waitForTimeout(500);

  // Fill in name field (it should be visible in first step)
  const nameInput = page.locator('input[name="name"], input#name').first();
  await nameInput.waitFor({ state: 'visible' });
  await nameInput.fill(data.name);

  // Category - look for select button and click it
  if (data.category) {
    // Try to find and interact with radix-ui Select component
    const categoryTrigger = page.locator('[name="category"]').locator('..').locator('button').first();
    const categoryExists = await categoryTrigger.isVisible().catch(() => false);

    if (categoryExists) {
      await categoryTrigger.click();
      await page.waitForTimeout(300);
      // Click the option
      await page.locator(`[role="option"]:has-text("${data.category}")`).click();
    }
  }

  // Strategy - similar approach
  if (data.strategy) {
    const strategyTrigger = page.locator('[name="strategy"]').locator('..').locator('button').first();
    const strategyExists = await strategyTrigger.isVisible().catch(() => false);

    if (strategyExists) {
      await strategyTrigger.click();
      await page.waitForTimeout(300);
      await page.locator(`[role="option"]:has-text("${data.strategy}")`).click();
    }
  }

  // Submit the form - look for final submit button
  // The form is multi-step, so we need to skip through steps or find final submit
  const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Add")').last();
  await submitButton.click();

  // Wait for dialog to close
  await page.waitForTimeout(1000);
}

/**
 * Helper function to delete all test colleges
 * @param page - Playwright page object
 */
export async function cleanupTestColleges(page: Page) {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  // Find all delete buttons and click them
  const deleteButtons = page.locator('button:has-text("Delete")');
  const count = await deleteButtons.count();

  for (let i = 0; i < count; i++) {
    // Always click the first one since the list updates after each delete
    const firstButton = deleteButtons.first();
    const isVisible = await firstButton.isVisible().catch(() => false);

    if (isVisible) {
      await firstButton.click();
      await page.waitForTimeout(300);

      // Confirm deletion if there's a confirmation dialog
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")').last();
      const confirmExists = await confirmButton.isVisible().catch(() => false);

      if (confirmExists) {
        await confirmButton.click();
      }

      // Wait for deletion to complete
      await page.waitForTimeout(500);
    }
  }
}
