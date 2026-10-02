// @ts-check
/**
 * Organizer Layout & Navigation Header
 * Injects consistent responsive navigation, active tab highlight, session badge, and logout.
 */

import { getOrganizerSession, logoutOrganizer } from "./auth.js";
import { initMobileEnhancements } from "./mobile-enhancements.js";

/**
 * Get SVG icon for navigation items
 * @param {string} name
 * @returns {string}
 */
function getNavIcon(name) {
  const icons = {
    overview: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>',
    players: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>',
    ground: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>',
    trials: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>',
    desk: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>',
    shortlist: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>',
    announcements: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>',
    analytics: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>',
    settings: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>'
  };
  return icons[name] || '';
}

const NAV_ITEMS = [
  { href: "/organizer/index.html", label: "Overview", iconName: "overview" },
  { href: "/organizer/players.html", label: "Players", iconName: "players" },
  { href: "/organizer/ground.html", label: "Ground Mode", iconName: "ground" },
  { href: "/organizer/trials.html", label: "Trials & Nets", iconName: "trials" },
  { href: "/organizer/desk.html", label: "Selectors' Desk", iconName: "desk" },
  { href: "/organizer/shortlist.html", label: "Shortlist", iconName: "shortlist" },
  { href: "/organizer/announcements.html", label: "Announcements", iconName: "announcements" },
  { href: "/organizer/analytics.html", label: "Analytics", iconName: "analytics" },
  { href: "/organizer/settings.html", label: "Settings", iconName: "settings" }
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
    <header class="border-b border-white/10 bg-[#07100B]/95 backdrop-blur-md sticky top-0 z-40 relative">
      <!-- Top Bar -->
      <div class="border-b border-white/5">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-14">
            
            <!-- Left: Brand -->
            <a href="/organizer/index.html" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div class="w-9 h-9 rounded-full bg-white p-0.5 flex items-center justify-center border border-white/20 overflow-hidden shadow-lg">
                <img src="/brand/vjti-logo.png" alt="VJTI Logo" class="w-full h-full object-contain rounded-full" width="36" height="36" />
              </div>
              <div class="leading-tight">
                <span class="font-display font-black text-xl tracking-wide text-white block">VJTI CRICKET</span>
                <span class="font-mono text-[10px] uppercase tracking-[0.2em] text-[#31D47B]">Ops Dashboard</span>
              </div>
            </a>

            <!-- Right: Session info & Actions -->
            <div class="flex items-center gap-4">
              <div class="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                <div class="flex flex-col text-right">
                  <span class="font-mono text-sm font-semibold text-white">${session.email.split("@")[0]}</span>
                  <span class="font-mono text-[10px] text-[#A7B2AC] tracking-wider uppercase">${session.role || "Organizer"}</span>
                </div>
                <div class="w-2 h-2 rounded-full bg-[#31D47B] animate-pulse"></div>
              </div>
              
              <a 
                href="/" 
                target="_blank"
                class="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-mono font-medium text-[#A7B2AC] hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all hover:border-white/20"
                title="View Public Site"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Public</span>
              </a>

              <button 
                id="org-logout-btn" 
                type="button" 
                class="px-4 py-2 text-sm font-mono font-medium text-[#ff6b6b] hover:bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 rounded-lg transition-all hover:border-[#ff6b6b]/50"
                title="Sign Out"
              >
                Logout
              </button>

              <!-- Mobile Hamburger Button -->
              <button 
                id="org-mobile-menu-btn" 
                type="button" 
                class="lg:hidden p-2 text-[#A7B2AC] hover:text-white transition-colors"
                aria-label="Toggle Navigation"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- Navigation Bar -->
      <div class="hidden lg:block">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav class="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide" aria-label="Organizer tabs">
            ${NAV_ITEMS.map((item) => {
              const isActive = currentNormalized.endsWith(item.href) || (item.href.endsWith("index.html") && currentNormalized.endsWith("/organizer"));
              return `
                <a 
                  href="${item.href}" 
                  class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono font-medium whitespace-nowrap transition-all ${
                    isActive 
                      ? "bg-[#31D47B]/15 text-[#31D47B] border border-[#31D47B]/30 shadow-sm" 
                      : "text-[#A7B2AC] hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
                  }"
                  ${isActive ? 'aria-current="page"' : ""}
                >
                  ${getNavIcon(item.iconName)}
                  <span>${item.label}</span>
                </a>
              `;
            }).join("")}
          </nav>
        </div>
      </div>

      <!-- Mobile Navigation Drawer -->
      <div id="org-mobile-drawer" class="hidden lg:hidden border-t border-white/10 bg-[#0B120E] px-4 py-4 absolute left-0 right-0 top-full shadow-2xl z-50">
        <div class="space-y-1.5 mb-4">
          ${NAV_ITEMS.map((item) => {
            const isActive = currentNormalized.endsWith(item.href) || (item.href.endsWith("index.html") && currentNormalized.endsWith("/organizer"));
            return `
              <a 
                href="${item.href}" 
                class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono font-medium transition-all ${
                  isActive 
                    ? "bg-[#31D47B]/15 text-[#31D47B] border border-[#31D47B]/30" 
                    : "text-[#A7B2AC] hover:text-white hover:bg-white/5 border border-transparent"
                }"
              >
                ${getNavIcon(item.iconName)}
                <span>${item.label}</span>
              </a>
            `;
          }).join("")}
        </div>
        
        <div class="pt-4 border-t border-white/10 space-y-3">
          <div class="flex items-center justify-between px-4 py-3 bg-white/5 rounded-lg">
            <div>
              <div class="font-mono text-sm font-semibold text-white">${session.email.split("@")[0]}</div>
              <div class="font-mono text-[10px] text-[#A7B2AC] uppercase tracking-wider">${session.role || "Organizer"}</div>
            </div>
            <div class="w-2 h-2 rounded-full bg-[#31D47B] animate-pulse"></div>
          </div>
          <a href="/" target="_blank" class="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-mono text-[#31D47B] border border-[#31D47B]/30 rounded-lg hover:bg-[#31D47B]/5 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>View Public Website</span>
          </a>
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
  
  if (mobileBtn && mobileDrawer) {
    mobileBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isHidden = mobileDrawer.classList.contains("hidden");
      
      if (isHidden) {
        mobileDrawer.classList.remove("hidden");
        // Change hamburger to X icon
        mobileBtn.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        `;
      } else {
        mobileDrawer.classList.add("hidden");
        // Change X back to hamburger icon
        mobileBtn.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        `;
      }
    });

    // Close drawer when clicking outside
    document.addEventListener("click", (e) => {
      if (!mobileDrawer.classList.contains("hidden") && 
          !mobileDrawer.contains(e.target) && 
          !mobileBtn.contains(e.target)) {
        mobileDrawer.classList.add("hidden");
        mobileBtn.innerHTML = `
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        `;
      }
    });

    // Close drawer when navigating to a new page
    mobileDrawer.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        mobileDrawer.classList.add("hidden");
      });
    });
  }

  // Initialize mobile enhancements
  initMobileEnhancements();
}
