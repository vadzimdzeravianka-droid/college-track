# Requirement: Bulk Actions for College Management

## Original Request
Need bulk actions for colleges. Like selecting multiple colleges and updating their status all at once, or deleting them. Would be useful when cleaning up test data or doing batch updates.

## Groomed Specification

Add multi-select capability to the college dashboard with bulk actions: delete multiple colleges or update their status simultaneously. This enables efficient batch management, especially for test data cleanup and mass status updates.

**Complexity**: MEDIUM
**Token Budget**: ~22K tokens

### Context
- **Affected areas**:
  - `components/dashboard-client.tsx` - Add selection state and toolbar
  - `components/college-card.tsx` - Add checkbox to each card
  - `components/bulk-actions-toolbar.tsx` - New component for bulk action UI
  - `actions/college.ts` - Add `bulkDeleteColleges()` and `bulkUpdateStatus()` server actions
  - `lib/utils.ts` - Add selection state utilities (optional)
- **Dependencies**: None (use existing shadcn/ui checkbox component)
- **Related features**: Existing `deleteCollege()` and `updateCollegeStatus()` actions can be wrapped in transactions

### Implementation Approach

**Approach A: Client State with Optimistic UI**

Add selection state to `DashboardClient`, render checkboxes on cards, show floating toolbar when items selected. Server actions use Prisma transactions for atomic batch operations.

**Flow**:
1. User clicks checkbox on college cards → state updates `selectedIds: Set<string>`
2. When `selectedIds.size > 0`, show floating toolbar at bottom with action buttons
3. User clicks "Delete Selected" → confirmation dialog → `bulkDeleteColleges(Array.from(selectedIds))`
4. Server action wraps deletes in `prisma.$transaction()` → revalidate → UI updates

**Pros**:
- Simple client state management (useState)
- Atomic operations via Prisma transactions
- Familiar UX pattern (Gmail, Notion)
- Low token cost (~22K)

**Cons**:
- Selection state lost on filter change (acceptable for this use case)
- No persistent selection across page navigations

**Token Estimate**: ~22K tokens

**Approach B: URL State with Persistent Selection**

Store selected IDs in URL query params (`?selected=id1,id2`) for persistent selection across filter changes and navigation.

**Pros**:
- Selection persists across filter changes
- Shareable URLs with pre-selected items

**Cons**:
- More complex state management (~30K tokens)
- URL gets messy with many selections
- Over-engineered for stated use case

**Recommended**: Approach A - Client state is sufficient for batch cleanup workflows, and token efficiency is better.

### Edge Cases & Validation

#### Data Validation
- Empty selection: Disable bulk action buttons when `selectedIds.size === 0`
- Deleted colleges during selection: Handle cases where a college is deleted by another session (graceful failure)
- Invalid IDs: Server action validates all IDs exist before transaction

#### State Management
- Filter changes: Clear selection when filter changes (simplest UX)
- Select all: Add "Select All" checkbox in toolbar to select all visible colleges
- Partial failures: If bulk delete fails mid-transaction, Prisma transaction rolls back all changes

#### Security
- Authorization: Middleware already enforces authentication
- SQL injection: Prisma parameterizes queries automatically
- Rate limiting: Not needed (single-user app, authenticated)

#### Performance
- Small batches (<50): Direct transaction, completes in <1s
- Large batches (50-200): Still acceptable with Prisma batch operations
- Edge case (>200): Unlikely for this app, but transaction may timeout (acceptable)

#### User Experience
- Confirmation dialog for destructive actions (delete) with count: "Delete 5 colleges?"
- No confirmation for status updates (non-destructive)
- Toast notifications: "5 colleges deleted" or "3 colleges updated to SUBMITTED"
- Loading states: Disable toolbar buttons during action execution

### Acceptance Criteria

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

### Test Scenarios

1. **Happy path - Bulk delete**:
   - Create 3 colleges
   - Select all 3 via checkboxes
   - Click "Delete" → confirm dialog → execute
   - Verify all 3 deleted from database
   - Verify toast shows "3 colleges deleted"

2. **Happy path - Bulk status update**:
   - Create 5 colleges with status NOT_STARTED
   - Select 3 colleges
   - Change status to IN_PROGRESS via toolbar dropdown
   - Verify 3 colleges updated, 2 unchanged
   - Verify toast shows "3 colleges updated to IN_PROGRESS"

3. **Edge case - Transaction rollback**:
   - Mock Prisma to fail on 2nd delete in transaction
   - Select 3 colleges and delete
   - Verify no colleges deleted (transaction rolled back)
   - Verify error toast shown

4. **Edge case - Empty selection**:
   - Verify toolbar hidden when no colleges selected
   - Select 2 colleges → toolbar appears
   - Clear selection → toolbar disappears

5. **UX - Select all**:
   - Dashboard has 10 colleges, filter shows 5
   - Click "Select All" → verify 5 visible colleges selected
   - Change filter → verify selection cleared

6. **UX - Confirmation dialog**:
   - Select 2 colleges
   - Click "Delete" → verify dialog shows "Delete 2 colleges?"
   - Click "Cancel" → verify no colleges deleted
   - Click "Delete" again → confirm → verify 2 colleges deleted

### Technical Implementation Notes

**Server Actions** (`actions/college.ts`):
```typescript
export async function bulkDeleteColleges(ids: string[]) {
  "use server";

  if (!ids.length) return { success: false, error: "No colleges selected" };

  try {
    await prisma.$transaction(
      ids.map(id => prisma.college.delete({ where: { id } }))
    );
    revalidatePath("/dashboard");
    return { success: true, count: ids.length };
  } catch (error) {
    return { success: false, error: "Failed to delete colleges" };
  }
}

export async function bulkUpdateStatus(ids: string[], status: Status) {
  "use server";

  if (!ids.length) return { success: false, error: "No colleges selected" };

  try {
    await prisma.college.updateMany({
      where: { id: { in: ids } },
      data: { status }
    });
    revalidatePath("/dashboard");
    return { success: true, count: ids.length };
  } catch (error) {
    return { success: false, error: "Failed to update colleges" };
  }
}
```

**Component Structure**:
- `BulkActionsToolbar` renders as fixed positioned element at bottom
- Uses Framer Motion for slide-up animation
- Status dropdown uses existing `StatusBadge` component styling for consistency

### References
- CLAUDE.md: Server Actions Pattern (`actions/college.ts`)
- CLAUDE.md: Form validation with Zod (apply to bulk action inputs)
- Existing pattern: `components/status-actions.tsx` (status dropdown UI)
- shadcn/ui: `Checkbox`, `Dialog`, `DropdownMenu` components
