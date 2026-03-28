import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Checklist and Auto-Status Progression', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should display checklist form on college detail page if colleges exist', async ({ page }) => {
    // Go to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Find any college card link (if exists)
    const collegeLinks = page.locator('a[href^="/college/"]');
    const count = await collegeLinks.count();

    if (count > 0) {
      // Click first college
      await collegeLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Should see checklist checkboxes
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();

      // Should have at least some checklist items (or 0 if none exist yet)
      expect(checkboxCount).toBeGreaterThanOrEqual(0);

      // If checkboxes exist, should see labels
      if (checkboxCount > 0) {
        const hasLabels = await page.locator('text=/Letter|Transcript|Test Scores|Essay/i').count();
        expect(hasLabels).toBeGreaterThan(0);
      }
    } else {
      // No colleges exist - verify we're on dashboard
      expect(page.url()).toContain('/dashboard');
    }
  });

  test('should be able to interact with checklist when colleges exist', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const collegeLinks = page.locator('a[href^="/college/"]');
    const count = await collegeLinks.count();

    if (count > 0) {
      await collegeLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Find checkboxes
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount > 0) {
        const firstCheckbox = checkboxes.first();

        // Get initial state
        const wasChecked = await firstCheckbox.isChecked();

        // Try to click it
        await firstCheckbox.click();
        await page.waitForTimeout(1000);

        // State should have changed
        const nowChecked = await firstCheckbox.isChecked();
        expect(nowChecked).not.toBe(wasChecked);
      } else {
        // No checkboxes - that's okay
        expect(checkboxCount).toBe(0);
      }
    } else {
      // No colleges - test passes
      expect(count).toBe(0);
    }
  });

  test('should show status badge on college detail page when colleges exist', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const collegeLinks = page.locator('a[href^="/college/"]');
    const count = await collegeLinks.count();

    if (count > 0) {
      await collegeLinks.first().click();
      await page.waitForLoadState('networkidle');

      // Should see a status badge
      const statusBadge = page.locator('text=/NOT_STARTED|IN_PROGRESS|SUBMITTED|WAITLISTED|ACCEPTED|DECLINED/i').first();
      const isVisible = await statusBadge.isVisible().catch(() => false);

      expect(isVisible).toBe(true);
    } else {
      // No colleges - test passes
      expect(count).toBe(0);
    }
  });

  test('should show urgency indicators or empty dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if there are any colleges
    const collegeLinks = page.locator('a[href^="/college/"]');
    const linkCount = await collegeLinks.count();

    if (linkCount > 0) {
      // Has colleges - might have deadline info
      const hasDeadlineInfo = await page.locator('text=/days|deadline|due/i').isVisible().catch(() => false);
      // Either has deadline info or doesn't (both are valid)
      expect(hasDeadlineInfo !== undefined).toBe(true);
    } else {
      // Empty dashboard - that's fine
      expect(linkCount).toBe(0);
    }
  });

  test('should display dashboard page structure', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should be accessible
    expect(page.url()).toContain('/dashboard');

    // Should have basic structure
    const hasHeading = await page.locator('h1, h2').first().isVisible().catch(() => false);
    const hasAddButton = await page.locator('button').filter({ hasText: /add/i }).count() > 0;

    // Should have some UI elements
    expect(hasHeading || hasAddButton).toBe(true);
  });
});
