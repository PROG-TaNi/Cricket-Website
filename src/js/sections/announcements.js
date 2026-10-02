// @ts-check
import { siteConfig } from "../core/config.js";

// Mock announcements for Phase 3 before live Supabase subscription in Phase 4
const MOCK_ANNOUNCEMENTS = [
  {
    id: "ann-1",
    category: "IMPORTANT",
    priority: "high",
    title: "Trial Reporting Guidelines & Dress Code",
    relativeTime: "1 day ago",
    message: "All players are reminded that full cricket whites are compulsory. Check-in desks open 45 minutes prior to slot times at VJTI Cricket Ground.",
    isNew: true
  },
  {
    id: "ann-2",
    category: "EQUIPMENT",
    priority: "normal",
    title: "Kit & Safety Gear Recommendations",
    relativeTime: "2 days ago",
    message: "Batters and keepers are strongly advised to carry helmets and guards. Limited communal batting pads will be available on request.",
    isNew: true
  },
  {
    id: "ann-3",
    category: "VENUE",
    priority: "normal",
    title: "VJTI Cricket Ground",
    relativeTime: "4 days ago",
    message: "One centre wicket.",
    isNew: false
  }
];

export function initAnnouncements() {
  const container = document.getElementById("announcements-feed");
  if (!container) return;

  if (MOCK_ANNOUNCEMENTS.length === 0) {
    container.innerHTML = `
      <div class="glass-panel p-8 text-center text-[#A7B2AC] max-w-md mx-auto">
        <p class="font-mono text-sm">No announcements right now. You're all caught up.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = MOCK_ANNOUNCEMENTS.map((a) => {
    const isHigh = a.priority === "high";
    return `
      <div class="glass-panel p-6 flex flex-col justify-between transition-all duration-300 hover:border-white/20 ${
        isHigh ? "border-[#31D47B]/40 bg-[#0c1a12]/80 shadow-[0_0_20px_rgba(49,212,123,0.1)]" : "border-white/10"
      }">
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${
              isHigh ? "bg-[#31D47B]/20 text-[#31D47B] border border-[#31D47B]/30" : "bg-white/10 text-[#A7B2AC]"
            }">
              ${a.category}
            </span>
            <div class="flex items-center gap-2">
              ${a.isNew ? '<span class="px-1.5 py-0.5 rounded bg-[#B5121B] text-white text-[9px] font-mono font-bold uppercase tracking-wider">NEW</span>' : ''}
              <span class="font-mono text-[10px] text-[#64716A]">${a.relativeTime}</span>
            </div>
          </div>
          <h3 class="font-display font-bold text-xl text-[#F4F1E8] mb-2">${a.title}</h3>
          <p class="text-sm text-[#A7B2AC] leading-relaxed">${a.message}</p>
        </div>
      </div>
    `;
  }).join("");
}
