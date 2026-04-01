# Database Transactions for Data Integrity

## Problem Statement

The `updateChecklist` function in `actions/college.ts` performs 3-4 separate database operations without transaction protection. If the status update fails after the checklist update succeeds, the database is left in an inconsistent state.

## Current Implementation

```typescript
export async function updateChecklist(collegeId: string, values: Partial<z.infer<typeof ChecklistSchema>>) {
  const userId = await requireAuth();

  // Operation 1: Fetch college
  const college = await db.college.findFirst({
    where: { id: collegeId, userId },
    include: { checklist: true },
  });

  // Operation 2: Update/create checklist
  if (college.checklist) {
    updatedChecklist = await db.checklist.update({ ... });
  } else {
    updatedChecklist = await db.checklist.create({ ... });
  }

  // Operation 3: Calculate new status
  const newStatus = calculateStatus(...);

  // Operation 4: Update college status (if this fails, checklist is already changed!)
  if (newStatus !== college.status) {
    await db.college.update({ ... });
  }
}
```

## Risk Scenarios

### Scenario 1: Status Update Failure
```
1. User checks final checklist item
2. Checklist update succeeds → lorTeacher = true
3. Network timeout or DB error
4. Status update FAILS
Result: Checklist shows complete but status still "IN_PROGRESS"
```

### Scenario 2: Race Condition
```
Timeline:
T1: User A reads college (2/5 items complete)
T2: User B reads college (2/5 items complete)
T3: User A updates checklist (now 3/5)
T4: User B updates checklist (calculates from T2 state)
Result: Status might not reflect actual checklist state
```

## Requirements

1. **Atomic Operations**: All database operations in `updateChecklist` must be wrapped in a transaction
2. **Rollback on Failure**: If any operation fails, all changes must be rolled back
3. **Same Behavior**: External behavior should remain identical
4. **Apply Pattern**: Consider similar protection for `updateCollege` and `updateCollegeStatus`

## Success Criteria

- [ ] `updateChecklist` uses `db.$transaction()`
- [ ] All operations use transaction client (`tx`) instead of `db`
- [ ] Tests verify transaction rollback on failure
- [ ] No breaking changes to API or behavior
- [ ] Consider applying pattern to other mutation functions

## Technical Approach

Use Prisma's interactive transactions:

```typescript
await db.$transaction(async (tx) => {
  const college = await tx.college.findFirst({ ... });
  const updatedChecklist = await tx.checklist.update({ ... });
  if (newStatus !== college.status) {
    await tx.college.update({ ... });
  }
  return { checklist: updatedChecklist, status: newStatus };
});
```

## Priority

**HIGH** - Data integrity risk under error conditions or concurrent access

## Estimated Effort

2-3 hours (implementation + tests)

## Source

Identified in code review for PR #9 (T00000-multi-user-support)
- Review report: `.claude/workflows/code-reviews/T00000-multi-user-support/best-practices.md`
- CWE: Data race condition
