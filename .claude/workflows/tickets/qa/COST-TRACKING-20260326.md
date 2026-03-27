# Ticket: Total Cost of Attendance Tracking

**Status**: READY
**Priority**: HIGH
**Estimated Tokens**: 42K
**Groomed Requirement**: `.claude/workflows/requirements/groomed/total-cost-of-attendance.md`

## Summary

Add comprehensive cost of attendance tracking to enable financial comparison across colleges. Implement 7 cost fields (tuition, room & board, fees, books, personal, other, in-state flag) with grouped display on dashboard and detailed breakdown on college pages.

## Implementation Approach

**Approach A (Direct Fields)** - Add cost-related fields directly to the College model as optional Decimal fields. Calculate total dynamically in application code. This matches the existing pattern (College model is comprehensive), provides type safety with Prisma Decimal, and is most straightforward for single-family use without historical tracking needs.

**Key decisions**:
- All cost fields optional (nullable) - don't block college creation if costs unknown
- Use Prisma `Decimal` type with `@db.Decimal(10, 2)` for financial precision
- Total calculated dynamically (not stored) to avoid inconsistency
- Currency formatting via `Intl.NumberFormat` for consistency
- Dashboard shows grouped breakdown (Tuition+Fees / Room&Board / Other / Total) for space efficiency

## Affected Files

### To Modify
- `prisma/schema.prisma` - Add 7 cost fields to College model (6 Decimal + 1 Boolean)
- `schemas/index.ts` - Update CollegeSchema to accept optional number inputs for cost validation
- `components/college-card.tsx` - Add "Cost" column with grouped multi-line breakdown display
- `components/college-form-new.tsx` - Add "Cost of Attendance" step/section with 7 input fields
- `app/(protected)/college/[id]/page.tsx` - Display full itemized cost breakdown
- `actions/college.ts` - Ensure cost fields handled in CRUD operations (create/update)
- `lib/utils.ts` - Add cost calculation and currency formatting utilities

### To Create
- `lib/__tests__/utils.cost.test.ts` - Unit tests for cost utility functions
- `components/__tests__/college-card.cost.test.tsx` - Component tests for cost display

## Subtasks

### Subtask 1: Database Schema & Validation Updates
**Complexity**: Simple
**Estimated Tokens**: 8K

**Description**: Update Prisma schema to add 7 cost fields to College model and update Zod schema for form validation. Run migration to add columns without data loss.

**Files**:
- Modify: `prisma/schema.prisma` - Add cost fields to College model
- Modify: `schemas/index.ts` - Extend CollegeSchema with cost validation

**Schema Changes**:
```prisma
model College {
  // ... existing fields ...
  costTuition     Decimal? @map("cost_tuition") @db.Decimal(10, 2)
  costRoomBoard   Decimal? @map("cost_room_board") @db.Decimal(10, 2)
  costFees        Decimal? @map("cost_fees") @db.Decimal(10, 2)
  costBooks       Decimal? @map("cost_books") @db.Decimal(10, 2)
  costPersonal    Decimal? @map("cost_personal") @db.Decimal(10, 2)
  costOther       Decimal? @map("cost_other") @db.Decimal(10, 2)
  isInState       Boolean? @map("is_in_state")
  // ...
}
```

**Validation Changes**:
```typescript
// Add to CollegeSchema
costTuition: z.number().min(0).max(200000).optional().nullable(),
costRoomBoard: z.number().min(0).max(200000).optional().nullable(),
// ... other fields
isInState: z.boolean().optional().nullable(),
```

**Tests**:
- Unit: Zod schema validates cost number inputs (positive, reasonable max)
- Unit: Zod schema rejects negative cost values
- Integration: Prisma generate succeeds with new schema
- Integration: Migration runs without data loss on existing colleges

**Acceptance**:
- [ ] College model has 7 new cost fields (6 Decimal, 1 Boolean)
- [ ] All cost fields are optional (nullable)
- [ ] Decimal precision is `@db.Decimal(10, 2)` for all cost fields
- [ ] CollegeSchema validates cost inputs (min: 0, max: 200000)
- [ ] Negative costs rejected by validation
- [ ] `npx prisma generate` runs successfully
- [ ] `npx prisma db push` completes without errors
- [ ] Existing colleges have NULL cost values after migration

---

### Subtask 2: Cost Utility Functions
**Complexity**: Simple
**Estimated Tokens**: 6K

**Description**: Create reusable utility functions for cost calculations (total, grouped sums) and currency formatting. Place in `lib/utils.ts` following existing pattern.

**Files**:
- Modify: `lib/utils.ts` - Add cost utility functions
- Create: `lib/__tests__/utils.cost.test.ts` - Unit tests for cost functions

**Functions to implement**:
```typescript
// Calculate total cost from all components (sum non-null values)
export function calculateTotalCost(college: {
  costTuition?: number | Decimal | null;
  costRoomBoard?: number | Decimal | null;
  // ... other cost fields
}): number | null;

// Format number as USD currency ($X,XXX.XX)
export function formatCurrency(amount: number | Decimal | null | undefined): string;

// Calculate grouped cost sums for dashboard display
export function getGroupedCosts(college: {...}): {
  tuitionAndFees: number | null;
  roomAndBoard: number | null;
  other: number | null;
  total: number | null;
};

// Check if college has any cost data
export function hasCostData(college: {...}): boolean;
```

**Tests**:
- Unit: `calculateTotalCost` sums all non-null cost fields correctly
- Unit: `calculateTotalCost` returns null if all fields null
- Unit: `calculateTotalCost` handles Decimal types from Prisma
- Unit: `formatCurrency` formats numbers as USD with commas and decimals
- Unit: `formatCurrency` handles null/undefined gracefully ("Not specified")
- Unit: `getGroupedCosts` combines tuition+fees correctly
- Unit: `getGroupedCosts` combines books+personal+other correctly
- Unit: `hasCostData` returns true if any cost field is non-null
- Unit: `hasCostData` returns false if all fields null

**Acceptance**:
- [ ] All 4 utility functions implemented and exported
- [ ] Functions handle Prisma Decimal type (convert to number for calculations)
- [ ] Currency formatting uses `Intl.NumberFormat("en-US", {style: "currency", currency: "USD"})`
- [ ] Null/undefined values handled gracefully (no crashes)
- [ ] Test coverage >= 95% for cost utilities
- [ ] All edge cases covered (all null, partial data, zero values)

---

### Subtask 3: Add Cost Section to College Form
**Complexity**: Medium
**Estimated Tokens**: 10K

**Description**: Add "Cost of Attendance" section to `college-form-new.tsx` multi-step form with 7 input fields (6 number inputs + 1 checkbox). Include helper text and USD formatting on inputs.

**Files**:
- Modify: `components/college-form-new.tsx` - Add cost section to form wizard

**UI Requirements**:
- Add new step/section titled "Cost of Attendance (Optional)"
- 6 number inputs: Tuition, Room & Board, Fees, Books, Personal, Other
- 1 checkbox: "In-State Student"
- Each input shows "$" prefix and formats on blur
- Helper text: "Enter costs as published by the college. All fields optional."
- Display calculated total below inputs (read-only, bold)

**Form Integration**:
- Use existing `react-hook-form` pattern with `useForm`
- Add cost fields to form schema validation
- Ensure fields submit correctly to server action
- Handle Decimal conversion (form uses numbers, DB uses Decimal)

**Tests**:
- Unit: Cost section renders with 7 inputs
- Unit: Number inputs accept valid values
- Unit: Form validation rejects negative values
- Unit: Checkbox toggles isInState boolean
- Integration: Form submits cost data to createCollege action
- Integration: Cost fields populate on edit (if college has cost data)

**Acceptance**:
- [ ] Cost section appears in college form with clear heading
- [ ] All 7 cost inputs render correctly (6 number, 1 checkbox)
- [ ] Number inputs accept positive numbers only
- [ ] Inputs show USD formatting ($X,XXX.XX) on blur
- [ ] Calculated total displays below inputs (live update)
- [ ] Form submits cost data successfully
- [ ] Cost fields populate correctly when editing existing college
- [ ] Validation prevents negative/unrealistic values
- [ ] All fields remain optional - form submits with no costs entered

---

### Subtask 4: Add Cost Column to Dashboard
**Complexity**: Medium
**Estimated Tokens**: 10K

**Description**: Add "Cost" column to `college-card.tsx` dashboard display showing grouped breakdown in multi-line format: Tuition+Fees, Room&Board, Other, Total (bold). Handle missing data gracefully.

**Files**:
- Modify: `components/college-card.tsx` - Add cost display section
- Create: `components/__tests__/college-card.cost.test.tsx` - Component tests

**Display Format**:
```
Cost
────────────────
Tuition + Fees: $55,000
Room & Board: $18,000
Other: $3,200
Total: $76,200
(In-State)
```

**Layout Requirements**:
- Add cost section to card (below existing info, above checklist)
- Use grouped format to save space (not 6 individual lines)
- Show "(In-State)" label if `isInState` is true
- If no cost data: show "Cost N/A" with gray text
- If partial data: show only available groups (omit empty lines)
- Total line always bold/prominent

**Type Updates**:
- Update College type definition to include cost fields
- Handle Decimal type from Prisma (convert to number for display)

**Tests**:
- Unit: Cost section renders with full data (all 4 lines + label)
- Unit: Cost section shows partial data (omits empty groups)
- Unit: Cost section shows "Cost N/A" when no data
- Unit: "(In-State)" label appears when `isInState` is true
- Unit: Currency formatting applied consistently
- Unit: Total calculation matches sum of components
- Integration: Cost data fetched from database and displayed

**Acceptance**:
- [ ] Cost section appears on college cards
- [ ] Grouped display shows 3 categories + total (max 4 lines)
- [ ] Currency formatted with commas and 2 decimals
- [ ] Total line is bold/visually prominent
- [ ] "(In-State)" label appears conditionally
- [ ] "Cost N/A" shown when no cost data
- [ ] Partial data handled gracefully (shows available groups only)
- [ ] Layout responsive and space-efficient

---

### Subtask 5: Add Cost Breakdown to Detail Page
**Complexity**: Simple
**Estimated Tokens**: 8K

**Description**: Add full itemized cost breakdown section to college detail page showing all 6 individual cost components plus calculated total. Use table or structured list format.

**Files**:
- Modify: `app/(protected)/college/[id]/page.tsx` - Add cost breakdown section

**Display Format**:
```
Cost of Attendance
──────────────────
Tuition:              $50,000
Room & Board:         $18,000
Fees:                 $5,000
Books & Supplies:     $1,200
Personal Expenses:    $1,500
Other:                $500
────────────────────────────
Total Annual Cost:    $76,200
(In-State Student)
```

**Layout Requirements**:
- Add "Cost of Attendance" section to detail page
- Show all 6 individual cost components (even if zero/null)
- Use two-column layout: label (left) + amount (right)
- Show total with separator line above (prominent)
- Show "In-State Cost" or "Out-of-State Cost" label if `isInState` is defined
- If no cost data: show "Cost information not available"

**Tests**:
- Integration: Cost breakdown displays on detail page
- Integration: All 6 cost components shown with correct values
- Integration: Total matches sum of components
- Integration: In-state label appears correctly
- Integration: "Not available" message shown when no cost data

**Acceptance**:
- [ ] Cost breakdown section appears on college detail page
- [ ] All 6 individual cost components listed
- [ ] Values align properly (label left, amount right)
- [ ] Total displays prominently with separator
- [ ] "In-State Cost" or "Out-of-State Cost" label shown conditionally
- [ ] Null/empty costs show as "Not specified" (not $0)
- [ ] "Cost information not available" shown when no data
- [ ] Section placement is logical (near deadlines/portal info)

---

## Acceptance Criteria

- [ ] College model includes 7 cost fields: `costTuition`, `costRoomBoard`, `costFees`, `costBooks`, `costPersonal`, `costOther`, `isInState` (all optional)
- [ ] CollegeSchema validation accepts optional number inputs for cost fields (min: 0, max: 200000)
- [ ] College form includes "Cost of Attendance" section with 7 inputs
- [ ] Cost inputs accept numbers only, display formatted as USD ($X,XXX.XX)
- [ ] Dashboard college cards have "Cost" column showing grouped breakdown:
  - "Tuition + Fees: $X" (costTuition + costFees)
  - "Room & Board: $X" (costRoomBoard)
  - "Other: $X" (costBooks + costPersonal + costOther)
  - "Total: $XX" (sum of all components, bold)
- [ ] Dashboard cost column shows "Cost N/A" when no cost data entered
- [ ] Dashboard cost column handles partial data (shows only available groups)
- [ ] Dashboard cost column shows "(In-State)" label if `isInState` is true
- [ ] College detail page shows full itemized breakdown with all 6 individual cost components + total
- [ ] Total cost is calculated dynamically (sum of non-null components) - not stored separately
- [ ] If `isInState` is true, label shows "In-State Cost" on detail page
- [ ] Existing colleges without cost data display gracefully (no "$0", show "Not specified")
- [ ] Currency formatting uses `Intl.NumberFormat` consistently across all displays
- [ ] Database migration adds new fields without data loss
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors
- [ ] CLAUDE.md updated with cost handling patterns

## Test Scenarios

### Unit Tests
- [ ] Zod schema validates cost inputs (positive numbers, reasonable max)
- [ ] Zod schema rejects negative cost values
- [ ] `calculateTotalCost` sums all non-null fields correctly
- [ ] `calculateTotalCost` returns null if all fields null
- [ ] `formatCurrency` formats numbers as USD with commas
- [ ] `formatCurrency` handles null/undefined gracefully
- [ ] `getGroupedCosts` combines costs into 3 categories correctly
- [ ] `hasCostData` detects presence of any cost data

### Integration Tests
- [ ] Prisma migration adds cost fields successfully
- [ ] Server actions handle cost fields in create/update operations
- [ ] Cost data persists to database and retrieves correctly
- [ ] College form submits with cost data
- [ ] College form submits without cost data (all optional)
- [ ] Dashboard fetches and displays cost data
- [ ] Detail page fetches and displays cost breakdown

### Component Tests
- [ ] College card renders cost section with full data
- [ ] College card renders "Cost N/A" with no data
- [ ] College card renders partial cost data correctly
- [ ] College card shows "(In-State)" label conditionally
- [ ] College form cost section renders all 7 inputs
- [ ] Cost inputs validate and format correctly
- [ ] Detail page cost section displays full breakdown

### E2E Tests
- [ ] **Happy path - Full cost data**: User creates college with all cost fields filled, sees grouped breakdown on dashboard (Tuition+Fees, Room&Board, Other, Total) and full breakdown on detail page
- [ ] **Partial cost data**: User enters only tuition and room/board, dashboard shows "Tuition + Fees: $55,000", "Room & Board: $18,000", "Total: $73,000" (omits "Other" line)
- [ ] **No cost data**: User creates college without any cost data, dashboard shows "Cost N/A", detail page shows "Cost information not available"
- [ ] **In-state toggle**: User checks "In-State Student", label reflects "(In-State)" on dashboard and "In-State Cost" on detail page
- [ ] **Edit existing college**: User adds cost data to existing college (created before this feature), data saves and displays correctly
- [ ] **Validation**: User attempts to enter negative cost, form validation prevents submission with error message

## Edge Cases to Handle

### Data Validation
- **Negative values**: Prevent negative cost inputs via Zod schema validation (min: 0)
- **Unrealistic values**: Set max limit of $200,000/year to catch typos/errors
- **Partial data**: Handle cases where only some cost components are known (show available, hide empty)
- **Total calculation**: Always calculate dynamically (never store separately) to avoid inconsistency
- **Null handling**: All cost fields optional - don't block college creation if costs unknown
- **Zero vs null**: Treat null as "not specified", zero as "free" (rare but valid)

### Currency Formatting
- **Display format**: Use `Intl.NumberFormat("en-US", {style: "currency", currency: "USD"})` consistently
- **Storage format**: Prisma Decimal type with `@db.Decimal(10, 2)` precision
- **Form input**: Accept plain numbers, format on blur/display
- **Decimal precision**: Always show 2 decimal places (e.g., $55,000.00 vs $55,000)

### Database Schema
- **Decimal precision**: `@db.Decimal(10, 2)` supports up to $99,999,999.99 (sufficient)
- **Migration**: Existing colleges will have NULL costs - UI must handle gracefully
- **Type conversion**: Prisma returns Decimal objects - convert to number for calculations
- **Performance**: 7 nullable fields have negligible query impact

### UI/UX
- **Missing costs**: Display "Cost N/A" if no data, show partial breakdown if some fields populated
- **Space efficiency**: Grouped multi-line layout to save horizontal space on dashboard
- **Total prominence**: Bold/larger font for total to draw attention
- **Responsive**: Cost section should adapt to mobile/tablet layouts
- **Edit mode**: Cost fields should populate correctly when editing existing college

## Definition of Done

- [ ] All 5 subtasks completed
- [ ] All acceptance criteria met
- [ ] Test coverage >= 90%
- [ ] All tests passing (unit, integration, component, E2E)
- [ ] No linter errors (`npm run lint` passes)
- [ ] Database migration successful (`npx prisma db push` completes)
- [ ] `npx prisma generate` runs without errors
- [ ] CLAUDE.md updated with:
  - Cost handling patterns
  - Currency formatting utilities
  - Cost calculation approach
- [ ] Manual testing completed:
  - Create college with full cost data
  - Create college with partial cost data
  - Create college with no cost data
  - Edit existing college to add costs
  - Verify dashboard and detail page displays

## Token Budget

| Stage | Estimated |
|-------|-----------|
| Subtask 1 (Schema & Validation) | 8K |
| Subtask 2 (Cost Utilities) | 6K |
| Subtask 3 (College Form) | 10K |
| Subtask 4 (Dashboard Display) | 10K |
| Subtask 5 (Detail Page) | 8K |
| QA & E2E Testing | 5K |
| Documentation | 1K |
| **Total** | **48K** |

*Note: Slight increase from original 42K estimate due to comprehensive testing and grouped display complexity.*

## Dependencies

- [ ] No blocking dependencies

## References

- Groomed requirement: `.claude/workflows/requirements/groomed/total-cost-of-attendance.md`
- Related files:
  - `prisma/schema.prisma` - Current College model structure
  - `schemas/index.ts` - Existing CollegeSchema pattern
  - `components/college-card.tsx` - Dashboard card layout
  - `components/college-form-new.tsx` - Multi-step form pattern
  - `app/(protected)/college/[id]/page.tsx` - Detail page layout
  - `actions/college.ts` - Server actions for CRUD
  - `lib/utils.ts` - Utility functions (urgency, formatting)
- CLAUDE.md sections:
  - Server Actions Pattern
  - Form Validation (Zod schemas)
  - Data Layer (Prisma models)
  - Component Organization
- Best practices:
  - [Prisma Decimal type](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#decimal) - Financial data precision
  - [MDN Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) - Currency formatting
  - Avoid Float for money - use Decimal

## Implementation Notes

### Migration Strategy
1. Run `npx prisma db push` to add cost fields (all nullable, non-breaking)
2. Existing colleges will have NULL cost values
3. No data migration needed (backward compatible)

### Type Handling
- Prisma returns `Decimal` objects for cost fields
- Convert to `number` for calculations: `Number(college.costTuition) || 0`
- Form inputs use `number` type (Zod validates, converts to Decimal on save)

### Testing Strategy
- **Unit tests**: Cost utilities (calculations, formatting)
- **Component tests**: Form inputs, dashboard display, detail page
- **Integration tests**: Database operations, server actions
- **E2E tests**: Full user flows (create, edit, view)

### Performance Considerations
- Total cost calculated on-the-fly (not stored) - negligible performance impact
- 7 new nullable columns - minimal query overhead
- No indexes needed (cost fields not used for filtering yet)
- Consider adding index on `costTotal` if sorting added later
