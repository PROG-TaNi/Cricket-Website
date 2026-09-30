// @ts-check
/**
 * GET /api/og — Generate Open Graph image for social sharing
 * 1200×630 PNG for WhatsApp/Instagram link previews
 */

import { ImageResponse } from "@vercel/og";

/**
 * @param {import("@vercel/node").VercelRequest} req
 * @param {import("@vercel/node").VercelResponse} res
 */
export default async function handler(req, res) {
  try {
    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #050807 0%, #0B120E 40%, #0F6B3D 100%)",
            color: "#F4F1E8",
            fontFamily: "sans-serif",
            padding: "80px",
            position: "relative"
          }}
        >
          {/* Top line */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "40px",
              fontSize: "24px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#A7B2AC"
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#31D47B"
              }}
            />
            VEERMATA JIJABAI TECHNOLOGICAL INSTITUTE
          </div>

          {/* Main title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              marginBottom: "40px"
            }}
          >
            <div
              style={{
                fontSize: "96px",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.02em",
                lineHeight: "0.9"
              }}
            >
              VJTI CRICKET
            </div>
            <div
              style={{
                fontSize: "56px",
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#31D47B"
              }}
            >
              TRIALS 2026
            </div>
          </div>

          {/* Date and venue */}
          <div
            style={{
              display: "flex",
              gap: "40px",
              alignItems: "center",
              fontSize: "32px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.1em"
            }}
          >
            <div>10–11 OCTOBER</div>
            <div style={{ color: "#64716A" }}>·</div>
            <div>VJTI CRICKET GROUND</div>
          </div>

          {/* Tagline */}
          <div
            style={{
              position: "absolute",
              bottom: "60px",
              fontSize: "28px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              color: "#A7B2AC"
            }}
          >
            LEATHER-BALL SELECTION TRIALS · 2026–27
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630
      }
    );

    // Set appropriate headers
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, s-maxage=86400, immutable");
    
    // Convert Response to Buffer for Vercel
    const buffer = await imageResponse.arrayBuffer();
    return res.status(200).send(Buffer.from(buffer));
    
  } catch (error) {
    console.error("OG image generation error:", error);
    return res.status(500).json({ 
      error: "Failed to generate OG image",
      details: error.message 
    });
  }
}
