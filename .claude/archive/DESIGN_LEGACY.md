# Design Document: "College Track" Application

## 1. Project Goal
Create a lightweight, secure web application to manage and track college application lifecycles for one child applying to multiple colleges. It must replace the "nightmare" of paper/spreadsheets with a structured, mobile-friendly dashboard that highlights urgent deadlines.

## 2. Technical Stack (The "Free Forever" Tier)
* **Frontend:** Next.js 15+ (App Router), Tailwind CSS 4, shadcn/ui
* **Deployment:** Vercel (Hobby Tier)
* **Database:** Supabase (Free Tier - PostgreSQL)
    * *Note: Includes 500MB storage, which is plenty for ~100 college entries*
* **Security:** Simple Shared Passkey (Middleware-based)

## 3. Database Schema (Supabase/Prisma)

### **Table: `colleges`**
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | String | College Name |
| `category` | Enum | Reach, Match, Safety |
| `status` | Enum | Not Started, In Progress, Submitted, Waitlisted, Accepted, Declined |
| `strategy` | Enum | ED (Early Decision), EA (Early Action), RD (Regular Decision) |
| `deadline_app` | Date | Main application deadline |
| `deadline_finaid`| Date | Financial aid deadline |
| `location` | String | City, State |
| `major` | String | Primary Major of interest |
| `portal_url` | String | Link to the specific login page |
| `portal_user` | String | Username/Email used for this specific portal |
| `portal_password` | String (Optional) | Password (plain text - private use only) |
| `notes` | Text | General thoughts, research notes |
| `created_at` | Timestamp | Created timestamp |
| `updated_at` | Timestamp | Last updated timestamp |

### **Table: `checklists` (1-to-1 with College)**
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `college_id` | UUID | Foreign Key to colleges |
| `lor_teacher` | Boolean | Letter of Rec submitted |
| `transcript_sent` | Boolean | Transcript sent |
| `test_scores_sent` | Boolean | Test scores sent |
| `essay_count` | Integer | Supplemental essays required |
| `finaid_green_light` | Boolean | All financial aid docs processed |

## 4. UI Architecture: "The Card-Detail Flow"
To avoid the "flat spreadsheet" problem:

### **Dashboard (List View):**
* Compact Card Grid showing:
  * College Name
  * Status badge
  * Next Deadline
  * 7-day Alert indicator
* **7-Day Alert Logic:** If `deadline_app` is within 7 days and `status` is not "Submitted," the card border glows **Red**
* Filters: By Status, Category, Strategy

### **College Detail Page (Full View):**
* Clicking a card opens a full-page "Profile" for that college
* Sections:
  1. **Basic Info:** Name, Location, Category, Major
  2. **Application Strategy:** Strategy (ED/EA/RD), Deadlines, Status
  3. **Portal Access:** URL, Username, Password (optional)
  4. **Checklist:** LOR, Transcript, Test Scores, Essays, Financial Aid
  5. **Notes:** Free-form text area

## 5. Security: "Shared Passkey" Strategy
1. Store `APP_PASSKEY` in Vercel Environment Variables
2. Implement `middleware.ts` file that checks for a specific Cookie (`is_authorized=true`)
3. If no cookie exists, redirect to `/login` page with single input field for passkey
4. On successful login, set cookie with 30-day expiration

## 6. Key Features
* **Mobile-Friendly:** Responsive design for on-the-go updates
* **Quick Add:** Fast college entry form
* **Status Updates:** One-click status changes
* **Deadline Alerts:** Visual indicators for approaching deadlines
* **Search/Filter:** Find colleges quickly
* **Export:** Export data to CSV if needed

## 7. Clarifications (Answered)
1. **Multiple Applications per College:** No - one entry per college (can duplicate with different name if needed)
2. **Password Storage:** Username and optional password stored as plain text (private use, low security risk)
3. **Research Data:** Not needed - keep it simple
4. **Family Tracking:** Global status only, no tracking of who updated

## 8. Implementation Priority
1. **Phase 1:** Database setup, auth middleware, basic CRUD
2. **Phase 2:** Dashboard with card view, 7-day alerts
3. **Phase 3:** Detail page with full checklist
4. **Phase 4:** Filters, search, polish

## 9. Success Metrics
* Replace paper tracking completely
* Quick access to portal credentials
* Never miss a deadline (7-day alerts)
* Mobile access from anywhere
