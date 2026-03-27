# Ticket: ESLint Configuration for QA Workflow

**Status**: READY
**Priority**: HIGH
**Estimated Tokens**: 18K
**Groomed Requirement**: `.claude/workflows/requirements/groomed/config-eslint-for-workflow.md`
**Created**: 2026-03-27

## Summary

Configure ESLint with Next.js 15 flat config format to enable Gate 3 (Linting) in the QA validation workflow, using Core Web Vitals + TypeScript rules for production-grade quality checks.

## Implementation Approach

**Approach B (Recommended)**: Create `eslint.config.mjs` with Core Web Vitals and TypeScript-specific rules. This approach is chosen because:
- Aligns with Next.js 15 best practices
- Catches performance issues affecting Core Web Vitals
- Provides TypeScript-aware linting (project is fully TypeScript)
- Matches the 90%+ quality standards of the QA workflow

## Affected Files

### To Create
- `eslint.config.mjs` - Flat config with Core Web Vitals + TypeScript rules

### To Modify
- `package.json` - Update lint script from `next lint` to `eslint .`
- Potentially any files with existing violations (auto-fix where possible)

### Codebase Scope
- ~8 files in `app/` directory
- ~27 files in `components/` directory
- Additional files in `lib/`, `actions/`, `schemas/` directories
- **Total**: ~35-50 TypeScript/TSX files to lint

## Subtasks

### Subtask 1: Create ESLint Flat Config
**Complexity**: Simple
**Estimated Tokens**: 5K

**Description**: Create `eslint.config.mjs` in project root with Next.js 15 recommended flat config format, including Core Web Vitals and TypeScript rule sets with proper ignores for build artifacts and workflow files.

**Files**:
- Create: `eslint.config.mjs`

**Implementation**:
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

**Tests**:
- Manual: Verify config file exists and is valid JavaScript
- Manual: Run `npx eslint --print-config app/page.tsx` to verify config loads

**Acceptance**:
- [ ] `eslint.config.mjs` exists in project root
- [ ] Uses flat config format (ESLint 9+)
- [ ] Includes Core Web Vitals rules (`eslint-config-next/core-web-vitals`)
- [ ] Includes TypeScript rules (`eslint-config-next/typescript`)
- [ ] Properly ignores build/workflow directories
- [ ] Config file is valid (no syntax errors)

---

### Subtask 2: Update Package.json Lint Script
**Complexity**: Simple
**Estimated Tokens**: 2K

**Description**: Update the `lint` script in package.json to use ESLint CLI directly instead of the deprecated `next lint` command.

**Files**:
- Modify: `package.json`

**Changes**:
```diff
{
  "scripts": {
-   "lint": "next lint",
+   "lint": "eslint .",
  }
}
```

**Tests**:
- Manual: Run `npm run lint` and verify it uses ESLint CLI
- Manual: Verify output shows ESLint (not "next lint" deprecation warning)

**Acceptance**:
- [ ] `package.json` lint script updated to `eslint .`
- [ ] No deprecation warnings when running `npm run lint`
- [ ] ESLint CLI is invoked correctly

---

### Subtask 3: Fix Existing Linting Violations
**Complexity**: Medium
**Estimated Tokens**: 8K

**Description**: Run initial linting pass on codebase, auto-fix simple violations, and manually fix remaining issues to achieve zero errors and zero warnings. Document any violations found and fixes applied.

**Files**:
- Potentially modify: Multiple files in `app/`, `components/`, `lib/`, `actions/`, `schemas/`

**Process**:
1. Run `npm run lint` to capture initial violations
2. Run `npm run lint -- --fix` to auto-fix simple issues
3. Manually review and fix remaining violations
4. Run `npm run lint -- --max-warnings 0` to verify zero warnings/errors

**Common Violations to Expect**:
- React Hooks dependency arrays
- Unused variables
- `any` types (if TypeScript rules are strict)
- Missing alt text on images
- Improper `<a>` usage (should use Next.js Link)

**Tests**:
- Manual: Run `npm run lint` → exit code 0
- Manual: Run `npm run lint -- --max-warnings 0` → exit code 0
- Integration: All existing tests still pass after fixes

**Acceptance**:
- [ ] `npm run lint` completes with exit code 0
- [ ] Zero errors reported
- [ ] Zero warnings reported (verified with `--max-warnings 0`)
- [ ] All existing unit tests still pass
- [ ] No regressions in functionality

---

### Subtask 4: Verify QA Workflow Integration
**Complexity**: Simple
**Estimated Tokens**: 3K

**Description**: Verify that Gate 3 in the validate-quality skill now runs successfully instead of being skipped. Test the full linting gate with both passing and intentional failing scenarios.

**Files**:
- Read: `.claude/skills/validate-quality/SKILL.md` (Gate 3 section)
- Potentially update: `CLAUDE.md` (if linting commands need documentation)

**Tests**:
- Manual: Introduce intentional violation → verify linting catches it
- Manual: Remove violation → verify linting passes
- Integration: Simulate Gate 3 execution from validate-quality skill

**Test Scenarios**:
1. **Passing scenario**: Run `npm run lint -- --max-warnings 0` on clean code → passes
2. **Failing scenario**: Add `var x = 1` to a file → linting fails with error
3. **Auto-fix scenario**: Add fixable violation → run with `--fix` → violation removed

**Acceptance**:
- [ ] Gate 3 no longer shows "SKIPPED" message
- [ ] Gate 3 correctly fails when violations exist
- [ ] Gate 3 correctly passes when code is clean
- [ ] CLAUDE.md updated if linting command documentation needed

---

## Acceptance Criteria

- [ ] `eslint.config.mjs` exists in project root with Core Web Vitals + TypeScript config
- [ ] Configuration includes proper file patterns (`**/*.{js,jsx,ts,tsx}`)
- [ ] Configuration includes proper ignores (`.next/**`, `out/**`, `build/**`, `node_modules/**`)
- [ ] `package.json` lint script changed from `next lint` to `eslint .`
- [ ] Running `npm run lint` executes successfully with exit code 0
- [ ] Running `npm run lint -- --max-warnings 0` passes (zero warnings, zero errors)
- [ ] Existing codebase passes all linting rules
- [ ] Gate 3 in validate-quality skill runs and passes
- [ ] All tests pass (no regressions)
- [ ] No build errors
- [ ] CLAUDE.md updated with new linting command (if needed)

## Test Scenarios

### Manual Tests
- [ ] Run `npm run lint` on clean codebase → exit code 0, no errors/warnings
- [ ] Add intentional violation (`var x = 1`) → linting fails with error
- [ ] Run `npm run lint -- --fix` on fixable violation → violation auto-fixed
- [ ] Run `npm run build` → build succeeds without linting errors

### Integration Tests
- [ ] All existing Jest tests pass after linting fixes
- [ ] TypeScript compilation succeeds (`npx tsc --noEmit`)
- [ ] Development server starts without errors

### QA Workflow Integration
- [ ] Gate 3 executes (not skipped)
- [ ] Gate 3 passes on clean code
- [ ] Gate 3 fails on code with violations

## Edge Cases to Handle

### Configuration Format
- Use flat config format (`eslint.config.mjs`), not legacy `.eslintrc.json`
- Ensure ESLint 9+ compatibility (already installed)

### Existing Code Violations
- Prioritize auto-fix for simple issues
- Manually review complex violations before fixing
- Ensure fixes don't introduce bugs (run tests after each fix)

### CI/CD Impact
- QA validation will now fail if linting errors exist
- This is desired behavior - prevents low-quality commits

### Performance
- Linting ~50 files should take < 5 seconds
- Won't significantly impact development workflow

## Definition of Done

- [ ] All 4 subtasks completed
- [ ] All acceptance criteria met
- [ ] Existing test coverage maintained (>= 90%)
- [ ] All tests passing
- [ ] No linter errors
- [ ] No linter warnings
- [ ] No build errors
- [ ] CLAUDE.md updated if linting documentation changed
- [ ] Gate 3 in QA workflow functional

## Token Budget

| Stage | Estimated |
|-------|-----------|
| Subtask 1 (Config creation) | 5K |
| Subtask 2 (Package.json update) | 2K |
| Subtask 3 (Fix violations) | 8K |
| Subtask 4 (QA integration) | 3K |
| **Total** | **18K** |

## Dependencies

- [x] ESLint and eslint-config-next already installed
- [ ] No blocking dependencies

## References

- Groomed requirement: `.claude/workflows/requirements/groomed/config-eslint-for-workflow.md`
- Next.js 15 ESLint docs: https://nextjs.org/docs/app/api-reference/config/eslint
- QA Validation Skill: `.claude/skills/validate-quality/SKILL.md` (Gate 3, lines 85-103)
- CLAUDE.md: Development Commands section
- Package.json: `"eslint": "^9"`, `"eslint-config-next": "15.5.14"`

## Notes

- This is a configuration task, not a feature implementation
- No new functionality is added - only enabling existing QA workflow Gate 3
- Priority is HIGH because QA workflow is incomplete without linting validation
- Recommended approach (Core Web Vitals + TypeScript) provides production-grade quality checks
