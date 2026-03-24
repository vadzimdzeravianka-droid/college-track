# Quick Setup Guide

## Step 1: Set up Supabase (Free Tier)

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to Project Settings > Database
4. Copy the "Connection string" under "Connection pooling"
5. Replace `[YOUR-PASSWORD]` with your database password

## Step 2: Configure Environment Variables

Edit `.env.local`:
```bash
# Replace with your actual Supabase connection string (with pgBouncer pooling)
POSTGRES_PRISMA_URL="postgres://postgres.xxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

# Set your own secure passkey (anything you want)
APP_PASSKEY="mySecurePasskey123"
```

## Step 3: Initialize Database

```bash
npx prisma generate
npx prisma db push
```

This will create the `colleges` and `checklists` tables in your Supabase database.

## Step 4: Start the Application

```bash
npm run dev
```

Open http://localhost:3000 and login with your APP_PASSKEY!

## Step 5: Deploy to Vercel (Optional)

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial College Track app"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. Go to https://vercel.com
3. Click "Import Project"
4. Select your GitHub repository
5. Add Supabase integration (Storage > Connect Store > Supabase)
   - This auto-injects `POSTGRES_PRISMA_URL` and other credentials
6. Add environment variable:
   - `APP_PASSKEY` (your passkey)
7. Click Deploy!

---

## Using the Application

### Dashboard Features
- **Add College:** Click "Add College" button to create a new entry
- **View Details:** Click any college card to see full details
- **7-Day Alerts:** Cards with deadlines within 7 days show a red pulsing border
- **Filters:** Use status filters to view specific groups

### College Detail Page
- **Portal Credentials:** Click copy buttons to copy username/password
- **Checklist:** Check off items as you complete them
- **Edit:** Click "Edit" to modify college details
- **Delete:** Remove a college entry

### Color Coding
- **Status:** Gray (Not Started), Blue (In Progress), Yellow (Submitted), Orange (Waitlisted), Green (Accepted), Red (Declined)
- **Category:** Purple (Reach), Indigo (Match), Teal (Safety)
- **Strategy:** Rose (ED), Amber (EA), Slate (RD)
