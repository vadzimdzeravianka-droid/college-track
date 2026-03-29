# Benchmark Results: create-ticket (Iteration-1)

## Overall Performance

| Configuration | Pass Rate | Avg Time | Avg Tokens |
|--------------|-----------|----------|------------|
| **with_skill** | **84.4%** (27/32) | 411.4s ± 149.9s | 52,099 ± 6,160 |
| **without_skill** | **71.9%** (23/32) | 188.8s ± 24.1s | 46,151 ± 7,779 |
| **Delta** | **+12.5%** | **+222.6s (+117.9%)** | **+5,948 (+12.9%)** |

## Key Findings

### 1. Skill Improves Quality (+12.5% pass rate)
- **With-skill**: 84.4% pass rate (27/32 assertions)
- **Without-skill**: 71.9% pass rate (23/32 assertions)
- Skill ensures proper ticket placement, semantic IDs, and structure

### 2. Skill is Much Slower (118% increase)
- **With-skill**: 411.4s average (6.9 minutes)
- **Without-skill**: 188.8s average (3.1 minutes)
- High variance in skill execution (±149.9s vs ±24.1s)

### 3. Comparable Token Usage (+13%)
- **With-skill**: 52,099 tokens average
- **Without-skill**: 46,151 tokens average
- Similar analysis depth, skill adds structured workflow overhead

---

## Per-Eval Breakdown

### Test 1: simple-bugfix-ticket
**Prompt:** "create ticket for bug-pointer-cursor requirement"

| Config | Pass Rate | Time | Tokens | Result |
|--------|-----------|------|--------|--------|
| with_skill | 90% (9/10) | 518.4s | 50,741 | ✅ Strong |
| without_skill | 70% (7/10) | 213.7s | 40,734 | ⚠️ Missing basics |

**Analysis:** With-skill wins on quality (90% vs 70%). Failed assertions for without-skill:
- No ticket in ready/ directory
- Missing date in ticket ID
- No per-subtask complexity ratings

**Winner:** with_skill (better structure, acceptable speed trade-off)

---

### Test 2: medium-feature-ticket
**Prompt:** "create ticket for data-completeness requirement"

| Config | Pass Rate | Time | Tokens | Result |
|--------|-----------|------|--------|--------|
| with_skill | 75% (9/12) | 228.8s | 58,891 | ⚠️ Token estimate off |
| without_skill | 75% (9/12) | 187.2s | 56,070 | ⚠️ Structure issues |

**Analysis:** TIE on pass rate (75%). Both configurations had issues:
- With-skill: Token estimate mismatch (12K vs 29K expected), ticket not in ready/ directory
- Without-skill: Wrong ticket ID format, no directory placement, exceeded subtask limit (6 vs 3-5)

**Winner:** TIE (both had significant issues, different failure modes)

---

### Test 3: layout-fix-ticket
**Prompt:** "create ticket for fix-width requirement"

| Config | Pass Rate | Time | Tokens | Result |
|--------|-----------|------|--------|--------|
| with_skill | 90% (9/10) | 487.1s | 46,664 | ✅ Strong |
| without_skill | 70% (7/10) | 165.6s | 41,649 | ⚠️ Missing basics |

**Analysis:** With-skill wins on quality (90% vs 70%). Failed assertions for without-skill:
- No ticket in ready/ directory
- Completely wrong filename (fix-width.md, no semantic ID)
- No per-subtask complexity ratings

**Winner:** with_skill (better structure, acceptable speed trade-off)

---

## Critical Differences

### What With-Skill Does Better

1. **Ticket Placement** (✅ 2/3 vs ❌ 0/3)
   - With-skill consistently places tickets in `.claude/workflows/tickets/ready/`
   - Without-skill never placed tickets in correct directory

2. **Semantic ID Format** (✅ Strong vs ❌ Weak)
   - With-skill: BUGFIX-POINTER-CURSOR-20260329, VALIDATE-LAYOUT-FIX-20260329
   - Without-skill: BUG-POINTER-CURSOR (missing date), TICKET-data-completeness (wrong format), fix-width.md (no ID at all)

3. **Structured Subtasks** (✅ Better vs ❌ Inconsistent)
   - With-skill: Includes complexity ratings and per-subtask token estimates
   - Without-skill: Missing complexity ratings, inconsistent structure

4. **Codebase Analysis** (✅ Comprehensive vs ✅ Comprehensive)
   - Both performed thorough codebase analysis
   - Similar quality of file identification

### What Without-Skill Does Better

1. **Speed** (✅ 118% faster)
   - Without-skill: 188.8s average
   - With-skill: 411.4s average (slower due to structured workflow)

2. **Consistency** (✅ Lower variance)
   - Without-skill: ±24.1s (12.8% CV)
   - With-skill: ±149.9s (36.4% CV) - very high variance

3. **Token Efficiency** (✅ Slightly better)
   - Without-skill: 46,151 tokens (-11% vs skill)
   - With-skill: 52,099 tokens

### Common Issues (Both Configurations)

1. **Token Estimate Accuracy** (❌ Both struggled)
   - Eval-1: 8K vs 6K expected (with-skill), 5K vs 6K (without-skill)
   - Eval-2: 12K vs 29K expected (with-skill), 29K correct (without-skill)
   - Eval-3: 8K vs 14K expected (with-skill), 14K correct (without-skill)
   - Pattern: With-skill underestimated when adapting to "already implemented" scenarios

2. **Feature Discovery** (✅ Both excellent)
   - Both configurations discovered that all 3 requirements were already implemented
   - Both adapted ticket type from "implementation" to "validation"/"QA"
   - Shows good analysis skills in both approaches

---

## Variance Analysis

### Time Variance

**With-skill: High variance (±149.9s, 36.4% CV)**
- eval-1: 518.4s (very slow)
- eval-2: 228.8s (fast)
- eval-3: 487.1s (slow)
- Pattern: Slow on bugfix tickets (eval-1, eval-3), fast on features (eval-2)

**Without-skill: Low variance (±24.1s, 12.8% CV)**
- eval-1: 213.7s
- eval-2: 187.2s
- eval-3: 165.6s
- Pattern: Consistent speed regardless of ticket type

### Token Variance

**With-skill: Lower variance (±6,160 tokens, 11.8% CV)**
- Consistent token usage across ticket types

**Without-skill: Higher variance (±7,779 tokens, 16.9% CV)**
- More variable token consumption

---

## Detailed Failure Analysis

### With-Skill Failures (5 assertions across 3 tests)

1. **Eval-1**: Token budget mismatch (8K vs 6K expected)
   - Root cause: Over-scoped validation ticket

2. **Eval-2**: Three failures
   - Ticket not in ready/ directory (process issue)
   - Token budget mismatch (12K vs 29K - correct adaptation)
   - Subtasks don't follow dependency order (marginal issue)

3. **Eval-3**: Token budget mismatch (8K vs 14K expected)
   - Root cause: Correct adaptation to validation ticket

### Without-Skill Failures (9 assertions across 3 tests)

1. **Eval-1**: Three failures
   - No ticket in ready/ directory
   - Missing date in ticket ID (BUG-POINTER-CURSOR)
   - Missing per-subtask complexity ratings

2. **Eval-2**: Three failures
   - No ticket in ready/ directory
   - Wrong ticket ID format (TICKET-data-completeness)
   - Exceeded subtask limit (6 subtasks vs 3-5 guideline)

3. **Eval-3**: Three failures
   - No ticket in ready/ directory
   - Completely wrong ticket ID (fix-width.md, no semantic ID)
   - Missing per-subtask complexity ratings

---

## Performance by Ticket Type

### Bugfix Tickets (eval-1, eval-3)

**With-skill:**
- Pass rate: 90% (18/20)
- Time: 502.8s average (8.4 minutes)
- Consistently high quality, slow execution

**Without-skill:**
- Pass rate: 70% (14/20)
- Time: 189.7s average (3.2 minutes)
- Missing structural elements, fast execution

**Winner:** with-skill (quality matters more for production readiness)

### Feature Tickets (eval-2)

**With-skill:**
- Pass rate: 75% (9/12)
- Time: 228.8s (3.8 minutes)
- Token estimate issues

**Without-skill:**
- Pass rate: 75% (9/12)
- Time: 187.2s (3.1 minutes)
- Similar issues, slightly faster

**Winner:** TIE (both had comparable issues)

---

## Recommendations

### ✅ Deploy the Skill

**Reasons:**
1. **Better quality**: 84.4% vs 71.9% pass rate (+12.5%)
2. **Correct placement**: Tickets go to right directory
3. **Semantic IDs**: Consistent, machine-parseable format
4. **Structured subtasks**: Includes complexity ratings and token estimates
5. **Production-ready**: Tickets are actionable for implementation agents

**Trade-offs to accept:**
1. **118% slower**: 411s vs 189s (acceptable for quality gain)
2. **High variance**: Execution time varies by ticket type
3. **13% more tokens**: 52K vs 46K (small cost for better structure)

### When to Use Each Approach

**Use with-skill when:**
- Creating tickets for implementation agents (automation workflows)
- Need consistent ticket format and placement
- Quality and structure are critical
- Time is not a constraint

**Use without-skill when:**
- Quick ad-hoc ticket drafting
- Human will review and fix structure
- Speed is critical
- Ticket format doesn't matter

---

## Skill Optimization Opportunities

### 1. Reduce Time Variance (Priority: High)
- Current: 36.4% CV (±149.9s)
- Target: <20% CV
- **Fix:** Detect ticket type early, use streamlined workflow for simple tickets

### 2. Fix Ticket Placement (Priority: Critical)
- eval-2 ticket wasn't moved to ready/ directory
- **Fix:** Add explicit "move ticket to ready/" step after creation

### 3. Improve Token Estimate Accuracy (Priority: Medium)
- Current: Underestimates when adapting from implementation to validation
- **Fix:** Add "adjusted estimate" field when ticket type changes

### 4. Add ID Validation (Priority: Low)
- eval-2 ticket ID missing TYPE prefix (DATA-COMPLETENESS vs FEATURE-DATA-COMPLETENESS)
- **Fix:** Add validation step checking [TYPE]-[NAME]-[DATE] format

---

## Overall Verdict

**Status:** ✅ **SKILL VALIDATED**

The create-ticket skill demonstrates clear value:
- **Quality improvement**: +12.5% pass rate (84.4% vs 71.9%)
- **Structural consistency**: Proper placement, semantic IDs, complexity ratings
- **Production-ready output**: Tickets are actionable for autonomous workflows

**Cost:**
- **Time**: +118% (acceptable for autonomous workflows)
- **Tokens**: +13% (minimal cost for quality gain)

**Recommendation:** Deploy the skill for autonomous ticket creation workflows. The quality improvement and structural consistency justify the time cost, especially when tickets are consumed by implementation agents.
