// @ts-check
/**
 * GET /api/card/[token] — Generate player card image
 * Uses @vercel/og (Satori) to generate a 1080×1920 Instagram story card
 * 
 * Query params:
 *   ?format=png (default) | json (debug)
 */

import { ImageResponse } from "@vercel/og";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SITE_URL = process.env.VITE_SITE_URL || "http://localhost:5173";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * @param {import("@vercel/node").VercelRequest} req
 * @param {import("@vercel/node").VercelResponse} res
 */
export default async function handler(req, res) {
  const { token } = req.query;
  const format = req.query.format || "png";
  
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Missing token parameter" });
  }

  try {
    // Fetch player by public_token (safe lookup, no private data leak risk)
    const { data: player, error } = await supabase
      .from("players")
      .select("registration_id, full_name, primary_role, branch, year, program, photo_url")
      .eq("public_token", token)
      .single();
    
    if (error || !player) {
      return res.status(404).json({ error: "Player not found" });
    }

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(player.registration_id, {
      width: 200,
      margin: 1,
      color: { dark: "#0F6B3D", light: "#F4F1E8" }
    });

    // Debug mode: return JSON
    if (format === "json") {
      return res.status(200).json({ player, qrDataUrl });
    }

    // Generate the card image using @vercel/og
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            width: "1080px",
            height: "1920px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #050807 0%, #0B120E 50%, #0F6B3D 100%)",
            color: "#F4F1E8",
            fontFamily: "sans-serif",
            padding: "80px",
            position: "relative"
          }}
        >
          {/* Top Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              marginBottom: "60px",
              fontSize: "32px",
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: "0.1em"
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: "#31D47B"
              }}
            />
            I'M IN · VJTI CRICKET TRIALS 2026
          </div>

          {/* Name */}
          <div
            style={{
              fontSize: "72px",
              fontWeight: "900",
              textAlign: "center",
              marginBottom: "40px",
              textTransform: "uppercase",
              letterSpacing: "0.02em"
            }}
          >
            {player.full_name}
          </div>

          {/* Role & Details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              alignItems: "center",
              marginBottom: "60px",
              fontSize: "36px",
              color: "#A7B2AC"
            }}
          >
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <span style={{ color: "#31D47B", fontWeight: "700" }}>{player.primary_role}</span>
            </div>
            <div>{player.branch} · {player.year} {player.program}</div>
          </div>

          {/* Registration ID */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              marginBottom: "60px",
              padding: "40px 60px",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "24px",
              border: "2px solid rgba(49, 212, 123, 0.3)"
            }}
          >
            <div style={{ fontSize: "24px", color: "#A7B2AC", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              Registration ID
            </div>
            <div style={{ fontSize: "56px", fontWeight: "900", color: "#31D47B", fontFamily: "monospace" }}>
              {player.registration_id}
            </div>
          </div>

          {/* QR Code */}
          <img
            src={qrDataUrl}
            width="200"
            height="200"
            style={{
              marginBottom: "40px",
              padding: "20px",
              background: "#F4F1E8",
              borderRadius: "16px"
            }}
          />

          {/* Trial Dates */}
          <div
            style={{
              fontSize: "32px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "20px"
            }}
          >
            10–11 OCTOBER 2026
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#A7B2AC"
            }}
          >
            VJTI CRICKET GROUND · MATUNGA
          </div>

          {/* Footer */}
          <div
            style={{
              position: "absolute",
              bottom: "60px",
              fontSize: "20px",
              color: "#64716A",
              textAlign: "center"
            }}
          >
            Show this at check-in · {SITE_URL}
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1920
      }
    );

    // Set appropriate headers
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    
    // Convert Response to Buffer for Vercel
    const buffer = await imageResponse.arrayBuffer();
    return res.status(200).send(Buffer.from(buffer));
    
  } catch (error) {
    console.error("Card generation error:", error);
    return res.status(500).json({ 
      error: "Failed to generate player card",
      details: error.message 
    });
  }
}
