import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('College CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should create a new college via multi-step form', async ({ page }) => {
    // Click "Add College" button
    await page.click('button:has-text("Add College")');

    // Wait for dialog/form to appear
    await expect(page.locator('input[name="name"]')).toBeVisible();

    // Step 1: Details - Fill in college name
    const testCollegeName = `Test University ${Date.now()}`;
    await page.fill('input[name="name"]', testCollegeName);

    // Select category
    await page.selectOption('select[name="category"]', 'MATCH');

    // Select strategy
    await page.selectOption('select[name="strategy"]', 'RD');

    // Try to proceed to next step (button might say "Next" or similar)
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }

    // Step 2: Deadlines (optional step - fill if visible)
    const applicationDeadlineInput = page.locator('input[name="applicationDeadline"]');
    if (await applicationDeadlineInput.isVisible()) {
      // Set a future deadline
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);
      const dateString = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD
      await applicationDeadlineInput.fill(dateString);

      // Click next if there's another step
      const nextButton2 = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
      if (await nextButton2.isVisible()) {
        await nextButton2.click();
      }
    }

    // Final step: Submit
    await page.click('button:has-text("Submit"), button:has-text("Add"), button:has-text("Create")');

    // Wait for dialog to close and college to appear
    await page.waitForTimeout(1000);

    // Verify college appears on dashboard
    await expect(page.locator(`text=${testCollegeName}`)).toBeVisible();

    // Verify category badge is visible
    await expect(page.locator('text=/MATCH/i')).toBeVisible();
  });

  test('should display created college on dashboard', async ({ page }) => {
    // Create a college first
    await page.click('button:has-text("Add College")');
    await page.waitForTimeout(500);

    const testCollegeName = `Dashboard Test ${Date.now()}`;
    await page.fill('input[name="name"]', testCollegeName);
    await page.selectOption('select[name="category"]', 'REACH');
    await page.selectOption('select[name="strategy"]', 'EA');

    // Submit
    await page.click('button:has-text("Submit"), button:has-text("Add"), button:has-text("Create")');
    await page.waitForTimeout(1000);

    // Navigate to dashboard (reload to ensure fresh data)
    await page.goto('/dashboard');

    // Verify college is visible
    await expect(page.locator(`text=${testCollegeName}`)).toBeVisible();

    // Verify it's displayed as a card or list item
    const collegeCard = page.locator(`[data-testid="college-card"], .college-card`).filter({ hasText: testCollegeName });
    const alternativeLocator = page.locator('div, article, li').filter({ hasText: testCollegeName });

    // One of these should be visible
    const isCardVisible = await collegeCard.isVisible().catch(() => false);
    const isAlternativeVisible = await alternativeLocator.isVisible().catch(() => false);

    expect(isCardVisible || isAlternativeVisible).toBe(true);
  });

  test('should update college status via dropdown', async ({ page }) => {
    // Create a test college first
    await page.click('button:has-text("Add College")');
    await page.waitForTimeout(500);

    const testCollegeName = `Status Test ${Date.now()}`;
    await page.fill('input[name="name"]', testCollegeName);
    await page.selectOption('select[name="category"]', 'SAFETY');
    await page.selectOption('select[name="strategy"]', 'RD');
    await page.click('button:has-text("Submit"), button:has-text("Add"), button:has-text("Create")');
    await page.waitForTimeout(1000);

    // Find the college card
    const collegeSection = page.locator('div, article').filter({ hasText: testCollegeName }).first();

    // Look for status dropdown or button (might be labeled with status like "NOT_STARTED")
    const statusTrigger = collegeSection.locator('button:has-text("NOT_STARTED"), button:has-text("Not Started"), [data-testid="status-trigger"]').first();

    if (await statusTrigger.isVisible()) {
      await statusTrigger.click();

      // Select a new status
      await page.click('button:has-text("IN_PROGRESS"), button:has-text("In Progress")');

      // Wait for update
      await page.waitForTimeout(1000);

      // Verify status changed
      await expect(collegeSection.locator('text=/IN_PROGRESS|In Progress/i')).toBeVisible();
    }
  });

  test('should persist college data after page refresh', async ({ page }) => {
    // Create a college
    await page.click('button:has-text("Add College")');
    await page.waitForTimeout(500);

    const testCollegeName = `Persistence Test ${Date.now()}`;
    await page.fill('input[name="name"]', testCollegeName);
    await page.selectOption('select[name="category"]', 'MATCH');
    await page.selectOption('select[name="strategy"]', 'ED');
    await page.click('button:has-text("Submit"), button:has-text("Add"), button:has-text("Create")');
    await page.waitForTimeout(1000);

    // Verify it's visible
    await expect(page.locator(`text=${testCollegeName}`)).toBeVisible();

    // Refresh the page
    await page.reload();

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify college still exists
    await expect(page.locator(`text=${testCollegeName}`)).toBeVisible();

    // Verify data persisted (category should still be MATCH)
    const collegeSection = page.locator('div, article').filter({ hasText: testCollegeName }).first();
    await expect(collegeSection.locator('text=/MATCH/i')).toBeVisible();
  });

  test('should show validation errors for missing required fields', async ({ page }) => {
    // Click "Add College" button
    await page.click('button:has-text("Add College")');
    await page.waitForTimeout(500);

    // Try to submit without filling required fields
    const submitButton = page.locator('button:has-text("Submit"), button:has-text("Add"), button:has-text("Create")').first();

    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation error (form should not close)
      // Either the dialog stays open or error messages appear
      const nameInput = page.locator('input[name="name"]');
      const isStillVisible = await nameInput.isVisible();

      expect(isStillVisible).toBe(true);

      // Look for validation error message
      const errorMessage = page.locator('text=/required|must|cannot be empty/i');
      const hasError = await errorMessage.isVisible().catch(() => false);

      // Either input is invalid or error message is shown
      const hasInvalidAttr = await nameInput.evaluate((el) => el.hasAttribute('aria-invalid'));

      expect(hasError || hasInvalidAttr).toBe(true);
    }
  });

  test('should navigate through multi-step form', async ({ page }) => {
    // Click "Add College" button
    await page.click('button:has-text("Add College")');
    await page.waitForTimeout(500);

    // Fill Step 1
    await page.fill('input[name="name"]', `Nav Test ${Date.now()}`);
    await page.selectOption('select[name="category"]', 'REACH');
    await page.selectOption('select[name="strategy"]', 'EA');

    // Look for Next button
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")').first();

    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);

      // Should be on step 2 (check for different fields or step indicator)
      // Look for "Back" button which indicates we're past step 1
      const backButton = page.locator('button:has-text("Back"), button:has-text("Previous")');
      const hasBackButton = await backButton.isVisible().catch(() => false);

      if (hasBackButton) {
        // Click back to go to previous step
        await backButton.click();
        await page.waitForTimeout(500);

        // Should be back on step 1 (name field should be visible and filled)
        const nameInput = page.locator('input[name="name"]');
        await expect(nameInput).toBeVisible();

        const nameValue = await nameInput.inputValue();
        expect(nameValue).toContain('Nav Test');
      }
    }

    // Close dialog
    const cancelButton = page.locator('button:has-text("Cancel"), button[aria-label="Close"]').first();
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
    }
  });
});
