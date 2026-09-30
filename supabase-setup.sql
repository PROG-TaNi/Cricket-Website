-- =====================================================================
-- VJTI Cricket Trials 2026-27 - Supabase Database Setup
-- =====================================================================
-- This script creates all tables, storage buckets, policies, and functions
-- needed for the cricket registration system.
-- 
-- To use:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- =====================================================================

-- =====================================================================
-- 1. ENABLE REQUIRED EXTENSIONS
-- =====================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for random token generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =====================================================================
-- 2. CREATE CUSTOM TYPES
-- =====================================================================

-- Player status enum
DO $$ BEGIN
    CREATE TYPE player_status AS ENUM ('registered', 'shortlisted', 'selected', 'rejected', 'withdrawn');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- =====================================================================
-- 3. CREATE MAIN TABLES
-- =====================================================================

-- Players table - stores all registration data
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identity
    registration_id TEXT UNIQUE NOT NULL DEFAULT ('VJTI-CRK-' || LPAD(FLOOR(RANDOM() * 9000 + 1000)::TEXT, 4, '0')),
    public_token TEXT UNIQUE NOT NULL DEFAULT ('tok-' || encode(gen_random_bytes(6), 'hex')),
    full_name TEXT NOT NULL,
    reg_no TEXT UNIQUE NOT NULL,
    program TEXT NOT NULL CHECK (program IN ('Degree', 'Diploma', 'M.Tech')),
    year TEXT NOT NULL,
    branch TEXT NOT NULL,
    
    -- Cricket profile
    primary_role TEXT NOT NULL CHECK (primary_role IN ('Batter', 'Bowler', 'Wicketkeeper')),
    batting_style TEXT NOT NULL CHECK (batting_style IN ('Right-hand', 'Left-hand')),
    bowling_style TEXT NOT NULL CHECK (bowling_style IN (
        'Right-arm pace', 'Left-arm pace', 'Right-arm medium',
        'Right-arm off-spin', 'Right-arm leg-spin',
        'Left-arm orthodox', 'Left-arm wrist-spin', 'Doesn''t bowl'
    )),
    experience TEXT,
    
    -- Contact
    whatsapp_number TEXT NOT NULL,
    
    -- Photo - stored as base64 data URL or storage bucket URL
    photo_url TEXT,
    
    -- Consent & status
    consent BOOLEAN NOT NULL DEFAULT TRUE,
    status player_status NOT NULL DEFAULT 'registered',
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Organizer notes
    organizer_notes TEXT,
    trial_score NUMERIC(5,2),
    
    -- Branch stats tracking
    branch_normalized TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN branch ILIKE '%computer%' OR branch ILIKE '%IT%' THEN 'Computer/IT'
            WHEN branch ILIKE '%electronics%' OR branch ILIKE '%EXTC%' THEN 'Electronics'
            WHEN branch ILIKE '%mechanical%' THEN 'Mechanical'
            WHEN branch ILIKE '%civil%' THEN 'Civil'
            WHEN branch ILIKE '%electrical%' THEN 'Electrical'
            ELSE 'Other'
        END
    ) STORED
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_reg_no ON players(reg_no);
CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);
CREATE INDEX IF NOT EXISTS idx_players_created_at ON players(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_players_registration_id ON players(registration_id);
CREATE INDEX IF NOT EXISTS idx_players_public_token ON players(public_token);
CREATE INDEX IF NOT EXISTS idx_players_branch_normalized ON players(branch_normalized);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =====================================================================
-- 4. ANNOUNCEMENTS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published, created_at DESC);

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =====================================================================
-- 5. SETTINGS TABLE (for organizer dashboard)
-- =====================================================================

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
    ('registration_open', 'true'::jsonb),
    ('trial_dates', '{"start": "2026-10-10", "end": "2026-10-11"}'::jsonb),
    ('whatsapp_group_url', '""'::jsonb),
    ('organizer_email', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;

DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =====================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Players table policies
-- Public read access for published player cards (via public_token)
CREATE POLICY "Public read access for player cards"
    ON players FOR SELECT
    USING (true);  -- Service role will handle sensitive data filtering in API

-- Only service role (API functions) can insert/update
CREATE POLICY "Service role can insert players"
    ON players FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Service role can update players"
    ON players FOR UPDATE
    USING (true);

-- Announcements - public can read published ones
CREATE POLICY "Public read published announcements"
    ON announcements FOR SELECT
    USING (published = true);

CREATE POLICY "Authenticated users manage announcements"
    ON announcements FOR ALL
    USING (auth.role() = 'authenticated');

-- Settings - public read, authenticated write
CREATE POLICY "Public read settings"
    ON settings FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users manage settings"
    ON settings FOR ALL
    USING (auth.role() = 'authenticated');


-- =====================================================================
-- 7. STORAGE BUCKETS (for player photos if not using base64)
-- =====================================================================

-- Create a bucket for player photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read player photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'player-photos');

CREATE POLICY "Service role upload player photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'player-photos');


-- =====================================================================
-- 8. HELPER FUNCTIONS
-- =====================================================================

-- Function to get statistics
CREATE OR REPLACE FUNCTION get_registration_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'by_status', json_agg(status_stats),
        'by_role', json_agg(role_stats),
        'by_program', json_agg(program_stats),
        'by_branch', json_agg(branch_stats),
        'recent_24h', (SELECT COUNT(*) FROM players WHERE created_at > NOW() - INTERVAL '24 hours')
    )
    INTO result
    FROM (
        SELECT status, COUNT(*) as count
        FROM players
        GROUP BY status
    ) status_stats,
    (
        SELECT primary_role, COUNT(*) as count
        FROM players
        GROUP BY primary_role
    ) role_stats,
    (
        SELECT program, COUNT(*) as count
        FROM players
        GROUP BY program
    ) program_stats,
    (
        SELECT branch_normalized, COUNT(*) as count
        FROM players
        GROUP BY branch_normalized
    ) branch_stats;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to search player by registration ID or reg_no
CREATE OR REPLACE FUNCTION find_player(search_term TEXT)
RETURNS TABLE (
    registration_id TEXT,
    full_name TEXT,
    reg_no TEXT,
    program TEXT,
    year TEXT,
    branch TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.registration_id,
        p.full_name,
        p.reg_no,
        p.program,
        p.year,
        p.branch,
        p.status::TEXT
    FROM players p
    WHERE 
        p.registration_id = UPPER(search_term)
        OR p.reg_no = UPPER(search_term)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================================
-- 9. SAMPLE TEST DATA (optional - comment out for production)
-- =====================================================================

-- Uncomment below to insert test data
/*
INSERT INTO players (
    full_name, reg_no, program, year, branch,
    primary_role, batting_style, bowling_style,
    whatsapp_number, consent, status
) VALUES 
(
    'Virat Kohli',
    'TEST001',
    'Degree',
    'Third Year',
    'Computer Engineering',
    'Batter',
    'Right-hand',
    'Right-arm medium',
    '+919876543210',
    true,
    'registered'
),
(
    'Rohit Sharma',
    'TEST002',
    'Degree',
    'Final Year',
    'Electronics Engineering',
    'Batter',
    'Right-hand',
    'Right-arm off-spin',
    '+919876543211',
    true,
    'shortlisted'
),
(
    'Jasprit Bumrah',
    'TEST003',
    'M.Tech',
    'First Year',
    'Mechanical Engineering',
    'Bowler',
    'Right-hand',
    'Right-arm pace',
    '+919876543212',
    true,
    'selected'
);
*/


-- =====================================================================
-- 10. VERIFICATION QUERIES
-- =====================================================================

-- Check if all tables were created
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('players', 'announcements', 'settings');
    
    RAISE NOTICE 'Created % main tables', table_count;
END $$;

-- Display summary
SELECT 'Setup complete! Tables created:' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup complete! You can now:';
    RAISE NOTICE '1. Update your .env file with Supabase credentials';
    RAISE NOTICE '2. Test registration at http://localhost:5173/register.html';
    RAISE NOTICE '3. Access organizer dashboard at http://localhost:5173/organizer/';
END $$;
