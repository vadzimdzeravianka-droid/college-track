---
name: self-learn
description: Analyze workflow patterns from recent tickets and improve skills through eval-driven iteration. Triggers automatically every 5 tickets or manually on demand.
license: MIT
compatibility: Requires access to learning patterns and skill files
metadata:
  version: "1.0.0"
  author: autonomous-workflow
  stage: continuous-improvement
---

# Self-Learning Skill

Analyze patterns from recent ticket executions, identify improvement opportunities, and update skills for better performance over time.

## When to Use

- Automatically triggered after every 5 completed tickets
- User manually invokes `/self-learn`
- After significant workflow changes
- When metrics show declining performance

## Learning Methodology

Based on Anthropic's skill-creator eval-driven iteration:
1. Analyze execution patterns
2. Identify improvement opportunities  
3. Generate skill updates
4. A/B test old vs new
5. Deploy if improvements proven

## Process

See full implementation in .claude/workflows/LEARNING_AUTOMATION_ISSUE.md

### Quick Reference

```bash
# Triggered automatically after 5 tickets by validate-quality skill

# Manual trigger
claude "/self-learn"

# Output
# - Analysis of last 5 tickets
# - Token efficiency metrics
# - Success rate analysis  
# - Improvement proposals
# - Skills updated (if applicable)
# - Learning report generated
```

## Output Directories

**CRITICAL**: All outputs MUST be saved to `.claude/workflows/learning/` subdirectories. Never save to workspace/outputs/ or other temporary directories.

### Reports Directory
`.claude/workflows/learning/reports/`

Save comprehensive analysis reports here:
- `learning-report-[YYYY-MM-DD].md` - Human-readable learning report
- Format: Markdown with sections for patterns, improvements, A/B test results

### Patterns Directory
`.claude/workflows/learning/patterns/`

Save machine-readable pattern data here:
- `grooming-[ticket-id].json` - Grooming execution patterns
- `implementation-[ticket-id].json` - Implementation execution patterns
- `validation-[ticket-id].json` - Validation execution patterns
- `workflow-summary-[ticket-id].json` - End-to-end workflow summary

### Metrics File
`.claude/workflows/metrics.json`

Update this file in place with learning analysis data (do not create new file).

### Directory Setup

Before saving any files, ensure directories exist:

```bash
# Create directories if they don't exist
mkdir -p .claude/workflows/learning/reports
mkdir -p .claude/workflows/learning/patterns
mkdir -p .claude/workflows/learning/lessons
```

### File Creation Examples

```bash
# Save learning report to correct location
REPORT_FILE=".claude/workflows/learning/reports/learning-report-$(date +%Y-%m-%d).md"
cat > "$REPORT_FILE" << 'EOF'
# Self-Learning Report
## Analysis Date: $(date +%Y-%m-%d)
...
EOF

# Save pattern JSON to correct location
PATTERN_FILE=".claude/workflows/learning/patterns/workflow-summary-${TICKET_ID}.json"
cat > "$PATTERN_FILE" << 'EOF'
{
  "ticket_id": "...",
  "patterns_identified": [...],
  "timestamp": "..."
}
EOF

# Update metrics.json in place
METRICS_FILE=".claude/workflows/metrics.json"
# Read, modify, write back
jq '.last_learning_date = "'$(date +%Y-%m-%d)'" | .tickets_since_last_learning = 0' "$METRICS_FILE" > tmp.json && mv tmp.json "$METRICS_FILE"
```

### Validation

Before completing, verify all outputs are in correct locations:

```bash
# Check that files were created in correct directories
ls -la .claude/workflows/learning/reports/learning-report-*.md
ls -la .claude/workflows/learning/patterns/*.json

# Ensure no files in workspace/outputs/
if [ -d "workspace/outputs/" ]; then
  echo "⚠️  ERROR: Files should not be in workspace/outputs/"
  exit 1
fi
```

## Success Criteria

- Analyze minimum 5 tickets
- Calculate token accuracy (target: 90-110%)
- Measure success rate (target: >80%)
- Identify 2-5 improvement opportunities
- Implement high-impact improvements
- Generate learning report

## References

- Full implementation: `.claude/workflows/LEARNING_AUTOMATION_ISSUE.md`
- Metrics: `.claude/workflows/metrics.json`
- Learning patterns: `.claude/workflows/learning/patterns/`
