# Ticket T00005: Deadline Reminder Notifications

**Status**: READY
**Priority**: HIGH
**Estimated Tokens**: 45K
**Groomed Requirement**: deadline-reminders

## Summary

Implement automated deadline reminder system that sends email notifications for upcoming college application deadlines at 7 days and 1 day before. Use Vercel Cron Jobs to check deadlines daily and send emails via Resend API. Add Notification model to track sent reminders and prevent duplicates. Create settings page for email configuration and notification history.

## Implementation Approach

Use Vercel Cron Jobs (scheduled API route) running daily at 9 AM user timezone. Query database for colleges with deadlines in 7 or 1 days, filter by status (exclude SUBMITTED/ACCEPTED/DECLINED), check for duplicate notifications in database, send emails via Resend API, and log successful sends to prevent re-sending. Store email address in environment variable for MVP (database for future multi-user).

## Affected Files

### To Create
- `app/api/cron/check-deadlines/route.ts` - Cron job endpoint for deadline checking
- `app/api/cron/check-deadlines/__tests__/route.test.ts` - Cron endpoint tests
- `lib/email.ts` - Resend integration and email templates
- `lib/email.test.ts` - Email service tests
- `lib/notifications.ts` - Notification logic and deduplication
- `lib/notifications.test.ts` - Notification logic tests
- `app/(protected)/settings/page.tsx` - Settings page with notification config
- `components/notification-settings.tsx` - Notification settings UI component
- `vercel.json` - Vercel Cron configuration

### To Modify
- `prisma/schema.prisma` - Add Notification model and NotificationType enum
- `package.json` - Add `resend` dependency

### To Reference
- `lib/utils.ts` - Existing urgency calculation and date utilities
- `actions/college.ts` - Pattern for multi-user data filtering
- `lib/auth.ts` - Authentication helpers

## Subtasks

### Subtask 1: Database Schema and Migration
**Complexity**: Simple
**Estimated Tokens**: 5K

**Description**: Add Notification model to Prisma schema with unique constraint to prevent duplicate reminders. Create and apply database migration.

**Schema Changes**:
```prisma
model Notification {
  id         String   @id @default(cuid())
  collegeId  String   @map("college_id")
  college    College  @relation(fields: [collegeId], references: [id], onDelete: Cascade)
  type       NotificationType
  sentAt     DateTime @default(now()) @map("sent_at")
  email      String

  @@unique([collegeId, type])
  @@index([collegeId])
  @@map("notifications")
}

enum NotificationType {
  DEADLINE_7D
  DEADLINE_1D
}

// Add to College model:
model College {
  // ... existing fields ...
  notifications Notification[]
}
```

**Implementation Details**:
- Add Notification model with `@@unique([collegeId, type])` constraint
- Add NotificationType enum with DEADLINE_7D and DEADLINE_1D values
- Add notifications relation to College model
- Run `npx prisma db push` to apply schema changes
- Verify migration with `npx prisma studio`

**Tests**:
- Manual: Verify schema compiles without errors
- Manual: Check database has notifications table with unique constraint
- Manual: Test inserting duplicate (collegeId, type) throws error

**Acceptance**:
- [ ] Notification model added to schema.prisma
- [ ] NotificationType enum created with DEADLINE_7D and DEADLINE_1D
- [ ] Unique constraint on (collegeId, type) defined
- [ ] Index on collegeId created for performance
- [ ] Cascade delete configured (delete notifications when college deleted)
- [ ] notifications relation added to College model
- [ ] Database migration applied successfully
- [ ] No Prisma compilation errors
- [ ] `npx prisma generate` runs successfully

---

### Subtask 2: Email Service Integration
**Complexity**: Medium
**Estimated Tokens**: 10K

**Description**: Create email service module using Resend API. Implement email template for deadline reminders with college details, deadline info, checklist progress, and app link. Add error handling and logging.

**API Contract**:
```typescript
// lib/email.ts
export async function sendDeadlineReminder(params: {
  email: string;
  collegeName: string;
  deadline: Date;
  daysRemaining: number;
  checklistProgress: { completed: number; total: number };
  collegeId: string;
  userId: string;
}): Promise<{ success: boolean; error?: string }>;
```

**Implementation Details**:
- Install `resend` package: `npm install resend`
- Initialize Resend client with `RESEND_API_KEY` from env
- Create HTML email template with inline CSS (responsive design)
- Include: emoji subject line, college name, deadline date, days remaining, checklist progress bar, "View Application" CTA button, "Manage settings" footer link
- Add error handling for API failures (return error object, don't throw)
- Use `NEXT_PUBLIC_APP_URL` for generating college detail page link
- Sanitize user-provided content to prevent injection (escape HTML)

**Email Template Structure**:
- Subject: "🚨 [College Name] deadline in [X] day(s)"
- Body: Clean HTML with max-width 600px, college name (bold), deadline date, days remaining (emphasized), checklist progress fraction
- Button: Blue CTA linking to `/college/[id]`
- Footer: Gray text with settings link

**Tests**:
- Unit: Generates correct subject line for 1 day vs 7 days
- Unit: Email HTML includes college name and deadline
- Unit: Checklist progress displays correctly (e.g., "3/7 completed")
- Unit: College URL constructed correctly
- Unit: Returns success=true when Resend API succeeds
- Unit: Returns success=false with error message on API failure
- Unit: Sanitizes college names with HTML special chars
- Integration: Mock Resend API and verify email payload structure

**Acceptance**:
- [ ] resend package installed in package.json
- [ ] lib/email.ts created with sendDeadlineReminder function
- [ ] Resend client initialized with API key from env
- [ ] Email subject includes emoji and deadline urgency
- [ ] Email body is responsive HTML (max-width 600px)
- [ ] Email includes college name, deadline, days remaining
- [ ] Email shows checklist progress fraction
- [ ] "View Application" button links to correct college page
- [ ] Footer includes "Manage settings" link to /settings
- [ ] Error handling returns { success: false, error } on failure
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors

---

### Subtask 3: Notification Logic and Deduplication
**Complexity**: Medium
**Estimated Tokens**: 8K

**Description**: Create notification service module with logic to identify colleges needing reminders, check for duplicate notifications, calculate checklist progress, and handle notification logging. Implement multi-user support with proper data isolation.

**API Contract**:
```typescript
// lib/notifications.ts
export async function getCollegesNeedingReminders(
  userId: string
): Promise<Array<{
  college: College & { checklist: Checklist | null };
  daysRemaining: number;
  notificationType: 'DEADLINE_7D' | 'DEADLINE_1D';
}>>;

export async function hasNotificationBeenSent(
  collegeId: string,
  notificationType: 'DEADLINE_7D' | 'DEADLINE_1D'
): Promise<boolean>;

export async function logNotification(
  collegeId: string,
  notificationType: 'DEADLINE_7D' | 'DEADLINE_1D',
  email: string
): Promise<void>;

export function calculateChecklistProgress(
  checklist: Checklist | null
): { completed: number; total: number };
```

**Implementation Details**:
- Query colleges with `deadlineApp` in 7 or 1 day(s) from now (using date-fns)
- Use `startOfDay` and `endOfDay` for accurate date range matching
- Filter colleges by status: exclude SUBMITTED, ACCEPTED, DECLINED
- Filter by userId for multi-user support
- Check Notification table for existing (collegeId, type) record
- Calculate checklist progress: count completed boolean fields (7 total: lorTeacher, transcriptSent, testScoresSent, mainEssayComplete, finaidGreenLight, + supplemental essays fraction)
- Use Prisma `upsert` for race-condition-safe notification logging

**Tests**:
- Unit: Identifies colleges with deadline in exactly 7 days
- Unit: Identifies colleges with deadline in exactly 1 day
- Unit: Excludes colleges with status SUBMITTED
- Unit: Excludes colleges with status ACCEPTED
- Unit: Excludes colleges with status DECLINED
- Unit: Excludes colleges with null deadlineApp
- Unit: Excludes colleges with past deadlines
- Unit: Returns correct notification type (7D vs 1D)
- Unit: hasNotificationBeenSent returns true for existing notification
- Unit: hasNotificationBeenSent returns false for new notification
- Unit: calculateChecklistProgress returns correct fraction
- Unit: logNotification creates database record with correct fields
- Integration: Multi-user isolation (only returns colleges for specified userId)

**Acceptance**:
- [ ] lib/notifications.ts created with all exported functions
- [ ] getCollegesNeedingReminders filters by deadline range (7d or 1d)
- [ ] Excludes colleges with terminal statuses (SUBMITTED/ACCEPTED/DECLINED)
- [ ] Excludes colleges with null or past deadlines
- [ ] Multi-user support: filters by userId parameter
- [ ] hasNotificationBeenSent checks unique constraint correctly
- [ ] calculateChecklistProgress counts all 7 checklist items
- [ ] logNotification creates Notification record in database
- [ ] All date calculations use user timezone (default: America/New_York)
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors

---

### Subtask 4: Cron Job Endpoint
**Complexity**: Medium
**Estimated Tokens**: 12K

**Description**: Create Vercel Cron API route that checks deadlines, sends email reminders, and logs notifications. Implement authentication via Vercel Cron secret header. Handle partial failures gracefully (continue processing if individual email fails).

**API Contract**:
```typescript
// app/api/cron/check-deadlines/route.ts
GET /api/cron/check-deadlines

Headers:
  Authorization: Bearer <CRON_SECRET>

Response (200 OK):
{
  "success": true,
  "results": [
    { "userId": "user-1", "college": "MIT", "status": "sent" },
    { "userId": "user-1", "college": "Stanford", "status": "skipped (already sent)" },
    { "userId": "user-2", "college": "Harvard", "status": "failed", "error": "API error" }
  ],
  "summary": {
    "total": 3,
    "sent": 1,
    "skipped": 1,
    "failed": 1
  }
}

Response (401 Unauthorized):
{
  "error": "Unauthorized"
}

Response (500 Internal Server Error):
{
  "error": "Email not configured"
}
```

**Implementation Details**:
- Verify `Authorization` header matches `Bearer ${CRON_SECRET}` (env var)
- Return 401 if unauthorized (prevents public access to cron endpoint)
- Check `NOTIFICATION_EMAIL` env var exists, return 500 if missing
- Query all users from database (multi-user support)
- For each user, call `getCollegesNeedingReminders(userId)`
- For each college, check `hasNotificationBeenSent`, skip if true
- Send email via `sendDeadlineReminder` (with userId for future settings)
- Log notification via `logNotification` only on successful send
- Use try-catch per college (don't abort entire job on single failure)
- Return summary with counts (sent, skipped, failed) for monitoring

**Vercel Cron Configuration** (vercel.json):
```json
{
  "crons": [
    {
      "path": "/api/cron/check-deadlines",
      "schedule": "0 13 * * *"
    }
  ]
}
```
*Note: "0 13 * * *" = 1 PM UTC = 9 AM ET (Eastern Time)*

**Environment Variables** (.env.local):
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
NOTIFICATION_EMAIL=user@example.com
CRON_SECRET=<generate with: openssl rand -base64 32>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Tests**:
- Unit: Returns 401 when Authorization header missing
- Unit: Returns 401 when Authorization header incorrect
- Unit: Returns 500 when NOTIFICATION_EMAIL not configured
- Unit: Returns 200 with empty results when no reminders needed
- Unit: Sends email for college with deadline in 7 days
- Unit: Sends email for college with deadline in 1 day
- Unit: Skips college when notification already sent
- Unit: Skips college with status SUBMITTED
- Unit: Continues processing after single email failure (partial failure)
- Unit: Logs notification to database after successful send
- Unit: Does NOT log notification after failed send
- Unit: Response includes summary with counts
- Integration: Multi-user scenario (processes multiple users)
- Integration: Handles database connection errors gracefully

**Acceptance**:
- [ ] app/api/cron/check-deadlines/route.ts created
- [ ] GET handler implemented with NextRequest/NextResponse
- [ ] Verifies Authorization header with CRON_SECRET
- [ ] Returns 401 for unauthorized requests
- [ ] Returns 500 if NOTIFICATION_EMAIL missing
- [ ] Processes all users in database (multi-user support)
- [ ] Filters colleges by deadline range (7d, 1d)
- [ ] Checks for duplicate notifications before sending
- [ ] Sends emails via sendDeadlineReminder
- [ ] Logs notifications only after successful email send
- [ ] Handles partial failures (continues after error)
- [ ] Returns JSON response with results array and summary
- [ ] vercel.json created with cron schedule (9 AM ET daily)
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors

---

### Subtask 5: Settings Page and Notification History
**Complexity**: Medium
**Estimated Tokens**: 10K

**Description**: Create settings page at `/settings` with email configuration display, notification history table, and "Send test email" functionality. Show list of sent notifications with timestamps and college names.

**UI Components**:
- Email configuration section (read-only display of NOTIFICATION_EMAIL from env)
- "Send Test Email" button to verify Resend integration
- Notification history table (collegeId, type, sentAt, email)
- Empty state when no notifications sent yet
- Toast notifications for success/error feedback

**API Contract**:
```typescript
// Server action for test email
export async function sendTestEmail(): Promise<{
  success: boolean;
  error?: string;
}>;

// Server action to fetch notification history
export async function getNotificationHistory(): Promise<{
  notifications: Array<{
    id: string;
    collegeName: string;
    type: 'DEADLINE_7D' | 'DEADLINE_1D';
    sentAt: Date;
    email: string;
  }>;
}>;
```

**Implementation Details**:
- Create `/app/(protected)/settings/page.tsx` server component
- Fetch notification history via Prisma query (include college relation)
- Filter notifications by current userId (multi-user support)
- Display email address from NOTIFICATION_EMAIL env var
- Create `sendTestEmail` server action that sends sample reminder
- Create NotificationSettingsClient component for interactive UI
- Use shadcn/ui table component for history display
- Format timestamps with date-fns (e.g., "Jan 15, 2026 at 9:00 AM")
- Add "Manage notification settings" link to navigation menu

**Tests**:
- Unit: Settings page renders without errors
- Unit: Displays email address from environment
- Unit: Notification history table displays correctly
- Unit: Empty state shows when no notifications exist
- Unit: sendTestEmail action sends email successfully
- Unit: sendTestEmail action returns error on failure
- Unit: Notification history filtered by current userId
- Integration: Test email received at configured address
- Integration: Notification history shows recent reminders

**Acceptance**:
- [ ] app/(protected)/settings/page.tsx created
- [ ] Settings page displays NOTIFICATION_EMAIL from env
- [ ] "Send Test Email" button implemented and functional
- [ ] sendTestEmail server action sends sample reminder
- [ ] Notification history table shows sent reminders
- [ ] History includes: college name, notification type, timestamp, email
- [ ] Empty state displayed when no notifications exist
- [ ] Timestamps formatted in human-readable format
- [ ] Multi-user support: only shows current user's notifications
- [ ] Toast notifications for success/error feedback
- [ ] Navigation menu includes "Settings" link
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors
- [ ] Page is responsive (mobile-friendly)

---

## Overall Acceptance Criteria

- [ ] Notification model added to Prisma schema with unique constraint
- [ ] Database migration applied successfully
- [ ] Vercel Cron Job configured in vercel.json to run daily at 9 AM user timezone
- [ ] `/api/cron/check-deadlines` endpoint created with authentication check
- [ ] Endpoint queries colleges with deadlineApp in 7 days or 1 day from now
- [ ] Endpoint filters out colleges with status SUBMITTED, ACCEPTED, or DECLINED
- [ ] Endpoint checks Notification table to avoid sending duplicate reminders
- [ ] Email sent via Resend with subject "[College Name] deadline in [X] days"
- [ ] Email includes: college name, deadline date, days remaining, checklist progress, link to detail page
- [ ] Notification logged to database after successful email send
- [ ] Settings page created at `/settings` with email address display
- [ ] "Send test email" button in settings sends sample reminder
- [ ] Notification history table in settings shows sent reminders
- [ ] Email includes "Manage settings" link in footer
- [ ] Multi-user support: all queries filtered by userId
- [ ] All tests pass with 90%+ coverage
- [ ] No linter errors
- [ ] Cron job tested locally with Vercel CLI (`vercel dev`)

## Test Scenarios

### Scenario 1: Happy path - 7-day reminder
- Create college with `deadlineApp = today + 7 days`, status IN_PROGRESS
- Trigger cron job (simulate by calling endpoint with cron secret header)
- Verify email sent to configured address with subject "🚨 [College] deadline in 7 days"
- Verify notification logged in database with type DEADLINE_7D

### Scenario 2: Happy path - 1-day reminder
- Create college with `deadlineApp = today + 1 day`, status IN_PROGRESS
- Trigger cron job
- Verify email sent with subject "🚨 [College] deadline in 1 day"
- Verify notification logged with type DEADLINE_1D

### Scenario 3: Deduplication - Prevent duplicate reminders
- Create college with `deadlineApp = today + 7 days`
- Trigger cron job → email sent, notification logged
- Trigger cron job again → no email sent (duplicate detected)
- Verify only 1 notification record in database

### Scenario 4: Status filtering - Don't remind for submitted colleges
- Create college with `deadlineApp = today + 7 days`, status SUBMITTED
- Trigger cron job
- Verify no email sent (college already submitted)

### Scenario 5: Edge case - Past deadline
- Create college with `deadlineApp = yesterday`, status IN_PROGRESS
- Trigger cron job
- Verify no email sent (deadline has passed)

### Scenario 6: Edge case - Missing deadline
- Create college with `deadlineApp = null`
- Trigger cron job
- Verify no email sent, no errors thrown

### Scenario 7: Error handling - Email API failure
- Mock Resend API to throw error
- Trigger cron job
- Verify error logged, cron job completes without crashing
- Verify notification NOT logged (only log after successful send)

### Scenario 8: Authentication - Unauthorized cron call
- Call `/api/cron/check-deadlines` without Vercel cron secret header
- Verify 401 Unauthorized response

### Scenario 9: Settings - Send test email
- Navigate to `/settings`
- Click "Send test email"
- Verify test email received with sample college data

### Scenario 10: Settings - Notification history
- Send 3 reminders (via cron job)
- Navigate to `/settings`
- Verify notification history table shows 3 entries with timestamps

### Scenario 11: Multi-user - Data isolation
- Create User A with college deadline in 7 days
- Create User B with college deadline in 7 days
- Trigger cron job
- Verify both users receive separate emails
- Verify User A only sees their notifications in settings
- Verify User B only sees their notifications in settings

## Deployment Checklist

1. [ ] Add `resend` to package.json dependencies
2. [ ] Add RESEND_API_KEY to Vercel environment variables
3. [ ] Add NOTIFICATION_EMAIL to Vercel environment variables
4. [ ] Add CRON_SECRET to Vercel environment variables (generate with: openssl rand -base64 32)
5. [ ] Add NEXT_PUBLIC_APP_URL to Vercel environment variables
6. [ ] Configure domain in Resend (or use default onboarding@resend.dev for testing)
7. [ ] Apply database migration: `npx prisma db push`
8. [ ] Deploy to Vercel → cron job automatically registered
9. [ ] Test cron endpoint locally: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/check-deadlines`
10. [ ] Monitor Vercel Cron logs in dashboard to verify scheduled execution

## Technical Notes

### Timezone Handling
- Default timezone: America/New_York (Eastern Time)
- Cron schedule "0 13 * * *" = 1 PM UTC = 9 AM ET
- Adjust UTC offset if user in different timezone
- Date comparisons use `startOfDay` and `endOfDay` from date-fns

### Performance Considerations
- With 50 colleges: ~2 seconds to process (acceptable)
- With 200 colleges: ~8 seconds to process (within Vercel Hobby plan 10s limit)
- Add index on `deadlineApp` for fast deadline range queries (included in schema)

### Security
- Cron endpoint protected by Bearer token (CRON_SECRET)
- Email content sanitized to prevent HTML injection
- Multi-user data isolation enforced in all queries

### Future Enhancements (Out of Scope)
- Email preferences in database (per-user email addresses)
- SMS notifications via Twilio
- In-app notification bell icon
- Customizable reminder intervals (3 days, 2 weeks, custom)
- Email digest (daily summary instead of per-deadline)
- Unsubscribe with database flag
- React Email templates for prettier HTML
- Per-college notification preferences (disable for specific colleges)

## References
- Groomed requirement: `.claude/workflows/requirements/groomed/deadline-reminders.md`
- Vercel Cron Docs: https://vercel.com/docs/cron-jobs
- Resend Next.js Guide: https://resend.com/docs/send-with-nextjs
- Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Prisma Unique Constraints: https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#defining-composite-unique-constraints
