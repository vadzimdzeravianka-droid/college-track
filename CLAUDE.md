# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

College Track is a Next.js 15 application for tracking college applications, managing portal credentials, and monitoring deadlines. It uses a passkey-based authentication system for a single-user/family deployment.

## Development Commands

```bash
# Install dependencies (auto-runs prisma generate)
npm install

# Development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Linting
npm run lint

# Testing
npm test                  # Run unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:e2e          # Run E2E tests (Playwright)
npm run test:e2e:ui       # Run E2E tests with UI mode
npm run test:e2e:headed   # Run E2E tests in headed mode (see browser)
```

## E2E Testing

End-to-end tests use Playwright to test complete user workflows. Tests are located in `e2e/` directory.

### Running E2E Tests

```bash
# Run all E2E tests in headless mode
npm run test:e2e

# Open Playwright UI for interactive debugging
npm run test:e2e:ui

# Run tests in headed mode (watch browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run tests for specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Test Organization

- `e2e/auth.spec.ts` - Authentication flow tests (login, logout, protected routes)
- `e2e/college-crud.spec.ts` - College creation, updates, and management
- `e2e/checklist.spec.ts` - Checklist updates and auto-status progression
- `e2e/helpers.ts` - Reusable test helpers (login, createCollege, cleanup)

### Configuration

Playwright configuration in `playwright.config.ts`:
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, WebKit
- **Auto-start dev server**: Configured via `webServer` setting
- **Screenshots**: Captured on failure
- **Traces**: Captured on first retry

### Environment Requirements

E2E tests require `APP_PASSKEY` environment variable set in `.env.local` for authentication tests.

### Best Practices

- Tests run in parallel by default for speed
- Each test should be independent (no shared state)
- Use helper functions for common operations (login, createCollege)
- Clean up test data after tests complete
- Tests automatically retry once on CI if they fail

### Debugging Failed Tests

```bash
# View HTML report after test run
npx playwright show-report

# Run with debug mode
npx playwright test --debug

# Run specific test in UI mode
npx playwright test e2e/auth.spec.ts --ui
```

## Database Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Push schema changes to database (development)
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio

# User Management
npm run create-user <username> <passkey>  # ✅ RECOMMENDED: Create user with uniqueness check
npm run seed-users                        # Seed initial 3 users (test123, Arseni123, AnyOtherPasscode1)
npm run hash-passkey <passkey>            # Generate bcrypt hash for a passkey
npm run migrate-add-users                 # Data migration: create default user and assign colleges
```

### Creating/Managing Users (Recommended Method)

**Use `create-user` for all user creation** - it ensures passkey uniqueness:

```bash
# Create new user
npm run create-user "arseni" "Arseni123"

# Create with custom env file
npm run create-user "test-user" "test123" ".env"

# What it does:
# 1. Hashes passkey with bcrypt
# 2. Checks if passkey already exists (prevents duplicates)
# 3. Creates user if passkey is unique
# 4. FAILS if passkey already used by another user
```

**Why this matters**: Bcrypt generates different hashes for the same passkey (unique salts), so database `@unique` constraint on `hashedPasskey` doesn't prevent duplicate passkeys. The `create-user` script verifies passkey uniqueness at the application level.

### Alternative Methods (Legacy/Optional)

**Option 1: Prisma Studio (GUI)**
```bash
npx prisma studio
# Navigate to 'users' table
# Edit hashedPasskey field directly
# ⚠️ Warning: Doesn't check for duplicate passkeys
```

**Option 2: Generate Hash and Update Manually**
```bash
npm run hash-passkey "newPasscode123"
# Copy the hash output
# Update in Prisma Studio
# ⚠️ Warning: Doesn't check for duplicate passkeys
```

**Option 3: Seed Script (Development)**
```bash
npm run seed-users
# Creates 3 hardcoded users
# ⚠️ Warning: Doesn't check for duplicate passkeys
```

## Environment Setup

Required environment variables in `.env.local`:
- `POSTGRES_PRISMA_URL` - Supabase/PostgreSQL connection string
- `APP_PASSKEY` - Default user passkey (used for migration)
- `PASSKEY_HASH_SECRET` - Secret for password hashing (pepper). Generate with: `openssl rand -hex 32`

## Architecture

### App Router Structure

- `app/(protected)/` - Routes requiring authentication (checked by middleware)
  - `dashboard/` - Main college list view
  - `college/[id]/` - Individual college detail pages
- `app/login/` - Public passkey login page
- `app/api/` - API routes (bypass middleware)

### Authentication Flow

**Multi-User System with Password Hashing**:

Middleware (`middleware.ts`) enforces authentication:
1. Checks for `user_id` cookie (primary) or `is_authorized=true` (fallback)
2. Redirects to `/login` if missing
3. Public routes defined in `routes.ts`

Login process (`app/api/auth/login/route.ts`):
1. User submits passkey via login form
2. Server queries all users from database
3. Verifies passkey against each user's hashed passkey using bcrypt
4. On match, sets `user_id` cookie with user's ID
5. Also sets `is_authorized` cookie for backward compatibility

Password security:
- Passkeys hashed with **bcrypt** (salt rounds = 10)
- Automatic unique salting per password
- **Pepper** via `PASSKEY_HASH_SECRET` env var (additional security layer)
- Timing-safe comparison via `bcrypt.compare`
- Plain passkeys never stored or logged

Helper functions (`lib/auth.ts`):
- `hashPasskey(passkey)` - Hash a passkey with bcrypt and pepper
- `verifyPasskey(passkey, hash)` - Verify passkey against hash
- `getCurrentUserId()` - Get userId from cookie (returns null if not authenticated)
- `requireAuth()` - Get userId or throw error (use in server actions)

User management:
- Users stored in database (`User` model) with hashed passkeys
- Each user has isolated data (colleges filtered by userId)
- Add users via Prisma Studio or seed script
- Generate password hashes: `npm run hash-passkey <passkey>`

**Important**: All server actions in `actions/college.ts` call `requireAuth()` and filter by `userId` to ensure data isolation.

### Data Layer

**Database**: PostgreSQL (Supabase) via Prisma ORM

Key models:
- `User` - User accounts with hashed passkeys (1-to-many with colleges)
- `College` - Main college application entity with all details (name, category, status, strategy, deadlines, portal credentials, notes). Belongs to a user via `userId` foreign key.
- `Checklist` - 1-to-1 relationship tracking application requirements (LOR, transcripts, test scores, essays, financial aid)

Enums:
- `Category`: REACH, MATCH, SAFETY
- `Status`: NOT_STARTED, IN_PROGRESS, SUBMITTED, WAITLISTED, ACCEPTED, DECLINED
- `Strategy`: ED (Early Decision), EA (Early Action), RD (Regular Decision)

### Server Actions Pattern

All data mutations use Next.js Server Actions (`"use server"`) in `actions/college.ts`:
- `getColleges()` - Fetch colleges for current user (filtered by userId)
- `getCollegeById(id)` - Fetch single college (ownership verified)
- `createCollege(values)` - Create new college entry (associated with current user)
- `updateCollege(id, values)` - Update college (ownership verified)
- `deleteCollege(id)` - Delete college (ownership verified)
- `updateCollegeStatus(id, status)` - Quick status update (ownership verified)
- `updateChecklist(collegeId, values)` - Update checklist with auto-status progression (ownership verified)

**Important**:
- Server actions automatically revalidate paths using `revalidatePath()` after mutations
- All actions call `requireAuth()` to get current userId
- All queries filter by userId or verify ownership to ensure data isolation

### Form Validation

Zod schemas in `schemas/index.ts`:
- `PasskeySchema` - Login validation
- `CollegeSchema` - College form validation
- `ChecklistSchema` - Checklist validation

Forms use `react-hook-form` with `@hookform/resolvers` for Zod integration.

### Urgency Calculation System

Core logic in `lib/utils.ts` calculates deadline urgency based on absolute days until deadline.

Functions:
- `calculateDaysNeeded(checklist, essayCount)` - Estimates days to complete remaining tasks (used for informational messages)
- `getUrgencyLevel(deadline, status, checklist, essayCount)` - Returns "red", "yellow", "green", or "none"
- `getUrgencyMessage(...)` - Human-readable urgency explanation showing days left vs. days needed
- `isDeadlineUrgent(deadline, status)` - Simple 7-day alert (legacy)

Urgency thresholds (absolute day-based):
- **Red**: 1-7 days until deadline OR overdue
- **Yellow**: 7-21 days until deadline (1-3 weeks)
- **Green**: 21+ days until deadline

Note: `calculateDaysNeeded()` still estimates required time based on checklist completion, essay requirements, and milestone duration constants (e.g., main essay = 21 days, supplemental = 10 days), but urgency color is determined solely by absolute days remaining.

### Component Organization

- `components/` - Application-specific React components
  - `college-card.tsx` - Dashboard card with urgency indicators
  - `college-form-new.tsx` - Multi-step college creation form
  - `checklist-form.tsx` - Checklist manager
  - `dashboard-client.tsx` - Client-side dashboard with filters/search
  - `status-badge.tsx` - Status display with color coding
  - `status-actions.tsx` - Quick status update dropdown
  - `portal-credentials.tsx` - Secure credential display
- `components/ui/` - shadcn/ui primitives (dialog, button, card, etc.)

### Styling

- Tailwind CSS 4
- `globals.css` contains CSS variable-based theming (light/dark mode)
- Dark mode toggle available in navigation
- Color coding:
  - **Status**: NOT_STARTED (gray), IN_PROGRESS (blue), SUBMITTED (yellow), WAITLISTED (orange), ACCEPTED (green), DECLINED (red)
  - **Category**: REACH (purple), MATCH (indigo), SAFETY (teal)
  - **Strategy**: ED (rose), EA (amber), RD (slate)

## Key Features to Understand

### Auto-Status Progression

When checklist is updated, `updateChecklist()` automatically transitions status:
- NOT_STARTED → IN_PROGRESS (on first checklist update)
- IN_PROGRESS → SUBMITTED (when all checklist items complete)
- SUBMITTED → IN_PROGRESS (if checklist items unchecked)

### Date Handling

Dates stored as `DateTime` in Prisma but passed as ISO strings through forms. Server actions convert strings to Date objects before database operations.

### Cost Handling

Cost of attendance tracking added with 7 optional fields in College model:
- 6 cost components: `costTuition`, `costRoomBoard`, `costFees`, `costBooks`, `costPersonal`, `costOther` (all Decimal)
- 1 residency flag: `isInState` (Boolean)

**Utility Functions** (`lib/utils.ts`):
- `calculateTotalCost(college)` - Sum all non-null cost fields
- `formatCurrency(amount)` - Format as USD using `Intl.NumberFormat`
- `getGroupedCosts(college)` - Calculate grouped sums (Tuition+Fees, Room&Board, Other, Total) for dashboard display
- `hasCostData(college)` - Check if any cost data exists

**Display Patterns**:
- **Dashboard**: Grouped breakdown in card (3 lines + total) with "(In-State)" label if applicable
- **Detail Page**: Full itemized breakdown showing all 6 components + total
- **Form**: Multi-step form includes "Cost of Attendance" step with 7 inputs and live total calculation

**Type Handling**: Prisma returns `Decimal` objects for cost fields. Utility functions handle both `number` and `Decimal` types. Forms use `number` inputs with `setValueAs` to convert empty strings to `null`.

**Important**: Total cost is always calculated dynamically (not stored) to avoid data inconsistency.

### Password Storage

Portal passwords stored in plain text (by design for single-user family use). No encryption implemented.

## Testing

Jest configured with:
- `jsdom` environment for React component testing
- `@testing-library/react` for component testing
- Coverage collected from `lib/`, `components/`, and `actions/`
- Path alias `@/` mapped to root directory

Run tests before commits for changed files.

## Deployment

Designed for Vercel:
1. Connect GitHub repository
2. Vercel auto-detects Next.js
3. Add environment variables (POSTGRES_PRISMA_URL, APP_PASSKEY)
4. Supabase integration auto-injects database URL
5. Build command includes `prisma generate`

## Common Patterns

- Use `cn()` utility from `lib/utils.ts` for className merging
- All forms use controlled components with `react-hook-form`
- Toast notifications via `sonner` library
- Icons from `lucide-react`
- Date formatting via `date-fns`
- Always include checklist when fetching colleges for urgency calculation
