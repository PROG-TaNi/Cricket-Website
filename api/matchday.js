// @ts-check
/**
 * GET /api/matchday — Live matchday stats
 * Used when matchday_mode is true
 * 
 * Returns: { checkedInCount, status, reportingTime, latestAnnouncement }
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
  
  // Cache: 10s only (live data needs to be fresh)
  res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=30");
  
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    // Get matchday stats from the RPC
    const { data: matchdayData, error: matchdayError } = await supabase.rpc("get_public_matchday");
    
    if (matchdayError) throw matchdayError;
    
    // Get the latest published announcement
    const { data: announcements, error: announcementError } = await supabase
      .from("announcements")
      .select("id, title, category, message, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1);
    
    const latestAnnouncement = announcements && announcements.length > 0 ? announcements[0] : null;
    
    return res.status(200).json({
      ...matchdayData,
      latestAnnouncement
    });
  } catch (error) {
    console.error("Matchday fetch error:", error);
    return res.status(500).json({ 
      error: "Unable to load matchday data",
      checkedInCount: 0,
      status: "upcoming",
      reportingTime: null,
      latestAnnouncement: null
    });
  }
}
