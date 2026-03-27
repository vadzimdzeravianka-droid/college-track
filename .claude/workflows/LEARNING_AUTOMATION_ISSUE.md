# Learning Automation Not Triggering

**Issue**: Self-learning workflow supposed to trigger automatically every 5 features, but didn't trigger after CONFIG-ESLINT-20260327 completion.

**Expected Behavior**: After 5th ticket completes, `/self-learn` skill should run automatically to analyze patterns and improve workflows.

**Actual Behavior**: Learning patterns were manually captured, but auto-trigger didn't happen.

---

## Root Cause Analysis

### Expected Trigger Mechanism

According to `.claude/README.md` line 177-179:

```markdown
The workflow improves itself automatically every 5 features.

**Manual trigger**:
```bash
claude "/self-learn"
```
```

**Problem**: No actual implementation of auto-trigger found in:
- ❌ validate-quality skill (doesn't track ticket count)
- ❌ implement-feature skill (doesn't call self-learn)
- ❌ Orchestration logic (no counter mechanism)
- ❌ metrics.json (doesn't track total tickets for trigger)

### Current State

**What exists**:
- ✅ `/self-learn` skill definition
- ✅ Learning pattern storage structure
- ✅ Manual learning capture (done for CONFIG-ESLINT-20260327)

**What's missing**:
- ❌ Ticket counter
- ❌ Auto-trigger logic
- ❌ Integration point in workflow

---

## Solution Design

### 1. Ticket Counter in Metrics

Update `.claude/workflows/metrics.json` to include:

```json
{
  "tickets_completed": 1,
  "tickets_since_last_learning": 1,
  "last_learning_date": null,
  "learning_trigger_threshold": 5,
  "auto_learning_enabled": true
}
```

### 2. Counter Update Logic

Add to validate-quality skill, Step 11:

```markdown
### Step 11: Update Metrics and Check Learning Trigger

After successful validation and commit:

```bash
# Update ticket counter
METRICS_FILE=".claude/workflows/metrics.json"
COMPLETED=$(jq '.tickets_completed' $METRICS_FILE)
SINCE_LEARNING=$(jq '.tickets_since_last_learning' $METRICS_FILE)

NEW_COMPLETED=$((COMPLETED + 1))
NEW_SINCE_LEARNING=$((SINCE_LEARNING + 1))

# Update metrics
jq ".tickets_completed = $NEW_COMPLETED |
    .tickets_since_last_learning = $NEW_SINCE_LEARNING" \
    $METRICS_FILE > tmp.json && mv tmp.json $METRICS_FILE

# Check if learning trigger reached
THRESHOLD=$(jq '.learning_trigger_threshold' $METRICS_FILE)
AUTO_ENABLED=$(jq '.auto_learning_enabled' $METRICS_FILE)

if [[ $NEW_SINCE_LEARNING -ge $THRESHOLD ]] && [[ "$AUTO_ENABLED" == "true" ]]; then
  echo "✨ Learning trigger reached ($NEW_SINCE_LEARNING/$THRESHOLD tickets)"
  echo "Triggering self-learning workflow in background..."

  # Trigger self-learn skill
  claude "/self-learn" &

  # Reset counter
  jq ".tickets_since_last_learning = 0 |
      .last_learning_date = \"$(date -Iseconds)\"" \
      $METRICS_FILE > tmp.json && mv tmp.json $METRICS_FILE
fi
```
```

### 3. Self-Learn Skill Implementation

The `/self-learn` skill should:

1. **Analyze Patterns**
   ```bash
   # Read last 5 ticket learning files
   find .claude/workflows/learning/patterns/ \
     -name "workflow-summary-*.json" \
     -type f -printf '%T@ %p\n' | \
     sort -rn | head -5
   ```

2. **Identify Issues**
   - Token estimation accuracy (target: >90%)
   - Validation failure rate (target: <15%)
   - Common linting violations
   - Repeated code review issues
   - Skill performance metrics

3. **Generate Improvements**
   - Update skill prompts
   - Add new patterns to templates
   - Adjust token estimates
   - Enhance validation checks

4. **A/B Test** (if improvements found)
   - Run test ticket with old skill
   - Run test ticket with new skill
   - Compare metrics
   - Keep better version

5. **Update Skills** (if new version better)
   ```bash
   # Backup old skill
   cp .claude/skills/groom-requirement/SKILL.md \
      .claude/skills/groom-requirement/SKILL.md.backup-$(date +%Y%m%d)

   # Apply improvements
   # [LLM generates updated SKILL.md]

   # Commit
   git add .claude/skills/
   git commit -m "improve: update groom-requirement skill based on learning"
   ```

6. **Report Results**
   ```markdown
   # Self-Learning Report

   **Date**: 2026-03-27
   **Tickets Analyzed**: 5

   ## Patterns Identified
   - Token estimation 8% too high on average
   - Linting violations follow common patterns
   - E2E gate skipped 40% of time (config tasks)

   ## Improvements Made
   1. Reduced grooming token estimate by 8%
   2. Added common linting patterns to templates
   3. Auto-skip E2E for configuration task type

   ## A/B Test Results
   - Old skill: 18K tokens average
   - New skill: 16.5K tokens average
   - Improvement: 8.3% reduction

   ## Skills Updated
   - ✅ groom-requirement (v1.1.0)
   - ✅ validate-quality (v1.1.0)

   ## Next Learning Trigger
   After 5 more tickets (10 total)
   ```

---

## Implementation Plan

### Phase 1: Add Metrics Tracking
```bash
# Initialize metrics.json
cat > .claude/workflows/metrics.json <<EOF
{
  "tickets_completed": 1,
  "tickets_since_last_learning": 1,
  "last_learning_date": null,
  "learning_trigger_threshold": 5,
  "auto_learning_enabled": true,
  "tickets_validated": 1,
  "passed_first_attempt": 1,
  "failed_first_attempt": 0,
  "avg_coverage": 0.1087,
  "avg_validation_time_minutes": 3,
  "most_common_failure": null
}
EOF
```

### Phase 2: Update validate-quality Skill
Add counter increment and trigger check to Step 11.

### Phase 3: Implement self-learn Skill
Create `.claude/skills/self-learn/SKILL.md` with full learning logic.

### Phase 4: Test
```bash
# Manual test trigger
.claude/workflows/metrics.json: set tickets_since_last_learning = 5
Run validate-quality
Verify self-learn triggers automatically
```

### Phase 5: Deploy
Commit changes and enable auto-learning.

---

## Current Workaround

Until auto-trigger is implemented:

**Manual learning after each ticket:**
```bash
# After ticket completion, manually run:
claude "/self-learn"
```

**Or batch learning every 5 tickets:**
```bash
# Check ticket count
ls .claude/workflows/tickets/done/ | wc -l

# If 5 or more since last learning, run:
claude "/self-learn"
```

---

## Testing Checklist

- [ ] metrics.json created and initialized
- [ ] validate-quality increments counter after commit
- [ ] Counter reaches 5 → self-learn triggers
- [ ] self-learn analyzes last 5 tickets
- [ ] self-learn generates improvements
- [ ] self-learn updates skills if better
- [ ] Counter resets to 0 after learning
- [ ] last_learning_date updated
- [ ] Learning report generated
- [ ] Can disable auto-learning (auto_learning_enabled: false)

---

## Success Criteria

**After fix**:
- ✅ Every 5th ticket completion auto-triggers learning
- ✅ No manual intervention needed
- ✅ Skills improve over time automatically
- ✅ Metrics tracked accurately
- ✅ Learning reports generated
- ✅ Token efficiency improves with each learning cycle

**Expected improvement trajectory**:
- After 5 tickets: 5-10% token reduction
- After 10 tickets: 10-15% token reduction
- After 20 tickets: 15-20% token reduction + quality improvements
- After 50 tickets: Plateaus around 20-25% improvement

---

## Priority: HIGH

This is critical for the autonomous workflow to truly be "self-improving". Without auto-learning:
- ❌ Workflows don't improve over time
- ❌ Same mistakes repeated
- ❌ Token efficiency doesn't improve
- ❌ Manual intervention required for learning

**Recommendation**: Implement in next sprint before processing more tickets.
