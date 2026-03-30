---
name: validate-quality
description: Comprehensive QA validation including tests, E2E, coverage, linting, and acceptance criteria verification. Auto-commits if all pass. Use when ticket is in QA stage.
license: MIT
compatibility: Requires npm, jest, Playwright for E2E testing
metadata:
  version: "1.0.0"
  author: autonomous-workflow
  stage: qa-validation
  allowed-tools: Bash Read Write
---

# Quality Validation Skill

Perform comprehensive quality assurance to ensure features meet all standards before committing to main branch.

## When to Use

- Ticket exists in `.claude/workflows/tickets/qa/`
- User asks to "validate" or "run QA"
- Triggered automatically after implementation completes

## Validation Gates

All gates must pass for auto-commit. If any fail, generate detailed report and block commit.

## Process

### Step 1: Load Ticket Context

Read ticket from `.claude/workflows/tickets/qa/[ticket-id].md`

Extract:
- Acceptance criteria checklist
- Test scenarios
- Edge cases to verify

### Step 2: Gate 1 - Unit Tests

Run full test suite:

```bash
npm test -- --verbose --no-cache
```

**Pass Criteria**:
- Exit code 0 (all tests pass)
- No test failures
- No test errors
- No skipped tests (unless explicitly marked)

**If Fails**:
- Capture test output
- Identify failed tests
- Add to validation report
- **Block commit**

### Step 3: Gate 2 - Test Coverage

Run coverage report:

```bash
npm run test:coverage -- --verbose
```

Parse coverage output for:
- Statements coverage
- Branches coverage
- Functions coverage
- Lines coverage

**Pass Criteria**:
- Overall coverage >= 90%
- New files coverage >= 90%
- No uncovered critical paths

**If Below 90%**:
- Identify uncovered lines
- Generate coverage report HTML: `open coverage/lcov-report/index.html`
- List specific files below threshold
- **Block commit**

### Step 4: Gate 3 - Linting

Run ESLint:

```bash
npm run lint -- --max-warnings 0
```

**Pass Criteria**:
- Exit code 0
- Zero errors
- Zero warnings

**If Fails**:
- Attempt auto-fix:
```bash
npm run lint -- --fix
```
- If auto-fix succeeds, re-run validation
- If auto-fix fails, capture errors and **block commit**

### Step 5: Gate 4 - Type Checking

Run TypeScript compiler:

```bash
npx tsc --noEmit
```

**Pass Criteria**:
- Exit code 0
- No type errors

**If Fails**:
- Capture type errors
- **Block commit**

### Step 6: Gate 5 - Build Verification

Ensure production build succeeds:

```bash
npm run build
```

**Pass Criteria**:
- Exit code 0
- Build completes without errors
- No warnings (critical ones)

**If Fails**:
- Capture build errors
- **Block commit**

### Step 7: Gate 6 - E2E Testing (if applicable)

Check if E2E tests exist in `e2e/` directory. If they do, run Playwright tests.

**Check for E2E Tests**:
```bash
if [ -d "e2e" ] && [ "$(ls -A e2e/*.spec.ts 2>/dev/null)" ]; then
  echo "📋 Gate 6: E2E tests found, running Playwright..."
  E2E_TESTS_EXIST=true
else
  echo "⏭️  Gate 6: No E2E tests found, skipping..."
  E2E_TESTS_EXIST=false
fi
```

**If E2E Tests Exist**:

Run Playwright tests (Playwright automatically starts dev server via webServer config):

```bash
npm run test:e2e
E2E_EXIT_CODE=$?
```

**Pass Criteria**:
- Exit code 0 (all E2E tests pass)
- No test failures
- No timeout errors
- Screenshots saved for any failures

**If Fails**:
- Capture test output
- Screenshots automatically saved to `test-results/`
- Playwright report saved to `playwright-report/`
- Copy artifacts to validation report:
```bash
mkdir -p .claude/workflows/validation-reports/[ticket-id]/e2e/
cp -r test-results/ .claude/workflows/validation-reports/[ticket-id]/e2e/test-results/
cp -r playwright-report/ .claude/workflows/validation-reports/[ticket-id]/e2e/playwright-report/
```
- **Block commit**

**Note**: Playwright config (`playwright.config.ts`) handles dev server start/stop automatically via `webServer` setting. No manual server management needed.

### Step 8: Gate 7 - Acceptance Criteria Validation

Manually verify each acceptance criterion from ticket:

For each criterion:
1. Read the criterion
2. Execute the described behavior (via tests or E2E)
3. Confirm it works as specified

**Example**:
```markdown
Criterion: "Export button appears on dashboard page"
Validation:
- E2E test confirms button element exists
- Visual inspection in E2E screenshot shows button
✓ PASS
```

**Pass Criteria**:
- All acceptance criteria verified
- Each criterion has evidence (test result, screenshot, or manual verification)

**If Any Criterion Fails**:
- Document which criterion failed
- Explain why it failed
- **Block commit**

### Step 9: Generate Validation Report

Create comprehensive report:

```markdown
# QA Validation Report

**Ticket**: [ticket-id]
**Date**: [YYYY-MM-DD HH:MM]
**Status**: [PASS / FAIL]

## Summary

- Total Gates: 7
- Passed: [X]
- Failed: [X]
- Overall: [PASS/FAIL]

## Gate Results

### Gate 1: Unit Tests
**Status**: [PASS/FAIL]
**Tests Run**: [X]
**Passed**: [X]
**Failed**: [X]

[If failed, list failed tests]

---

### Gate 2: Test Coverage
**Status**: [PASS/FAIL]
**Overall Coverage**: [X]%
**Threshold**: 90%

| Metric | Percentage |
|--------|------------|
| Statements | [X]% |
| Branches | [X]% |
| Functions | [X]% |
| Lines | [X]% |

[If failed, list files below threshold]

---

### Gate 3: Linting
**Status**: [PASS/FAIL]
**Errors**: [X]
**Warnings**: [X]

[If failed, list errors]

---

### Gate 4: Type Checking
**Status**: [PASS/FAIL]
**Errors**: [X]

[If failed, list type errors]

---

### Gate 5: Build Verification
**Status**: [PASS/FAIL]
**Build Time**: [X]s

[If failed, show build errors]

---

### Gate 6: E2E Tests
**Status**: [PASS/FAIL]
**Tests Run**: [X]
**Passed**: [X]
**Failed**: [X]

[If failed, link to screenshots]

---

### Gate 7: Acceptance Criteria
**Status**: [PASS/FAIL]
**Total Criteria**: [X]
**Verified**: [X]
**Failed**: [X]

[List each criterion with status]

---

## Decision

[If all pass]
✅ **AUTO-COMMIT APPROVED**
All quality gates passed. Proceeding with commit.

[If any fail]
❌ **COMMIT BLOCKED**
Quality gates failed. Review report and fix issues.

## Next Actions

[If pass]
- Commit changes with conventional commit message
- Move ticket to done/
- Archive validation report

[If fail]
- Fix issues identified in report
- Re-run validation
- Do not commit until all gates pass

## Artifacts

- Test output: `.claude/workflows/validation-reports/[ticket-id]/test-output.txt`
- Coverage report: `.claude/workflows/validation-reports/[ticket-id]/coverage/`
- E2E screenshots: `.claude/workflows/validation-reports/[ticket-id]/screenshots/`
```

Save report to: `.claude/workflows/validation-reports/[ticket-id]/report.md`

### Step 10: Decision Point

#### If All Gates Pass ✅

**Check Branch Strategy:**

```bash
# Source git utilities
source .claude/workflows/lib/git-branch-utils.sh

CURRENT_BRANCH=$(get_current_branch)
TICKET_ID="[ticket-id]"

if is_on_main; then
  echo "📍 On main branch - Direct commit mode"
  MODE="direct"
else
  echo "📍 On feature branch: $CURRENT_BRANCH"
  echo "   Will merge to main after commit"
  MODE="feature_branch"
fi
```

**Auto-commit with conventional commit message:**

```bash
# Read ticket summary for commit message
TICKET_SUMMARY="[extracted from ticket]"

# Generate commit message
git add .
git commit -m "feat: ${TICKET_SUMMARY}

[Body with details]

Tests: [X]% coverage, all passing
QA: All validation gates passed
Closes: [ticket-id]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

COMMIT_SHA=$(git rev-parse HEAD)
echo "✅ Committed: $COMMIT_SHA"
```

**If on Feature Branch - Merge to Main:**

```bash
if [[ "$MODE" == "feature_branch" ]]; then
  echo ""
  echo "🔄 Merging to main..."

  # Update from main
  git fetch origin main 2>/dev/null || git fetch main 2>/dev/null || true
  git rebase origin/main 2>/dev/null || git rebase main 2>/dev/null || true

  # Switch to main
  git checkout main
  git pull --ff-only 2>/dev/null || true

  # Squash merge
  git merge --squash "$CURRENT_BRANCH"

  # Commit consolidated changes
  git commit -m "feat: ${TICKET_SUMMARY}

[Body with details]

Tests: [X]% coverage, all passing
QA: All validation gates passed
Closes: [ticket-id]
Branch: $CURRENT_BRANCH

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"

  MAIN_COMMIT_SHA=$(git rev-parse HEAD)
  echo "✅ Merged to main: $MAIN_COMMIT_SHA"

  # Cleanup feature branch
  git branch -d "$CURRENT_BRANCH"
  echo "🧹 Deleted feature branch: $CURRENT_BRANCH"
fi
```

**Move ticket to done:**
```bash
mv .claude/workflows/tickets/qa/[ticket-id].md .claude/workflows/tickets/done/[ticket-id].md
```

**Update ticket status:**
```markdown
**Status**: DONE ✅
**Completed**: [YYYY-MM-DD HH:MM]
**Commit**: [commit-sha]
```

**Trigger learning agent:**
(Run async, non-blocking)

#### If Any Gate Fails ❌

**Generate detailed failure report** (as shown above)

**Move ticket back to in-progress:**
```bash
mv .claude/workflows/tickets/qa/[ticket-id].md .claude/workflows/tickets/in-progress/[ticket-id].md
```

**Update ticket with failure info:**
```markdown
**Status**: FAILED QA ❌
**Failed Gates**: [list]
**Report**: .claude/workflows/validation-reports/[ticket-id]/report.md

## Required Fixes

[List of specific fixes needed based on gate failures]
```

**DO NOT COMMIT**

### Step 11: Update Metrics and Check Learning Trigger

#### After Successful Validation

Update metrics and check if learning should trigger:

```bash
# Path to metrics file
METRICS_FILE=".claude/workflows/metrics.json"

# Read current counts
COMPLETED=$(jq '.tickets_completed' "$METRICS_FILE")
SINCE_LEARNING=$(jq '.tickets_since_last_learning' "$METRICS_FILE")
PASSED_FIRST=$(jq '.passed_first_attempt' "$METRICS_FILE")

# Increment counters
NEW_COMPLETED=$((COMPLETED + 1))
NEW_SINCE_LEARNING=$((SINCE_LEARNING + 1))
NEW_PASSED_FIRST=$((PASSED_FIRST + 1))

# Update metrics
jq ".tickets_completed = $NEW_COMPLETED | \
    .tickets_since_last_learning = $NEW_SINCE_LEARNING | \
    .passed_first_attempt = $NEW_PASSED_FIRST | \
    .tickets_validated = $NEW_COMPLETED" \
    "$METRICS_FILE" > tmp.json && mv tmp.json "$METRICS_FILE"

echo "✅ Metrics updated: $NEW_COMPLETED tickets completed, $NEW_SINCE_LEARNING since last learning"

# Check if learning trigger reached
THRESHOLD=$(jq '.learning_trigger_threshold' "$METRICS_FILE")
AUTO_ENABLED=$(jq '.auto_learning_enabled' "$METRICS_FILE")

if [[ $NEW_SINCE_LEARNING -ge $THRESHOLD ]] && [[ "$AUTO_ENABLED" == "true" ]]; then
  echo ""
  echo "🎓 =============================================="
  echo "   LEARNING TRIGGER REACHED!"
  echo "   Completed $NEW_SINCE_LEARNING/$THRESHOLD tickets"
  echo "   Triggering self-learning workflow..."
  echo "=============================================="
  echo ""

  # Trigger self-learn skill (background, non-blocking)
  claude "/self-learn" &

  # Reset counter and update last learning date
  jq ".tickets_since_last_learning = 0 | \
      .last_learning_date = \"$(date -Iseconds)\"" \
      "$METRICS_FILE" > tmp.json && mv tmp.json "$METRICS_FILE"

  echo "✨ Self-learning initiated in background"
  echo "📊 Counter reset. Next learning after 5 more tickets."
fi
```

#### After Validation Failure

Update failure metrics:

```bash
METRICS_FILE=".claude/workflows/metrics.json"
FAILED=$(jq '.failed_first_attempt' "$METRICS_FILE")
NEW_FAILED=$((FAILED + 1))

jq ".failed_first_attempt = $NEW_FAILED" \
    "$METRICS_FILE" > tmp.json && mv tmp.json "$METRICS_FILE"

# If repeated failures (3+ attempts), escalate to human review
if [[ $NEW_FAILED -ge 3 ]]; then
  echo "⚠️  Multiple validation failures detected. Consider human review."
fi
```

## Quality Metrics Tracking

Save metrics to `.claude/workflows/metrics.json`:

```json
{
  "tickets_validated": 25,
  "passed_first_attempt": 21,
  "failed_first_attempt": 4,
  "avg_coverage": 0.93,
  "avg_validation_time_minutes": 8,
  "most_common_failure": "coverage below 90%"
}
```

## E2E Test Examples

### E2E Test Patterns

E2E tests use Playwright. See `e2e/` directory for existing patterns:

```typescript
// Example from e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  const passkey = process.env.APP_PASSKEY;

  await page.goto('/login');
  await page.fill('input#passkey', passkey!);
  await page.click('button[type="submit"]');

  await page.waitForURL('/dashboard', { timeout: 10000 });
  await expect(page.locator('text=College Application Tracker')).toBeVisible();
});
```

**Reference existing tests**:
- `e2e/auth.spec.ts` - Authentication flows
- `e2e/college-crud.spec.ts` - College CRUD operations
- `e2e/checklist.spec.ts` - Checklist updates
- `e2e/helpers.ts` - Reusable test helpers

## Gotchas

### Don't Skip E2E Tests
Even if unit tests pass, E2E can catch integration issues. Always run if scenarios defined.

### Don't Auto-Commit on Warnings
Linter warnings are not blockers by default, but scrutinize them. Some may indicate real issues.

### Don't Ignore Flaky Tests
If a test passes sometimes and fails others, that's a test quality issue. Fix or mark as flaky.

### Don't Trust Only Coverage Percentage
90% coverage doesn't guarantee quality. Review what's actually tested, not just the number.

### Don't Skip Build Verification
Production builds can fail even when dev mode works (e.g., environment variables, imports).

## Debugging Failed Validations

### Test Failures

1. Run single failing test:
```bash
npm test -- path/to/failing.test.ts
```

2. Check test isolation:
```bash
npm test -- --runInBand path/to/failing.test.ts
```

3. Review test logs in validation report

### Coverage Gaps

1. Open HTML coverage report:
```bash
open coverage/lcov-report/index.html
```

2. Find uncovered lines (red/yellow highlighting)

3. Add missing tests or remove dead code

### E2E Failures

1. Run E2E with UI mode:
```bash
npm run test:e2e:ui
```

2. Run in headed mode to see browser:
```bash
npm run test:e2e:headed
```

3. Check screenshots in validation report

4. Verify server is running during E2E

## Self-Learning Integration

After each validation, save learnings to `.claude/workflows/learning/patterns/validation-[ticket-id].json`:

```json
{
  "ticket_id": "EXPORT-CSV-20260326",
  "validation_time_minutes": 7,
  "gates_passed": 7,
  "gates_failed": 0,
  "first_attempt_success": true,
  "coverage_achieved": 0.95,
  "e2e_tests_run": 2,
  "lessons": [
    "E2E test caught missing loading state that unit tests missed",
    "Coverage was initially 88%, added 3 edge case tests to reach 95%"
  ]
}
```

## Success Criteria

✅ **Validation Successful If**:
- All 7 gates pass
- Acceptance criteria all verified
- Report shows no blockers
- Auto-commit executes

❌ **Validation Failed If**:
- Any gate fails
- Any acceptance criterion unmet
- Commit is blocked

## References

- See `scripts/e2e_runner.ts` for E2E test utilities
- See `templates/qa_report_template.md` for report format
- See CLAUDE.md for project-specific validation requirements
