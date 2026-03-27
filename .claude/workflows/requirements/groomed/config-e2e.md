# Requirement: E2E Testing Infrastructure with Playwright

## Original Request
setup e2e test

⚠️ Gate 6 N/A - No E2E tests required (utility function changes, validated via unit tests)

## Enriched Requirement

Set up comprehensive End-to-End (E2E) testing infrastructure using Playwright to enable Gate 6 validation in the QA workflow. This will test critical user journeys across the application, ensuring features work correctly from the user's perspective.

### Context

- **Current state**: No E2E testing exists. Gate 6 in validate-quality skill is currently skipped
- **Affected areas**:
  - Create `e2e/` directory for test files
  - Add `playwright.config.ts` configuration
  - Update `package.json` with Playwright scripts
  - Update `.claude/skills/validate-quality/SKILL.md` Gate 6 to use Playwright
  - Add `.gitignore` entries for Playwright artifacts
- **Dependencies**: 
  - `@playwright/test` - Playwright testing framework
  - Browser binaries (Chromium, Firefox, WebKit) - installed via `npx playwright install`
- **Related features**: 
  - Authentication flow (passkey-based)
  - College CRUD operations
  - Dashboard filters and search
  - Multi-step college creation form
  - Checklist auto-status progression

## Implementation Approaches

### Approach A: Minimal Critical Path Setup
**Description**: Install Playwright and create 3-5 essential E2E tests covering only the most critical user journeys: login, college creation, status updates, and checklist updates.

**Pros**:
- Lower token usage (~20K)
- Quick implementation and validation
- Unblocks Gate 6 immediately
- Establishes infrastructure for future expansion
- Covers 80% of critical functionality

**Cons**:
- Limited coverage initially (fewer edge cases)
- More tests will be needed for comprehensive validation
- Some features remain untested (filters, search, deletion)

**Token Estimate**: ~20K tokens

**Initial test coverage**:
- Login flow (passkey authentication)
- College creation (multi-step form)
- Status updates
- Checklist updates with auto-progression
- Basic navigation

---

### Approach B: Comprehensive Test Suite
**Description**: Install Playwright and create 15-20 E2E tests covering all major user journeys, including filters, search, edge cases, error states, and responsive design validation.

**Pros**:
- Comprehensive coverage from day one
- Tests all features including edge cases
- Validates responsive design (mobile/desktop)
- Stronger confidence in releases
- Dark/light mode validation

**Cons**:
- Higher token usage (~40K)
- Longer implementation time
- More maintenance overhead
- May test features that change frequently

**Token Estimate**: ~40K tokens

**Comprehensive test coverage**:
- All tests from Approach A, plus:
- Dashboard filters (category, status, strategy)
- Search functionality
- College deletion
- Portal credential display/copy
- Cost tracking display
- Urgency indicator validation
- Dark/light mode switching
- Mobile responsive layouts
- Error handling (invalid inputs)

---

**Recommended**: Approach A (Minimal Critical Path Setup)

**Reasoning**: 
1. Unblocks Gate 6 immediately with manageable scope
2. Establishes infrastructure pattern for future tests
3. 80/20 rule - covers critical paths with 50% of the effort
4. Easy to expand incrementally as features are added
5. Validates the most important user journeys that impact application reliability

Additional tests can be added in future tickets as specific features are enhanced or bugs are discovered.

## Edge Cases & Considerations

### Authentication
- What if passkey is wrong? (show error message)
- What if user navigates directly to protected route without auth? (redirect to /login)
- What if session expires? (not currently implemented, document this)

### Form Validation
- Multi-step form navigation (back/forward)
- Required field validation
- Date picker interactions
- Select dropdown interactions
- Form submission with loading states

### State Management
- Auto-status progression when checklist completes
- Real-time urgency color updates
- Persistence after page refresh
- Concurrent updates (not applicable for single-user app)

### Performance
- Tests should complete within 30 seconds each
- Parallel test execution for speed
- Retry flaky tests (network issues)

### Cross-Browser
- Chromium (primary)
- Firefox (secondary)
- WebKit/Safari (secondary, mobile emulation)

## Acceptance Criteria

- [ ] Playwright installed with `@playwright/test` package
- [ ] `playwright.config.ts` configured with baseURL and test settings
- [ ] `e2e/` directory created with organized test files
- [ ] Login flow E2E test passes (valid passkey → dashboard)
- [ ] College creation E2E test passes (multi-step form → new college appears)
- [ ] Status update E2E test passes (dropdown → status changes)
- [ ] Checklist update E2E test passes (check all items → status becomes SUBMITTED)
- [ ] All E2E tests pass in headless mode: `npm run test:e2e`
- [ ] `npm run test:e2e:ui` opens Playwright UI for debugging
- [ ] Tests run against production build (`npm run build && npm run start`)
- [ ] `.gitignore` includes `test-results/`, `playwright-report/`, `playwright/.cache/`
- [ ] validate-quality skill Gate 6 updated to run Playwright tests
- [ ] No test flakiness (tests pass consistently)
- [ ] Test coverage >= 90% for implemented test scenarios
- [ ] No linter errors in test files
- [ ] Documentation in README or CLAUDE.md for running E2E tests

## Test Scenarios

### 1. Happy Path: Complete User Journey
**Description**: User logs in → creates college → updates checklist → verifies status progression

**Steps**:
1. Navigate to login page
2. Enter valid passkey
3. Verify redirect to dashboard
4. Click "Add College" button
5. Fill multi-step form (details → deadlines → checklist → review)
6. Submit form
7. Verify college appears on dashboard
8. Click on college card
9. Update checklist items
10. Verify status auto-progresses to SUBMITTED
11. Verify urgency indicator updates

**Expected**: All steps complete successfully, data persists

---

### 2. Edge Case: Invalid Login
**Description**: User enters wrong passkey

**Steps**:
1. Navigate to login page
2. Enter invalid passkey
3. Submit form

**Expected**: Error message shown, user remains on login page

---

### 3. Edge Case: Form Validation
**Description**: User tries to submit incomplete college form

**Steps**:
1. Login successfully
2. Click "Add College"
3. Try to proceed without filling required fields
4. Try to proceed to next step

**Expected**: Validation errors shown, cannot proceed until fields filled

---

### 4. Navigation: Direct URL Access
**Description**: Unauthenticated user tries to access protected route

**Steps**:
1. Clear cookies/session
2. Navigate directly to `/dashboard`

**Expected**: Redirect to `/login` page

---

### 5. State Persistence: Page Refresh
**Description**: Data persists after page refresh

**Steps**:
1. Login and create college
2. Refresh page
3. Verify college still appears

**Expected**: Data persists (stored in database, not just client state)

## Token Budget Estimate

### Approach A (Minimal)
- Playwright installation & configuration: 3K tokens
- Login flow test: 3K tokens
- College creation test: 5K tokens
- Status update test: 3K tokens
- Checklist update test: 4K tokens
- Gate 6 integration: 2K tokens
- **Total**: ~20K tokens

### Approach B (Comprehensive)
- All Approach A tests: 20K tokens
- Additional 10-12 tests: 18K tokens
- Responsive & accessibility tests: 2K tokens
- **Total**: ~40K tokens

## References

- [Next.js 15 Playwright Documentation](https://nextjs.org/docs/app/building-your-application/testing/playwright)
- [Playwright Official Docs](https://playwright.dev/docs/intro)
- CLAUDE.md: Authentication flow (middleware.ts, passkey-based)
- CLAUDE.md: Auto-status progression (updateChecklist action)
- `.claude/skills/validate-quality/SKILL.md`: Gate 6 section
- Similar pattern: Jest unit tests in `jest.config.js`

## Integration with Workflow

After implementation, Gate 6 in validate-quality skill will:
1. Check if E2E tests exist in `e2e/` directory
2. If yes, start dev server: `npm run dev`
3. Run E2E tests: `npm run test:e2e`
4. Capture results and screenshots
5. Pass/fail based on test outcomes
6. Kill dev server

This enables full autonomous validation without manual testing.
