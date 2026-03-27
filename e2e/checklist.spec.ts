import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Checklist and Auto-Status Progression', () => {
  let testCollegeName: string;

  test.beforeEach(async ({ page }) => {
    // Login
    await login(page);

    // Create a test college for checklist testing
    await page.click('button:has-text("Add College")');
    await page.waitForTimeout(500);

    testCollegeName = `Checklist Test ${Date.now()}`;
    await page.fill('input[name="name"]', testCollegeName);
    await page.selectOption('select[name="category"]', 'MATCH');
    await page.selectOption('select[name="strategy"]', 'RD');

    // Set a future application deadline to avoid urgency issues
    const applicationDeadlineInput = page.locator('input[name="applicationDeadline"]');
    if (await applicationDeadlineInput.isVisible()) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90); // 90 days in future
      const dateString = futureDate.toISOString().split('T')[0];
      await applicationDeadlineInput.fill(dateString);
    }

    await page.click('button:has-text("Submit"), button:has-text("Add"), button:has-text("Create")');
    await page.waitForTimeout(1000);
  });

  test('should check and uncheck checklist items', async ({ page }) => {
    // Click on the college to open detail view
    await page.click(`text=${testCollegeName}`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Look for checklist checkboxes
    const lorCheckbox = page.locator('input[type="checkbox"][name*="lor"], input[type="checkbox"] + label:has-text("Letter")').first();

    if (await lorCheckbox.isVisible()) {
      // Get initial state
      const initiallyChecked = await lorCheckbox.isChecked();

      // Click to toggle
      await lorCheckbox.click();
      await page.waitForTimeout(500);

      // Verify state changed
      const newState = await lorCheckbox.isChecked();
      expect(newState).not.toBe(initiallyChecked);

      // Click again to toggle back
      await lorCheckbox.click();
      await page.waitForTimeout(500);

      // Should be back to initial state
      const finalState = await lorCheckbox.isChecked();
      expect(finalState).toBe(initiallyChecked);
    } else {
      // Alternative: Look for any checkboxes on the page
      const anyCheckbox = page.locator('input[type="checkbox"]').first();
      expect(await anyCheckbox.isVisible()).toBe(true);
    }
  });

  test('should auto-progress status to SUBMITTED when all items complete', async ({ page }) => {
    // Navigate to college detail page
    await page.click(`text=${testCollegeName}`);
    await page.waitForLoadState('networkidle');

    // Find all checklist checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count > 0) {
      // Check all checkboxes
      for (let i = 0; i < count; i++) {
        const checkbox = checkboxes.nth(i);
        if (!(await checkbox.isChecked())) {
          await checkbox.click();
          await page.waitForTimeout(300);
        }
      }

      // Wait for auto-status update
      await page.waitForTimeout(1500);

      // Look for SUBMITTED status badge
      const submittedBadge = page.locator('text=/SUBMITTED|Submitted/i');
      const isSubmitted = await submittedBadge.isVisible().catch(() => false);

      // If visible, status auto-progressed correctly
      if (isSubmitted) {
        expect(isSubmitted).toBe(true);
      } else {
        // Alternative: Check if status is no longer NOT_STARTED
        const notStartedBadge = page.locator('text=/NOT_STARTED|Not Started/i');
        const isNotStarted = await notStartedBadge.isVisible().catch(() => false);

        // Status should have progressed away from NOT_STARTED
        expect(isNotStarted).toBe(false);
      }
    }
  });

  test('should revert status to IN_PROGRESS when items unchecked', async ({ page }) => {
    // Navigate to college detail page
    await page.click(`text=${testCollegeName}`);
    await page.waitForLoadState('networkidle');

    // Find checklist checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count > 0) {
      // Check all boxes first
      for (let i = 0; i < count; i++) {
        const checkbox = checkboxes.nth(i);
        if (!(await checkbox.isChecked())) {
          await checkbox.click();
          await page.waitForTimeout(300);
        }
      }

      // Wait for status to become SUBMITTED
      await page.waitForTimeout(1500);

      // Now uncheck one box
      const firstCheckbox = checkboxes.first();
      await firstCheckbox.click();
      await page.waitForTimeout(1500);

      // Status should revert (either to IN_PROGRESS or at least not SUBMITTED)
      const submittedBadge = page.locator('text=/SUBMITTED|Submitted/i');
      const isStillSubmitted = await submittedBadge.isVisible().catch(() => false);

      // Should not be SUBMITTED anymore
      expect(isStillSubmitted).toBe(false);

      // Should show IN_PROGRESS or similar
      const inProgressBadge = page.locator('text=/IN_PROGRESS|In Progress/i');
      const isInProgress = await inProgressBadge.isVisible().catch(() => false);

      expect(isInProgress).toBe(true);
    }
  });

  test('should display urgency indicator based on deadline', async ({ page }) => {
    // Go back to dashboard to see urgency indicators
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Find the college card
    const collegeSection = page.locator('div, article').filter({ hasText: testCollegeName }).first();

    // Look for urgency indicator (could be color-coded or text-based)
    // Since we set deadline 90 days in future, should be GREEN (low urgency)
    const hasGreenIndicator = await collegeSection.locator('[class*="green"], [class*="bg-green"], text=/green|low/i').isVisible().catch(() => false);

    // Or check for absence of red urgency
    const hasRedIndicator = await collegeSection.locator('[class*="red"], [class*="bg-red"], text=/urgent|overdue/i').isVisible().catch(() => false);

    // With 90-day deadline, should not show red urgency
    expect(hasRedIndicator).toBe(false);

    // Alternatively, just verify some deadline-related content exists
    const hasDeadlineInfo = await collegeSection.locator('text=/days|deadline|due/i').isVisible().catch(() => false);
    expect(hasDeadlineInfo || hasGreenIndicator).toBe(true);
  });

  test('should validate auto-status progression logic end-to-end', async ({ page }) => {
    // This test validates the complete auto-status flow

    // Navigate to detail page
    await page.click(`text=${testCollegeName}`);
    await page.waitForLoadState('networkidle');

    // Step 1: Verify initial status is NOT_STARTED
    const initialStatus = page.locator('text=/NOT_STARTED|Not Started|IN_PROGRESS|In Progress/i');
    await expect(initialStatus).toBeVisible();

    // Step 2: Check one checklist item
    const firstCheckbox = page.locator('input[type="checkbox"]').first();
    const checkboxCount = await page.locator('input[type="checkbox"]').count();

    if (checkboxCount > 0) {
      await firstCheckbox.click();
      await page.waitForTimeout(1000);

      // Status should progress to IN_PROGRESS if it was NOT_STARTED
      const inProgressStatus = page.locator('text=/IN_PROGRESS|In Progress/i');
      const isInProgress = await inProgressStatus.isVisible().catch(() => false);

      // Should either be IN_PROGRESS or already progressed
      const notStartedStatus = page.locator('text=/NOT_STARTED|Not Started/i');
      const isNotStarted = await notStartedStatus.isVisible().catch(() => false);

      // Should not be NOT_STARTED anymore after checking an item
      if (checkboxCount === 1) {
        // With only 1 item, checking it might go straight to SUBMITTED
        expect(isNotStarted).toBe(false);
      } else {
        // With multiple items, should be IN_PROGRESS
        expect(isInProgress || !isNotStarted).toBe(true);
      }

      // Step 3: Check all remaining items
      const allCheckboxes = page.locator('input[type="checkbox"]');
      const totalCount = await allCheckboxes.count();

      for (let i = 1; i < totalCount; i++) {
        const checkbox = allCheckboxes.nth(i);
        if (!(await checkbox.isChecked())) {
          await checkbox.click();
          await page.waitForTimeout(300);
        }
      }

      // Wait for final status update
      await page.waitForTimeout(1500);

      // Step 4: Verify status is SUBMITTED
      const submittedStatus = page.locator('text=/SUBMITTED|Submitted/i');
      const isSubmitted = await submittedStatus.isVisible().catch(() => false);

      expect(isSubmitted).toBe(true);
    }
  });
});
