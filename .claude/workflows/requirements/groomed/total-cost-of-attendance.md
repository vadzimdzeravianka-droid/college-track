# Requirement: Total Cost of Attendance Tracking

## Original Request

I want to track the total cost of attendance for each college, including tuition, room & board, fees, and other expenses. This should be visible on both the dashboard cards and the college detail pages.

**Why**: Understanding the financial commitment for each college is critical for decision-making. Currently, we track financial aid deadlines but not the actual costs, making it hard to compare colleges financially.

**Constraints**:
- Should handle both in-state and out-of-state tuition if applicable
- Need to account for different cost components (tuition, room/board, fees, books, etc.)
- Should be optional fields (not all colleges publish detailed cost breakdowns)
- Would be helpful to show total cost prominently

**Examples**: Similar to how college websites show "Cost of Attendance" breakdowns:
- Tuition & Fees: $55,000
- Room & Board: $18,000
- Books & Supplies: $1,200
- Personal Expenses: $2,000
- **Total: $76,200/year**

## Enriched Requirement

Add comprehensive cost of attendance tracking to the College model with separate fields for each cost component (tuition, room & board, fees, books, personal expenses) plus optional in-state/out-of-state differentiation. Display cost breakdown as a dedicated column on dashboard with logical grouping (e.g., "Tuition + Fees: $X", "Room & Board: $Y", "Other: $Z", "Total: $XX") to enable easy cost comparison across colleges. Show full breakdown on college detail pages.

### Context

- **Affected areas**:
  - `prisma/schema.prisma` - Add cost fields to College model
  - `schemas/index.ts` - Update CollegeSchema validation
  - `components/college-card.tsx` - Display total cost on dashboard cards
  - `components/college-form-new.tsx` - Add cost fields to college creation/edit form
  - `app/(protected)/college/[id]/page.tsx` - Display cost breakdown on detail page
  - `lib/utils.ts` - Add currency formatting utilities
  - `actions/college.ts` - Ensure cost fields handled in CRUD operations

- **Dependencies**: None (use native Intl.NumberFormat for currency formatting)

- **Related features**:
  - Existing college form (multi-step wizard)
  - Dashboard filtering and sorting (may want to sort by cost)
  - College detail page layout

## Implementation Approaches

### Approach A: Direct Fields in College Model
**Description**: Add cost-related fields directly to the College model: `costTuition`, `costRoomBoard`, `costFees`, `costBooks`, `costPersonal`, `costOther`, `isInState` (Boolean). Calculate `costTotal` dynamically in application code. All fields optional (Decimal type for precision).

**Pros**:
- Simple schema - no additional model needed
- Easy to query - all data in one table
- Straightforward form handling - existing CollegeSchema extension
- Performant - no joins required
- Matches existing pattern (College model has all primary data)

**Cons**:
- Schema gets wider (6-7 new fields)
- Less flexible if cost structure changes
- Can't easily track historical cost changes

**Token Estimate**: ~30K tokens

### Approach B: Separate CostBreakdown Model
**Description**: Create new `CostBreakdown` model with 1-to-1 relationship to College (similar to Checklist pattern). Model includes all cost fields plus `residencyStatus` enum (IN_STATE, OUT_OF_STATE, INTERNATIONAL). Allows for future expansion (e.g., year-over-year tracking).

**Pros**:
- Clean separation of concerns
- Extensible - easy to add cost history tracking later
- Follows existing Checklist pattern (familiar)
- Can add metadata (last updated, source URL)

**Cons**:
- Additional table/model complexity
- Requires join when fetching colleges (like checklist)
- More token-intensive implementation (~45K)
- Migration more complex

**Token Estimate**: ~45K tokens

### Approach C: Hybrid - Total + Optional Breakdown JSON
**Description**: Add `costTotal` (Decimal, required) and `costBreakdown` (Json, optional) fields to College model. JSON structure allows flexible breakdown storage without schema changes. For display, parse JSON or show total only.

**Pros**:
- Minimal schema change (2 fields)
- Flexible breakdown structure
- Total always queryable/sortable
- Lighter implementation (~25K)

**Cons**:
- JSON field less type-safe
- Breakdown validation must be in application code
- Harder to query specific cost components
- Less discoverable schema structure

**Token Estimate**: ~25K tokens

**Recommended**: **Approach A (Direct Fields)** because:
1. Matches existing pattern (College model is comprehensive)
2. Type-safe with Prisma Decimal
3. Easy to sort/filter by specific cost components
4. Most straightforward for single-family use (no historical tracking needed)
5. Token-efficient while maintaining flexibility

## Edge Cases & Considerations

### Data Validation
- **Negative values**: Prevent negative cost inputs (validation in Zod schema)
- **Unrealistic values**: Consider max limits (e.g., $200,000/year) to catch typos
- **Partial data**: Handle cases where only some cost components are known
- **Total calculation**: Should total be sum of components, or independent field? (Recommendation: calculated dynamically to avoid inconsistency)
- **Null handling**: All cost fields optional - don't block college creation if costs unknown

### Currency Formatting
- **Display format**: Use `Intl.NumberFormat("en-US", {style: "currency", currency: "USD"})` consistently
- **Storage format**: Use Prisma Decimal type (precision 10, scale 2) for dollar accuracy
- **Form input**: Accept numbers only, format on blur/display
- **No currency selection**: USD only for single-family use (simplification)

### Database Schema
- **Decimal precision**: `@db.Decimal(10, 2)` supports up to $99,999,999.99
- **Migration**: Existing colleges will have NULL costs - UI must handle gracefully
- **Performance**: Adding 6-7 nullable fields has negligible impact

### UI/UX
- **Dashboard cost column**: Add dedicated column showing grouped cost breakdown:
  - Line 1: "Tuition + Fees: $55,000"
  - Line 2: "Room & Board: $18,000"
  - Line 3: "Other: $3,200" (books + personal + other grouped)
  - Line 4: "**Total: $76,200**" (bold/prominent)
- **Space efficiency**: Multi-line column layout, grouped categories to save horizontal space
- **Missing costs**: Display "Cost N/A" if no data, show partial breakdown if some fields populated
- **Sort/filter**: Allow sorting by total cost on dashboard
- **In-state indicator**: Show "(In-State)" label if `isInState` is true
- **Breakdown visibility**: Full itemized breakdown on detail page with all individual components

### Security
- **No special considerations**: Cost data is not sensitive (publicly available info)
- **Input sanitization**: Zod handles number validation

### Performance
- **Calculation overhead**: Minimal - JavaScript number addition for total
- **Query impact**: Adding nullable Decimal fields doesn't significantly affect query performance
- **Index consideration**: May want index on costTotal for sorting (optional optimization)

## Acceptance Criteria

- [ ] College model includes cost fields: `costTuition`, `costRoomBoard`, `costFees`, `costBooks`, `costPersonal`, `costOther`, `isInState` (all optional Decimal except isInState Boolean)
- [ ] CollegeSchema validation updated to accept optional number inputs for cost fields
- [ ] College form includes "Cost of Attendance" section with inputs for each cost component
- [ ] Cost inputs accept numbers only, display formatted as USD currency ($X,XXX)
- [ ] Dashboard has dedicated "Cost" column showing grouped breakdown:
  - "Tuition + Fees: $X" (costTuition + costFees)
  - "Room & Board: $X" (costRoomBoard)
  - "Other: $X" (costBooks + costPersonal + costOther)
  - "Total: $XX" (sum of all components, bold)
- [ ] Dashboard cost column shows "Cost N/A" when no cost data entered
- [ ] Dashboard cost column handles partial data (shows only available groups)
- [ ] Dashboard cost column shows "(In-State)" label if `isInState` is true
- [ ] College detail page shows full itemized breakdown with all individual cost components + total
- [ ] Total cost is calculated dynamically (sum of non-null components) - not stored separately
- [ ] If `isInState` is true, label shows "In-State Cost" on detail page
- [ ] Existing colleges without cost data display gracefully (no "$0", show "Not specified")
- [ ] Currency formatting uses `Intl.NumberFormat` consistently across all displays
- [ ] Database migration adds new fields without data loss
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors
- [ ] CLAUDE.md updated with cost handling patterns

## Test Scenarios

1. **Happy path - Full cost data**: User creates college with all cost fields filled, sees grouped breakdown in dashboard cost column (Tuition+Fees, Room&Board, Other, Total) and full breakdown on detail page
2. **Partial cost data**: User enters only tuition and room/board, dashboard shows "Tuition + Fees: $55,000", "Room & Board: $18,000", "Total: $73,000" (omits "Other" line since empty)
3. **No cost data**: User creates college without any cost data, dashboard shows "Cost N/A", detail page shows empty breakdown
4. **In-state vs out-of-state**: User toggles `isInState`, label reflects "In-State" or "Out-of-State" cost
5. **Currency formatting**: All cost displays show proper USD format with commas and 2 decimals (e.g., $55,432.00)
6. **Edit existing college**: User adds cost data to existing college (created before this feature), data saves and displays correctly
7. **Validation**: User attempts to enter negative cost or non-numeric value, form validation prevents submission
8. **Sort by cost**: Dashboard allows sorting colleges by total cost (high to low, low to high)
9. **Migration safety**: Existing colleges have NULL cost fields, queries handle gracefully without errors

## Token Budget Estimate

### Approach A (Recommended)
- **Schema update**: 3K tokens (Prisma model + migration)
- **Validation**: 2K tokens (Zod schema updates)
- **Form implementation**: 8K tokens (add cost section to college-form-new.tsx)
- **Dashboard column implementation**: 8K tokens (add cost column with grouped breakdown display, multi-line layout)
- **Detail page update**: 5K tokens (cost breakdown display)
- **Utility functions**: 2K tokens (currency formatting, total calculation)
- **Testing**: 8K tokens (unit tests for calculations, component tests, integration tests)
- **Documentation**: 1K tokens (update CLAUDE.md)
- **QA**: 5K tokens (E2E tests, validation)

**Total**: ~42K tokens (increased due to dashboard column layout complexity)

## References

- **CLAUDE.md**:
  - Server Actions Pattern (`actions/college.ts`) - ensure cost fields included in CRUD
  - Form Validation (`schemas/index.ts`) - extend CollegeSchema
  - Prisma patterns (`prisma/schema.prisma`) - Decimal type for financial data
  - Component patterns (`components/college-card.tsx`, `components/college-form-new.tsx`)

- **Similar patterns**:
  - Checklist model (1-to-1 relationship, optional data) - if choosing Approach B
  - Existing College fields (all optional except core fields) - follows same pattern

- **Best practices**:
  - [Prisma Decimal type](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#decimal) - precision for financial data
  - [MDN Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) - currency formatting
  - Avoid Float for money - use Decimal or Int (cents)

- **External examples**:
  - College Board cost calculator - similar breakdown structure
  - Common Application financial info section
