import { test, expect } from '@playwright/test';
import { login, logout } from './helpers';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies before each test
    await context.clearCookies();
  });

  test('should login successfully with valid passkey', async ({ page }) => {
    // Get passkey from environment
    const passkey = process.env.APP_PASSKEY;
    expect(passkey).toBeDefined();

    // Navigate to login page
    await page.goto('/login');

    // Fill in passkey
    await page.fill('input[name="passkey"]', passkey!);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Dashboard should be visible
    await expect(page.locator('h1, h2').filter({ hasText: /dashboard|colleges/i })).toBeVisible();
  });

  test('should show error with invalid passkey', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Fill in wrong passkey
    await page.fill('input[name="passkey"]', 'wrong-passkey-12345');

    // Submit form
    await page.click('button[type="submit"]');

    // Should stay on login page
    await expect(page).toHaveURL('/login');

    // Should show error message or toast
    const errorMessage = page.locator('text=/invalid|incorrect|wrong/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to navigate directly to dashboard without logging in
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    // Login form should be visible
    await expect(page.locator('input[name="passkey"]')).toBeVisible();
  });

  test('should maintain session across page refreshes', async ({ page }) => {
    // Login using helper
    await login(page);

    // Verify we're on dashboard
    await expect(page).toHaveURL('/dashboard');

    // Refresh the page
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL('/dashboard');

    // Dashboard content should be visible
    await expect(page.locator('h1, h2').filter({ hasText: /dashboard|colleges/i })).toBeVisible();
  });

  test('login helper function should work correctly', async ({ page }) => {
    // Test the helper function
    await login(page);

    // Should be on dashboard
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await logout(page);

    // Navigate to protected route - should redirect to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });
});
