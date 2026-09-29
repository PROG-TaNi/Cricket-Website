-- ====================================================================
-- VJTI LEATHER-BALL CRICKET TEAM SELECTION TRIALS 2026-27
-- Initial Migration: 0001_init.sql
-- Source of Truth: Sections 1, 6, 8, 9, 10, 11 of Master Prompt
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SEQUENCES
CREATE SEQUENCE IF NOT EXISTS players_reg_id_seq START WITH 1 INCREMENT BY 1;

-- 3. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
  id text PRIMARY KEY DEFAULT 'current',
  registration_open boolean NOT NULL DEFAULT true,
  registration_deadline timestamptz,
  matchday_mode boolean NOT NULL DEFAULT false,
  results_published boolean NOT NULL DEFAULT false,
  whatsapp_group_url text DEFAULT 'https://chat.whatsapp.com/vjti-cricket-trials-placeholder',
  updated_at timestamptz DEFAULT now()
);

-- Seed initial site_settings if not exists
INSERT INTO public.site_settings (id, registration_open, matchday_mode, results_published)
VALUES ('current', true, false, false)
ON CONFLICT (id) DO NOTHING;

-- 4. TRIAL DAYS TABLE
CREATE TABLE IF NOT EXISTS public.trial_days (
  id text PRIMARY KEY,
  day_number int NOT NULL,
  date date NOT NULL,
  day_of_week text NOT NULL,
  venue text NOT NULL DEFAULT 'VJTI Cricket Ground',
  reporting_time text, -- null -> "TO BE ANNOUNCED"
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  created_at timestamptz DEFAULT now()
);

-- Seed initial trial days
INSERT INTO public.trial_days (id, day_number, date, day_of_week, venue, reporting_time, status)
VALUES 
  ('day-1', 1, '2026-10-10', 'Saturday', 'VJTI Cricket Ground', NULL, 'upcoming'),
  ('day-2', 2, '2026-10-11', 'Sunday', 'VJTI Cricket Ground', NULL, 'upcoming')
ON CONFLICT (id) DO NOTHING;

-- 5. PLAYERS TABLE
CREATE TABLE IF NOT EXISTS public.players (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_id text UNIQUE NOT NULL,
  public_token uuid UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  reg_no text UNIQUE NOT NULL,
  program text NOT NULL CHECK (program IN ('Degree', 'Diploma', 'M.Tech')),
  year text NOT NULL,
  branch text NOT NULL,
  primary_role text NOT NULL CHECK (primary_role IN ('Batter', 'Bowler', 'Wicketkeeper')),
  batting_style text NOT NULL,
  bowling_style text NOT NULL,
  experience text,
  whatsapp_number text NOT NULL,
  consent boolean NOT NULL DEFAULT true,
  group_id text,
  day1_attendance text NOT NULL DEFAULT 'pending' CHECK (day1_attendance IN ('pending', 'present', 'late', 'absent', 'excused')),
  day2_attendance text NOT NULL DEFAULT 'pending' CHECK (day2_attendance IN ('pending', 'present', 'late', 'absent', 'excused')),
  status text NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'checked_in', 'in_trials', 'shortlisted', 'waitlisted', 'rejected')),
  source text NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'walk_in')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Function to format registration ID sequence (VJTI-CRK-0001...)
CREATE OR REPLACE FUNCTION public.set_registration_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.registration_id IS NULL OR NEW.registration_id = '' THEN
    NEW.registration_id := 'VJTI-CRK-' || LPAD(nextval('players_reg_id_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_set_registration_id
BEFORE INSERT ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.set_registration_id();

-- 6. ORGANIZERS TABLE (Auth role-based access)
CREATE TABLE IF NOT EXISTS public.organizers (
  id uuid PRIMARY KEY, -- matches auth.users.id
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'organizer', 'viewer')),
  created_at timestamptz DEFAULT now()
);

-- 7. PLAYER EVALUATIONS TABLE
CREATE TABLE IF NOT EXISTS public.player_evaluations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  selector_id uuid REFERENCES public.organizers(id),
  batting_rating int CHECK (batting_rating BETWEEN 1 AND 5),
  bowling_rating int CHECK (bowling_rating BETWEEN 1 AND 5),
  fielding_rating int CHECK (fielding_rating BETWEEN 1 AND 5),
  keeping_rating int CHECK (keeping_rating BETWEEN 1 AND 5),
  fitness_rating int CHECK (fitness_rating BETWEEN 1 AND 5),
  recommendation text CHECK (recommendation IN ('yes', 'maybe', 'no')),
  notes text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(player_id, selector_id)
);

-- 8. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('IMPORTANT', 'TRIAL UPDATE', 'EQUIPMENT', 'VENUE', 'GENERAL')),
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'high')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 9. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid REFERENCES public.organizers(id),
  action text NOT NULL,
  target_id text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public can read trial_days and published announcements
CREATE POLICY "Public read trial_days" ON public.trial_days FOR SELECT USING (true);
CREATE POLICY "Public read published announcements" ON public.announcements FOR SELECT USING (status = 'published');

-- Public CANNOT read players directly. (Hard privacy rule)
-- Organizers have full access based on role
CREATE POLICY "Organizers view players" ON public.players FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.organizers WHERE id = auth.uid()));

CREATE POLICY "Organizers edit players" ON public.players FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.organizers WHERE id = auth.uid() AND role IN ('admin', 'organizer')));

-- 11. AGGREGATE PUBLIC RPCs (Safe aggregate numbers only)

-- Public stats RPC: counts by role
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total int;
  v_batters int;
  v_bowlers int;
  v_keepers int;
BEGIN
  SELECT count(*) INTO v_total FROM public.players;
  SELECT count(*) INTO v_batters FROM public.players WHERE primary_role = 'Batter';
  SELECT count(*) INTO v_bowlers FROM public.players WHERE primary_role = 'Bowler';
  SELECT count(*) INTO v_keepers FROM public.players WHERE primary_role = 'Wicketkeeper';
  
  RETURN json_build_object(
    'totalRegistered', v_total,
    'batters', v_batters,
    'bowlers', v_bowlers,
    'wicketkeepers', v_keepers
  );
END;
$$;

-- Public branch battle stats RPC
CREATE OR REPLACE FUNCTION public.get_public_branch_stats()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_agg(t) INTO v_result FROM (
    SELECT branch, count(*) as count
    FROM public.players
    GROUP BY branch
    ORDER BY count DESC
    LIMIT 10
  ) t;
  
  RETURN coalesce(v_result, '[]'::json);
END;
$$;

-- Public squad reveal RPC (Only shortlisted players, no phones/reg numbers)
CREATE OR REPLACE FUNCTION public.get_public_squad()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_published boolean;
  v_result json;
BEGIN
  SELECT results_published INTO v_published FROM public.site_settings WHERE id = 'current';
  IF NOT coalesce(v_published, false) THEN
    RETURN json_build_object('published', false, 'squad', '[]'::json);
  END IF;

  SELECT json_agg(t) INTO v_result FROM (
    SELECT full_name, primary_role, branch, year
    FROM public.players
    WHERE status = 'shortlisted'
    ORDER BY primary_role, full_name
  ) t;

  RETURN json_build_object('published', true, 'squad', coalesce(v_result, '[]'::json));
END;
$$;

-- Public matchday data RPC
CREATE OR REPLACE FUNCTION public.get_public_matchday()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_checked_in int;
  v_day_status text;
  v_reporting text;
BEGIN
  SELECT count(*) INTO v_checked_in 
  FROM public.players 
  WHERE day1_attendance = 'present' OR day2_attendance = 'present';

  SELECT status, reporting_time INTO v_day_status, v_reporting 
  FROM public.trial_days 
  ORDER BY day_number LIMIT 1;

  RETURN json_build_object(
    'checkedInCount', v_checked_in,
    'status', v_day_status,
    'reportingTime', v_reporting
  );
END;
$$;
