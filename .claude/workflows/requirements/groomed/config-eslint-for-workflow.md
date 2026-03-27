# Requirement: ESLint Configuration for QA Workflow

## Original Request

i want ESLINT to be setup

I see this issue,  ⚠️ Gate 3 SKIPPED - ESLint not configured (proceeding with TypeScript checks) - wna this be coevered

## Enriched Requirement

Configure ESLint with Next.js 15's recommended flat config format (`eslint.config.mjs`) to enable Gate 3 (Linting) in the QA validation workflow. This will allow the validate-quality skill to run linting checks as part of the 7-gate quality assurance process.

### Context

- **Affected areas**:
  - `eslint.config.mjs` (new file - flat config format)
  - `package.json` (update lint script to use ESLint CLI directly)
  - `.claude/workflows/validation-reports/` (Gate 3 will now run)
- **Dependencies**: Already installed (`eslint`, `eslint-config-next`)
- **Related features**:
  - QA validation workflow (`.claude/skills/validate-quality/`)
  - Existing `npm run lint` script
  - Build process validation

### Current State

- ✅ `eslint` and `eslint-config-next` installed as devDependencies
- ❌ No ESLint configuration file exists
- ❌ `npm run lint` uses deprecated `next lint` command
- ❌ Gate 3 in QA validation is being skipped

### Desired State

- ✅ `eslint.config.mjs` with strict Next.js + TypeScript rules
- ✅ `npm run lint` uses ESLint CLI directly
- ✅ Gate 3 passes/fails based on actual linting results
- ✅ Zero warnings, zero errors on current codebase

## Implementation Approaches

### Approach A: Minimal Setup (Base Config)

**Description**: Create `eslint.config.mjs` with base `eslint-config-next` configuration. Update `package.json` lint script to use `eslint .` instead of `next lint`.

**Pros**:
- Fastest implementation (~5 minutes)
- Minimal rules to fix
- Lower token usage (~8K)

**Cons**:
- Less strict - won't catch potential quality issues
- Misses Core Web Vitals improvements
- Not aligned with Next.js recommendations for production apps

**Token Estimate**: ~8K tokens

### Approach B: Recommended Setup (Core Web Vitals + TypeScript)

**Description**: Create `eslint.config.mjs` with `eslint-config-next/core-web-vitals` (strict rules for performance) and `eslint-config-next/typescript` (TypeScript-specific linting). Update lint script and fix any violations found.

**Pros**:
- Aligned with Next.js 15 best practices
- Catches performance issues (Core Web Vitals)
- TypeScript-aware linting
- Future-proof configuration

**Cons**:
- May require fixing existing code violations
- Slightly more token-intensive (~15K)

**Token Estimate**: ~15K tokens

**Recommended**: Approach B because the QA workflow is designed for high quality standards (90%+ coverage requirement), and Core Web Vitals rules help catch performance issues that impact user experience. The codebase is already TypeScript, so TypeScript-specific rules are essential.

## Edge Cases & Considerations

### Configuration Format

- **Important**: Next.js 15+ uses flat config format (`eslint.config.mjs`), not legacy `.eslintrc.json`
- Must use ESLint 9+ which is already installed (`"eslint": "^9"` in package.json)

### Existing Code Violations

- Current codebase may have linting violations that weren't caught
- Should run `npx eslint . --fix` to auto-fix simple issues
- Manual fixes may be needed for complex violations

### CI/CD Impact

- QA validation will now fail if linting errors exist
- This is desired behavior - prevents low-quality code from being committed
- Existing code should be linted and fixed before enabling

### Performance

- Linting ~50 TypeScript files should take < 5 seconds
- Won't impact development speed significantly

## Acceptance Criteria

- [ ] `eslint.config.mjs` exists in project root with Core Web Vitals + TypeScript config
- [ ] Configuration includes proper file patterns (`**/*.{js,jsx,ts,tsx}`)
- [ ] Configuration includes proper ignores (`.next/**`, `out/**`, `build/**`, `node_modules/**`)
- [ ] `package.json` lint script changed from `next lint` to `eslint .`
- [ ] Running `npm run lint` executes successfully with exit code 0
- [ ] Running `npm run lint -- --max-warnings 0` passes (zero warnings, zero errors)
- [ ] Existing codebase passes all linting rules
- [ ] Gate 3 in validate-quality skill runs and passes
- [ ] All tests pass with 90%+ coverage
- [ ] No build errors
- [ ] CLAUDE.md updated with new linting command (if needed)

## Test Scenarios

1. **Happy path**: Run `npm run lint` on clean codebase → exit code 0, no errors/warnings
2. **Intentional violation**: Add `var x = 1` to a file → linting fails with error
3. **Auto-fix test**: Introduce simple violation → run `npm run lint -- --fix` → violation auto-fixed
4. **QA workflow integration**: Run validate-quality skill → Gate 3 executes and passes (not skipped)
5. **TypeScript rules**: Use `any` type → linting catches it with TypeScript rule
6. **Build verification**: Run `npm run build` → linting runs as part of build process

## Implementation Steps

### Step 1: Create eslint.config.mjs

Create flat config with Core Web Vitals and TypeScript support:

```javascript
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    'coverage/**',
    '.claude/workflows/**',
  ]),
])

export default eslintConfig
```

### Step 2: Update package.json

Change lint script:

```diff
- "lint": "next lint",
+ "lint": "eslint .",
```

### Step 3: Run initial lint check

```bash
npm run lint
```

Capture any violations.

### Step 4: Auto-fix simple issues

```bash
npm run lint -- --fix
```

### Step 5: Manually fix remaining violations

Review and fix any violations that couldn't be auto-fixed.

### Step 6: Verify zero errors/warnings

```bash
npm run lint -- --max-warnings 0
```

Should exit with code 0.

### Step 7: Update CLAUDE.md (if needed)

If the linting command changed significantly, update CLAUDE.md documentation.

## Token Budget Estimate

- Implementation: 10K tokens (config creation + package.json update + fixing violations)
- Testing: 3K tokens (run lint, verify integration with QA workflow)
- QA: 5K tokens (full validation with Gate 3 enabled)
- **Total**: ~18K tokens

## References

- Next.js 15 ESLint docs: https://nextjs.org/docs/app/api-reference/config/eslint
- Flat config format: Uses `eslint.config.mjs` instead of `.eslintrc`
- CLAUDE.md: Development Commands section (line 20-22)
- QA Validation Skill: `.claude/skills/validate-quality/SKILL.md` (Gate 3, lines 85-103)
- Current package.json: Already has `eslint` v9 and `eslint-config-next` installed
