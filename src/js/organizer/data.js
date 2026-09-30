// @ts-check
/**
 * Organizer Data Store
 * Provides unified access to player records, attendance updates, trial groups, and settings.
 * Persists offline changes and syncs with Supabase if live credentials are configured.
 */

import { supabase } from "../core/supabase.js";

const PLAYERS_CACHE_KEY = "vjti_org_players_cache";
const SETTINGS_CACHE_KEY = "vjti_org_settings_cache";

/**
 * Seed realistic VJTI players dataset for immediate development and ground testing
 */
const SEED_PLAYERS = [
  {
    id: "p-01",
    registration_id: "VJTI-CRK-0001",
    public_token: "tok-0001",
    full_name: "Aarav Sharma",
    reg_no: "221041001",
    program: "Degree",
    year: "4th",
    branch: "Computer Engineering",
    primary_role: "Batter",
    batting_style: "Right-hand",
    bowling_style: "Right-arm off-spin",
    experience: "Captain of VJTI Inter-Engg team 2025. 78* against SPIT in final.",
    whatsapp_number: "+919820011221",
    day1_attendance: "present",
    day2_attendance: "present",
    status: "shortlisted",
    rating: 8.5,
    notes: "Solid front-foot defense, strong off-side play, calm temperament under pressure.",
    trial_batch: "Batch A",
    trial_net: "Net 1",
    created_at: "2026-09-25T10:00:00Z"
  },
  {
    id: "p-02",
    registration_id: "VJTI-CRK-0002",
    public_token: "tok-0002",
    full_name: "Rohan Kulkarni",
    reg_no: "231021045",
    program: "Degree",
    year: "3rd",
    branch: "Mechanical Engineering",
    primary_role: "Bowler",
    batting_style: "Right-hand",
    bowling_style: "Right-arm pace",
    experience: "Club cricket at Shivaji Park Gymkhana. Sharp bouncer, speeds ~125kmph.",
    whatsapp_number: "+919819123456",
    day1_attendance: "present",
    day2_attendance: "pending",
    status: "in_trials",
    rating: 8.0,
    notes: "Great seam position. Consistent back of a length. Good stamina.",
    trial_batch: "Batch A",
    trial_net: "Net 1",
    created_at: "2026-09-25T11:15:00Z"
  },
  {
    id: "p-03",
    registration_id: "VJTI-CRK-0003",
    public_token: "tok-0003",
    full_name: "Aditya Patil",
    reg_no: "241031012",
    program: "Degree",
    year: "2nd",
    branch: "Information Technology",
    primary_role: "Wicketkeeper",
    batting_style: "Right-hand",
    bowling_style: "Doesn't bowl",
    experience: "U-19 MCA summer league. Clean glovework up to the stumps.",
    whatsapp_number: "+919876543211",
    day1_attendance: "present",
    day2_attendance: "pending",
    status: "shortlisted",
    rating: 8.8,
    notes: "Very vocal behind the stumps, rapid stumping reflexes, drives well.",
    trial_batch: "Batch B",
    trial_net: "Net 2",
    created_at: "2026-09-25T14:30:00Z"
  },
  {
    id: "p-04",
    registration_id: "VJTI-CRK-0004",
    public_token: "tok-0004",
    full_name: "Siddhesh Jadhav",
    reg_no: "221051088",
    program: "Degree",
    year: "4th",
    branch: "Electrical Engineering",
    primary_role: "Bowler",
    batting_style: "Left-hand",
    bowling_style: "Left-arm orthodox",
    experience: "Kanga League 'C' Division. 5 wickets vs Dadar Union last season.",
    whatsapp_number: "+919820556677",
    day1_attendance: "late",
    day2_attendance: "pending",
    status: "in_trials",
    rating: 7.8,
    notes: "Tidy trajectory, nice arm-ball, keeps the runs choked in middle overs.",
    trial_batch: "Batch B",
    trial_net: "Net 2",
    created_at: "2026-09-26T09:00:00Z"
  },
  {
    id: "p-05",
    registration_id: "VJTI-CRK-0005",
    public_token: "tok-0005",
    full_name: "Vedant Deshmukh",
    reg_no: "251011005",
    program: "Degree",
    year: "1st",
    branch: "Civil Engineering",
    primary_role: "Batter",
    batting_style: "Left-hand",
    bowling_style: "Right-arm medium",
    experience: "Harris Shield semi-finalist. Solid top-order opener.",
    whatsapp_number: "+919930441122",
    day1_attendance: "present",
    day2_attendance: "pending",
    status: "in_trials",
    rating: 7.5,
    notes: "Fluid cut shot and cover drive. Needs work against short pitched bowling.",
    trial_batch: "Batch A",
    trial_net: "Net 3",
    created_at: "2026-09-26T11:45:00Z"
  },
  {
    id: "p-06",
    registration_id: "VJTI-CRK-0006",
    public_token: "tok-0006",
    full_name: "Prathamesh Shinde",
    reg_no: "232011019",
    program: "Diploma",
    year: "3rd",
    branch: "Mechanical Engineering",
    primary_role: "Bowler",
    batting_style: "Right-hand",
    bowling_style: "Right-arm pace",
    experience: "Inter-diploma champion 2025. 14 wickets in 4 games.",
    whatsapp_number: "+919769882233",
    day1_attendance: "absent",
    day2_attendance: "pending",
    status: "registered",
    rating: 6.5,
    notes: "Missed Day 1 due to exam conflict; requested Day 2 trial slot.",
    trial_batch: "Batch C",
    trial_net: "Net 1",
    created_at: "2026-09-26T15:20:00Z"
  },
  {
    id: "p-07",
    registration_id: "VJTI-CRK-0007",
    public_token: "tok-0007",
    full_name: "Nikhil Sawant",
    reg_no: "241081033",
    program: "Degree",
    year: "2nd",
    branch: "Production Engineering",
    primary_role: "Batter",
    batting_style: "Right-hand",
    bowling_style: "Right-arm leg-spin",
    experience: "Giles Shield captain, 112* in school finals. Good power hitter.",
    whatsapp_number: "+919869112244",
    day1_attendance: "present",
    day2_attendance: "pending",
    status: "shortlisted",
    rating: 8.2,
    notes: "Aggressive intent against spinners. Clears long-on with ease.",
    trial_batch: "Batch A",
    trial_net: "Net 3",
    created_at: "2026-09-27T10:10:00Z"
  },
  {
    id: "p-08",
    registration_id: "VJTI-CRK-0008",
    public_token: "tok-0008",
    full_name: "Aniket More",
    reg_no: "233011004",
    program: "M.Tech",
    year: "2nd",
    branch: "Electronics & Telecommunication",
    primary_role: "Wicketkeeper",
    batting_style: "Left-hand",
    bowling_style: "Doesn't bowl",
    experience: "University zonal trials representation. Quick feet against seam.",
    whatsapp_number: "+919811223344",
    day1_attendance: "present",
    day2_attendance: "pending",
    status: "waitlisted",
    rating: 7.2,
    notes: "Decent glove work, solid lower middle-order counter-attacker.",
    trial_batch: "Batch B",
    trial_net: "Net 2",
    created_at: "2026-09-27T13:40:00Z"
  },
  {
    id: "p-09",
    registration_id: "VJTI-CRK-0009",
    public_token: "tok-0009",
    full_name: "Tanmay Bapat",
    reg_no: "221071025",
    program: "Degree",
    year: "4th",
    branch: "Instrumentation Engineering",
    primary_role: "Bowler",
    batting_style: "Right-hand",
    bowling_style: "Right-arm pace",
    experience: "Leather-ball cricket for 6 years. Good yorker in death overs.",
    whatsapp_number: "+919821778899",
    day1_attendance: "present",
    day2_attendance: "pending",
    status: "shortlisted",
    rating: 8.4,
    notes: "Hits the deck hard. Disciplined line outside off stump.",
    trial_batch: "Batch C",
    trial_net: "Net 1",
    created_at: "2026-09-28T09:30:00Z"
  },
  {
    id: "p-10",
    registration_id: "VJTI-CRK-0010",
    public_token: "tok-0010",
    full_name: "Varun Mehta",
    reg_no: "241091014",
    program: "Degree",
    year: "2nd",
    branch: "Textile Engineering",
    primary_role: "Batter",
    batting_style: "Right-hand",
    bowling_style: "Doesn't bowl",
    experience: "Played college friendlies. High strike rate opener.",
    whatsapp_number: "+919920119988",
    day1_attendance: "pending",
    day2_attendance: "pending",
    status: "registered",
    rating: 6.8,
    notes: "Audition scheduled for Day 2 morning.",
    trial_batch: "Batch C",
    trial_net: "Net 3",
    created_at: "2026-09-28T16:00:00Z"
  },
  {
    id: "p-11",
    registration_id: "VJTI-CRK-0011",
    public_token: "tok-0011",
    full_name: "Yashraj Bhosle",
    reg_no: "231011050",
    program: "Degree",
    year: "3rd",
    branch: "Civil Engineering",
    primary_role: "Bowler",
    batting_style: "Left-hand",
    bowling_style: "Left-arm wrist-spin",
    experience: "Rare wrist spinner. Plays for VJTI hostel league champions.",
    whatsapp_number: "+919833445566",
    day1_attendance: "present",
    day2_attendance: "pending",
    status: "shortlisted",
    rating: 8.7,
    notes: "Sharp turn both ways, googlies fooled 3 frontline batters in Net 2.",
    trial_batch: "Batch B",
    trial_net: "Net 2",
    created_at: "2026-09-29T10:00:00Z"
  },
  {
    id: "p-12",
    registration_id: "VJTI-CRK-0012",
    public_token: "tok-0012",
    full_name: "Omkar Gawade",
    reg_no: "242011008",
    program: "Diploma",
    year: "2nd",
    branch: "Electrical Engineering",
    primary_role: "Batter",
    batting_style: "Right-hand",
    bowling_style: "Right-arm medium",
    experience: "Inter-school cricket finalist, Pune division.",
    whatsapp_number: "+919819667788",
    day1_attendance: "present",
    day2_attendance: "pending",
    status: "in_trials",
    rating: 7.0,
    notes: "Good hand-eye coordination. Tends to push hard at moving balls.",
    trial_batch: "Batch A",
    trial_net: "Net 3",
    created_at: "2026-09-29T14:15:00Z"
  }
];

/**
 * Fetch all players
 * @returns {Promise<Array<any>>}
 */
export async function getPlayers() {
  // Try fetching live from Supabase
  try {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      localStorage.setItem(PLAYERS_CACHE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (_) {}

  // Fallback to local cache or seed data
  try {
    const cached = localStorage.getItem(PLAYERS_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (_) {}

  // Save seed data to cache
  localStorage.setItem(PLAYERS_CACHE_KEY, JSON.stringify(SEED_PLAYERS));
  return [...SEED_PLAYERS];
}

/**
 * Update a player's record
 * @param {string} registrationId
 * @param {Record<string, any>} updates
 * @returns {Promise<any>}
 */
export async function updatePlayer(registrationId, updates) {
  // Update local cache first for instant feedback
  let players = await getPlayers();
  const index = players.findIndex((p) => p.registration_id === registrationId);
  if (index !== -1) {
    players[index] = { ...players[index], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(PLAYERS_CACHE_KEY, JSON.stringify(players));
  }

  // Sync to Supabase in background
  try {
    await supabase
      .from("players")
      .update(updates)
      .eq("registration_id", registrationId);
  } catch (_) {}

  return index !== -1 ? players[index] : null;
}

/**
 * Add a new walk-in player from ground mode
 * @param {Record<string, any>} player
 * @returns {Promise<any>}
 */
export async function addWalkInPlayer(player) {
  const players = await getPlayers();
  const nextNum = players.length + 1;
  const regId = `VJTI-CRK-${String(nextNum).padStart(4, "0")}`;
  
  const newPlayer = {
    id: `walkin-${Date.now()}`,
    registration_id: regId,
    public_token: `tok-${Date.now()}`,
    source: "walk_in",
    day1_attendance: "present",
    day2_attendance: "pending",
    status: "checked_in",
    created_at: new Date().toISOString(),
    ...player
  };

  players.unshift(newPlayer);
  localStorage.setItem(PLAYERS_CACHE_KEY, JSON.stringify(players));

  try {
    await supabase.from("players").insert(newPlayer);
  } catch (_) {}

  return newPlayer;
}

/**
 * Get site settings
 * @returns {Promise<any>}
 */
export async function getSiteSettings() {
  try {
    const { data } = await supabase.from("site_settings").select("*").eq("id", "current").maybeSingle();
    if (data) {
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(data));
      return data;
    }
  } catch (_) {}

  try {
    const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (_) {}

  const defaults = {
    registration_open: true,
    matchday_mode: false,
    results_published: false,
    whatsapp_group_url: "https://chat.whatsapp.com/vjti-cricket-trials-placeholder"
  };
  localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(defaults));
  return defaults;
}

/**
 * Update site settings
 * @param {Record<string, any>} updates
 */
export async function updateSiteSettings(updates) {
  let settings = await getSiteSettings();
  settings = { ...settings, ...updates, updated_at: new Date().toISOString() };
  localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));

  try {
    await supabase.from("site_settings").update(updates).eq("id", "current");
  } catch (_) {}

  return settings;
}
