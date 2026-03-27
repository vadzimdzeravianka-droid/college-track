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
