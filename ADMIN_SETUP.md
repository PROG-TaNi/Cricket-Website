# 🔐 Admin User Setup Guide

This guide will help you create an admin user for the VJTI Cricket Ops Dashboard.

---

## Quick Setup (3 Methods)

### ✅ Method 1: Via Supabase Dashboard (RECOMMENDED)

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select your project

2. **Navigate to Authentication**
   - Click **Authentication** in sidebar
   - Click **Users** tab
   - Click **"Add User"** button

3. **Create Admin User**
   ```
   Email:    admin@vjti.ac.in
   Password: Tarush@2026
   ✓ Auto Confirm User (check this box)
   ```

4. **Click "Create User"**

5. **Done!** Login at `/organizer/login.html`

---

### ⚡ Method 2: Use Helper Page (EASIEST)

1. **Open in browser:**
   ```
   http://localhost:5173/create-admin.html
   ```

2. **Click "Create Admin Account"**

3. **Done!** The page will create the user automatically

---

### 🛠️ Method 3: Via Supabase CLI

If you have Supabase CLI installed:

```bash
supabase auth users create admin@vjti.ac.in --password "Tarush@2026"
```

---

## Default Admin Credentials

```
Email:    admin@vjti.ac.in
Password: Tarush@2026
```

⚠️ **Change this password after first login!**

Go to: **Dashboard → Settings → Security & Account → Change Password**

---

## Login URL

After creating the admin user:

**Local:**
```
http://localhost:5173/organizer/login.html
```

**Production:**
```
https://your-site.vercel.app/organizer/login.html
```

---

## Troubleshooting

### ❌ "Email already registered"
- User already exists
- Try logging in with the credentials
- Or use "Forgot Password" to reset

### ❌ "Invalid login credentials"
- Make sure you created the user in Supabase
- Check that email is confirmed (auto-confirm in dashboard)
- Verify password is correct

### ❌ "Supabase credentials not found"
- Check your `.env` file has:
  ```
  VITE_SUPABASE_URL=your-supabase-url
  VITE_SUPABASE_ANON_KEY=your-anon-key
  ```

---

## Security Features

### ✅ Change Password
- Location: **Settings → Security & Account**
- Requires current password verification
- Minimum 8 characters

### ✅ Forgot Password
- Click "Forgot Password?" on login page
- Enter admin email
- Receive 6-digit OTP via email
- Reset password with OTP

### ✅ Fallback Credentials
For testing/emergency access (works without Supabase):
```
Email:    admin@vjti.ac.in
Password: CricketAdmin#2026!
```

---

## Creating Additional Admins

Repeat the same process with different emails:

```
cricket@vjti.ac.in
organizer@vjti.ac.in
trials@vjti.ac.in
```

---

## Next Steps

1. ✅ Create admin user (using one of the methods above)
2. ✅ Login at `/organizer/login.html`
3. ✅ Change password in Settings
4. ✅ Set up trial dates and WhatsApp group in Settings
5. ✅ Start managing registrations!

---

## Need Help?

- **View Supabase logs:** Dashboard → Logs
- **Check users:** Dashboard → Authentication → Users
- **Reset everything:** Dashboard → SQL Editor → Run setup script again

---

## Files Included

- `create-admin-user.sql` - SQL instructions and verification queries
- `create-admin.html` - Interactive admin creation page
- `ADMIN_SETUP.md` - This guide

---

**Last Updated:** 2026-10-01
