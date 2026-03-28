# College Track

A web application to track college applications, manage portal credentials, and never miss a deadline.

## Setup

### 1. Set up Supabase (Free Tier)

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to Project Settings > Database
4. Copy the "Connection string" under "Connection pooling"
5. Replace `[YOUR-PASSWORD]` with your database password

### 2. Configure Environment Variables

Create `.env.local`:
```bash
# Supabase connection string (with pgBouncer pooling)
POSTGRES_PRISMA_URL="postgres://postgres.xxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

# Set your own secure passkey
APP_PASSKEY="mySecurePasskey123"
```

### 3. Install Dependencies & Initialize Database

```bash
npm install
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 and login with your APP_PASSKEY!

## Features

- 📚 Track multiple college applications
- 🚨 7-day deadline alerts (red border on urgent items)
- 🔐 Secure portal credentials storage
- ✅ Application checklist for each college
- 📱 Mobile-friendly responsive design
- 🎯 Status tracking (Not Started → In Progress → Submitted → Accepted/Declined)

## Deployment to Vercel

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial College Track app"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repository
   - Add Supabase integration (Storage > Connect Store > Supabase)
     - This auto-injects `POSTGRES_PRISMA_URL`
   - Add environment variable: `APP_PASSKEY` (your passkey)
   - Click Deploy!

## Using the Application

### Dashboard Features
- **Add College:** Click "Add College" button to create a new entry
- **View Details:** Click any college card to see full details
- **Urgency Alerts:** Cards show color-coded urgency based on deadline proximity
- **Filters:** Use status filters to view specific groups

### College Detail Page
- **Portal Credentials:** Click copy buttons to copy username/password
- **Checklist:** Check off items as you complete them
- **Edit:** Click "Edit" to modify college details
- **Delete:** Remove a college entry

## Status Colors

- **Not Started:** Gray
- **In Progress:** Blue
- **Submitted:** Yellow
- **Waitlisted:** Orange
- **Accepted:** Green
- **Declined:** Red

## Category Types

- **Reach:** Purple
- **Match:** Indigo
- **Safety:** Teal

## Application Strategies

- **ED (Early Decision):** Rose - Binding commitment
- **EA (Early Action):** Amber - Non-binding early application
- **RD (Regular Decision):** Slate - Standard deadline
