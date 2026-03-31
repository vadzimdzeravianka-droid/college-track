# Requirement: Deadline Reminder Notifications

## Original Request
Want to get reminded about upcoming deadlines. Maybe email or notifications or something. Should remind me a week before and maybe a day before? Not sure exactly how this should work but want to make sure I don't miss deadlines.

## Groomed Specification

Implement automated deadline reminder system that sends email notifications for upcoming college application deadlines. Send reminders at two intervals: 7 days before deadline and 1 day before deadline. System uses Vercel Cron Jobs to check deadlines daily and sends emails via a transactional email service (Resend recommended).

**Complexity**: COMPLEX
**Token Budget**: ~45K tokens

### Context
- **Affected areas**:
  - `prisma/schema.prisma` - Add `Notification` model to track sent reminders
  - `app/api/cron/check-deadlines/route.ts` - NEW: Cron job endpoint
  - `lib/email.ts` - NEW: Email service integration (Resend or SendGrid)
  - `lib/notifications.ts` - NEW: Notification logic and deduplication
  - `vercel.json` - NEW: Cron job configuration
  - `app/(protected)/settings/page.tsx` - NEW: Settings page to configure email address
  - `components/notification-settings.tsx` - NEW: UI to enable/disable reminders
  - `.env.local` - Add email service API key and user email address
- **Dependencies**:
  - `resend` (recommended) or `@sendgrid/mail` - Email service SDK
  - Vercel Cron Jobs (built-in, free tier: up to 20 cron jobs)
- **Related features**:
  - Existing urgency calculation system (`lib/utils.ts`)
  - Deadline tracking in `College` model

### Implementation Approaches

**Approach A: Vercel Cron + Resend (Recommended)**

Use Vercel Cron Jobs (scheduled API route) to check deadlines daily at 9 AM user timezone. Query database for colleges with deadlines in 7 or 1 days, send email via Resend API, log notification in database to avoid duplicates.

**Architecture**:
```
[Vercel Cron (9 AM daily)]
  → [/api/cron/check-deadlines]
    → Query DB for upcoming deadlines (7d, 1d)
    → Filter out already-sent notifications
    → Send emails via Resend
    → Log notifications to DB
```

**Database Schema**:
```prisma
model Notification {
  id         String   @id @default(cuid())
  collegeId  String
  college    College  @relation(fields: [collegeId], references: [id], onDelete: Cascade)
  type       NotificationType // DEADLINE_7D, DEADLINE_1D
  sentAt     DateTime @default(now())
  email      String

  @@unique([collegeId, type]) // Prevent duplicate notifications
}

enum NotificationType {
  DEADLINE_7D
  DEADLINE_1D
}
```

**Email Template**:
- Subject: "🚨 [College Name] deadline in [X] days"
- Body: College name, deadline date, checklist status, link to app
- Use HTML email with inline CSS (Resend supports React Email components)

**Vercel Cron Config** (`vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/check-deadlines",
    "schedule": "0 9 * * *"
  }]
}
```

**Pros**:
- Simple, serverless architecture
- Resend has generous free tier (100 emails/day, 3K/month)
- Built-in Vercel Cron (no external scheduler needed)
- Low maintenance (no servers to manage)
- ~40K tokens

**Cons**:
- Email address stored in environment variable (not user-configurable in UI initially)
- Vercel Cron limited to once per day minimum (can't do hourly checks)
- Free tier email limits (100/day may be insufficient for multi-user in future)

**Token Estimate**: ~40K tokens

**Approach B: Vercel Cron + SendGrid**

Same as Approach A but use SendGrid instead of Resend.

**Pros**:
- SendGrid has larger free tier (100 emails/day forever)
- More mature API, better deliverability tracking
- Dynamic templates support

**Cons**:
- More complex API (Resend is simpler)
- Requires more setup (domain verification, etc.)
- ~42K tokens (similar complexity)

**Token Estimate**: ~42K tokens

**Approach C: Edge Functions + Database Polling**

Use Next.js middleware or edge function to check for deadline reminders on every request, send email if threshold crossed.

**Pros**:
- No cron job needed
- More frequent checks (on every page load)

**Cons**:
- Performance overhead on every request
- Not guaranteed to run if user doesn't visit app
- Poor user experience (delays on page load)
- Over-engineered (~50K tokens)

**NOT RECOMMENDED**: Too complex for minimal benefit.

**Recommended**: Approach A (Vercel Cron + Resend). Simplest architecture, excellent DX, sufficient for single-user/family use case. Resend has better Next.js integration and cleaner API than SendGrid.

### Edge Cases & Validation

#### Data Validation
- Missing deadline: If `deadlineApp` is null, skip college in reminder logic
- Invalid email address: Validate email format before sending (Zod schema)
- Past deadlines: Don't send reminders for deadlines that have passed
- Status filtering: Don't send reminders for colleges with status SUBMITTED, ACCEPTED, DECLINED

#### Notification Deduplication
- Database constraint: `@@unique([collegeId, type])` prevents duplicate reminders
- Check before sending: Query `Notification` table to see if reminder already sent
- Race conditions: Use Prisma `upsert` with `onConflict` to handle concurrent cron runs (shouldn't happen but defensive)

#### Error Handling
- Email API failure: Log error, retry on next cron run (don't throw)
- Database failure: Log error, send alert email to developer (optional)
- Partial failures: If 5 emails to send and 3rd fails, continue sending 4th and 5th (don't abort entire job)

#### Security
- Cron endpoint authentication: Use Vercel Cron secret header verification
- Email injection: Sanitize all user-provided content in emails (college names, notes)
- Rate limiting: Vercel Cron runs once per day, so rate limiting not critical

#### Performance
- With 50 colleges: Querying deadlines takes <50ms, sending 5 emails takes ~2s (acceptable for cron job)
- With 200 colleges: ~8s total (still under Vercel serverless timeout of 10s on Hobby plan)
- Database indexes: Add index on `deadlineApp` for fast deadline range queries

#### Timezone Handling
- User timezone: Store user timezone in environment variable or settings (default: America/New_York)
- Deadline comparison: Convert deadlines to user timezone before calculating days until
- Cron schedule: Set cron to run at 9 AM in user's timezone (requires UTC conversion)

#### User Experience
- Unsubscribe: Add "Turn off reminders" link in email footer that navigates to settings page
- Email preview: In settings page, show "Send test email" button to verify setup
- Notification history: Show list of sent notifications on settings page (audit log)

### Acceptance Criteria

- [ ] `Notification` model added to Prisma schema with fields: id, collegeId, type, sentAt, email
- [ ] Database migration created and applied successfully
- [ ] Vercel Cron Job configured in `vercel.json` to run daily at 9 AM (user timezone)
- [ ] `/api/cron/check-deadlines` endpoint created with authentication check (Vercel cron secret)
- [ ] Endpoint queries colleges with `deadlineApp` in 7 days or 1 day from now
- [ ] Endpoint filters out colleges with status SUBMITTED, ACCEPTED, or DECLINED
- [ ] Endpoint checks `Notification` table to avoid sending duplicate reminders
- [ ] Email sent via Resend with subject "[College Name] deadline in [X] days"
- [ ] Email includes: college name, deadline date, days remaining, checklist progress, link to detail page
- [ ] Notification logged to database after successful email send
- [ ] Settings page created at `/settings` with email address input and "Enable reminders" toggle
- [ ] Email address stored in user settings (environment variable for MVP, database for future)
- [ ] "Send test email" button in settings sends sample reminder
- [ ] Notification history table in settings shows sent reminders
- [ ] Email includes "Unsubscribe" link in footer
- [ ] All tests pass with 90%+ coverage (cron endpoint, email logic, notification deduplication)
- [ ] No linter errors
- [ ] Cron job tested locally with Vercel CLI (`vercel dev`)

### Test Scenarios

1. **Happy path - 7-day reminder**:
   - Create college with `deadlineApp = today + 7 days`, status IN_PROGRESS
   - Trigger cron job (simulate by calling endpoint with cron secret header)
   - Verify email sent to configured address with subject "🚨 [College] deadline in 7 days"
   - Verify notification logged in database with type DEADLINE_7D

2. **Happy path - 1-day reminder**:
   - Create college with `deadlineApp = today + 1 day`, status IN_PROGRESS
   - Trigger cron job
   - Verify email sent with subject "🚨 [College] deadline in 1 day"
   - Verify notification logged with type DEADLINE_1D

3. **Deduplication - Prevent duplicate reminders**:
   - Create college with `deadlineApp = today + 7 days`
   - Trigger cron job → email sent, notification logged
   - Trigger cron job again → no email sent (duplicate detected)
   - Verify only 1 notification record in database

4. **Status filtering - Don't remind for submitted colleges**:
   - Create college with `deadlineApp = today + 7 days`, status SUBMITTED
   - Trigger cron job
   - Verify no email sent (college already submitted)

5. **Edge case - Past deadline**:
   - Create college with `deadlineApp = yesterday`, status IN_PROGRESS
   - Trigger cron job
   - Verify no email sent (deadline has passed)

6. **Edge case - Missing deadline**:
   - Create college with `deadlineApp = null`
   - Trigger cron job
   - Verify no email sent, no errors thrown

7. **Error handling - Email API failure**:
   - Mock Resend API to throw error
   - Trigger cron job
   - Verify error logged, cron job completes without crashing
   - Verify notification NOT logged (only log after successful send)

8. **Authentication - Unauthorized cron call**:
   - Call `/api/cron/check-deadlines` without Vercel cron secret header
   - Verify 401 Unauthorized response

9. **Settings - Send test email**:
   - Navigate to `/settings`
   - Enter email address "test@example.com"
   - Click "Send test email"
   - Verify test email received with sample college data

10. **Settings - Notification history**:
    - Send 3 reminders (via cron job)
    - Navigate to `/settings`
    - Verify notification history table shows 3 entries with timestamps

### Technical Implementation Notes

**Resend Integration** (`lib/email.ts`):
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDeadlineReminder(params: {
  email: string;
  collegeName: string;
  deadline: Date;
  daysRemaining: number;
  checklistProgress: { completed: number; total: number };
  collegeId: string;
}) {
  const { email, collegeName, deadline, daysRemaining, checklistProgress, collegeId } = params;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const collegeUrl = `${appUrl}/college/${collegeId}`;

  const subject = `🚨 ${collegeName} deadline in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Deadline Reminder</h2>
      <p><strong>${collegeName}</strong> application is due in <strong>${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}</strong>!</p>
      <p>Deadline: ${deadline.toLocaleDateString()}</p>
      <p>Checklist progress: ${checklistProgress.completed}/${checklistProgress.total} completed</p>
      <a href="${collegeUrl}" style="display: inline-block; background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 16px;">
        View Application
      </a>
      <hr style="margin-top: 32px; border: none; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #666;">
        <a href="${appUrl}/settings">Manage notification settings</a>
      </p>
    </div>
  `;

  await resend.emails.send({
    from: 'College Track <notifications@collegetrack.com>', // Configure domain in Resend
    to: email,
    subject,
    html,
  });
}
```

**Cron Endpoint** (`app/api/cron/check-deadlines/route.ts`):
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendDeadlineReminder } from '@/lib/email';
import { addDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = startOfDay(new Date());
  const sevenDaysOut = endOfDay(addDays(today, 7));
  const oneDayOut = endOfDay(addDays(today, 1));

  // Find colleges with deadlines in 7 days or 1 day
  const colleges = await prisma.college.findMany({
    where: {
      deadlineApp: { not: null },
      status: { notIn: ['SUBMITTED', 'ACCEPTED', 'DECLINED'] },
      OR: [
        { deadlineApp: { gte: sevenDaysOut, lte: sevenDaysOut } },
        { deadlineApp: { gte: oneDayOut, lte: oneDayOut } },
      ],
    },
    include: { checklist: true },
  });

  const emailAddress = process.env.NOTIFICATION_EMAIL;
  if (!emailAddress) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 });
  }

  const results = [];
  for (const college of colleges) {
    const daysRemaining = Math.round(
      (college.deadlineApp!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    const notificationType = daysRemaining === 7 ? 'DEADLINE_7D' : 'DEADLINE_1D';

    // Check if notification already sent
    const existing = await prisma.notification.findUnique({
      where: {
        collegeId_type: { collegeId: college.id, type: notificationType },
      },
    });

    if (existing) {
      results.push({ college: college.name, status: 'skipped (already sent)' });
      continue;
    }

    // Send email
    try {
      await sendDeadlineReminder({
        email: emailAddress,
        collegeName: college.name,
        deadline: college.deadlineApp!,
        daysRemaining,
        checklistProgress: {
          completed: /* calculate from checklist */,
          total: /* calculate from checklist */,
        },
        collegeId: college.id,
      });

      // Log notification
      await prisma.notification.create({
        data: {
          collegeId: college.id,
          type: notificationType,
          email: emailAddress,
        },
      });

      results.push({ college: college.name, status: 'sent' });
    } catch (error) {
      console.error(`Failed to send reminder for ${college.name}:`, error);
      results.push({ college: college.name, status: 'failed', error: String(error) });
    }
  }

  return NextResponse.json({ success: true, results });
}
```

**Environment Variables** (`.env.local`):
```bash
# Resend API Key (get from resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email address to send notifications to
NOTIFICATION_EMAIL=user@example.com

# Vercel Cron Secret (generate with: openssl rand -base64 32)
CRON_SECRET=your-random-secret-here

# App URL for email links
NEXT_PUBLIC_APP_URL=https://collegetrack.vercel.app
```

**Vercel Cron Configuration** (`vercel.json`):
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
*Note: "0 13 * * *" = 1 PM UTC = 9 AM ET (adjust based on user timezone)*

### Database Migration

```sql
-- Add Notification model
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "collegeId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "email" TEXT NOT NULL,
  CONSTRAINT "Notification_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "Notification_collegeId_type_key" ON "Notification"("collegeId", "type");
```

### Deployment Checklist

1. Add Resend API key to Vercel environment variables
2. Add NOTIFICATION_EMAIL to Vercel environment variables
3. Add CRON_SECRET to Vercel environment variables
4. Configure domain in Resend (or use default `onboarding@resend.dev` for testing)
5. Deploy to Vercel → cron job automatically registered
6. Test cron endpoint locally: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/check-deadlines`
7. Monitor Vercel Cron logs in dashboard

### Future Enhancements (Out of Scope)

- Multiple email addresses (for family members)
- SMS notifications via Twilio
- In-app notification bell icon
- Customizable reminder intervals (3 days, 2 weeks)
- Digest emails (daily summary instead of per-deadline)
- Email unsubscribe with database flag (currently just link to settings)
- React Email templates (prettier HTML emails)
- Notification preferences per college (disable reminders for specific colleges)

### References
- CLAUDE.md: Database commands (Prisma migrations)
- CLAUDE.md: API routes pattern (`app/api/`)
- Vercel Cron: https://vercel.com/docs/cron-jobs
- Resend Next.js Guide: https://resend.com/docs/send-with-nextjs
- Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- Prisma unique constraints: https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#defining-composite-unique-constraints
