# Feature Branch Workflow

**Problem**: Currently all work happens directly on `main` branch, which is risky and doesn't allow for proper review/testing before merge.

**Solution**: Use feature branches for each ticket, implement on branch, validate, then merge to main.

---

## Workflow Overview

```
main branch (protected)
    ↓
    ├─ Create feature branch: feature/TICKET-ID
    │       ↓
    │   Implementation
    │       ↓
    │   Validation (all gates)
    │       ↓
    │   Code Review (agents)
    │       ↓
    │   Approval ✅
    │       ↓
    ├─ Merge to main (fast-forward or squash)
    ↓
main branch (updated)
```

---

## Detailed Flow

### Stage 1: Ticket Creation
**Location**: `main` branch

```bash
# On main branch
git checkout main
git pull origin main

# Create ticket files
# .claude/workflows/tickets/ready/TICKET-ID.md
```

**Actions**:
- Grooming creates files (no git operations)
- Ticket creation creates files (no git operations)
- Files staged but NOT committed yet

---

### Stage 2: Feature Branch Creation
**Location**: Create new branch from `main`

```bash
# Create and switch to feature branch
git checkout -b feature/TICKET-ID

# Move ticket to in-progress
mv .claude/workflows/tickets/ready/TICKET-ID.md \
   .claude/workflows/tickets/in-progress/TICKET-ID.md

# Initial commit: ticket setup
git add .claude/workflows/
git commit -m "chore(TICKET-ID): initialize feature branch with ticket and requirements"
```

**Naming Convention**:
- Features: `feature/TICKET-ID`
- Bugfixes: `fix/TICKET-ID`
- Configuration: `config/TICKET-ID`
- Refactoring: `refactor/TICKET-ID`

---

### Stage 3: Implementation
**Location**: `feature/TICKET-ID` branch

```bash
# Still on feature/TICKET-ID
# Implement feature (multiple commits encouraged)

git add [files]
git commit -m "feat(TICKET-ID): implement feature X"

git add [files]
git commit -m "test(TICKET-ID): add tests for feature X"

git add [files]
git commit -m "fix(TICKET-ID): address edge case Y"
```

**Commit Conventions**:
- Small, focused commits (not one giant commit)
- Conventional commit messages
- Each commit should be functional (pass tests)

---

### Stage 4: Validation
**Location**: `feature/TICKET-ID` branch

```bash
# Run validation gates
npm test                    # Gate 1
npm run test:coverage       # Gate 2
npm run lint                # Gate 3
npx tsc --noEmit           # Gate 4
npm run build              # Gate 5

# If all pass, move to QA
mv .claude/workflows/tickets/in-progress/TICKET-ID.md \
   .claude/workflows/tickets/qa/TICKET-ID.md

git add .claude/workflows/
git commit -m "chore(TICKET-ID): move ticket to QA stage"
```

**If Validation Fails**:
- Fix issues
- Commit fixes
- Re-run validation
- Do NOT merge until all gates pass

---

### Stage 5: Code Review (Agents)
**Location**: `feature/TICKET-ID` branch

```bash
# Run code review agents (background)
claude "Run comprehensive code review for TICKET-ID"

# Wait for review completion
# Review report generated at:
# .claude/workflows/code-reviews/TICKET-ID/report.md
```

**Review Outcomes**:

**✅ APPROVE**:
```bash
# Proceed to merge
git add .claude/workflows/code-reviews/
git commit -m "chore(TICKET-ID): code review passed"
```

**🟡 REQUEST CHANGES**:
```bash
# Address issues
git add [fixed-files]
git commit -m "fix(TICKET-ID): address code review feedback"

# Re-run code review
claude "Run comprehensive code review for TICKET-ID"
```

**❌ REJECT**:
```bash
# Critical issues found
# Fix all critical issues before proceeding
# Consider rebasing or squashing messy commits
```

---

### Stage 6: Pre-Merge Preparation
**Location**: `feature/TICKET-ID` branch

```bash
# Update from main (in case main advanced)
git checkout main
git pull origin main
git checkout feature/TICKET-ID
git rebase main  # or: git merge main

# Resolve any conflicts
# Re-run validation if conflicts resolved
npm test && npm run lint && npm run build

# Move ticket to done
mv .claude/workflows/tickets/qa/TICKET-ID.md \
   .claude/workflows/tickets/done/TICKET-ID.md

git add .claude/workflows/
git commit -m "chore(TICKET-ID): mark ticket as done, ready for merge"
```

---

### Stage 7: Merge to Main
**Location**: Merge `feature/TICKET-ID` → `main`

**Option A: Fast-Forward Merge (Clean History)**
```bash
git checkout main
git merge --ff-only feature/TICKET-ID

# If fast-forward not possible, rebase first:
git checkout feature/TICKET-ID
git rebase main
git checkout main
git merge --ff-only feature/TICKET-ID
```

**Option B: Squash Merge (Single Commit)**
```bash
git checkout main
git merge --squash feature/TICKET-ID

# Create single consolidated commit
git commit -m "feat(TICKET-ID): [feature summary]

[Detailed description]

- Subtask 1 completed
- Subtask 2 completed
- All validation gates passed
- Code review approved

Closes: TICKET-ID

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

**Option C: Merge Commit (Preserve History)**
```bash
git checkout main
git merge --no-ff feature/TICKET-ID -m "Merge feature/TICKET-ID into main"
```

**Recommended**: Option B (squash) for cleaner main branch history, or Option A if commits are already clean.

---

### Stage 8: Cleanup
**Location**: `main` branch

```bash
# Delete feature branch (local)
git branch -d feature/TICKET-ID

# If pushed to remote, delete there too
git push origin --delete feature/TICKET-ID

# Update learning patterns
# (done automatically by workflow)
```

---

## Modified Workflow Scripts

### Updated validate-quality Skill

Add to Step 10 (before auto-commit):

```markdown
### Branch Awareness

Check current branch:
```bash
CURRENT_BRANCH=$(git branch --show-current)
```

**If on feature branch**:
- Commit to feature branch
- Do NOT auto-merge to main
- Wait for human to merge or trigger merge

**If on main branch** (legacy mode):
- Commit directly to main (current behavior)
- Log warning: "Working directly on main - consider using feature branches"
```

### Updated ticket-creator Skill

Add to Step 1:

```markdown
### Feature Branch Creation

After creating ticket, prompt user:

"Ready to implement? I can:
1. Create feature branch and start implementation
2. Create ticket only (you create branch manually)
3. Implement on main branch (not recommended)

Choose [1/2/3]:"

If 1:
```bash
git checkout -b feature/TICKET-ID
# Move ticket to in-progress
# Initial commit
# Proceed to implementation
```
```

---

## Benefits

### Safety
- ✅ Main branch always stable
- ✅ Can test on branch without affecting main
- ✅ Easy rollback (just delete branch)

### Quality
- ✅ Code review before merge
- ✅ Validation happens on branch
- ✅ Can iterate without polluting main history

### Collaboration
- ✅ Multiple features in parallel (different branches)
- ✅ Clear feature isolation
- ✅ Easy to see what changed (compare branch to main)

### History
- ✅ Clean main branch history (with squash)
- ✅ Or detailed history (with merge commit)
- ✅ Easy to find when feature was added

---

## Git Configuration

### Protect Main Branch (Recommended)

```bash
# Prevent direct commits to main
git config branch.main.pushRemote no_push

# Require merge via branches
# (requires git hooks or CI/CD)
```

### Auto-Branch Naming

Add to `.claude/workflows/config.json`:

```json
{
  "git": {
    "use_feature_branches": true,
    "branch_prefix": "feature/",
    "auto_create_branch": true,
    "merge_strategy": "squash"
  }
}
```

---

## Example Full Flow

```bash
# 1. Start on main
git checkout main
git pull

# 2. Groom requirement (creates files, no commits)
claude "Process requirement: .claude/workflows/requirements/inbox/my-feature.md"

# 3. Feature branch auto-created
# [Workflow creates: feature/MY-FEATURE-20260327]

# 4. Implementation (multiple commits on branch)
# [Commits: "feat: add X", "test: add tests", "fix: edge case"]

# 5. Validation (on branch)
# [All gates pass]

# 6. Code review (on branch)
# [Review: APPROVE]

# 7. Merge to main
git checkout main
git merge --squash feature/MY-FEATURE-20260327
git commit -m "feat: add awesome feature..."

# 8. Cleanup
git branch -d feature/MY-FEATURE-20260327

# Done! Main updated, branch deleted.
```

---

## Migration Path

### Phase 1: Hybrid (Current + Feature Branches)
- Allow both direct main commits and feature branches
- Warn when committing to main
- Encourage feature branches for new work

### Phase 2: Feature Branch Preferred
- Default to feature branches
- Require flag to commit to main: `--allow-main-commit`
- Update skills to create branches automatically

### Phase 3: Feature Branch Only
- Block direct main commits
- All work must go through feature branches
- Main branch protected

**Current Status**: Phase 0 (main only)
**Target**: Phase 2 by next sprint

---

## Troubleshooting

### "Can't fast-forward merge"
```bash
# Rebase feature branch on main first
git checkout feature/TICKET-ID
git rebase main
# Resolve conflicts
git checkout main
git merge --ff-only feature/TICKET-ID
```

### "Merge conflicts"
```bash
# On feature branch
git rebase main
# Fix conflicts in each file
git add [resolved-files]
git rebase --continue
# Repeat until rebase complete
```

### "Forgot to create branch"
```bash
# Already committed to main? Move to branch:
git branch feature/TICKET-ID
git reset --hard HEAD~[N]  # N = number of commits
git checkout feature/TICKET-ID
# Now commits are on feature branch
```

---

## Integration with Autonomous Workflow

Update orchestration to:

1. **Groom** → Creates files (no git)
2. **Create Ticket** → Creates files (no git)
3. **Create Branch** → `git checkout -b feature/TICKET-ID`
4. **Initial Commit** → Commit ticket files to branch
5. **Implement** → Commits to feature branch
6. **Validate** → On feature branch
7. **Review** → On feature branch
8. **Merge** → Squash merge to main
9. **Cleanup** → Delete feature branch

**User control**: After validation passes, ASK user:
```
"Ready to merge to main? [y/n]"
  y → Auto-merge and cleanup
  n → Leave on branch for manual inspection
```

This gives user final approval before main branch changes.
