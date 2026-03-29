# Ticket: Fix Pointer Cursor on Interactive Elements

**Status**: READY
**Priority**: LOW
**Estimated Tokens**: 8K
**Groomed Requirement**: `.claude/workflows/requirements/groomed/bug-pointer-cursor.md`

## Summary

Investigate and verify cursor behavior for "Back to Dashboard" button and all interactive Link+Button combinations in the codebase. Current code analysis shows all Link+Button patterns already use the correct `asChild` pattern, but requirement indicates cursor displays as arrow instead of pointer on hover.

## Implementation Approach

Investigation-first approach: Verify if issue exists in runtime, then apply fix if needed. Code review shows correct implementation patterns, so issue may be CSS specificity, browser-specific, or already resolved.

**Selected Pattern**: Button with `asChild` prop (already implemented throughout codebase)

## Affected Files

### To Verify
- `app/(protected)/college/[id]/page.tsx` - Two "Back to Dashboard" button instances (lines 37-42, 67-73)
- `components/college-card.tsx` - Link-wrapped Card (line 157-427)
- `components/ui/button.tsx` - Button component with cursor-pointer in base styles

### To Investigate (if issue persists)
- `app/globals.css` - Check for global cursor overrides
- Parent container elements - Check pointer-events or cursor inheritance

### To Create
- `e2e/cursor-behavior.spec.ts` - E2E test to verify cursor on interactive elements

## Subtasks

### Subtask 1: Verify Current Cursor Behavior
**Complexity**: Simple
**Estimated Tokens**: 2K

**Description**: Run application locally and test cursor behavior on all Link+Button combinations. Document whether cursor shows pointer or arrow on hover. Test in multiple browsers (Chrome, Firefox, Safari).

**Files**:
- Test: `app/(protected)/college/[id]/page.tsx` (lines 37-42, 67-73)
- Test: `components/college-card.tsx` (entire clickable card)

**Tests**:
- Manual: Hover over "Back to Dashboard" button in college detail page
- Manual: Hover over "Back to Dashboard" in error state (navigate to invalid college ID)
- Manual: Hover over college cards on dashboard
- Browser: Test in Chrome, Firefox, Safari

**Acceptance**:
- [ ] Documented cursor behavior for each interactive element
- [ ] Screenshots captured if cursor shows arrow instead of pointer
- [ ] Browser compatibility matrix completed

---

### Subtask 2: Inspect Runtime Styles (if issue confirmed)
**Complexity**: Simple
**Estimated Tokens**: 2K

**Description**: If cursor shows arrow instead of pointer, use browser DevTools to inspect computed styles on hover. Identify which CSS rules are overriding the cursor-pointer class from Button component.

**Files**:
- Investigate: `app/globals.css`
- Investigate: Computed styles in browser DevTools

**Tests**:
- Manual: DevTools Elements panel inspection
- Manual: Check CSS specificity and cascade

**Acceptance**:
- [ ] Identified CSS rule causing cursor override
- [ ] Documented specificity issue or inheritance problem
- [ ] Root cause determined

---

### Subtask 3: Apply Fix (only if issue confirmed)
**Complexity**: Simple
**Estimated Tokens**: 2K

**Description**: Based on investigation findings, apply minimal fix. Options:
1. If asChild not working: verify Radix Slot implementation
2. If CSS override: add higher specificity rule or use !important
3. If browser-specific: add vendor-specific cursor rules

**Files**:
- Modify: Determined by investigation (likely `app/globals.css` or specific component)

**Tests**:
- Manual: Verify cursor shows pointer after fix
- Unit: Add test for Button asChild rendering

**Acceptance**:
- [ ] Cursor displays as pointer on all Link+Button combinations
- [ ] No regression in other interactive elements
- [ ] Fix is minimal and follows codebase conventions

---

### Subtask 4: Create E2E Cursor Test
**Complexity**: Simple
**Estimated Tokens**: 2K

**Description**: Create Playwright E2E test to verify cursor CSS property on interactive elements. This prevents regression.

**Files**:
- Create: `e2e/cursor-behavior.spec.ts`

**Tests**:
- E2E: Hover over Back to Dashboard button, assert cursor CSS is "pointer"
- E2E: Hover over college card, assert cursor CSS is "pointer"
- E2E: Test across all browsers (chromium, firefox, webkit)

**Acceptance**:
- [ ] E2E test covers all Link+Button combinations
- [ ] Test checks computed cursor CSS property
- [ ] Test passes in all configured browsers

---

## Acceptance Criteria

- [ ] "Back to Dashboard" button at top of college detail page shows pointer cursor on hover
- [ ] "Back to Dashboard" button in error state shows pointer cursor on hover
- [ ] College cards on dashboard show pointer cursor on hover
- [ ] All interactive elements have appropriate cursor (pointer for clickable items)
- [ ] No regression in keyboard navigation or accessibility
- [ ] E2E test added to prevent regression
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors

## Test Scenarios

### Manual Testing
- [ ] Hover over "Back to Dashboard" button on college detail page, cursor shows pointer
- [ ] Navigate to invalid college ID, hover over "Back to Dashboard" in error, cursor shows pointer
- [ ] Hover over any college card on dashboard, cursor shows pointer
- [ ] Test in Chrome, Firefox, Safari for browser compatibility

### E2E Tests
- [ ] Test cursor CSS property on Back to Dashboard button
- [ ] Test cursor CSS property on college cards
- [ ] Test runs successfully in chromium, firefox, webkit

### Regression Tests
- [ ] Keyboard navigation still works (Tab to button, press Enter)
- [ ] Screen reader announces links correctly
- [ ] Button click/tap functionality unchanged
- [ ] No visual regression in button styling

## Edge Cases to Handle

- **Browser compatibility**: Cursor may render differently across browsers
- **CSS specificity**: Global styles may override component styles
- **Nested interactive elements**: Ensure cursor doesn't flicker between parent/child
- **Mobile devices**: Touch devices don't show cursor, ensure no adverse effects
- **Dark mode**: Verify cursor in both light and dark themes

## Definition of Done

- [ ] All subtasks completed (Subtask 3 may be skipped if no issue found)
- [ ] All acceptance criteria met
- [ ] Manual testing completed across browsers
- [ ] E2E test created and passing
- [ ] All existing tests passing
- [ ] No linter errors
- [ ] CLAUDE.md updated if patterns changed
- [ ] Documentation added if fix required

## Token Budget

| Stage | Estimated |
|-------|-----------|
| Subtask 1 (Verify behavior) | 2K |
| Subtask 2 (Inspect styles) | 2K |
| Subtask 3 (Apply fix) | 2K |
| Subtask 4 (E2E test) | 2K |
| **Total** | **8K** |

## Dependencies

- [ ] No blocking dependencies

## Notes

**Current Code Status**: Codebase analysis shows all Link+Button combinations already use the correct `asChild` pattern:
- `app/(protected)/college/[id]/page.tsx` lines 37-42 and 67-73: Correct implementation
- `components/ui/button.tsx` line 8: Base styles include `cursor-pointer`

**Possible Scenarios**:
1. Issue was already fixed in recent commit → Verify and close ticket
2. Issue exists only in production/deployed version → Verify deployment is up to date
3. Issue is browser-specific → Add vendor prefixes or browser-specific CSS
4. Issue is CSS specificity → Adjust global styles or component specificity

## References

- Groomed requirement: `.claude/workflows/requirements/groomed/bug-pointer-cursor.md`
- Button component: `components/ui/button.tsx`
- College detail page: `app/(protected)/college/[id]/page.tsx`
- College card: `components/college-card.tsx`
- [Radix UI Slot/asChild pattern](https://www.radix-ui.com/primitives/docs/guides/composition)
- CLAUDE.md: Component Organization (shadcn/ui usage)
