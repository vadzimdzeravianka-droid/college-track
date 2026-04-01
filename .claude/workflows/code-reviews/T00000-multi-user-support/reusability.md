# Reusability Review: T00000 Multi-User Support

**Branch**: `feature/T00000-multi-user-support`
**Review Date**: 2026-03-31
**Focus**: DRY principles, utility abstraction, auth patterns, helper design

---

## Executive Summary

**Overall Grade: B+ (Good with improvement opportunities)**

The multi-user auth implementation demonstrates solid abstraction in `lib/auth.ts` with well-designed utility functions. However, there are several opportunities to reduce duplication in server actions through helper functions for common patterns like ownership verification, error handling, and path revalidation.

---

## 1. Auth Utilities Design (lib/auth.ts)

### Strengths

**Well-Abstracted Functions**: The auth module provides a clean, reusable API:
- `hashPasskey(passkey)` - Encapsulates bcrypt hashing with pepper
- `verifyPasskey(passkey, hash)` - Timing-safe comparison with pepper
- `getCurrentUserId()` - Cookie retrieval abstraction
- `requireAuth()` - Auth guard with error throwing

**Proper Error Handling**: Functions throw descriptive errors when `PASSKEY_HASH_SECRET` is missing, preventing silent failures.

**Security Best Practices**:
- Pepper implementation is consistent across hash/verify
- Bcrypt salt rounds centralized as constant (SALT_ROUNDS = 10)
- Timing-safe comparison via bcrypt.compare

**Type Safety**: Clear function signatures with Promise<string>, Promise<boolean>, and nullable returns.

### Areas for Improvement

**SUGGESTION: Extract Environment Variable Validation**

The `PASSKEY_HASH_SECRET` check is duplicated in both `hashPasskey()` and `verifyPasskey()`:

```typescript
// Appears in both functions
if (!process.env.PASSKEY_HASH_SECRET) {
  throw new Error("PASSKEY_HASH_SECRET environment variable is required");
}
```

**Recommendation**: Extract to a shared validator:

```typescript
function getPasskeySecret(): string {
  const secret = process.env.PASSKEY_HASH_SECRET;
  if (!secret) {
    throw new Error("PASSKEY_HASH_SECRET environment variable is required");
  }
  return secret;
}

export async function hashPasskey(passkey: string): Promise<string> {
  const secret = getPasskeySecret();
  const pepperedPasskey = passkey + secret;
  return bcrypt.hash(pepperedPasskey, SALT_ROUNDS);
}
```

**SUGGESTION: Extract Pepper Application**

The pepper logic `passkey + process.env.PASSKEY_HASH_SECRET` is duplicated:

```typescript
function applyPepper(passkey: string): string {
  return passkey + getPasskeySecret();
}
```

This would make both hash and verify functions more concise and ensure consistent pepper application.

---

## 2. Server Actions Duplication (actions/college.ts)

### WARNING: Repeated Ownership Verification Pattern

**Pattern Count**: 4 identical occurrences

The following pattern appears in `updateCollege()`, `deleteCollege()`, `updateCollegeStatus()`, and `updateChecklist()`:

```typescript
const userId = await requireAuth();

const existing = await db.college.findFirst({
  where: { id, userId },
});

if (!existing) {
  return { error: "College not found or unauthorized" };
}
```

**Impact**:
- 16 lines of repeated code (4 occurrences × 4 lines)
- Maintenance burden: changes to error messages or logic require updates in 4 places
- Risk of inconsistency if one location is updated but others are missed

**Recommendation**: Extract to reusable helper:

```typescript
/**
 * Verify user owns a college record
 * @returns College record if found and owned by current user
 * @throws Error with appropriate message if not found or unauthorized
 */
async function verifyCollegeOwnership(
  collegeId: string,
  include?: { checklist?: boolean }
): Promise<College & { checklist?: Checklist | null }> {
  const userId = await requireAuth();

  const college = await db.college.findFirst({
    where: { id: collegeId, userId },
    include,
  });

  if (!college) {
    throw new Error("College not found or unauthorized");
  }

  return college;
}
```

**Usage**:

```typescript
// Before (4 lines)
const userId = await requireAuth();
const existing = await db.college.findFirst({ where: { id, userId } });
if (!existing) return { error: "College not found or unauthorized" };

// After (1 line with try-catch)
const college = await verifyCollegeOwnership(id, { checklist: true });
```

**Benefits**:
- Reduces 16 lines to 4 lines (75% reduction)
- Centralizes authorization logic
- Consistent error messages
- Type-safe return value with included relations

---

### WARNING: Inconsistent Error Handling

**Issue**: Error handling varies across functions:

1. **Detailed errors** (getColleges, createCollege, updateChecklist):
```typescript
catch (error) {
  console.error("Get colleges error:", error);
  return {
    error: "Failed to fetch colleges",
    details: error instanceof Error ? error.message : String(error)
  };
}
```

2. **Silent errors** (updateCollege, deleteCollege, updateCollegeStatus, getCollegeById):
```typescript
catch (_error) {
  return { error: "Failed to update college" };
}
```

**Problems**:
- Debugging difficult when errors are swallowed
- Inconsistent API response format (sometimes includes `details`, sometimes doesn't)
- Underscore prefix `_error` suggests intentional ignoring

**Recommendation**: Standardize error handling with helper:

```typescript
/**
 * Standard error response for server actions
 */
function handleActionError(
  operation: string,
  error: unknown
): { error: string; details?: string } {
  console.error(`${operation} error:`, error);

  return {
    error: `Failed to ${operation}`,
    details: error instanceof Error ? error.message : String(error),
  };
}
```

**Usage**:

```typescript
try {
  // ... operation
} catch (error) {
  return handleActionError("update college", error);
}
```

---

### WARNING: Path Revalidation Duplication

**Pattern Count**: 5 occurrences of similar revalidation logic

Common patterns:
```typescript
// Pattern 1: Dashboard only
revalidatePath("/dashboard");

// Pattern 2: Dashboard + specific college
revalidatePath("/dashboard");
revalidatePath(`/college/${id}`);

// Pattern 3: Specific college + dashboard
revalidatePath(`/college/${id}`);
revalidatePath("/dashboard");
```

**Issue**:
- Order inconsistency (dashboard first vs. specific page first)
- Repeated patterns across 5 functions
- Easy to forget one path when adding new mutations

**Recommendation**: Extract revalidation helpers:

```typescript
/**
 * Revalidate paths after college mutation
 */
function revalidateCollegePaths(collegeId?: string): void {
  revalidatePath("/dashboard");
  if (collegeId) {
    revalidatePath(`/college/${collegeId}`);
  }
}
```

**Usage**:

```typescript
// After creating/updating/deleting college
revalidateCollegePaths(college.id);

// After dashboard-only change
revalidateCollegePaths();
```

**Benefits**:
- Consistent revalidation order
- Single source of truth for which paths to revalidate
- Easier to add new paths in future (e.g., /colleges, /analytics)

---

### SUGGESTION: Extract Decimal Conversion

The `convertDecimalFieldsForClient()` function is used in 2 places but has limitations:

**Current Implementation**:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertDecimalFieldsForClient(college: any): any {
  return {
    ...college,
    costTuition: college.costTuition ? Number(college.costTuition) : college.costTuition,
    costRoomBoard: college.costRoomBoard ? Number(college.costRoomBoard) : college.costRoomBoard,
    // ... 4 more fields
  };
}
```

**Issues**:
- Uses `any` type (disables type safety)
- Field list hardcoded and verbose
- Not reusable outside college.ts

**Recommendation**: Move to shared utility in `lib/utils.ts`:

```typescript
import { Decimal } from '@prisma/client/runtime/library';

type DecimalField = Decimal | number | null | undefined;

export function convertDecimalToNumber(value: DecimalField): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === 'number' ? value : Number(value);
}

export function convertCollegeDecimalFields<T extends Record<string, unknown>>(
  college: T
): T {
  const decimalFields = [
    'costTuition', 'costRoomBoard', 'costFees',
    'costBooks', 'costPersonal', 'costOther'
  ] as const;

  const converted = { ...college };
  for (const field of decimalFields) {
    if (field in converted) {
      (converted as any)[field] = convertDecimalToNumber(
        converted[field] as DecimalField
      );
    }
  }
  return converted;
}
```

**Benefits**:
- Type-safe with proper Decimal handling
- Reusable for other models with decimal fields
- Clearer separation of concerns
- DRY conversion logic

---

## 3. Cookie Management Pattern

### Strength: Centralized in Login Route

Cookie settings are duplicated but only in one place (`app/api/auth/login/route.ts`):

```typescript
// Cookie settings repeated for user_id and is_authorized
cookieStore.set("user_id", authenticatedUser.id, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 30,
});

cookieStore.set("is_authorized", "true", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 30,
});
```

### SUGGESTION: Extract Cookie Options

**Recommendation**:

```typescript
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

// Usage
cookieStore.set("user_id", authenticatedUser.id, AUTH_COOKIE_OPTIONS);
cookieStore.set("is_authorized", "true", AUTH_COOKIE_OPTIONS);
```

**Benefits**:
- Single source of truth for auth cookie configuration
- Easier to adjust maxAge or security settings
- Clearer intent with named constant

---

## 4. Create User Script Pattern (scripts/create-user.ts)

### Strength: Reuses Auth Utilities

The script correctly leverages `hashPasskey()` and `verifyPasskey()` from `lib/auth.ts`:

```typescript
const hashedPasskey = await hashPasskey(passkey);

// Check for duplicate passkeys
for (const user of allUsers) {
  const isMatch = await verifyPasskey(passkey, user.hashedPasskey);
  if (isMatch) {
    passkeyExists = true;
    break;
  }
}
```

**Good Practice**: Script doesn't reimplement auth logic, ensuring consistency with application code.

### SUGGESTION: Extract Passkey Uniqueness Check

The uniqueness check logic (lines 96-124) could be extracted to a reusable utility:

```typescript
// lib/auth.ts
export async function isPasskeyUnique(
  passkey: string,
  existingUsers: Array<{ hashedPasskey: string }>
): Promise<{ unique: boolean; conflictingUser?: string }> {
  for (const user of existingUsers) {
    const isMatch = await verifyPasskey(passkey, user.hashedPasskey);
    if (isMatch) {
      return { unique: false, conflictingUser: user.name };
    }
  }
  return { unique: true };
}
```

**Benefits**:
- Reusable in API routes (e.g., user registration endpoint)
- Testable in isolation
- Clearer separation of concerns

---

## 5. Middleware Auth Pattern (middleware.ts)

### Strength: Simple and Clear

The middleware correctly checks both new and legacy cookie formats:

```typescript
const userId = request.cookies.get("user_id")?.value;
const isAuthorized = request.cookies.get("is_authorized")?.value === "true";

if (!userId && !isAuthorized) {
  return NextResponse.redirect(new URL("/login", request.url));
}
```

**Good Practice**: Backward compatibility during transition period.

### SUGGESTION: Extract Cookie Check

When legacy support is removed, extract to helper:

```typescript
function isAuthenticated(request: NextRequest): boolean {
  return !!request.cookies.get("user_id")?.value;
}

// Usage
if (!isAuthenticated(request)) {
  return NextResponse.redirect(new URL("/login", request.url));
}
```

---

## 6. Test Coverage of Utilities

### Strength: Comprehensive Auth Tests

`lib/__tests__/auth.test.ts` covers all utility functions:
- hashPasskey() with pepper verification
- verifyPasskey() with timing-safe comparison
- getCurrentUserId() with null handling
- requireAuth() with error throwing

**Good Practice**: Core utilities have strong test coverage, making them safe to reuse.

### Strength: Login Route Tests

`app/api/auth/login/__tests__/route.test.ts` covers:
- Valid passkey authentication
- Invalid passkey rejection
- Multiple user scenarios
- Database error handling

**Good Practice**: Auth flow is well-tested, providing confidence in the reusable pattern.

---

## Summary of Issues

### High Priority

| Issue | Severity | Location | Lines Affected |
|-------|----------|----------|----------------|
| Ownership verification duplication | WARNING | actions/college.ts | 16 lines (4 occurrences) |
| Inconsistent error handling | WARNING | actions/college.ts | 7 functions |
| Path revalidation duplication | WARNING | actions/college.ts | 10 lines (5 occurrences) |

### Medium Priority

| Issue | Severity | Location | Impact |
|-------|----------|----------|---------|
| Decimal conversion uses `any` | SUGGESTION | actions/college.ts | Type safety |
| Cookie options duplication | SUGGESTION | api/auth/login/route.ts | Maintainability |
| Environment variable check duplication | SUGGESTION | lib/auth.ts | 6 lines |

### Low Priority

| Issue | Severity | Location | Impact |
|-------|----------|----------|---------|
| Passkey uniqueness check not extracted | SUGGESTION | scripts/create-user.ts | Future reusability |
| Pepper application duplication | SUGGESTION | lib/auth.ts | Code clarity |

---

## Recommended Refactoring Priority

### Phase 1: Extract Ownership Verification (High Impact)
- Create `verifyCollegeOwnership()` helper
- Update 4 server actions to use helper
- Reduces code by ~12 lines
- **Effort**: 30 minutes
- **Value**: Eliminates most significant duplication

### Phase 2: Standardize Error Handling (High Impact)
- Create `handleActionError()` helper
- Update all 7 server actions
- Improves debugging experience
- **Effort**: 20 minutes
- **Value**: Consistent error reporting

### Phase 3: Extract Revalidation Helper (Medium Impact)
- Create `revalidateCollegePaths()` helper
- Update 5 server actions
- **Effort**: 15 minutes
- **Value**: Easier to maintain path invalidation

### Phase 4: Move Decimal Conversion to Utils (Low Impact)
- Move to `lib/utils.ts` with proper types
- Update imports in college.ts
- **Effort**: 20 minutes
- **Value**: Better type safety, reusability

### Phase 5: Extract Cookie and Env Helpers (Low Impact)
- Extract `AUTH_COOKIE_OPTIONS`
- Extract `getPasskeySecret()`
- **Effort**: 15 minutes
- **Value**: Minor maintainability improvement

---

## Positive Patterns to Maintain

1. **Clean Utility API**: The `lib/auth.ts` module has excellent function naming and clear separation of concerns
2. **requireAuth() Pattern**: Using a single auth guard across all actions ensures consistent authorization
3. **Type-Safe Helpers**: Functions like `getCurrentUserId()` return appropriate nullable types
4. **Test Coverage**: Auth utilities and login route have comprehensive test coverage
5. **Security Practices**: Bcrypt with pepper, timing-safe comparison, httpOnly cookies

---

## Future Reusability Considerations

### For New Features

When adding new models (e.g., `Document`, `Timeline`), consider:

1. **Ownership Verification**: Use similar pattern to college ownership
   ```typescript
   async function verifyDocumentOwnership(id: string) {
     const userId = await requireAuth();
     const doc = await db.document.findFirst({ where: { id, userId } });
     if (!doc) throw new Error("Document not found or unauthorized");
     return doc;
   }
   ```

2. **Generic Ownership Helper**: Consider making ownership verification generic:
   ```typescript
   async function verifyOwnership<T>(
     model: any,
     id: string,
     include?: any
   ): Promise<T> {
     const userId = await requireAuth();
     const record = await model.findFirst({
       where: { id, userId },
       include
     });
     if (!record) throw new Error("Record not found or unauthorized");
     return record;
   }
   ```

3. **Revalidation Strategy**: Document which paths need revalidation for each model

---

## Conclusion

The multi-user auth implementation demonstrates solid foundational abstractions in `lib/auth.ts`. The auth utilities are well-designed, type-safe, and properly tested. However, the server actions layer contains significant duplication in ownership verification, error handling, and path revalidation patterns.

**Key Recommendations**:
1. Extract `verifyCollegeOwnership()` helper (eliminates 75% of duplication)
2. Standardize error handling across all actions
3. Create `revalidateCollegePaths()` helper
4. Move decimal conversion to shared utilities with proper types

These refactorings would reduce code by ~40 lines, improve maintainability, and establish better patterns for future feature development. The auth utilities themselves are excellent examples of reusable, well-tested code.

**Grade Justification**: B+ - Strong utility abstraction, but action-layer duplication prevents an A grade. With recommended refactorings, this would easily be an A.
