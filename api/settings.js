// @ts-check
/**
 * GET /api/settings — Public site settings
 * Cached, returns only public-safe configuration
 * 
 * Returns: { 
 *   registrationOpen, registrationDeadline, matchdayMode, 
 *   resultsPublished, whatsappGroupUrl 
 * }
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
  
  // Cache: 30s fresh (settings change less frequently but need faster updates)
  res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
  
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("registration_open, registration_deadline, matchday_mode, results_published, whatsapp_group_url")
      .eq("id", "current")
      .single();
    
    if (error) throw error;
    
    return res.status(200).json({
      registrationOpen: data.registration_open,
      registrationDeadline: data.registration_deadline,
      matchdayMode: data.matchday_mode,
      resultsPublished: data.results_published,
      whatsappGroupUrl: data.whatsapp_group_url
    });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return res.status(500).json({ 
      error: "Unable to load settings",
      registrationOpen: true,
      registrationDeadline: null,
      matchdayMode: false,
      resultsPublished: false,
      whatsappGroupUrl: null
    });
  }
}
