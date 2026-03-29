# Requirement: Separate Data Completeness into Its Own Column

## What I Want

Split the current "Progress" column into two separate columns:
1. **Checklist Progress** - Always visible, shows "6/7 checklist"
2. **Data Completeness** - Conditionally visible ONLY when data completeness < 100%, shows "2/7 data"

When data completeness reaches 100%, the Data Completeness column should completely disappear, making the card narrower.

## Why

Data gathering progress is only useful while you're still collecting information. Once a college has 100% data completeness, there's no need to show that column anymore - it just takes up space. This keeps the UI cleaner and focuses attention on colleges that still need data gathering work.

## Current State (from Screenshot)

Desktop layout has 4 columns:
1. **Name & Badges** (flex-1)
2. **Details** (location, dates)
3. **Cost** (breakdown)
4. **Progress** (combined: checklist + data completeness)

Example:
```
┌─────────────┬──────────────┬──────────────┬──────────┐
│ Test        │ N/A          │ Tuition+Fees │    6/7   │
│ MATCH       │ CS           │ $50,000      │ checklist│
│ Regular     │ App: 10/04   │ Room&Board   │          │
│ WARNING     │ FinAid: 4/7  │ $18,000      │    2/7   │
│             │              │ Total $82K   │   data   │
└─────────────┴──────────────┴──────────────┴──────────┘
```

## Desired State

Desktop layout with 5 columns (when data < 100%):
1. **Name & Badges** (flex-1)
2. **Details** (location, dates)
3. **Cost** (breakdown)
4. **Checklist** (always visible)
5. **Data Completeness** (conditional, hidden when 100%)

Example when data < 100%:
```
┌─────────────┬──────────────┬──────────────┬──────────┬──────┐
│ Test        │ N/A          │ Tuition+Fees │    6/7   │ 2/7  │
│ MATCH       │ CS           │ $50,000      │ checklist│ data │
│ Regular     │ App: 10/04   │ Room&Board   │          │      │
│ WARNING     │ FinAid: 4/7  │ $18,000      │          │      │
│             │              │ Total $82K   │          │      │
└─────────────┴──────────────┴──────────────┴──────────┴──────┘
```

Example when data = 100%:
```
┌─────────────┬──────────────┬──────────────┬──────────┐
│ Test        │ N/A          │ Tuition+Fees │    6/7   │
│ MATCH       │ CS           │ $50,000      │ checklist│
│ Regular     │ App: 10/04   │ Room&Board   │          │
│             │ FinAid: 4/7  │ $18,000      │          │
│             │              │ Total $82K   │          │
└─────────────┴──────────────┴──────────────┴──────────┘
```

## Constraints

- Mobile layout should remain unchanged (vertical stacking)
- Desktop layout only (md: breakpoint)
- Need to update CSS custom properties if we want column widths to be adjustable
- Transition should be smooth when data completeness reaches 100%

## Technical Details

**Files to modify:**
- `components/college-card.tsx` - Desktop layout section (lines ~329-344)
- Possibly `app/globals.css` - Add CSS variable for data completeness column width

**Current Progress column structure:**
```tsx
<div className="flex-shrink-0 w-32 p-6 border-l flex flex-col justify-center items-center gap-3">
  {/* Checklist */}
  <div className="flex flex-col items-center gap-1">
    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
    <span className="text-sm font-medium">
      {checklistProgress.completed}/{checklistProgress.total}
    </span>
    <span className="text-xs text-muted-foreground">complete</span>
  </div>

  {/* Data completeness (from PR #4) */}
  <div className="flex flex-col items-center gap-1 pt-2 border-t w-full">
    {dataCompletenessIcon}
    <span className="text-sm font-medium">
      {dataCompleteness.overall.completed}/{dataCompleteness.overall.total}
    </span>
    <span className="text-xs text-muted-foreground">data</span>
  </div>
</div>
```

## Acceptance Criteria

- [ ] Checklist progress moved to its own column (always visible)
- [ ] Data completeness moved to its own separate column
- [ ] Data completeness column only renders when `dataCompleteness.overall.percentage < 100`
- [ ] Column widths are reasonable (suggest: checklist ~100px, data completeness ~100px)
- [ ] Mobile layout unchanged
- [ ] No layout shift when data completeness reaches 100% (smooth transition)
- [ ] Icons and formatting remain consistent with current design
- [ ] Works with CSS custom properties for easy width adjustment

## Notes

This change is only for desktop layout (`hidden md:flex`). Mobile vertical layout should keep both metrics together as it is now.
