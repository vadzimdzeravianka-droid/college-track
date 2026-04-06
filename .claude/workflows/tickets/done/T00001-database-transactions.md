# Ticket: T00001 - Database Transactions for Data Integrity

**Status**: READY
**Priority**: HIGH
**Complexity**: MEDIUM
**Token Budget**: ~28K tokens
**Created**: 2026-04-03

---

## Overview

Implement Prisma transaction protection for all mutation operations in `actions/college.ts` to ensure atomic database operations and prevent data inconsistency under error conditions or concurrent access. The `updateChecklist` function currently performs 3-4 separate database operations without transaction protection, creating a data integrity risk where checklist updates can succeed while status updates fail, leaving the database in an inconsistent state.

## Problem Statement

The current implementation performs sequential database operations without atomicity guarantees:

1. **updateChecklist** (4 operations):
   - Read college with checklist
   - Update/create checklist
   - Calculate new status
   - Update college status (if this fails, checklist is already changed)

2. **updateCollege** (2 operations):
   - Update college via updateMany
   - Re-fetch college for return value

3. **updateCollegeStatus** (2 operations):
   - Update status via updateMany
   - Re-fetch college for return value

**Risk Scenarios**:
- Network timeout between operations leaves partial updates
- Database errors after first operation cause inconsistent state
- Race conditions in multi-user environment (read-modify-write pattern)
- Auto-status progression logic compounds the risk

## Requirements

- Wrap all mutation functions in `db.$transaction()`
- Use transaction client (`tx`) for all operations within transaction
- Preserve existing error messages and API signatures
- Add unit tests for transaction rollback scenarios
- Ensure no performance regression (< 50ms increase)

## Acceptance Criteria

- [ ] `updateChecklist` wrapped in `db.$transaction()`
- [ ] `updateCollege` wrapped in `db.$transaction()`
- [ ] `updateCollegeStatus` wrapped in `db.$transaction()`
- [ ] `deleteCollege` wrapped in `db.$transaction()` (if needed)
- [ ] All transaction operations use `tx` client instead of `db`
- [ ] Test: Simulate DB error mid-transaction → verify full rollback
- [ ] Test: Concurrent updates → verify no race conditions
- [ ] Test: Transaction timeout (mock slow operation) → verify rollback
- [ ] No breaking changes to API signatures
- [ ] All existing tests still pass
- [ ] Test coverage ≥90%
- [ ] No linter errors
- [ ] Response time increase <50ms (performance regression check)

---

## Affected Files

### Primary Files
- `actions/college.ts` - All mutation functions (updateChecklist, updateCollege, updateCollegeStatus, deleteCollege)
- `actions/__tests__/college.test.ts` - Add transaction rollback tests

### Related Context
- `prisma/schema.prisma` - Database schema (PostgreSQL, ACID-compliant)
- `lib/db.ts` - Prisma client instance
- CLAUDE.md - Server Actions Pattern documentation

---

## Implementation Approach

**Recommended**: Approach A - Wrap Each Function in Separate Transactions

Wrap each vulnerable function individually with `db.$transaction()` for simplicity and clarity.

**Rationale**:
- Simple, surgical fix
- Each function encapsulates its own atomicity
- Easy to test rollback per function
- Follows single-responsibility principle
- More explicit than wrapper utility (easier to understand)

**Example Pattern** (updateChecklist):
```typescript
export async function updateChecklist(collegeId: string, values: Partial<z.infer<typeof ChecklistSchema>>) {
  const userId = await requireAuth();

  return await db.$transaction(async (tx) => {
    // Use tx instead of db for all operations
    const college = await tx.college.findFirst({
      where: { id: collegeId, userId },
      include: { checklist: true },
    });

    if (!college) throw new Error("College not found");

    let updatedChecklist;
    if (college.checklist) {
      updatedChecklist = await tx.checklist.update({
        where: { collegeId },
        data: values,
      });
    } else {
      updatedChecklist = await tx.checklist.create({
        data: { collegeId, ...values },
      });
    }

    const newStatus = calculateNewStatus(updatedChecklist);

    if (newStatus !== college.status) {
      await tx.college.update({
        where: { id: collegeId },
        data: { status: newStatus },
      });
    }

    return updatedChecklist;
  });
}
```

---

## Subtasks

### Subtask 1: Wrap `updateChecklist` in Transaction (8K tokens)

**Goal**: Add transaction protection to the most critical function with auto-status progression logic.

**Implementation**:
1. Read existing `updateChecklist` implementation
2. Wrap entire function body in `db.$transaction(async (tx) => { ... })`
3. Replace all `db.college.*` calls with `tx.college.*`
4. Replace all `db.checklist.*` calls with `tx.checklist.*`
5. Ensure error handling preserves existing error messages
6. Keep `requireAuth()` call outside transaction (auth check before DB operations)
7. Keep `revalidatePath()` calls outside transaction (side effects after commit)

**Changes**:
- `actions/college.ts:188-253` - updateChecklist function

**Test Cases**:
- Happy path: Checklist update + status update both succeed
- Rollback: Mock DB error during status update → verify checklist NOT updated
- Create vs update: Transaction creates checklist + updates status atomically
- No status change: Update checklist but status stays same (no unnecessary update)

**Token Estimate**: 8K tokens

---

### Subtask 2: Wrap `updateCollege` and `updateCollegeStatus` in Transactions (6K tokens)

**Goal**: Add transaction protection to college update operations that use updateMany + refetch pattern.

**Implementation**:
1. **updateCollege**:
   - Wrap in transaction
   - Replace `updateMany + findFirst` with single `update` call
   - Verify ownership with `where: { id, userId }`
   - Return updated college directly from `tx.college.update()`

2. **updateCollegeStatus**:
   - Same pattern as updateCollege
   - Replace `updateMany + findFirst` with single `update` call

**Changes**:
- `actions/college.ts:103-136` - updateCollege function
- `actions/college.ts:158-186` - updateCollegeStatus function

**Optimization**: Since we're wrapping in transactions, we can replace the `updateMany + findFirst` pattern with a single `update` call that returns the updated record (eliminates extra query).

**Test Cases**:
- Happy path: Update succeeds and returns updated college
- Error: College not found → proper error message
- Rollback: Mock DB error → no partial updates

**Token Estimate**: 6K tokens

---

### Subtask 3: Review `deleteCollege` and `createCollege` for Transaction Needs (3K tokens)

**Goal**: Evaluate if transaction protection is needed for create/delete operations.

**Analysis**:
- **deleteCollege**: Uses `deleteMany` (single operation). Cascade delete handled by Prisma automatically. Transaction not strictly required but could add for consistency.
- **createCollege**: Uses `create` with nested `checklist: { create: {} }` (single atomic operation via Prisma's nested writes). Already atomic, transaction not needed.

**Decision**:
- **deleteCollege**: Wrap in transaction for consistency (even though single operation)
- **createCollege**: Leave as-is (already atomic via nested write)

**Changes**:
- `actions/college.ts:138-156` - deleteCollege function (optional wrapper)

**Test Cases**:
- Delete: Verify college and checklist both deleted (cascade)
- Create: Verify existing tests still pass (no changes needed)

**Token Estimate**: 3K tokens

---

### Subtask 4: Add Transaction Rollback Tests (8K tokens)

**Goal**: Add comprehensive unit tests to verify transaction rollback behavior under failure scenarios.

**Test Cases to Add**:

1. **updateChecklist rollback**:
   - Mock successful checklist update
   - Mock failed status update (throw error)
   - Verify: Transaction rolls back (checklist NOT updated)
   - Verify: Error message preserved

2. **Concurrent updates** (race condition):
   - Simulate two concurrent `updateChecklist` calls
   - Verify: Both updates serialize correctly
   - Verify: No lost updates

3. **Transaction timeout**:
   - Mock slow operation (>5 seconds)
   - Verify: Transaction automatically rolls back
   - Verify: Proper timeout error returned

4. **Error message preservation**:
   - College not found → verify "College not found" error
   - Unauthorized → verify proper error message

5. **updateCollege/updateCollegeStatus rollback**:
   - Mock DB error during update
   - Verify: No partial updates

**Changes**:
- `actions/__tests__/college.test.ts` - Add new test suites for transaction rollback

**Mocking Strategy**:
- Mock `db.$transaction` to simulate transaction behavior
- Mock individual `tx.college.*` and `tx.checklist.*` operations
- Use `jest.spyOn` to verify transaction boundaries

**Token Estimate**: 8K tokens

---

### Subtask 5: QA, Performance Testing, and Documentation (3K tokens)

**Goal**: Verify all acceptance criteria met, no performance regression, and update documentation.

**QA Checklist**:
- [ ] All existing unit tests pass
- [ ] New transaction rollback tests pass
- [ ] Test coverage ≥90% (run `npm run test:coverage`)
- [ ] No linter errors (`npm run lint`)
- [ ] E2E tests pass (`npm run test:e2e`) - especially `e2e/checklist.spec.ts`

**Performance Testing**:
- Measure response time for `updateChecklist` before/after
- Target: < 50ms increase
- Expected: < 10ms increase (transactions add minimal overhead)
- Tool: Add timing logs in tests or use browser DevTools

**Documentation**:
- Update CLAUDE.md "Server Actions Pattern" section to mention transaction protection
- Add code comment at top of `actions/college.ts` explaining transaction usage

**Changes**:
- CLAUDE.md - Update Server Actions Pattern section
- `actions/college.ts` - Add documentation comment

**Token Estimate**: 3K tokens

---

## Edge Cases & Considerations

### Transaction Timeouts
- Default Prisma transaction timeout: 5 seconds
- For this codebase (simple updates), 5s is sufficient
- If operations take >5s, transaction rolls back automatically

### Concurrent Updates (Race Conditions)
- Prisma uses serializable isolation level by default
- Read-modify-write pattern in transactions prevents race conditions
- Two concurrent `updateChecklist` calls will serialize (one waits for other)

### Nested Transactions
- Prisma does NOT support nested transactions
- If future code needs to call one action from another, refactor to use shared transaction client
- Document this limitation in code comments

### Error Handling
- Transaction automatically rolls back on any thrown error
- Preserve existing error messages (e.g., "College not found")
- Test that rollback actually occurs (checklist not updated if status update fails)

### Read-Only Operations
- `getColleges`, `getCollegeById` do NOT need transactions (single read operation)
- Only wrap mutation functions

### Performance Impact
- Transactions add minimal overhead (<10ms)
- Trade-off: slight latency increase for data integrity guarantee
- For college tracking app with low traffic, this is acceptable

---

## Test Scenarios

1. **Happy path**: User updates checklist → checklist and status both update successfully
2. **Rollback on error**: Mock DB error during status update → verify checklist NOT updated (rollback)
3. **Race condition**: Two users update same college's checklist concurrently → verify both updates serialize correctly, no lost updates
4. **Transaction timeout**: Mock slow operation (>5s) → verify transaction rolls back
5. **Error messages preserved**: College not found → still returns "College not found" error
6. **Create vs update**: Checklist doesn't exist → transaction creates checklist + updates status atomically
7. **No status change needed**: Update checklist but status doesn't change → no unnecessary college update query

---

## Success Metrics

- **Data Integrity**: Zero inconsistent states (checklist updated but status not, or vice versa)
- **Test Coverage**: ≥90% coverage maintained
- **Performance**: Response time increase < 50ms (target: <10ms)
- **Reliability**: All E2E tests pass, especially checklist auto-progression tests
- **Code Quality**: No linter errors, all existing tests pass

---

## Dependencies

- Prisma ORM (already supports `$transaction`)
- PostgreSQL (ACID-compliant)
- No external dependencies required

---

## References

- **CLAUDE.md**: Server Actions Pattern (actions/college.ts)
- **Prisma Transactions Documentation**: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
- **Code Review Source**: `.claude/workflows/code-reviews/T00000-multi-user-support/best-practices.md` (TOCTOU/race conditions)
- **Related Security**: CWE-362 (Concurrent Execution using Shared Resource with Improper Synchronization)
- **Groomed Requirement**: `.claude/workflows/requirements/groomed/database-transactions.md`

---

## Notes

- This is a **data integrity fix** following multi-user support implementation (T00000)
- Identified in code review for PR #9
- Critical for production deployment with multiple concurrent users
- Simple implementation (wrap existing code, no major refactoring)
- High value-to-effort ratio (major reliability improvement for minimal code change)

---

## Token Budget Breakdown

| Subtask | Description | Tokens |
|---------|-------------|--------|
| 1 | Wrap updateChecklist in transaction | 8K |
| 2 | Wrap updateCollege & updateCollegeStatus | 6K |
| 3 | Review deleteCollege & createCollege | 3K |
| 4 | Add transaction rollback tests | 8K |
| 5 | QA, performance testing, documentation | 3K |
| **Total** | | **28K** |

---

**Ready for Implementation**: This ticket is fully groomed and ready for the `implement-feature` skill to execute.
