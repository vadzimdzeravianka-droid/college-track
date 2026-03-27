---
name: groom-requirement
description: Transform vague user requirements into detailed, actionable specifications enriched with best practices, edge cases, and implementation approaches. Use when user drops a requirement in .claude/workflows/requirements/inbox/ or asks to groom a requirement.
license: MIT
compatibility: Requires access to memory system and WebFetch for best practices research
metadata:
  version: "1.0.0"
  author: autonomous-workflow
  stage: requirements-grooming
---

# Requirements Grooming Skill

Transform high-level user requirements into detailed, actionable specifications that implementation agents can execute with minimal ambiguity.

## When to Use

- User drops a markdown file in `.claude/workflows/requirements/inbox/`
- User explicitly asks to "groom" or "analyze" a requirement
- Triggered automatically by workflow orchestration

## Process

### Step 1: Read and Analyze Original Requirement

Read the requirement file from `inbox/` directory. Extract:
- **Core objective**: What does the user want to achieve?
- **Explicit constraints**: Any mentioned deadlines, technologies, or limitations
- **Implicit assumptions**: What the user might be assuming but didn't state

### Step 2: Research Best Practices

Use WebFetch to research relevant best practices for the type of feature requested. Focus on:
- Next.js 15 App Router patterns
- React 19 best practices
- Prisma ORM patterns
- Testing strategies for this type of feature

**Do not** waste time on generic advice. Look for specific patterns applicable to this codebase.

### Step 3: Brainstorm Implementation Approaches

Generate 2-3 distinct implementation approaches. For each:
- **Description**: How would this work?
- **Pros**: Why is this good?
- **Cons**: What are the trade-offs?
- **Token estimate**: Rough estimate of implementation complexity

Choose approaches that balance:
- Code maintainability
- Performance
- Token efficiency
- Alignment with existing codebase patterns

### Step 4: Identify Edge Cases

Think through edge cases that the user might not have considered:
- **Data validation**: What invalid inputs could break this?
- **State management**: What happens with concurrent updates?
- **Error handling**: What could go wrong?
- **Security**: Are there injection risks, authorization issues?
- **Performance**: Will this scale with 100+ colleges?

### Step 5: Define Acceptance Criteria

Create clear, testable acceptance criteria. Each criterion should be:
- **Specific**: No vague language like "works well"
- **Measurable**: Can be tested programmatically
- **Achievable**: Within scope of requirement
- **Relevant**: Directly related to user's goal

Format:
```markdown
- [ ] Criterion 1 (specific behavior, observable outcome)
- [ ] Criterion 2 (test scenario that must pass)
```

### Step 6: Learn from Past Requirements

Before writing output, check memory system:
```bash
# Search for similar past requirements
grep -r "similar-pattern" .claude/memory/
```

If similar requirements were handled before:
- Apply lessons learned
- Reuse successful patterns
- Avoid past mistakes documented in feedback memories

### Step 7: Write Groomed Requirement

Save to `.claude/workflows/requirements/groomed/[original-filename]` with this structure:

```markdown
# Requirement: [Descriptive Title]

## Original Request
[User's original text, unchanged]

## Enriched Requirement

[Detailed specification with context from CLAUDE.md and codebase analysis]

### Context
- **Affected areas**: [List files/components that will change]
- **Dependencies**: [Any new packages or services needed]
- **Related features**: [Existing features this builds on or impacts]

## Implementation Approaches

### Approach A: [Name]
**Description**: [How it works]

**Pros**:
- [Benefit 1]
- [Benefit 2]

**Cons**:
- [Trade-off 1]
- [Trade-off 2]

**Token Estimate**: ~[X]K tokens

### Approach B: [Name]
[Same structure]

**Recommended**: Approach [A/B] because [reasoning]

## Edge Cases & Considerations

### Data Validation
- [Edge case 1]
- [Edge case 2]

### Security
- [Security consideration 1]

### Performance
- [Performance consideration]

## Acceptance Criteria

- [ ] [Specific testable criterion 1]
- [ ] [Specific testable criterion 2]
- [ ] [Specific testable criterion 3]
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors
- [ ] Documentation updated

## Test Scenarios

1. **Happy path**: [Description]
2. **Edge case 1**: [Description]
3. **Error case**: [Description]

## Token Budget Estimate

- Implementation: [X]K tokens
- Testing: [X]K tokens
- QA: [X]K tokens
- **Total**: ~[X]K tokens

## References
- [Link to relevant CLAUDE.md sections]
- [Link to similar past features]
- [External best practice articles]
```

### Step 8: Move Original to Archive

After grooming, move the original requirement:
```bash
mv .claude/workflows/requirements/inbox/[file] .claude/workflows/requirements/archive/[file]
```

## Quality Checklist

Before finalizing, verify:
- [ ] All acceptance criteria are testable
- [ ] At least 2 implementation approaches provided
- [ ] Edge cases include security, performance, data validation
- [ ] Token budget estimated
- [ ] Similar past requirements were reviewed
- [ ] Best practices research was conducted
- [ ] Recommended approach has clear reasoning

## Gotchas

- **Don't over-engineer**: Match detail level to complexity. Simple features don't need exhaustive analysis.
- **Don't repeat CLAUDE.md**: Reference it, don't copy its content.
- **Don't ignore memory**: Past mistakes documented in feedback memories are critical.
- **Don't guess best practices**: Use WebFetch to verify current patterns, especially for Next.js 15.

## Example Usage

**Input** (in inbox/):
```markdown
# Add export feature

I want to export all colleges to CSV file
```

**Output** (in groomed/):
```markdown
# Requirement: CSV Export Feature for Colleges

## Original Request
I want to export all colleges to CSV file

## Enriched Requirement

Add a CSV export button to the dashboard that exports all college data to a downloadable CSV file, preserving all fields including portal credentials.

### Context
- **Affected areas**:
  - `app/(protected)/dashboard/page.tsx` (add export button)
  - `app/api/export/colleges/route.ts` (new API route)
  - `components/export-button.tsx` (new component)
- **Dependencies**: None (use native CSV generation)
- **Related features**: Existing college list fetching in dashboard

## Implementation Approaches

### Approach A: Client-Side CSV Generation
**Description**: Fetch all colleges via existing `getColleges()` action, generate CSV in browser using array-to-CSV logic, trigger download via `<a download>`.

**Pros**:
- No new API route needed
- Instant download (no server round-trip)
- Lower token usage (~15K)

**Cons**:
- Portal passwords visible in browser memory
- Limited to memory-available data (not scalable to 1000+ colleges)

**Token Estimate**: ~15K tokens

### Approach B: Server-Side CSV Generation
**Description**: Create API route `/api/export/colleges` that fetches from database, generates CSV server-side, streams as response with `Content-Disposition: attachment`.

**Pros**:
- Passwords never exposed to client
- Scales to any data size
- Can add access logging

**Cons**:
- More token-intensive (~25K)
- Slightly slower user experience

**Token Estimate**: ~25K tokens

**Recommended**: Approach B for security (passwords should not be in client memory)

## Edge Cases & Considerations

### Data Validation
- What if no colleges exist? (show message "No colleges to export")
- What if college has null fields? (use empty string in CSV)

### Security
- **Critical**: Portal passwords should not be accessible in browser memory
- Verify user is authenticated before allowing export
- Consider adding audit log of who exported when

### Performance
- With 100 colleges: ~50KB CSV, instant
- Should handle up to 1000 colleges without timeout

## Acceptance Criteria

- [ ] Export button appears on dashboard page
- [ ] Clicking button downloads CSV file named `colleges-export-YYYY-MM-DD.csv`
- [ ] CSV includes all fields: name, category, status, strategy, deadlines, location, major, portal credentials, notes
- [ ] CSV headers use human-readable names (e.g., "College Name" not "name")
- [ ] Empty/null fields show as empty CSV cells
- [ ] If no colleges exist, show toast message "No colleges to export"
- [ ] Only authenticated users can access export endpoint
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors

## Test Scenarios

1. **Happy path**: User with 5 colleges clicks export, receives CSV with all 5 colleges
2. **Empty state**: User with 0 colleges clicks export, sees "No colleges to export" message
3. **Null fields**: College with null location exports with empty location cell
4. **Auth required**: Unauthenticated request to /api/export/colleges returns 401

## Token Budget Estimate

- Implementation: 20K tokens (API route + component + integration)
- Testing: 8K tokens (unit + integration tests)
- QA: 5K tokens (E2E + validation)
- **Total**: ~33K tokens

## References
- CLAUDE.md: Server Actions Pattern (actions/college.ts)
- Similar feature: Dashboard filters (already fetches colleges)
- Best practice: [Next.js API routes with streaming](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
```

## Self-Learning Integration

After each grooming session, capture:
- Time taken (for efficiency tracking)
- Approaches considered vs. recommended
- If implementation deviates from groomed requirement, why?

Save to `.claude/workflows/learning/patterns/grooming-[timestamp].json`:
```json
{
  "requirement_id": "csv-export",
  "time_minutes": 12,
  "approaches_count": 2,
  "recommended_approach": "B",
  "token_estimate": 33000,
  "actual_tokens": 31500,
  "accuracy": 0.95
}
```

## References

- See `references/grooming_best_practices.md` for detailed examples
- See `.claude/memory/feedback_autonomous_workflow.md` for lessons learned
