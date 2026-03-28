# Requirement: Increase Jest Unit Test Coverage to 90%+

## What I Want

Increase Jest unit test coverage from current 10.87% to 90%+ by adding comprehensive unit tests for React components and server actions that are currently untested.

## Why

To ensure confidence in the automated deployment process and catch bugs early. Currently, most React components (college-card, college-form, dashboard-client, status-actions, etc.) have 0% test coverage, which creates risk for regressions.

## Constraints

- **Target coverage**: 90% minimum (100% would be ideal but not required)
- **Best practices**: Follow TDD principles, don't write absurd tests just to hit numbers
- **Business logic**: Every business case and user flow must be covered
- **Test quality**: Use parameterized tests where applicable (e.g., testing multiple status values)
- **Edge cases**: Test boundary conditions (max/min values, long/short strings, null, undefined, empty arrays, etc.)
- **Performance**: Keep tests minimal and super fast (no unnecessary renders, mock external dependencies)
- **Focus areas**: Prioritize components with business logic over pure UI components

## Examples

Current coverage breakdown shows gaps:
```
All files: 10.87% coverage
- lib/utils.ts: 97.88% ✅ (good example to follow)
- components/*.tsx: 0-3.72% ❌ (needs tests)
- actions/college.ts: 0% ❌ (needs tests)
```

Example test patterns to follow:
- **Parameterized tests**: Test getUrgencyLevel() with multiple deadline/status combinations
- **Component tests**: Render CollegeCard with different props, verify correct badges appear
- **Edge cases**: Test formatCurrency with 0, negative, very large numbers, null, undefined
- **User interactions**: Test form validation, button clicks, checkbox toggles

---

**Instructions**: Drop this file in `.claude/workflows/requirements/inbox/` and the autonomous workflow will:
1. Groom it (enrich with best practices, edge cases, approaches)
2. Create executable ticket
3. Implement with full test coverage
4. Validate quality
5. Auto-commit if all tests pass
