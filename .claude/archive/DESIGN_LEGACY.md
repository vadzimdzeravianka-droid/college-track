# Autonomous Development Workflow Design
**Agent Architect Review - March 2026**

## Executive Summary

This design implements a fully autonomous requirement-to-production workflow that:
- ✅ Minimizes human interaction to high-level requirement approval only
- ✅ Incorporates self-learning and continuous skill improvement
- ✅ Optimizes for token efficiency and cost reduction
- ✅ Ensures quality through automated testing and validation
- ✅ Follows agentskills.io specification and Anthropic 2026 guidelines

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  HUMAN INPUT: High-level requirement dropped in folder      │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: Requirements Grooming Agent                        │
│  - Analyzes requirement                                      │
│  - Enriches with best practices                             │
│  - Brainstorms implementation approaches                     │
│  - Self-learns from past similar tickets                    │
│  - Creates structured requirement doc                        │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  STAGE 2: Ticket Creation Agent                             │
│  - Converts requirement to actionable ticket                │
│  - Breaks into subtasks with acceptance criteria            │
│  - Estimates complexity & token budget                       │
│  - Links to relevant code sections                          │
│  - Identifies test scenarios                                │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  STAGE 3: Implementation Agent                              │
│  - Reads ticket and acceptance criteria                     │
│  - Implements feature with TDD approach                      │
│  - Writes unit + integration tests (90%+ coverage target)   │
│  - Self-documents changes in CHANGELOG                       │
│  - Runs linter and formatters                               │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  STAGE 4: QA Validation Agent                               │
│  - Runs full test suite                                     │
│  - Performs E2E testing via Chrome MCP                       │
│  - Validates acceptance criteria                            │
│  - Checks code quality metrics                              │
│  - Creates validation report                                │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  STAGE 5: Self-Learning Loop                                │
│  - Captures execution patterns                              │
│  - Updates skills based on outcomes                         │
│  - Saves lessons learned to memory                          │
│  - Runs skill-creator evals                                 │
│  - Improves agent prompts iteratively                       │
└─────────────────────────────────────────────────────────────┘
                       ↓
         [Auto-commit if all validations pass]
                       ↓
         [Human review only for deployment]
```

## Directory Structure

```
.claude/
├── workflows/
│   ├── requirements/
│   │   ├── inbox/              # Human drops requirements here
│   │   ├── groomed/            # Enriched requirements
│   │   └── archive/            # Completed requirements
│   │
│   ├── tickets/
│   │   ├── ready/              # Tickets ready for implementation
│   │   ├── in-progress/        # Currently being worked on
│   │   ├── qa/                 # In QA validation
│   │   └── done/               # Completed tickets
│   │
│   ├── validation-reports/     # QA validation outputs
│   │
│   └── learning/
│       ├── patterns/           # Captured execution patterns
│       ├── lessons/            # Lessons learned from failures
│       └── skill-evals/        # Skill evaluation results
│
├── agents/                     # Agent definitions
│   ├── requirements-groomer.md
│   ├── ticket-creator.md
│   ├── implementation-agent.md
│   ├── qa-validator.md
│   └── learning-agent.md
│
├── skills/                     # Custom skills
│   ├── groom-requirement/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   │   └── analyze_requirement.py
│   │   └── evals/
│   │       └── evals.json
│   │
│   ├── create-ticket/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   │   ├── breakdown_tasks.py
│   │   │   └── estimate_complexity.py
│   │   └── templates/
│   │       └── ticket_template.md
│   │
│   ├── implement-feature/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   │   ├── generate_tests.py
│   │   │   ├── run_tdd_cycle.sh
│   │   │   └── validate_coverage.py
│   │   └── references/
│   │       └── coding_standards.md
│   │
│   ├── validate-quality/
│   │   ├── SKILL.md
│   │   ├── scripts/
│   │   │   ├── e2e_runner.ts
│   │   │   ├── acceptance_validator.py
│   │   │   └── generate_report.py
│   │   └── templates/
│   │       └── qa_report_template.md
│   │
│   └── self-learn/
│       ├── SKILL.md
│       ├── scripts/
│       │   ├── pattern_analyzer.py
│       │   ├── skill_evaluator.py
│       │   └── update_memory.py
│       └── evals/
│
├── memory/                     # Persistent memory (already exists)
│   ├── MEMORY.md
│   ├── feedback_autonomous_workflow.md
│   ├── project_test_patterns.md
│   └── reference_best_practices.md
│
└── templates/
    ├── requirement_template.md
    ├── ticket_template.md
    └── pr_description_template.md
```

## Token Optimization Strategies

### 1. **Progressive Disclosure**
- Load only relevant context per stage
- Use `references/` for detailed docs (load on-demand)
- Cache frequently accessed patterns in memory

### 2. **Efficient Agent Communication**
- Agents pass structured JSON summaries, not full transcripts
- Use file pointers instead of copying content
- Compress patterns into memory files

### 3. **Smart Context Management**
- Each agent starts with minimal context
- Use Grep/Glob instead of reading entire files
- Leverage CLAUDE.md for architecture knowledge

### 4. **Caching & Reuse**
- Cache groomed requirements patterns
- Reuse test generation templates
- Store common validation scripts

### 5. **Haiku for Simple Tasks**
- Use Haiku for linting, formatting, simple validation
- Reserve Sonnet/Opus for complex reasoning

## Self-Learning Architecture

### Learning Cycle
```
Execute → Observe → Analyze → Update Skills → Validate → Execute
```

### What We Learn From

1. **Failed Tests**: Why did it fail? Update implementation skill
2. **Coverage Gaps**: Which areas lack tests? Update test generation patterns
3. **Human Corrections**: User overrides? Save to feedback memory
4. **Performance Metrics**: Token usage, time taken → optimize prompts
5. **Code Quality Issues**: Linter failures → update coding standards

### Skill Evaluation Framework

Following agentskills.io eval-driven iteration:

```json
{
  "skill_name": "implement-feature",
  "evals": [
    {
      "id": 1,
      "prompt": "Add a new status filter to the dashboard",
      "expected_output": "Feature implemented with tests, 90%+ coverage, passes QA",
      "assertions": [
        "All tests pass",
        "Coverage >= 90%",
        "No linter errors",
        "E2E test validates feature",
        "PR description is complete"
      ]
    }
  ]
}
```

### Continuous Improvement

- Run skill evals after every 5 implementations
- Use skill-creator to analyze failures
- Update skill prompts based on patterns
- Version skills (v1, v2, etc.) and A/B test

## Agent Definitions

### 1. Requirements Grooming Agent

**Purpose**: Transform vague requirements into detailed, actionable specs

**Tools**: Read, Write, Grep, WebFetch (for best practices), memory access

**Process**:
1. Read requirement from `workflows/requirements/inbox/`
2. Analyze similar past requirements from memory
3. Fetch relevant best practices (WebFetch)
4. Brainstorm 2-3 implementation approaches
5. Identify edge cases and security considerations
6. Write groomed requirement to `workflows/requirements/groomed/`

**Token Budget**: ~10K tokens (Sonnet)

**Output Format**:
```markdown
# Requirement: [Title]

## Original Request
[User's original text]

## Enriched Requirement
[Detailed spec with context]

## Implementation Approaches
1. **Approach A**: [Description] - Pros/Cons
2. **Approach B**: [Description] - Pros/Cons

## Edge Cases
- [Case 1]
- [Case 2]

## Security Considerations
- [Consideration 1]

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

### 2. Ticket Creation Agent

**Purpose**: Convert groomed requirement into executable ticket

**Tools**: Read, Write, Glob (find related files), Grep (search patterns)

**Process**:
1. Read groomed requirement
2. Analyze codebase for affected areas (Glob/Grep)
3. Break into subtasks (max 5)
4. Define test scenarios
5. Estimate token budget
6. Write ticket to `workflows/tickets/ready/`

**Token Budget**: ~8K tokens (Sonnet)

**Output Format**: (See ticket_template.md)

### 3. Implementation Agent

**Purpose**: Implement feature with full test coverage

**Tools**: Read, Write, Edit, Bash (tests), Agent (for complex subtasks)

**Process**:
1. Read ticket + acceptance criteria
2. Run tests BEFORE changes (red)
3. Implement feature incrementally
4. Write unit tests (green)
5. Write integration tests
6. Run full test suite
7. Update CLAUDE.md if architecture changes
8. Update documentation

**Token Budget**: ~30K tokens (Sonnet/Opus for complex features)

**Test Coverage Requirement**: 90%+ for new code

### 4. QA Validation Agent

**Purpose**: Comprehensive quality validation before commit

**Tools**: Bash (run tests), Chrome MCP (E2E), Read, Write (reports)

**Process**:
1. Run unit tests: `npm test`
2. Run coverage: `npm run test:coverage`
3. Run linter: `npm run lint`
4. Run E2E tests via Chrome MCP
5. Validate acceptance criteria from ticket
6. Generate validation report
7. **If all pass**: Auto-commit with conventional commit message
8. **If fail**: Create detailed failure report, move ticket back

**Token Budget**: ~5K tokens (Haiku for scripts, Sonnet for analysis)

### 5. Learning Agent

**Purpose**: Continuous skill improvement

**Tools**: Read, Write, Skill (skill-creator), Agent

**Process**:
1. After every ticket completion:
   - Analyze execution transcript
   - Identify inefficiencies (token waste, redundant steps)
   - Update memory with patterns
2. Every 5 tickets:
   - Run skill evals for all skills
   - Use skill-creator to propose improvements
   - A/B test old vs new skill versions
3. Save lessons learned to `.claude/workflows/learning/`

**Token Budget**: ~15K tokens (runs async, low priority)

## Workflow Execution

### Automated Cron Job (Optional)
```json
{
  "schedule": "0 */2 * * *",  // Every 2 hours
  "command": "claude --skill process-requirements-queue"
}
```

### Manual Trigger
```bash
# User drops requirement.md in inbox/
claude /process-requirement workflows/requirements/inbox/requirement.md
```

### Full Pipeline Execution
1. **Grooming**: Auto-runs when file appears in inbox/
2. **Ticketing**: Auto-runs when groomed requirement is saved
3. **Implementation**: Auto-runs when ticket enters ready/
4. **QA**: Auto-runs when implementation completes
5. **Learning**: Runs async after QA

## Quality Gates

Each stage has mandatory quality gates:

| Stage | Gate | Blocker if Fail? |
|-------|------|------------------|
| Grooming | Valid acceptance criteria | Yes |
| Ticketing | Subtasks < 5, Clear scope | Yes |
| Implementation | Tests pass, Coverage >= 90% | Yes |
| QA | All acceptance criteria met | Yes |
| QA | E2E tests pass | Yes |
| QA | No linter errors | Yes |
| Learning | N/A (advisory only) | No |

## Cost Optimization Metrics

### Target Metrics
- **Average tokens per feature**: < 50K tokens
- **Success rate (first attempt)**: > 80%
- **Human intervention rate**: < 10%
- **Test coverage**: > 90%

### Token Budget Breakdown (per feature)
```
Grooming:        10K tokens  (20%)
Ticketing:        8K tokens  (16%)
Implementation:  25K tokens  (50%)
QA:               5K tokens  (10%)
Learning:         2K tokens  ( 4%)
-------------------------
Total:           50K tokens
```

### Cost Per Feature (Sonnet 4.5)
- Input: ~40K tokens @ $3/MTok = $0.12
- Output: ~10K tokens @ $15/MTok = $0.15
- **Total: ~$0.27 per feature**

## E2E Testing with Chrome MCP

### Installation
```bash
npm install -g @modelcontextprotocol/server-puppeteer
```

### Configuration (~/.claude/mcp_settings.json)
```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

### Example E2E Test
```typescript
// .claude/skills/validate-quality/scripts/e2e_runner.ts
import puppeteer from 'puppeteer';

async function testCollegeCreation() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/dashboard');

  // Login
  await page.type('input[name="passkey"]', process.env.APP_PASSKEY);
  await page.click('button[type="submit"]');

  // Add college
  await page.click('[data-testid="add-college-btn"]');
  await page.type('[name="name"]', 'Test University');
  await page.select('[name="category"]', 'MATCH');
  await page.click('button[type="submit"]');

  // Verify
  const collegeName = await page.$eval('[data-testid="college-card"]',
    el => el.textContent);

  if (!collegeName.includes('Test University')) {
    throw new Error('College not created');
  }

  await browser.close();
}
```

## Hooks Configuration

Add to `.claude/settings.json`:
```json
{
  "hooks": {
    "on_agent_complete": {
      "command": "echo 'Agent {agent_name} completed task {task_id}' >> .claude/workflows/audit.log"
    },
    "on_file_write": {
      "pattern": "*.{ts,tsx,js,jsx}",
      "command": "npm run lint --fix {file_path}"
    },
    "pre_commit": {
      "command": "npm test && npm run lint"
    }
  }
}
```

## Memory Integration

Store these memory types:

### `feedback_autonomous_workflow.md`
```markdown
---
name: autonomous-workflow-feedback
description: Lessons learned from autonomous development cycles
type: feedback
---

Never skip E2E tests even if unit tests pass — caught 3 issues this way.

**Why:** Unit tests don't catch integration issues with server actions.

**How to apply:** Always run full E2E suite in QA stage.
```

### `project_test_patterns.md`
```markdown
---
name: test-patterns
description: Common testing patterns for this Next.js app
type: reference
---

## Server Action Testing
Mock Prisma client with jest.mock('@/lib/db')

## Component Testing
Use React Testing Library, not Enzyme
Mock server actions with jest.fn()
```

## Success Metrics Dashboard

Track in `.claude/workflows/metrics.json`:
```json
{
  "total_features": 25,
  "success_first_attempt": 21,
  "human_interventions": 2,
  "avg_tokens_per_feature": 47000,
  "avg_time_minutes": 45,
  "test_coverage_avg": 0.93,
  "cost_per_feature_usd": 0.24
}
```

## Rollout Plan

### Phase 1 (Week 1)
- Set up directory structure
- Create agent definitions
- Build grooming + ticketing agents
- Test with 3 simple requirements

### Phase 2 (Week 2)
- Build implementation agent
- Add test generation
- Integrate with Jest

### Phase 3 (Week 3)
- Add QA validation agent
- Set up Chrome MCP
- Create E2E test templates

### Phase 4 (Week 4)
- Add learning agent
- Set up skill evals
- Enable skill-creator integration

### Phase 5 (Ongoing)
- Monitor metrics
- Iterate on skills
- Expand to cover more scenarios

## Risk Mitigation

1. **Bad Code to Production**
   - Mitigation: Mandatory QA gates, auto-rollback on test failure

2. **Token Budget Exceeded**
   - Mitigation: Set hard limits per agent, use Haiku for simple tasks

3. **Skill Drift** (agents get worse over time)
   - Mitigation: Version skills, run regular evals, A/B test changes

4. **Security Issues**
   - Mitigation: Security checklist in grooming stage, never commit secrets

5. **Human Override Needed**
   - Mitigation: Clear escalation path, detailed failure reports

## Next Steps

1. Get permission approvals
2. Create directory structure
3. Implement agents one by one
4. Test with simple requirements
5. Iterate based on learning
6. Scale to full autonomy

---

**Estimated Time to Full Autonomy**: 4 weeks
**ROI**: After 20 features (~$5 cost), saves 10+ hours of manual work per week
