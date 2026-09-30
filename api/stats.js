// @ts-check
/**
 * GET /api/stats — Public registration statistics
 * Cached, aggregate data only (safe for public consumption)
 * 
 * Returns: { totalRegistered, batters, bowlers, wicketkeepers, updatedAt }
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * @param {import("@vercel/node").VercelRequest} req
 * @param {import("@vercel/node").VercelResponse} res
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  
  // Cache: 60s fresh, 5min stale-while-revalidate
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Call the secure aggregate function from the database
    const { data, error } = await supabase.rpc("get_public_stats");
    
    if (error) throw error;
    
    return res.status(200).json({
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return res.status(500).json({ 
      error: "Unable to load statistics",
      totalRegistered: 0,
      batters: 0,
      bowlers: 0,
      wicketkeepers: 0
    });
  }
}
