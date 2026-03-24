# College Track

A web application to track college applications, manage portal credentials, and never miss a deadline.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase POSTGRES_PRISMA_URL
   - Set your APP_PASSKEY

3. **Setup database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Open http://localhost:3000
   - Login with your passkey
   - Start tracking colleges!

## Features

- 📚 Track multiple college applications
- 🚨 7-day deadline alerts (red border on urgent items)
- 🔐 Secure portal credentials storage
- ✅ Application checklist for each college
- 📱 Mobile-friendly responsive design
- 🎯 Status tracking (Not Started → In Progress → Submitted → Accepted/Declined)

## Deployment to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Connect Supabase integration (auto-injects POSTGRES_PRISMA_URL)
4. Add APP_PASSKEY environment variable
5. Deploy!

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
