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
