# Buku Poin UFO UGM - Deployment Guide (Vercel + Supabase)

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Vercel CLI](https://vercel.com/docs/cli) (optional, for CLI deploy)
- Free accounts on:
  - [GitHub](https://github.com/)
  - [Vercel](https://vercel.com/)
  - [Supabase](https://supabase.com/)

---

## Step 1: Push Code to GitHub

```bash
cd /path/to/your/project
git init
git add .
git commit -m "Ready for Vercel deployment"
# Create a new GitHub repo, then:
git remote add origin https://github.com/YOUR_USERNAME/buku-poin-ufo.git
git push -u origin main
```

---

## Step 2: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Choose organization, name: `buku-poin-ufo`
4. Select region: **Southeast Asia (Singapore)** (closest to Indonesia)
5. Wait for project to be ready (~2 minutes)

### 2.1 Get Your Credentials

Go to **Project Settings > API** and copy:
- `URL` → `SUPABASE_URL`
- `anon public` → `SUPABASE_ANON_KEY`
- `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

Go to **Project Settings > Database > Connection string > URI** and copy:
- `DATABASE_URL` (replace `[YOUR-PASSWORD]` with your actual password)

---

## Step 3: Run Database Migrations

### 3.1 Open Supabase SQL Editor

Go to **SQL Editor > New Query** and run this SQL to create all tables:

```sql
-- Run the contents of supabase/schema.sql here
```

Or use Drizzle:

```bash
# Install dependencies first
npm install

# Set your DATABASE_URL
export DATABASE_URL="postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres"

# Push schema
npm run db:push
```

### 3.2 Seed Activity Types

Run the seed data for 24 activity types:

```bash
npx tsx db/seed.ts
```

---

## Step 4: Configure Environment Variables on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"Add New Project"**
3. Import your GitHub repo
4. In project settings, go to **Settings > Environment Variables** and add:

| Variable | Value | Where to find |
|----------|-------|---------------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase > Settings > API |
| `SUPABASE_ANON_KEY` | `eyJ...` | Supabase > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase > Settings > API |
| `DATABASE_URL` | `postgresql://...` | Supabase > Settings > Database |
| `SESSION_SECRET` | Generate random string | `openssl rand -base64 32` |
| `VITE_API_URL` | `/api` | Just use this value |

---

## Step 5: Deploy to Vercel

### Option A: Via Vercel Dashboard (Easiest)

1. Click **"Deploy"**
2. Vercel auto-detects the project
3. Wait for build (~2 minutes)
4. Your app is live at `https://buku-poin-ufo.vercel.app`

### Option B: Via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## Step 6: Configure Supabase Auth (Optional)

If you want email/password authentication instead of demo mode:

1. Go to **Supabase > Authentication > Providers**
2. Enable **Email** provider
3. Disable "Confirm email" (for easier testing, or keep enabled for production)
4. Go to **Policies** and set up Row Level Security (RLS) as needed

---

## Project Structure on Vercel

```
/
├── api/index.ts          # Serverless API (Hono + tRPC)
├── dist/public/          # Static frontend build
├── vercel.json           # Vercel routing config
└── ...
```

## How It Works

| Request | Destination | Handler |
|---------|------------|---------|
| `/` | `dist/public/index.html` | Static file |
| `/dashboard` | `dist/public/index.html` | React Router (SPA) |
| `/api/trpc/*` | `api/index.ts` | Hono + tRPC server |
| `/api/health` | `api/index.ts` | Health check |

## Troubleshooting

### Database connection fails
- Make sure `DATABASE_URL` uses the correct password
- Check that your IP is allowed in Supabase > Database > IPv4

### tRPC calls fail (404)
- Verify `vercel.json` rewrites are correct
- Check that `api/index.ts` exists and builds without errors

### CORS errors
- The API already has `cors({ origin: "*" })` enabled
- Make sure `VITE_API_URL` matches your deployed URL

## Need Help?

- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Hono Docs](https://hono.dev)
- [Drizzle ORM Docs](https://orm.drizzle.team)
