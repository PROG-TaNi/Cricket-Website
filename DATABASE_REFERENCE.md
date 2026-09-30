# Database Reference - Quick Guide

## 📊 Database Tables

### 1. `players` Table
Main registration table storing all player data.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `id` | UUID | Primary key | `550e8400-e29b-41d4-a716-446655440000` |
| `registration_id` | TEXT | Human-readable ID | `VJTI-CRK-1234` |
| `public_token` | TEXT | For sharing player cards | `tok-abc123def` |
| `full_name` | TEXT | Player's full name | `Virat Kohli` |
| `reg_no` | TEXT | VJTI registration number | `221041XXX` |
| `program` | TEXT | Degree/Diploma/M.Tech | `Degree` |
| `year` | TEXT | Academic year | `Third Year` |
| `branch` | TEXT | Department/Branch | `Computer Engineering` |
| `primary_role` | TEXT | Batter/Bowler/Wicketkeeper | `Batter` |
| `batting_style` | TEXT | Right-hand/Left-hand | `Right-hand` |
| `bowling_style` | TEXT | Bowling type | `Right-arm medium` |
| `experience` | TEXT | Past cricket experience | `Played for XYZ club...` |
| `whatsapp_number` | TEXT | Contact number | `+919876543210` |
| `photo_url` | TEXT | Base64 or storage URL | `data:image/jpeg;base64,...` |
| `consent` | BOOLEAN | Terms acceptance | `true` |
| `status` | ENUM | Registration status | `registered` |
| `created_at` | TIMESTAMP | Registration date/time | `2026-10-01 10:30:00` |
| `updated_at` | TIMESTAMP | Last update | `2026-10-01 10:30:00` |
| `organizer_notes` | TEXT | Admin notes | `Good all-rounder` |
| `trial_score` | NUMERIC | Trial performance | `85.50` |
| `branch_normalized` | TEXT | Auto-categorized branch | `Computer/IT` |

**Indexes:**
- `reg_no` (unique)
- `registration_id` (unique)
- `public_token` (unique)
- `status`
- `created_at`

---

### 2. `announcements` Table
System announcements from organizers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | TEXT | Announcement title |
| `message` | TEXT | Full message content |
| `priority` | TEXT | low/medium/high/urgent |
| `published` | BOOLEAN | Visibility status |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last modified |
| `created_by` | UUID | Author (user ID) |

---

### 3. `settings` Table
System configuration settings.

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `key` | TEXT | Setting name (PK) | `registration_open` |
| `value` | JSONB | Setting value | `true` |
| `updated_at` | TIMESTAMP | Last change | `2026-10-01 09:00:00` |

**Default Settings:**
```json
{
  "registration_open": true,
  "trial_dates": {"start": "2026-10-10", "end": "2026-10-11"},
  "whatsapp_group_url": "",
  "organizer_email": ""
}
```

---

## 🎯 Status Values

Player status can be:
- `registered` - Initial state after registration
- `shortlisted` - Selected for trials
- `selected` - Made it to the team
- `rejected` - Not selected
- `withdrawn` - Player withdrew application

---

## 🔍 SQL Query Examples

### Get all registrations from today
```sql
SELECT 
  registration_id,
  full_name,
  primary_role,
  created_at
FROM players
WHERE created_at::date = CURRENT_DATE
ORDER BY created_at DESC;
```

### Count registrations by role
```sql
SELECT 
  primary_role,
  COUNT(*) as count
FROM players
GROUP BY primary_role
ORDER BY count DESC;
```

### Count by branch (normalized)
```sql
SELECT 
  branch_normalized,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM players
GROUP BY branch_normalized
ORDER BY total DESC;
```

### Find players by experience keyword
```sql
SELECT 
  registration_id,
  full_name,
  experience
FROM players
WHERE experience ILIKE '%leather-ball%'
ORDER BY created_at DESC;
```

### Get all left-handed batters
```sql
SELECT 
  registration_id,
  full_name,
  batting_style,
  bowling_style
FROM players
WHERE batting_style = 'Left-hand'
ORDER BY full_name;
```

### Players registered in last 24 hours
```sql
SELECT 
  COUNT(*) as total,
  json_agg(
    json_build_object(
      'id', registration_id,
      'name', full_name,
      'time', created_at
    )
  ) as recent_registrations
FROM players
WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Export for selectors (CSV format)
```sql
COPY (
  SELECT 
    registration_id,
    full_name,
    reg_no,
    program,
    year,
    branch,
    primary_role,
    batting_style,
    bowling_style,
    experience,
    whatsapp_number,
    status
  FROM players
  ORDER BY created_at
) TO '/tmp/registrations.csv' WITH CSV HEADER;
```

### Update player status
```sql
UPDATE players
SET status = 'shortlisted'
WHERE registration_id = 'VJTI-CRK-1234';
```

### Add organizer notes
```sql
UPDATE players
SET organizer_notes = 'Strong bowling, good fitness'
WHERE registration_id = 'VJTI-CRK-1234';
```

---

## 🔧 Database Functions

### `get_registration_stats()`
Returns comprehensive statistics.

```sql
SELECT get_registration_stats();
```

Returns:
```json
{
  "total": 150,
  "recent_24h": 25,
  "by_status": [...],
  "by_role": [...],
  "by_program": [...],
  "by_branch": [...]
}
```

### `find_player(search_term)`
Search by registration ID or reg_no.

```sql
-- Search by registration ID
SELECT * FROM find_player('VJTI-CRK-1234');

-- Search by reg_no
SELECT * FROM find_player('221041XXX');
```

---

## 🔐 Security (RLS Policies)

### Players Table
- **Public Read**: Anyone can read (filtered by API)
- **Insert**: Only via service role (API endpoints)
- **Update**: Only via service role (API endpoints)
- **Delete**: Only via service role

### Announcements Table
- **Public Read**: Only published announcements
- **Write**: Only authenticated organizers

### Settings Table
- **Public Read**: All settings
- **Write**: Only authenticated organizers

---

## 📦 Storage Buckets

### `player-photos` Bucket
- **Purpose**: Store player profile photos
- **Access**: Public read
- **Upload**: Via service role only
- **Max Size**: ~5MB per image
- **Formats**: JPEG, PNG, WebP

**Note**: Currently using base64 encoding in database. Storage bucket is for future optimization.

---

## 🔄 Data Flow

```
User Registration Form
        ↓
   Client-side validation
        ↓
   POST to /api/register
        ↓
   Server validation
        ↓
   Turnstile verification
        ↓
   Rate limiting check
        ↓
   Insert to players table
        ↓
   Return registration_id & public_token
        ↓
   Display player card
```

---

## 📈 Performance Considerations

### Indexes
All critical fields are indexed:
- Registration lookups: O(log n)
- Status filtering: O(log n)
- Time-based queries: Optimized

### Query Optimization
- Use `SELECT` with specific columns, not `SELECT *`
- Add `LIMIT` to large queries
- Use prepared statements for repeated queries
- Leverage materialized views for complex stats

### Storage
- Base64 photos: ~375KB max per player
- 1000 registrations ≈ 375MB of photo data
- Consider moving to storage bucket for >1000 players

---

## 🚨 Common Issues & Solutions

### Issue: Registration fails with "Registration failed"
**Solution**: Check Supabase logs for detailed error. Usually permission or validation issue.

### Issue: Duplicate registration_id generated
**Solution**: Very unlikely (1 in 9000). Script will retry with new ID automatically.

### Issue: Photo too large
**Solution**: Reduce quality or dimensions. Max 5MB input, stored as ~375KB base64.

### Issue: Can't find player by reg_no
**Solution**: Check if reg_no was uppercased. Database stores uppercase only.

### Issue: Statistics function returns null
**Solution**: Table might be empty. Add at least one test registration.

---

## 🔄 Backup & Recovery

### Backup Database
```bash
# From Supabase dashboard
Settings → Database → Backups → Create backup
```

### Export Data (SQL)
```sql
-- Export all players
COPY (SELECT * FROM players) TO '/tmp/players_backup.csv' WITH CSV HEADER;

-- Export specific fields only
COPY (
  SELECT registration_id, full_name, reg_no, status, created_at 
  FROM players
) TO '/tmp/players_basic.csv' WITH CSV HEADER;
```

### Import Data
```sql
COPY players(full_name, reg_no, program, year, branch, primary_role, batting_style, bowling_style, whatsapp_number, consent)
FROM '/tmp/import.csv'
WITH CSV HEADER;
```

---

## 📞 Support Queries

### Check database health
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check recent errors (if logging enabled)
```sql
-- Available in Supabase dashboard under Logs
```

### Vacuum database (maintenance)
```sql
VACUUM ANALYZE players;
```

---

## 🎓 Learning Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Quick Access:**
- Dashboard: [Supabase Dashboard](https://app.supabase.com)
- Table Editor: Dashboard → Table Editor → players
- SQL Editor: Dashboard → SQL Editor
- Logs: Dashboard → Logs → Database
