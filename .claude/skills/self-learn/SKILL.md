---
name: self-learn
description: Continuous skill improvement through eval-driven iteration, pattern analysis, and automated benchmarking. Runs after every 5 ticket completions to optimize workflow agents. Uses skill-creator methodology from Anthropic.
license: MIT
compatibility: Requires skill-creator plugin enabled, Python 3.8+
metadata:
  version: "1.0.0"
  author: autonomous-workflow
  stage: continuous-learning
  skill-creator-integration: true
---

# Self-Learning Skill

Continuously improve workflow skills through automated evaluation, pattern analysis, and iterative refinement using Anthropic's skill-creator methodology.

## When to Use

- After every 5 ticket completions
- When skill performance metrics decline
- User explicitly requests skill improvement
- Manual trigger: `/self-learn`

## Learning Cycle

```
Execute → Observe → Analyze → Update Skills → Validate → Execute
```

## Core Principles (from skill-creator)

1. **Generalization Over Fitting**: Skills must work across diverse scenarios, not just test cases
2. **Theory of Mind**: Explain "why" behind instructions, not just "what"
3. **Evidence-Based Improvement**: Use benchmarks and evals, not intuition
4. **Parallel Execution**: Run with-skill vs baseline simultaneously for fair comparison
5. **Immediate Token Capture**: Parse timing/token data immediately from task notifications

## Process

### Step 1: Load Execution History

Read completed tickets from `.claude/workflows/tickets/done/`:

```bash
ls -t .claude/workflows/tickets/done/ | head -5
```

For each ticket, load execution metrics:
- Implementation patterns (`.claude/workflows/learning/patterns/implementation-[ticket-id].json`)
- Validation patterns (`.claude/workflows/learning/patterns/validation-[ticket-id].json`)
- Human corrections (if any from memory system)

### Step 2: Identify Improvement Opportunities

Analyze patterns for:

#### 2a. Token Inefficiencies
Compare estimated vs actual tokens:
```json
{
  "ticket_id": "EXPORT-CSV-20260326",
  "estimated_tokens": 35000,
  "actual_tokens": 31500,
  "efficiency": 0.90  // Good
}

{
  "ticket_id": "FILTER-STATUS-20260327",
  "estimated_tokens": 20000,
  "actual_tokens": 45000,
  "efficiency": 0.44  // Bad - investigate why
}
```

**If efficiency < 0.70**: Investigate transcript for wasted work (repeated searches, redundant reads, unproductive paths).

#### 2b. Failed Validations
Track which validation gates fail most:
```json
{
  "gate_failures": {
    "coverage": 12,  // Most common
    "linting": 5,
    "e2e": 3,
    "build": 1
  }
}
```

**Action**: Update implement-feature skill to emphasize coverage best practices.

#### 2c. Human Interventions
Check memory system for feedback:
```bash
grep -r "human correction" .claude/memory/
```

Each correction represents a gap in skill knowledge.

#### 2d. Repeated Patterns
Look for code patterns reinvented multiple times:
- If 3+ tickets independently create similar helper functions → bundle into lib/
- If 3+ tickets solve similar problems differently → standardize approach

### Step 3: Create Eval Test Cases

For each skill to improve, create test cases in `evals/evals.json`:

**Example for groom-requirement skill**:

```json
{
  "skill_name": "groom-requirement",
  "evals": [
    {
      "id": 1,
      "prompt": "Add dark mode toggle to dashboard",
      "expected_output": "Groomed requirement with 2-3 approaches, edge cases covered, acceptance criteria defined",
      "files": [],
      "assertions": [
        "Output includes 2-3 implementation approaches",
        "Each approach has pros/cons listed",
        "Security considerations mentioned (theme persistence, localStorage)",
        "Test scenarios defined",
        "Token budget estimated",
        "Recommended approach has clear reasoning"
      ]
    },
    {
      "id": 2,
      "prompt": "I need a way to filter colleges by multiple statuses at once",
      "expected_output": "Groomed requirement exploring filter UI patterns, state management, URL param persistence",
      "files": [],
      "assertions": [
        "Multiple filter UI approaches explored (checkboxes vs multiselect)",
        "State persistence discussed (URL params vs local storage)",
        "Edge cases include 'no filters selected' and 'all filters selected'",
        "Performance consideration for large college lists",
        "Token estimate provided"
      ]
    },
    {
      "id": 3,
      "prompt": "Export to pdf",
      "expected_output": "Groomed requirement analyzing PDF generation approaches, questioning if CSV/print-to-PDF is sufficient",
      "files": [],
      "assertions": [
        "Clarification questions about PDF content (single college? all colleges?)",
        "Multiple approaches: print CSS, PDF library, external service",
        "Trade-offs of each approach discussed (complexity vs features)",
        "Simpler alternative suggested (browser print-to-PDF)",
        "Token budget reflects chosen complexity"
      ]
    }
  ]
}
```

**Key**: Mix simple and complex scenarios. Include edge cases where skill might overengineer or underspecify.

### Step 4: Run Eval-Driven Iteration

Use skill-creator workflow (spawn parallel runs):

#### 4a. Set Up Workspace

```bash
mkdir -p .claude/workflows/learning/skill-evals/[skill-name]-workspace/iteration-1/
```

#### 4b. Spawn Parallel Runs

For each eval, spawn TWO agents simultaneously:
1. **With current skill** (skill-name)
2. **Baseline** (previous version or no skill)

**Critical**: Use Agent tool to spawn subagents, capture timing immediately:

```typescript
// Example structure (conceptual)
const withSkillAgent = await Agent({
  subagent_type: "general-purpose",
  prompt: `Execute using skill: groom-requirement
  Task: ${eval.prompt}
  Save outputs to: workspace/iteration-1/eval-${eval.id}/with_skill/outputs/`,
  run_in_background: false
});

// Parse task notification IMMEDIATELY for tokens/duration
const metrics = {
  total_tokens: withSkillAgent.total_tokens,  // From task notification
  duration_ms: withSkillAgent.duration_ms
};

// Save timing.json right away (won't be persisted elsewhere)
await writeFile(
  `workspace/iteration-1/eval-${eval.id}/with_skill/timing.json`,
  JSON.stringify(metrics)
);
```

#### 4c. Draft Assertions While Runs Execute

Don't wait idle. Use eval execution time to:
- Refine assertion wording
- Add edge case assertions
- Review past feedback from memory

### Step 5: Grade Outputs

When runs complete, grade each against assertions.

#### 5a. Use Deterministic Grading Where Possible

For verifiable assertions, write Python scripts:

```python
# scripts/grade_token_estimate.py
import json
import sys

def grade_token_estimate(output_text, actual_tokens):
    # Extract estimated tokens from output
    estimate = extract_estimate(output_text)

    # Calculate accuracy
    accuracy = min(estimate, actual_tokens) / max(estimate, actual_tokens)

    return {
        "text": "Token estimate is within 20% of actual",
        "passed": accuracy >= 0.80,
        "evidence": f"Estimated: {estimate}, Actual: {actual_tokens}, Accuracy: {accuracy:.2f}"
    }
```

#### 5b. Use LLM Grading for Subjective Assertions

For assertions like "approaches have clear pros/cons":

Spawn grader agent:
```
Agent(
  subagent_type: "general-purpose",
  prompt: `Grade this output against assertion: "${assertion.text}"

  Output:
  ${output_text}

  Respond in JSON:
  {
    "text": "${assertion.text}",
    "passed": true/false,
    "evidence": "Quote from output showing why it passed/failed"
  }`
)
```

#### 5c. Save Grading Results

Format must match skill-creator viewer expectations:

```json
{
  "assertion_results": [
    {
      "text": "Output includes 2-3 implementation approaches",
      "passed": true,
      "evidence": "Found 3 approaches: Client-side, Server-side, Hybrid"
    },
    {
      "text": "Token budget estimated",
      "passed": false,
      "evidence": "No token budget found in output"
    }
  ],
  "summary": {
    "passed": 5,
    "failed": 1,
    "total": 6,
    "pass_rate": 0.83
  }
}
```

Save to `workspace/iteration-1/eval-${eval.id}/with_skill/grading.json`

### Step 6: Aggregate Benchmarks

Calculate statistics across all evals:

```json
{
  "run_summary": {
    "with_skill": {
      "pass_rate": { "mean": 0.83, "stddev": 0.12 },
      "time_seconds": { "mean": 45.0, "stddev": 8.0 },
      "tokens": { "mean": 12000, "stddev": 2000 }
    },
    "without_skill": {
      "pass_rate": { "mean": 0.45, "stddev": 0.18 },
      "time_seconds": { "mean": 38.0, "stddev": 10.0 },
      "tokens": { "mean": 9500, "stddev": 2500 }
    },
    "delta": {
      "pass_rate": 0.38,  // Skill adds +38% quality
      "time_seconds": 7.0,  // Costs +7s per task
      "tokens": 2500  // Costs +2.5K tokens
    }
  }
}
```

Save to `workspace/iteration-1/benchmark.json`

Also generate markdown:
```markdown
## Benchmark Summary

| Metric | With Skill | Without Skill | Delta |
|--------|------------|---------------|-------|
| Pass Rate | 83% ± 12% | 45% ± 18% | **+38%** |
| Time (s) | 45 ± 8 | 38 ± 10 | +7s |
| Tokens | 12K ± 2K | 9.5K ± 2.5K | +2.5K |

**Analysis**: Skill significantly improves quality (+38pp) at modest cost (+2.5K tokens).
Worth the trade-off.
```

### Step 7: Pattern Analysis

Look beyond aggregate statistics:

#### 7a. Identify Non-Discriminating Assertions
Assertions that pass in both with/without skill aren't measuring skill value.

**Example**: "Output mentions implementation" (always passes) → Remove or tighten.

#### 7b. Find High-Variance Evals
Stddev > 0.15 indicates flaky test or skill inconsistency.

**Action**: Run eval multiple times to confirm flakiness, or tighten skill instructions.

#### 7c. Detect Repeated Reinvention
Check transcripts for independently invented solutions:

```bash
grep -r "helper function" workspace/iteration-1/*/with_skill/outputs/
```

If same pattern appears 3+ times → bundle into skill's `scripts/` directory.

### Step 8: Propose Skill Improvements

Use LLM to synthesize improvements:

**Prompt**:
```
Analyze this skill's performance:

Benchmark: [benchmark.json]
Failed Assertions: [list of failures]
Human Feedback: [from memory]
Execution Transcripts: [patterns observed]

Current SKILL.md: [content]

Propose specific improvements to SKILL.md that address:
1. Failed assertions (what instructions would prevent these?)
2. Token inefficiencies (what steps can be eliminated?)
3. Human corrections (what knowledge is missing?)

Guidelines:
- Generalize from failures (don't overfit to test cases)
- Remove instructions that don't pull weight
- Add "why" explanations, not just "what" directives
- Keep skill lean (prefer removing over adding)
```

**Output**: Proposed SKILL.md changes with rationale.

### Step 9: A/B Test Proposed Changes

Before replacing current skill:

1. **Save current version**:
```bash
cp .claude/skills/[skill-name]/SKILL.md \
   .claude/skills/[skill-name]/SKILL-v1.0.md
```

2. **Apply proposed changes** to SKILL.md (now v1.1)

3. **Run iteration-2 eval**:
   - Baseline: v1.0 (previous version)
   - Test: v1.1 (proposed changes)

4. **Compare benchmarks**:
   - If v1.1 pass_rate > v1.0 AND token delta acceptable → Keep v1.1
   - If v1.1 pass_rate ≈ v1.0 BUT token delta negative → Keep v1.1 (more efficient)
   - If v1.1 worse → Revert to v1.0, revise proposal

### Step 10: Update Memory System

After improvement cycle, save lessons:

**`.claude/memory/feedback_autonomous_workflow.md`**:
```markdown
---
name: autonomous-workflow-feedback
description: Lessons learned from skill improvements
type: feedback
---

[Dated entry]:

Improved groom-requirement skill in iteration-2:

**What Failed**: Token estimates were 50% off for complex features (e.g., multi-select filters)

**Why**: Skill didn't account for state management complexity in React hooks

**How Fixed**: Added checklist: "If feature manages complex client state, add +8K tokens for hooks/context"

**Result**: Estimates now within 20% of actual (iteration-3 benchmark: 0.89 accuracy)
```

**`.claude/memory/project_skill_patterns.md`**:
```markdown
---
name: skill-patterns
description: Effective patterns discovered through iterations
type: reference
---

## Grooming Pattern: State Management

When requirement involves state (filters, modals, forms):
1. Ask: Where does state live? (Local, URL params, Context, Database)
2. Estimate by state complexity:
   - Simple local state: +3K tokens
   - URL params + local state: +5K tokens
   - Context + multiple components: +8K tokens
3. List state-related edge cases (concurrent updates, stale state)
```

### Step 11: Schedule Next Learning Cycle

Update metrics:
```json
{
  "last_learning_cycle": "2026-03-26T14:30:00Z",
  "tickets_since_last_cycle": 0,
  "next_cycle_trigger": 5,
  "skills_improved_this_cycle": ["groom-requirement"],
  "avg_improvement_per_cycle": 0.15  // +15% pass rate average
}
```

## Automated Triggers

### Trigger 1: Every 5 Tickets
```bash
if [ $(ls .claude/workflows/tickets/done/ | wc -l) -ge 5 ]; then
  /self-learn
fi
```

### Trigger 2: Performance Decline
```bash
# If last 3 tickets failed QA on first attempt
if [ $recent_qa_failure_rate -gt 0.5 ]; then
  /self-learn --focus=validate-quality
fi
```

### Trigger 3: Token Budget Exceeded
```bash
# If last 3 tickets exceeded token budget by 30%+
if [ $avg_token_overrun -gt 1.3 ]; then
  /self-learn --focus=implement-feature
fi
```

## Quality Metrics

Track improvement over time:

```json
{
  "skill": "groom-requirement",
  "version_history": [
    {
      "version": "1.0.0",
      "pass_rate": 0.65,
      "avg_tokens": 15000,
      "iteration": 1
    },
    {
      "version": "1.1.0",
      "pass_rate": 0.83,
      "avg_tokens": 12000,
      "iteration": 2,
      "improvements": "Added state management checklist, removed redundant web fetches"
    },
    {
      "version": "1.2.0",
      "pass_rate": 0.91,
      "avg_tokens": 11500,
      "iteration": 3,
      "improvements": "Bundled common research queries into references/, tightened acceptance criteria format"
    }
  ]
}
```

## Gotchas

### Don't Overfit to Test Cases
If skill works perfectly on evals but fails on real tickets → test cases aren't diverse enough.

**Fix**: Add real failed tickets to eval set.

### Don't Ignore High Stddev
High variance means inconsistent results. Either skill has ambiguous instructions or test is flaky.

**Fix**: Tighten instructions OR increase eval sample size.

### Don't Skip Baseline Comparison
Without baseline, can't measure skill value. Always run with/without comparison.

### Don't Trust First Iteration
Skills often need 2-3 iterations to stabilize. Compare iteration-3 to iteration-1 for true improvement.

### Don't Accumulate Dead Instructions
Each iteration, audit entire SKILL.md. Remove instructions that transcripts show agents ignoring or misinterpreting.

## Integration with skill-creator Plugin

If skill-creator plugin enabled:

```bash
# Use skill-creator directly
/skill-creator --mode iterate --skill groom-requirement --workspace .claude/workflows/learning/skill-evals/
```

This automates steps 4-8 using Anthropic's official tooling.

## Success Criteria

Self-learning cycle succeeds if:
- [ ] Skill improvement > 10% pass rate OR > 20% token reduction
- [ ] A/B test confirms v1.1 > v1.0
- [ ] Lessons documented in memory
- [ ] Next cycle scheduled

## Example Learning Cycle

**Input**: 5 completed tickets, groom-requirement skill showing 70% pass rate

**Step 1**: Load last 5 ticket metrics
- 3 exceeded token estimates by 40%+
- 2 missed edge cases (concurrency, null handling)

**Step 2**: Create 3 eval test cases targeting weak areas

**Step 3**: Run iteration-1 (baseline = no skill vs current skill)
- Baseline: 45% pass, 9K tokens
- Current: 70% pass, 15K tokens
- Delta: +25% quality for +6K tokens

**Step 4**: Identify improvement: Missing concurrency edge case checklist

**Step 5**: Update SKILL.md with concurrency section

**Step 6**: Run iteration-2 (baseline = v1.0 vs v1.1)
- v1.0: 70% pass, 15K tokens
- v1.1: 88% pass, 13K tokens
- Delta: +18% quality, -2K tokens (better!)

**Step 7**: Keep v1.1, document lesson in memory

**Result**: Skill improved from 70% to 88% pass rate while reducing tokens by 13%.

## References

- Official skill-creator: https://github.com/anthropics/skills/tree/main/skills/skill-creator
- Eval methodology: https://agentskills.io/skill-creation/evaluating-skills
- See `scripts/run_eval_cycle.py` for automation utilities
