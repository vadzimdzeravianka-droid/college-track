---
name: respond-to-pr-comments
description: Thoughtfully respond to GitHub PR code review comments using 5 Whys methodology. Use this skill whenever the user mentions "check PR comments", "address review feedback", "respond to comments", "check comments on PR", or anything related to handling GitHub pull request feedback, even if they don't explicitly ask for a "thoughtful response" or mention the 5 Whys approach.
compatibility: Requires gh CLI, git, and bash
metadata:
  version: "1.0.0"
  author: autonomous-workflow
---

# Respond to PR Comments Skill

Comprehensively address GitHub pull request comments using a thoughtful, principled approach based on 5 Whys methodology.

## When to Use

- User says "check PR comments" or "address review feedback"
- User asks you to "respond to PR #N comments"
- User mentions handling PR feedback or review comments
- After making changes when you need to verify no comments were missed

## Core Principle: Thoughtful Analysis Over Blind Implementation

Don't just implement every comment blindly. Understand the **why** behind both the current code and the feedback, then make an informed decision.

## Process Overview

1. **Fetch all comments** (both types)
2. **Analyze each comment** using 5 Whys
3. **Decide action** (implement, push back, suggest alternative)
4. **Execute** (fix code, post reply, mark resolved)
5. **Verify** (ensure no comments missed)

---

## Step 1: Fetch All Comments

**Critical:** There are TWO types of PR comments:

### General Conversation Comments
```bash
gh pr view {pr_number} --json comments --jq '.comments[] | {author: .author.login, created: .createdAt, body}'
```

### Line-Specific Code Review Comments
```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments --jq '.[] | {id, line, path, author: .user.login, body}'
```

**Always check both.** Missing line-specific comments is a common failure mode.

---

## Step 2: Analyze Each Comment (5 Whys Method)

For each unaddressed comment, work through this systematically:

### 2A: Understand the Current Implementation (5 Whys)

Ask yourself why the code is the way it is:

**Example: Comment about `CheckCircle2` icon name**

1. **Why CheckCircle2?** → It's imported from lucide-react
2. **Why that specific import?** → Autocomplete suggested it
3. **Why did autocomplete suggest it?** → lucide-react exports multiple variants
4. **Why multiple variants?** → Library design choice for different styles
5. **Why matters now?** → We only need one variant, "2" suffix adds confusion

**Outcome:** Not a principled choice, just convenience. Open to change.

### 2B: Understand the Comment (5 Whys)

Ask why the reviewer is asking for this:

**Example: Same comment about `CheckCircle2`**

1. **Why remove "2"?** → Name is confusing
2. **Why confusing?** → Implies there's a CheckCircle1
3. **Why is that bad?** → Creates unclear intent
4. **Why does clarity matter here?** → Code maintainability
5. **What's the deeper issue?** → We should use the simplest, clearest names available

**Outcome:** Valid concern about code clarity.

### 2C: Research Best Practices

Before deciding, check:
- Project conventions (`grep` similar patterns in codebase)
- Library documentation (if applicable)
- Industry standards (if you have WebSearch access)

**Example: Icon naming**
- Check: Are there other icons in the codebase? How are they named?
- Check: lucide-react docs - is `CheckCircle` available and simpler?
- Outcome: `CheckCircle` exists and is the base variant

### 2D: Make a Decision

Three possible outcomes:

#### Option 1: Implement
**When:** Comment aligns with best practices and improves code quality.

**Example:**
- Comment: "Remove CheckCircle2, use CheckCircle"
- Analysis: Simpler name, no loss of functionality, improves clarity
- Decision: ✅ Implement

#### Option 2: Push Back
**When:** Comment conflicts with best practices or project constraints.

**Example:**
- Comment: "Use inline styles instead of Tailwind classes"
- Analysis: Project uses Tailwind consistently, inline styles would break convention
- Decision: ❌ Push back with explanation

Reply template:
```markdown
Thanks for the feedback! However, this project uses Tailwind CSS consistently across all components (see CLAUDE.md styling section). Switching to inline styles here would:
- Break consistency with the rest of the codebase
- Remove dark mode support (Tailwind handles this automatically)
- Make future theme changes harder

Would you be open to keeping the Tailwind approach?
```

#### Option 3: Suggest Alternative
**When:** Comment identifies a real issue but proposed solution isn't optimal.

**Example:**
- Comment: "Extract this to a separate component"
- Analysis: Valid concern about reuse, but component is too simple to justify extraction
- Decision: 💡 Suggest keeping inline but adding a helper function

Reply template:
```markdown
Good catch on the duplication! Instead of a separate component (which might be overkill for 3 lines), how about we extract a `formatUserStatus(user)` helper in utils? That would give us reusability without the component overhead.

Would that address your concern?
```

---

## Step 3: Execute Actions

### 3A: Implement Code Changes

If you decided to implement:

1. **Make the change** using Edit/Write tools
2. **Test** - always run tests after changes
3. **Commit** with clear message:
   ```bash
   git add [files]
   git commit -m "fix: address review feedback - [brief description]

   [Explain what changed and why]

   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
   ```

### 3B: Post Reply to GitHub

**CRITICAL:** Use the correct reply method based on comment type:

**For line-specific/inline code review comments (reply in thread + resolve):**

1. First, reply to the specific comment thread using its comment ID:
```bash
# Reply in thread (NOT a general PR comment)
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments/{comment_id}/replies \
  -X POST \
  -f body="✅ Fixed in commit [sha]: [Explanation]"
```

2. Then resolve the thread using GraphQL:
```bash
# Get thread ID first
gh api graphql -f query='
{
  repository(owner: "{owner}", name: "{repo}") {
    pullRequest(number: {pr_number}) {
      reviewThreads(first: 50) {
        nodes {
          id
          isResolved
          comments(first: 1) {
            nodes {
              body
              path
            }
          }
        }
      }
    }
  }
}'

# Resolve the thread
gh api graphql -f query='
mutation {
  resolveReviewThread(input: {threadId: "{thread_node_id}"}) {
    thread {
      isResolved
    }
  }
}'
```

**For general PR conversation comments:**
```bash
gh pr comment {pr_number} --body "[Your response]"
```

### 3C: Verify Thread Resolution

After replying and resolving:
- Re-query the review threads to confirm `isResolved: true`
- If resolution failed, the thread may require reviewer permissions

---

## Step 4: Verify Nothing Missed

After processing all comments:

1. **Re-fetch both comment types** to ensure nothing new appeared
2. **Check for duplicate comment IDs** you might have already processed
3. **List any remaining unaddressed comments** clearly for the user

---

## Examples

### Example 1: Straightforward Fix

**Comment:** "please no dump comments anywhere!" (line 80, college-card.tsx)

**Analysis (5 Whys):**
- Why remove comment? → It's obvious/redundant
- Why is obvious bad? → Adds noise without value
- Why does that matter? → Code readability
- Best practice? → Comments should explain *why*, not *what*
- Decision: ✅ Implement - aligns with clean code principles

**Action:**
```typescript
// Before:
// Calculate data completeness with useMemo for performance
const dataCompleteness = useMemo(...)

// After:
const dataCompleteness = useMemo(...)
```

**Reply:** "✅ Removed obvious comment in commit abc123"

---

### Example 2: Push Back with Reasoning

**Comment:** "Why not use Redux here?"

**Analysis:**
- Why Redux? → Commenter prefers centralized state
- Why might we not? → This is a form with local state only
- Best practice? → Redux documentation says "not for all state"
- Decision: ❌ Push back - overkill for local form state

**Reply:**
```markdown
Thanks for the suggestion! For this component, we're using local React state because:
- State is not shared with other components
- No complex async logic
- Redux docs recommend starting with local state first

From their docs: "Not all apps need Redux. It's important to understand the kind of application you're building, the kinds of problems that you need to solve, and what tools can best solve the problems you're facing."

Does this make sense, or is there a state-sharing concern I'm missing?
```

---

### Example 3: Suggest Alternative

**Comment:** "text-green-500 - why not use existing theme colors?"

**Analysis:**
- Why hardcoded? → Quick implementation
- Why is that bad? → No dark mode support
- Best practice? → Use theme-aware colors
- Decision: 💡 Suggest fix that goes further than comment asked

**Reply:**
```markdown
Great catch! I've updated to use theme-aware colors with dark mode support:

\`\`\`typescript
// Before: text-green-500 (no dark mode)
// After:  text-green-600 dark:text-green-400
\`\`\`

This follows the pattern used in status-badge.tsx and works in both light and dark themes.
```

---

## Common Pitfalls to Avoid

### ❌ Blindly implementing without understanding
Bad: See comment → change code → move on
Good: Understand why commenter suggested it, verify it aligns with project standards

### ❌ Checking only general comments
Many line-specific code reviews are missed this way. Always check BOTH:
- `gh pr view --json comments` (general conversation)
- `gh api repos/.../pulls/{pr}/comments` (inline code review)

### ❌ Using `gh pr comment` for inline comments
Bad: `gh pr comment {pr} --body "Fixed"` → Creates orphan general comment
Good: `gh api .../comments/{id}/replies` → Replies in the correct thread

### ❌ Not resolving threads after fixing
Bad: Reply to comment but leave thread unresolved
Good: Reply in thread + resolve via GraphQL `resolveReviewThread` mutation

### ❌ Ignoring comment context
A comment about "add tests" on line 50 might not mean "add tests to line 50". Understand what the commenter actually wants.

### ❌ Being defensive
If a comment points out a real issue, acknowledge it. "Good catch!" goes a long way.

### ❌ Not testing after changes
Always run tests after implementing comment feedback. Broken tests are embarrassing.

---

## Summary Checklist

When user says "check PR comments":

- [ ] Fetch general conversation comments (`gh pr view --json comments`)
- [ ] Fetch line-specific code review comments (`gh api repos/.../pulls/{pr}/comments`)
- [ ] For each comment:
  - [ ] 5 Whys on current implementation
  - [ ] 5 Whys on the comment
  - [ ] Research best practices
  - [ ] Decide: implement / push back / suggest alternative
- [ ] Execute actions:
  - [ ] Make code changes if needed
  - [ ] Run tests
  - [ ] Commit with clear message
  - [ ] **Inline comments:** Reply in thread via `/comments/{id}/replies` API + resolve thread via GraphQL
  - [ ] **General comments:** Reply via `gh pr comment`
- [ ] Verify no comments missed (re-fetch both types)
- [ ] Verify threads are resolved (`isResolved: true`)
- [ ] Report to user what was done

---

## Integration Notes

This skill pairs well with:
- **validate-quality** skill (run tests after implementing changes)
- **code-review** skill (proactive review before comments arrive)
- **implement-feature** skill (when comments require substantial rework)
