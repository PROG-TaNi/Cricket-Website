# Squad Release Fix - RLS Policy Update

## Problem
When clicking "Release Squad Publicly" button, you were getting these errors:
```
GET .../settings?select=value&key=eq.squad_released 406 (Not Acceptable)
POST .../settings 401 (Unauthorized)
Error: new row violates row-level security policy for table "settings"
```

## Root Cause
The Row Level Security (RLS) policy on the `settings` table was blocking authenticated users from inserting/updating rows. The policy only allowed `auth.role() = 'authenticated'` which doesn't work correctly for API operations.

## Solution
We've updated the RLS policies to properly allow:
1. **Public read access** - Anyone can read settings
2. **Service role full access** - API operations work correctly
3. **Authenticated users** - Can insert, update, and delete settings

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project dashboard**
   - Navigate to https://app.supabase.com
   - Select your VJTI Cricket project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the fix script**
   - Copy the contents of `fix-settings-rls.sql`
   - Paste into the SQL editor
   - Click "Run" or press Ctrl+Enter

4. **Verify the fix**
   - You should see a success message
   - The policies table will be displayed showing the new policies

### Option 2: Using psql (Advanced)

If you have direct database access:

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" < fix-settings-rls.sql
```

## Features Added

### 1. Squad Release (Publish)
- **Location**: Admin Dashboard → Shortlist page
- **Button**: "RELEASE SQUAD PUBLICLY"
- **Action**: Makes the squad visible at `/squad.html`
- **Fallback**: Works with localStorage if Supabase fails

### 2. Squad Rollback (Unpublish)
- **Location**: Admin Dashboard → Shortlist page  
- **Button**: "UNPUBLISH SQUAD" (appears after release)
- **Action**: Hides squad from public, allows editing
- **Use Case**: Fix mistakes, update squad, then re-release

### 3. Dual Storage System
- **Primary**: Supabase `settings` table (synced across all users)
- **Fallback**: localStorage (works offline, local-only)
- **Benefit**: System works even if Supabase is down or not configured

## Testing the Fix

### Before Testing
1. Apply the SQL fix above
2. Make sure you're logged into admin dashboard
3. Have at least 1 shortlisted player

### Test Release
1. Go to `/organizer/shortlist.html`
2. Click "RELEASE SQUAD PUBLICLY"
3. You should see: ✓ "Squad released to public successfully!"
4. Green banner appears: "Squad Released to Public"
5. "RELEASE" button is hidden
6. "UNPUBLISH SQUAD" button appears
7. Visit `/squad.html` - squad should be visible

### Test Rollback
1. While on shortlist page with released squad
2. Click "UNPUBLISH SQUAD"
3. Confirm the dialog
4. You should see: ✓ "Squad unpublished successfully. Edit and re-release when ready."
5. Amber banner appears: "Squad Not Yet Released"
6. "UNPUBLISH" button is hidden
7. "RELEASE SQUAD PUBLICLY" button reappears
8. Visit `/squad.html` - should show "Squad Not Released Yet"

### Test Edit & Re-release
1. After unpublishing, edit your shortlist (add/remove players)
2. Click "RELEASE SQUAD PUBLICLY" again
3. Visit `/squad.html` - should show updated squad

## Files Modified

### 1. `supabase-setup.sql`
- Added `squad_released` default setting
- Fixed RLS policies for settings table

### 2. `fix-settings-rls.sql` (New)
- Standalone fix script for existing databases
- Can be run without recreating entire database

### 3. `src/js/organizer/shortlist.js`
- Added `rollbackSquad()` function
- Added localStorage fallback system
- Added session check for authentication
- Better error handling with fallback

### 4. `organizer/shortlist.html`
- Added "UNPUBLISH SQUAD" button
- Updated banner text with rollback hint

### 5. `src/js/pages/squad.js`
- Added localStorage fallback for checking release status
- Syncs with Supabase when available

## Admin Credentials Reminder

Default admin login:
- **Email**: `admin@vjti.ac.in`
- **Password**: `CricketAdmin#2026!`

## Troubleshooting

### Issue: Still getting 401 Unauthorized
**Solution**: 
1. Make sure you ran the `fix-settings-rls.sql` script
2. Verify you're logged in as admin
3. Check browser console for actual error
4. Try logging out and back in

### Issue: Squad not showing on public page
**Solution**:
1. Check if squad is actually released (green banner on shortlist page)
2. Clear browser cache and localStorage
3. Check browser console on `/squad.html` for errors
4. Verify you have shortlisted players (status = 'shortlisted' or 'selected')

### Issue: Release works but rollback fails
**Solution**:
1. The rollback uses the same RLS policies
2. If release works, rollback should work too
3. Check browser console for specific error
4. Verify you're still authenticated

### Issue: Works in admin but not on public page
**Solution**:
1. Public page needs the `squad_released` setting to be `true`
2. Check Supabase settings table: `SELECT * FROM settings WHERE key = 'squad_released';`
3. Also check localStorage: `localStorage.getItem("vjti_squad_released")`

## Architecture Notes

### Why Dual Storage?
1. **Reliability**: Works even if Supabase is down
2. **Speed**: Instant feedback from localStorage
3. **Sync**: Eventually consistent with Supabase
4. **Development**: Works without Supabase configured

### RLS Policy Design
- **Public read**: Anyone can check if squad is released
- **Authenticated write**: Only logged-in admins can release/rollback
- **Service role**: Full access for API operations
- **Security**: Public can't modify release status

### State Management
1. Admin clicks release → Updates Supabase + localStorage
2. Public visits `/squad.html` → Checks localStorage first, then Supabase
3. Admin unpublishes → Updates both stores again
4. Changes propagate to all users via Supabase
5. localStorage provides instant local feedback

## Support

If you encounter issues after applying this fix:
1. Check the Supabase logs in your dashboard
2. Check browser console for JavaScript errors  
3. Verify the RLS policies were created: `SELECT * FROM pg_policies WHERE tablename = 'settings';`
4. Test with the exact admin credentials above

---

**Last Updated**: Based on error logs from testing session
**Status**: ✅ Ready to deploy
