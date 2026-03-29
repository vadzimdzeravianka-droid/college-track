# Ticket: Date Formatting Utility Function

**Status**: READY
**Priority**: LOW
**Estimated Tokens**: 8K
**Groomed Requirement**: test-evaluation

## Summary

Add a `formatRelativeDate` utility function that formats dates as "X days ago", "today", "tomorrow", etc. for improved UX in college deadlines display.

## Implementation Approach

Add utility function to `lib/utils.ts` following existing patterns. Use TDD approach with comprehensive edge case coverage.

## Affected Files

### To Modify
- `lib/utils.ts` - Add formatRelativeDate function

### To Create
- `lib/__tests__/utils.date.test.ts` - Unit tests for date formatting

## Subtasks

### Subtask 1: Implement formatRelativeDate Function
**Complexity**: Simple
**Estimated Tokens**: 8K

**Description**: Create formatRelativeDate(date: Date): string function that returns human-readable relative dates.

**Function Signature**:
```typescript
export function formatRelativeDate(date: Date): string
```

**Expected Behavior**:
- Same day → "today"
- Tomorrow → "tomorrow"
- 2-6 days away → "in X days"
- 7-13 days away → "in 1 week" / "in 2 weeks"
- Yesterday → "yesterday"
- 2-6 days ago → "X days ago"
- > 14 days away → actual date using formatDate()
- > 7 days ago → actual date using formatDate()

**Tests**:
- Unit: Returns "today" for current date
- Unit: Returns "tomorrow" for next day
- Unit: Returns "in 3 days" for date 3 days away
- Unit: Returns "in 1 week" for date 7 days away
- Unit: Returns "yesterday" for previous day
- Unit: Returns "3 days ago" for date 3 days past
- Unit: Returns formatted date string for dates > 14 days away
- Unit: Handles edge case of exactly midnight
- Unit: Works correctly across month boundaries

**Acceptance**:
- [ ] Function exists in lib/utils.ts and is exported
- [ ] Returns correct strings for all date ranges
- [ ] All unit tests pass
- [ ] Test coverage >= 90%
- [ ] No linter errors
- [ ] Function has JSDoc documentation
- [ ] TypeScript types are correct (no any)
