# Requirement: Increase Jest Unit Test Coverage to 90%+

## Original Request

Increase Jest unit test coverage from current 10.87% to 90%+ by adding comprehensive unit tests for React components and server actions that are currently untested.

**Why**: To ensure confidence in the automated deployment process and catch bugs early. Currently, most React components (college-card, college-form, dashboard-client, status-actions, etc.) have 0% test coverage, which creates risk for regressions.

**Constraints**:
- Target coverage: 90% minimum (100% would be ideal but not required)
- Best practices: Follow TDD principles, don't write absurd tests just to hit numbers
- Business logic: Every business case and user flow must be covered
- Test quality: Use parameterized tests where applicable
- Edge cases: Test boundary conditions (max/min values, long/short strings, null, undefined, empty arrays, etc.)
- Performance: Keep tests minimal and super fast (no unnecessary renders, mock external dependencies)
- Focus areas: Prioritize components with business logic over pure UI components

## Enriched Requirement

Add comprehensive Jest unit tests for all Client Components and Server Actions to achieve 90%+ code coverage. Focus on business logic, user interactions, and edge cases while keeping tests fast and maintainable.

### Context

**Current Coverage Breakdown**:
```
All files: 10.87% coverage
- lib/utils.ts: 97.88% ✅ (excellent reference)
- components/*.tsx: 0-3.72% ❌ (critical gap)
- actions/college.ts: 0% ❌ (critical gap)
- components/ui/*.tsx: 0-2.99% ❌ (low priority - presentational)
```

**Affected Areas**:
- **High Priority** (business logic):
  - `components/college-card.tsx` (349 lines, 0% coverage) - Urgency logic, status display
  - `components/college-form-new.tsx` (671 lines, 0% coverage) - Multi-step form, validation
  - `components/dashboard-client.tsx` (101 lines, 0% coverage) - Filters, search
  - `components/checklist-form.tsx` (184 lines, 0% coverage) - Auto-status progression
  - `components/status-actions.tsx` (87 lines, 0% coverage) - Status updates
  - `actions/college.ts` (223 lines, 0% coverage) - CRUD operations, checklist logic

- **Medium Priority** (UI logic):
  - `components/portal-credentials.tsx` (124 lines) - Password visibility toggle
  - `components/stats-overview.tsx` (57 lines) - Calculations
  - `components/dashboard-filters.tsx` (66 lines) - Filter state

- **Low Priority** (pure presentational):
  - `components/ui/*.tsx` - shadcn/ui components (test if time allows)
  - `components/theme-toggle.tsx`, `components/college-edit-button.tsx`

**Dependencies**: None (all testing tools already installed)

**Related Features**:
- E2E tests already cover integration flows
- lib/utils.ts provides excellent test pattern examples
- status-badge.test.tsx shows component testing approach

**Important Constraints**:
- **Async Server Components** (dashboard page, college detail page) CANNOT be unit tested with Jest per Next.js 15 docs - use E2E tests instead (already implemented)
- All `components/*.tsx` are synchronous Client Components - can be fully unit tested
- Server actions need database mocking (use jest.mock)

## Implementation Approaches

### Approach A: Incremental Priority-Based Implementation
**Description**: Tackle tests in priority order (actions → high-priority components → medium → low), ensuring each file reaches 90%+ before moving to next. Create test files alongside development, run coverage after each file.

**Pros**:
- Immediate impact on most critical code
- Clear progress tracking (one file at a time)
- Easier to review and validate
- Can stop when 90% overall coverage reached
- Follows TDD principles

**Cons**:
- May leave some files untested if 90% reached early
- Requires more commits (one per file or small batch)

**Token Estimate**: ~45K tokens
- actions/college.ts tests: ~12K tokens (complex mocking, multiple functions)
- college-form-new.tsx tests: ~10K tokens (multi-step form, validation)
- college-card.tsx tests: ~8K tokens (rendering, urgency, interactions)
- checklist-form.tsx tests: ~6K tokens (checkbox interactions, auto-status)
- dashboard-client.tsx tests: ~4K tokens (filters, search)
- status-actions.tsx tests: ~3K tokens (dropdown, status changes)
- Other components: ~2K tokens

### Approach B: Batch Implementation by Type
**Description**: Group similar components together (all forms, all display components, all actions) and test them in batches. Write all tests in one subtask, then validate coverage.

**Pros**:
- Consistent patterns within batches
- Fewer context switches
- Single large commit
- Can reuse test utilities across similar components

**Cons**:
- Harder to track progress
- Larger subtasks = higher risk of errors
- May overshoot 90% target significantly
- Less incremental feedback

**Token Estimate**: ~50K tokens (higher due to less focused approach)

### Approach C: Coverage-Driven Selective Testing
**Description**: Run coverage report, identify lines with 0% coverage, write targeted tests only for uncovered paths. Use coverage visualization to guide test writing.

**Pros**:
- Laser-focused on gaps
- Most efficient path to 90%
- Avoids testing already-covered code
- Lower token usage

**Cons**:
- May miss important test scenarios not caught by coverage
- Less comprehensive business logic validation
- Harder to ensure edge case coverage
- Doesn't follow TDD principles

**Token Estimate**: ~35K tokens (most efficient)

**Recommended**: **Approach A (Incremental Priority-Based)** because:
- Aligns with TDD principles mentioned in constraints
- Provides clear progress milestones
- Focuses on highest-risk code first
- Easier to review and validate quality
- Can stop early if 90% reached
- Matches existing test patterns (lib/utils.ts was done incrementally)

## Edge Cases & Considerations

### Data Validation
- **Null/Undefined**: All components accepting optional props (college data, checklist, dates)
- **Empty Arrays**: Dashboard with 0 colleges, form with 0 supplemental essays
- **Boundary Values**: Cost calculations with 0, negative, very large numbers
- **Date Edge Cases**: Deadlines in past, today, far future, null deadlines
- **String Lengths**: Long college names (>100 chars), empty strings
- **Special Characters**: College names with quotes, commas, unicode

### Component Testing
- **Rendering**: Components render without crashing with various prop combinations
- **User Interactions**: Button clicks, form submissions, checkbox toggles, dropdown selections
- **State Changes**: Form validation errors, loading states, success/error messages
- **Conditional Rendering**: Different content based on status, category, urgency level
- **Event Handlers**: onClick, onChange, onSubmit properly called with correct arguments

### Server Actions Testing
- **Database Mocking**: Mock Prisma client to avoid actual DB calls
- **Error Handling**: Database failures, validation errors, network issues
- **Return Values**: Success/error objects match expected schema
- **Side Effects**: revalidatePath called correctly
- **Auto-Status Logic**: Checklist updates trigger correct status transitions

### Performance
- **Fast Execution**: All tests complete in <10 seconds total
- **No External Dependencies**: Mock fetch, database, file system
- **Minimal Renders**: Use shallow rendering where appropriate
- **Parallel Execution**: Tests run concurrently without conflicts

### Security
- **No Sensitive Data**: Don't use real passwords or credentials in tests
- **Input Sanitization**: Test that XSS attempts are escaped
- **SQL Injection**: Verify Prisma parameterization (inherent, not tested explicitly)

## Acceptance Criteria

- [ ] Overall Jest coverage reaches 90% minimum (statements, branches, functions, lines)
- [ ] All high-priority files reach 90%+ individual coverage:
  - [ ] actions/college.ts >= 90%
  - [ ] components/college-card.tsx >= 90%
  - [ ] components/college-form-new.tsx >= 90%
  - [ ] components/checklist-form.tsx >= 90%
  - [ ] components/dashboard-client.tsx >= 90%
  - [ ] components/status-actions.tsx >= 90%
- [ ] All test files follow existing patterns (lib/__tests__/utils.test.ts, components/__tests__/status-badge.test.tsx)
- [ ] Tests use React Testing Library best practices (semantic queries, user-centric)
- [ ] All edge cases from user requirements tested (nulls, undefined, boundaries, empty arrays)
- [ ] Parameterized tests used for enum-like values (status, category, strategy)
- [ ] All tests pass consistently (no flakiness)
- [ ] Test execution time < 15 seconds total
- [ ] No linter errors in test files
- [ ] Coverage report shows minimal uncovered lines (only unreachable code)
- [ ] All business logic paths covered (not just line coverage)

## Test Scenarios

### 1. Server Actions (actions/college.ts)
- **getColleges()**: Returns colleges with checklists, handles DB errors, serializes Decimal fields
- **getCollegeById()**: Returns single college, handles not found, includes checklist
- **createCollege()**: Validates input, creates with defaults, handles validation errors
- **updateCollege()**: Updates fields, preserves unchanged fields, validates input
- **deleteCollege()**: Removes college and associated checklist, handles not found
- **updateCollegeStatus()**: Changes status, revalidates path, handles invalid status
- **updateChecklist()**: Updates checklist fields, triggers auto-status progression, handles edge cases

**Auto-Status Progression Logic**:
- NOT_STARTED → IN_PROGRESS (first checklist item checked)
- IN_PROGRESS → SUBMITTED (all checklist items complete)
- SUBMITTED → IN_PROGRESS (checklist item unchecked)
- SUBMITTED/WAITLISTED/ACCEPTED/DECLINED (status locked after submission)

### 2. CollegeCard Component
- **Rendering**: Displays name, badges, deadlines, costs, urgency indicators
- **Urgency Colors**: Red (≤7 days), Yellow (8-21 days), Green (>21 days), None (submitted/no deadline)
- **Cost Display**: Shows grouped totals, in-state label, handles null costs
- **Interactions**: Click card to navigate, click edit button, click status dropdown
- **Edge Cases**: Long names, missing fields, overdue deadlines, null costs

### 3. CollegeFormNew Component
- **Multi-Step Form**: Navigate through 6 steps (basics, deadlines, details, cost, portal, notes)
- **Validation**: Required fields (name, category, strategy), date validation, cost validation
- **Back/Next Navigation**: Can go back and forth, preserves data between steps
- **Submission**: Submits correct data structure, shows loading state, handles errors
- **Edge Cases**: Skip optional fields, maximum values, special characters in name

### 4. ChecklistForm Component
- **Checkbox Interactions**: Check/uncheck items, disable when status locked
- **Essay Inputs**: Change essay count, change completed count, clamp to valid range
- **Auto-Update**: Calls updateChecklist on each change
- **Loading States**: Disables during update, shows pending state
- **Edge Cases**: 0 essays, all items complete, locked checklist

### 5. DashboardClient Component
- **Filtering**: Filter by status (all, in_progress, submitted, accepted)
- **Search**: Search by college name, case-insensitive
- **Combined**: Search + filter work together
- **Empty States**: No results, no colleges
- **Edge Cases**: Partial name matches, special characters in search

### 6. StatusActions Component
- **Dropdown**: Opens status dropdown, shows all status options
- **Status Change**: Calls updateCollegeStatus, shows success toast, handles errors
- **Loading State**: Disables during update
- **Edge Cases**: Failed update, rapid clicks, closed dropdown

## Token Budget Estimate

| Stage | Estimated Tokens |
|-------|------------------|
| Subtask 1: Server Actions Tests | 12K |
| Subtask 2: CollegeForm Tests | 10K |
| Subtask 3: CollegeCard Tests | 8K |
| Subtask 4: ChecklistForm Tests | 6K |
| Subtask 5: DashboardClient + StatusActions Tests | 5K |
| Subtask 6: Medium Priority Components | 4K |
| **Total** | **45K** |

## References

- Next.js Jest docs: https://nextjs.org/docs/app/building-your-application/testing/jest
- **Key insight**: Async Server Components cannot be unit tested - use E2E instead (already done)
- React Testing Library docs: https://testing-library.com/docs/react-testing-library/intro/
- Existing test patterns:
  - `lib/__tests__/utils.urgency.test.ts` - Excellent parameterized test examples
  - `components/__tests__/status-badge.test.tsx` - Component testing pattern
  - `schemas/__tests__/index.test.ts` - Validation testing
- CLAUDE.md: Auto-status progression logic (updateChecklist action)
- CLAUDE.md: Urgency calculation system (getUrgencyLevel, getUrgencyMessage)
- Jest coverage config: `jest.config.js` (collectCoverageFrom already configured)

## Test Strategy Summary

**Priority Order**:
1. ✅ **actions/college.ts** (0% → 90%+) - Critical business logic, auto-status
2. ✅ **college-form-new.tsx** (0% → 90%+) - Complex multi-step form, validation
3. ✅ **college-card.tsx** (0% → 90%+) - Display logic, urgency, interactions
4. ✅ **checklist-form.tsx** (0% → 90%+) - Checkbox logic, auto-updates
5. ✅ **dashboard-client.tsx** (0% → 90%+) - Filters, search
6. ✅ **status-actions.tsx** (0% → 90%+) - Status dropdown, updates
7. ⚠️ Medium priority components if time allows
8. ⚠️ UI primitives (components/ui/*.tsx) only if needed for 90%

**Testing Tools**:
- Jest + React Testing Library (already configured)
- @testing-library/jest-dom (custom matchers)
- @testing-library/user-event (user interactions)
- jest.mock() for Prisma database mocking

**Success Metrics**:
- Coverage: 90%+ overall, 90%+ for each high-priority file
- Speed: All tests complete in <15 seconds
- Quality: All edge cases covered, no flaky tests
- Maintainability: Clear test names, minimal duplication
