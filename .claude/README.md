# Autonomous Development Workflow

**Status**: ✅ Ready for Phase 1 Testing
**Version**: 1.0.0
**Created**: March 26, 2026

## Overview

This directory contains a complete autonomous development workflow that transforms high-level requirements into production-ready code with minimal human intervention.

### What It Does

```
Your Requirement → Autonomous Processing → Production Code + Tests
```

**Autonomously**:
1. ✅ Enriches vague requirements with best practices
2. ✅ Creates executable tickets with subtasks
3. ✅ Implements features using TDD (90%+ coverage)
4. ✅ Validates quality (7 gates including E2E)
5. ✅ Auto-commits if all tests pass
6. ✅ Self-improves through eval-driven iteration

### Key Metrics (Targets)

- **Success Rate**: 85% (first-attempt implementation)
- **Test Coverage**: 90%+ consistently
- **Cost**: ~$0.27 per feature
- **Time**: ~45 minutes fully automated
- **Human Intervention**: < 10% of features

## Quick Start

### 1. One-Time Setup

E2E testing uses Playwright (already configured in the project).

See [QUICK_START.md](QUICK_START.md) for detailed setup instructions.

### 2. Your First Feature

Create a simple requirement:

```bash
# Use template
cp .claude/templates/requirement_template.md \
   .claude/workflows/requirements/inbox/add-college-count.md
```

Edit `inbox/add-college-count.md`:
```markdown
# Requirement: College Count Badge

## What I Want
Show the total number of colleges on the dashboard page

## Why
Users want to quickly see how many colleges they're tracking
```

Run the workflow:
```bash
claude "Process requirement: .claude/workflows/requirements/inbox/add-college-count.md"
```

### 3. Watch It Work

The workflow will autonomously:
- ✅ Groom requirement (adds approaches, edge cases)
- ✅ Create ticket (breaks into subtasks)
- ✅ Implement with TDD
- ✅ Run 7 QA validation gates
- ✅ Commit if all pass

Review the commit in git log!

## Directory Structure

```
.claude/
├── README.md                    # This file
├── QUICK_START.md               # Getting started guide
│
├── workflows/                   # Workflow execution area
│   ├── requirements/
│   │   ├── inbox/              # ← Drop requirements here
│   │   ├── groomed/            # Enriched requirements
│   │   └── archive/            # Completed requirements
│   ├── tickets/
│   │   ├── ready/              # Ready for implementation
│   │   ├── in-progress/        # Being implemented
│   │   ├── qa/                 # In quality validation
│   │   └── done/               # ✅ Completed
│   ├── validation-reports/     # QA validation outputs
│   ├── learning/               # Self-learning data
│   ├── code-reviews/           # Code review reports
│   └── metrics.json            # Performance metrics
│
├── skills/                      # Custom skills (agentskills.io format)
│   ├── groom-requirement/      # Requirement enrichment
│   ├── create-ticket/          # Ticket creation
│   ├── implement-feature/      # TDD implementation
│   ├── validate-quality/       # QA validation
│   ├── self-learn/             # Continuous improvement
│   └── code-review/            # Code review agents
│
├── templates/                   # Templates for users
│   └── requirement_template.md
│
└── archive/                     # Historical documentation
    └── DESIGN_LEGACY.md
```

## Key Documents

| Document | Purpose | When to Read |
|----------|---------|--------------|
| [QUICK_START.md](QUICK_START.md) | Get started quickly | First time user |
| [skills/*/SKILL.md](skills/) | Individual skill docs | Debugging specific stage |
| [workflows/CODE_REVIEW_AGENTS.md](workflows/CODE_REVIEW_AGENTS.md) | Code review system design | Understanding review agents |
| [workflows/FEATURE_BRANCH_WORKFLOW.md](workflows/FEATURE_BRANCH_WORKFLOW.md) | Git workflow | Understanding branch strategy |

## Workflow Modes

### Mode 1: Fully Autonomous (Recommended)

Drop requirement in inbox, let it run:
```bash
cp templates/requirement_template.md workflows/requirements/inbox/my-feature.md
# Edit my-feature.md
claude "Process inbox"
```

**Pros**: Zero intervention, fastest
**Cons**: Less control, review commits after

### Mode 2: Stage-by-Stage

Run each stage manually:
```bash
claude "/groom-requirement inbox/my-feature.md"
# Review groomed/my-feature.md
claude "/create-ticket groomed/my-feature.md"
# Review tickets/ready/FEATURE-MYFEATURE-20260326.md
claude "/implement-feature FEATURE-MYFEATURE-20260326"
# Review code changes
claude "/validate-quality FEATURE-MYFEATURE-20260326"
```

**Pros**: Full control, review each stage
**Cons**: Slower, more interaction

### Mode 3: Skills as Tools

Use skills individually:
```bash
claude "Use groom-requirement skill: I need dark mode"
```

**Pros**: Most flexible
**Cons**: No end-to-end automation

## Self-Learning

The workflow improves itself automatically every 5 features.

**Manual trigger**:
```bash
claude "/self-learn"
```

**What it does**:
1. Analyzes last 5 ticket executions
2. Identifies token waste, failed patterns
3. Creates eval test cases
4. Runs A/B tests (old skill vs improved skill)
5. Updates skills if new version is better

**Expected improvement**: +10-15% quality per iteration

## Monitoring

### Check Status
```bash
# Current tickets
ls workflows/tickets/*/

# Recent validation reports
ls workflows/validation-reports/
```

### View Metrics
```bash
cat workflows/metrics.json
```

Key metrics:
- `success_rate`: % of features that pass QA first attempt
- `avg_tokens_per_feature`: Token efficiency
- `test_coverage_avg`: Average test coverage
- `human_intervention_rate`: How often human help needed

### Learning Progress
```bash
cat workflows/learning/patterns/*.json
```

## Troubleshooting

### Issue: Validation Failed

**Check report**:
```bash
cat workflows/validation-reports/[ticket-id]/report.md
```

**Common fixes**:
- Coverage < 90%: Add tests
- Linter errors: `npm run lint -- --fix`
- E2E failed: Check screenshots in report

### Issue: Token Budget Exceeded

**Run self-learning**:
```bash
claude "/self-learn"
```

It will analyze why and improve estimation.

### Issue: Skill Not Triggering

**Verify skill exists**:
```bash
ls skills/[skill-name]/SKILL.md
```

**Check skill description** (must match use case):
```bash
head -n 10 skills/[skill-name]/SKILL.md
```

## Cost & Performance

### Phase 1 Targets (Week 1)
- Success rate: 60%
- Avg tokens: 55K per feature
- Cost: ~$0.35 per feature
- Human intervention: 30%

### Phase 5 Targets (Week 4+)
- Success rate: 85%+
- Avg tokens: 45K per feature
- Cost: ~$0.22 per feature
- Human intervention: < 10%

### ROI
- Time saved: ~3.5 hours per feature
- At 50 features/month: 175 hours saved for $11 cost

## Workflow Phases

| Phase | Focus | Status |
|-------|-------|--------|
| **Foundation** | Skills tested manually | ✅ Complete |
| **Automation** | End-to-end workflow | ✅ Complete |
| **E2E Testing** | Playwright integration | ✅ Complete |
| **Self-Learning** | Eval-driven improvement | ✅ Complete |
| **Production** | Ongoing optimization | 🔄 Active |

**Current Status**: Production use with continuous improvement

## Architecture Highlights

### Token Optimization
- **Progressive disclosure**: Load context on-demand
- **Caching**: Memory system stores common patterns
- **Smart agents**: Use Haiku for simple tasks, Sonnet/Opus for complex

### Quality Assurance
- **7 validation gates**: Unit tests, coverage, linting, types, build, E2E, acceptance
- **TDD mandatory**: Test-first development enforced
- **90%+ coverage**: Hard requirement

### Self-Learning
- **Eval-driven iteration**: Uses Anthropic's skill-creator methodology
- **A/B testing**: Old vs new skill versions
- **Automatic triggers**: Every 5 features or on performance decline

## Integration with Existing Project

This workflow integrates seamlessly with your Next.js project:

**Respects**:
- Existing test setup (Jest + React Testing Library)
- Linting configuration (ESLint)
- TypeScript strict mode
- Coding patterns from CLAUDE.md
- Git workflow (conventional commits)

**Adds**:
- Autonomous requirement → implementation pipeline
- Self-improving skills
- Quality validation automation
- Performance metrics tracking

**Does NOT change**:
- Your codebase structure
- Testing framework
- Development practices (follows existing patterns)

## Next Steps

1. **Read** [QUICK_START.md](QUICK_START.md)
2. **Try** your first feature (start simple!)
3. **Review** outputs and commits
4. **Iterate** with 2-3 more features
5. **Enable** self-learning after 5 features
6. **Scale** to full autonomy

## Support

**Documentation**:
- Main docs: This directory's markdown files
- Skill docs: `skills/*/SKILL.md`
- Project architecture: `../CLAUDE.md` (root)

**Debugging**:
- Check validation reports: `workflows/validation-reports/`
- View execution patterns: `workflows/learning/patterns/`
- Review metrics: `workflows/metrics.json`
- Code reviews: `workflows/code-reviews/`

**Questions**:
- Skill-specific: See `skills/[skill-name]/SKILL.md`
- Historical design: See `archive/DESIGN_LEGACY.md`

---

**Built with**:
- [agentskills.io](https://agentskills.io) specification
- [Anthropic skill-creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator) methodology
- Claude Code autonomous agent patterns
- Next.js 15 App Router
- TDD best practices
