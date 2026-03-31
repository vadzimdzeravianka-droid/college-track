# Requirement: Compact View Toggle for College Dashboard

## Original Request
I want to have a switch on UI in desktop mode to compact view, where data represented more compact (especially in vertically). It should be simple shadcn switch to the top right of the table to get into compact / normal view. Compact view might hide some unimportant data (for example compact view only show total price, not a whole breakdown, but on mouse hover show missed details). I thought it is a compact == shadcn table, but you may consider different options. We must think through color, font size, font type (bold, maybe italic), text position and alignment to make it readable.

## Why
To have better view on multiple applications at the same time.

## Groomed Specification

Add a view density toggle (Normal/Compact) to the desktop dashboard that displays colleges in a more vertically-condensed format, allowing users to see more applications simultaneously. Compact view hides less-critical details (cost breakdown, minor status info) with hover tooltips to reveal hidden content. The toggle appears in the top-right of the dashboard.

**Complexity**: MEDIUM
**Token Budget**: ~28K tokens

### Context
- **Affected areas**:
  - `components/dashboard-client.tsx` - Add view state and toggle UI
  - `components/college-card.tsx` - Add `compact` prop and conditional rendering
  - `components/ui/switch.tsx` - Use existing shadcn switch component
  - `components/ui/table.tsx` - NEW: Add shadcn table component (if choosing Approach B)
  - `app/globals.css` - Add compact view CSS variables/custom styles
- **Dependencies**:
  - `@radix-ui/react-switch` (already installed via shadcn/ui)
  - Optional: Install shadcn table component if using Approach B
- **Related features**:
  - Existing responsive layout (mobile/desktop) in `college-card.tsx`
  - Dashboard filters in `dashboard-filters.tsx`
  - View preference could be persisted to localStorage

### Implementation Approaches

**Approach A: Compact Card Layout**

Modify existing `CollegeCard` component to accept a `compact` prop. In compact mode:
- Reduce padding from `p-6` to `p-3`
- Use smaller typography (`text-sm` → `text-xs`, `text-lg` → `text-sm`)
- Hide cost breakdown, show only total with hover popover
- Hide urgency message text, show only icon
- Reduce badge sizes
- Stack sections horizontally more aggressively (reduce column widths)
- Remove data completeness indicator if >80%

**Flow**:
1. User clicks switch in dashboard header → `setViewMode('compact')`
2. `DashboardClient` passes `compact={viewMode === 'compact'}` to each `CollegeCard`
3. Card renders conditionally based on `compact` prop
4. Hover on collapsed sections shows `Tooltip` or `HoverCard` with full details

**Pros**:
- Minimal changes to existing component structure
- Maintains card-based mental model
- Easier to implement (~20K tokens)
- No new shadcn components needed
- Preserves existing hover/click behaviors

**Cons**:
- Still relatively large compared to true table view
- Limited vertical space savings (maybe 30-40% reduction)

**Token Estimate**: ~20K tokens

**Approach B: True Table View (with shadcn Table component)**

Replace card grid with shadcn Table component in compact mode. Each college becomes a table row with columns:
- Name (with category/status/strategy badges inline)
- Location
- Major
- Deadline (app only, with urgency indicator)
- Cost (total only, hover for breakdown)
- Checklist (icon + progress)
- Actions (link to detail page)

**Flow**:
1. User clicks switch → `setViewMode('compact')`
2. `DashboardClient` renders `<CollegeTable colleges={sortedColleges} />` instead of card grid
3. Table uses fixed row height (48px), condensed typography
4. Hover on row highlights entire row, hover on cost cell shows popover with breakdown

**Pros**:
- Maximum vertical density (10-15 colleges visible at once vs. 3-4 in card view)
- Scannable tabular format for comparison
- Familiar spreadsheet-like UX
- Can add column sorting later

**Cons**:
- More token-intensive (~35K tokens with table component setup)
- Requires installing shadcn table component
- Bigger UX shift from current cards
- May feel less visually appealing than cards

**Token Estimate**: ~35K tokens

**Approach C: Hybrid - Compressed Cards with Table-like Structure**

Keep cards but make them extremely compact (single-row horizontal layout, ~60px height) with table-like structure. Each card becomes a fixed-height row with sections aligned like table columns.

**Pros**:
- Best of both worlds: visual cards + table density
- ~25K tokens (middle ground)
- No new components, just CSS refinement

**Cons**:
- Harder to make responsive
- May feel cramped on smaller desktop screens

**Token Estimate**: ~25K tokens

**Recommended**: Approach A (Compact Card Layout) for initial implementation. It provides good vertical space savings (30-40%) with minimal code changes and preserves the existing card-based UX. If user feedback requests even more density, upgrade to Approach B later.

### Edge Cases & Validation

#### Data Validation
- Missing data fields: Compact view should gracefully handle null fields (show placeholder or skip)
- Long college names: Truncate with ellipsis after 40 characters, show full name on hover
- Cost data absent: Show "Cost N/A" instead of trying to render breakdown

#### State Management
- View preference persistence: Save `viewMode` to localStorage, restore on page load
- Default view: Start with "normal" view on first visit
- Mobile: Compact toggle only shows on desktop (`md:` breakpoint), mobile always uses current responsive layout

#### User Experience
- Smooth transitions: Animate height changes when toggling views (CSS transition on card height)
- Hover targets: In compact view, ensure hover areas are large enough (min 40px for tooltips)
- Tooltip delays: Use 500ms delay before showing tooltip to avoid flicker on cursor movement
- Loading states: When toggling view, show brief skeleton or fade transition

#### Performance
- With 50 colleges: Rendering 50 compact cards should be <100ms (acceptable)
- With 200 colleges: May need virtualization (defer to future if needed)
- Tooltip performance: Use `HoverCard` from shadcn (lazy-renders content)

#### Accessibility
- Switch component: Use proper ARIA labels ("Toggle compact view")
- Keyboard navigation: Switch should be focusable and togglable with Enter/Space
- Screen readers: Announce view mode change ("Compact view enabled")
- Tooltips: Should be accessible via keyboard focus, not just hover

### Typography & Styling for Compact View

**Normal View** (current):
- Card padding: `p-6`
- Title: `text-lg font-semibold`
- Body text: `text-sm`
- Badge text: `text-xs`
- Section spacing: `space-y-2` / `gap-2`

**Compact View** (proposed):
- Card padding: `p-3`
- Title: `text-sm font-bold` (bold for readability at smaller size)
- Body text: `text-xs`
- Badge text: `text-[10px]` (smallest readable size)
- Section spacing: `space-y-1` / `gap-1`
- Color: Increase contrast slightly (darken muted-foreground to improve readability)
- Font: Keep existing font stack (system fonts), rely on bold weight for hierarchy
- Alignment: Tighter alignment, reduce icon sizes from `h-4 w-4` to `h-3.5 w-3.5`

**Hover Popover** (for hidden details):
- Use `HoverCard` component from shadcn/ui
- Show full cost breakdown in popover on hover over total cost
- Use same typography as normal view inside popover (don't compress)

### Acceptance Criteria

- [ ] Toggle switch appears in top-right of dashboard on desktop (`md:` breakpoint and above)
- [ ] Switch labeled "Compact View" with proper ARIA attributes
- [ ] Clicking switch toggles between normal and compact view
- [ ] View preference persists to localStorage (key: `college-dashboard-view-mode`)
- [ ] On page load, restores saved view preference (default: "normal")
- [ ] In compact view, college cards render with reduced padding (`p-3`), smaller text, smaller badges
- [ ] In compact view, cost section shows only total cost, not breakdown
- [ ] Hovering over total cost in compact view shows `HoverCard` with full breakdown
- [ ] In compact view, urgency message text is hidden, only icon/badge shown
- [ ] Card height in compact view is ~40% shorter than normal view
- [ ] Smooth height transition animation when toggling views (300ms ease)
- [ ] Mobile view unchanged (compact toggle hidden on mobile)
- [ ] All text remains readable in compact view (minimum 10px font size)
- [ ] Hover tooltips show after 500ms delay (prevent flicker)
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors

### Test Scenarios

1. **Happy path - Toggle compact view**:
   - Load dashboard with 5 colleges
   - Click "Compact View" switch
   - Verify cards render with reduced height and padding
   - Verify cost breakdown hidden, only total shown
   - Verify toggle state saved to localStorage

2. **Persistence**:
   - Toggle to compact view
   - Refresh page
   - Verify compact view persists after page reload

3. **Hover interaction - Cost breakdown**:
   - Enable compact view
   - Hover over "Total: $50,000" text
   - Verify `HoverCard` appears after 500ms showing full breakdown
   - Move cursor away → verify popover disappears

4. **Edge case - Missing data**:
   - College has no cost data
   - Enable compact view
   - Verify "Cost N/A" shown, no errors thrown

5. **Edge case - Long college name**:
   - College named "Massachusetts Institute of Technology - Engineering"
   - Enable compact view
   - Verify name truncated with ellipsis after ~40 characters
   - Hover on name → verify full name shown in tooltip

6. **Responsive - Mobile**:
   - View dashboard on mobile breakpoint (<768px)
   - Verify compact toggle does NOT appear
   - Verify cards render in existing mobile layout

7. **Accessibility - Keyboard**:
   - Tab to compact view switch
   - Press Enter → verify view toggles
   - Press Space → verify view toggles
   - Screen reader announces "Compact view enabled"

### Technical Implementation Notes

**localStorage Schema**:
```typescript
// Key: "college-dashboard-view-mode"
// Values: "normal" | "compact"
localStorage.setItem("college-dashboard-view-mode", "compact");
```

**Component Structure** (Approach A):
```typescript
// dashboard-client.tsx
const [viewMode, setViewMode] = useState<'normal' | 'compact'>(() => {
  if (typeof window === 'undefined') return 'normal';
  return (localStorage.getItem('college-dashboard-view-mode') as 'normal' | 'compact') || 'normal';
});

useEffect(() => {
  localStorage.setItem('college-dashboard-view-mode', viewMode);
}, [viewMode]);

// Render:
<div className="flex items-center justify-between mb-4">
  <DashboardFilters ... />
  <div className="hidden md:flex items-center gap-2">
    <Label htmlFor="view-mode" className="text-sm">Compact View</Label>
    <Switch
      id="view-mode"
      checked={viewMode === 'compact'}
      onCheckedChange={(checked) => setViewMode(checked ? 'compact' : 'normal')}
    />
  </div>
</div>

<CollegeCard college={college} compact={viewMode === 'compact'} />
```

**College Card Compact Rendering**:
```typescript
// college-card.tsx
export function CollegeCard({ college, compact = false }: { college: College; compact?: boolean }) {
  return (
    <Card className={cn(
      "transition-all duration-300",
      compact && "compact-card" // Custom CSS class
    )}>
      <div className={cn(
        compact ? "p-3 space-y-1" : "p-6 space-y-2"
      )}>
        {/* Conditional rendering based on compact prop */}
      </div>
    </Card>
  );
}
```

**Custom CSS** (globals.css):
```css
/* Compact view transitions */
.compact-card {
  --card-padding: 0.75rem; /* 12px */
}

.compact-card .college-title {
  font-size: 0.875rem; /* 14px */
  font-weight: 700;
}

/* Smooth height transition */
.college-card-wrapper {
  transition: height 300ms ease-in-out;
}
```

### Cost Breakdown Hover Implementation

Use shadcn `HoverCard` for cost breakdown popover:

```typescript
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

// In compact view:
<HoverCard openDelay={500}>
  <HoverCardTrigger asChild>
    <div className="text-sm font-semibold cursor-help">
      Total: {formatCurrency(costData.total)}
    </div>
  </HoverCardTrigger>
  <HoverCardContent side="top" align="start">
    <div className="space-y-1">
      <div className="text-xs">Cost Breakdown:</div>
      {costData.tuitionAndFees && (
        <div className="text-xs">Tuition + Fees: {formatCurrency(costData.tuitionAndFees)}</div>
      )}
      {costData.roomAndBoard && (
        <div className="text-xs">Room & Board: {formatCurrency(costData.roomAndBoard)}</div>
      )}
      {costData.other && (
        <div className="text-xs">Other: {formatCurrency(costData.other)}</div>
      )}
    </div>
  </HoverCardContent>
</HoverCard>
```

### Future Enhancements (Out of Scope)

- Column sorting in table view (if upgrading to Approach B)
- User-configurable density levels (Comfortable/Compact/Dense)
- Hide specific columns in compact view (user preference)
- Virtualized scrolling for 500+ colleges

### References
- CLAUDE.md: Component Organization (`components/college-card.tsx`)
- Existing responsive layout: `college-card.tsx` lines 166-286 (mobile) and 289-426 (desktop)
- shadcn/ui Switch: https://ui.shadcn.com/docs/components/switch
- shadcn/ui HoverCard: https://ui.shadcn.com/docs/components/hover-card
- shadcn/ui Table (if needed): https://ui.shadcn.com/docs/components/table
