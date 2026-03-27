# Ticket: Urgency System - Absolute Day Thresholds

**Status**: ✅ DONE
**Priority**: MEDIUM
**Estimated Tokens**: 24K
**Actual Tokens**: 21K
**Completed**: 2026-03-27 00:30
**Commit**: f6aa037
**Groomed Requirement**: `.claude/workflows/requirements/groomed/koef-change.md`
**Validation Report**: `.claude/workflows/validation-reports/URGENCY-ABSOLUTE-THRESHOLDS-20260327/report.md`

## Summary

Replace percentage-based urgency calculation (buffer ratio) with simple absolute day thresholds to make urgency levels more intuitive and predictable. Red = 0-7 days, Yellow = 7-21 days, Green = 21+ days.

## Implementation Approach

**Approach A: Simple Absolute Thresholds** - Replace buffer ratio logic with fixed day boundaries. User explicitly requested this to solve "never seeing yellow" problem with percentage-based system. Creates predictable behavior: 1 week = red (urgent), 1-3 weeks = yellow (time to act), 3+ weeks = green (comfortable).

## Affected Files

### To Modify
- `lib/utils.ts` - Replace ratio logic in `getUrgencyLevel()` (lines 78-112)
- `lib/utils.ts` - Update messages in `getUrgencyMessage()` (lines 116-154)
- `CLAUDE.md` - Update urgency documentation (lines 103-120)

### To Create
- `lib/__tests__/utils.urgency.test.ts` - New test file for urgency functions

## Subtasks

### Subtask 1: Implement Absolute Thresholds in getUrgencyLevel()
**Complexity**: Simple
**Estimated Tokens**: 5K

**Description**: Replace the buffer ratio calculation (`daysAvailable / daysNeeded`) with simple absolute day comparisons. Remove dependency on `calculateDaysNeeded()` from urgency determination logic.

**Changes**:
```typescript
// OLD (remove):
const daysNeeded = calculateDaysNeeded(checklist, essayCount);
if (daysNeeded <= 10) return "green";
const bufferRatio = daysAvailable / daysNeeded;
if (bufferRatio < 1.1) return "red";
if (bufferRatio < 1.6) return "yellow";

// NEW (implement):
if (daysAvailable <= 7) return "red";
if (daysAvailable <= 21) return "yellow";
return "green";
```

**Files**:
- Modify: `lib/utils.ts` (lines 78-112)

**Tests** (to be added in Subtask 3):
- Boundary: 7 days → red
- Boundary: 8 days → yellow
- Boundary: 21 days → yellow
- Boundary: 22 days → green

**Acceptance**:
- [ ] Red zone: 0-7 days until deadline OR overdue
- [ ] Yellow zone: 7-21 days until deadline
- [ ] Green zone: 21+ days until deadline
- [ ] Completed statuses still return "none"
- [ ] No deadline (null) still returns "none"

---

### Subtask 2: Update Urgency Messages
**Complexity**: Simple
**Estimated Tokens**: 6K

**Description**: Update `getUrgencyMessage()` to remove buffer ratio language and reflect new absolute thresholds. Keep `daysNeeded` calculation for informational "need X days, only Y left" messages.

**Changes**:
```typescript
// OLD messages (remove):
"Critical: Less than 10% time buffer (${bufferDays} days)"
"Warning: Tight timeline (${bufferDays} days buffer)"
"On track (${bufferDays} days buffer)"

// NEW messages (implement):
"Critical: Less than 1 week until deadline"
"Warning: 1-3 weeks until deadline"
"On track: ${daysAvailable} days until deadline"

// Keep informational messages when time crunch:
"Critical: Need ${daysNeeded} days, only ${daysAvailable} days left"
"Warning: Need ${daysNeeded} days, only ${daysAvailable} days left"
```

**Files**:
- Modify: `lib/utils.ts` (lines 116-154)

**Tests** (to be added in Subtask 3):
- Red - overdue: "Deadline passed"
- Red - urgent: "Critical: Less than 1 week until deadline"
- Red - impossible: "Critical: Need 10 days, only 5 days left"
- Yellow - warning: "Warning: 1-3 weeks until deadline"
- Green - comfortable: "On track: 45 days until deadline"

**Acceptance**:
- [ ] Messages no longer reference "buffer ratio" or "percentage"
- [ ] Messages clearly communicate absolute thresholds
- [ ] Still show days needed vs. available when there's a time crunch
- [ ] Empty string for "none" urgency

---

### Subtask 3: Create Comprehensive Test Suite
**Complexity**: Medium
**Estimated Tokens**: 9K

**Description**: Create new test file `lib/__tests__/utils.urgency.test.ts` with comprehensive coverage of urgency functions. Test all boundary cases and message variations.

**Files**:
- Create: `lib/__tests__/utils.urgency.test.ts`

**Tests to Implement**:

**getUrgencyLevel() Tests**:
- Overdue deadline (yesterday) → red
- Boundary: 0 days (today) → red
- Boundary: 7 days → red
- Boundary: 8 days → yellow
- Boundary: 21 days → yellow
- Boundary: 22 days → green
- No deadline (null) → none
- Completed status (SUBMITTED) with future deadline → none
- Accepted status with past deadline → none

**getUrgencyMessage() Tests**:
- Red - overdue (daysAvailable = -5) → "Deadline passed"
- Red - urgent (daysAvailable = 3) → "Critical: Less than 1 week until deadline"
- Red - impossible (daysAvailable = 5, daysNeeded = 10) → "Critical: Need 10 days, only 5 days left"
- Yellow - warning (daysAvailable = 14) → "Warning: 1-3 weeks until deadline"
- Yellow - tight (daysAvailable = 20, daysNeeded = 25) → "Warning: Need 25 days, only 20 days left"
- Green - comfortable (daysAvailable = 45) → "On track: 45 days until deadline"
- None (deadline = null) → "" (empty string)

**Acceptance**:
- [ ] All boundary cases tested (0, 7, 8, 21, 22 days)
- [ ] All message variations tested
- [ ] Test coverage for urgency functions >= 95%
- [ ] All tests pass
- [ ] No test failures in existing test suites

---

### Subtask 4: Update Documentation
**Complexity**: Simple
**Estimated Tokens**: 2K

**Description**: Update CLAUDE.md to reflect new absolute threshold system. Remove references to buffer ratio, update examples.

**Files**:
- Modify: `CLAUDE.md` (lines 103-120)

**Changes**:
```markdown
OLD:
Urgency thresholds:
- **Red**: Buffer ratio < 1.1 (less than 10% buffer) OR overdue
- **Yellow**: Buffer ratio < 1.6 (less than 60% buffer)
- **Green**: Buffer ratio >= 1.6 OR minimal work remaining (<= 10 days needed)

NEW:
Urgency thresholds (absolute day-based):
- **Red**: 1-7 days until deadline OR overdue
- **Yellow**: 7-21 days until deadline (1-3 weeks)
- **Green**: 21+ days until deadline

Note: `calculateDaysNeeded()` still estimates required time based on checklist completion, essay requirements, and milestone duration constants (e.g., main essay = 21 days, supplemental = 10 days), but urgency color is determined solely by absolute days remaining.
```

**Acceptance**:
- [ ] Documentation accurately reflects new logic
- [ ] No references to buffer ratio or percentage
- [ ] Clear explanation of absolute thresholds
- [ ] Note about `calculateDaysNeeded()` usage in messages

---

## Acceptance Criteria

- [ ] `getUrgencyLevel()` uses absolute day thresholds (7 days = red, 21 days = yellow)
- [ ] Red zone: 0-7 days until deadline OR deadline passed
- [ ] Yellow zone: 7-21 days until deadline
- [ ] Green zone: 21+ days until deadline
- [ ] Completed statuses (SUBMITTED, ACCEPTED, DECLINED) return "none" (unchanged)
- [ ] No deadline (null) returns "none" (unchanged)
- [ ] `getUrgencyMessage()` returns appropriate messages for each zone
- [ ] Messages no longer reference "buffer ratio" or "percentage"
- [ ] CLAUDE.md documentation updated to reflect absolute thresholds
- [ ] All existing tests pass or updated to match new logic
- [ ] New tests cover edge cases (0 days, 7 days, 21 days boundaries)
- [ ] No linter errors
- [ ] Test coverage remains >= 90% for lib/utils.ts

## Test Scenarios

### Unit Tests (Subtask 3)
- [ ] getUrgencyLevel() - All boundary cases (0, 7, 8, 21, 22 days)
- [ ] getUrgencyLevel() - Null deadline and completed statuses
- [ ] getUrgencyMessage() - All message variations (7 scenarios)
- [ ] Edge case: Overdue deadline
- [ ] Edge case: Today deadline (0 days)
- [ ] Edge case: Exact boundary values (7, 21 days)

### Integration Tests
- [ ] Dashboard cards display correct colors for various deadlines
- [ ] Detail pages show correct urgency messages
- [ ] Dashboard sorting/filtering respects new urgency logic

### Manual Testing
- [ ] Yellow urgency appears for 7-21 day deadlines (user's primary concern)
- [ ] Visual review of dashboard - colors make sense
- [ ] No unexpected behavior in UI components

## Edge Cases to Handle

- **Overdue deadlines** (daysAvailable <= 0): Already handled, returns "red" ✅
- **No deadline set** (deadline === null): Already handled, returns "none" ✅
- **Completed statuses**: Already handled, returns "none" ✅
- **Boundary precision**: Ensure `daysAvailable <= 7` means 7 days is red, 8 days is yellow
- **Message consistency**: Show "need X days, only Y left" when applicable, not always

## Definition of Done

- [ ] All 4 subtasks completed
- [ ] All acceptance criteria met
- [ ] Test coverage >= 90% for lib/utils.ts
- [ ] All tests passing (new + existing)
- [ ] No linter errors
- [ ] CLAUDE.md updated
- [ ] No breaking changes (function signatures unchanged)
- [ ] UI components show expected behavior (manual verification)

## Token Budget

| Stage | Estimated |
|-------|-----------|
| Subtask 1 (getUrgencyLevel) | 5K |
| Subtask 2 (getUrgencyMessage) | 6K |
| Subtask 3 (Tests) | 9K |
| Subtask 4 (Documentation) | 2K |
| QA | 3K |
| **Total** | **25K** |

## Dependencies

- [ ] No blocking dependencies
- [ ] No new packages required
- [ ] Backward compatible (function signatures unchanged)

## References

- Groomed requirement: `.claude/workflows/requirements/groomed/koef-change.md`
- Current implementation: `lib/utils.ts` lines 78-154
- Documentation: `CLAUDE.md` lines 103-120
- Components using urgency:
  - `components/college-card.tsx`
  - `app/(protected)/college/[id]/page.tsx`
  - `components/dashboard-client.tsx`
- Past learning: `grooming-20260327-urgency-thresholds.json`
  - User prefers simple, predictable thresholds over complex ratio systems

## Implementation Notes

**Key Insight**: User's complaint "never saw yellow" indicates the percentage-based system has a narrow yellow zone. The new absolute threshold system (7-21 day range) provides a 14-day yellow window, making it much more common and predictable.

**Simplification**: Removing `calculateDaysNeeded()` from urgency determination (keeping only in messages) makes the system faster and more predictable while still providing informational context.

**No Breaking Changes**: Function signatures remain identical, so all consuming components work without modification. This is purely a logic change within the utility functions.
