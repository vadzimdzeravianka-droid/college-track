# Ticket T00003: Bulk Actions for College Management

**Status**: READY
**Complexity**: MEDIUM
**Token Budget**: ~22,000 tokens
**Created**: 2026-04-03

## Overview

Add multi-select capability to the college dashboard with bulk actions to delete multiple colleges or update their status simultaneously. This enables efficient batch management, especially for test data cleanup and mass status updates.

## Acceptance Criteria

- [ ] Each college card displays a checkbox (top-right corner)
- [ ] Clicking checkbox selects/deselects the college
- [ ] Floating toolbar appears at bottom when ≥1 college is selected
- [ ] Toolbar shows: "X selected", "Select All", "Delete", "Update Status" dropdown, "Clear Selection"
- [ ] "Delete" button shows confirmation dialog with count before executing
- [ ] "Update Status" dropdown allows selecting target status (all valid statuses)
- [ ] Bulk delete successfully removes all selected colleges in single transaction
- [ ] Bulk status update successfully updates all selected colleges in single transaction
- [ ] If any operation fails, entire transaction rolls back (no partial state)
- [ ] Success toast shows count of affected colleges
- [ ] Selection clears after successful bulk action
- [ ] Selection clears when filter changes
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors

## Technical Context

### Affected Files
- `components/dashboard-client.tsx` - Add selection state and toolbar integration
- `components/college-card.tsx` - Add checkbox to each card
- `components/bulk-actions-toolbar.tsx` - NEW: Component for bulk action UI
- `actions/college.ts` - NEW: Add `bulkDeleteColleges()` and `bulkUpdateStatus()` server actions
- `e2e/bulk-actions.spec.ts` - NEW: E2E tests for bulk operations

### Implementation Approach

**Client State with Optimistic UI**:
1. Add selection state to `DashboardClient` using `useState<Set<string>>`
2. Render checkboxes on college cards
3. Show floating toolbar when `selectedIds.size > 0`
4. Server actions wrap operations in `prisma.$transaction()` for atomicity
5. Clear selection on successful action or filter change

### Key Technical Patterns

**Server Actions** (in `actions/college.ts`):
```typescript
export async function bulkDeleteColleges(ids: string[]) {
  "use server";
  const userId = await requireAuth();

  // Verify ownership and delete in transaction
  await prisma.$transaction(
    ids.map(id => prisma.college.deleteMany({
      where: { id, userId }
    }))
  );

  revalidatePath("/dashboard");
  return { success: true, count: ids.length };
}

export async function bulkUpdateStatus(ids: string[], status: Status) {
  "use server";
  const userId = await requireAuth();

  // Verify ownership and update in batch
  const result = await prisma.college.updateMany({
    where: { id: { in: ids }, userId },
    data: { status }
  });

  revalidatePath("/dashboard");
  return { success: true, count: result.count };
}
```

**Component Structure**:
- `BulkActionsToolbar`: Fixed positioned at bottom, slides up with animation
- Uses shadcn/ui components: `Checkbox`, `Dialog`, `Button`, `Select`
- Status dropdown reuses `StatusBadge` styling for consistency
- Confirmation dialog for destructive delete actions

### Security & Data Isolation

- All bulk actions call `requireAuth()` to get current userId
- All Prisma queries filter by `userId` to ensure data isolation
- No user can bulk operate on another user's colleges
- Transaction rollback ensures atomic operations

### Edge Cases

1. **Empty selection**: Disable bulk action buttons when `selectedIds.size === 0`
2. **Filter changes**: Clear selection when filter changes (prevent confusion)
3. **Deleted colleges**: Handle gracefully if college deleted by another session
4. **Invalid IDs**: Server validates ownership before transaction
5. **Partial failures**: Prisma transaction rolls back all changes on any failure
6. **Large batches**: Acceptable performance up to 200 colleges (unlikely for single-user app)

## Subtasks

### Subtask 1: Server Actions - Bulk Operations (Token Budget: 4,000)

**Objective**: Implement `bulkDeleteColleges()` and `bulkUpdateStatus()` server actions with transaction safety and authorization.

**Files**:
- `actions/college.ts` (modify)

**Implementation**:
1. Add `bulkDeleteColleges(ids: string[])` function:
   - Call `requireAuth()` to get userId
   - Validate `ids.length > 0`
   - Use `prisma.$transaction()` with array of `deleteMany` queries
   - Each delete must filter by both `id` and `userId` for authorization
   - Revalidate `/dashboard` path
   - Return `{ success: true, count: ids.length }` or `{ success: false, error: string }`

2. Add `bulkUpdateStatus(ids: string[], status: Status)` function:
   - Call `requireAuth()` to get userId
   - Validate `ids.length > 0` and status is valid enum value
   - Use `prisma.college.updateMany()` with `where: { id: { in: ids }, userId }`
   - Revalidate `/dashboard` path
   - Return `{ success: true, count: result.count }` or error

3. Error handling:
   - Wrap in try-catch blocks
   - Return descriptive error messages
   - Log errors to console for debugging

**Tests**:
- Unit tests for both server actions
- Test authorization (verify userId filtering)
- Test transaction rollback on failure
- Test empty array handling
- Test invalid status enum
- Mock Prisma for controlled testing

**Acceptance**:
- [ ] `bulkDeleteColleges()` deletes multiple colleges in transaction
- [ ] `bulkUpdateStatus()` updates multiple college statuses
- [ ] Both actions verify userId authorization
- [ ] Transaction rollback on any failure
- [ ] Error handling with descriptive messages
- [ ] Unit tests pass with 90%+ coverage

---

### Subtask 2: Client State - Selection Management (Token Budget: 5,000)

**Objective**: Add selection state to `DashboardClient` and integrate checkbox UI into `CollegeCard`.

**Files**:
- `components/dashboard-client.tsx` (modify)
- `components/college-card.tsx` (modify)

**Implementation**:
1. In `DashboardClient`:
   - Add state: `const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())`
   - Add handler: `handleToggleSelect(id: string)` - toggle id in Set
   - Add handler: `handleSelectAll()` - select all visible filtered colleges
   - Add handler: `handleClearSelection()` - clear Set
   - Clear selection in `useEffect` when `filter` changes
   - Pass selection state and handlers to `CollegeCard` and toolbar

2. In `CollegeCard`:
   - Add `Checkbox` component in top-right corner (absolute positioned)
   - Add props: `isSelected: boolean`, `onToggleSelect: () => void`
   - Render checkbox with `checked={isSelected}` and `onCheckedChange={onToggleSelect}`
   - Stop event propagation on checkbox click to prevent card navigation
   - Style checkbox: visible on hover or when selected
   - Add visual indicator when card is selected (border color change)

3. Interaction:
   - Checkbox click toggles selection without navigating to detail page
   - Selected cards show distinct visual state (e.g., blue border)
   - Selection persists during sorting/filtering (only clears on filter change)

**Tests**:
- Test checkbox renders on college card
- Test selection state updates on checkbox toggle
- Test select all functionality
- Test clear selection
- Test selection clears when filter changes
- Test event propagation prevention

**Acceptance**:
- [ ] Checkbox renders in top-right of each college card
- [ ] Clicking checkbox toggles selection state
- [ ] Selected cards have visual indicator
- [ ] Checkbox click doesn't navigate to detail page
- [ ] Selection clears when filter changes
- [ ] Tests pass with 90%+ coverage

---

### Subtask 3: Bulk Actions Toolbar UI (Token Budget: 6,000)

**Objective**: Create `BulkActionsToolbar` component with delete, status update, and selection controls.

**Files**:
- `components/bulk-actions-toolbar.tsx` (new)

**Implementation**:
1. Create floating toolbar component:
   - Fixed position at bottom center of viewport
   - Slide-up animation (can use Framer Motion or CSS transitions)
   - Shows count: "X colleges selected"
   - Buttons: "Select All", "Clear Selection", "Delete", "Update Status"

2. Delete functionality:
   - "Delete" button opens confirmation dialog
   - Dialog shows: "Delete {count} colleges? This cannot be undone."
   - Cancel button closes dialog
   - Confirm button calls `bulkDeleteColleges(Array.from(selectedIds))`
   - Loading state during action execution
   - Toast notification on success/error
   - Clear selection on success

3. Status update functionality:
   - "Update Status" dropdown with all status options
   - Selecting status calls `bulkUpdateStatus(Array.from(selectedIds), status)`
   - Loading state during action execution
   - Toast notification: "{count} colleges updated to {status}"
   - Clear selection on success

4. Styling:
   - Use shadcn/ui components: `Button`, `Dialog`, `Select`
   - Status dropdown items use `StatusBadge` colors for consistency
   - Responsive design: stacks vertically on mobile
   - Backdrop blur effect for toolbar background
   - Z-index above other content

**Props**:
- `selectedIds: Set<string>`
- `onSelectAll: () => void`
- `onClearSelection: () => void`

**Tests**:
- Test toolbar renders when colleges selected
- Test delete confirmation dialog flow
- Test status update dropdown
- Test loading states
- Test toast notifications
- Test selection clearing after actions

**Acceptance**:
- [ ] Toolbar appears when ≥1 college selected
- [ ] Delete button opens confirmation dialog
- [ ] Status dropdown shows all valid statuses
- [ ] Actions execute and show loading states
- [ ] Toast notifications show success/error messages
- [ ] Selection clears after successful action
- [ ] Tests pass with 90%+ coverage

---

### Subtask 4: E2E Tests - Bulk Operations (Token Budget: 4,500)

**Objective**: Create comprehensive E2E tests for bulk actions using Playwright.

**Files**:
- `e2e/bulk-actions.spec.ts` (new)
- `e2e/helpers.ts` (modify - add bulk test helpers if needed)

**Implementation**:
1. Test bulk delete:
   - Create 3 test colleges
   - Navigate to dashboard
   - Select all 3 via checkboxes
   - Click "Delete" button
   - Verify confirmation dialog appears
   - Confirm deletion
   - Verify all 3 colleges removed from database
   - Verify toast shows "3 colleges deleted"

2. Test bulk status update:
   - Create 5 test colleges with status NOT_STARTED
   - Select 3 colleges
   - Update status to IN_PROGRESS via toolbar dropdown
   - Verify 3 colleges updated in database
   - Verify 2 unchanged
   - Verify toast shows "3 colleges updated to IN_PROGRESS"

3. Test select all:
   - Create 10 test colleges
   - Apply filter to show only 5
   - Click "Select All"
   - Verify 5 visible colleges selected
   - Change filter
   - Verify selection cleared

4. Test empty selection:
   - Verify toolbar hidden when no colleges selected
   - Select 2 colleges
   - Verify toolbar appears
   - Clear selection
   - Verify toolbar disappears

5. Test confirmation dialog cancel:
   - Select 2 colleges
   - Click "Delete"
   - Click "Cancel" in dialog
   - Verify no colleges deleted

6. Test visual states:
   - Verify checkboxes render on cards
   - Verify selected cards show visual indicator
   - Verify toolbar has correct count display

**Tests follow patterns**:
- Use `e2e/helpers.ts` for login and cleanup
- Each test is independent (no shared state)
- Clean up test data after each test
- Use descriptive test names and comments

**Acceptance**:
- [ ] E2E test for bulk delete passes
- [ ] E2E test for bulk status update passes
- [ ] E2E test for select all passes
- [ ] E2E test for empty selection states passes
- [ ] E2E test for confirmation dialog cancel passes
- [ ] All tests clean up data properly
- [ ] Tests run successfully in CI

---

### Subtask 5: Integration, Testing & Documentation (Token Budget: 2,500)

**Objective**: Integrate all components, ensure full test coverage, fix linting issues, and validate acceptance criteria.

**Files**:
- All modified files
- `CLAUDE.md` (update if needed)

**Implementation**:
1. Integration:
   - Ensure `DashboardClient` properly renders toolbar when selection active
   - Verify selection state flows correctly through all components
   - Test filter changes clear selection properly
   - Verify revalidation updates dashboard correctly

2. Testing:
   - Run full unit test suite: `npm test`
   - Run E2E test suite: `npm run test:e2e`
   - Verify coverage meets 90%+ threshold: `npm run test:coverage`
   - Fix any failing tests

3. Linting:
   - Run linter: `npm run lint`
   - Fix all linting errors and warnings
   - Ensure consistent code style

4. Manual QA:
   - Test all acceptance criteria manually
   - Test edge cases (empty lists, large selections, concurrent updates)
   - Test mobile responsive design
   - Test dark mode styling

5. Documentation:
   - Update `CLAUDE.md` if new patterns introduced
   - Add JSDoc comments to complex functions
   - Ensure code is self-documenting with clear variable names

**Acceptance**:
- [ ] All components integrated successfully
- [ ] Unit tests pass with 90%+ coverage
- [ ] E2E tests pass successfully
- [ ] No linting errors
- [ ] All acceptance criteria validated
- [ ] Manual QA complete

## Test Scenarios

### 1. Happy Path - Bulk Delete
**Steps**:
1. Create 3 test colleges
2. Navigate to dashboard
3. Select all 3 via checkboxes
4. Click "Delete" button
5. Confirm in dialog

**Expected**:
- All 3 colleges deleted from database
- Toast shows "3 colleges deleted"
- Selection cleared
- Dashboard updates to show empty state

---

### 2. Happy Path - Bulk Status Update
**Steps**:
1. Create 5 colleges with status NOT_STARTED
2. Select 3 colleges
3. Click "Update Status" → select "IN_PROGRESS"

**Expected**:
- 3 selected colleges updated to IN_PROGRESS
- 2 unselected colleges remain NOT_STARTED
- Toast shows "3 colleges updated to IN_PROGRESS"
- Selection cleared
- Dashboard updates with new statuses

---

### 3. Edge Case - Transaction Rollback
**Steps**:
1. Mock Prisma to fail on 2nd delete in transaction
2. Select 3 colleges
3. Click "Delete" and confirm

**Expected**:
- Error caught by server action
- No colleges deleted (transaction rolled back)
- Error toast shown
- Selection remains active

---

### 4. Edge Case - Empty Selection
**Steps**:
1. Navigate to dashboard with colleges
2. Verify no selection active

**Expected**:
- Toolbar not visible
- Checkboxes render but unchecked

**Steps cont**:
3. Select 2 colleges
4. Clear selection

**Expected**:
- Toolbar disappears
- Checkboxes unchecked

---

### 5. UX - Select All
**Steps**:
1. Create 10 colleges
2. Apply filter to show 5 (e.g., status = NOT_STARTED)
3. Click "Select All"

**Expected**:
- 5 visible colleges selected
- Toolbar shows "5 selected"

**Steps cont**:
4. Change filter to "all"

**Expected**:
- Selection cleared
- Toolbar disappears

---

### 6. UX - Confirmation Dialog
**Steps**:
1. Select 2 colleges
2. Click "Delete"

**Expected**:
- Dialog opens with text "Delete 2 colleges? This cannot be undone."

**Steps cont**:
3. Click "Cancel"

**Expected**:
- Dialog closes
- No colleges deleted
- Selection remains active

**Steps cont**:
4. Click "Delete" again
5. Click "Confirm"

**Expected**:
- 2 colleges deleted
- Toast shows "2 colleges deleted"
- Selection cleared

## Token Budget Breakdown

| Subtask | Token Budget | Focus Area |
|---------|-------------|------------|
| 1. Server Actions | 4,000 | Backend logic, transactions, auth |
| 2. Selection State | 5,000 | Client state, checkbox integration |
| 3. Toolbar UI | 6,000 | Component creation, dialogs, actions |
| 4. E2E Tests | 4,500 | Playwright tests, full workflows |
| 5. Integration & QA | 2,500 | Testing, linting, validation |
| **Total** | **22,000** | |

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All subtasks completed
- [ ] Unit tests pass with 90%+ coverage
- [ ] E2E tests pass successfully
- [ ] No linting errors
- [ ] Code reviewed (self-review or peer review)
- [ ] Manual QA completed
- [ ] Documentation updated (if needed)

## References

- Groomed requirement: `.claude/workflows/requirements/groomed/bulk-actions.md`
- CLAUDE.md: Server Actions Pattern, Multi-User Authorization
- Existing pattern: `components/status-actions.tsx` (status dropdown UI)
- Existing pattern: `actions/college.ts` (authorization and revalidation)
- shadcn/ui: `Checkbox`, `Dialog`, `Button`, `Select` components
- Prisma transactions: https://www.prisma.io/docs/concepts/components/prisma-client/transactions

## Notes

- Selection uses client-side `Set<string>` for O(1) lookups
- Selection clears on filter change to avoid confusion
- Transaction rollback ensures atomic operations (all-or-nothing)
- Authorization verified at server action level (userId filtering)
- Toast notifications provide clear feedback for all actions
- Responsive design: toolbar stacks vertically on mobile
