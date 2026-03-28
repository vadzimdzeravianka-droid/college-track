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

    // Wait for form to be visible
    await expect(page.locator('input#passkey')).toBeVisible();

    // Fill in passkey
    await page.fill('input#passkey', passkey!);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Dashboard should be visible
    await expect(page.locator('text=College Application Tracker')).toBeVisible();
  });

  test('should show error with invalid passkey', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Wait for form
    await expect(page.locator('input#passkey')).toBeVisible();

    // Fill in wrong passkey
    await page.fill('input#passkey', 'wrong-passkey-12345');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait a moment for error to appear
    await page.waitForTimeout(1500);

    // Should still be on login page (check URL contains /login)
    expect(page.url()).toContain('/login');

    // Should show error message in the error div or toast
    const errorDiv = page.locator('.text-destructive').first();
    const hasError = await errorDiv.isVisible().catch(() => false);

    // Error should be shown
    expect(hasError).toBe(true);
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to navigate directly to dashboard without logging in
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('/login');

    // Login form should be visible
    await expect(page.locator('input#passkey')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
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
    await expect(page.locator('text=College Application Tracker')).toBeVisible();
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
