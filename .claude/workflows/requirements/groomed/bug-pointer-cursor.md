# Requirement: Fix Pointer Cursor on Interactive Elements

## Original Request
moving mouse on top of Back to Dashboard button, cursor stays arrow. Epect to see pointer. Check if component cousen correctly, I believe propper shadcn component support that out of the box. Scan every other places if there are simmilar misses I never noticed.

## Enriched Requirement

Fix cursor behavior for "Back to Dashboard" button and audit all interactive Link+Button combinations in the codebase. When hovering over buttons wrapped in Next.js Link components, the cursor should display as pointer (hand) instead of default arrow.

### Context
- **Affected areas**:
  - `app/(protected)/college/[id]/page.tsx` (lines 66-72, 36-41) - Back to Dashboard buttons
  - Any other Link+Button combinations in codebase
- **Dependencies**: None (uses existing shadcn Button component with `asChild` prop)
- **Related features**: Navigation patterns throughout the app
- **Root cause**: Button component wrapped inside Link without using `asChild` prop, causing Link to not inherit button's interactive styles

### Current Implementation Issue

```tsx
// Current (incorrect):
<Link href="/dashboard">
  <Button variant="ghost">
    Back to Dashboard
  </Button>
</Link>
```

The Button renders as a `<button>` inside an `<a>` tag, but the Link's `<a>` doesn't get the button's cursor styling. The button itself would have the cursor, but the Link wrapper captures the hover.

## Implementation Approaches

### Approach A: Use Button's `asChild` Prop (Recommended)
**Description**: Use shadcn Button's `asChild` prop to merge the Button styling with the Link component. This is the idiomatic pattern for Radix UI components (which shadcn is built on).

```tsx
<Button variant="ghost" asChild>
  <Link href="/dashboard">
    <ArrowLeft className="h-4 w-4 mr-2" />
    Back to Dashboard
  </Link>
</Button>
```

**Pros**:
- Idiomatic shadcn/Radix UI pattern
- Proper semantic HTML (single `<a>` tag, no nested button)
- Button styles and cursor automatically applied to Link
- No custom CSS needed
- Already using this pattern with DialogTrigger in `college-form-new.tsx`

**Cons**:
- None (this is the correct approach)

**Token Estimate**: ~5K tokens (simple find-replace pattern + audit)

### Approach B: Add Custom CSS Class
**Description**: Add `cursor-pointer` Tailwind class to Link wrapper.

```tsx
<Link href="/dashboard" className="cursor-pointer">
  <Button variant="ghost">
    Back to Dashboard
  </Button>
</Link>
```

**Pros**:
- Quick fix
- No structural changes

**Cons**:
- Doesn't fix semantic HTML issue (button inside link is invalid)
- Requires remembering to add class to every Link+Button combination
- Not the idiomatic shadcn/Radix pattern
- May have accessibility implications

**Token Estimate**: ~3K tokens

**Recommended**: Approach A - it's the correct pattern and matches existing codebase conventions (DialogTrigger usage).

## Edge Cases & Considerations

### Accessibility
- **Semantic HTML**: Button inside link is technically invalid HTML. Using `asChild` renders a single `<a>` with button styling (correct)
- **Keyboard navigation**: Both approaches work for Tab navigation
- **Screen readers**: `asChild` approach announces as link (correct), button-in-link may confuse screen readers

### Audit Scope
Need to scan for:
- `<Link>` wrapping `<Button>` components
- Any other interactive components that might have similar issues
- `<a>` tags with button styling that should use Button component

### Performance
- No performance impact
- Changes are purely presentational/structural

## Acceptance Criteria

- [ ] "Back to Dashboard" button at top of college detail page (line 66-72) shows pointer cursor on hover
- [ ] "Back to Dashboard" button in error state (line 36-41) shows pointer cursor on hover
- [ ] All Link+Button combinations in codebase have been audited and fixed
- [ ] No button elements are nested inside anchor tags (semantic HTML validated)
- [ ] All interactive elements show appropriate cursor (`cursor-pointer` for clickable items)
- [ ] No regression in keyboard navigation or accessibility
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors

## Test Scenarios

1. **Happy path**: Hover over "Back to Dashboard" button, cursor changes to pointer
2. **Error state**: Navigate to invalid college ID, hover over "Back to Dashboard" in error message, cursor changes to pointer
3. **Keyboard navigation**: Tab to button, press Enter, navigates correctly
4. **Screen reader**: Button announces as link (when using asChild)

## Audit Checklist

Scan these patterns:
```bash
# Find all Link components wrapping Button
grep -r "Link.*>" . --include="*.tsx" -A 3 | grep "Button"

# Find all buttons that might be in links
grep -r "<Link" . --include="*.tsx" -A 5 | grep -i button
```

Common patterns to check:
- Navigation buttons (Back, Return, etc.)
- Call-to-action buttons that navigate
- Card click areas with button styling
- Form submission buttons that navigate

## Token Budget Estimate

- Implementation: 3K tokens (fix 2 instances + audit)
- Testing: 2K tokens (manual testing + cursor behavior verification)
- Documentation: 1K tokens (add comment if pattern isn't obvious)
- **Total**: ~6K tokens

## References
- [Radix UI Slot/asChild pattern](https://www.radix-ui.com/primitives/docs/guides/composition)
- CLAUDE.md: Component Organization (shadcn/ui usage)
- Similar pattern in codebase: `components/college-form-new.tsx` line 164 (DialogTrigger asChild)
- [Next.js Link component docs](https://nextjs.org/docs/app/api-reference/components/link)
