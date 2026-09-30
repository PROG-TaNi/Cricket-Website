# 🏏 Setup & Testing Checklist

Follow this checklist to set up and test your VJTI Cricket registration system.

---

## ✅ Phase 1: Supabase Setup (15 minutes)

### Step 1: Create Supabase Project
- [ ] Go to [supabase.com](https://supabase.com)
- [ ] Sign in or create account
- [ ] Click "New Project"
- [ ] Name: `vjti-cricket-trials`
- [ ] Choose password (save it securely!)
- [ ] Region: Select `ap-south-1` (Mumbai) or closest to India
- [ ] Click "Create new project"
- [ ] Wait 2-3 minutes for provisioning

### Step 2: Run Database Setup Script
- [ ] Open Supabase Dashboard
- [ ] Navigate to **SQL Editor** (left sidebar)
- [ ] Click "New Query"
- [ ] Open `supabase-setup.sql` from your project
- [ ] Copy entire contents
- [ ] Paste into SQL Editor
- [ ] Click "Run" or press `Ctrl+Enter`
- [ ] Verify success: Should see "Setup complete!"
- [ ] Check **Table Editor** → verify `players`, `announcements`, `settings` tables exist

### Step 3: Get Credentials
- [ ] Go to **Settings** → **API**
- [ ] Copy **Project URL**
- [ ] Copy **anon/public key**
- [ ] Copy **service_role key** (⚠️ KEEP SECRET!)
- [ ] Save all three securely

### Step 4: Update .env File
- [ ] Open `.env` in project root
- [ ] Replace `VITE_SUPABASE_URL` with your Project URL
- [ ] Replace `VITE_SUPABASE_ANON_KEY` with your anon key
- [ ] Replace `SUPABASE_SERVICE_ROLE_KEY` with your service role key
- [ ] Save the file

Example:
```env
VITE_SUPABASE_URL=https://abcdefghijklmno.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ✅ Phase 2: Local Testing (10 minutes)

### Step 5: Install Dependencies
```powershell
# Open PowerShell in project directory
npm install
```
- [ ] Run the command
- [ ] Verify no errors

### Step 6: Run Database Test
```powershell
npm run test:db
```
- [ ] All tests should pass (8/8)
- [ ] If any fail, check error messages
- [ ] Common issues:
  - Wrong credentials in .env
  - SQL script not run
  - Network/firewall blocking Supabase

### Step 7: Start Development Server
```powershell
npm run dev
```
- [ ] Server starts successfully
- [ ] Open browser to `http://localhost:5173`
- [ ] Homepage loads correctly

---

## ✅ Phase 3: Registration Testing (15 minutes)

### Step 8: Test User Registration
- [ ] Navigate to `http://localhost:5173/register.html`
- [ ] Fill out Step 1 (Identity):
  - [ ] Upload a photo (clear headshot)
  - [ ] Full Name: `Test Player`
  - [ ] Registration Number: `TEST001`
  - [ ] Program: `Degree`
  - [ ] Year: `Third Year`
  - [ ] Branch: `Computer Engineering`
- [ ] Click "NEXT: YOUR GAME →"

- [ ] Fill out Step 2 (Cricket Profile):
  - [ ] Primary Role: `Batter`
  - [ ] Batting Style: `Right-hand`
  - [ ] Bowling Style: `Right-arm medium`
  - [ ] Past Experience: `This is a test registration`
- [ ] Click "NEXT: CONTACT →"

- [ ] Fill out Step 3 (Contact):
  - [ ] WhatsApp: `9876543210`
  - [ ] Check consent checkbox
- [ ] Click "REVIEW →"

- [ ] Step 4 (Review & Submit):
  - [ ] Verify all details are correct
  - [ ] Complete Turnstile (will auto-complete for test key)
  - [ ] Click "SUBMIT REGISTRATION"

### Step 9: Verify Registration Success
- [ ] Success screen appears
- [ ] Registration ID displayed (e.g., `VJTI-CRK-1234`)
- [ ] Player card generated with photo
- [ ] Can download player card
- [ ] **IMPORTANT: Copy the Registration ID** (you'll need it)

### Step 10: Verify in Database
- [ ] Go to Supabase Dashboard
- [ ] Open **Table Editor** → **players**
- [ ] Find your test registration
- [ ] Verify all fields are populated correctly
- [ ] Photo should be stored as base64 string

### Step 11: Test Duplicate Prevention
- [ ] Go back to registration form
- [ ] Fill with same data (especially same `reg_no`)
- [ ] Try to submit
- [ ] Should show error: "This registration number is already registered"
- [ ] ✅ Duplicate prevention works!

---

## ✅ Phase 4: Organizer Dashboard (10 minutes)

### Step 12: Create Organizer Account
- [ ] Go to Supabase Dashboard
- [ ] Navigate to **Authentication** → **Users**
- [ ] Click "Add User" → "Create new user"
- [ ] Email: `organizer@vjti.cricket`
- [ ] Password: Choose strong password (save it!)
- [ ] Click "Create user"

### Step 13: Test Organizer Login
- [ ] Navigate to `http://localhost:5173/organizer/login.html`
- [ ] Enter organizer credentials
- [ ] Click "Sign In"
- [ ] Should redirect to dashboard

### Step 14: Test Dashboard Features
- [ ] Navigate to "Players" section
- [ ] Verify test registration appears
- [ ] Try filtering by role, status
- [ ] Try search by name or reg_no
- [ ] Click on a player to view details
- [ ] Try updating status (e.g., to "shortlisted")
- [ ] Navigate to "Analytics"
- [ ] Verify statistics display correctly

---

## ✅ Phase 5: Additional Testing (10 minutes)

### Step 15: Test Find ID Feature
- [ ] Navigate to `http://localhost:5173/find-id.html`
- [ ] Enter the Registration ID from Step 9
- [ ] Click "Find My Registration"
- [ ] Verify player details display
- [ ] Try with `reg_no` instead
- [ ] Should also work

### Step 16: Test Multiple Registrations
- [ ] Register 2-3 more test users with different:
  - Programs (Degree, Diploma, M.Tech)
  - Roles (Batter, Bowler, Wicketkeeper)
  - Branches (different departments)
- [ ] Verify each gets unique Registration ID
- [ ] Check dashboard statistics update

### Step 17: Test Photo Upload
- [ ] Register with small photo (< 1MB)
- [ ] Register with larger photo (2-4MB)
- [ ] Register with maximum photo (5MB)
- [ ] Verify all work correctly
- [ ] Check photo displays in player card

---

## ✅ Phase 6: Edge Cases & Error Handling (5 minutes)

### Step 18: Test Form Validation
- [ ] Try submitting with empty name → Should show error
- [ ] Try invalid reg_no (too short) → Error
- [ ] Try invalid WhatsApp (wrong format) → Error
- [ ] Try without consent → Error
- [ ] Try without photo → Error
- [ ] All validations should work

### Step 19: Test Network Scenarios
- [ ] Submit with slow internet (if possible)
- [ ] Check loading spinner appears
- [ ] Verify submission completes eventually

### Step 20: Browser Compatibility
- [ ] Test in Chrome ✅
- [ ] Test in Firefox ✅
- [ ] Test in Edge ✅
- [ ] Test on mobile browser (if available)

---

## ✅ Phase 7: Production Readiness (optional)

### Step 21: Security Checklist
- [ ] `.env` file in `.gitignore` ✅
- [ ] Service role key not exposed in frontend ✅
- [ ] CORS properly configured
- [ ] RLS policies enabled on all tables ✅
- [ ] Rate limiting configured (or noted for later)

### Step 22: Performance Check
- [ ] Registration completes in < 3 seconds
- [ ] Dashboard loads in < 2 seconds
- [ ] No console errors in browser
- [ ] Images load properly

### Step 23: Deployment Prep (if deploying)
- [ ] Update `VITE_SITE_URL` in .env
- [ ] Get real Turnstile keys from Cloudflare
- [ ] Set up Upstash Redis (optional, for rate limiting)
- [ ] Configure environment variables in hosting platform
- [ ] Test on production domain

---

## 🎉 Final Verification

### Everything Works If:
- ✅ New registrations save to database
- ✅ Unique Registration IDs generated
- ✅ Duplicate reg_no rejected
- ✅ Player cards generate with photos
- ✅ Organizer can view all registrations
- ✅ Dashboard statistics display correctly
- ✅ Find ID feature works
- ✅ No console errors
- ✅ All 8 database tests pass

---

## 🐛 Troubleshooting

### Issue: Database test fails
**Solution:**
1. Check `.env` has correct Supabase credentials
2. Verify SQL setup script ran successfully
3. Check Supabase project is active (not paused)

### Issue: Registration fails
**Solution:**
1. Open browser console (F12)
2. Check Network tab for API errors
3. Verify Supabase credentials in `.env`
4. Check Supabase logs: Dashboard → Logs

### Issue: Photo not showing
**Solution:**
1. Check photo size (max 5MB)
2. Verify format (JPEG, PNG, WebP only)
3. Check browser console for errors

### Issue: Dashboard shows no data
**Solution:**
1. Verify at least one registration exists
2. Check organizer is logged in
3. Check browser console for auth errors

### Issue: Can't login to organizer dashboard
**Solution:**
1. Verify user created in Supabase Auth
2. Check email/password are correct
3. Check browser console for errors

---

## 📞 Getting Help

If you're stuck:

1. **Check the guides:**
   - `SUPABASE_SETUP_GUIDE.md` - Detailed setup
   - `DATABASE_REFERENCE.md` - SQL queries & schema
   - `DEVELOPER_CREDIT.md` - System architecture

2. **Run diagnostics:**
   ```powershell
   npm run test:db
   ```

3. **Check Supabase:**
   - Dashboard → Logs → Database
   - Dashboard → Table Editor → players

4. **Browser console:**
   - Press F12
   - Check Console and Network tabs

---

## ✨ Success Metrics

Your system is ready when:
- ⚡ Registration completes in < 3 seconds
- 📊 100% of registrations save to database
- 🔒 Duplicate prevention works 100%
- 🎨 Player cards generate correctly
- 📱 Works on mobile browsers
- 🚀 No console errors

---

**Ready to test brutally? Let's go! 🏏**
