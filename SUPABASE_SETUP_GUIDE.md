# Supabase Database Setup Guide for VJTI Cricket Registration

This guide will help you set up the complete Supabase database for your cricket registration system.

## 📋 Prerequisites

- A Supabase account (free tier works fine)
- Basic understanding of SQL (the script handles everything)

---

## 🚀 Step-by-Step Setup

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click **"New Project"**
4. Fill in:
   - **Project Name**: `vjti-cricket-trials` (or any name you prefer)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to India (e.g., `ap-south-1` Mumbai)
5. Click **"Create new project"**
6. Wait 2-3 minutes for provisioning

### Step 2: Run the Database Setup Script

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the file `supabase-setup.sql` in this project
4. Copy the **entire contents** of that file
5. Paste it into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. Wait for completion (should take 5-10 seconds)
8. You should see: "Setup complete! Tables created:"

### Step 3: Get Your Supabase Credentials

1. In Supabase dashboard, go to **Settings** > **API**
2. You'll see:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **Project API keys**:
     - `anon` / `public` key (safe to use in frontend)
     - `service_role` key (⚠️ SECRET - never expose to frontend)

### Step 4: Update Your .env File

1. Open `.env` in your project root
2. Replace the mock values with your real credentials:

```env
# Supabase (Public Client)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Supabase (Serverless Functions only - NEVER expose in client bundle)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Cloudflare Turnstile (for development, use test key)
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# Upstash Redis (Optional - for rate limiting)
# Leave empty for development
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Site URL
VITE_SITE_URL=http://localhost:5173
```

### Step 5: Install Dependencies & Run

```powershell
# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

---

## 🗄️ Database Schema Overview

### Tables Created

#### 1. **players** (Main registration table)
Stores all player registration data:
- Identity: name, reg_no, program, year, branch
- Cricket profile: role, batting style, bowling style, experience
- Contact: WhatsApp number
- Photo: base64 data URL or storage URL
- Status: registered, shortlisted, selected, rejected, withdrawn
- Metadata: timestamps, organizer notes, trial scores

#### 2. **announcements**
For organizer dashboard announcements to players

#### 3. **settings**
System settings like registration open/close status

### Storage Buckets

- **player-photos**: For storing player profile photos (if not using base64)

### Security

- Row Level Security (RLS) enabled on all tables
- Public can read player cards (filtered by API)
- Only authenticated organizers can modify data
- Service role bypasses RLS for API operations

---

## 🧪 Testing the Setup

### Test 1: Check Database Tables

1. Go to Supabase Dashboard → **Table Editor**
2. You should see tables: `players`, `announcements`, `settings`
3. Click on `players` table - it should be empty initially

### Test 2: Test Registration Form

1. Make sure dev server is running: `npm run dev`
2. Open: http://localhost:5173/register.html
3. Fill out the registration form with test data
4. Submit the form
5. You should receive a Registration ID
6. Check Supabase Table Editor → `players` table
7. Your test registration should appear there!

### Test 3: Verify Data Structure

Run this query in SQL Editor to see your test data:

```sql
SELECT 
    registration_id,
    full_name,
    reg_no,
    primary_role,
    status,
    created_at
FROM players
ORDER BY created_at DESC
LIMIT 10;
```

### Test 4: Get Statistics

```sql
SELECT get_registration_stats();
```

---

## 🔍 What Data is Stored?

When someone registers, the following data is saved:

### Required Fields:
- **Full Name** (e.g., "Virat Kohli")
- **Registration Number** (e.g., "221041XXX")
- **Program** (Degree/Diploma/M.Tech)
- **Year** (First Year, Second Year, etc.)
- **Branch** (e.g., "Computer Engineering")
- **Primary Role** (Batter/Bowler/Wicketkeeper)
- **Batting Style** (Right-hand/Left-hand)
- **Bowling Style** (e.g., "Right-arm pace")
- **WhatsApp Number** (e.g., "+919876543210")
- **Player Photo** (base64 encoded image, max ~375KB)

### Optional Fields:
- **Past Experience** (text description, max 1000 chars)

### Auto-Generated:
- **Registration ID** (e.g., "VJTI-CRK-1234")
- **Public Token** (for sharing player cards)
- **Status** (defaults to "registered")
- **Timestamps** (created_at, updated_at)

---

## 🛠️ Organizer Dashboard Access

### Create an Organizer Account

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **"Add User"** → **"Create new user"**
3. Enter:
   - **Email**: your-organizer-email@example.com
   - **Password**: Choose a strong password
4. Click **"Create user"**

### Access Dashboard

1. Open: http://localhost:5173/organizer/login.html
2. Log in with the credentials you created
3. You can now:
   - View all registrations
   - Filter and search players
   - Update player status
   - View statistics
   - Make announcements

---

## 📊 Sample Queries

### Get all registrations from today
```sql
SELECT * FROM players 
WHERE created_at::date = CURRENT_DATE
ORDER BY created_at DESC;
```

### Count by role
```sql
SELECT primary_role, COUNT(*) 
FROM players 
GROUP BY primary_role;
```

### Count by branch
```sql
SELECT branch_normalized, COUNT(*) 
FROM players 
GROUP BY branch_normalized 
ORDER BY COUNT(*) DESC;
```

### Find a specific player
```sql
SELECT * FROM find_player('VJTI-CRK-1234');
-- or
SELECT * FROM find_player('221041XXX');
```

---

## 🚨 Security Notes

### ⚠️ IMPORTANT: Keep These Secret!

**NEVER commit or share publicly:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `TURNSTILE_SECRET_KEY`
- `UPSTASH_REDIS_REST_TOKEN`

**Safe to share (client-side):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_TURNSTILE_SITE_KEY`

### Production Deployment

For production (Vercel/Netlify):
1. Add all environment variables to your deployment platform
2. Use real Turnstile keys (not test keys)
3. Set up Upstash Redis for rate limiting
4. Enable Supabase RLS policies
5. Set proper CORS origins

---

## 🐛 Troubleshooting

### "Registration failed. Please try again."

**Cause**: Database connection issue

**Fix**:
1. Check `.env` file has correct Supabase URL and keys
2. Verify Supabase project is running (green status)
3. Check browser console for detailed error

### "This registration number is already registered"

**Cause**: Duplicate reg_no

**Fix**: 
- Each registration number can only be used once
- Use a different reg_no or find the existing registration

### Photos not uploading

**Cause**: Photo too large or wrong format

**Fix**:
- Max size: 5MB
- Accepted formats: JPEG, PNG, WebP
- Photos are stored as base64 in database

### Can't access organizer dashboard

**Cause**: No authenticated user

**Fix**:
1. Create user in Supabase Authentication
2. Use those credentials to log in
3. Check browser console for auth errors

---

## 📞 Need Help?

1. Check Supabase logs: Dashboard → **Logs** → **Database**
2. Browser console (F12) shows frontend errors
3. Check `.env` file is properly configured
4. Verify SQL script ran without errors

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Supabase project created
- [ ] SQL setup script executed successfully
- [ ] `.env` file updated with real credentials
- [ ] Dev server running (`npm run dev`)
- [ ] Test registration completes successfully
- [ ] Data appears in Supabase Table Editor
- [ ] Organizer account created
- [ ] Organizer dashboard accessible
- [ ] Player card generation works
- [ ] Photo upload works
- [ ] All secret keys kept secure

---

**Your database is now ready! 🎉**

Test it thoroughly with `npm run test` or manually register through the website.
