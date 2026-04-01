---
name: code-review
description: Comprehensive code review using 10 specialized agents (security, quality, architecture, reusability, tests, ui/ux, performance, mobile, typescript, best-practices). Runs after validation passes, provides detailed feedback. Similar to GitHub Copilot PR reviews.
license: MIT
compatibility: Requires git, grep, and access to codebase
metadata:
  version: "1.0.0"
  author: autonomous-workflow
  stage: code-review
---

# Code Review Skill

Independent, comprehensive code review that runs after feature completion. Uses 10 specialized review agents to catch issues before merge.

## When to Use

- After validate-quality passes all gates
- Before final merge to main
- User requests "/code-review [TICKET-ID]"
- Automatically triggered in background (optional)

## Review Agents

1. 🔒 **Security** - Vulnerabilities, secrets, auth
2. 🧹 **Code Quality** - Duplication, comments, complexity
3. 🏗️ **Architecture** - Structure, patterns, CLAUDE.md compliance
4. ♻️ **Reusability** - DRY, shadcn usage, shared components
5. 🧪 **Test Coverage** - 90% coverage, edge cases
6. 🎨 **UI/UX** - Responsive, dark/light mode, Tailwind 4
7. ⚡ **Performance** - Bundle size, Core Web Vitals
8. 📱 **Mobile** - Touch targets, no overflow, breakpoints
9. 🎯 **TypeScript** - No 'any', proper types, 2026 standards
10. 📋 **Best Practices** - Next.js 15, React 19, conventions

## Process

See full implementation in `.claude/workflows/CODE_REVIEW_AGENTS.md`

### Pre-Review Verification Phase

Before running review agents, execute automated checks on changed files to catch obvious issues:

#### Step 1: Identify Changed Files

```bash
# Get list of changed files in current branch vs main
CHANGED_FILES=$(git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only main...HEAD 2>/dev/null || git diff --name-only --cached)

# Filter for relevant file types
CHANGED_TS_FILES=$(echo "$CHANGED_FILES" | grep -E '\.(ts|tsx|js|jsx)$' || true)
CHANGED_TEST_FILES=$(echo "$CHANGED_FILES" | grep -E '\.test\.(ts|tsx|js|jsx)$' || true)
CHANGED_NON_TEST=$(echo "$CHANGED_TS_FILES" | grep -v -E '\.test\.' || true)

echo "📋 Changed files: $(echo "$CHANGED_FILES" | wc -l | tr -d ' ')"
echo "📋 TypeScript/JS files: $(echo "$CHANGED_TS_FILES" | wc -l | tr -d ' ')"
echo "📋 Test files: $(echo "$CHANGED_TEST_FILES" | wc -l | tr -d ' ')"
```

#### Step 2: Run Fast Verification Checks

Run linting and type checks ONLY on changed files:

```bash
VERIFICATION_ISSUES=""

# Lint changed files only (fast)
if [ -n "$CHANGED_TS_FILES" ]; then
  echo "🔍 Running ESLint on changed files..."
  if npx eslint $CHANGED_TS_FILES --max-warnings 0 > /tmp/lint-results.txt 2>&1; then
    echo "✅ Linting passed on changed files"
  else
    echo "⚠️  Linting errors found in changed files"
    cat /tmp/lint-results.txt
    VERIFICATION_ISSUES="true"
  fi
fi

# Type check (full project, but fast)
echo "🔍 Running TypeScript type check..."
if npx tsc --noEmit > /tmp/type-results.txt 2>&1; then
  echo "✅ Type check passed"
else
  echo "⚠️  Type errors found"
  cat /tmp/type-results.txt | grep error
  VERIFICATION_ISSUES="true"
fi

# Run tests for changed files (if test files exist)
if [ -n "$CHANGED_TEST_FILES" ] || [ -n "$CHANGED_NON_TEST" ]; then
  echo "🔍 Running tests for changed files..."
  if [ -n "$CHANGED_NON_TEST" ]; then
    if npm test -- --findRelatedTests $CHANGED_NON_TEST --passWithNoTests > /tmp/test-results.txt 2>&1; then
      echo "✅ Tests passed for changed files"
    else
      echo "⚠️  Test failures detected"
      cat /tmp/test-results.txt | tail -20
      VERIFICATION_ISSUES="true"
    fi
  fi
fi
```

#### Step 3: Report Verification Results

Include verification results in consolidated report under "Verification" section:

```markdown
## Verification Results

**Linting**: ${LINT_STATUS}
**Type Checking**: ${TYPE_STATUS}
**Tests**: ${TEST_STATUS}

[Detailed output if issues found]
```

If verification fails, treat as CRITICAL issues in final decision.

### Complexity Detection & Agent Selection

Detect change complexity to determine which agents to run:

#### Complexity Indicators

```bash
# Count changed files and lines
CHANGED_COUNT=$(echo "$CHANGED_FILES" | wc -l | tr -d ' ')
CHANGED_LINES=$(git diff --stat origin/main...HEAD | tail -1 | awk '{print $4+$6}')

# Detect file types and locations
HAS_CONFIG=$(echo "$CHANGED_FILES" | grep -E '\.(config|json)$|eslint|tsconfig|playwright' || true)
HAS_COMPONENTS=$(echo "$CHANGED_FILES" | grep 'components/' || true)
HAS_ACTIONS=$(echo "$CHANGED_FILES" | grep 'actions/' || true)
HAS_TESTS=$(echo "$CHANGED_FILES" | grep -E '\.test\.|__tests__|e2e/' || true)
HAS_SCHEMA=$(echo "$CHANGED_FILES" | grep 'schema' || true)
HAS_API=$(echo "$CHANGED_FILES" | grep 'api/' || true)
HAS_LIB=$(echo "$CHANGED_FILES" | grep 'lib/' || true)

# Count directories affected
DIR_COUNT=$(echo "$CHANGED_FILES" | xargs -n1 dirname | sort -u | wc -l | tr -d ' ')

# Classify complexity
if [ $CHANGED_COUNT -le 5 ] && [ -n "$HAS_CONFIG" ] && [ -z "$HAS_COMPONENTS" ] && [ -z "$HAS_API" ]; then
  COMPLEXITY="SIMPLE"
  AGENTS=(security architecture best-practices)  # 3 agents
  echo "📊 Complexity: SIMPLE (config/docs only)"

elif [ $CHANGED_COUNT -le 15 ] && [ $DIR_COUNT -le 3 ]; then
  COMPLEXITY="MEDIUM"
  AGENTS=(security quality architecture tests typescript best-practices)  # 6 agents
  echo "📊 Complexity: MEDIUM (focused feature)"

else
  COMPLEXITY="COMPLEX"
  AGENTS=(security quality architecture reusability tests ui-ux performance mobile typescript best-practices)  # All 10
  echo "📊 Complexity: COMPLEX (major change)"
fi

echo "🔧 Running ${#AGENTS[@]} review agents: ${AGENTS[*]}"
```

#### Agent Selection Rules

| Complexity | File Count | Directories | Agents | Use Cases |
|------------|------------|-------------|---------|-----------|
| **SIMPLE** | ≤5 files | 1-2 dirs | 3-4 agents | Config changes, docs, simple refactors |
| **MEDIUM** | ≤15 files | ≤3 dirs | 6-7 agents | Feature additions, API updates, multi-file changes |
| **COMPLEX** | >15 files | >3 dirs | All 10 agents | Architecture changes, major features, cross-cutting |

**Agent Priority Tiers**:
- **Tier 1** (Always run): security, architecture, best-practices
- **Tier 2** (Medium+): quality, tests, typescript
- **Tier 3** (Complex only): reusability, ui-ux, performance, mobile

### Quick Execution

```bash
TICKET_ID="[ticket-id]"
REPORT_DIR=".claude/workflows/code-reviews/$TICKET_ID"
mkdir -p "$REPORT_DIR"

# Run reviewers (can be parallel)
echo "🔍 Running 10 code review agents..."

# Security Review
# Quality Review  
# Architecture Review
# ... (all 10)

# Aggregate results
# Generate consolidated report
# Determine: APPROVE / REQUEST_CHANGES / REJECT
```

## Output

**Consolidated Report**: `.claude/workflows/code-reviews/[TICKET-ID]/report.md`

**Individual Reports**:
- `security.md`
- `code-quality.md`
- `architecture.md`
- [etc.]

**Decision**:
- ✅ APPROVE (0 critical, ≤2 warnings)
- 🟡 REQUEST CHANGES (1-3 critical, 3-10 warnings)
- ❌ REJECT (4+ critical, major violations)

## GitHub PR Integration

After generating the consolidated report, automatically publish inline comments to the PR:

### Step 1: Check for Open PR

```bash
PR_NUMBER=$(gh pr list --head $(git branch --show-current) --json number --jq '.[0].number')

if [ -z "$PR_NUMBER" ]; then
  echo "⚠️  No open PR found for current branch - skipping GitHub integration"
  echo "📄 Review report saved locally: .claude/workflows/code-reviews/$TICKET_ID/report.md"
  exit 0
fi

echo "✅ Found PR #$PR_NUMBER - publishing review comments..."
```

### Step 2: Extract Critical Issues for Inline Comments

Parse the consolidated report to extract critical/warning issues with file paths and line numbers:

```bash
# Example format from report:
# **File:** `app/api/auth/login/route.ts:23`
# **Severity:** CRITICAL
# **Issue:** Timing attack vulnerability

# Extract into JSON payload for GitHub API
```

### Step 3: Publish Review via GitHub API

```bash
COMMIT_SHA=$(gh pr view $PR_NUMBER --json headRefOid --jq '.headRefOid')
REPO=$(gh repo view --json owner,name --jq '"\(.owner.login)/\(.name)"')

# Create review payload
cat << EOF > /tmp/review-payload.json
{
  "commit_id": "$COMMIT_SHA",
  "body": "$(cat report-summary.md)",
  "event": "COMMENT",
  "comments": [
    {
      "path": "app/api/auth/login/route.ts",
      "line": 23,
      "body": "### 🔒 **CRITICAL: Issue Title**\n\n**Issue:** Description\n\n**Fix:** Code example"
    }
  ]
}
EOF

# Submit review
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/$REPO/pulls/$PR_NUMBER/reviews \
  --input /tmp/review-payload.json

echo "✅ Review published to PR #$PR_NUMBER"
echo "🔗 View at: $(gh pr view $PR_NUMBER --json url --jq '.url')"
```

### Review Comment Format

**Critical Issues:**
```markdown
### 🔒 **CRITICAL: [Issue Title]**

**Issue:** [Description]

**Current code:**
```typescript
[code snippet]
```

**Fix:**
```typescript
[corrected code]
```

**Impact:** [Security/functionality impact]
```

**Warnings:**
```markdown
### ⚠️ **[Issue Title]**

**Issue:** [Description]

**Recommendation:** [Fix suggestion]
```

### Notes

- Use `"event": "COMMENT"` instead of `"REQUEST_CHANGES"` for own PRs (GitHub limitation)
- Only post inline comments for CRITICAL and HIGH PRIORITY warnings
- Limit to top 10 issues to avoid overwhelming the PR
- Include link to full consolidated report in review body

## Example

```bash
claude "/code-review CONFIG-ESLINT-20260327"

# Output:
# 🔍 Running code review...
# ✅ Overall Score: 91/100
# Decision: APPROVE
#
# Critical: 0
# Warnings: 3
# Suggestions: 7
```

## Integration

Add to validate-quality Step 10 (after auto-commit):

```bash
# Run code review in background
claude "/code-review $TICKET_ID" &
```

Review completes independently and saves report.

## References

- Full design: `.claude/workflows/CODE_REVIEW_AGENTS.md`
- Reports: `.claude/workflows/code-reviews/`
