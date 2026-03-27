---
name: create-ticket
description: Convert groomed requirements into executable tickets with subtasks, acceptance criteria, and test scenarios. Use when a groomed requirement is ready for implementation planning.
license: MIT
compatibility: Requires Glob, Grep for codebase analysis
metadata:
  version: "1.0.0"
  author: autonomous-workflow
  stage: ticket-creation
---

# Ticket Creation Skill

Transform groomed requirements into structured, executable tickets that implementation agents can work on autonomously.

## When to Use

- Groomed requirement exists in `.claude/workflows/requirements/groomed/`
- User asks to "create ticket" or "break down requirement"
- Triggered by workflow after grooming completes

## Process

### Step 1: Read Groomed Requirement

Load the groomed requirement file. Extract:
- Recommended implementation approach
- Acceptance criteria
- Edge cases
- Token budget estimate

### Step 2: Analyze Codebase Impact

Use Glob and Grep to identify affected areas:

```bash
# Find related components
Glob pattern="**/*.{ts,tsx}" path="app/"
Glob pattern="**/*.{ts,tsx}" path="components/"

# Search for patterns
Grep pattern="export.*function.*getColleges" output_mode="files_with_matches"
Grep pattern="Server Actions|'use server'" output_mode="files_with_matches"
```

Map out:
- **Files to modify**: Existing files that need changes
- **Files to create**: New files required
- **Dependencies**: Imports and exports to wire up

### Step 3: Break Into Subtasks

Decompose into 3-5 subtasks. Each subtask should:
- Take ~5-10K tokens to implement
- Have clear input/output
- Be independently testable
- Follow logical dependency order

**Bad subtask**: "Implement the feature"
**Good subtask**: "Create CSV generation utility function in lib/utils.ts with tests"

### Step 4: Define Test Strategy

For each subtask, specify:
- **Unit tests**: Functions to test in isolation
- **Integration tests**: Multi-component interactions to test
- **E2E tests**: User flows to validate

### Step 5: Estimate Complexity

Rate each subtask:
- **Simple** (5K tokens): Pure functions, UI components
- **Medium** (15K tokens): Server actions, complex components
- **Complex** (30K tokens): Multi-file features, tricky logic

Total should match groomed requirement's token estimate.

### Step 6: Create Ticket File

Save to `.claude/workflows/tickets/ready/[ticket-id].md`:

```markdown
# Ticket: [Feature Name]

**Status**: READY
**Priority**: [HIGH/MEDIUM/LOW]
**Estimated Tokens**: [X]K
**Groomed Requirement**: [Link to groomed requirement file]

## Summary

[1-2 sentence description of what needs to be built]

## Implementation Approach

[Selected approach from groomed requirement, with brief rationale]

## Affected Files

### To Modify
- `path/to/file1.ts` - [What changes]
- `path/to/file2.tsx` - [What changes]

### To Create
- `path/to/new-file.ts` - [Purpose]

## Subtasks

### Subtask 1: [Title]
**Complexity**: [Simple/Medium/Complex]
**Estimated Tokens**: [X]K

**Description**: [What to implement]

**Files**:
- Create/Modify: `path/to/file`

**Tests**:
- Unit: Test [specific function]
- Integration: Test [interaction]

**Acceptance**:
- [ ] [Specific criterion]

---

### Subtask 2: [Title]
[Same structure]

---

## Acceptance Criteria

(Copied from groomed requirement)

- [ ] Criterion 1
- [ ] Criterion 2

## Test Scenarios

### Unit Tests
- [ ] Test [scenario 1]
- [ ] Test [scenario 2]

### Integration Tests
- [ ] Test [multi-component scenario]

### E2E Tests
- [ ] User flow: [description]

## Edge Cases to Handle

(From groomed requirement)

- [Edge case 1]
- [Edge case 2]

## Definition of Done

- [ ] All subtasks completed
- [ ] All acceptance criteria met
- [ ] Test coverage >= 90%
- [ ] All tests passing
- [ ] No linter errors
- [ ] CLAUDE.md updated if architecture changed
- [ ] PR description generated

## Token Budget

| Stage | Estimated |
|-------|-----------|
| Subtask 1 | [X]K |
| Subtask 2 | [X]K |
| Testing | [X]K |
| QA | [X]K |
| **Total** | **[X]K** |

## Dependencies

- [ ] No blocking dependencies
OR
- [ ] Blocked by: [ticket-id]

## References

- Groomed requirement: `.claude/workflows/requirements/groomed/[file]`
- Related code: [file paths]
- CLAUDE.md sections: [relevant sections]
```

### Step 7: Validate Ticket Quality

Before saving, check:
- [ ] Subtasks are atomic and independently testable
- [ ] Total subtasks between 3-5 (if more, consider splitting ticket)
- [ ] Test strategy covers unit, integration, E2E
- [ ] Token estimate matches groomed requirement
- [ ] All file paths are valid (use Glob to verify)
- [ ] Dependencies are clearly marked

## Ticket ID Format

Use semantic ID: `[FEATURE-TYPE]-[SHORT-NAME]-[YYYYMMDD]`

Examples:
- `EXPORT-CSV-20260326`
- `FILTER-STATUS-20260327`
- `BUGFIX-DATES-20260328`

## Quality Checklist

- [ ] Each subtask takes < 15K tokens
- [ ] Total subtasks <= 5 (if more, split into multiple tickets)
- [ ] Test coverage strategy defined
- [ ] All file paths validated with Glob
- [ ] Acceptance criteria are testable
- [ ] Token budget broken down per subtask

## Gotchas

- **Don't create too many subtasks**: More than 5 usually means the ticket is too large
- **Don't skip file analysis**: Use Glob/Grep to verify file paths exist
- **Don't forget existing patterns**: Check CLAUDE.md for established patterns (e.g., Server Actions)
- **Don't guess file locations**: Use Glob to find similar existing files

## Example

**Input**: Groomed requirement for CSV export

**Output**:
```markdown
# Ticket: CSV Export for Colleges

**Status**: READY
**Priority**: MEDIUM
**Estimated Tokens**: 33K
**Groomed Requirement**: `.claude/workflows/requirements/groomed/csv-export.md`

## Summary

Add CSV export functionality to download all college data from dashboard, using server-side generation for security.

## Implementation Approach

Server-side CSV generation via new API route. Chosen for security (passwords stay server-side) and scalability.

## Affected Files

### To Create
- `app/api/export/colleges/route.ts` - API route for CSV generation
- `components/export-button.tsx` - Export button component
- `lib/csv.ts` - CSV utility functions

### To Modify
- `app/(protected)/dashboard/page.tsx` - Add export button to dashboard

## Subtasks

### Subtask 1: Create CSV Utility Functions
**Complexity**: Simple
**Estimated Tokens**: 8K

**Description**: Create reusable CSV generation utilities in lib/csv.ts with functions to convert array of objects to CSV string with proper escaping.

**Files**:
- Create: `lib/csv.ts`
- Create: `lib/__tests__/csv.test.ts`

**Tests**:
- Unit: Test CSV generation with various data types
- Unit: Test CSV escaping (commas, quotes, newlines)
- Unit: Test empty array handling

**Acceptance**:
- [ ] Function `arrayToCSV(data, headers)` converts array to CSV
- [ ] Properly escapes quotes, commas, newlines
- [ ] Handles null/undefined values as empty cells
- [ ] Test coverage >= 95%

---

### Subtask 2: Create API Route for Export
**Complexity**: Medium
**Estimated Tokens**: 12K

**Description**: Create /api/export/colleges route that fetches all colleges from database and returns CSV file download.

**Files**:
- Create: `app/api/export/colleges/route.ts`

**Tests**:
- Integration: Test API returns CSV with correct headers
- Integration: Test API requires authentication
- Integration: Test CSV contains all colleges

**Acceptance**:
- [ ] GET /api/export/colleges returns CSV file
- [ ] CSV includes all college fields
- [ ] Response has Content-Disposition: attachment header
- [ ] Unauthenticated requests return 401

---

### Subtask 3: Create Export Button Component
**Complexity**: Simple
**Estimated Tokens**: 6K

**Description**: Create reusable ExportButton component that triggers download from API route with loading state and error handling.

**Files**:
- Create: `components/export-button.tsx`
- Create: `components/__tests__/export-button.test.tsx`

**Tests**:
- Unit: Test button click triggers fetch
- Unit: Test loading state
- Unit: Test error handling

**Acceptance**:
- [ ] Component shows loading state during export
- [ ] Shows error toast on failure
- [ ] Triggers download on success

---

### Subtask 4: Integrate Export Button into Dashboard
**Complexity**: Simple
**Estimated Tokens**: 4K

**Description**: Add ExportButton to dashboard page header, next to "Add College" button.

**Files**:
- Modify: `app/(protected)/dashboard/page.tsx`

**Tests**:
- E2E: User clicks export button and receives CSV file
- E2E: CSV contains all dashboard colleges

**Acceptance**:
- [ ] Export button visible on dashboard
- [ ] Button placement is intuitive (header area)
- [ ] Respects responsive design

---

## Acceptance Criteria

- [ ] Export button appears on dashboard page
- [ ] Clicking button downloads CSV file named `colleges-export-YYYY-MM-DD.csv`
- [ ] CSV includes all fields: name, category, status, strategy, deadlines, location, major, portal credentials, notes
- [ ] CSV headers use human-readable names
- [ ] Empty/null fields show as empty CSV cells
- [ ] If no colleges exist, show toast message
- [ ] Only authenticated users can export
- [ ] Test coverage >= 90%
- [ ] No linter errors

## Test Scenarios

### Unit Tests
- [ ] CSV generation with various data types
- [ ] CSV escaping edge cases
- [ ] Export button loading states
- [ ] API route authentication

### Integration Tests
- [ ] API route returns valid CSV
- [ ] CSV contains all database colleges
- [ ] Error handling for API failures

### E2E Tests
- [ ] User exports colleges successfully
- [ ] Downloaded file opens in Excel/Numbers correctly
- [ ] Empty state shows appropriate message

## Edge Cases to Handle

- No colleges in database → Show message instead of download
- College with null fields → Empty CSV cells
- College with quotes/commas in name → Proper escaping
- Unauthenticated user → 401 response

## Definition of Done

- [ ] All 4 subtasks completed
- [ ] All acceptance criteria met
- [ ] Test coverage >= 90%
- [ ] All tests passing
- [ ] No linter errors
- [ ] CLAUDE.md updated if needed
- [ ] PR description generated

## Token Budget

| Stage | Estimated |
|-------|-----------|
| Subtask 1 (CSV utils) | 8K |
| Subtask 2 (API route) | 12K |
| Subtask 3 (Button component) | 6K |
| Subtask 4 (Integration) | 4K |
| QA & E2E | 5K |
| **Total** | **35K** |

## Dependencies

- [ ] No blocking dependencies

## References

- Groomed requirement: `.claude/workflows/requirements/groomed/csv-export.md`
- Similar pattern: `actions/college.ts` (server actions)
- API routes: `app/api/` directory structure
```

## Self-Learning

Track ticket creation patterns in `.claude/workflows/learning/patterns/ticketing-[timestamp].json`:
```json
{
  "ticket_id": "EXPORT-CSV-20260326",
  "subtask_count": 4,
  "estimated_tokens": 35000,
  "actual_tokens": 32000,
  "subtasks_changed_during_impl": 1,
  "lessons": "Initial API route estimate was too high; CSV library made it simpler"
}
```
