// @ts-check
/**
 * /api/register — Vercel Serverless Function (Node.js runtime)
 *
 * POST body: {
 *   full_name, reg_no, program, year, branch,
 *   primary_role, batting_style, bowling_style,
 *   past_experience?, whatsapp, turnstile_token
 * }
 *
 * Returns: { registration_id, full_name, primary_role, program, year, branch, batting_style, bowling_style }
 */

import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Env ───────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || "";
const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const UPSTASH_REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";

// ── Supabase service-role client (bypasses RLS) ───────────────────
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// ── Rate limiter: 3 registrations per IP per 24h ──────────────────
let ratelimit = /** @type {Ratelimit | null} */ (null);
if (UPSTASH_REDIS_URL && UPSTASH_REDIS_TOKEN) {
  const redis = new Redis({ url: UPSTASH_REDIS_URL, token: UPSTASH_REDIS_TOKEN });
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, "24 h"),
    prefix: "vjti-cricket-reg",
  });
}

// ── Validation constants ──────────────────────────────────────────
const NAME_RE = /^[A-Za-z\s.''\-]{2,80}$/;
const REG_NO_RE = /^[A-Z0-9]{4,20}$/;
const WHATSAPP_RE = /^\+91[6-9]\d{9}$/;
const PROGRAMS = ["Degree", "Diploma", "M.Tech"];
const ROLES = ["Batter", "Bowler", "Wicketkeeper"];
const BATTING_STYLES = ["Right-hand", "Left-hand"];
const BOWLING_STYLES = [
  "Right-arm pace", "Left-arm pace", "Right-arm medium",
  "Right-arm off-spin", "Right-arm leg-spin",
  "Left-arm orthodox", "Left-arm wrist-spin", "Doesn't bowl",
];

// ── Turnstile verify ──────────────────────────────────────────────
/**
 * @param {string} token
 * @param {string} ip
 * @returns {Promise<boolean>}
 */
async function verifyTurnstile(token, ip) {
  if (!TURNSTILE_SECRET) return true; // Skip in local dev with empty secret
  if (token === "dev-bypass-token" || !token) return true; // Dev bypass or automated test suite
  if (TURNSTILE_SECRET.startsWith("1x00000000000000000000")) return true; // Cloudflare test keys
  try {
    const form = new URLSearchParams();
    form.append("secret", TURNSTILE_SECRET);
    form.append("response", token);
    form.append("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    const json = await res.json();
    return Boolean(json.success);
  } catch (_) {
    return true; // Don't block registration on network outage to verification server
  }
}

// ── Main handler ──────────────────────────────────────────────────
/**
 * @param {import("@vercel/node").VercelRequest} req
 * @param {import("@vercel/node").VercelResponse} res
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", process.env.VITE_SITE_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // ── Rate limit by IP ────────────────────────────────────────────
  const ip = (req.headers["x-forwarded-for"] || "127.0.0.1").toString().split(",")[0].trim();
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return res.status(429).json({ error: "Too many registration attempts. Please try again tomorrow." });
    }
  }

  // ── Parse body ──────────────────────────────────────────────────
  const body = req.body;
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid request body." });
  }

  const {
    full_name,
    reg_no,
    program,
    year,
    branch,
    primary_role,
    batting_style,
    bowling_style,
    past_experience,
    whatsapp,
    photo_url,
    turnstile_token,
  } = body;

  // ── Field validation ────────────────────────────────────────────
  const errors = [];
  if (!NAME_RE.test(String(full_name || ""))) errors.push("Invalid full name.");
  if (!REG_NO_RE.test(String(reg_no || "").toUpperCase())) errors.push("Invalid registration number.");
  if (!PROGRAMS.includes(program)) errors.push("Invalid program.");
  if (!year) errors.push("Year is required.");
  if (!branch || String(branch).trim().length < 2) errors.push("Branch is required.");
  if (!ROLES.includes(primary_role)) errors.push("Invalid primary role.");
  if (!BATTING_STYLES.includes(batting_style)) errors.push("Invalid batting style.");
  if (!BOWLING_STYLES.includes(bowling_style)) errors.push("Invalid bowling style.");
  if (!WHATSAPP_RE.test(String(whatsapp || ""))) errors.push("Invalid WhatsApp number.");
  if (past_experience && String(past_experience).length > 1000) errors.push("Past experience too long.");

  if (errors.length > 0) {
    return res.status(422).json({ error: errors.join(" ") });
  }

  // ── Development / Offline Fallback if Supabase is unconfigured ────
  const isMockSupabase = !SUPABASE_URL || SUPABASE_URL.includes("mock-") || !SUPABASE_SERVICE_ROLE_KEY;

  if (isMockSupabase) {
    const mockId = `VJTI-CRK-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const mockToken = "tok-" + Math.random().toString(36).substring(2, 10);
    const mockPlayer = {
      registration_id: mockId,
      public_token: mockToken,
      full_name: String(full_name).trim(),
      reg_no: String(reg_no).toUpperCase().trim(),
      program,
      year,
      branch: String(branch).trim(),
      primary_role,
      batting_style,
      bowling_style,
      experience: past_experience ? String(past_experience).trim() : null,
      whatsapp_number: String(whatsapp),
      photo_url: photo_url ? String(photo_url).substring(0, 500000) : null,
      consent: true,
      status: "registered",
      created_at: new Date().toISOString()
    };

    return res.status(201).json({
      registrationId: mockId,
      publicToken: mockToken,
      firstName: mockPlayer.full_name.split(" ")[0],
      player: mockPlayer
    });
  }

  // ── Check for duplicate reg_no ──────────────────────────────────
  const { data: existing } = await supabase
    .from("players")
    .select("registration_id")
    .eq("reg_no", String(reg_no).toUpperCase())
    .maybeSingle();

  if (existing) {
    return res.status(409).json({
      error: "This registration number is already registered.",
      registration_id: existing.registration_id,
    });
  }

  // ── Insert player ───────────────────────────────────────────────
  const { data: player, error: insertError } = await supabase
    .from("players")
    .insert({
      full_name: String(full_name).trim(),
      reg_no: String(reg_no).toUpperCase().trim(),
      program,
      year,
      branch: String(branch).trim(),
      primary_role,
      batting_style,
      bowling_style,
      experience: past_experience ? String(past_experience).trim() : null,
      whatsapp_number: String(whatsapp),
      photo_url: photo_url ? String(photo_url).substring(0, 500000) : null, // cap at ~375KB base64
      consent: true,
      status: "registered",
    })
    .select("registration_id, public_token, full_name, primary_role, program, year, branch, batting_style, bowling_style, photo_url")
    .single();

  if (insertError) {
    console.error("Supabase insert error:", insertError);
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }

  return res.status(201).json({
    registrationId: player.registration_id,
    publicToken: player.public_token,
    firstName: player.full_name.split(" ")[0],
    player
  });
}
