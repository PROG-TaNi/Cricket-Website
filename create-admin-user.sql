-- =====================================================================
-- CREATE ADMIN USER IN SUPABASE
-- =====================================================================
-- This script creates an admin user for the VJTI Cricket Ops Dashboard
-- 
-- INSTRUCTIONS:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to: Authentication → Users
-- 3. Click "Add User" button
-- 4. Fill in the form with these details:
--    - Email: admin@vjti.ac.in
--    - Password: Tarush@2026
--    - Email Confirm: ✓ (check this box)
-- 5. Click "Create User"
--
-- OR run this via SQL Editor (may require service role key):
-- =====================================================================

-- Note: Supabase handles user creation through their Authentication system
-- You cannot directly insert into auth.users via SQL for security reasons
-- 
-- Instead, use one of these methods:

-- METHOD 1: Via Supabase Dashboard (RECOMMENDED)
-- ============================================
-- 1. Go to: https://app.supabase.com/project/YOUR_PROJECT_ID/auth/users
-- 2. Click "Add User" button
-- 3. Enter:
--    Email: admin@vjti.ac.in
--    Password: Tarush@2026
--    Auto Confirm User: YES (check the box)
-- 4. Click "Create User"


-- METHOD 2: Via Supabase CLI (if you have it installed)
-- ============================================
-- Run this in your terminal:
-- supabase auth users create admin@vjti.ac.in --password "Tarush@2026"


-- METHOD 3: Via JavaScript (run in browser console on your site)
-- ============================================
-- This will create the user programmatically:

/*
// Copy and paste this into your browser console while on your site:

(async function createAdminUser() {
  const { createClient } = supabase;
  
  // Your Supabase credentials (from .env)
  const SUPABASE_URL = 'YOUR_SUPABASE_URL';
  const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
  
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Sign up admin user
  const { data, error } = await client.auth.signUp({
    email: 'admin@vjti.ac.in',
    password: 'Tarush@2026',
    options: {
      data: {
        role: 'admin',
        full_name: 'Admin User'
      }
    }
  });
  
  if (error) {
    console.error('Error creating admin:', error);
  } else {
    console.log('Admin user created successfully!', data);
    console.log('Check your email to confirm the account (or auto-confirm in dashboard)');
  }
})();
*/


-- METHOD 4: Use Supabase Management API (Advanced)
-- ============================================
-- You can also create users via the Management API using curl:
/*
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@vjti.ac.in",
    "password": "Tarush@2026",
    "email_confirm": true,
    "user_metadata": {
      "role": "admin"
    }
  }'
*/


-- =====================================================================
-- VERIFY ADMIN USER WAS CREATED
-- =====================================================================
-- After creating the user, you can verify it exists:

-- Check if user exists in auth.users (read-only, for verification)
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
WHERE email = 'admin@vjti.ac.in';


-- =====================================================================
-- TESTING THE LOGIN
-- =====================================================================
-- After creating the admin user, test login at:
-- https://your-site.vercel.app/organizer/login.html
-- 
-- Credentials:
-- Email: admin@vjti.ac.in
-- Password: Tarush@2026
-- =====================================================================


-- =====================================================================
-- OPTIONAL: CREATE ADDITIONAL ADMIN USERS
-- =====================================================================
-- Repeat the process above with different emails:
-- - cricket@vjti.ac.in
-- - organizer@vjti.ac.in
-- - trials@vjti.ac.in
-- etc.


-- =====================================================================
-- CHANGE PASSWORD LATER
-- =====================================================================
-- Admin can change their password from:
-- Dashboard → Settings → Security & Account → Change Password
-- 
-- Or use "Forgot Password" on login page to reset via OTP email


-- =====================================================================
-- SUCCESS!
-- =====================================================================
-- Once the admin user is created, you can:
-- 1. Login at /organizer/login.html
-- 2. Change password in Settings if needed
-- 3. Manage trials, players, and announcements
-- 4. Remove fallback credentials from auth.js (optional)
