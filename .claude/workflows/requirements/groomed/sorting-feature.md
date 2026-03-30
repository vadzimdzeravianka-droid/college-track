# Requirement: College Dashboard Sorting Feature

## Original Request

I want to sort colleges on the dashboard. By name, by deadline, by status - whatever makes sense. Users should be able to pick what they want to sort by.

## Enriched Requirement

Add user-controllable sorting to the college dashboard that allows users to organize their college list by various fields including name, deadline, status, and urgency. The sorting UI should follow the existing dashboard filter pattern (mobile dropdown, desktop button group) and replace the current hardcoded urgency-based sort with user choice.

### Context

- **Affected areas**:
  - `components/dashboard-client.tsx` - Add sort state and update existing sort logic (lines 43-74)
  - `components/dashboard-sort.tsx` - New component for sort controls (mirrors dashboard-filters.tsx)
  - `components/ui/select.tsx` - Existing shadcn component (reuse)
  - `components/ui/button.tsx` - Existing shadcn component (reuse)

- **Dependencies**: None (uses existing shadcn/ui components)

- **Related features**:
  - Dashboard filters (status filtering) - should work together with sorting
  - Urgency calculation system (lib/utils.ts) - currently drives default sort
  - College card display (components/college-card.tsx) - visual urgency indicators

- **Current behavior**: Dashboard hardcodes sort by urgency level (red → yellow → green) with deadline as tiebreaker. This provides smart default behavior but gives users no control.

## Implementation Approaches

### Approach A: Client-Side State with Simple Dropdown

**Description**: Add sort control component that updates local state in `DashboardClient`. Replace hardcoded sort logic with switch statement that respects user's selection. Keep urgency as one of the sortable options.

**How it works**:
1. Add `sortBy` state variable (type: `SortOption`) to `DashboardClient`
2. Create `<DashboardSort>` component with same mobile/desktop pattern as filters
3. Replace lines 43-74 in dashboard-client.tsx with dynamic sort logic
4. Sort options: Urgency (default), Name, Deadline, Status, Category, Strategy
5. Handle null values (push to end for dates/strings)
6. Use `localeCompare` for case-insensitive string sorting

**Pros**:
- Minimal token usage (~15K)
- Follows established dashboard-filters.tsx pattern
- No architecture changes
- Simple to test and maintain
- Preserves smart urgency-based sort as an option

**Cons**:
- Sort preference not persistent across refreshes
- Cannot share sorted view via URL
- Single-field sort only (no ascending/descending toggle)
- All sorting happens on client (fine for <100 colleges)

**Token Estimate**: ~15K tokens

### Approach B: URL Search Params with Next.js Integration

**Description**: Implement sorting using URL search parameters (`?sort=deadline&order=asc`) with Next.js 15's `useSearchParams` hook. Sort state persists in URL, making it shareable and bookmark-able.

**How it works**:
1. Read `sort` and `order` params from URL using `useSearchParams`
2. Create `<DashboardSort>` component that updates URL via `useRouter`
3. Update sort logic to read from URL params with fallback defaults
4. Browser back/forward navigation automatically restores sort state
5. Search params format: `?sort=name&order=asc` or `?sort=deadline&order=desc`

**Pros**:
- Sort persists across page refreshes
- Users can share sorted views
- Professional data table UX
- Browser history integration
- No localStorage needed

**Cons**:
- More complex implementation (~28K tokens)
- Requires router integration
- May need dashboard page restructuring
- More edge cases to test

**Token Estimate**: ~28K tokens

### Approach C: Hybrid with Server Action Support

**Description**: Add server-side sorting via modified `getColleges(sortBy?, sortOrder?)` server action. Prisma handles database-level sorting for simple fields, client-side for calculated fields (urgency).

**How it works**:
1. Add optional parameters to `getColleges()` server action
2. Map sort fields to Prisma `orderBy` clauses
3. Use URL search params to pass sort state to server
4. Server sorts at database level, client sorts urgency (calculated field)
5. Hybrid approach: simple sorts on server, complex on client

**Pros**:
- Scales to 1000+ colleges
- Database-optimized sorting
- Supports future pagination
- URL persistence (like Approach B)
- Most extensible solution

**Cons**:
- Highest complexity (~42K tokens)
- Changes server action signature
- Over-engineered for current dataset (10-30 colleges)
- Most testing burden
- Type safety coordination client/server

**Token Estimate**: ~42K tokens

**Recommended**: **Approach A** - Client-side state with simple dropdown

**Reasoning**:
- Right-sized for problem (10-30 colleges)
- Lowest risk, fastest delivery
- Follows existing UX patterns
- Can upgrade to Approach B later if URL persistence becomes critical
- Performance is excellent for current dataset size

## Edge Cases & Considerations

### Data Validation

1. **Null deadline handling**:
   - Colleges without `deadlineApp` should sort to end of list
   - Compare: `if (!a.deadlineApp) return 1; if (!b.deadlineApp) return -1;`

2. **Null string handling**:
   - Colleges without name/location/major: sort to end
   - Use `|| ""` fallback in `localeCompare`

3. **Missing checklist**:
   - Urgency calculation requires checklist
   - Default to urgency="none" if checklist is null

4. **Case-insensitive string sorting**:
   - Use `localeCompare()` instead of simple `<` `>` comparison
   - Provides locale-aware, case-insensitive sorting

5. **Date object comparison**:
   - Dates from Prisma are Date objects, safe to use `.getTime()`
   - Handle null dates separately before comparison

### Security

- No security concerns (client-side sorting of already-fetched data)
- No XSS risk (no user input stored or displayed from sort state)
- Authorization handled by middleware (dashboard requires auth)

### Performance

1. **Dataset size**: Current: 10-30 colleges, realistic max: 100-200
2. **Sort complexity**: O(n log n) with JavaScript `.sort()`
3. **Performance impact**: Negligible for <200 items (~1-2ms)
4. **Re-render optimization**: Consider `useMemo` if sorting becomes expensive
5. **Filter interaction**: Sort happens after filter, on already-reduced array

### User Experience

1. **Sort direction**: Start with ascending only, add toggle in future if requested
2. **Default sort**: Use "Urgency" (current behavior) as default to preserve smart sorting
3. **Visual feedback**:
   - Highlight active sort option in button group/dropdown
   - Consider adding sort direction indicator (↑↓) in future
4. **Mobile UX**: Use native-looking `<Select>` dropdown (existing pattern)
5. **Desktop UX**: Use button group with active state (existing pattern)

6. **Filter + sort interaction**:
   - Sorting should respect current filter
   - Changing filter should preserve sort selection
   - Order: fetch → filter → sort → display

7. **Empty states**:
   - If no colleges match filter, show empty state (existing)
   - Sort control should remain visible

### State Management

1. **Local state**: Use `useState` in `DashboardClient` component
2. **State structure**: Simple string enum, e.g., `type SortOption = "urgency" | "name" | "deadline" | "status" | "category" | "strategy"`
3. **No persistence**: Accept that sort resets on refresh (can add localStorage in future for ~2K tokens)
4. **Integration with filters**: Both `filter` and `sortBy` live in same component state
5. **Derived state**: Sorted array is computed during render, not stored in state

## Acceptance Criteria

### Functional Requirements

- [ ] Sort control appears on dashboard below/alongside filter controls
- [ ] Mobile: sort control renders as dropdown (Select component)
- [ ] Desktop: sort control renders as button group (Button components)
- [ ] Sort options include: Urgency (default), Name, Deadline, Status, Category, Strategy
- [ ] Selecting "Name" sorts colleges alphabetically (A-Z, case-insensitive)
- [ ] Selecting "Deadline" sorts colleges by application deadline (soonest first)
- [ ] Selecting "Status" sorts colleges by status progression (NOT_STARTED → DECLINED)
- [ ] Selecting "Urgency" sorts colleges by urgency level (red → yellow → green → none), then by deadline
- [ ] Selecting "Category" sorts colleges by category (SAFETY → MATCH → REACH)
- [ ] Selecting "Strategy" sorts colleges by strategy (ED → EA → RD)
- [ ] Colleges with null deadlines appear at end of list when sorting by deadline
- [ ] Colleges with null/empty strings appear at end when sorting by name/location
- [ ] Sort respects active filter (sorts only filtered colleges)
- [ ] Changing filter preserves sort selection
- [ ] Active sort option is visually indicated (highlighted button or selected in dropdown)

### Technical Requirements

- [ ] Sort logic is extracted into testable functions
- [ ] No mutations of original colleges array (use spread operator or .slice())
- [ ] Case-insensitive string sorting uses `localeCompare()`
- [ ] Null/undefined values are handled explicitly in all sort comparators
- [ ] TypeScript types are defined for SortOption enum
- [ ] Component follows existing dashboard-filters.tsx pattern

### Quality Requirements

- [ ] All unit tests pass with 90%+ coverage
- [ ] Integration tests verify sort + filter interaction
- [ ] E2E test verifies sort control functionality
- [ ] No linter errors or warnings
- [ ] No console errors in browser
- [ ] Performance: sorting completes in <5ms for 100 colleges

### Documentation

- [ ] Add comment documenting sort options in DashboardClient
- [ ] Update CLAUDE.md if new patterns introduced (unlikely)

## Test Scenarios

### Unit Tests

1. **Sort by name (ascending)**:
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

5. **Sort by status**:
   - Given: `[{status: "SUBMITTED"}, {status: "NOT_STARTED"}, {status: "IN_PROGRESS"}]`
   - When: sortBy="status"
   - Then: `[{status: "NOT_STARTED"}, {status: "IN_PROGRESS"}, {status: "SUBMITTED"}]`

6. **Sort by urgency (multi-level)**:
   - Given: Colleges with different urgency levels and deadlines
   - When: sortBy="urgency"
   - Then: Red colleges first, then yellow, then green, then none
   - And: Within same urgency, sorted by deadline (soonest first)

7. **Sort by category**:
   - Given: `[{category: "REACH"}, {category: "SAFETY"}, {category: "MATCH"}]`
   - When: sortBy="category"
   - Then: `[{category: "SAFETY"}, {category: "MATCH"}, {category: "REACH"}]`

### Integration Tests

8. **Sort + filter interaction**:
   - Given: Dashboard with filter="IN_PROGRESS" and sortBy="name"
   - When: User changes filter to "all"
   - Then: Sort by name is preserved, all colleges shown sorted by name

9. **Sort with no colleges**:
   - Given: Dashboard with no colleges
   - When: User selects sort option
   - Then: Empty state displayed, no errors

10. **Sort control visibility**:
    - Given: Dashboard on mobile viewport
    - When: Page loads
    - Then: Sort control appears as dropdown
    - When: Viewport changes to desktop
    - Then: Sort control appears as button group

### E2E Tests

11. **Complete sort workflow**:
    - Given: User on dashboard with 5 colleges
    - When: User clicks "Sort by Name"
    - Then: Colleges reorder alphabetically
    - When: User clicks "Sort by Deadline"
    - Then: Colleges reorder by deadline (soonest first)
    - When: User refreshes page
    - Then: Sort resets to default (Urgency)

12. **Filter then sort workflow**:
    - Given: User on dashboard
    - When: User filters to "In Progress" colleges
    - Then: Only in-progress colleges shown
    - When: User sorts by name
    - Then: In-progress colleges shown in alphabetical order
    - When: User clears filter
    - Then: All colleges shown in alphabetical order (sort preserved)

## Token Budget Estimate

### Implementation Tokens

- **DashboardSort component**: 5K tokens
  - Mobile dropdown UI (1K)
  - Desktop button group UI (1K)
  - Props interface and types (0.5K)
  - Event handlers (0.5K)
  - Styling (1K)
  - Component integration (1K)

- **Sort logic in DashboardClient**: 4K tokens
  - Sort function with switch statement (1.5K)
  - Comparator functions for each field (1.5K)
  - Type definitions (0.5K)
  - State management integration (0.5K)

- **Utility functions**: 1K tokens
  - String comparison helper (0.3K)
  - Date comparison helper (0.3K)
  - Null handling utilities (0.4K)

**Subtotal Implementation**: 10K tokens

### Testing Tokens

- **Unit tests**: 4K tokens
  - Sort function tests (7 test cases) (2K)
  - Comparator function tests (1K)
  - Edge case tests (null handling, empty arrays) (1K)

- **Integration tests**: 2K tokens
  - Filter + sort interaction (1K)
  - Component rendering tests (1K)

- **E2E tests**: 2K tokens
  - Complete sort workflow (1K)
  - Filter + sort workflow (1K)

**Subtotal Testing**: 8K tokens

### QA & Documentation

- **QA validation**: 3K tokens
  - Manual testing checklist
  - Acceptance criteria verification
  - Cross-browser testing

- **Documentation**: 1K tokens
  - Code comments
  - Update CLAUDE.md if needed

**Subtotal QA**: 4K tokens

### Total Token Budget

- **Implementation**: 10K tokens
- **Testing**: 8K tokens
- **QA**: 4K tokens
- **Buffer (10%)**: 2K tokens
- **Total**: ~24K tokens

**Note**: This budget assumes Approach A (client-side sorting). Approach B would be ~35K tokens, Approach C would be ~50K tokens.

## References

### CLAUDE.md Sections
- Component Organization (components/dashboard-client.tsx, components/dashboard-filters.tsx)
- Data Layer (College model, Prisma schema)
- Urgency Calculation System (lib/utils.ts)

### Codebase Files
- `components/dashboard-client.tsx` - Current hardcoded sort logic (lines 43-74)
- `components/dashboard-filters.tsx` - UX pattern to follow
- `components/college-card.tsx` - Display component (not modified)
- `actions/college.ts` - Server action for fetching colleges
- `lib/utils.ts` - Urgency calculation utilities
- `prisma/schema.prisma` - College model fields

### External Best Practices
- React 19 State Management: https://react.dev/learn/managing-state
- Next.js 15 Data Fetching: https://nextjs.org/docs/app/getting-started/fetching-data
- Array.prototype.sort() MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
- String.prototype.localeCompare() MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare

### Similar Features
- Dashboard status filters (components/dashboard-filters.tsx) - Direct pattern to follow
- Status actions dropdown (components/status-actions.tsx) - Dropdown UX reference
- Urgency-based smart sorting (existing in dashboard-client.tsx) - Current behavior to preserve as option

---

## Next Steps

Once this requirement is approved:

1. Create implementation ticket using `/create-ticket` skill
2. Ticket will include subtasks for:
   - Create DashboardSort component
   - Update DashboardClient sort logic
   - Add unit tests for sort functions
   - Add integration tests for filter + sort
   - Add E2E test for sort workflow
   - QA validation checklist
3. Move to `.claude/workflows/tickets/ready/` for implementation
4. Use `/implement-feature` skill to execute with TDD approach
