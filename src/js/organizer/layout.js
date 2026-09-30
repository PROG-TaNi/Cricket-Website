// @ts-check
/**
 * Organizer Layout & Navigation Header
 * Injects consistent responsive navigation, active tab highlight, session badge, and logout.
 */

import { getOrganizerSession, logoutOrganizer } from "./auth.js";

const NAV_ITEMS = [
  { href: "/organizer/index.html", label: "Overview", icon: "📊" },
  { href: "/organizer/players.html", label: "Players", icon: "👥" },
  { href: "/organizer/ground.html", label: "Ground Mode", icon: "⚡" },
  { href: "/organizer/trials.html", label: "Trials & Nets", icon: "🏏" },
  { href: "/organizer/desk.html", label: "Selectors' Desk", icon: "📋" },
  { href: "/organizer/announcements.html", label: "Announcements", icon: "📢" },
  { href: "/organizer/analytics.html", label: "Analytics", icon: "📈" },
  { href: "/organizer/settings.html", label: "Settings", icon: "⚙️" }
];

/**
 * Initializes the organizer layout and guards the page.
 * @param {string} currentPath
 */
export async function initOrganizerLayout(currentPath) {
  // 1. Guard page
  const session = await getOrganizerSession(true);
  if (!session) return;

  // 2. Render navbar into #org-header if present
  const headerContainer = document.getElementById("org-header");
  if (!headerContainer) return;

  const currentNormalized = currentPath.replace(/\/$/, "");

  headerContainer.innerHTML = `
    <header class="border-b border-white/10 bg-[#07100B]/95 backdrop-blur-md sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          
          <!-- Left: Brand & Title -->
          <div class="flex items-center gap-3">
            <a href="/organizer/index.html" class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-full bg-white/10 p-0.5 flex items-center justify-center border border-white/20">
                <svg viewBox="0 0 100 100" class="w-full h-full" fill="none">
                  <circle cx="50" cy="50" r="48" fill="#F4F1E8" stroke="#0F6B3D" stroke-width="3"/>
                  <text x="50" y="58" fill="#0B120E" font-family="'Barlow Condensed', sans-serif" font-weight="900" font-size="28" text-anchor="middle">V</text>
                </svg>
              </div>
              <div class="leading-none">
                <span class="font-display font-black text-lg tracking-wide text-white block">VJTI CRICKET</span>
                <span class="font-mono text-[9px] uppercase tracking-widest text-[#31D47B]">Ops Dashboard</span>
              </div>
            </a>
          </div>

          <!-- Center: Desktop Nav Tabs -->
          <nav class="hidden lg:flex items-center gap-1" aria-label="Organizer tabs">
            ${NAV_ITEMS.map((item) => {
              const isActive = currentNormalized.endsWith(item.href) || (item.href.endsWith("index.html") && currentNormalized.endsWith("/organizer"));
              return `
                <a 
                  href="${item.href}" 
                  class="px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
                    isActive 
                      ? "bg-[#31D47B]/15 text-[#31D47B] border border-[#31D47B]/30" 
                      : "text-[#A7B2AC] hover:text-white hover:bg-white/5"
                  }"
                  ${isActive ? 'aria-current="page"' : ""}
                >
                  <span class="text-sm" aria-hidden="true">${item.icon}</span>
                  <span>${item.label}</span>
                </a>
              `;
            }).join("")}
          </nav>

          <!-- Right: Session info, public link, logout -->
          <div class="flex items-center gap-3">
            <div class="hidden sm:flex flex-col text-right">
              <span class="font-mono text-xs text-white">${session.email.split("@")[0]}</span>
              <span class="font-mono text-[9px] text-[#A7B2AC]">${session.role || "Organizer"}</span>
            </div>
            
            <a 
              href="/" 
              target="_blank"
              class="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-[#A7B2AC] hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
              title="View Public Site"
            >
              <span>Public Site</span>
              <span class="text-[10px]">↗</span>
            </a>

            <button 
              id="org-logout-btn" 
              type="button" 
              class="px-2.5 py-1 text-xs font-mono text-[#ff6b6b] hover:bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-lg transition-colors"
              title="Sign Out"
            >
              Logout
            </button>

            <!-- Mobile Hamburger Button -->
            <button 
              id="org-mobile-menu-btn" 
              type="button" 
              class="lg:hidden p-2 text-[#A7B2AC] hover:text-white"
              aria-label="Toggle Navigation"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>

        </div>
      </div>

      <!-- Mobile Navigation Drawer -->
      <div id="org-mobile-drawer" class="hidden lg:hidden border-t border-white/10 bg-[#07100B] px-4 py-3 space-y-1">
        ${NAV_ITEMS.map((item) => {
          const isActive = currentNormalized.endsWith(item.href) || (item.href.endsWith("index.html") && currentNormalized.endsWith("/organizer"));
          return `
            <a 
              href="${item.href}" 
              class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-mono ${
                isActive 
                  ? "bg-[#31D47B]/15 text-[#31D47B]" 
                  : "text-[#A7B2AC] hover:text-white hover:bg-white/5"
              }"
            >
              <span class="text-base">${item.icon}</span>
              <span>${item.label}</span>
            </a>
          `;
        }).join("")}
        <div class="pt-2 border-t border-white/10 flex justify-between items-center px-1">
          <a href="/" target="_blank" class="text-xs font-mono text-[#31D47B]">← Public Website</a>
          <span class="text-xs font-mono text-[#A7B2AC]">${session.email}</span>
        </div>
      </div>
    </header>
  `;

  // Attach event listeners
  document.getElementById("org-logout-btn")?.addEventListener("click", () => {
    if (confirm("Sign out of VJTI Cricket Ops?")) {
      logoutOrganizer();
    }
  });

  const mobileBtn = document.getElementById("org-mobile-menu-btn");
  const mobileDrawer = document.getElementById("org-mobile-drawer");
  mobileBtn?.addEventListener("click", () => {
    mobileDrawer?.classList.toggle("hidden");
  });
}
