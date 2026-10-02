-- =====================================================================
-- Fix RLS Policies for Settings Table
-- =====================================================================
-- This script fixes the Row Level Security policies for the settings
-- table to allow authenticated users and service role to insert/update.
-- 
-- Run this in your Supabase SQL Editor to fix the 401 Unauthorized error
-- when releasing the squad.
-- =====================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Public read settings" ON settings;
DROP POLICY IF EXISTS "Authenticated users manage settings" ON settings;
DROP POLICY IF EXISTS "Service role can manage settings" ON settings;
DROP POLICY IF EXISTS "Authenticated users can manage settings" ON settings;

-- Recreate policies with proper permissions

-- 1. Public read access
CREATE POLICY "Public read settings"
    ON settings FOR SELECT
    USING (true);

-- 2. Service role can do everything
CREATE POLICY "Service role can manage settings"
    ON settings FOR ALL
    USING (true)
    WITH CHECK (true);

-- 3. Authenticated users can insert/update/delete
CREATE POLICY "Authenticated users can insert settings"
    ON settings FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update settings"
    ON settings FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can delete settings"
    ON settings FOR DELETE
    TO authenticated
    USING (true);

-- Add the squad_released setting if it doesn't exist
INSERT INTO settings (key, value) VALUES
    ('squad_released', '{"released": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'settings'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✓ Settings table RLS policies updated successfully!';
    RAISE NOTICE '✓ squad_released setting initialized';
    RAISE NOTICE '';
    RAISE NOTICE 'You can now:';
    RAISE NOTICE '1. Release squad from admin dashboard';
    RAISE NOTICE '2. Unpublish squad to edit and re-release';
    RAISE NOTICE '3. Public users can view squad at /squad.html when released';
END $$;
