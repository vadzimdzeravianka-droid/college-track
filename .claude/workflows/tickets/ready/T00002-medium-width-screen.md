# T00002: Responsive Layout for Medium-Width Screens (768-1070px)

**Status**: READY
**Complexity**: SIMPLE
**Token Budget**: 12K tokens
**Created**: 2026-04-03
**Groomed From**: `.claude/workflows/requirements/groomed/medium-width-screen.md`

---

## Problem Statement

The college card desktop layout currently causes horizontal overflow on screens between 768-1070px. The desktop horizontal layout activates at the `md` breakpoint (768px) but requires ~1024px minimum width to display all columns (320px name + 288px details + 224px cost + 96px checklist + 96px data), resulting in content being cut off to the right side of the screen.

## Why This Matters

- **UX Issue**: Horizontal overflow breaks the user experience on tablets and smaller laptops
- **Accessibility**: Users cannot see all college information without horizontal scrolling
- **Common viewport**: 768-1024px covers many tablets (iPad, Surface) and small laptops

## Success Criteria

- [ ] No horizontal overflow at any viewport width 768-1070px
- [ ] All college data visible without horizontal scrolling
- [ ] Mobile layout (<768px) remains unchanged
- [ ] Desktop layout (≥1070px) remains unchanged
- [ ] Cost, data completeness, and checklist sections remain clearly visible in new layout
- [ ] Dark mode works correctly across all breakpoints
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors

---

## Implementation Plan

### Approach

Add a new Tailwind breakpoint `lg` at 1070px and create an intermediate layout for the `md:lg` range (768-1070px) that stacks the last 3 columns (cost, data completeness, checklist) vertically while keeping name + details horizontal.

**Target Layout for 768-1070px**:
```
┌──────────────────────────────────────────────────┐
│ Name & Badges   │ Details (location, dates)      │
├─────────────────┴──────────────────┬─────────────┤
│                                     │  Cost       │
│                                     │  Data       │
│                                     │  Checklist  │
└─────────────────────────────────────┴─────────────┘
```

### Affected Files

1. **`tailwind.config.ts`** - Add new `lg` breakpoint at 1070px
2. **`components/college-card.tsx`** - Implement intermediate responsive layout
3. **`app/globals.css`** - Optional: add CSS variable adjustments if needed
4. **`components/__tests__/college-card.test.tsx`** - Add responsive layout tests

---

## Subtasks

### Subtask 1: Configure Tailwind Breakpoint
**Token Estimate**: 1K tokens
**Files**: `tailwind.config.ts`

Add custom `lg` breakpoint at 1070px in Tailwind config:

```typescript
theme: {
  extend: {
    screens: {
      'lg': '1070px',
    },
    // ... existing config
  },
}
```

**Validation**:
- Tailwind generates `lg:` utility classes
- Build succeeds without errors
- DevTools shows breakpoint activates at 1070px

---

### Subtask 2: Implement Intermediate Layout
**Token Estimate**: 6K tokens
**Files**: `components/college-card.tsx`

Modify the desktop layout section (lines 288-425) to add a third responsive state:

1. Keep existing mobile layout (<768px) unchanged
2. Add intermediate layout for `md:lg` range (768-1070px):
   - Left section: Name + badges + details (horizontal, full width)
   - Right section: Cost, data, checklist (stacked vertically, fixed width ~180px)
3. Keep existing desktop layout for `lg:` (≥1070px) unchanged

**Key changes**:
- Add conditional classes: `md:flex lg:hidden` for intermediate layout
- Use `lg:flex` to restore full horizontal layout at 1070px+
- Adjust column widths for intermediate layout to fit ~768px minimum
- Ensure data completeness column only shows when <100% in all layouts

**Validation**:
- No horizontal overflow from 768px to 1070px
- Smooth transition at breakpoints (767px, 768px, 1069px, 1070px)
- All data visible in stacked layout
- Cost, data, checklist icons render correctly

---

### Subtask 3: Handle Edge Cases
**Token Estimate**: 2K tokens
**Files**: `components/college-card.tsx`

Address edge cases in the intermediate layout:

1. **Data completeness visibility**: Ensure conditional rendering (`dataCompleteness.overall.percentage < 100`) works in stacked layout
2. **Cost N/A placeholder**: Verify "Cost N/A" displays correctly in stacked layout
3. **Long content**: Test with long college names, locations, majors for truncation
4. **Dark mode**: Verify all colors/borders render correctly
5. **Hover states**: Ensure hover shadow works across all layouts

**Validation**:
- Data completeness column hides when 100% complete
- "Cost N/A" displays centered in stacked layout
- Text truncates with ellipsis when too long
- Dark mode styling consistent across breakpoints
- Hover effects work smoothly

---

### Subtask 4: Add Responsive Tests
**Token Estimate**: 2K tokens
**Files**: `components/__tests__/college-card.test.tsx`

Add test coverage for new intermediate layout:

1. Test intermediate layout visibility at 900px viewport
2. Test breakpoint transitions (mobile ↔ intermediate ↔ desktop)
3. Test data completeness conditional rendering in stacked layout
4. Test cost column displays correctly in all layouts
5. Test no horizontal overflow at various widths (768px, 900px, 1024px)

**Test cases**:
```typescript
describe('Intermediate Layout (768-1070px)', () => {
  it('displays stacked right column at 900px viewport', () => {
    // Mock viewport width, render card, verify stacked layout
  });

  it('transitions smoothly between breakpoints', () => {
    // Test 767px, 768px, 1069px, 1070px transitions
  });

  it('hides data completeness when 100% in stacked layout', () => {
    // Render card with 100% data, verify column hidden
  });
});
```

**Validation**:
- All new tests pass
- Coverage remains ≥90%
- No test flakiness

---

### Subtask 5: QA & Documentation
**Token Estimate**: 1K tokens
**Files**: `CLAUDE.md`, manual testing

1. Update CLAUDE.md if responsive patterns changed
2. Manual browser testing:
   - Chrome DevTools responsive mode (768px, 900px, 1024px, 1070px)
   - Firefox, Safari viewport testing
   - iPad (768x1024), iPad Pro (834x1194) simulation
3. Verify acceptance criteria met
4. Check for visual regressions on existing layouts

**Validation**:
- All acceptance criteria checked
- No visual regressions
- Documentation updated if needed
- Ready for code review

---

## Test Scenarios

### 1. Happy Path - Intermediate Layout
**Viewport**: 900px width
**Expected**: Last 3 columns (cost, data, checklist) stack vertically on right side, no horizontal overflow

### 2. Boundary - Desktop to Intermediate
**Viewport**: Resize from 1070px down to 768px
**Expected**: Smooth transition from full horizontal layout to stacked right column layout

### 3. Boundary - Intermediate to Mobile
**Viewport**: Resize from 768px down to 767px
**Expected**: Switches from horizontal + stacked to full mobile vertical layout

### 4. Data Completeness Conditional
**Viewport**: 900px width, college with 100% data completeness
**Expected**: Data completeness column hidden, only cost and checklist visible in stacked layout

### 5. Cost N/A Handling
**Viewport**: 900px width, college without cost data
**Expected**: "Cost N/A" placeholder displays correctly in stacked layout

### 6. Dark Mode Consistency
**Viewport**: 900px width, toggle dark mode
**Expected**: All colors, borders, backgrounds render correctly in intermediate layout

### 7. Long Content Truncation
**Viewport**: 900px width, college with very long name/location/major
**Expected**: Text truncates with ellipsis, no overflow or wrapping issues

### 8. Multiple Colleges
**Viewport**: 900px width, dashboard with 5+ colleges
**Expected**: All cards display consistently in intermediate layout, no horizontal scroll on page

---

## Dependencies

- **Blocker**: None
- **Related**: Existing responsive implementation in `college-card.tsx`
- **Follows**: None (standalone layout fix)

---

## Constraints

- Must not break mobile layout (<768px)
- Must not break desktop layout (≥1070px)
- Must maintain all existing functionality (urgency indicators, status badges, data completeness, checklist)
- Must preserve dark mode support
- Must maintain hover effects and cursor pointer
- Token budget: ~12K tokens

---

## Architecture Notes

### Current Breakpoints
- **Mobile**: `< 768px` - Full vertical layout
- **Desktop**: `≥ 768px` - Full horizontal layout (causes issue)

### New Breakpoints
- **Mobile**: `< 768px` - Full vertical layout (unchanged)
- **Intermediate**: `768px - 1069px` - Horizontal with stacked right column (new)
- **Desktop**: `≥ 1070px` - Full horizontal layout (unchanged)

### CSS Variables (from `globals.css` lines 86-90)
```css
--college-card-name-min: 320px;     /* Name column minimum width */
--college-card-details: 288px;      /* Location, major, dates */
--college-card-cost: 224px;         /* Cost breakdown */
--college-card-checklist: 96px;     /* Checklist progress */
--college-card-data: 96px;          /* Data completeness (conditional) */
```

These variables control desktop column widths. The intermediate layout will use different styling (stacked) so these variables may not apply directly to the 768-1070px range.

### Component Structure
- Mobile layout: lines 165-286 (unchanged)
- Desktop layout: lines 288-425 (will be modified for intermediate + desktop)

---

## Token Budget Breakdown

| Subtask | Estimate | Description |
|---------|----------|-------------|
| 1. Tailwind Config | 1K | Add `lg` breakpoint at 1070px |
| 2. Intermediate Layout | 6K | Implement stacked right column for md:lg range |
| 3. Edge Cases | 2K | Handle conditionals, dark mode, truncation |
| 4. Tests | 2K | Add responsive layout test coverage |
| 5. QA & Docs | 1K | Manual testing, documentation updates |
| **Total** | **12K** | |

---

## Related Files Reference

- **Main component**: `components/college-card.tsx` (430 lines)
- **Styles**: `app/globals.css` (CSS variables lines 86-90)
- **Config**: `tailwind.config.ts` (breakpoint configuration)
- **Tests**: `components/__tests__/college-card.test.tsx`
- **Related components**: `components/dashboard-client.tsx` (renders college cards)

---

## Acceptance Checklist

- [ ] No horizontal overflow at 768px viewport
- [ ] No horizontal overflow at 900px viewport
- [ ] No horizontal overflow at 1024px viewport
- [ ] No horizontal overflow at 1070px viewport
- [ ] Mobile layout (<768px) unchanged
- [ ] Desktop layout (≥1070px) unchanged
- [ ] Cost column displays correctly in stacked layout
- [ ] Data completeness column hides when 100% complete
- [ ] Checklist always visible in stacked layout
- [ ] "Cost N/A" placeholder works in stacked layout
- [ ] Urgency badges display correctly
- [ ] Dark mode works across all breakpoints
- [ ] Hover effects work smoothly
- [ ] Text truncation prevents overflow
- [ ] All Jest tests pass
- [ ] Test coverage ≥90%
- [ ] No ESLint errors
- [ ] Manual testing complete (Chrome, Firefox, Safari)
- [ ] No visual regressions detected

---

## Notes

- **Recommended approach**: Approach A from groomed requirement (stacked right column) chosen for better UX and content visibility
- **Alternative considered**: Approach B (reduce column widths) was simpler but caused text truncation issues
- **Breakpoint choice**: 1070px chosen to provide buffer above theoretical 1024px minimum, accounting for browser chrome and scrollbars
