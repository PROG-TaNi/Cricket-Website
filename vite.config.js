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

export default defineConfig({
  plugins: [
    tailwindcss(),
    htmlPartialsPlugin()
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
        privacy: resolve(__dirname, "privacy.html"),
        notFound: resolve(__dirname, "404.html"),
        styleguide: resolve(__dirname, "styleguide.html"),
        orgLogin: resolve(__dirname, "organizer/login.html"),
        orgDashboard: resolve(__dirname, "organizer/index.html"),
        orgPlayers: resolve(__dirname, "organizer/players.html"),
        orgTrials: resolve(__dirname, "organizer/trials.html"),
        orgGround: resolve(__dirname, "organizer/ground.html"),
        orgDesk: resolve(__dirname, "organizer/desk.html"),
        orgAnnouncements: resolve(__dirname, "organizer/announcements.html"),
        orgAnalytics: resolve(__dirname, "organizer/analytics.html"),
        orgSettings: resolve(__dirname, "organizer/settings.html")
      }
    }
  }
});
