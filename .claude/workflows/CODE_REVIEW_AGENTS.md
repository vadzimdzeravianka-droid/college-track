# Autonomous Code Review Agent System

**Purpose**: Independent, comprehensive code review that runs in background after feature completion, similar to GitHub Copilot PR reviews but more thorough and tailored to project standards.

**When**: Triggered automatically after validate-quality passes and before final commit/merge.

**Output**: Detailed review report with findings, suggestions, and approval/rejection decision.

---

## Review Agent Team

### 1. 🔒 Security Reviewer
**Role**: Security vulnerabilities and best practices

**Checks**:
- ✅ No hardcoded secrets, API keys, or passwords
- ✅ Input validation on all user inputs (XSS, SQL injection prevention)
- ✅ Authentication checks on protected routes
- ✅ Authorization properly enforced
- ✅ No eval() or dangerous code execution
- ✅ CSRF protection where needed
- ✅ Secure cookie settings (httpOnly, secure, sameSite)
- ✅ Dependencies have no known vulnerabilities
- ✅ Sensitive data not logged
- ✅ Rate limiting on API routes (if applicable)

**Tools**:
- Pattern matching for secrets (regex for keys, tokens)
- Dependency vulnerability scanning
- Code flow analysis for auth bypass

**Output Format**:
```markdown
## Security Review

**Status**: PASS / NEEDS ATTENTION / FAIL

### Findings:
- 🔴 CRITICAL: [description]
- 🟡 WARNING: [description]
- 🟢 OK: [description]

### Recommendations:
1. [Action item]
```

---

### 2. 🧹 Code Quality Reviewer
**Role**: Code cleanliness, duplication, and maintainability

**Checks**:
- ✅ No commented-out code
- ✅ No console.log() statements (use proper logging)
- ✅ No TODO comments without ticket references
- ✅ No code duplication (DRY principle)
- ✅ Functions are single-purpose and well-named
- ✅ No magic numbers (use named constants)
- ✅ No overly complex functions (cyclomatic complexity)
- ✅ Proper error handling (no empty catch blocks)
- ✅ TypeScript used everywhere (no 'any' without eslint-disable comment)
- ✅ Proper imports (no wildcard imports where avoidable)

**Tools**:
- AST parsing for pattern detection
- Complexity analysis
- Duplication detection (similar code blocks)

**Output Format**:
```markdown
## Code Quality Review

**Status**: PASS / NEEDS ATTENTION / FAIL

### Issues Found:
- Line 45: Commented-out code should be removed
- Line 120-180: Duplicate logic, extract to shared function
- Function `handleSubmit`: Cyclomatic complexity 12 (max 10)

### Improvements:
1. Extract duplicated form validation to `lib/form-utils.ts`
2. Replace magic number 86400000 with named constant `ONE_DAY_MS`
```

---

### 3. 🏗️ Architecture Reviewer
**Role**: Project structure and architectural patterns

**Checks**:
- ✅ Files in correct directories (components/, actions/, lib/, etc.)
- ✅ Server Actions properly marked with "use server"
- ✅ Client Components properly marked with "use client"
- ✅ Follows App Router conventions (app/, not pages/)
- ✅ API routes in app/api/ with proper structure
- ✅ Shared utilities in lib/
- ✅ Schemas in schemas/ directory
- ✅ No business logic in components (use actions/hooks)
- ✅ Proper data flow (actions → components)
- ✅ Database queries only in Server Actions
- ✅ Follows existing patterns from CLAUDE.md

**Tools**:
- File structure analysis
- Import graph analysis
- Pattern matching against CLAUDE.md guidelines

**Output Format**:
```markdown
## Architecture Review

**Status**: PASS / NEEDS ATTENTION / FAIL

### Structure Issues:
- `components/api-handler.tsx`: Business logic should be in actions/
- `app/dashboard/utils.ts`: Should move to lib/dashboard-utils.ts

### Pattern Compliance:
✅ Server Actions pattern followed
✅ Prisma queries only in actions
🟡 Client component could be simplified
```

---

### 4. ♻️ Reusability Reviewer
**Role**: Identify shared code and ensure proper component reuse

**Checks**:
- ✅ Common UI patterns use shadcn/ui components
- ✅ No custom components where shadcn alternative exists
- ✅ Repeated JSX patterns extracted to components
- ✅ Repeated logic extracted to hooks or utilities
- ✅ Repeated type definitions in types/ or shared location
- ✅ Consistent naming conventions
- ✅ Proper component composition (not prop drilling)
- ✅ Reusable components have proper TypeScript interfaces

**Shadcn Components to Prefer**:
- Button, Input, Select, Checkbox, Dialog, Card
- Label, Separator, Badge, Popover, Calendar
- NavigationMenu, Textarea, Stepper (if available)

**Tools**:
- Pattern matching for repeated JSX
- Component usage analysis
- Shadcn component availability check

**Output Format**:
```markdown
## Reusability Review

**Status**: PASS / NEEDS ATTENTION / FAIL

### Reuse Opportunities:
- Lines 45-67 & 120-142: Similar form patterns, extract to <FormField> component
- Custom dropdown: Use shadcn Select component instead
- Repeated date formatting: Extract to `lib/date-utils.ts`

### Component Analysis:
✅ Uses shadcn Button, Input, Dialog
🟡 Custom modal: shadcn Dialog available
❌ Custom checkbox: Use shadcn Checkbox
```

---

### 5. 🧪 Test Coverage Reviewer
**Role**: Test quality and coverage

**Checks**:
- ✅ All new functions have unit tests
- ✅ Edge cases are tested
- ✅ Test coverage >= 90% for new code
- ✅ Tests are independent and repeatable
- ✅ Tests describe behavior, not implementation
- ✅ No skipped tests without reason
- ✅ Mocks used appropriately (not over-mocked)
- ✅ Integration tests for critical paths
- ✅ Server Actions have tests
- ✅ Error cases are tested

**Tools**:
- Coverage report parsing
- Test file analysis
- Assertion pattern analysis

**Output Format**:
```markdown
## Test Coverage Review

**Status**: PASS / NEEDS ATTENTION / FAIL

### Coverage:
- Overall: 92% ✅
- New files: 95% ✅
- actions/new-feature.ts: 85% 🟡 (below 90%)

### Missing Tests:
- `calculateTotal()`: No test for negative numbers
- `handleError()`: Error boundary not tested
- Edge case: Empty array input not covered

### Test Quality:
✅ Tests are independent
✅ Good test descriptions
🟡 Some tests could be less brittle (avoid implementation details)
```

---

### 6. 🎨 UI/UX Reviewer
**Role**: Visual quality, responsiveness, accessibility

**Checks**:
- ✅ Responsive design (mobile & desktop)
- ✅ Dark & light mode support
- ✅ Proper Tailwind CSS 4 usage (no deprecated classes)
- ✅ Consistent spacing (using Tailwind spacing scale)
- ✅ Accessible colors (sufficient contrast)
- ✅ Loading states for async operations
- ✅ Error states with user-friendly messages
- ✅ Animations are smooth (not janky)
- ✅ No layout shifts (CLS optimization)
- ✅ Icons from lucide-react (consistent icon set)

**Tools**:
- Tailwind class analysis
- Component visual inspection (if screenshots available)
- Accessibility tree analysis

**Output Format**:
```markdown
## UI/UX Review

**Status**: PASS / NEEDS ATTENTION / FAIL

### Responsive Design:
✅ Mobile breakpoints used (sm:, md:, lg:)
✅ Flexbox/Grid layouts responsive
🟡 Fixed width on some elements (should be max-w-)

### Dark/Light Mode:
✅ Colors use dark: variants
✅ No hardcoded colors (uses theme variables)

### Accessibility:
🟡 Button missing aria-label for icon-only
🟡 Form inputs could use better error messages
✅ Semantic HTML used correctly

### Visual Consistency:
✅ Spacing consistent (p-4, gap-2, etc.)
✅ Lucide icons used
🟡 Button sizes inconsistent (h-10 vs h-11)
```

---

### 7. ⚡ Performance Reviewer
**Role**: Performance optimization and best practices

**Checks**:
- ✅ Images use Next.js Image component
- ✅ No large client-side bundles
- ✅ Proper code splitting (dynamic imports where appropriate)
- ✅ No unnecessary re-renders (memo, useMemo, useCallback used correctly)
- ✅ Database queries optimized (includes, where clauses)
- ✅ No N+1 query problems
- ✅ Efficient data fetching (parallel where possible)
- ✅ Large lists use virtualization (if >100 items)
- ✅ Form submissions are optimized (useTransition, Server Actions)
- ✅ Static pages are actually static (no unnecessary dynamic rendering)

**Tools**:
- Bundle size analysis
- React component render analysis
- Database query inspection

**Output Format**:
```markdown
## Performance Review

**Status**: PASS / NEEDS ATTENTION / FAIL

### Bundle Size:
✅ Component size acceptable (<50KB)
✅ No large dependencies added

### Rendering:
🟡 Component re-renders on every prop change (consider memo)
✅ Form uses useTransition correctly

### Database:
✅ Uses includes for related data (no N+1)
✅ Proper indexing on query fields
🟡 Could batch multiple queries

### Core Web Vitals Impact:
✅ LCP: Minimal impact
✅ CLS: No layout shifts introduced
✅ FID: Interactions respond quickly
```

---

### 8. 📱 Responsive/Mobile Reviewer
**Role**: Mobile-first design validation

**Checks**:
- ✅ Mobile breakpoint classes used (sm:, md:, lg:, xl:)
- ✅ Touch targets >= 44x44px
- ✅ No horizontal scroll on mobile
- ✅ Text readable without zoom (min 16px)
- ✅ Forms work well on mobile keyboards
- ✅ Navigation accessible on mobile (hamburger menu if needed)
- ✅ Modals/dialogs work on small screens
- ✅ Tables responsive (horizontal scroll or stack)
- ✅ Images don't overflow on mobile

**Output Format**:
```markdown
## Mobile/Responsive Review

**Status**: PASS / NEEDS ATTENTION / FAIL

### Mobile Breakpoints:
✅ All sections have mobile variants
✅ Grid collapses on small screens (grid-cols-1 sm:grid-cols-2)

### Touch Interaction:
✅ Buttons sized appropriately (min-h-10)
🟡 Some clickable areas too small on mobile

### Layout:
✅ No horizontal overflow
✅ Content stacks properly on mobile
```

---

### 9. 🎯 TypeScript Reviewer
**Role**: TypeScript best practices (2026 standards)

**Checks**:
- ✅ No 'any' without explicit reason and eslint-disable comment
- ✅ Proper type definitions (interfaces/types)
- ✅ Generic types used correctly
- ✅ No type assertions (as) unless necessary
- ✅ Proper return types on functions
- ✅ Zod schemas for runtime validation
- ✅ Type inference used where appropriate
- ✅ No non-null assertions (!) unless safe
- ✅ Enum or const objects instead of magic strings
- ✅ Strict mode enabled features utilized

**Output Format**:
```markdown
## TypeScript Review

**Status**: PASS / NEEDS ATTENTION / FAIL

### Type Safety:
✅ All functions have return types
✅ Interfaces defined for complex objects
🟡 Using 'as' assertion on line 45 (could be type guard instead)

### Modern Practices (2026):
✅ Using satisfies operator
✅ Const type parameters used
✅ Zod schemas for validation
🟡 Could use branded types for IDs
```

---

### 10. 📋 Best Practices Reviewer
**Role**: General Next.js 15, React 19, and project conventions

**Checks**:
- ✅ Next.js 15 App Router patterns followed
- ✅ React 19 features used correctly (useTransition, Server Components)
- ✅ No deprecated APIs used
- ✅ Proper use of Server vs Client Components
- ✅ Metadata API used for SEO (if applicable)
- ✅ Environment variables properly accessed
- ✅ Error boundaries where appropriate
- ✅ Suspense boundaries for async components
- ✅ Loading states for data fetching
- ✅ Proper form handling (Server Actions, not client POST)

**Output Format**:
```markdown
## Best Practices Review

**Status**: PASS / NEEDS ATTENTION / FAIL

### Next.js 15:
✅ Uses App Router correctly
✅ Server Actions for mutations
✅ Proper use of revalidatePath
🟡 Could use Partial Prerendering for faster loads

### React 19:
✅ useTransition for form submissions
✅ Server Components by default
✅ Proper use of 'use client' directive

### Project Conventions:
✅ Follows CLAUDE.md patterns
✅ Consistent file structure
✅ Conventional commit messages
```

---

## Review Orchestration

### Execution Flow

```
Feature Implementation Complete
         ↓
validate-quality passes (7 gates)
         ↓
Trigger Code Review (background)
         ↓
Run 10 reviewers in parallel
         ↓
Aggregate results
         ↓
Generate consolidated report
         ↓
Decision: APPROVE / REQUEST_CHANGES / REJECT
         ↓
If APPROVE → Auto-commit
If REQUEST_CHANGES → Block commit, report issues
If REJECT → Block commit, list critical issues
```

### Review Thresholds

**Auto-Approve Criteria**:
- ✅ Zero CRITICAL issues
- ✅ ≤ 2 WARNING issues
- ✅ All core checks pass (security, tests, architecture)

**Request Changes Criteria**:
- 🟡 1-3 CRITICAL issues
- 🟡 3-10 WARNING issues
- 🟡 Core checks pass but improvements needed

**Reject Criteria**:
- 🔴 4+ CRITICAL issues
- 🔴 Any security vulnerability
- 🔴 Test coverage < 70%
- 🔴 Major architectural violations

---

## Consolidated Report Format

```markdown
# Code Review Report

**Ticket**: [TICKET-ID]
**Date**: [YYYY-MM-DD HH:MM]
**Decision**: APPROVE ✅ / REQUEST CHANGES 🟡 / REJECT ❌

## Executive Summary

- Total Issues: [X]
  - Critical: [X] 🔴
  - Warnings: [X] 🟡
  - Suggestions: [X] 🟢
- Overall Quality Score: [X]/100

## Critical Issues (Must Fix)

1. **Security**: [Issue]
   - File: `path/to/file.ts:45`
   - Severity: CRITICAL
   - Fix: [Specific action]

## Warnings (Should Fix)

1. **Code Quality**: [Issue]
   - File: `path/to/file.ts:120`
   - Severity: WARNING
   - Fix: [Specific action]

## Suggestions (Nice to Have)

1. **Performance**: [Issue]
   - File: `path/to/file.ts:200`
   - Severity: SUGGESTION
   - Fix: [Specific action]

## Reviewer Scores

| Reviewer | Score | Status |
|----------|-------|--------|
| Security | 100/100 | ✅ PASS |
| Code Quality | 85/100 | 🟡 NEEDS ATTENTION |
| Architecture | 95/100 | ✅ PASS |
| Reusability | 90/100 | ✅ PASS |
| Test Coverage | 92/100 | ✅ PASS |
| UI/UX | 88/100 | ✅ PASS |
| Performance | 95/100 | ✅ PASS |
| Mobile/Responsive | 90/100 | ✅ PASS |
| TypeScript | 93/100 | ✅ PASS |
| Best Practices | 90/100 | ✅ PASS |

**Overall Score**: 91/100

## Next Actions

[If APPROVE]
✅ All reviewers approved. Ready to commit.

[If REQUEST CHANGES]
⚠️ Address warnings before committing. See issues above.

[If REJECT]
❌ Critical issues must be fixed. Do not commit.

## Detailed Reports

See individual reviewer reports:
- `.claude/workflows/code-reviews/[ticket-id]/security.md`
- `.claude/workflows/code-reviews/[ticket-id]/code-quality.md`
- [etc.]
```

---

## Implementation Notes

### Agent Configuration

Each reviewer should be:
- **Independent**: Can run in parallel
- **Fast**: Complete in < 30 seconds each
- **Deterministic**: Same input → same output
- **Actionable**: Provide specific file:line references

### Integration with Workflow

Add to `.claude/skills/validate-quality/SKILL.md`:

```markdown
### Step 11: Code Review (Background)

After all validation gates pass, trigger code review in background:

```bash
# Run in background (non-blocking)
claude "Run code review agents for [TICKET-ID]" &
```

Review runs independently and generates report in:
`.claude/workflows/code-reviews/[ticket-id]/report.md`

If review finds CRITICAL issues, notify user before commit.
```

### Storage Structure

```
.claude/workflows/code-reviews/
├── [TICKET-ID]/
│   ├── report.md                 # Consolidated report
│   ├── security.md               # Individual reviewer reports
│   ├── code-quality.md
│   ├── architecture.md
│   ├── reusability.md
│   ├── test-coverage.md
│   ├── ui-ux.md
│   ├── performance.md
│   ├── mobile-responsive.md
│   ├── typescript.md
│   └── best-practices.md
└── metrics.json                  # Aggregate metrics over time
```

---

## Example Usage

```bash
# After validate-quality passes
claude "Run comprehensive code review for CONFIG-ESLINT-20260327"

# Output:
# Running 10 code review agents in parallel...
# [████████████████████] 100% Complete
#
# Review Status: REQUEST CHANGES 🟡
#
# Critical Issues: 0
# Warnings: 3
# Suggestions: 7
#
# Overall Score: 88/100
#
# See detailed report:
# .claude/workflows/code-reviews/CONFIG-ESLINT-20260327/report.md
```

---

## Metrics Tracking

Track review effectiveness in `.claude/workflows/metrics.json`:

```json
{
  "code_reviews": {
    "total": 25,
    "auto_approved": 18,
    "request_changes": 6,
    "rejected": 1,
    "avg_score": 89.5,
    "avg_duration_seconds": 45,
    "common_issues": [
      "Code duplication (12 occurrences)",
      "Missing test coverage (8 occurrences)",
      "Unused imports (6 occurrences)"
    ]
  }
}
```

---

## Future Enhancements

1. **Visual Diff Review**: Screenshot comparison for UI changes
2. **AI-Powered Suggestions**: Use LLM to suggest specific code improvements
3. **Regression Detection**: Compare against previous implementations
4. **Benchmark Comparison**: Performance metrics vs baseline
5. **Automated Fixes**: Auto-fix simple issues (unused imports, formatting)
