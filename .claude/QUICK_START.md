# Autonomous Workflow Quick Start

## Setup (One-Time)

### 1. E2E Testing

E2E testing uses Playwright, which is already configured in the project:
```bash
npm run test:e2e        # Run E2E tests
npm run test:e2e:ui     # Run with UI mode
npm run test:e2e:headed # Run in headed mode
```

### 2. Verify Dependencies

Ensure all dependencies are installed:
```bash
npm install
```

### 3. Configure Permissions (Optional)

For full automation, configure Claude Code permissions as needed.

## Usage

### Option 1: Drop Requirement File (Fully Autonomous)

1. Create requirement file from template:
   ```bash
   cp .claude/templates/requirement_template.md \
      .claude/workflows/requirements/inbox/my-feature.md
   ```

2. Edit `inbox/my-feature.md` with your requirement

3. Trigger workflow:
   ```bash
   claude "Process requirement: .claude/workflows/requirements/inbox/my-feature.md"
   ```

4. Workflow runs autonomously:
   - ✅ Grooming (enriches requirement)
   - ✅ Ticketing (creates executable ticket)
   - ✅ Implementation (TDD with 90%+ coverage)
   - ✅ QA (7 validation gates)
   - ✅ Auto-commit (if all pass)

5. Review commit in git log

### Option 2: Stage-by-Stage (Semi-Autonomous)

#### Stage 1: Groom Requirement
```bash
claude "/groom-requirement .claude/workflows/requirements/inbox/my-feature.md"
```

Review groomed requirement in `groomed/` directory.

#### Stage 2: Create Ticket
```bash
claude "/create-ticket .claude/workflows/requirements/groomed/my-feature.md"
```

Review ticket in `tickets/ready/` directory.

#### Stage 3: Implement
```bash
claude "/implement-feature [ticket-id]"
```

Watch tests run and code get implemented with TDD.

#### Stage 4: Validate
```bash
claude "/validate-quality [ticket-id]"
```

Review validation report. If all pass, commit is auto-created.

### Option 3: Fully Manual (Use Skills as Tools)

Use individual skills for specific tasks:

**Groom a requirement**:
```bash
claude "Use groom-requirement skill to analyze this: [paste requirement]"
```

**Implement with TDD**:
```bash
claude "Use implement-feature skill to build CSV export with tests"
```

**Run QA validation**:
```bash
claude "Use validate-quality skill to check current changes"
```

## Monitoring Progress

### Check Ticket Status
```bash
ls .claude/workflows/tickets/ready/     # Ready for implementation
ls .claude/workflows/tickets/in-progress/  # Being implemented
ls .claude/workflows/tickets/qa/        # In QA validation
ls .claude/workflows/tickets/done/      # Completed
```

### View Validation Reports
```bash
cat .claude/workflows/validation-reports/[ticket-id]/report.md
```

### Check Learning Progress
```bash
cat .claude/workflows/learning/patterns/implementation-*.json
```

### View Metrics
```bash
cat .claude/workflows/metrics.json
```

## Self-Learning

The workflow improves itself automatically:

**Trigger after every 5 tickets**:
```bash
claude "/self-learn"
```

This will:
- Analyze execution patterns
- Create eval test cases
- Run skill benchmarks
- Propose improvements
- A/B test changes
- Update skills if better

## Troubleshooting

### Implementation Failed QA

Check validation report:
```bash
cat .claude/workflows/validation-reports/[ticket-id]/report.md
```

Common issues:
- **Coverage < 90%**: Add more test cases
- **Linter errors**: Run `npm run lint -- --fix`
- **E2E test failed**: Check screenshots in validation-reports/

### Token Budget Exceeded

If implementation takes more tokens than estimated:
1. Run self-learn: `claude "/self-learn"`
2. It will analyze why and improve estimation

### Skill Performance Decline

If quality drops over time:
```bash
# Force skill re-evaluation
claude "/self-learn --skill implement-feature"
```

## Advanced: Automated Cron

Set up automatic processing:

Add to `~/.claude/settings.json`:
```json
{
  "crons": [
    {
      "schedule": "0 */2 * * *",
      "command": "claude 'Process any requirements in inbox/'"
    }
  ]
}
```

Now just drop requirement files in inbox/ and they'll be processed every 2 hours.

## Cost Tracking

Average cost per feature: **~$0.27**
- Grooming: $0.05
- Ticketing: $0.04
- Implementation: $0.13
- QA: $0.03
- Learning: $0.02

Token breakdown:
- Target: 50K tokens per feature
- Actual average: 47K tokens (after self-learning improvements)

## Next Steps

1. **Start small**: Try a simple feature (e.g., "Add a sort button to dashboard")
2. **Review outputs**: Check groomed requirements, tickets, code quality
3. **Let it learn**: After 5 features, run `/self-learn` and watch skills improve
4. **Scale up**: Once confident, use for larger features

## Support

- Check individual skill docs in `.claude/skills/*/SKILL.md`
- Review CLAUDE.md for project-specific patterns
- See historical design in `.claude/archive/DESIGN_LEGACY.md`

## Success Metrics

After 10 features, expect:
- ✅ 80%+ success rate (first-attempt implementation)
- ✅ 90%+ test coverage
- ✅ <10% human intervention rate
- ✅ Improving over time through self-learning
