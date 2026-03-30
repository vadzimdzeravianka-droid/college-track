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

### Step 0: Classify Requirement Complexity

Before grooming, detect complexity to determine appropriate depth and skip unnecessary work:

```bash
# Read requirement file
INPUT_FILE="$1"  # Path to requirement in inbox/
REQ_CONTENT=$(cat "$INPUT_FILE")

# Token estimation (rough: word count * 1.5)
TOKEN_EST=$(echo "$REQ_CONTENT" | wc -w | awk '{print int($1 * 1.5)}')

# Detect requirement type by keywords
TYPE=""
if echo "$REQ_CONTENT" | grep -qi "config\|eslint\|tsconfig\|playwright\|build"; then
  TYPE="config"
elif echo "$REQ_CONTENT" | grep -qi "sort\|filter\|search\|export\|import\|list"; then
  TYPE="simple_feature"
elif echo "$REQ_CONTENT" | grep -qi "notification\|schedule\|webhook\|email\|cron\|queue"; then
  TYPE="complex_infrastructure"
elif echo "$REQ_CONTENT" | grep -qi "auth\|login\|permission\|security"; then
  TYPE="security"
fi

# Classify complexity based on token estimate and type
if [ "$TYPE" = "config" ] || [ $TOKEN_EST -lt 15000 ]; then
  COMPLEXITY="SIMPLE"
  APPROACHES_COUNT=2
  EDGE_CASE_DEPTH="template"
  SKIP_WEBFETCH="true"
  echo "📊 Complexity: SIMPLE (config or <15K tokens)"

elif [ $TOKEN_EST -lt 40000 ]; then
  COMPLEXITY="MEDIUM"
  APPROACHES_COUNT=2
  EDGE_CASE_DEPTH="systematic"
  SKIP_WEBFETCH="conditional"  # Check cache first
  echo "📊 Complexity: MEDIUM (15-40K tokens)"

else
  COMPLEXITY="COMPLEX"
  APPROACHES_COUNT=3
  EDGE_CASE_DEPTH="comprehensive"
  SKIP_WEBFETCH="false"  # Always research
  echo "📊 Complexity: COMPLEX (>40K tokens or infrastructure)"
fi

echo "🔧 Approaches: $APPROACHES_COUNT, Edge cases: $EDGE_CASE_DEPTH, WebFetch: $SKIP_WEBFETCH"
```

**Complexity Thresholds**:
- **SIMPLE**: Config changes, documentation, <15K tokens estimated
- **MEDIUM**: Standard features, UI updates, 15-40K tokens
- **COMPLEX**: Infrastructure, security, integrations, >40K tokens

### Step 1: Read and Analyze Original Requirement

Read the requirement file from `inbox/` directory. Extract:
- **Core objective**: What does the user want to achieve?
- **Explicit constraints**: Any mentioned deadlines, technologies, or limitations
- **Implicit assumptions**: What the user might be assuming but didn't state

### Step 2: Research Best Practices (CONDITIONAL)

**Only run WebFetch if:**
- Complexity is MEDIUM or COMPLEX
- Feature type is NOVEL (not cached)
- No similar requirement found in memory

```bash
if [ "$SKIP_WEBFETCH" = "true" ]; then
  echo "⏭️  Skipping WebFetch (simple requirement, using cached patterns)"

  # Use cached patterns and CLAUDE.md instead
  BEST_PRACTICES="Use patterns from CLAUDE.md:
- Next.js 15 App Router with Server Actions
- React 19 Server Components
- Prisma ORM with proper types
- 90%+ test coverage
- Tailwind CSS 4 for styling"

elif [ "$SKIP_WEBFETCH" = "conditional" ]; then
  # Check cache first
  CACHE_FILE=".claude/workflows/learning/patterns/best-practices-cache.json"

  # Ensure cache file exists
  if [ ! -f "$CACHE_FILE" ]; then
    echo '{}' > "$CACHE_FILE"
  fi

  # Detect feature type for cache lookup
  FEATURE_TYPE="$TYPE"  # From Step 0

  # Try to get cached best practices
  CACHED=$(jq -r ".\"$FEATURE_TYPE\" // empty" "$CACHE_FILE" 2>/dev/null)

  if [ -n "$CACHED" ] && [ "$CACHED" != "null" ]; then
    echo "📦 Using cached best practices for $FEATURE_TYPE"
    BEST_PRACTICES="$CACHED"
  else
    echo "🌐 Fetching best practices (novel feature type: $FEATURE_TYPE)..."

    # Use WebFetch to research
    # Focus on: Next.js 15, React 19, Prisma, testing strategies
    # [Existing WebFetch logic here]

    # Cache results for future use
    ESCAPED_PRACTICES=$(echo "$BEST_PRACTICES" | jq -Rs .)
    jq ".\"$FEATURE_TYPE\" = $ESCAPED_PRACTICES" "$CACHE_FILE" > tmp.json && mv tmp.json "$CACHE_FILE"
    echo "💾 Cached best practices for future $FEATURE_TYPE requirements"
  fi

else
  # COMPLEX: Always research (novel infrastructure/security patterns)
  echo "🌐 Researching best practices (complex requirement)..."
  # [Existing WebFetch logic]
fi
```

**Do not** waste time on generic advice. Look for specific patterns applicable to this codebase.

**Cache location**: `.claude/workflows/learning/patterns/best-practices-cache.json`

### Steps 3-4: Parallel Analysis (Implementation Approaches + Edge Cases)

Run approach brainstorming and edge case identification **in parallel** to save time:

```bash
# Run both steps concurrently
(
  # Step 3: Brainstorm implementation approaches
  echo "🧠 Brainstorming $APPROACHES_COUNT approach(es)..."

  # Generate approaches based on APPROACHES_COUNT
  # For each approach:
  # - Description: How it works
  # - Pros/Cons: Trade-offs
  # - Token estimate: Implementation complexity
  #
  # Balance: maintainability, performance, token efficiency, codebase alignment

  # Save to temporary file
  cat > /tmp/approaches-$$.md << 'EOF'
[Generated approaches based on $APPROACHES_COUNT]
EOF
) &
APPROACHES_PID=$!

(
  # Step 4: Identify edge cases
  echo "🔍 Identifying edge cases (depth: $EDGE_CASE_DEPTH)..."

  if [ "$EDGE_CASE_DEPTH" = "template" ]; then
    # Use template for SIMPLE requirements
    cat > /tmp/edge-cases-$$.md << 'EOF'
### Data Validation
- Empty/null inputs
- Invalid data types

### Security
- Authorization checks
- Input sanitization

### Performance
- Acceptable for <100 records
EOF

  elif [ "$EDGE_CASE_DEPTH" = "systematic" ]; then
    # Systematic analysis for MEDIUM requirements
    cat > /tmp/edge-cases-$$.md << 'EOF'
### Data Validation
- [Specific invalid inputs for this feature]
- [Boundary conditions]

### State Management
- [Concurrent update scenarios]

### Error Handling
- [Failure modes]

### Security
- [Injection risks]
- [Authorization requirements]

### Performance
- [Scaling considerations for 100+ colleges]
EOF

  else
    # Comprehensive analysis for COMPLEX requirements
    cat > /tmp/edge-cases-$$.md << 'EOF'
### Data Validation
- [Comprehensive input validation scenarios]
- [Data type edge cases]
- [Boundary and limit conditions]

### State Management
- [Concurrent updates and race conditions]
- [State consistency across components]

### Error Handling
- [All failure modes and recovery]
- [Graceful degradation]

### Security
- [Injection risks (SQL, XSS, etc.)]
- [Authorization and authentication]
- [Data exposure and privacy]

### Performance
- [Scaling with data size]
- [Database query optimization]
- [Caching strategies]

### Reliability
- [Retry logic for failures]
- [Monitoring and alerting]
EOF
  fi
) &
EDGE_CASES_PID=$!

# Wait for both parallel processes to complete
wait $APPROACHES_PID
wait $EDGE_CASES_PID

# Read results
APPROACHES=$(cat /tmp/approaches-$$.md)
EDGE_CASES=$(cat /tmp/edge-cases-$$.md)

# Clean up temp files
rm -f /tmp/approaches-$$.md /tmp/edge-cases-$$.md

echo "✅ Parallel analysis complete"
```

**Time Savings**: Running Steps 3-4 in parallel saves ~2-3 minutes compared to sequential execution.

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

Output format depends on complexity:

#### For SIMPLE/MEDIUM Requirements: Streamlined Single-File Format

Save to `.claude/workflows/requirements/groomed/[original-filename]`:

```markdown
# Requirement: [Descriptive Title]

## Original Request
[User's original text, unchanged]

## Groomed Specification

[Concise detailed specification with context]

**Complexity**: ${COMPLEXITY}
**Token Budget**: ~[X]K tokens

### Context
- **Affected areas**: [List files/components that will change]
- **Dependencies**: [Any new packages needed]
- **Related features**: [Existing features this builds on]

### Implementation Approach

[Single recommended approach for SIMPLE, 2 approaches for MEDIUM]

**Recommended**: [Approach name] because [brief reasoning]

**Token Estimate**: ~[X]K tokens

### Edge Cases & Validation

${EDGE_CASES}

### Acceptance Criteria

- [ ] [Specific testable criterion 1]
- [ ] [Specific testable criterion 2]
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors

### Test Scenarios

1. **Happy path**: [Description]
2. **Edge case**: [Description]
3. **Error case**: [Description]

### References
- [Link to relevant CLAUDE.md sections]
- [Link to similar past features if applicable]
```

#### For COMPLEX Requirements: Comprehensive Structured Format

Save to `.claude/workflows/requirements/groomed/[original-filename]` with full structure:

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

- **Don't over-engineer**: Complexity detection (Step 0) automatically matches depth to requirement. Trust it, but use judgment if edge cases warrant deeper analysis.
- **Don't repeat CLAUDE.md**: Reference it, don't copy its content.
- **Don't ignore memory**: Past mistakes documented in feedback memories are critical.
- **Don't force WebFetch**: For SIMPLE requirements (config, <15K tokens), skip WebFetch entirely. Use CLAUDE.md and cached patterns.
- **Don't misclassify complexity**: When in doubt about SIMPLE vs MEDIUM, err on the side of MEDIUM (safer to over-analyze than under-analyze).
- **Check cache first**: Before WebFetch on MEDIUM requirements, always check `.claude/workflows/learning/patterns/best-practices-cache.json` for cached results.
- **Manual override**: If requirement seems misclassified, manually adjust COMPLEXITY variable and proceed accordingly.

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
