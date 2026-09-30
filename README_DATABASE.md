# 🏏 VJTI Cricket Registration - Database Setup

Complete database solution for storing player registrations, photos, and all cricket trial data.

---

## 🚀 Quick Start (5 Minutes)

### 1. Create Supabase Project
```
Go to: https://supabase.com
→ New Project
→ Name: vjti-cricket-trials
→ Choose password & region (ap-south-1 recommended)
→ Create (wait 2-3 min)
```

### 2. Run Setup Script
```
Supabase Dashboard → SQL Editor
→ Copy contents of supabase-setup.sql
→ Paste and Run (Ctrl+Enter)
→ Wait for "Setup complete!"
```

### 3. Get Credentials
```
Dashboard → Settings → API
→ Copy Project URL
→ Copy anon/public key
→ Copy service_role key (keep secret!)
```

### 4. Update .env
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 5. Test It
```powershell
npm install
npm run test:db
```

✅ All tests pass? You're ready!

---

## 📦 What Gets Created

### Tables
1. **players** - Main registration data (name, role, stats, photos)
2. **announcements** - System announcements to players
3. **settings** - Configuration (reg open/close, trial dates)

### Storage
- **player-photos** bucket for profile pictures

### Functions
- `get_registration_stats()` - Analytics
- `find_player(search_term)` - Search by ID or reg_no

### Security
- Row Level Security (RLS) enabled
- Public read, authenticated write
- Service role for API operations

---

## 🗄️ Database Schema

![VJTI Cricket Database Schema](kiro-artifact://09ab7d50-65e9-4886-87ce-82b68b95f854)

### Players Table Structure
```sql
players (
  id                 UUID PRIMARY KEY
  registration_id    TEXT UNIQUE        -- "VJTI-CRK-1234"
  public_token       TEXT UNIQUE        -- For sharing
  full_name          TEXT NOT NULL
  reg_no             TEXT UNIQUE        -- VJTI registration number
  program            TEXT               -- Degree/Diploma/M.Tech
  year               TEXT               -- First/Second/Third/Final
  branch             TEXT               -- Department
  primary_role       TEXT               -- Batter/Bowler/Wicketkeeper
  batting_style      TEXT               -- Right/Left-hand
  bowling_style      TEXT               -- Pace/Spin types
  experience         TEXT               -- Optional, max 1000 chars
  whatsapp_number    TEXT NOT NULL      -- +91XXXXXXXXXX
  photo_url          TEXT               -- Base64 or storage URL
  consent            BOOLEAN NOT NULL
  status             ENUM               -- registered/shortlisted/selected
  created_at         TIMESTAMPTZ
  updated_at         TIMESTAMPTZ
  organizer_notes    TEXT
  trial_score        NUMERIC(5,2)
  branch_normalized  TEXT               -- Auto-categorized
)
```

---

## 🔍 Common Queries

### Get all registrations
```sql
SELECT * FROM players ORDER BY created_at DESC;
```

### Count by role
```sql
SELECT primary_role, COUNT(*) 
FROM players 
GROUP BY primary_role;
```

### Today's registrations
```sql
SELECT * FROM players 
WHERE created_at::date = CURRENT_DATE;
```

### Search player
```sql
SELECT * FROM find_player('VJTI-CRK-1234');
```

### Get statistics
```sql
SELECT get_registration_stats();
```

**More queries:** See `DATABASE_REFERENCE.md`

---

## 🧪 Testing

### Automated Test Suite
```powershell
npm run test:db
```

Tests:
- ✅ Database connection
- ✅ Table schema verification
- ✅ Player registration
- ✅ Duplicate prevention
- ✅ Statistics functions
- ✅ Search functionality
- ✅ Settings management
- ✅ Cleanup

### Manual Testing
```powershell
npm run dev
# Open http://localhost:5173/register.html
# Fill form and submit
# Check Supabase Table Editor
```

---

## 📊 What Data is Stored

### Per Registration:
| Data | Example | Size |
|------|---------|------|
| Name | "Virat Kohli" | ~50 bytes |
| Reg Number | "221041XXX" | ~10 bytes |
| Cricket Profile | Role, styles, experience | ~500 bytes |
| Contact | "+919876543210" | ~15 bytes |
| Photo | Base64 JPEG | ~375 KB |
| Metadata | Timestamps, status | ~100 bytes |

**Total per registration:** ~376 KB
**1000 registrations:** ~376 MB

### Photo Storage
- **Input:** Up to 5MB (JPEG/PNG/WebP)
- **Stored:** ~375KB base64 (compressed automatically)
- **Alternative:** Use storage bucket for larger scale

---

## 🔐 Security

### Environment Variables
**⚠️ NEVER EXPOSE:**
- `SUPABASE_SERVICE_ROLE_KEY` (backend only!)
- `TURNSTILE_SECRET_KEY`
- `UPSTASH_REDIS_REST_TOKEN`

**✅ Safe for frontend:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_TURNSTILE_SITE_KEY`

### Row Level Security
- Public can **read** player data (API filters sensitive fields)
- Only service role can **insert/update**
- Only authenticated organizers can modify status

### Rate Limiting
- Optional: Upstash Redis
- 3 registrations per IP per 24h
- Prevents spam/abuse

---

## 🛠️ Maintenance

### View Database Size
```sql
SELECT 
  pg_size_pretty(pg_database_size('postgres')) AS db_size;
```

### Backup Data
```sql
COPY (SELECT * FROM players) 
TO '/tmp/backup.csv' WITH CSV HEADER;
```

### Clean Test Data
```sql
DELETE FROM players 
WHERE reg_no LIKE 'TEST%';
```

### Check Recent Activity
```sql
SELECT COUNT(*) as registrations_today
FROM players
WHERE created_at::date = CURRENT_DATE;
```

---

## 📱 Mobile Considerations

### Photo Upload
- Automatic resize and compression
- Works with camera capture
- Base64 encoding for easy storage
- Max 5MB input → ~375KB stored

### Responsive Design
- All forms mobile-friendly
- Touch-optimized controls
- Works on iOS Safari, Chrome, Firefox

---

## 🚀 Performance

### Optimizations
- ✅ Indexed columns (reg_no, status, created_at)
- ✅ Base64 photo storage (no extra HTTP requests)
- ✅ Efficient queries with LIMIT
- ✅ Prepared statements in API

### Benchmarks
- Registration: < 3 seconds
- Search: < 500ms
- Dashboard load: < 2 seconds
- Statistics: < 1 second

### Scaling
- **< 1000 players**: Current setup works great
- **1000-5000**: Consider storage bucket for photos
- **5000+**: Add read replicas, CDN for assets

---

## 🐛 Troubleshooting

### Registration fails with "Registration failed"
1. Check browser console (F12)
2. Verify .env has correct credentials
3. Check Supabase logs (Dashboard → Logs)
4. Ensure SQL script ran successfully

### "This registration number is already registered"
- Duplicate reg_no detected (working as intended)
- Use different registration number
- Or find existing registration: `/find-id.html`

### Photos not uploading
- Check size (< 5MB)
- Check format (JPEG, PNG, WebP only)
- Check browser console for errors
- Try smaller/different photo

### Dashboard shows no data
- Register at least one player first
- Check you're logged in as organizer
- Verify Supabase RLS policies are set

### Database tests fail
1. Check Supabase project is active (not paused)
2. Verify .env credentials are correct
3. Ensure SQL setup script completed
4. Check network/firewall settings

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `SUPABASE_SETUP_GUIDE.md` | Step-by-step setup instructions |
| `DATABASE_REFERENCE.md` | SQL queries, schema details |
| `SETUP_CHECKLIST.md` | Interactive testing checklist |
| `supabase-setup.sql` | Database creation script |
| `test-database.mjs` | Automated test suite |
| `quick-start.ps1` | PowerShell helper script |

---

## 🎯 Success Criteria

Your database is ready when:
- ✅ All 8 automated tests pass
- ✅ Can register new players via form
- ✅ Data appears in Supabase Table Editor
- ✅ Duplicate reg_no is rejected
- ✅ Player cards generate with photos
- ✅ Organizer dashboard shows data
- ✅ Statistics calculate correctly
- ✅ No console errors

---

## 🔄 Workflow

```
User fills form
     ↓
Client validation
     ↓
POST /api/register
     ↓
Server validation
     ↓
Turnstile check
     ↓
Rate limit check
     ↓
Insert to players table ← HERE IS THE DATABASE
     ↓
Generate registration_id & token
     ↓
Return success + player data
     ↓
Display player card
```

---

## 🌟 Features

### For Players
- ✅ Instant registration (<3 sec)
- ✅ Unique Registration ID
- ✅ Downloadable player card
- ✅ Photo on card
- ✅ Find registration later

### For Organizers
- ✅ View all registrations
- ✅ Filter by role, status, branch
- ✅ Search by name/ID
- ✅ Update player status
- ✅ Real-time statistics
- ✅ Export data

### For Developers
- ✅ Complete SQL schema
- ✅ Automated tests
- ✅ Type-safe queries
- ✅ Row Level Security
- ✅ Comprehensive docs

---

## 💡 Tips

1. **First time setup?** → Read `SUPABASE_SETUP_GUIDE.md`
2. **Testing?** → Use `SETUP_CHECKLIST.md`
3. **Need SQL help?** → See `DATABASE_REFERENCE.md`
4. **Quick check?** → Run `.\quick-start.ps1 -Test`

---

## 📞 Support

**Check logs:**
- Supabase: Dashboard → Logs → Database
- Browser: F12 → Console + Network tabs
- Server: Terminal running `npm run dev`

**Run diagnostics:**
```powershell
.\quick-start.ps1 -Test
```

**Common fixes:**
1. Restart dev server: `Ctrl+C`, then `npm run dev`
2. Clear browser cache: `Ctrl+Shift+Delete`
3. Re-run SQL script if tables missing
4. Verify .env file has no typos

---

## ✨ Ready to Launch?

```powershell
# 1. Verify everything works
npm run test:db

# 2. Start dev server
npm run dev

# 3. Test registration
# Open: http://localhost:5173/register.html

# 4. Check dashboard
# Open: http://localhost:5173/organizer/
```

**Your database is now ready for brutal testing! 🏏🔥**

---

## 📖 Next Steps

1. ✅ Database setup (you are here)
2. 🧪 Test registration thoroughly
3. 👥 Create organizer accounts
4. 📊 Test dashboard features
5. 🚀 Deploy to production (optional)

**Need help?** All guides are in this folder!
