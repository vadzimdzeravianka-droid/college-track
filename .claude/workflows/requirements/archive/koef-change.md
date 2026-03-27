# Requirement: Urgency System - Absolute Day Thresholds

## Original Request

i want a new change, change percentage base coloring to absolute day count. Red - from 1.1 koef to 7 day before deadline. yellow - 7-21 day.

I never saw yellow because of percentage works incorrectly, and absolute values works better, have one week of buffer sounds "red" but feasiable. another two weeks mean it is time.

## Enriched Requirement

Replace the current percentage-based urgency calculation (buffer ratio logic) with simple absolute day thresholds. The current system calculates `daysAvailable / daysNeeded` ratio and compares against 1.1 and 1.6 thresholds, which produces unintuitive results. The new system should use fixed day counts that are easier to reason about.

### Context

- **Affected areas**:
  - `lib/utils.ts` - `getUrgencyLevel()` function (lines 78-112)
  - `lib/utils.ts` - `getUrgencyMessage()` function (lines 116-154) - update messages to match new logic
  - `CLAUDE.md` - Documentation of urgency thresholds (lines 117-120)
  - Components using urgency (no changes needed, they consume the functions):
    - `components/college-card.tsx`
    - `app/(protected)/college/[id]/page.tsx`
    - `components/dashboard-client.tsx`
- **Dependencies**: None
- **Related features**:
  - `calculateDaysNeeded()` function still needed for informational messages showing days needed vs. days available
  - Urgency colors are used throughout the UI for visual indicators

### Current Implementation (Problem)

```typescript
const bufferRatio = daysAvailable / daysNeeded;

if (bufferRatio < 1.1) {
  return "red";   // Less than 10% buffer
}

if (bufferRatio < 1.6) {
  return "yellow";  // Less than 60% buffer
}

return "green";
```

**Issues**:
- If deadline is 60 days away but only 10 days work needed, ratio = 6.0 → green (correct)
- If deadline is 30 days away but 28 days work needed, ratio = 1.07 → red (misleading - user has 30 days!)
- Yellow zone (1.1-1.6 ratio) is rare because it requires specific ratio range
- User reports "never seeing yellow" - the percentage logic doesn't match mental model

## Implementation Approaches

### Approach A: Simple Absolute Thresholds (Recommended)

**Description**: Replace ratio calculation with fixed day boundaries based solely on `daysAvailable`:

```typescript
if (daysAvailable <= 7) {
  return "red";    // 1 week or less - urgent
}

if (daysAvailable <= 21) {
  return "yellow";  // 1-3 weeks - time to act
}

return "green";     // 3+ weeks - plenty of time
```

**Pros**:
- Intuitive: "1 week = red, 3 weeks = yellow, more = green"
- Predictable: Same deadline always produces same color regardless of checklist
- Simpler: No ratio calculation, no dependency on checklist state
- Yellow zone is common: All 7-21 day deadlines will be yellow
- Matches user's mental model: "one week buffer sounds red but feasible, two more weeks means it's time"

**Cons**:
- Doesn't account for work complexity (deadline 20 days away with 30 days work still shows yellow)
- Less personalized (same for all users regardless of checklist progress)

**Token Estimate**: ~12K tokens (small change, focused on 2 functions + messages + docs + tests)

### Approach B: Hybrid - Absolute Thresholds with Override

**Description**: Use absolute day thresholds as primary, but override to red if `daysNeeded > daysAvailable`:

```typescript
const daysNeeded = calculateDaysNeeded(checklist, essayCount);

// If overdue or impossible to complete, always red
if (daysAvailable <= 0 || daysNeeded > daysAvailable) {
  return "red";
}

// Otherwise, simple absolute thresholds
if (daysAvailable <= 7) {
  return "red";
}

if (daysAvailable <= 21) {
  return "yellow";
}

return "green";
```

**Pros**:
- Retains some intelligence (warns if work needed exceeds time available)
- Still simple and predictable for typical cases
- Yellow zone remains common

**Cons**:
- More complex than pure absolute thresholds
- `calculateDaysNeeded()` estimates can be inaccurate
- Reintroduces dependency on checklist state

**Token Estimate**: ~15K tokens (slightly more complex, more test cases)

### Approach C: Configurable Thresholds

**Description**: Add threshold configuration to database or constants, allowing user to customize red/yellow boundaries.

**Pros**:
- Future-proof if user wants to adjust
- Could support per-user preferences

**Cons**:
- Over-engineered for single-user app
- Adds complexity without clear benefit
- Not requested by user

**Token Estimate**: ~25K tokens (unnecessary complexity)

**Recommended**: **Approach A** - Simple absolute thresholds

**Reasoning**: User specifically requested simple day-based thresholds and complained about percentage complexity. The whole point is to remove the ratio logic, not to make it more complex. Approach A directly solves the stated problem ("never saw yellow because percentage works incorrectly") by creating a wide, predictable yellow zone (7-21 days). The user acknowledges this is less personalized ("one week buffer sounds red but feasible") but prefers the predictability.

## Edge Cases & Considerations

### Data Validation

- **Overdue deadlines** (daysAvailable <= 0): Should still show red ✅ (already handled)
- **No deadline set** (deadline === null): Should return "none" ✅ (already handled)
- **Completed statuses**: SUBMITTED, ACCEPTED, DECLINED should return "none" ✅ (already handled)

### Behavior Changes (User Impact)

- **Before**: Deadline 14 days away, 10 days work needed → ratio 1.4 → yellow
- **After**: Deadline 14 days away → yellow (regardless of work needed)
- **Impact**: Yellow zone becomes much more common ✅ (user's goal)

- **Before**: Deadline 30 days away, 28 days work needed → ratio 1.07 → red
- **After**: Deadline 30 days away → green (even with 28 days work needed)
- **Impact**: Less sensitive to work estimates, more predictable ✅

### Urgency Messages

Current messages reference "buffer" and "days needed":
- `"Critical: Less than 10% time buffer (${bufferDays} days)"`
- `"Warning: Tight timeline (${bufferDays} days buffer)"`

**New messages should**:
- Drop buffer ratio language
- Clearly communicate absolute thresholds
- Still show `daysNeeded` vs `daysAvailable` when there's a time crunch (informational)

**Proposed**:
- Red: `"Critical: Less than 1 week until deadline"` (or show days needed if > days available)
- Yellow: `"Warning: 1-3 weeks until deadline"`
- Green: `"On track: ${daysAvailable} days until deadline"`

### Performance

- **Impact**: Positive (removes `calculateDaysNeeded()` call from urgency determination)
- **Note**: `calculateDaysNeeded()` still used in messages, so no breaking changes

### Backward Compatibility

- **Function signatures**: No changes to `getUrgencyLevel()` or `getUrgencyMessage()` signatures
- **Return types**: Same ("red" | "yellow" | "green" | "none")
- **Consumers**: No changes needed in components (they just use the functions)

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

### Unit Tests for `getUrgencyLevel()`

1. **Overdue**: deadline = yesterday → red
2. **Boundary: 0 days**: deadline = today → red
3. **Boundary: 7 days**: deadline = today + 7 days → red
4. **Boundary: 8 days**: deadline = today + 8 days → yellow
5. **Boundary: 21 days**: deadline = today + 21 days → yellow
6. **Boundary: 22 days**: deadline = today + 22 days → green
7. **No deadline**: deadline = null → none
8. **Completed status**: status = SUBMITTED, deadline = tomorrow → none
9. **Accepted status**: status = ACCEPTED, deadline = yesterday → none

### Unit Tests for `getUrgencyMessage()`

1. **Red - overdue**: daysAvailable = -5 → "Deadline passed"
2. **Red - urgent**: daysAvailable = 3 → "Critical: Less than 1 week until deadline"
3. **Red - impossible**: daysAvailable = 5, daysNeeded = 10 → "Critical: Need 10 days, only 5 days left"
4. **Yellow - warning**: daysAvailable = 14 → "Warning: 1-3 weeks until deadline"
5. **Yellow - tight**: daysAvailable = 20, daysNeeded = 25 → "Warning: Need 25 days, only 20 days left"
6. **Green - comfortable**: daysAvailable = 45 → "On track: 45 days until deadline"
7. **None**: deadline = null → "" (empty string)

### Integration Test

1. **Dashboard**: Verify college cards show correct urgency colors for various deadlines
2. **Visual regression**: No layout changes, only color/message changes

## Token Budget Estimate

- **Research & Analysis**: 5K tokens (codebase exploration, current behavior verification)
- **Implementation**: 8K tokens (2 functions, ~30 lines changed)
- **Testing**: 6K tokens (9 unit tests for boundaries, message tests)
- **Documentation**: 2K tokens (CLAUDE.md update)
- **QA**: 3K tokens (validation gates)
- **Total**: ~24K tokens

## References

- CLAUDE.md: Urgency Calculation System (lines 103-120)
- `lib/utils.ts`: `getUrgencyLevel()` (lines 78-112), `getUrgencyMessage()` (lines 116-154)
- Used in:
  - `components/college-card.tsx` - Dashboard urgency indicators
  - `app/(protected)/college/[id]/page.tsx` - Detail page urgency
  - `components/dashboard-client.tsx` - Dashboard sorting/filtering
- Past learning: Cost tracking feature (grooming-20260326-cost-tracking.json)
  - Lesson: "User prefers clear, predictable logic over complex intelligent systems"
  - Applied: Choosing simple absolute thresholds over hybrid/ratio-based
