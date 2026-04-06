# Ticket T00004: Compact View Toggle for College Dashboard

**Status**: READY
**Complexity**: MEDIUM
**Token Budget**: 28,000 tokens
**Priority**: P2
**Created**: 2026-04-03

## Description

Add a view density toggle (Normal/Compact) to the desktop dashboard that displays colleges in a more vertically-condensed format, allowing users to see more applications simultaneously. Compact view hides less-critical details (cost breakdown, urgency messages) with hover tooltips to reveal hidden content. The toggle appears in the top-right of the dashboard.

## Context

**Affected Files**:
- `components/dashboard-client.tsx` (103 lines) - Add view state management and toggle UI
- `components/college-card.tsx` (429 lines) - Add `compact` prop and conditional rendering logic
- `components/ui/switch.tsx` - **NEW**: Install shadcn switch component
- `components/ui/hover-card.tsx` - **NEW**: Install shadcn hover-card component
- `app/globals.css` - Add compact view CSS variables and transition styles
- `components/__tests__/college-card.test.tsx` - Add compact view test cases
- `components/__tests__/dashboard-client.test.tsx` - Add toggle interaction tests
- `e2e/compact-view.spec.ts` - **NEW**: E2E tests for compact view toggle and persistence

**Dependencies**:
- `@radix-ui/react-switch` (via shadcn/ui)
- `@radix-ui/react-hover-card` (via shadcn/ui)
- localStorage API for view preference persistence

**Implementation Approach**: Approach A (Compact Card Layout)
- Modify existing CollegeCard component with `compact` prop
- 30-40% vertical space reduction
- Minimal structural changes
- Preserve card-based UX
- Use HoverCard for cost breakdown popover

## Subtasks

### 1. Install shadcn Components and Setup State Management
**Estimated tokens**: 5,000

**Description**: Install required shadcn/ui components and add view mode state management to dashboard.

**Files**:
- `components/ui/switch.tsx` (NEW)
- `components/ui/hover-card.tsx` (NEW)
- `components/ui/label.tsx` (if not exists)
- `components/dashboard-client.tsx` (modify)

**Tasks**:
- [ ] Install shadcn switch component: `npx shadcn@latest add switch`
- [ ] Install shadcn hover-card component: `npx shadcn@latest add hover-card`
- [ ] Install shadcn label component if needed: `npx shadcn@latest add label`
- [ ] Add viewMode state to DashboardClient with localStorage initialization
- [ ] Add useEffect to persist viewMode changes to localStorage
- [ ] Render toggle UI in dashboard header (desktop only, `md:` breakpoint)
- [ ] Pass `compact={viewMode === 'compact'}` prop to CollegeCard components
- [ ] Verify toggle shows/hides correctly on mobile/desktop breakpoints

**Acceptance Criteria**:
- Switch component renders in top-right of dashboard on desktop (≥768px)
- Switch hidden on mobile (<768px)
- Clicking switch toggles between "normal" and "compact" modes
- viewMode state persists to localStorage (key: `college-dashboard-view-mode`)
- On page load, restores saved preference (default: "normal")

---

### 2. Implement Compact Card Rendering Logic
**Estimated tokens**: 10,000

**Description**: Add conditional rendering logic to CollegeCard component based on `compact` prop. Reduce padding, typography sizes, and hide non-critical sections.

**Files**:
- `components/college-card.tsx` (modify)

**Tasks**:
- [ ] Add `compact?: boolean` prop to CollegeCard interface
- [ ] Update card padding: `p-6` → `p-3` in compact mode
- [ ] Reduce typography sizes:
  - Title: `text-lg` → `text-sm font-bold`
  - Body: `text-sm` → `text-xs`
  - Badges: `text-xs` → `text-[10px]`
- [ ] Reduce spacing: `space-y-2`/`gap-2` → `space-y-1`/`gap-1` in compact mode
- [ ] Reduce icon sizes: `h-4 w-4` → `h-3.5 w-3.5` in compact mode
- [ ] Hide urgency message text in compact mode (show only icon/badge)
- [ ] Hide data completeness indicator if >80% in compact mode
- [ ] Truncate long college names at 40 characters with ellipsis
- [ ] Apply conditional styling to mobile and desktop layouts
- [ ] Verify readability with minimum 10px font size

**Acceptance Criteria**:
- In compact view, cards render with reduced padding (p-3) and smaller text
- Badges scale down appropriately without breaking layout
- Urgency message text hidden, only icon/badge visible
- Long names truncate with ellipsis after 40 characters
- Card height reduced by ~40% in compact mode
- All text remains readable (minimum 10px rendered size)

---

### 3. Add Cost Breakdown Hover Popover
**Estimated tokens**: 6,000

**Description**: Replace full cost breakdown with total cost display in compact view. Add HoverCard popover to reveal full breakdown on hover.

**Files**:
- `components/college-card.tsx` (modify)

**Tasks**:
- [ ] In compact mode, hide itemized cost breakdown (tuition+fees, room&board, other)
- [ ] Show only total cost with "Total: $XX,XXX" format
- [ ] Wrap total cost in HoverCard trigger component
- [ ] Configure HoverCard with 500ms `openDelay` to prevent flicker
- [ ] Render full cost breakdown inside HoverCardContent
- [ ] Position popover: `side="top"`, `align="start"`
- [ ] Style popover content with same typography as normal view
- [ ] Handle edge case: colleges with no cost data show "Cost N/A"
- [ ] Test hover interaction on desktop (not mobile)
- [ ] Verify popover closes when cursor moves away

**Acceptance Criteria**:
- In compact view, cost section shows only total cost (not breakdown)
- Hovering over total cost shows HoverCard after 500ms delay
- HoverCard displays full cost breakdown (tuition+fees, room&board, other, total)
- HoverCard positioned correctly (top, aligned left)
- Popover disappears when cursor moves away
- Colleges with no cost data show "Cost N/A" without errors

---

### 4. Add CSS Transitions and Styling
**Estimated tokens**: 3,000

**Description**: Add smooth height transition animations and compact view CSS variables to globals.css.

**Files**:
- `app/globals.css` (modify)

**Tasks**:
- [ ] Add CSS variable for compact card padding: `--card-padding-compact: 0.75rem`
- [ ] Add transition class for card height: `transition: height 300ms ease-in-out`
- [ ] Add compact card typography classes (if needed for consistency)
- [ ] Verify smooth animation when toggling between views
- [ ] Test transitions in both light and dark modes
- [ ] Ensure no layout shift or jank during transitions
- [ ] Verify transition works for all card sizes (with/without cost data, checklists)

**Acceptance Criteria**:
- Smooth 300ms height transition when toggling views
- No layout shift or visual jank during animation
- Transitions work in light and dark modes
- Cards animate gracefully regardless of content length

---

### 5. Add Tests and E2E Coverage
**Estimated tokens**: 4,000

**Description**: Add comprehensive unit tests for compact view rendering and E2E tests for toggle interaction and persistence.

**Files**:
- `components/__tests__/college-card.test.tsx` (modify)
- `components/__tests__/dashboard-client.test.tsx` (modify)
- `e2e/compact-view.spec.ts` (NEW)

**Tasks**:
- [ ] **Unit tests** - CollegeCard:
  - [ ] Renders with normal styles when `compact={false}`
  - [ ] Renders with compact styles when `compact={true}`
  - [ ] Hides urgency message text in compact mode
  - [ ] Shows only total cost in compact mode
  - [ ] Truncates long college names (>40 chars)
  - [ ] Handles missing cost data gracefully
- [ ] **Unit tests** - DashboardClient:
  - [ ] Renders toggle switch on desktop
  - [ ] Hides toggle switch on mobile
  - [ ] Toggles viewMode state when switch clicked
  - [ ] Passes correct `compact` prop to CollegeCard
- [ ] **E2E tests** - New file `e2e/compact-view.spec.ts`:
  - [ ] Toggle compact view and verify card height reduction
  - [ ] Verify toggle state persists after page reload
  - [ ] Hover over cost and verify popover appears
  - [ ] Test with college that has no cost data
  - [ ] Test with college with long name (truncation)
  - [ ] Verify toggle hidden on mobile viewport
  - [ ] Keyboard accessibility (Tab to switch, Enter/Space to toggle)
- [ ] Verify all tests pass with 90%+ coverage
- [ ] Run linter and fix any errors

**Acceptance Criteria**:
- All unit tests pass for compact rendering logic
- E2E tests cover toggle interaction, persistence, and hover popover
- Test coverage ≥90% for modified files
- No linter errors
- Tests run successfully in CI

---

## Acceptance Criteria (Overall)

- [ ] Toggle switch appears in top-right of dashboard on desktop (`md:` breakpoint and above)
- [ ] Switch labeled "Compact View" with proper ARIA attributes
- [ ] Clicking switch toggles between normal and compact view
- [ ] View preference persists to localStorage (key: `college-dashboard-view-mode`)
- [ ] On page load, restores saved view preference (default: "normal")
- [ ] In compact view, college cards render with reduced padding (`p-3`), smaller text, smaller badges
- [ ] In compact view, cost section shows only total cost, not breakdown
- [ ] Hovering over total cost in compact view shows HoverCard with full breakdown after 500ms
- [ ] In compact view, urgency message text is hidden, only icon/badge shown
- [ ] Card height in compact view is ~40% shorter than normal view
- [ ] Smooth height transition animation when toggling views (300ms ease)
- [ ] Mobile view unchanged (compact toggle hidden on mobile)
- [ ] All text remains readable in compact view (minimum 10px font size)
- [ ] Long college names (>40 chars) truncate with ellipsis
- [ ] Colleges with no cost data show "Cost N/A" without errors
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors
- [ ] E2E tests verify toggle persistence and hover interactions

## Test Scenarios

### 1. Happy Path - Toggle Compact View
**Given**: Dashboard loaded with 5 colleges
**When**: User clicks "Compact View" switch
**Then**:
- Cards render with reduced height (~40% shorter)
- Cost breakdown hidden, only total shown
- Urgency message text hidden
- Toggle state saved to localStorage

### 2. Persistence - View Preference Saved
**Given**: User toggles to compact view
**When**: User refreshes page
**Then**: Compact view persists after reload

### 3. Hover Interaction - Cost Breakdown
**Given**: Compact view enabled
**When**: User hovers over "Total: $50,000" text
**Then**:
- HoverCard appears after 500ms showing full breakdown
- Popover disappears when cursor moves away

### 4. Edge Case - Missing Cost Data
**Given**: College has no cost data
**When**: Compact view enabled
**Then**: "Cost N/A" shown, no errors thrown

### 5. Edge Case - Long College Name
**Given**: College named "Massachusetts Institute of Technology - Engineering"
**When**: Compact view enabled
**Then**:
- Name truncated with ellipsis after ~40 characters
- Full name shown in tooltip on hover (future enhancement)

### 6. Responsive - Mobile Behavior
**Given**: Dashboard viewed on mobile (<768px)
**When**: Page loads
**Then**:
- Compact toggle does NOT appear
- Cards render in existing mobile layout

### 7. Accessibility - Keyboard Navigation
**Given**: Dashboard loaded on desktop
**When**: User tabs to compact view switch and presses Enter/Space
**Then**:
- View toggles correctly
- Screen reader announces "Compact view enabled/disabled"

## Technical Notes

**localStorage Schema**:
```typescript
// Key: "college-dashboard-view-mode"
// Values: "normal" | "compact"
localStorage.setItem("college-dashboard-view-mode", "compact");
```

**State Management Pattern**:
```typescript
const [viewMode, setViewMode] = useState<'normal' | 'compact'>(() => {
  if (typeof window === 'undefined') return 'normal';
  return (localStorage.getItem('college-dashboard-view-mode') as 'normal' | 'compact') || 'normal';
});

useEffect(() => {
  localStorage.setItem('college-dashboard-view-mode', viewMode);
}, [viewMode]);
```

**HoverCard Configuration**:
```typescript
<HoverCard openDelay={500}>
  <HoverCardTrigger asChild>
    <div className="text-sm font-semibold cursor-help">
      Total: {formatCurrency(costData.total)}
    </div>
  </HoverCardTrigger>
  <HoverCardContent side="top" align="start">
    {/* Full cost breakdown */}
  </HoverCardContent>
</HoverCard>
```

## Related Files

- `/Users/vdzeravianko/work/sources/opt1/my/coa/components/dashboard-client.tsx`
- `/Users/vdzeravianko/work/sources/opt1/my/coa/components/college-card.tsx`
- `/Users/vdzeravianko/work/sources/opt1/my/coa/app/globals.css`
- `/Users/vdzeravianko/work/sources/opt1/my/coa/components/__tests__/college-card.test.tsx`
- `/Users/vdzeravianko/work/sources/opt1/my/coa/components/__tests__/dashboard-client.test.tsx`

## References

- Groomed requirement: `.claude/workflows/requirements/groomed/compact-table-view.md`
- shadcn/ui Switch: https://ui.shadcn.com/docs/components/switch
- shadcn/ui HoverCard: https://ui.shadcn.com/docs/components/hover-card
- CLAUDE.md: Component Organization section
- Existing responsive layout: `college-card.tsx` lines 166-286 (mobile), 289-426 (desktop)

## Definition of Done

- [ ] All 5 subtasks completed
- [ ] All acceptance criteria met
- [ ] All test scenarios pass (unit + E2E)
- [ ] Test coverage ≥90% for modified files
- [ ] No linter errors or warnings
- [ ] Code reviewed and approved
- [ ] Feature works in Chrome, Firefox, Safari
- [ ] Mobile behavior verified (toggle hidden, cards unchanged)
- [ ] Dark mode styling verified
- [ ] Documentation updated if needed
