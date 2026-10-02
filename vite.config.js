import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import fs from "fs";

/**
 * Custom lightweight build-time HTML partials plugin.
 * Replaces <!-- include:partials/filename.html --> with file content.
 */
function htmlPartialsPlugin() {
  return {
    name: "html-partials",
    transformIndexHtml(html) {
      return html.replace(/<!--\s*include:([^\s]+)\s*-->/g, (match, filePath) => {
        const fullPath = resolve(process.cwd(), filePath.trim());
        if (fs.existsSync(fullPath)) {
          return fs.readFileSync(fullPath, "utf-8");
        }
        return `<!-- Missing partial: ${filePath} -->`;
      });
    }
  };
}

// Load environment variables from .env into process.env so dev API handlers have credentials
if (fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  }
}

/**
 * Local dev server middleware for /api/* endpoints
 */
function apiDevPlugin() {
  return {
    name: "api-dev-server",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith("/api/")) return next();

        const urlObj = new URL(req.url, "http://localhost:5173");
        const cleanUrl = urlObj.pathname;
        const query = Object.fromEntries(urlObj.searchParams.entries());

        let bodyStr = "";
        req.on("data", (chunk) => (bodyStr += chunk));
        req.on("end", async () => {
          try {
            const body = bodyStr ? JSON.parse(bodyStr) : {};
            const vercelReq = Object.assign(req, { body, query });

            const vercelRes = Object.assign(res, {
              status(code) {
                res.statusCode = code;
                return vercelRes;
              },
              json(data) {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(data));
                return vercelRes;
              },
              send(data) {
                res.end(data);
                return vercelRes;
              }
            });

            if (cleanUrl === "/api/register") {
              const { default: handler } = await import("./api/register.js");
              return handler(vercelReq, vercelRes);
            }
            if (cleanUrl === "/api/find-id") {
              const { default: handler } = await import("./api/find-id.js");
              return handler(vercelReq, vercelRes);
            }
            if (cleanUrl === "/api/stats") {
              const { default: handler } = await import("./api/stats.js");
              return handler(vercelReq, vercelRes);
            }
            if (cleanUrl === "/api/settings") {
              const { default: handler } = await import("./api/settings.js");
              return handler(vercelReq, vercelRes);
            }
            if (cleanUrl === "/api/matchday") {
              const { default: handler } = await import("./api/matchday.js");
              return handler(vercelReq, vercelRes);
            }
            if (cleanUrl === "/api/branch-stats") {
              const { default: handler } = await import("./api/branch-stats.js");
              return handler(vercelReq, vercelRes);
            }
            if (cleanUrl.startsWith("/api/card/")) {
              const token = cleanUrl.replace("/api/card/", "").trim();
              const { createClient } = await import("@supabase/supabase-js");
              const supabase = createClient(
                process.env.VITE_SUPABASE_URL || "",
                process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ""
              );

              const { data: player, error } = await supabase
                .from("players")
                .select("registration_id, full_name, primary_role, branch, year, program, photo_url")
                .eq("public_token", token)
                .maybeSingle();

              if (error || !player) {
                return vercelRes.status(404).json({ error: "Player not found" });
              }

              if (query.format === "json") {
                return vercelRes.status(200).json({ player });
              }

              // Return an SVG Player Pass image
              const photoSvg = player.photo_url
                ? `<image href="${player.photo_url}" x="80" y="200" width="220" height="220" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo-clip)"/>`
                : `<rect x="80" y="200" width="220" height="220" rx="24" fill="#0A140F"/><text x="190" y="320" fill="#31D47B" font-size="64" font-weight="900" text-anchor="middle" font-family="system-ui, sans-serif">🏏</text>`;

              const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050807"/>
      <stop offset="50%" stop-color="#0B150F"/>
      <stop offset="100%" stop-color="#030604"/>
    </linearGradient>
    <clipPath id="photo-clip">
      <rect x="80" y="200" width="220" height="220" rx="24"/>
    </clipPath>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <rect x="40" y="40" width="1000" height="1270" rx="32" fill="none" stroke="#31D47B" stroke-width="3" stroke-opacity="0.5"/>
  <rect x="70" y="80" width="340" height="44" rx="22" fill="#31D47B" fill-opacity="0.12" stroke="#31D47B" stroke-opacity="0.4"/>
  <circle cx="95" cy="102" r="6" fill="#31D47B"/>
  <text x="115" y="108" fill="#31D47B" font-size="18" font-weight="bold" font-family="monospace">OFFICIAL TRIAL PASS · 2026</text>
  <text x="1010" y="110" fill="#F4F1E8" font-size="24" font-weight="800" text-anchor="end" font-family="system-ui, sans-serif">VJTI CRICKET CLUB</text>
  <line x1="70" y1="150" x2="1010" y2="150" stroke="#ffffff" stroke-opacity="0.15"/>
  ${photoSvg}
  <rect x="80" y="200" width="220" height="220" rx="24" fill="none" stroke="#31D47B" stroke-width="3"/>
  <text x="340" y="225" fill="#A7B2AC" font-size="16" font-family="monospace" font-weight="bold">REGISTERED CANDIDATE</text>
  <text x="340" y="275" fill="#F4F1E8" font-size="44" font-family="system-ui, sans-serif" font-weight="900">${(player.full_name || '').toUpperCase()}</text>
  <rect x="340" y="305" width="670" height="85" rx="16" fill="#31D47B" fill-opacity="0.12" stroke="#31D47B" stroke-opacity="0.5" stroke-width="2"/>
  <text x="365" y="335" fill="#A7B2AC" font-size="14" font-family="monospace" font-weight="bold">REGISTRATION ID</text>
  <text x="365" y="375" fill="#31D47B" font-size="40" font-family="monospace" font-weight="900">${player.registration_id}</text>
  <rect x="80" y="460" width="440" height="90" rx="16" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.1"/>
  <text x="105" y="490" fill="#8F9D95" font-size="14" font-family="monospace" font-weight="bold">PRIMARY ROLE</text>
  <text x="105" y="525" fill="#D4FF52" font-size="26" font-family="system-ui, sans-serif" font-weight="bold">${(player.primary_role || '').toUpperCase()}</text>
  <rect x="560" y="460" width="440" height="90" rx="16" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.1"/>
  <text x="585" y="490" fill="#8F9D95" font-size="14" font-family="monospace" font-weight="bold">ACADEMIC PROGRAM</text>
  <text x="585" y="525" fill="#F4F1E8" font-size="22" font-family="system-ui, sans-serif" font-weight="bold">${(player.branch || '')} · ${(player.year || '')}</text>
  <rect x="80" y="590" width="920" height="420" rx="24" fill="#000000" fill-opacity="0.4" stroke="#31D47B" stroke-opacity="0.3"/>
  <text x="120" y="660" fill="#31D47B" font-size="18" font-family="monospace" font-weight="bold">● SELECTION TRIALS INFORMATION</text>
  <text x="120" y="730" fill="#D4FF52" font-size="34" font-family="system-ui, sans-serif" font-weight="900">SAT 31 OCT &amp; SUN 01 NOV 2026</text>
  <text x="120" y="790" fill="#F4F1E8" font-size="24" font-family="system-ui, sans-serif">VJTI Cricket Ground, Matunga, Mumbai</text>
  <text x="120" y="850" fill="#F4F1E8" font-size="20" font-family="monospace">COMPULSORY: FULL WHITES &amp; CRICKET GEAR</text>
  <text x="120" y="910" fill="#A7B2AC" font-size="18" font-family="monospace">Show your Registration ID ${player.registration_id} at the check-in desk.</text>
  <line x1="80" y1="1230" x2="1000" y2="1230" stroke="#ffffff" stroke-opacity="0.1"/>
  <text x="80" y="1270" fill="#64716A" font-size="14" font-family="monospace">VEERMATA JIJABAI TECHNOLOGICAL INSTITUTE · CRICKET COMMITTEE</text>
  <text x="1000" y="1270" fill="#64716A" font-size="14" font-family="monospace" text-anchor="end">NON-TRANSFERABLE</text>
</svg>`;

              res.setHeader("Content-Type", "image/svg+xml");
              res.setHeader("Cache-Control", "public, s-maxage=3600");
              return res.end(svgContent);
            }
            next();
          } catch (err) {
            console.error("API Dev Error:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: /** @type {Error} */ (err).message }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    htmlPartialsPlugin(),
    apiDevPlugin()
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@config": resolve(__dirname, "./config"),
      "@lib": resolve(__dirname, "./lib")
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        register: resolve(__dirname, "register.html"),
        findId: resolve(__dirname, "find-id.html"),
        squad: resolve(__dirname, "squad.html"),
        schedule: resolve(__dirname, "schedule.html"),
        rules: resolve(__dirname, "rules.html"),
        selection: resolve(__dirname, "selection.html"),
        announcements: resolve(__dirname, "announcements.html"),
        privacy: resolve(__dirname, "privacy.html"),
        notFound: resolve(__dirname, "404.html"),
        styleguide: resolve(__dirname, "styleguide.html"),
        orgLogin: resolve(__dirname, "organizer/login.html"),
        orgDashboard: resolve(__dirname, "organizer/index.html"),
        orgPlayers: resolve(__dirname, "organizer/players.html"),
        orgTrials: resolve(__dirname, "organizer/trials.html"),
        orgGround: resolve(__dirname, "organizer/ground.html"),
        orgDesk: resolve(__dirname, "organizer/desk.html"),
        orgShortlist: resolve(__dirname, "organizer/shortlist.html"),
        orgAnnouncements: resolve(__dirname, "organizer/announcements.html"),
        orgAnalytics: resolve(__dirname, "organizer/analytics.html"),
        orgSettings: resolve(__dirname, "organizer/settings.html")
      }
    }
  }
});
