# Ticket: T00006 - College Dashboard Sorting Feature

**Status**: READY
**Priority**: MEDIUM
**Complexity**: LOW
**Token Budget**: ~24K tokens
**Created**: 2026-04-03

---

## Overview

Add user-controllable sorting to the college dashboard that allows users to organize their college list by various fields including name, deadline, status, urgency, category, and strategy. The sorting UI will follow the existing dashboard filter pattern (mobile dropdown, desktop button group) and replace the current hardcoded urgency-based sort with user choice while preserving urgency sorting as one of the available options.

## Problem Statement

The current dashboard implementation hardcodes sorting by urgency level (red → yellow → green) with deadline as tiebreaker (lines 43-74 in `dashboard-client.tsx`). While this provides smart default behavior, users have no control over how their college list is organized. Users may want to view colleges alphabetically, by deadline chronology, or by application status progression depending on their workflow needs.

**Current Behavior**:
- Dashboard always sorts by urgency (red → yellow → green → none)
- Within same urgency level, sorts by deadline (soonest first)
- No user control or alternative sort options

**Desired Behavior**:
- User can choose sort field from dropdown (mobile) or button group (desktop)
- Sort options: Urgency (default), Name, Deadline, Status, Category, Strategy
- Sort preference applies to filtered results
- Active sort option is visually indicated
- Sort state resets on page refresh (acceptable for v1)

## Requirements

### Functional Requirements
- Sort control component following `dashboard-filters.tsx` pattern
- Mobile: native-looking dropdown using `<Select>` component
- Desktop: button group with active state highlighting
- Six sort options with sensible default orderings
- Null value handling (push to end of list)
- Case-insensitive string sorting using `localeCompare()`
- Sort respects active filter (sorts filtered colleges)
- Changing filter preserves sort selection

### Technical Requirements
- TypeScript type safety for `SortOption` enum
- No mutation of original colleges array
- Sort logic extracted into testable functions
- Integration with existing filter state in `DashboardClient`
- Performance target: <5ms for 100 colleges

### Quality Requirements
- Unit test coverage ≥90%
- All existing tests continue to pass
- No linter errors or console warnings
- E2E test coverage for sort workflows

## Acceptance Criteria

### UI/UX Criteria
- [ ] Sort control appears on dashboard below/alongside filter controls
- [ ] Mobile: sort control renders as dropdown (Select component)
- [ ] Desktop: sort control renders as button group (Button components)
- [ ] Active sort option is visually indicated (highlighted button or selected dropdown value)
- [ ] Sort control remains visible when no colleges match filter

### Functional Criteria
- [ ] Sort options include: Urgency (default), Name, Deadline, Status, Category, Strategy
- [ ] Selecting "Name" sorts colleges alphabetically (A-Z, case-insensitive)
- [ ] Selecting "Deadline" sorts colleges by application deadline (soonest first)
- [ ] Selecting "Status" sorts colleges by status progression (NOT_STARTED → DECLINED)
- [ ] Selecting "Urgency" sorts colleges by urgency level (red → yellow → green → none), then by deadline
- [ ] Selecting "Category" sorts colleges by category (SAFETY → MATCH → REACH)
- [ ] Selecting "Strategy" sorts colleges by strategy (ED → EA → RD)
- [ ] Colleges with null deadlines appear at end when sorting by deadline
- [ ] Colleges with null/empty strings appear at end when sorting by name
- [ ] Sort respects active filter (sorts only filtered colleges)
- [ ] Changing filter preserves sort selection

### Technical Criteria
- [ ] Sort logic uses pure functions (no mutations)
- [ ] Case-insensitive string sorting uses `localeCompare()`
- [ ] Null/undefined values handled explicitly in all comparators
- [ ] TypeScript types defined for `SortOption` enum
- [ ] Component follows existing `dashboard-filters.tsx` pattern
- [ ] No performance regression (sorting <5ms for 100 colleges)

### Quality Criteria
- [ ] All unit tests pass with ≥90% coverage
- [ ] Integration tests verify sort + filter interaction
- [ ] E2E test verifies sort control functionality
- [ ] No linter errors or warnings
- [ ] No console errors in browser

---

## Affected Files

### Primary Files (Modified)
- `components/dashboard-client.tsx` - Add sort state, update sort logic (replace lines 43-74)
- `components/dashboard-sort.tsx` - **NEW** component for sort controls

### Dependencies (No Changes)
- `components/ui/select.tsx` - Existing shadcn component (mobile dropdown)
- `components/ui/button.tsx` - Existing shadcn component (desktop buttons)
- `components/ui/label.tsx` - Existing shadcn component (label for mobile)

### Testing Files
- `components/__tests__/dashboard-client.test.tsx` - Update existing tests, add sort tests
- `components/__tests__/dashboard-sort.test.tsx` - **NEW** test file for DashboardSort
- `e2e/dashboard-sort.spec.ts` - **NEW** E2E tests for sort workflows

### Related Context
- `lib/utils.ts` - Urgency calculation (used for urgency sort option)
- `components/dashboard-filters.tsx` - Pattern to follow for UI consistency
- `components/college-card.tsx` - Display component (not modified)

---

## Implementation Approach

**Recommended**: Client-Side State with Simple Dropdown (Approach A from requirement doc)

### Rationale
- Right-sized for problem (10-30 colleges typical, 100-200 max)
- Lowest risk and fastest delivery
- Follows established `dashboard-filters.tsx` pattern
- No architecture changes required
- Simple to test and maintain
- Preserves smart urgency-based sort as an option
- Performance excellent for current dataset size (O(n log n) = <5ms)

### Alternative Approaches Considered
- **Approach B** (URL search params): More complex (~35K tokens), provides persistence/shareability - overkill for v1
- **Approach C** (Server-side sorting): Most complex (~50K tokens), scalable to 1000+ colleges - over-engineered for current needs

### Implementation Pattern

1. **Add sort state to DashboardClient**:
   ```typescript
   type SortOption = "urgency" | "name" | "deadline" | "status" | "category" | "strategy";
   const [sortBy, setSortBy] = useState<SortOption>("urgency");
   ```

2. **Create DashboardSort component** (mirrors `dashboard-filters.tsx`):
   - Mobile: `<Select>` dropdown with label
   - Desktop: Button group with active state
   - Props: `activeSort`, `onSortChange`

3. **Replace hardcoded sort logic** with dynamic sorting:
   ```typescript
   const sortedColleges = [...filteredColleges].sort((a, b) => {
     switch (sortBy) {
       case "name": return (a.name || "").localeCompare(b.name || "");
       case "deadline": /* handle dates with null checks */
       case "status": /* map to progression order */
       case "urgency": /* existing urgency logic */
       // ...etc
     }
   });
   ```

4. **Sort comparator helpers**:
   - Extract comparator logic into testable functions
   - Handle null values consistently (push to end)
   - Use `localeCompare()` for strings
   - Use `.getTime()` for dates

---

## Subtasks

### Subtask 1: Create DashboardSort Component
**Token Estimate**: 6K tokens

**Description**: Create new component `components/dashboard-sort.tsx` following the pattern established by `dashboard-filters.tsx`. Component should render as dropdown on mobile and button group on desktop, with proper TypeScript types and active state highlighting.

**Acceptance Criteria**:
- [ ] Component file created with TypeScript types
- [ ] Mobile view: `<Select>` dropdown with label "Sort by"
- [ ] Desktop view: Button group with 6 sort options
- [ ] Props interface: `activeSort: SortOption`, `onSortChange: (sort: SortOption) => void`
- [ ] Active sort option highlighted (default variant on desktop, selected in dropdown)
- [ ] Follows same mobile/desktop breakpoint pattern as filters (`md:hidden` / `hidden md:flex`)
- [ ] Sort options: Urgency, Name, Deadline, Status, Category, Strategy
- [ ] Clean, readable code with proper spacing and formatting

**Implementation Notes**:
- Copy pattern from `dashboard-filters.tsx` (lines 1-66)
- Replace filter-specific logic with sort-specific logic
- Use same shadcn components: `Button`, `Select`, `Label`
- Define `SortOption` type in same file (will move to shared types later if needed)

**Testing**: Unit tests in Subtask 3

---

### Subtask 2: Update DashboardClient with Dynamic Sort Logic
**Token Estimate**: 5K tokens

**Description**: Update `components/dashboard-client.tsx` to add sort state management and replace hardcoded urgency sort (lines 43-74) with dynamic sorting based on user selection. Integrate new `DashboardSort` component into dashboard UI.

**Acceptance Criteria**:
- [ ] Import `DashboardSort` component
- [ ] Add state: `const [sortBy, setSortBy] = useState<SortOption>("urgency")`
- [ ] Define `SortOption` type (same as in DashboardSort)
- [ ] Replace lines 43-74 with switch statement for dynamic sorting
- [ ] Implement 6 sort comparators (urgency, name, deadline, status, category, strategy)
- [ ] Handle null values in all comparators (push to end)
- [ ] Use `localeCompare()` for string comparisons (name)
- [ ] Use `.getTime()` for date comparisons (deadline)
- [ ] Map status/category/strategy to logical orderings
- [ ] Preserve existing urgency sort logic for "urgency" option
- [ ] Render `<DashboardSort>` component alongside `<DashboardFilters>`
- [ ] Sort happens after filter (order: fetch → filter → sort → display)
- [ ] No mutation of original array (use spread operator)

**Sort Order Specifications**:
- **Urgency**: red → yellow → green → none, then by deadline (existing logic)
- **Name**: A-Z alphabetical, case-insensitive, nulls last
- **Deadline**: Soonest first (ascending date), nulls last
- **Status**: NOT_STARTED → IN_PROGRESS → SUBMITTED → WAITLISTED → ACCEPTED → DECLINED
- **Category**: SAFETY → MATCH → REACH
- **Strategy**: ED → EA → RD

**Implementation Notes**:
- Extract sort logic into separate function for testability
- Consider creating helper comparator functions
- Ensure filter state (`filter`) and sort state (`sortBy`) are independent

**Testing**: Unit and integration tests in Subtask 3

---

### Subtask 3: Write Unit and Integration Tests
**Token Estimate**: 6K tokens

**Description**: Write comprehensive unit tests for `DashboardSort` component and update existing `dashboard-client.test.tsx` with sort functionality tests. Cover all sort options, null handling, filter+sort interaction, and edge cases.

**Acceptance Criteria**:
- [ ] Create `components/__tests__/dashboard-sort.test.tsx`
- [ ] Test: Component renders with all sort options
- [ ] Test: Clicking sort option calls `onSortChange` with correct value
- [ ] Test: Active sort is visually highlighted
- [ ] Test: Mobile dropdown shows correct selected value
- [ ] Update `components/__tests__/dashboard-client.test.tsx`
- [ ] Test: Sort by name (alphabetical, case-insensitive)
- [ ] Test: Sort by name with null values (nulls appear last)
- [ ] Test: Sort by deadline (soonest first, nulls last)
- [ ] Test: Sort by status (progression order)
- [ ] Test: Sort by urgency (multi-level with deadline tiebreaker)
- [ ] Test: Sort by category (SAFETY → MATCH → REACH)
- [ ] Test: Sort by strategy (ED → EA → RD)
- [ ] Test: Sort respects active filter (integration test)
- [ ] Test: Changing filter preserves sort selection (integration test)
- [ ] Test: Sort with empty colleges array (no errors)
- [ ] Test: Default sort is "urgency"
- [ ] All tests pass with ≥90% coverage

**Test Data Requirements**:
- Colleges with various names (including mixed case: "Yale", "harvard", "MIT")
- Colleges with null deadlines
- Colleges with different urgency levels
- Colleges with all status types
- Colleges with all categories and strategies

**Implementation Notes**:
- Mock `getUrgencyLevel` from `lib/utils` if needed
- Use `jest.fn()` for callback mocks
- Verify array order using `.map(c => c.name)` or similar
- Test filter+sort interaction by simulating filter change, verifying sort preserved

**Testing**: Self-validating (tests test themselves)

---

### Subtask 4: Write E2E Tests
**Token Estimate**: 3K tokens

**Description**: Write Playwright E2E tests for complete sort workflows including mobile/desktop rendering, sort option selection, filter+sort interaction, and page refresh behavior.

**Acceptance Criteria**:
- [ ] Create `e2e/dashboard-sort.spec.ts`
- [ ] Test: Sort control appears on dashboard
- [ ] Test: Desktop renders button group, mobile renders dropdown
- [ ] Test: Clicking "Sort by Name" reorders colleges alphabetically
- [ ] Test: Clicking "Sort by Deadline" reorders by deadline (soonest first)
- [ ] Test: Clicking "Sort by Status" reorders by status progression
- [ ] Test: Active sort option is visually highlighted
- [ ] Test: Filter then sort workflow (filter to "In Progress", sort by name, verify correct order)
- [ ] Test: Sort then filter workflow (sort by name, filter, verify sort preserved)
- [ ] Test: Page refresh resets sort to default (urgency)
- [ ] All E2E tests pass in chromium, firefox, webkit

**Implementation Notes**:
- Use existing `login` helper from `e2e/helpers.ts`
- Create test colleges with known names/deadlines for verification
- Use `.locator('[data-testid]')` or `.getByRole()` for stable selectors
- Verify order by checking text content order in college cards
- Test both desktop and mobile viewports if feasible

**Testing**: Run with `npm run test:e2e`

---

### Subtask 5: QA Validation and Documentation
**Token Estimate**: 4K tokens

**Description**: Perform comprehensive QA validation across acceptance criteria, verify test coverage, run linters, conduct manual testing on multiple browsers/devices, and update documentation if needed.

**Acceptance Criteria**:
- [ ] All 38 acceptance criteria verified (see main criteria list above)
- [ ] Test coverage report shows ≥90% for modified files
- [ ] `npm run lint` passes with no errors
- [ ] `npm test` passes all unit tests
- [ ] `npm run test:e2e` passes all E2E tests
- [ ] Manual testing: Sort works on Chrome, Firefox, Safari
- [ ] Manual testing: Sort works on mobile viewport (iPhone, Android)
- [ ] Manual testing: Sort + filter interaction works correctly
- [ ] Manual testing: Performance check (sorting feels instant, <5ms)
- [ ] No console errors or warnings in browser devtools
- [ ] Review CLAUDE.md: update if new patterns introduced (unlikely)
- [ ] No regressions: existing dashboard features still work

**QA Checklist**:
1. Smoke test: Dashboard loads, sort control visible
2. Functional: Click each sort option, verify correct order
3. Edge cases: Sort with no colleges, sort with filtered empty state
4. Integration: Filter + sort combinations work correctly
5. Visual: Active state clearly indicated, mobile/desktop layouts correct
6. Performance: Sort completes instantly (<5ms, no visible lag)
7. Accessibility: Keyboard navigation works, screen reader labels present
8. Cross-browser: Test on Chrome, Firefox, Safari (desktop + mobile)
9. Regression: Existing filter functionality unaffected

**Documentation Updates**:
- Update CLAUDE.md if new component patterns introduced (unlikely)
- Add code comments documenting sort options in `DashboardClient`

**Testing**: Manual validation + automated test results

---

## Token Budget Breakdown

| Subtask | Tokens | Description |
|---------|--------|-------------|
| Subtask 1 | 6K | DashboardSort component creation |
| Subtask 2 | 5K | DashboardClient sort logic update |
| Subtask 3 | 6K | Unit and integration tests |
| Subtask 4 | 3K | E2E tests |
| Subtask 5 | 4K | QA validation and documentation |
| **Subtotal** | **24K** | Total implementation tokens |
| Buffer (10%) | 2K | Unexpected complexity |
| **Total Budget** | **~26K** | Final estimate with buffer |

---

## Edge Cases and Considerations

### Data Validation
1. **Null deadline handling**: Colleges without `deadlineApp` sort to end of list
2. **Null string handling**: Colleges without name sort to end using `|| ""`
3. **Missing checklist**: Urgency defaults to "none" if checklist is null
4. **Case sensitivity**: Use `localeCompare()` for case-insensitive string sorting
5. **Date comparison**: Use `.getTime()` for safe date comparison, handle nulls separately

### Performance
1. **Dataset size**: Current 10-30 colleges, realistic max 100-200
2. **Sort complexity**: O(n log n) with JavaScript `.sort()` = ~1-2ms for 200 items
3. **Re-render**: Consider `useMemo` if sorting becomes expensive (not needed for v1)
4. **Filter interaction**: Sort happens after filter, on already-reduced array

### User Experience
1. **Default sort**: Use "Urgency" to preserve current smart sorting behavior
2. **Sort direction**: Ascending only for v1, add toggle in future if requested
3. **State persistence**: No persistence for v1 (acceptable), can add localStorage later (~2K tokens)
4. **Mobile UX**: Native-looking dropdown consistent with filters
5. **Desktop UX**: Button group with clear active state
6. **Empty states**: Sort control remains visible, no errors on empty array

### Security
- No security concerns (client-side sorting of already-fetched data)
- No XSS risk (no user input stored from sort state)
- Authorization handled by middleware (dashboard requires auth)

---

## Test Scenarios

### Unit Tests (Subtask 3)

1. **Sort by name (alphabetical)**:
   - Given: `[{name: "Yale"}, {name: "Harvard"}, {name: "MIT"}]`
   - When: sortBy="name"
   - Then: `[{name: "Harvard"}, {name: "MIT"}, {name: "Yale"}]`

2. **Sort by name (case-insensitive)**:
   - Given: `[{name: "yale"}, {name: "Harvard"}, {name: "mit"}]`
   - When: sortBy="name"
   - Then: `[{name: "Harvard"}, {name: "mit"}, {name: "yale"}]`

3. **Sort by deadline (soonest first)**:
   - Given: `[{deadlineApp: "2026-11-01"}, {deadlineApp: "2026-01-01"}]`
   - When: sortBy="deadline"
   - Then: `[{deadlineApp: "2026-01-01"}, {deadlineApp: "2026-11-01"}]`

4. **Sort by deadline (null handling)**:
   - Given: `[{deadlineApp: null}, {deadlineApp: "2026-05-01"}]`
   - When: sortBy="deadline"
   - Then: `[{deadlineApp: "2026-05-01"}, {deadlineApp: null}]`

5. **Sort by status (progression)**:
   - Given: `[{status: "SUBMITTED"}, {status: "NOT_STARTED"}, {status: "IN_PROGRESS"}]`
   - When: sortBy="status"
   - Then: `[{status: "NOT_STARTED"}, {status: "IN_PROGRESS"}, {status: "SUBMITTED"}]`

6. **Sort by urgency (multi-level)**:
   - Given: Colleges with red, yellow, green, none urgency
   - When: sortBy="urgency"
   - Then: Red first, then yellow, then green, then none
   - And: Within same urgency, sorted by deadline (soonest first)

7. **Sort by category**:
   - Given: `[{category: "REACH"}, {category: "SAFETY"}, {category: "MATCH"}]`
   - When: sortBy="category"
   - Then: `[{category: "SAFETY"}, {category: "MATCH"}, {category: "REACH"}]`

8. **Filter + sort interaction**:
   - Given: Dashboard with filter="IN_PROGRESS" and sortBy="name"
   - When: User changes filter to "all"
   - Then: Sort by name is preserved, all colleges shown sorted by name

### E2E Tests (Subtask 4)

9. **Complete sort workflow**:
   - Given: User on dashboard with 5 colleges
   - When: User clicks "Sort by Name"
   - Then: Colleges reorder alphabetically
   - When: User clicks "Sort by Deadline"
   - Then: Colleges reorder by deadline (soonest first)
   - When: User refreshes page
   - Then: Sort resets to default (Urgency)

10. **Filter then sort workflow**:
    - Given: User on dashboard
    - When: User filters to "In Progress" colleges
    - Then: Only in-progress colleges shown
    - When: User sorts by name
    - Then: In-progress colleges shown in alphabetical order
    - When: User clears filter
    - Then: All colleges shown in alphabetical order (sort preserved)

---

## References

### Codebase Files
- `components/dashboard-client.tsx` - Current hardcoded sort logic (lines 43-74)
- `components/dashboard-filters.tsx` - UX pattern to follow
- `components/__tests__/dashboard-client.test.tsx` - Existing test patterns
- `components/__tests__/dashboard-filters.test.tsx` - Component test patterns
- `e2e/college-crud.spec.ts` - E2E test patterns
- `lib/utils.ts` - Urgency calculation utilities
- `prisma/schema.prisma` - College model fields

### CLAUDE.md Sections
- Component Organization (dashboard components)
- Testing (Jest and Playwright setup)
- Urgency Calculation System (lib/utils.ts)
- Data Layer (College model)

### External Best Practices
- React 19 State Management: https://react.dev/learn/managing-state
- Array.prototype.sort() MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
- String.prototype.localeCompare() MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare

---

## Implementation Notes

### Sort Order Rationale

**Status Progression**: NOT_STARTED → IN_PROGRESS → SUBMITTED → WAITLISTED → ACCEPTED → DECLINED
- Represents application lifecycle from start to final outcome
- Most actionable statuses first (NOT_STARTED needs action)

**Category Order**: SAFETY → MATCH → REACH
- Ascending difficulty/selectivity
- Safety schools are most likely admits (lower anxiety)

**Strategy Order**: ED → EA → RD
- Chronological order by typical deadlines
- ED deadlines are earliest (Nov 1), RD latest (Jan 1)

### Future Enhancements (Out of Scope)

1. **Sort direction toggle**: Add ascending/descending toggle (+2K tokens)
2. **Persistent sort**: Save preference to localStorage (+2K tokens)
3. **URL parameters**: Sort state in URL for shareability (+10K tokens)
4. **Multi-field sort**: Secondary sort field selection (+5K tokens)
5. **Server-side sort**: Database-level sorting for large datasets (+15K tokens)

---

## Success Metrics

**Primary Metrics**:
- All 38 acceptance criteria met
- Test coverage ≥90%
- All tests pass (unit, integration, E2E)
- Zero linter errors
- Performance <5ms for 100 colleges

**Quality Metrics**:
- No console errors in production build
- No regression in existing features
- Clean, maintainable code following established patterns
- Comprehensive test coverage for edge cases

**User Experience Metrics**:
- Sort controls easy to find and use
- Active sort clearly indicated
- Sorting feels instant (no perceived lag)
- Mobile and desktop UX consistent with filters

---

## Next Steps

1. **Implementation**: Use `/implement-feature` skill with TDD approach
2. **Validation**: Use `/validate-quality` skill for QA checks
3. **Code Review**: Use `/code-review` skill for comprehensive review
4. **Deployment**: Merge to main after all checks pass

---

**Ready for Implementation**: This ticket is fully specified and ready for the `/implement-feature` skill.
