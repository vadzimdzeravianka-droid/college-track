---
name: implement-feature
description: Implement features following TDD, with full test coverage (90%+), linting, and documentation. Use when a ticket in .claude/workflows/tickets/ready/ needs implementation.
license: MIT
compatibility: Requires Node.js, npm, jest, and git
metadata:
  version: "1.0.0"
  author: autonomous-workflow
  stage: implementation
  allowed-tools: Read Write Edit Bash Glob Grep
---

# Feature Implementation Skill

Implement features autonomously with test-driven development, comprehensive coverage, and quality standards.

## When to Use

- Ticket exists in `.claude/workflows/tickets/ready/`
- User asks to "implement" a ticket
- Triggered automatically by workflow orchestration

## Important: Subagent Context

When running as a subagent (via Agent tool), focus on implementation deliverables (code, tests, coverage) rather than workflow operations (git commits, ticket movement). Save all outputs to the specified output directory even if bash/git operations fail or are not approved.

## Implementation Philosophy

**Test-Driven Development (TDD)**:
1. Write failing test (RED)
2. Implement minimal code to pass (GREEN)
3. Refactor for quality (REFACTOR)
4. Repeat

## Process

### Step 1: Load Ticket and Context

Read ticket from `.claude/workflows/tickets/ready/[ticket-id].md`

Extract:
- Subtasks with acceptance criteria
- Files to create/modify
- Test scenarios
- Token budget

Read CLAUDE.md for architectural context.

### Step 2: Create Feature Branch

**Feature Branch Workflow** (recommended):

```bash
# Source git utilities
source .claude/workflows/lib/git-branch-utils.sh

# Extract ticket ID
TICKET_ID="[ticket-id]"

# Determine branch type from ticket ID
BRANCH_TYPE=$(get_branch_type "$TICKET_ID")

# Check current branch
CURRENT_BRANCH=$(get_current_branch)

if is_on_main; then
  echo "📍 On main branch. Creating feature branch..."

  # Create feature branch
  create_feature_branch "$TICKET_ID" "$BRANCH_TYPE"

  # Initial commit: ticket setup
  mv .claude/workflows/tickets/ready/$TICKET_ID.md \
     .claude/workflows/tickets/in-progress/$TICKET_ID.md

  git add .claude/workflows/
  git commit -m "chore($TICKET_ID): initialize feature branch with ticket

Moved ticket to in-progress and ready for implementation.
Branch: ${BRANCH_TYPE}/${TICKET_ID}"

  echo "✅ Feature branch ready: ${BRANCH_TYPE}/${TICKET_ID}"
else
  echo "📍 Already on branch: $CURRENT_BRANCH"
  echo "   Continuing implementation on current branch"

  # Just move ticket if not already moved
  if [[ -f ".claude/workflows/tickets/ready/$TICKET_ID.md" ]]; then
    mv .claude/workflows/tickets/ready/$TICKET_ID.md \
       .claude/workflows/tickets/in-progress/$TICKET_ID.md

    git add .claude/workflows/
    git commit -m "chore($TICKET_ID): move ticket to in-progress"
  fi
fi
```

**Legacy Mode** (direct main branch):

If feature branches not desired, set in `.claude/workflows/config.json`:
```json
{
  "git": {
    "use_feature_branches": false
  }
}
```

Then skip branch creation and work directly on main.

### Step 3: Set Up Test Environment

Verify test environment:
```bash
npm test -- --listTests
```

Ensure jest.config.js is properly configured. Check coverage thresholds.

### Step 3: Implement Each Subtask (TDD Cycle)

For each subtask:

#### 3a. Write Failing Test First (RED)

**Before writing any implementation code**, write the test:

```typescript
// Example: lib/__tests__/csv.test.ts
describe('arrayToCSV', () => {
  it('should convert array to CSV with headers', () => {
    const data = [
      { name: 'MIT', location: 'Cambridge' },
      { name: 'Stanford', location: 'Palo Alto' }
    ];
    const result = arrayToCSV(data);
    expect(result).toBe('name,location\nMIT,Cambridge\nStanford,Palo Alto\n');
  });
});
```

Run test to confirm it fails:
```bash
npm test -- csv.test.ts
```

**Expected**: Test fails because `arrayToCSV` doesn't exist yet.

#### 3b. Implement Minimal Code (GREEN)

Write the minimal code to make the test pass:

```typescript
// lib/csv.ts
export function arrayToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');

  const rows = data.map(row =>
    headers.map(header => row[header] ?? '').join(',')
  );

  return [headerRow, ...rows].join('\n') + '\n';
}
```

Run test again:
```bash
npm test -- csv.test.ts
```

**Expected**: Test passes.

#### 3c. Add Edge Case Tests

Add tests for edge cases from ticket:

```typescript
it('should escape commas in values', () => {
  const data = [{ name: 'MIT, Cambridge' }];
  const result = arrayToCSV(data);
  expect(result).toBe('name\n"MIT, Cambridge"\n');
});

it('should handle null values', () => {
  const data = [{ name: 'MIT', location: null }];
  const result = arrayToCSV(data);
  expect(result).toBe('name,location\nMIT,\n');
});
```

#### 3d. Refactor Implementation

Update code to handle edge cases:

```typescript
export function arrayToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(',');

  const escapeValue = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = data.map(row =>
    headers.map(header => escapeValue(row[header])).join(',')
  );

  return [headerRow, ...rows].join('\n') + '\n';
}
```

Run all tests:
```bash
npm test -- csv.test.ts
```

#### 3e. Check Coverage

Verify coverage for this file:
```bash
npm test -- --coverage --collectCoverageFrom="lib/csv.ts"
```

**Target**: >= 90% coverage. If below, add more tests.

### Step 4: Integration Tests

After unit tests pass, write integration tests that test multiple components together:

```typescript
// app/api/export/colleges/__tests__/route.test.ts
describe('GET /api/export/colleges', () => {
  it('should return CSV with all colleges', async () => {
    // Mock database
    const mockColleges = [
      { id: '1', name: 'MIT', category: 'REACH', /* ... */ },
      { id: '2', name: 'Stanford', category: 'REACH', /* ... */ }
    ];

    jest.spyOn(db.college, 'findMany').mockResolvedValue(mockColleges);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/csv');

    const csvText = await response.text();
    expect(csvText).toContain('MIT');
    expect(csvText).toContain('Stanford');
  });
});
```

### Step 5: Component Tests (if applicable)

For React components, use React Testing Library:

```typescript
// components/__tests__/export-button.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportButton } from '../export-button';

describe('ExportButton', () => {
  it('should show loading state during export', async () => {
    render(<ExportButton />);

    const button = screen.getByText('Export CSV');
    fireEvent.click(button);

    expect(screen.getByText('Exporting...')).toBeInTheDocument();
  });
});
```

### Step 6: Run Full Test Suite

After all subtasks implemented:

```bash
npm test
npm run test:coverage
```

**Requirements**:
- All tests pass
- Coverage >= 90% for new code
- No warnings

### Step 7: Lint and Format

```bash
npm run lint
```

Fix any errors. If auto-fix available:
```bash
npm run lint -- --fix
```

### Step 8: Update Documentation

#### Update CLAUDE.md (if architecture changed)

If you added:
- New directory structure
- New architectural pattern
- New utility functions library

Add to CLAUDE.md under relevant section.

#### Update Component Documentation

Add JSDoc comments for exported functions:

```typescript
/**
 * Converts an array of objects to CSV format
 * @param data - Array of objects to convert
 * @returns CSV string with headers and rows
 * @example
 * ```ts
 * const data = [{ name: 'MIT', location: 'Cambridge' }];
 * arrayToCSV(data); // 'name,location\nMIT,Cambridge\n'
 * ```
 */
export function arrayToCSV(data: Record<string, any>[]): string {
  // ...
}
```

### Step 9: Verify Acceptance Criteria

Go through each acceptance criterion in ticket:

```markdown
- [x] Export button appears on dashboard page
- [x] Clicking button downloads CSV file
- [x] CSV includes all fields
- [x] Test coverage >= 90%
- [x] No linter errors
```

If any criterion not met, continue implementing.

**Subagent Context**: If outputs need to be saved to a specific directory (e.g., when running as a subagent via Agent tool), copy all implementation files, test results, and coverage reports to that directory before attempting any git or workflow operations. This ensures deliverables are preserved even if subsequent steps fail.

### Step 10: Create Git Commit (Optional)

**Note**: Git commits are typically handled outside the implementation workflow. If running interactively and user requests commit, create atomic commit with conventional commit message:

```bash
git add .
git commit -m "feat: add CSV export for colleges

- Create CSV utility functions with proper escaping
- Add /api/export/colleges endpoint
- Add ExportButton component with loading states
- Integrate export button into dashboard

Tests: 95% coverage
Closes: EXPORT-CSV-20260326"
```

If running in a subagent context or without explicit user request, skip this step and document the commit message in outputs instead.

### Step 11: Move Ticket to QA (Optional)

**Note**: Ticket movement is typically handled by workflow orchestration. If running interactively and user requests ticket movement:

```bash
mv .claude/workflows/tickets/in-progress/[ticket-id].md .claude/workflows/tickets/qa/[ticket-id].md

# Commit ticket status change
git add .claude/workflows/tickets/
git commit -m "chore([ticket-id]): move ticket to QA stage

Implementation complete, ready for validation."
```

If running in a subagent context or without explicit user request, skip this step and include ticket movement instructions in outputs instead.

**Note**: If on feature branch, commits stay on branch. The validate-quality skill will handle merging to main after all gates pass.

## Quality Standards

### Code Quality
- [ ] No console.log statements (use proper logging if needed)
- [ ] No commented-out code
- [ ] No TODOs without tickets
- [ ] Consistent naming conventions (camelCase for variables, PascalCase for components)

### Test Quality
- [ ] Tests are independent (can run in any order)
- [ ] No flaky tests (pass consistently)
- [ ] Tests describe behavior, not implementation
- [ ] Use descriptive test names

### Security
- [ ] No hardcoded secrets
- [ ] Input validation for user data
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (React auto-escapes)

## Gotchas

### Don't Skip Tests
**Never** implement without tests. TDD is non-negotiable. Tests first, then code.

### Don't Over-Engineer
Match complexity to requirement. Don't add features not in ticket.

### Don't Ignore TypeScript Errors
Fix all type errors. Don't use `any` except when absolutely necessary (and document why).

### Don't Forget Edge Cases
Edge cases from ticket must be tested. They're there for a reason.

### Don't Break Existing Tests
Run full test suite before committing. If existing tests break, fix them or update ticket scope.

### Don't Skip Linting
Linter errors are blockers. Fix before committing.

## Debugging Tips

### Test Fails Unexpectedly

1. Run single test in watch mode:
```bash
npm test -- --watch path/to/test.test.ts
```

2. Add debug output:
```typescript
console.log('Actual:', result);
console.log('Expected:', expected);
```

3. Check test isolation (does it pass alone but fail with others?)

### Coverage Below 90%

1. See uncovered lines:
```bash
npm test -- --coverage --collectCoverageFrom="path/to/file.ts"
```

2. Add tests for uncovered branches:
```typescript
// Test both if/else branches
it('should handle empty array', () => {
  expect(arrayToCSV([])).toBe('');
});

it('should handle non-empty array', () => {
  expect(arrayToCSV([{ a: 1 }])).toBe('a\n1\n');
});
```

### Linter Errors

Common fixes:
- Unused imports: Remove them
- Missing dependencies: Add to useEffect deps array
- Prefer const: Change `let` to `const` if not reassigned

## Self-Learning Integration

After implementation, save metrics to `.claude/workflows/learning/patterns/implementation-[ticket-id].json`:

```json
{
  "ticket_id": "EXPORT-CSV-20260326",
  "subtasks_completed": 4,
  "total_tokens_used": 32000,
  "estimated_tokens": 35000,
  "test_coverage": 0.95,
  "tests_written": 18,
  "linter_errors_fixed": 2,
  "implementation_time_minutes": 45,
  "tdd_cycles": 12,
  "lessons": [
    "CSV escaping took longer than expected - add more detailed examples in tickets",
    "React Testing Library mocks were straightforward - document pattern"
  ]
}
```

## Example TDD Cycle

**Ticket**: Add export button to dashboard

**Cycle 1: Button Renders**
```typescript
// Test (RED)
it('should render export button', () => {
  render(<Dashboard />);
  expect(screen.getByText('Export CSV')).toBeInTheDocument();
});

// Code (GREEN)
<button>Export CSV</button>

// Run test: PASSES
```

**Cycle 2: Button Triggers Export**
```typescript
// Test (RED)
it('should call export API on click', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      blob: () => Promise.resolve(new Blob())
    })
  );

  render(<ExportButton />);
  fireEvent.click(screen.getByText('Export CSV'));

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith('/api/export/colleges');
  });
});

// Code (GREEN)
const handleExport = async () => {
  const response = await fetch('/api/export/colleges');
  const blob = await response.blob();
  // ... download logic
};

<button onClick={handleExport}>Export CSV</button>

// Run test: PASSES
```

**Cycle 3: Show Loading State**
```typescript
// Test (RED)
it('should show loading state', async () => {
  render(<ExportButton />);
  fireEvent.click(screen.getByText('Export CSV'));

  expect(screen.getByText('Exporting...')).toBeInTheDocument();
});

// Code (GREEN)
const [loading, setLoading] = useState(false);

const handleExport = async () => {
  setLoading(true);
  try {
    // ... export logic
  } finally {
    setLoading(false);
  }
};

<button disabled={loading}>
  {loading ? 'Exporting...' : 'Export CSV'}
</button>

// Run test: PASSES
```

## References

- See `references/tdd_examples.md` for more TDD patterns
- See `references/testing_patterns.md` for testing utilities and mocks
- See CLAUDE.md for project-specific patterns
