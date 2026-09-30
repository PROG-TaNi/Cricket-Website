// @ts-check
/**
 * POST /api/find-id — Find registration ID
 * Body: { reg_no: string, whatsapp: string }
 * Both must match. Returns registration ID and public_token only if both match.
 */

import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const UPSTASH_REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let ratelimit = /** @type {Ratelimit | null} */ (null);
if (UPSTASH_REDIS_URL && UPSTASH_REDIS_TOKEN) {
  const redis = new Redis({ url: UPSTASH_REDIS_URL, token: UPSTASH_REDIS_TOKEN });
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "vjti-cricket-findid",
  });
}

/**
 * @param {import("@vercel/node").VercelRequest} req
 * @param {import("@vercel/node").VercelResponse} res
 */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.VITE_SITE_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = (req.headers["x-forwarded-for"] || "127.0.0.1").toString().split(",")[0].trim();
  if (ratelimit) {
    const { success } = await ratelimit.limit(ip);
    if (!success) return res.status(429).json({ error: "Too many attempts. Try again later." });
  }

  const body = req.body;
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Invalid request body." });
  }

  const { reg_no, whatsapp } = body;

  if (!reg_no || !whatsapp) {
    return res.status(400).json({ error: "Both Reg no and WhatsApp number are required." });
  }

  // Normalize inputs
  const normalizedRegNo = String(reg_no).toUpperCase().trim();
  const normalizedWhatsApp = String(whatsapp).replace(/[\s\-()]/g, "");
  
  // WhatsApp must match format +91XXXXXXXXXX
  const whatsappRegex = /^\+?91?[6-9]\d{9}$/;
  if (!whatsappRegex.test(normalizedWhatsApp)) {
    return res.status(422).json({ error: "Invalid WhatsApp number format." });
  }
  
  // Ensure it starts with +91
  const finalWhatsApp = normalizedWhatsApp.startsWith("+91") 
    ? normalizedWhatsApp 
    : normalizedWhatsApp.startsWith("91")
    ? "+" + normalizedWhatsApp
    : "+91" + normalizedWhatsApp.replace(/^0/, "");

  // Query database - both must match
  const { data, error } = await supabase
    .from("players")
    .select("registration_id, public_token, full_name, primary_role, program, year, branch, batting_style, bowling_style")
    .eq("reg_no", normalizedRegNo)
    .eq("whatsapp_number", finalWhatsApp)
    .maybeSingle();

  if (error) {
    console.error("Find ID error:", error);
    return res.status(500).json({ error: "Lookup failed. Please try again." });
  }
  
  if (!data) {
    return res.status(404).json({ error: "No match found. Check your Reg no and WhatsApp number." });
  }

  return res.status(200).json({
    registrationId: data.registration_id,
    publicToken: data.public_token,
    firstName: data.full_name.split(" ")[0],
    player: data
  });
}
