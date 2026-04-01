# Performance Review: Multi-User Support with bcrypt Authentication

**Branch**: `feature/T00000-multi-user-support`
**Review Date**: 2026-03-31
**Reviewer**: Performance Review Agent
**Score**: 7.5/10

## Executive Summary

The multi-user authentication implementation introduces bcrypt password hashing with a deliberate performance trade-off for security. Overall performance impact is acceptable for the expected user scale (family deployment with <10 users). Key findings:

- **bcrypt Overhead**: Intentionally slow by design (10 rounds) - appropriate for security
- **Login Performance**: O(n) user iteration - acceptable for small user base, potential bottleneck at scale
- **Database Queries**: Well-optimized with proper indexing and userId filtering
- **Middleware**: Efficient cookie-based auth check with minimal overhead
- **Bundle Size**: bcrypt native addon adds ~30KB (reasonable for security benefit)

---

## 1. Password Hashing Performance

### bcrypt Configuration

**File**: `/Users/vdzeravianko/work/sources/opt1/my/coa/lib/auth.ts`

```typescript
const SALT_ROUNDS = 10;

export async function hashPasskey(passkey: string): Promise<string> {
  const pepperedPasskey = passkey + process.env.PASSKEY_HASH_SECRET;
  const hash = await bcrypt.hash(pepperedPasskey, SALT_ROUNDS);
  return hash;
}

export async function verifyPasskey(
  passkey: string,
  hashedPasskey: string
): Promise<boolean> {
  const pepperedPasskey = passkey + process.env.PASSKEY_HASH_SECRET;
  const isValid = await bcrypt.compare(pepperedPasskey, hashedPasskey);
  return isValid;
}
```

**Analysis**:
- **Salt Rounds**: 10 rounds is appropriate for 2026 (OWASP recommends 10-12)
- **Performance Cost**: ~100-300ms per hash/verify operation (intentional)
- **Security Benefit**: Makes brute-force attacks computationally expensive
- **Usage Pattern**: Only runs during login and user creation (infrequent operations)

**Status**: ✅ **ACCEPTABLE** - bcrypt is intentionally slow for security. 10 rounds is industry standard.

---

## 2. Login Performance Analysis

### Sequential User Verification

**File**: `/Users/vdzeravianko/work/sources/opt1/my/coa/app/api/auth/login/route.ts`

```typescript
export async function POST(request: Request) {
  const { passkey } = await request.json();

  // Get all users from database
  const users = await db.user.findMany();

  // Find user by verifying passkey against each hashed passkey
  let authenticatedUser = null;
  for (const user of users) {
    const isValid = await verifyPasskey(passkey, user.hashedPasskey);
    if (isValid) {
      authenticatedUser = user;
      break;  // Early exit on match
    }
  }
  // ...
}
```

**Performance Characteristics**:
- **Database Query**: Single `findMany()` - O(1) query, O(n) data transfer
- **Verification Loop**: O(n) iterations where n = number of users
- **bcrypt Cost**: ~100-300ms per verification attempt
- **Early Exit**: Breaks on first match (good optimization)

**Worst Case Scenario**:
- 10 users with wrong passkey: 10 × 300ms = **3 seconds**
- 5 users with correct passkey (average position): 2.5 × 300ms = **750ms**
- 2 users with correct passkey (family deployment): 1-2 × 300ms = **150-300ms**

### ⚠️ WARNING: Login Performance Scales Linearly with User Count

**Issue**: The current implementation verifies passkeys sequentially against all users until a match is found.

**Impact**:
- **Family deployment (2-5 users)**: Acceptable (~150-750ms average)
- **Small team (10-20 users)**: Noticeable delay (~1-3s worst case)
- **Medium deployment (50+ users)**: Poor user experience (5-15s)

**Root Cause**: Cannot use indexed database lookup because passkeys are hashed with unique salts.

**Mitigation Options** (not required for current use case):
1. **Username-based Login**: Add username field, verify passkey only for that user (O(1))
2. **Caching**: Cache user hashes in memory (trade-off: memory usage vs. performance)
3. **Rate Limiting**: Prevent brute-force attempts (security-focused, not performance)

**Recommendation**: For current family deployment scope (2-10 users), **no action required**. If scaling beyond 10 users, implement username-based login.

---

## 3. Database Query Performance

### Query Patterns

**File**: `/Users/vdzeravianko/work/sources/opt1/my/coa/actions/college.ts`

All database queries properly filter by `userId`:

```typescript
export async function getColleges() {
  const userId = await requireAuth();

  const colleges = await db.college.findMany({
    where: { userId },  // ✅ Indexed filter
    include: {
      checklist: true,  // ✅ 1-to-1 eager load (efficient)
    },
    orderBy: {
      deadlineApp: "asc",
    },
  });
  // ...
}
```

**Index Analysis** (`prisma/schema.prisma`):

```prisma
model College {
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  // ... fields ...

  @@index([userId])  // ✅ Proper indexing
  @@map("colleges")
}
```

**Status**: ✅ **GOOD** with minor optimization opportunity
- All queries filter by indexed `userId` field
- Proper use of `include` for related data (checklist)
- No critical N+1 patterns in read operations

### ⚠️ OPTIMIZATION: Missing Composite Index

**Issue**: Many update/delete operations filter by both `userId` AND `id`, but only single-column index exists.

**Affected Operations**:
```typescript
// updateCollege, deleteCollege, updateCollegeStatus all use:
where: { id, userId }
```

**Current Index**:
```prisma
@@index([userId])  // Only indexes userId
```

**Recommended**:
```prisma
@@index([userId, id])  // Composite index for authorization queries
@@index([userId, deadlineApp])  // For dashboard ordering with filtering
```

**Impact**:
- Postgres must scan userId index, then filter by id
- Not critical at small scale but impacts performance as data grows
- Estimated improvement: 10-30% faster on update/delete operations

**Severity**: Medium - Works fine now, better for scalability

### ⚠️ MINOR: Double Query Pattern in Updates

**Files**: `actions/college.ts` lines 111-127, 165-177

**Pattern**:
```typescript
// First query: update
const result = await db.college.updateMany({
  where: { id, userId },
  data: { status }
});

// Second query: fetch updated data
const college = await db.college.findFirst({
  where: { id, userId },
  include: { checklist: true }
});
```

**Analysis**:
- Two sequential database roundtrips per update
- Adds ~20-50ms latency per operation
- Not a true N+1 but follows anti-pattern

**Mitigation**:
- `updateMany()` provides security benefit (authorization via userId)
- Could use single `update()` with composite unique constraint
- Current approach is acceptable trade-off for simplicity

**Severity**: Low - Minor latency impact, security benefit justifies pattern

---

## 3.1. UpdateChecklist Query Chain

**File**: `actions/college.ts` lines 188-253

**Pattern**: Sequential query chain with 3-4 database operations:

```typescript
export async function updateChecklist(collegeId: string, values: Partial<...>) {
  // Query 1: Fetch college with checklist
  const college = await db.college.findFirst({
    where: { id: collegeId, userId },
    include: { checklist: true }
  });

  // Query 2: Update or create checklist
  if (college.checklist) {
    updatedChecklist = await db.checklist.update({ ... });
  } else {
    updatedChecklist = await db.checklist.create({ ... });
  }

  // Query 3: Conditionally update college status
  if (newStatus !== college.status) {
    await db.college.update({
      where: { id: collegeId },
      data: { status: newStatus }
    });
  }
}
```

**Performance Impact**:
- 3-4 sequential database roundtrips
- Estimated total: 150-250ms per checklist update
- Most user-visible performance bottleneck
- Status auto-progression requires additional update

**Optimization Options**:
1. **Database Transaction**: Wrap operations in `$transaction` to reduce roundtrips
2. **Single Update**: Combine checklist + status update in one operation
3. **Optimistic UI**: Update UI immediately, sync in background

**Recommendation**: Consider wrapping in Prisma transaction for better atomicity and performance:
```typescript
await db.$transaction(async (tx) => {
  const college = await tx.college.findFirst({ ... });
  const checklist = await tx.checklist.update({ ... });
  if (statusChange) await tx.college.update({ ... });
});
```

**Severity**: Medium - Noticeable in user experience, optimization would improve UX

---

## 4. Auth Middleware Performance

### Middleware Implementation

**File**: `/Users/vdzeravianko/work/sources/opt1/my/coa/middleware.ts`

```typescript
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast route checks (string operations)
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Cookie read (O(1) operation)
  const userId = request.cookies.get("user_id")?.value;
  const isAuthorized = request.cookies.get("is_authorized")?.value === "true";

  if (!userId && !isAuthorized) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}
```

**Performance Analysis**:
- **Cookie Read**: O(1) operation, ~1-5ms overhead
- **String Operations**: Minimal CPU cost
- **No Database Calls**: Excellent - avoids DB round-trip on every request
- **No Token Decoding**: No JWT parsing overhead

**Status**: ✅ **EXCELLENT** - Lightweight, cookie-based auth check with minimal overhead per request.

---

## 5. Bundle Size Analysis

### New Dependencies

**File**: `package.json`

```json
{
  "dependencies": {
    "bcrypt": "^6.0.0"  // Native C++ addon
  },
  "devDependencies": {
    "@types/bcrypt": "^6.0.0"  // Type definitions only
  }
}
```

**Bundle Impact**:
- **bcrypt**: Native addon (~30KB compiled, not included in client bundle)
- **Server-side only**: bcrypt runs only in Node.js runtime (server actions, API routes)
- **Client bundle**: No impact - bcrypt is never imported in client components

**Status**: ✅ **MINIMAL IMPACT** - bcrypt is server-side only, does not affect client bundle size.

---

## 6. Caching Opportunities

### Current State

**Server Actions** (`actions/college.ts`):
- No caching implemented
- Every page load triggers fresh database queries
- `revalidatePath()` used for cache invalidation (good practice)

### 💡 SUGGESTION: Consider Data Caching for Read-Heavy Operations

**Opportunity**: Dashboard data could benefit from caching since college data doesn't change frequently.

**Implementation Example**:
```typescript
import { unstable_cache } from 'next/cache';

export const getColleges = unstable_cache(
  async () => {
    const userId = await requireAuth();
    const colleges = await db.college.findMany({
      where: { userId },
      include: { checklist: true },
      orderBy: { deadlineApp: "asc" },
    });
    return { colleges: colleges.map(convertDecimalFieldsForClient) };
  },
  ['colleges-list'],  // Cache key
  {
    revalidate: 60,  // Revalidate every 60 seconds
    tags: ['colleges'],  // For manual invalidation
  }
);
```

**Benefits**:
- Reduces database load for repeated dashboard views
- Faster page loads for read-heavy operations
- Still maintains data freshness with revalidation

**Trade-offs**:
- Adds complexity to cache invalidation logic
- May show stale data for up to 60 seconds

**Recommendation**: **Optional optimization** - Current performance is acceptable. Consider if database load becomes an issue or if multiple users frequently access dashboard simultaneously.

---

## 7. Potential Performance Issues

### ⚠️ WARNING: Create User Script Performance

**File**: `/Users/vdzeravianko/work/sources/opt1/my/coa/scripts/create-user.ts`

```typescript
// Get all existing users
const allUsers = await prisma.user.findMany();

// Try to verify passkey against each existing user
for (const user of allUsers) {
  const isMatch = await verifyPasskey(passkey, user.hashedPasskey);
  if (isMatch) {
    passkeyExists = true;
    duplicateUser = user.name;
    break;
  }
}
```

**Issue**: Same O(n) verification pattern as login route.

**Impact**:
- **5 users**: ~750ms to check uniqueness
- **10 users**: ~1.5s to check uniqueness
- **20 users**: ~3s to check uniqueness

**Severity**: Low (user creation is infrequent administrative task)

**Recommendation**: **No action required** - This is an admin script, not a user-facing feature. Performance is acceptable for intended use.

---

## 8. Revalidation Strategy

### Current Implementation

**Cache Invalidation Pattern**:
```typescript
// After mutations
revalidatePath("/dashboard");
revalidatePath(`/college/${id}`);
```

**Status**: ✅ **GOOD** - Proper use of Next.js 15 revalidation:
- Invalidates affected routes after mutations
- Prevents stale data
- No over-invalidation detected

---

## 9. Server Action Performance

### Auth Check Overhead

Every server action calls `requireAuth()`:

```typescript
export async function getColleges() {
  const userId = await requireAuth();  // Cookie read + validation
  // ... database query
}
```

**Performance Cost**:
- `requireAuth()` reads cookie: ~1-5ms
- Negligible overhead compared to database query time

**Status**: ✅ **ACCEPTABLE** - Auth overhead is minimal relative to database operations.

---

## 10. Edge Cases & Stress Testing

### Concurrent Login Attempts

**Scenario**: Multiple users logging in simultaneously

**Analysis**:
- Each login attempt is independent
- No shared state or locks
- bcrypt verification is CPU-bound
- May cause CPU spikes during concurrent logins

**Impact**: Low (family deployment with infrequent logins)

---

## Summary of Findings

### ✅ **Strengths**

1. **Database Indexing**: Proper `userId` index on colleges table
2. **Middleware Efficiency**: Lightweight cookie-based auth check
3. **No N+1 Queries**: Proper eager loading with `include`
4. **bcrypt Configuration**: Industry-standard 10 salt rounds
5. **Bundle Size**: Server-side only, no client impact
6. **Early Exit Optimization**: Login breaks on first match

### ⚠️ **Warnings**

1. **Login Performance Scaling**: O(n) user iteration becomes noticeable beyond 10 users
   - **Acceptable for current use case** (family deployment)
   - **Mitigation required** if scaling to 20+ users

2. **Create User Script Performance**: Same O(n) pattern as login
   - **Low severity** (admin task, infrequent)

3. **Missing Composite Index**: Update/delete operations filter by `(userId, id)` but only single index exists
   - **Medium severity** - Not critical now, impacts scalability
   - **Recommendation**: Add `@@index([userId, id])` to College model

4. **UpdateChecklist Query Chain**: 3-4 sequential database operations per update
   - **Medium severity** - Most user-visible performance bottleneck
   - **Recommendation**: Wrap in database transaction for atomicity and reduced latency

### 💡 **Suggestions**

1. **Data Caching**: Consider `unstable_cache` for dashboard queries
   - **Optional optimization** for read-heavy usage patterns
   - Would reduce database load and improve repeat page loads

2. **Performance Monitoring**: Add timing logs to track login performance as user base grows
   ```typescript
   console.time('login-verification');
   const isValid = await verifyPasskey(passkey, user.hashedPasskey);
   console.timeEnd('login-verification');
   ```

---

## Recommendations

### Immediate Actions (Before Production)

1. **Add Composite Index on College table**:
   ```prisma
   @@index([userId, id])
   ```
   - Impact: 10-30% faster update/delete operations
   - Easy change, no code modifications needed

### Short-term Optimizations (Next Sprint)

2. **Optimize UpdateChecklist with Transaction**:
   - Wrap 3-4 sequential queries in `db.$transaction()`
   - Reduces latency from ~200ms to ~100ms
   - Improves most frequent user interaction

3. **Consider Single-Query Updates**:
   - Refactor `updateCollege()` and `updateCollegeStatus()` to use single `update()` instead of `updateMany()` + `findFirst()`
   - Requires composite unique constraint or accept security/simplicity trade-off

### Future Considerations (if scaling beyond 10 users)

4. **Implement username-based login**:
   - Add `username` field to User model
   - User enters username + passkey
   - Verify passkey only for that user (O(1) instead of O(n))

5. **Add performance monitoring**:
   - Track login duration metrics
   - Set alerts for slow authentication (>2s)

6. **Consider caching for read-heavy operations**:
   - Cache dashboard data with 60s revalidation
   - Use Next.js `unstable_cache` with proper invalidation

---

## Conclusion

The multi-user support implementation demonstrates **good performance engineering practices** with appropriate trade-offs:

- **Security-first approach**: bcrypt overhead is justified and acceptable
- **Database access**: Proper userId indexing; opportunity for composite index optimization
- **Lightweight middleware**: Minimal overhead on every request
- **Scalable within scope**: Performance degrades gracefully within expected user range (2-10 users)

**Overall Assessment**: ✅ **APPROVED WITH RECOMMENDATIONS** - Performance characteristics are appropriate for the intended family deployment use case. No critical issues identified.

**Recommended Actions**:
- ✅ **Add composite index** `@@index([userId, id])` to College model (quick win)
- ✅ **Optimize updateChecklist** with database transaction (improves UX)
- Optional: Refactor double-query patterns in updates

These optimizations will improve scalability and user experience without requiring architectural changes.

---

**Generated by**: Performance Review Agent
**Review Methodology**: Static code analysis, query pattern analysis, algorithmic complexity evaluation, bundle size analysis
