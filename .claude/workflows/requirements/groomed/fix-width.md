# Requirement: Improve Desktop Dashboard Column Width Control

## Original Request
I want to have better separation of columns width in table in desctop mode.
NAME | location and dates | fees | progress.
(all the rest) | (min 2 widths, no wrap lines) | (min 2 width, no wrap lines) | (min 1 width, no wrap lines)

i want to have easy way to define it through browser dev mode, to define better numbers, please explain in comment parameters I can play with to get idea result.

## Enriched Requirement

Improve the desktop dashboard college card layout with better column width control, minimum width constraints, and no line wrapping. Add CSS custom properties (CSS variables) to make column widths easily adjustable via browser DevTools without code changes.

### Context
- **Affected areas**:
  - `components/college-card.tsx` (lines 222-346) - Desktop horizontal layout
  - Possibly `globals.css` for CSS custom properties definition
- **Dependencies**: None (uses existing Tailwind CSS)
- **Related features**: Dashboard display, college card presentation
- **Current implementation**: Fixed Tailwind width classes (`w-1/3`, `w-72`, `w-56`, `w-32`) with `flex-shrink-0`

### Current Layout Structure

Desktop layout (4 columns):
1. **Name & Badges** - `w-1/3` (~33% of card width)
2. **Details** (location, dates) - `w-72` (18rem = 288px)
3. **Cost** - `w-56` (14rem = 224px)
4. **Progress** - `w-32` (8rem = 128px)

User's desired behavior:
- Name: flexible (all remaining space)
- Details: min-width for 2 lines without wrapping
- Cost: min-width for 2 lines without wrapping
- Progress: min-width for 1 line without wrapping

## Implementation Approaches

### Approach A: CSS Custom Properties + Tailwind (Recommended)
**Description**: Define column widths as CSS custom properties in `globals.css`, use them via Tailwind's arbitrary values, add detailed comments for DevTools tuning.

```css
/* globals.css */
:root {
  /* College Card Desktop Column Widths
   * These control the desktop (md:) layout columns in dashboard
   * To adjust in DevTools: inspect card, edit values in :root
   *
   * Width values can be:
   * - Fixed: 240px, 18rem (good for predictable sizing)
   * - Viewport: 20vw (responsive to screen width)
   * - Flexible: minmax(200px, 1fr) with grid
   *
   * Current totals with flex:
   * - name-col: flex-1 (takes remaining space)
   * - details-col: 288px fixed
   * - cost-col: 224px fixed
   * - progress-col: 128px fixed
   */
  --college-card-name-min: 320px;     /* Name column minimum width */
  --college-card-details: 288px;      /* Location, major, dates */
  --college-card-cost: 224px;         /* Cost breakdown */
  --college-card-progress: 128px;     /* Checklist progress */
}
```

```tsx
// college-card.tsx desktop section
<div className="hidden md:flex items-stretch">
  {/* Name & Badges - flexible with min-width */}
  <div
    className="flex-1 p-6 flex flex-col"
    style={{ minWidth: 'var(--college-card-name-min)' }}
  >
    {/* content */}
  </div>

  {/* Details - fixed width, no wrap */}
  <div
    className="flex-shrink-0 p-6 border-l space-y-2"
    style={{ width: 'var(--college-card-details)' }}
  >
    {/* location, dates - add truncate classes */}
  </div>

  {/* Cost - fixed width, no wrap */}
  <div
    className="flex-shrink-0 p-6 border-l"
    style={{ width: 'var(--college-card-cost)' }}
  >
    {/* cost data */}
  </div>

  {/* Progress - fixed width */}
  <div
    className="flex-shrink-0 p-6 border-l"
    style={{ width: 'var(--college-card-progress)' }}
  >
    {/* progress indicator */}
  </div>
</div>
```

**Pros**:
- Easy to tune in DevTools (edit CSS variables in :root)
- No code recompilation needed for adjustments
- Clear documentation in CSS comments
- Maintains responsive behavior
- Name column flexes to fill available space

**Cons**:
- Mixes Tailwind with inline styles (minor deviation from pure Tailwind)
- CSS variables not type-checked

**Token Estimate**: ~12K tokens

### Approach B: Tailwind Config + JIT Classes
**Description**: Define custom spacing values in `tailwind.config.ts`, use them as utility classes.

```js
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      width: {
        'card-details': '288px',
        'card-cost': '224px',
        'card-progress': '128px',
      },
      minWidth: {
        'card-name': '320px',
      }
    }
  }
}
```

```tsx
<div className="flex-1 min-w-card-name p-6">
  {/* name */}
</div>
<div className="w-card-details flex-shrink-0 p-6">
  {/* details */}
</div>
```

**Pros**:
- Pure Tailwind approach
- Type-safe (autocomplete in IDE)
- Cleaner JSX

**Cons**:
- Requires code recompilation to adjust widths
- Harder to tune in DevTools (need to edit config file)
- Doesn't meet user requirement of "easy way to define through browser dev mode"

**Token Estimate**: ~10K tokens

### Approach C: CSS Grid with Custom Properties
**Description**: Use CSS Grid instead of Flexbox with grid-template-columns using CSS variables.

```css
:root {
  --college-card-grid: minmax(320px, 1fr) 288px 224px 128px;
}
```

```tsx
<div
  className="hidden md:grid items-stretch"
  style={{ gridTemplateColumns: 'var(--college-card-grid)' }}
>
  {/* columns */}
</div>
```

**Pros**:
- More explicit column control
- Can use fr units for flexible sizing
- Easy to adjust in DevTools

**Cons**:
- Larger refactor (flex → grid)
- Need to handle gap spacing differently
- More token-intensive

**Token Estimate**: ~15K tokens

**Recommended**: Approach A - meets user requirement for DevTools adjustability, minimal refactor, clear documentation.

## Edge Cases & Considerations

### Responsive Behavior
- Changes only affect desktop (md: breakpoint and above)
- Mobile vertical layout unchanged
- What if screen is too narrow for all fixed widths? Add horizontal scroll wrapper

### Text Wrapping
- Add `truncate` or `line-clamp-2` to text elements to prevent wrapping
- Consider tooltip for truncated text
- Location, major, dates should not wrap (user requirement)

### Content Overflow
- Cost numbers could be very large ($99,999+)
- College names could be very long
- Use `truncate` with title attribute for accessibility

### Browser Compatibility
- CSS custom properties: IE11+ (not a concern for modern stack)
- Flexbox: Universal support
- Grid: Universal support

## Acceptance Criteria

- [ ] Desktop dashboard college cards use CSS custom properties for column widths
- [ ] CSS file includes detailed comments explaining how to adjust widths in DevTools
- [ ] Name column is flexible (`flex-1`) with minimum width constraint
- [ ] Details column has fixed width, no text wrapping
- [ ] Cost column has fixed width, no text wrapping
- [ ] Progress column has fixed width
- [ ] Long text uses `truncate` with title attribute for full text on hover
- [ ] Layout doesn't break on various desktop screen sizes (1280px - 2560px)
- [ ] Mobile layout unchanged (vertical stacking)
- [ ] Column borders properly aligned
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors

## Test Scenarios

1. **Happy path**: Open dashboard on desktop (1920px), cards display with proper column widths
2. **Narrow desktop**: Test at 1280px width, verify layout doesn't break
3. **Wide desktop**: Test at 2560px width, name column expands appropriately
4. **Long text**: College with long name/location, verify truncation
5. **DevTools tuning**:
   - Open DevTools
   - Find `:root` in Elements/Inspector
   - Edit `--college-card-details` value
   - Verify column width updates live
6. **Mobile unchanged**: Verify mobile layout still uses vertical stacking

## DevTools Tuning Guide (to include in CSS comments)

```css
/**
 * HOW TO ADJUST COLUMN WIDTHS IN DEVTOOLS:
 *
 * 1. Open DevTools (F12 or Cmd+Option+I)
 * 2. Go to Elements/Inspector tab
 * 3. Find <html> or <body> element
 * 4. In Styles panel, scroll to :root selector
 * 5. Click on any --college-card-* value
 * 6. Edit the value (try: 320px, 24rem, 30vw, etc.)
 * 7. Changes apply immediately without refresh
 *
 * TIPS:
 * - Use px for precise control (e.g., 240px)
 * - Use rem for scaling with font size (e.g., 18rem)
 * - Use vw for viewport-relative (e.g., 20vw)
 * - Keep total width < 100vw to avoid horizontal scroll
 * - Min widths prevent cards from becoming unreadable
 *
 * RECOMMENDED STARTING POINTS:
 * - Small laptop (1280px): 280px, 200px, 120px
 * - Standard desktop (1920px): 288px, 224px, 128px (default)
 * - Large desktop (2560px): 320px, 280px, 160px
 */
```

## Token Budget Estimate

- Implementation: 8K tokens (CSS variables, component updates, truncate classes)
- Testing: 4K tokens (responsive testing, text overflow testing)
- Documentation: 2K tokens (detailed CSS comments)
- **Total**: ~14K tokens

## References
- Current implementation: `components/college-card.tsx` lines 222-346
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Tailwind arbitrary values](https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values)
- [Flexbox flex-1](https://tailwindcss.com/docs/flex#flex-1)
- CLAUDE.md: Styling section (Tailwind CSS 4, globals.css)
