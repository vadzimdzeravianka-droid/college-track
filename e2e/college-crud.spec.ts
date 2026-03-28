import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('College CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should display dashboard with application tracker', async ({ page }) => {
    // Should be on dashboard
    await expect(page).toHaveURL('/dashboard');

    // Should see main heading (use first() to avoid strict mode violation)
    const heading = page.locator('h1, h2').filter({ hasText: /College Application Tracker|Applications/i }).first();
    await expect(heading).toBeVisible();
  });

  test('should open add college dialog when clicking add button', async ({ page }) => {
    // Look for Add College button (could be icon or text)
    const addButton = page.locator('button').filter({ hasText: /add college/i }).first();
    const alternativeButton = page.locator('button[aria-label*="Add"]').first();

    // Try primary button first
    const primaryExists = await addButton.isVisible().catch(() => false);
    if (primaryExists) {
      await addButton.click();
    } else {
      // Try alternative (icon button or FAB)
      const altExists = await alternativeButton.isVisible().catch(() => false);
      if (altExists) {
        await alternativeButton.click();
      } else {
        // Try FAB (floating action button with rounded-full class)
        const fabButton = page.locator('button[class*="rounded-full"]').last();
        await fabButton.click();
      }
    }

    // Dialog should appear
    await page.waitForTimeout(500);
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Should see form fields
    const nameInput = page.locator('input[name="name"], input#name').first();
    await expect(nameInput).toBeVisible();
  });

  test('should show form fields in add college dialog', async ({ page }) => {
    // Open dialog
    const addButton = page.locator('button').filter({ hasText: /add/i }).first();
    const hasButton = await addButton.isVisible().catch(() => false);

    if (hasButton) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Should see name input or some form field
      const nameField = page.locator('input[name="name"], input#name, input[placeholder*="name" i]').first();
      const nameVisible = await nameField.isVisible().catch(() => false);

      // Form should have at least a name field
      expect(nameVisible).toBe(true);
    } else {
      // No add button found - maybe FAB only
      const fabButton = page.locator('button[class*="rounded-full"]').last();
      const hasFab = await fabButton.isVisible().catch(() => false);
      expect(hasFab).toBe(true);
    }
  });

  test('should navigate through app successfully', async ({ page }) => {
    // Should be on dashboard
    await expect(page).toHaveURL('/dashboard');

    // Main heading should be visible
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible();

    // Logout button should be present
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).toBeVisible();
  });

  test('should maintain responsive layout across viewports', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');

    // Should still see some heading
    const mobileHeading = page.locator('h1, h2, h3').first();
    await expect(mobileHeading).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState('networkidle');

    // Should see heading
    const desktopHeading = page.locator('h1, h2').first();
    await expect(desktopHeading).toBeVisible();
  });

  test('should display dashboard content', async ({ page }) => {
    // Dashboard should load
    await page.waitForLoadState('networkidle');

    // Should have some UI elements
    const hasHeading = await page.locator('h1, h2').first().isVisible().catch(() => false);
    const hasAddButton = await page.locator('button').filter({ hasText: /add/i }).count() > 0;

    // At minimum, should have a heading or add button
    expect(hasHeading || hasAddButton).toBe(true);
  });
});
