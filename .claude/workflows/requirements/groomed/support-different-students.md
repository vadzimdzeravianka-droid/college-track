# Requirement: Multi-User Support with Data Isolation

## Original Request
We need to support multiple users, right now we have one hardcoded passcode. Instead I want different (for now still hardcoded passcodes? if it is simple we can store it right now and have it hard coded in DB, consider, suggest what is easier, faster, or maybe not to return to it later). Current example we have my son and test account. I want separate them by passcode.

## Why
To isolate data between different students (e.g., real student Arseni vs. test sandbox)

## Examples
For example:
- passcode `test123` → shows applications for test user (sandbox)
- passcode `Arseni123` → shows real Arseni applications he might start working around soon
- passcode `AnyOtherPasscode1` → show any friend Arseni wants to share access with

## Groomed Specification

Transition from single-user passkey authentication to multi-user system with data isolation. Each user has a unique passkey (hardcoded in database initially), and sees only their own college applications. This enables multiple students (or test/production environments) to use the same deployment without seeing each other's data.

**Complexity**: COMPLEX
**Token Budget**: ~55K tokens

### Context
- **Affected areas**:
  - `prisma/schema.prisma` - Add `User` model, add `userId` to `College`, add relations
  - `app/api/auth/login/route.ts` - Change auth logic to find user by passkey, store userId in cookie
  - `middleware.ts` - Extract userId from cookie for request context
  - `actions/college.ts` - Add `userId` filtering to all queries, pass userId to mutations
  - `lib/auth.ts` - NEW: Helper to get current userId from cookies
  - `lib/seed-users.ts` - NEW: Script to create initial users
  - Database migration - Add User table, add userId column to colleges, migrate existing data
- **Dependencies**: None (use existing Prisma and Next.js patterns)
- **Related features**:
  - Existing passkey auth system (will be refactored, not replaced)
  - All college CRUD operations must be updated to filter by userId

### Implementation Approaches

**Approach A: Database-Stored Passkeys with Cookie-Based Sessions**

Add `User` model to database with `passkey` field. On login, query database to find user by passkey, store `userId` in encrypted cookie. All college queries filter by `userId` from cookie. Initial users seeded via Prisma migration or seed script.

**Database Schema**:
```prisma
model User {
  id        String    @id @default(uuid())
  name      String    // "Test User", "Arseni", "Friend 1"
  passkey   String    @unique // "test123", "Arseni123", "AnyOtherPasscode1"
  createdAt DateTime  @default(now())

  colleges  College[]
}

model College {
  // ... existing fields
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Auth Flow**:
1. User enters passkey → POST `/api/auth/login` with `{ passkey: "test123" }`
2. Server queries `User.findUnique({ where: { passkey } })`
3. If found, set cookie: `user_id=<userId>` (encrypted, httpOnly)
4. Middleware reads `user_id` from cookie, makes available to server actions
5. All college queries use `where: { userId }`

**Data Migration**:
```typescript
// Create default user for existing data
const defaultUser = await prisma.user.create({
  data: { name: "Default User", passkey: process.env.APP_PASSKEY }
});

// Assign all existing colleges to default user
await prisma.college.updateMany({
  data: { userId: defaultUser.id }
});
```

**Pros**:
- Clean separation of users and data
- Easy to add more users (just insert into DB or create admin UI later)
- Passkeys stored securely in database (can hash later if needed)
- Existing auth flow mostly preserved (still passkey-based)
- ~50K tokens

**Cons**:
- Requires database migration with existing data handling
- All college actions need userId filtering (easy to miss in new code)
- Cookie size grows slightly (userId added)

**Token Estimate**: ~50K tokens

**Approach B: Environment Variable Mapping (Simpler, No DB Changes)**

Keep passkeys in environment variables but map them to user identifiers. Store mapping in code:
```typescript
const USER_MAP = {
  'test123': 'user-test',
  'Arseni123': 'user-arseni',
  'AnyOtherPasscode1': 'user-friend1'
};
```

On login, find userId from passkey, store `userId` in cookie. Add `userId` to College model (string), filter by userId.

**Pros**:
- No User model needed (simpler schema)
- Faster implementation (~35K tokens)
- Easy to add users (just add to env vars and map)

**Cons**:
- User data split between code and database (not clean)
- No user metadata (name, email, created date)
- Harder to extend to full user system later (will require refactor)
- Less flexible (adding user requires code change)

**Token Estimate**: ~35K tokens

**Approach C: Full Multi-Tenancy with Prisma Row-Level Security**

Use Prisma Client Extensions to automatically inject `userId` filter on all queries. This prevents accidental data leakage.

**Pros**:
- Impossible to forget userId filter (automatic)
- More secure (RLS at ORM level)

**Cons**:
- Much more complex (~70K tokens)
- Overkill for 2-3 users
- Requires advanced Prisma patterns

**NOT RECOMMENDED**: Over-engineered for current use case.

**Recommended**: Approach A (Database-Stored Passkeys). It provides clean architecture, easy extensibility, and only moderate complexity. The investment in proper User model now will make future enhancements (email invites, user management UI, etc.) much easier. Approach B is too hacky and will require refactoring later.

### Edge Cases & Validation

#### Data Validation
- Duplicate passkeys: Database constraint `@unique` on User.passkey prevents duplicates
- Empty passkey: Validate passkey is non-empty before creating user
- Missing userId: All college queries must explicitly include `userId` filter (add to types)
- Invalid userId in cookie: If userId doesn't exist, log out user (clear cookie, redirect to login)

#### Migration Safety
- Existing colleges: All existing colleges must be assigned to a default user during migration
- Zero-downtime migration: Create User model, add userId column (nullable), populate data, make userId required
- Rollback plan: If migration fails, revert schema and restore from backup

#### Security
- Passkey storage: Store passkeys in plain text initially (as per user request), but structure supports hashing later
- Cookie encryption: Use httpOnly, secure, sameSite cookies to prevent XSS/CSRF
- SQL injection: Prisma parameterizes queries automatically
- Authorization: Middleware must validate userId exists in database before allowing request

#### Performance
- Query impact: Adding `where: { userId }` to queries has minimal performance impact (<1ms)
- Index on userId: Add database index on `College.userId` for fast filtering
- Cookie size: Adding userId (~36 chars for UUID) is negligible

#### User Experience
- Login error messages: "Invalid passkey" (don't leak whether user exists)
- Session expiry: Keep 30-day cookie expiry (existing behavior)
- Logout: Clear `user_id` cookie, redirect to login
- No user profile UI initially (defer to future enhancement)

### Acceptance Criteria

- [ ] `User` model added to Prisma schema with fields: id, name, passkey (unique), createdAt
- [ ] `userId` field added to `College` model with foreign key relation to User
- [ ] Database index created on `College.userId` for query performance
- [ ] Migration script creates default user with passkey from `APP_PASSKEY` env var
- [ ] Migration script assigns all existing colleges to default user
- [ ] Database migration applied successfully with existing data preserved
- [ ] `/api/auth/login` updated to query User by passkey instead of comparing to env var
- [ ] On successful login, `user_id` cookie set with userId value (httpOnly, secure)
- [ ] Middleware updated to validate `user_id` cookie and redirect to login if invalid
- [ ] Helper function `getCurrentUserId()` created in `lib/auth.ts` to read userId from cookie
- [ ] All server actions in `actions/college.ts` updated to filter by userId:
  - `getColleges()` → `where: { userId }`
  - `getCollegeById(id)` → `where: { id, userId }`
  - `createCollege(values)` → include userId in create
  - `updateCollege(id, values)` → `where: { id, userId }`
  - `deleteCollege(id)` → `where: { id, userId }`
- [ ] Dashboard only shows colleges for logged-in user
- [ ] User A cannot access User B's college detail pages (404 or redirect)
- [ ] Seed script `lib/seed-users.ts` created to easily add new users
- [ ] Seed script adds 3 users: "Test User" (test123), "Arseni" (Arseni123), "Friend" (AnyOtherPasscode1)
- [ ] All tests updated to create user context before testing college operations
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors
- [ ] Existing colleges still accessible after migration (assigned to default user)

### Test Scenarios

1. **Happy path - Multi-user login**:
   - Create User A with passkey "userA123"
   - Create User B with passkey "userB456"
   - User A logs in → verify `user_id` cookie set to User A's ID
   - User B logs in → verify `user_id` cookie set to User B's ID

2. **Data isolation - Colleges**:
   - User A creates 3 colleges
   - User B creates 2 colleges
   - User A views dashboard → verify sees only their 3 colleges
   - User B views dashboard → verify sees only their 2 colleges

3. **Authorization - Detail page access**:
   - User A creates college with id="college-A"
   - User B attempts to navigate to `/college/college-A`
   - Verify User B gets 404 or redirect (cannot access User A's data)

4. **Migration - Existing data preservation**:
   - Before migration: 5 colleges exist with no userId
   - Run migration → creates default user, assigns all 5 colleges to default user
   - Default user logs in → verify sees all 5 colleges
   - New user logs in → verify sees 0 colleges (fresh start)

5. **Edge case - Invalid passkey**:
   - Attempt login with passkey "nonexistent"
   - Verify response: `{ error: "Invalid passkey" }` (401)
   - Verify no cookie set

6. **Edge case - Invalid userId in cookie**:
   - Manually set `user_id` cookie to non-existent UUID
   - Navigate to dashboard
   - Verify redirected to login (userId not found in database)

7. **Edge case - Missing userId filter (negative test)**:
   - Temporarily remove `where: { userId }` from `getColleges()`
   - User A logs in, views dashboard
   - Verify security check: should throw error or warn (if implemented)
   - Restore userId filter

8. **Seed script - Add new users**:
   - Run `npm run seed-users`
   - Verify 3 users created in database
   - Login with each passkey → verify each user has isolated data

### Technical Implementation Notes

**Prisma Schema Changes** (`prisma/schema.prisma`):
```prisma
model User {
  id        String    @id @default(uuid())
  name      String
  passkey   String    @unique
  createdAt DateTime  @default(now()) @map("created_at")

  colleges  College[]

  @@map("users")
}

model College {
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  // ... existing fields

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  checklist       Checklist?

  @@index([userId]) // Performance index
  @@map("colleges")
}
```

**Migration SQL**:
```sql
-- Step 1: Create User table
CREATE TABLE "users" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "passkey" TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Add userId column to colleges (nullable initially)
ALTER TABLE "colleges" ADD COLUMN "user_id" TEXT;

-- Step 3: Create default user
INSERT INTO "users" ("id", "name", "passkey")
VALUES ('default-user-id', 'Default User', '<APP_PASSKEY_VALUE>');

-- Step 4: Assign all existing colleges to default user
UPDATE "colleges" SET "user_id" = 'default-user-id' WHERE "user_id" IS NULL;

-- Step 5: Make userId required and add foreign key
ALTER TABLE "colleges" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "colleges" ADD CONSTRAINT "colleges_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Step 6: Add index for performance
CREATE INDEX "colleges_user_id_idx" ON "colleges"("user_id");
```

**Auth Helper** (`lib/auth.ts`):
```typescript
import { cookies } from "next/headers";

export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get("user_id")?.value;
  return userId || null;
}

export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized: No user ID in session");
  }
  return userId;
}
```

**Updated Login API** (`app/api/auth/login/route.ts`):
```typescript
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { passkey } = await request.json();

    // Find user by passkey
    const user = await prisma.user.findUnique({
      where: { passkey },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid passkey" }, { status: 401 });
    }

    // Set user_id cookie
    const cookieStore = await cookies();
    cookieStore.set("user_id", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Also set is_authorized for middleware compatibility (optional, can remove)
    cookieStore.set("is_authorized", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 });
  }
}
```

**Updated Server Actions** (`actions/college.ts`):
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function getColleges() {
  const userId = await requireAuth();

  const colleges = await prisma.college.findMany({
    where: { userId }, // Filter by current user
    include: { checklist: true },
    orderBy: { createdAt: "desc" },
  });

  return colleges;
}

export async function getCollegeById(id: string) {
  const userId = await requireAuth();

  const college = await prisma.college.findUnique({
    where: { id, userId }, // Ensure user owns this college
    include: { checklist: true },
  });

  if (!college) {
    throw new Error("College not found");
  }

  return college;
}

export async function createCollege(values: CreateCollegeInput) {
  const userId = await requireAuth();

  const college = await prisma.college.create({
    data: {
      ...values,
      userId, // Associate with current user
    },
  });

  revalidatePath("/dashboard");
  return college;
}

export async function updateCollege(id: string, values: UpdateCollegeInput) {
  const userId = await requireAuth();

  // Verify ownership before updating
  const existing = await prisma.college.findUnique({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("College not found or unauthorized");
  }

  const updated = await prisma.college.update({
    where: { id },
    data: values,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/college/${id}`);
  return updated;
}

export async function deleteCollege(id: string) {
  const userId = await requireAuth();

  // Verify ownership before deleting
  const existing = await prisma.college.findUnique({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("College not found or unauthorized");
  }

  await prisma.college.delete({
    where: { id },
  });

  revalidatePath("/dashboard");
}
```

**Seed Users Script** (`lib/seed-users.ts`):
```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedUsers() {
  console.log("Seeding users...");

  const users = [
    { name: "Test User", passkey: "test123" },
    { name: "Arseni", passkey: "Arseni123" },
    { name: "Friend", passkey: "AnyOtherPasscode1" },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { passkey: userData.passkey },
      update: {},
      create: userData,
    });
    console.log(`✓ User created: ${user.name} (${user.passkey})`);
  }

  console.log("Seeding complete!");
}

seedUsers()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add to `package.json`:
```json
{
  "scripts": {
    "seed-users": "ts-node lib/seed-users.ts"
  }
}
```

**Middleware Updates** (`middleware.ts`):
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { publicRoutes } from "@/routes";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const userId = request.cookies.get("user_id")?.value;

  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Optional: Validate userId exists in database (adds latency, defer to server actions)

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### Deployment Checklist

1. **Pre-deployment**:
   - Run migration locally: `npx prisma migrate dev`
   - Test login with multiple users
   - Verify data isolation in local testing
   - Run all tests: `npm test && npm run test:e2e`

2. **Deployment**:
   - Push schema changes to Vercel (Prisma auto-migrates on build)
   - OR manually run migration on production DB: `npx prisma migrate deploy`
   - Run seed script to create initial users: `npm run seed-users`
   - Verify APP_PASSKEY env var still exists (used for default user)

3. **Post-deployment**:
   - Test login with each passkey (test123, Arseni123, AnyOtherPasscode1)
   - Verify data isolation (User A cannot see User B's colleges)
   - Check logs for errors
   - Monitor query performance (userId index should keep queries fast)

4. **Rollback Plan**:
   - If migration fails, restore from database backup
   - If data corruption, manually reassign colleges to correct users via Prisma Studio

### Future Enhancements (Out of Scope)

- User registration UI (add new users without DB access)
- User profile page (edit name, change passkey)
- Password hashing (bcrypt or argon2 for passkeys)
- Email-based invitations
- User roles (admin vs. student)
- User deletion with data cleanup
- Session management UI (view active sessions, logout all devices)
- Audit log (track who created/edited which colleges)

### References
- CLAUDE.md: Database commands (Prisma migrations)
- CLAUDE.md: Authentication Flow (current passkey system)
- CLAUDE.md: Server Actions Pattern (actions/college.ts)
- Prisma Relations: https://www.prisma.io/docs/concepts/components/prisma-schema/relations
- Prisma Migrations: https://www.prisma.io/docs/concepts/components/prisma-migrate
- Next.js Cookies API: https://nextjs.org/docs/app/api-reference/functions/cookies
