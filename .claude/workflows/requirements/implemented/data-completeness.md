# Requirement: Data Gathering Completeness Tracker

## Original Request
I want to track data gatetherin completeness progress. What I mean, seems like the case is that first we only have a name of univercities, then we will gather some data and update and so on and so on. Thinking this way only title supppose to be requied field. Last column should ellustrate this progress, like
(alert|warning|check) 15/20 data collected.
(alert|warning|check) 6/7 <whatever name of current >
clickable (open in new widnow) link to portal

Also we need to separate card, I think it could be placed under Checklist on application view page.

## Enriched Requirement

Add a data completeness tracking system that shows how much information has been gathered about each college (separate from application checklist progress). Track progress across different data categories (Basic Info, Deadlines, Portal, Cost) and display with visual indicators (alert/warning/check icons). Show summary in dashboard's progress column and detailed breakdown in a new card on the detail page.

### Context
- **Affected areas**:
  - `lib/utils.ts` - Add `getDataCompleteness()` calculation function
  - `components/college-card.tsx` - Add data completeness section to Progress column (lines 329-344)
  - `app/(protected)/college/[id]/page.tsx` - Add DataCompleteness card under Checklist (after line 125)
  - `components/data-completeness-card.tsx` - New component showing category breakdown
  - `types/index.ts` or inline - Type definitions for completeness structure
- **Dependencies**: None (uses existing College model fields)
- **Related features**:
  - Existing checklist progress tracking (this is different - tracks data gathering, not application tasks)
  - Urgency calculation system in `lib/utils.ts` (similar pattern for thresholds)
- **Key distinction**: Application checklist = "Have we submitted materials?" vs Data completeness = "How much do we know about this college?"

### Current State Analysis

**College Model Fields** (from `prisma/schema.prisma`):

**Always required**:
- `name`, `category`, `strategy`

**Optional fields** (data gathering targets):
- `location` - Basic Info
- `major` - Basic Info
- `deadlineApp` - Deadlines (critical)
- `deadlineFinaid` - Deadlines
- `portalUrl` - Portal Access
- `portalUser` - Portal Access
- `portalPassword` - Portal Access
- `costTuition`, `costRoomBoard`, `costFees`, `costBooks`, `costPersonal`, `costOther`, `isInState` - Cost of Attendance (7 fields)
- `notes` - Additional Notes

**Total trackable fields**: 17 fields across 5 categories

### Data Categorization

```typescript
const DATA_CATEGORIES = {
  basic: {
    name: "Basic Info",
    fields: ["location", "major"],
    weight: 1.0,  // All equal weight
    icon: "MapPin" // from lucide-react
  },
  deadlines: {
    name: "Deadlines",
    fields: ["deadlineApp", "deadlineFinaid"],
    weight: 1.0,
    icon: "Calendar"
  },
  portal: {
    name: "Portal Access",
    fields: ["portalUrl", "portalUser", "portalPassword"],
    weight: 1.0,
    icon: "KeyRound"
  },
  cost: {
    name: "Cost Info",
    fields: ["costTuition", "costRoomBoard", "costFees", "costBooks", "costPersonal", "costOther", "isInState"],
    weight: 1.0,
    icon: "DollarSign"
  },
  notes: {
    name: "Notes",
    fields: ["notes"],
    weight: 0.5,  // Optional/bonus category
    icon: "FileText"
  }
};
```

## Implementation Approaches

### Approach A: Calculated Completeness with Category Breakdown (Recommended)
**Description**: Create utility function `getDataCompleteness(college)` that calculates completeness on-the-fly similar to existing `getChecklistProgress()`. Returns overall score and per-category breakdown.

```typescript
// lib/utils.ts
interface DataCategory {
  name: string;
  completed: number;
  total: number;
  percentage: number;
  status: "complete" | "good" | "warning" | "alert";
  icon: string;
}

interface DataCompleteness {
  categories: DataCategory[];
  overall: {
    completed: number;
    total: number;
    percentage: number;
  };
  status: "complete" | "good" | "warning" | "alert";
  missingFields: string[]; // for hints
}

function getDataCompleteness(college: College): DataCompleteness {
  // For each category, count non-null fields
  // Calculate percentage
  // Determine status based on thresholds
  // Return structured data
}
```

**Thresholds**:
- `complete`: 100%
- `good`: 75-99% (green check icon)
- `warning`: 40-74% (yellow warning icon)
- `alert`: 0-39% (red alert icon)

**Display on Dashboard**:
```
┌─ Progress Column ─────────┐
│ ✓ Checklist: 8/10         │
│ ⚠ Data: 12/17 (71%)       │  ← New
└───────────────────────────┘
```

**Display on Detail Page** (new card):
```
┌─ Data Completeness ────────────────┐
│ Overall Progress: 12/17 (71%)      │
│ ──────────────────────────────────│
│ ✓ Basic Info:     2/2  (100%)     │
│ ✓ Deadlines:      2/2  (100%)     │
│ ⚠ Portal Access:  2/3  (67%)      │
│   Missing: Password                │
│   📎 Open Portal (new window) ←link│
│ ⚠ Cost Info:      5/7  (71%)      │
│   Missing: Books, Personal         │
│ ✓ Notes:          1/1  (100%)     │
└────────────────────────────────────┘
```

**Pros**:
- No database schema changes
- Data always current
- Similar pattern to existing `getChecklistProgress()`
- Easy to adjust categories/weights
- Can calculate per-category status independently

**Cons**:
- Recalculates on every render (mitigated with useMemo)
- Slightly more complex logic than simple count

**Token Estimate**: ~25K tokens (utility function + dashboard integration + new card component + tests)

### Approach B: Simplified Score (No Categories)
**Description**: Just count filled fields vs total fields, show single progress bar.

```typescript
function getDataCompleteness(college: College): { completed: number; total: number; percentage: number } {
  const fields = [
    college.location, college.major, college.deadlineApp,
    college.deadlineFinaid, college.portalUrl, // ... etc
  ];
  const completed = fields.filter(f => f !== null && f !== undefined).length;
  return { completed, total: fields.length, percentage: (completed / fields.length) * 100 };
}
```

**Display**: "Data: 12/17 (71%)" with single icon

**Pros**:
- Simplest implementation
- Quick to build
- Lower token usage (~15K)

**Cons**:
- Less informative (user can't see which category needs work)
- Doesn't meet requirement "6/7 <whatever name of current>"
- No clear next action for user

**Token Estimate**: ~15K tokens

### Approach C: Stored Completeness in Database
**Description**: Add `DataCompleteness` model to database, update on every college save.

```prisma
model DataCompleteness {
  id              String   @id @default(uuid())
  collegeId       String   @unique
  overallScore    Int
  basicScore      Int
  deadlinesScore  Int
  portalScore     Int
  costScore       Int
  updatedAt       DateTime @updatedAt

  college         College  @relation(fields: [collegeId], references: [id])
}
```

**Pros**:
- Pre-calculated (no runtime cost)
- Could enable querying/sorting by completeness
- Historical tracking possible

**Cons**:
- Requires Prisma migration
- Must update on every college edit (server action complexity)
- Overkill for current need
- Data redundancy (can be calculated from College)
- More token-intensive (~35K)

**Token Estimate**: ~35K tokens

**Recommended**: Approach A - provides category breakdown as requested, no schema changes, follows existing patterns.

## Edge Cases & Considerations

### Field Nullability
- **Empty string vs null**: Treat empty strings as incomplete (`if (!field || field === '')`)
- **Zero values**: `costBooks: 0` is valid data (book fee waived), count as complete
- **Boolean false**: `isInState: false` is valid data, count as complete

### Category Completeness
- **Portal Access**: Should we require all 3 fields or consider URL alone as "partial"?
  - Decision: All 3 required for 100%, but show "2/3 (67%)" if partial
- **Cost Info**: 7 fields, user might not know all costs initially
  - Decision: Show granular progress, any cost data is better than none
- **Notes**: Should it count toward overall?
  - Decision: Include but with lower weight (0.5x), or make it a "bonus" category

### Status Thresholds
- **Individual category**: Each category gets its own status icon
  - 100% = ✓ check (green)
  - 50-99% = ⚠ warning (yellow)
  - 0-49% = 🚨 alert (red)
- **Overall status**: Based on weighted average of all categories

### Portal Link Behavior
- Open in new window: `target="_blank" rel="noopener noreferrer"`
- If `portalUrl` is null, show "Add portal URL" prompt
- Validate URL format on display (handle missing https://)

### Performance
- `getDataCompleteness()` called for each college card
- Solution: Use `useMemo` in client component, dependencies on relevant fields
- With 50 colleges: negligible impact (simple field checks)

### Mobile vs Desktop
- Dashboard: Keep compact "12/17 (71%)" format on mobile
- Detail card: Full breakdown on both mobile and desktop

## Acceptance Criteria

- [ ] Utility function `getDataCompleteness(college)` returns overall and per-category completeness
- [ ] Dashboard college cards show data completeness below checklist progress in Progress column
- [ ] Data completeness displays as "X/Y (Z%)" format with status icon (✓/⚠/🚨)
- [ ] Detail page has new "Data Completeness" card positioned below Checklist card
- [ ] Detail page card shows per-category breakdown with individual status icons
- [ ] Each category line shows "Category Name: X/Y (Z%)" format
- [ ] Categories with missing data show "Missing: field1, field2" hint
- [ ] Portal Access section shows clickable link that opens in new window (if portalUrl exists)
- [ ] Portal link has proper security attributes (`rel="noopener noreferrer"`)
- [ ] Completeness thresholds: complete (100%), good (75-99%), warning (40-74%), alert (0-39%)
- [ ] Empty strings and null both count as incomplete
- [ ] Zero and false values count as complete (valid data)
- [ ] Component uses `useMemo` to avoid recalculation on unrelated re-renders
- [ ] Mobile layout remains compact and readable
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors

## Test Scenarios

1. **New college** (only name/category/strategy): Overall 0/17 (0%), all categories show alert
2. **Partial data**: College with 2/2 basic, 1/2 deadlines, 0/3 portal, 3/7 cost
   - Basic: ✓ complete
   - Deadlines: ⚠ warning (50%)
   - Portal: 🚨 alert (0%)
   - Cost: ⚠ warning (43%)
   - Overall: 6/17 (35%) alert
3. **Complete data**: All 17 fields filled
   - All categories: ✓ complete
   - Overall: 17/17 (100%) complete
4. **Portal link click**: Click link in Data Completeness card, opens in new window
5. **Empty string handling**: `location: ""` counts as incomplete (0/2 basic)
6. **Zero value handling**: `costBooks: 0` counts as complete (1/7 cost)
7. **Missing portal URL**: Portal section shows "Add portal URL" instead of link
8. **Long category breakdown**: College with many missing fields shows readable "Missing: X, Y, Z" list
9. **Performance**: Dashboard with 50 colleges renders without lag

## UI Specifications

### Dashboard Integration (college-card.tsx)

**Desktop Progress Column** (currently lines 329-344):
```tsx
<div className="flex-shrink-0 w-32 p-6 border-l flex flex-col justify-center items-center gap-3">
  {/* Existing checklist progress */}
  <div className="flex flex-col items-center gap-1">
    <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
    <span className="text-sm font-medium">
      {checklistProgress.completed}/{checklistProgress.total}
    </span>
    <span className="text-xs text-muted-foreground">checklist</span>
  </div>

  {/* NEW: Data completeness */}
  <div className="flex flex-col items-center gap-1 pt-2 border-t w-full">
    {dataCompletenessIcon}
    <span className="text-sm font-medium">
      {dataCompleteness.overall.completed}/{dataCompleteness.overall.total}
    </span>
    <span className="text-xs text-muted-foreground">data</span>
  </div>
</div>
```

### Detail Page Card (new component)

Position: After Checklist card in sidebar (desktop line 295, mobile line 114)

```tsx
<Card>
  <CardHeader>
    <CardTitle>Data Completeness</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {/* Overall */}
      <div className="flex items-center justify-between pb-3 border-b">
        <span className="font-medium">Overall Progress</span>
        <div className="flex items-center gap-2">
          {overallIcon}
          <span className="font-semibold">
            {overall.completed}/{overall.total} ({overall.percentage}%)
          </span>
        </div>
      </div>

      {/* Per-category */}
      {categories.map(category => (
        <div key={category.name} className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{category.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {categoryIcon}
              <span className="text-sm">
                {category.completed}/{category.total} ({category.percentage}%)
              </span>
            </div>
          </div>

          {/* Missing fields hint */}
          {category.missingFields.length > 0 && (
            <div className="text-xs text-muted-foreground ml-6">
              Missing: {category.missingFields.join(", ")}
            </div>
          )}

          {/* Portal link (if Portal Access category) */}
          {category.name === "Portal Access" && college.portalUrl && (
            <a
              href={college.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline ml-6 flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Open Portal
            </a>
          )}
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

### Icon Mapping

- **Complete (100%)**: `<CheckCircle2 className="text-green-500" />`
- **Good (75-99%)**: `<CheckCircle2 className="text-green-500" />`
- **Warning (40-74%)**: `<AlertTriangle className="text-yellow-500" />`
- **Alert (0-39%)**: `<AlertCircle className="text-destructive" />`

## Token Budget Estimate

- **Utility function**: 8K tokens (`getDataCompleteness`, category definitions, status logic, tests)
- **Dashboard integration**: 5K tokens (modify college-card.tsx Progress column, add icons)
- **Detail page card**: 8K tokens (new DataCompletenessCard component)
- **Testing**: 6K tokens (unit tests for utility, integration tests for display)
- **Type definitions**: 2K tokens (TypeScript interfaces)
- **Total**: ~29K tokens

## References

- Current checklist progress: `components/college-card.tsx` lines 39-57 (getChecklistProgress function)
- Existing urgency thresholds: `lib/utils.ts` lines 78-149 (getUrgencyLevel function)
- Status badge patterns: `components/status-badge.tsx` (color scheme reference)
- College schema: `prisma/schema.prisma` lines 31-58
- Detail page layout: `app/(protected)/college/[id]/page.tsx` lines 286-305 (sidebar)
- CLAUDE.md: Server Actions Pattern, Urgency Calculation System
- Research: Data completeness best practices (category-based scoring, visual patterns, thresholds)
