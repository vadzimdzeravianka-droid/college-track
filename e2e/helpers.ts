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

  // Fill in passkey
  await page.fill('input[name="passkey"]', appPasskey);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL('/dashboard');
}

/**
 * Helper function to logout
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  // Click logout button if it exists
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout")');
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
  }

  // Clear cookies to ensure logged out
  await page.context().clearCookies();
}

/**
 * Helper function to create a test college
 * @param page - Playwright page object
 * @param data - College data
 */
export async function createCollege(page: Page, data: {
  name: string;
  category?: 'REACH' | 'MATCH' | 'SAFETY';
  strategy?: 'ED' | 'EA' | 'RD';
}) {
  // Navigate to dashboard
  await page.goto('/dashboard');

  // Click "Add College" button
  await page.click('button:has-text("Add College")');

  // Fill Step 1: Details
  await page.fill('input[name="name"]', data.name);

  if (data.category) {
    await page.selectOption('select[name="category"]', data.category);
  }

  if (data.strategy) {
    await page.selectOption('select[name="strategy"]', data.strategy);
  }

  // Click Next or Submit through all steps
  // This is simplified - actual implementation will depend on form structure
  await page.click('button:has-text("Next"), button:has-text("Submit")');
}

/**
 * Helper function to delete all test colleges
 * @param page - Playwright page object
 */
export async function cleanupTestColleges(page: Page) {
  await page.goto('/dashboard');

  // Find all delete buttons and click them
  const deleteButtons = page.locator('button:has-text("Delete")');
  const count = await deleteButtons.count();

  for (let i = 0; i < count; i++) {
    // Always click the first one since the list updates after each delete
    const firstButton = deleteButtons.first();
    if (await firstButton.isVisible()) {
      await firstButton.click();
      // Confirm deletion if there's a confirmation dialog
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delete")').last();
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      // Wait for deletion to complete
      await page.waitForTimeout(500);
    }
  }
}
