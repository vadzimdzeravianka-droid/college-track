# Ticket: Status Pill Component

**Status**: READY
**Priority**: MEDIUM
**Estimated Tokens**: 12K
**Groomed Requirement**: test-evaluation

## Summary

Create a reusable `<StatusPill>` component for displaying application status with color coding. This will replace inline status text throughout the app with a consistent, accessible pill design.

## Implementation Approach

Create new component in `components/` following existing badge patterns. Use TypeScript for props, React Testing Library for tests.

## Affected Files

### To Create
- `components/status-pill.tsx` - New StatusPill component
- `components/__tests__/status-pill.test.tsx` - Component tests

## Subtasks

### Subtask 1: Implement StatusPill Component
**Complexity**: Medium
**Estimated Tokens**: 12K

**Description**: Create StatusPill component with color-coded styling based on status value.

**Component Signature**:
```typescript
interface StatusPillProps {
  status: "pending" | "in-progress" | "completed" | "failed";
  size?: "sm" | "md" | "lg";
}

export function StatusPill({ status, size = "md" }: StatusPillProps): JSX.Element
```

**Visual Requirements**:
- Pill shape with rounded corners
- Color coding:
  - pending: gray background
  - in-progress: blue background
  - completed: green background
  - failed: red background
- Size variants:
  - sm: 8px padding, 12px text
  - md: 10px padding, 14px text (default)
  - lg: 12px padding, 16px text
- Dark mode support (use theme colors)
- Capitalize status text ("In Progress" not "in-progress")

**Tests**:
- Unit: Renders with pending status and gray background
- Unit: Renders with in-progress status and blue background
- Unit: Renders with completed status and green background
- Unit: Renders with failed status and red background
- Unit: Capitalizes and formats status text correctly
- Unit: Applies sm size classes when size="sm"
- Unit: Applies md size classes by default
- Unit: Applies lg size classes when size="lg"
- Unit: Applies correct dark mode classes

**Acceptance**:
- [ ] Component exists in components/status-pill.tsx
- [ ] TypeScript interface defines props correctly
- [ ] All 4 status colors render correctly
- [ ] Size variants work (sm, md, lg)
- [ ] Status text is properly capitalized
- [ ] Dark mode colors work
- [ ] All tests pass
- [ ] Test coverage >= 90%
- [ ] No linter errors
- [ ] Component is exported from components/index.ts (if exists)
