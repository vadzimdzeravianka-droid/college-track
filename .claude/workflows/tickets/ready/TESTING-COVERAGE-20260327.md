# Ticket: Increase Jest Unit Test Coverage to 90%+

**Status**: READY
**Priority**: HIGH
**Estimated Tokens**: 45K
**Groomed Requirement**: `.claude/workflows/requirements/groomed/increase-jest-test-coverage.md`

## Summary

Add comprehensive Jest unit tests for React Client Components and Server Actions to increase overall code coverage from 10.87% to 90%+. Focus on business-critical components with logic (forms, cards, actions) while keeping tests fast, maintainable, and following TDD principles.

## Implementation Approach

**Incremental Priority-Based Implementation** (Approach A from groomed requirement): Tackle tests in priority order (actions → high-priority components), ensuring each file reaches 90%+ coverage before moving to the next. This provides clear progress tracking, focuses on highest-risk code first, and aligns with TDD principles.

**Rationale**:
- Immediate impact on most critical code
- Clear progress milestones (one file at a time)
- Can stop when 90% overall coverage reached
- Follows existing test patterns (lib/utils.ts, status-badge.tsx)
- Easier to review and validate incrementally

## Affected Files

### To Create
- `actions/__tests__/college.test.ts` - Server action tests with Prisma mocking
- `components/__tests__/college-form-new.test.tsx` - Multi-step form tests
- `components/__tests__/college-card.test.tsx` - Card rendering and interaction tests
- `components/__tests__/checklist-form.test.tsx` - Checklist and auto-status tests
- `components/__tests__/dashboard-client.test.tsx` - Filter and search tests
- `components/__tests__/status-actions.test.tsx` - Status dropdown tests

### To Modify
- None (only adding new test files)

## Subtasks

### Subtask 1: Create Server Action Tests (actions/college.ts)
**Complexity**: Complex
**Estimated Tokens**: 12K

**Description**: Create comprehensive tests for all server actions in actions/college.ts including database mocking, error handling, and auto-status progression logic. Mock Prisma client to avoid actual database calls.

**Files**:
- Create: `actions/__tests__/college.test.ts`

**Tests**:
- Unit: Test getColleges() returns colleges with checklists, serializes Decimal fields
- Unit: Test getCollegeById() handles found/not found, includes checklist
- Unit: Test createCollege() validates input, creates with defaults, auto-creates checklist
- Unit: Test updateCollege() validates, updates fields, preserves unchanged
- Unit: Test deleteCollege() removes college and checklist cascade
- Unit: Test updateCollegeStatus() changes status, revalidates path
- Unit: Test updateChecklist() core functionality and auto-status progression:
  - NOT_STARTED → IN_PROGRESS (first item checked)
  - IN_PROGRESS → SUBMITTED (all items complete)
  - SUBMITTED → IN_PROGRESS (item unchecked)
  - No status change for WAITLISTED/ACCEPTED/DECLINED
- Unit: Test error handling (DB failures, validation errors, not found)
- Unit: Test edge cases (null values, missing fields, invalid IDs)

**Acceptance**:
- [ ] actions/college.ts reaches 90%+ coverage
- [ ] All 7 server action functions tested (getColleges, getCollegeById, createCollege, updateCollege, deleteCollege, updateCollegeStatus, updateChecklist)
- [ ] Prisma client properly mocked (use jest.mock)
- [ ] Auto-status progression logic fully tested (4 scenarios)
- [ ] Error handling tested for all functions
- [ ] revalidatePath calls verified
- [ ] Decimal serialization tested
- [ ] Tests complete in <3 seconds

---

### Subtask 2: Create CollegeForm Tests
**Complexity**: Medium
**Estimated Tokens**: 10K

**Description**: Create tests for the multi-step college creation form including navigation, validation, data persistence between steps, and submission. Test all 6 form steps and validation rules.

**Files**:
- Create: `components/__tests__/college-form-new.test.tsx`

**Tests**:
- Unit: Test form renders all 6 steps (basics, deadlines, details, cost, portal, notes)
- Unit: Test navigation (next, back buttons work, preserve data)
- Unit: Test required field validation (name, category, strategy)
- Unit: Test optional field handling (dates, costs, notes)
- Unit: Test date validation (valid dates, invalid formats)
- Unit: Test cost input validation (positive numbers, null handling)
- Unit: Test form submission (calls createCollege action, shows loading state)
- Unit: Test error handling (API errors, validation errors)
- Unit: Test edge cases (long names, special characters, max values)
- Unit: Test cancel/close functionality

**Acceptance**:
- [ ] components/college-form-new.tsx reaches 90%+ coverage
- [ ] All 6 form steps tested
- [ ] Navigation between steps verified
- [ ] Required field validation tested
- [ ] Form submission logic tested
- [ ] Loading and error states tested
- [ ] Edge cases covered (long strings, special chars, boundaries)
- [ ] Tests use React Testing Library best practices (semantic queries)

---

### Subtask 3: Create CollegeCard Tests
**Complexity**: Medium
**Estimated Tokens**: 8K

**Description**: Create tests for college card component including rendering, urgency indicators, cost display, status badges, and user interactions. Test conditional rendering based on props.

**Files**:
- Create: `components/__tests__/college-card.test.tsx`

**Tests**:
- Unit: Test card renders with all fields (name, category, status, strategy, deadlines, costs)
- Unit: Test urgency color indicators:
  - Red for deadlines ≤7 days
  - Yellow for deadlines 8-21 days
  - Green for deadlines >21 days
  - None for submitted status or null deadline
- Unit: Test status badge rendering (all 6 statuses)
- Unit: Test category badge rendering (REACH, MATCH, SAFETY)
- Unit: Test strategy badge rendering (ED, EA, RD)
- Unit: Test cost display (grouped totals, in-state label, null handling)
- Unit: Test click interactions (card click, edit button, status dropdown)
- Unit: Test edge cases (long names, missing deadlines, null costs, overdue deadlines)
- Unit: Test responsive layout (mobile vs desktop)

**Acceptance**:
- [ ] components/college-card.tsx reaches 90%+ coverage
- [ ] All urgency levels tested with correct colors
- [ ] All status/category/strategy badges tested
- [ ] Cost calculations and display tested
- [ ] Click interactions tested (navigation, buttons)
- [ ] Edge cases covered (nulls, long text, overdue)
- [ ] Conditional rendering tested

---

### Subtask 4: Create ChecklistForm Tests
**Complexity**: Simple
**Estimated Tokens**: 6K

**Description**: Create tests for checklist form component including checkbox interactions, essay count inputs, auto-update behavior, and disabled states. Test that updateChecklist action is called correctly.

**Files**:
- Create: `components/__tests__/checklist-form.test.tsx`

**Tests**:
- Unit: Test all checkbox rendering (LOR, transcript, test scores, essay, finaid)
- Unit: Test checkbox click triggers updateChecklist action
- Unit: Test essay count input (change value, validates range 0-10)
- Unit: Test supplemental completed input (clamps to essay count)
- Unit: Test disabled state when checklist locked (WAITLISTED/ACCEPTED/DECLINED)
- Unit: Test loading state during update (isPending)
- Unit: Test edge cases (0 essays, all complete, rapid clicks)
- Unit: Test toast messages (success/error)

**Acceptance**:
- [ ] components/checklist-form.tsx reaches 90%+ coverage
- [ ] All 5 checkboxes tested
- [ ] Essay inputs tested (count, completed, clamping)
- [ ] updateChecklist action calls verified
- [ ] Disabled states tested
- [ ] Loading states tested
- [ ] Edge cases covered (0 essays, max essays, invalid input)

---

### Subtask 5: Create DashboardClient and StatusActions Tests
**Complexity**: Simple
**Estimated Tokens**: 5K

**Description**: Create tests for dashboard filtering/search and status dropdown functionality. Test filter combinations, search behavior, and status change interactions.

**Files**:
- Create: `components/__tests__/dashboard-client.test.tsx`
- Create: `components/__tests__/status-actions.test.tsx`

**Tests (DashboardClient)**:
- Unit: Test filter by status (all, in_progress, submitted, accepted, etc.)
- Unit: Test search by college name (case-insensitive, partial matches)
- Unit: Test combined filter + search
- Unit: Test empty states (no results, no colleges)
- Unit: Test special characters in search

**Tests (StatusActions)**:
- Unit: Test dropdown opens/closes
- Unit: Test all status options displayed
- Unit: Test status change calls updateCollegeStatus action
- Unit: Test loading state during update
- Unit: Test success/error toast messages
- Unit: Test disabled state during update

**Acceptance**:
- [ ] components/dashboard-client.tsx reaches 90%+ coverage
- [ ] components/status-actions.tsx reaches 90%+ coverage
- [ ] Filter functionality tested (all status options)
- [ ] Search functionality tested (case-insensitive, partial)
- [ ] Combined filter+search tested
- [ ] Status dropdown tested (open, select, update)
- [ ] Empty states and edge cases covered
- [ ] Loading and error states tested

---

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
- [ ] Tests use React Testing Library best practices (semantic queries like getByRole, getByText)
- [ ] All edge cases from requirements tested (nulls, undefined, boundaries, empty arrays, long strings)
- [ ] Parameterized tests used for enum-like values (status, category, strategy variations)
- [ ] All tests pass consistently (no flakiness, run 3 times without failure)
- [ ] Test execution time < 15 seconds total (keep tests fast)
- [ ] No linter errors in test files
- [ ] Coverage report shows minimal uncovered lines (<10% per file)
- [ ] All business logic paths covered (not just line coverage)
- [ ] Server actions mock Prisma client (no actual database calls)

## Test Scenarios

### Server Actions (Subtask 1)
- [ ] getColleges() returns colleges with checklists, serializes Decimals
- [ ] getCollegeById() handles found/not found cases
- [ ] createCollege() validates input and creates with defaults
- [ ] updateCollege() updates fields and preserves unchanged
- [ ] deleteCollege() removes college and checklist
- [ ] updateCollegeStatus() changes status and revalidates
- [ ] updateChecklist() triggers correct auto-status transitions:
  - [ ] NOT_STARTED → IN_PROGRESS on first check
  - [ ] IN_PROGRESS → SUBMITTED when all complete
  - [ ] SUBMITTED → IN_PROGRESS when unchecked
  - [ ] No change for WAITLISTED/ACCEPTED/DECLINED

### CollegeForm (Subtask 2)
- [ ] All 6 form steps render correctly
- [ ] Navigation preserves data between steps
- [ ] Required field validation works (name, category, strategy)
- [ ] Optional fields handle null/undefined
- [ ] Form submission calls createCollege action
- [ ] Loading and error states display correctly

### CollegeCard (Subtask 3)
- [ ] Card renders all fields correctly
- [ ] Urgency colors match deadline ranges (red ≤7, yellow 8-21, green >21)
- [ ] Status/category/strategy badges display correctly
- [ ] Cost calculations and grouping work
- [ ] Click interactions navigate/trigger actions
- [ ] Edge cases handled (long names, nulls, overdue)

### ChecklistForm (Subtask 4)
- [ ] All checkboxes render and toggle
- [ ] Essay inputs validate and clamp to range
- [ ] updateChecklist called on changes
- [ ] Disabled state when status locked
- [ ] Loading state during updates

### DashboardClient + StatusActions (Subtask 5)
- [ ] Filters work for all status options
- [ ] Search is case-insensitive and handles partials
- [ ] Filter + search combine correctly
- [ ] Status dropdown opens and selects
- [ ] Status change calls action and shows toast

## Edge Cases to Handle

### Data Validation
- Null/undefined values in all optional fields
- Empty arrays (0 colleges, 0 essays)
- Boundary values (cost = 0, negative, very large)
- Date edge cases (past, today, far future, null)
- String lengths (long college names >100 chars, empty strings)
- Special characters (quotes, commas, unicode in names)

### Component Behavior
- Components render without crashing with minimal props
- Components handle missing/null props gracefully
- User interactions trigger correct callbacks
- Loading states display during async operations
- Error states display with clear messages
- Conditional rendering works (urgency, status, costs)

### Server Actions
- Database errors handled gracefully (try/catch)
- Validation errors return proper error objects
- Prisma client mocked (no actual DB calls in tests)
- revalidatePath called after mutations
- Auto-status logic correctly implements all transitions
- Decimal fields properly serialized to numbers

## Definition of Done

- [ ] All 5 subtasks completed
- [ ] All acceptance criteria met
- [ ] Overall coverage >= 90% (run `npm run test:coverage`)
- [ ] All tests passing (run `npm test`)
- [ ] Test execution time < 15 seconds
- [ ] No linter errors (run `npm run lint`)
- [ ] No flaky tests (run test suite 3 times, all pass)
- [ ] Code review completed (if applicable)
- [ ] CLAUDE.md updated if testing patterns changed

## Token Budget

| Stage | Estimated |
|-------|-----------|
| Subtask 1 (Server Actions) | 12K |
| Subtask 2 (CollegeForm) | 10K |
| Subtask 3 (CollegeCard) | 8K |
| Subtask 4 (ChecklistForm) | 6K |
| Subtask 5 (Dashboard + StatusActions) | 5K |
| QA & Coverage Validation | 4K |
| **Total** | **45K** |

## Dependencies

- [ ] No blocking dependencies
- Note: All testing dependencies already installed (@testing-library/react, @testing-library/jest-dom, jest, etc.)
- Note: E2E tests already cover integration flows (no E2E tests needed here)

## References

- Groomed requirement: `.claude/workflows/requirements/groomed/increase-jest-test-coverage.md`
- Existing test patterns:
  - `lib/__tests__/utils.urgency.test.ts` - Parameterized tests, daysFromNow helper
  - `components/__tests__/status-badge.test.tsx` - Component testing, render + query
  - `schemas/__tests__/index.test.ts` - Zod validation testing
- CLAUDE.md: Auto-status progression logic
- CLAUDE.md: Urgency calculation system (getUrgencyLevel, getUrgencyMessage)
- Next.js Jest docs: https://nextjs.org/docs/app/building-your-application/testing/jest
  - Key: Async Server Components cannot be unit tested (use E2E - already done)
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
  - Use semantic queries (getByRole, getByLabelText, getByText)
  - Avoid implementation details (no .find(), .state())
- Jest mocking: https://jestjs.io/docs/mock-functions
  - Use jest.mock() for Prisma client
  - Use jest.fn() for action callbacks
