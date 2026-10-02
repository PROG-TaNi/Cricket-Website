// @ts-check
/**
 * GET /api/stats — Live registration counts from Supabase
 * Cached, aggregate-only (safe for public).
 *
 * Returns: { total, batters, bowlers, keepers, live }
 * - live: true  → read from Supabase
 * - live: false → Supabase not configured, returns zeros
 */

import { createClient } from "@supabase/supabase-js";

// ── Env ───────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// ── Supabase client (service role so it bypasses RLS) ─────────────
const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

/**
 * @param {import("@vercel/node").VercelRequest} req
 * @param {import("@vercel/node").VercelResponse} res
 */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  // 30s fresh, 60s stale-while-revalidate — quick refresh after each registration
  res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  // ── Supabase not configured → zeros (dev / unconfigured env) ─────
  if (!supabase) {
    return res.status(200).json({
      total: 0,
      batters: 0,
      bowlers: 0,
      keepers: 0,
      live: false,
    });
  }

  try {
    // Fetch only the role column — lightweight
    const { data, error } = await supabase
      .from("players")
      .select("primary_role");

    if (error) throw error;

    const rows = /** @type {{ primary_role: string }[]} */ (data || []);
    const batters  = rows.filter((r) => r.primary_role === "batter").length;
    const bowlers  = rows.filter((r) => r.primary_role === "bowler").length;
    const keepers  = rows.filter((r) => r.primary_role === "wicketkeeper").length;
    const total    = rows.length;

    return res.status(200).json({
      total,
      batters,
      bowlers,
      keepers,
      live: true,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/stats] Supabase error:", err);
    // Always return 200 so the page doesn't break
    return res.status(200).json({
      total: 0,
      batters: 0,
      bowlers: 0,
      keepers: 0,
      live: false,
      error: "db_unavailable",
    });
  }
}
