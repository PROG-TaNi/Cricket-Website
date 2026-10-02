// @ts-check
import { siteConfig } from "../core/config.js";

const ANNOUNCEMENTS_KEY = "vjti_announcements_cache";

// Default announcements (used if no custom ones exist)
const DEFAULT_ANNOUNCEMENTS = [
  {
    id: "ann-default-1",
    category: "IMPORTANT",
    priority: "high",
    title: "Trial Reporting Guidelines & Dress Code",
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    body: "All players are reminded that full cricket whites are compulsory. Check-in desks open 45 minutes prior to slot times at VJTI Cricket Ground.",
  },
  {
    id: "ann-default-2",
    category: "EQUIPMENT",
    priority: "normal",
    title: "Kit & Safety Gear Recommendations",
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    body: "Batters and keepers are strongly advised to carry helmets and guards. Limited communal batting pads will be available on request.",
  },
  {
    id: "ann-default-3",
    category: "VENUE",
    priority: "normal",
    title: "VJTI Cricket Ground Location Details",
    created_at: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    body: "Trials will be conducted at the VJTI Cricket Ground, featuring one centre wicket. Please arrive 30 minutes before your scheduled slot.",
  }
];

/**
 * Get announcements from localStorage (synced with admin)
 */
function getAnnouncements() {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    if (raw) {
      const announcements = JSON.parse(raw);
      return announcements.length > 0 ? announcements : DEFAULT_ANNOUNCEMENTS;
    }
  } catch (_) {
    console.warn("Failed to load announcements from cache");
  }
  return DEFAULT_ANNOUNCEMENTS;
}

/**
 * Calculate relative time string
 */
function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 7) return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  if (diffDays > 1) return `${diffDays} days ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffHours > 1) return `${diffHours} hours ago`;
  if (diffHours === 1) return "1 hour ago";
  if (diffMins > 1) return `${diffMins} minutes ago`;
  return "Just now";
}

export function initAnnouncements() {
  const container = document.getElementById("announcements-feed");
  if (!container) return;

  const announcements = getAnnouncements();

  if (announcements.length === 0) {
    container.innerHTML = `
      <div class="glass-panel p-8 text-center text-[#A7B2AC] max-w-md mx-auto">
        <p class="font-mono text-sm">No announcements right now. You're all caught up.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = announcements.map((a, index) => {
    const isHigh = a.category === "Urgent" || a.priority === "high";
    const isNew = index < 2; // Mark first 2 as new
    const relativeTime = getRelativeTime(a.created_at);

    return `
      <div class="glass-panel p-6 flex flex-col justify-between transition-all duration-300 hover:border-white/20 ${
        isHigh ? "border-[#31D47B]/40 bg-[#0c1a12]/80 shadow-[0_0_20px_rgba(49,212,123,0.1)]" : "border-white/10"
      }">
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase ${
              isHigh ? "bg-[#31D47B]/20 text-[#31D47B] border border-[#31D47B]/30" : "bg-white/10 text-[#A7B2AC]"
            }">
              ${a.category || "GENERAL"}
            </span>
            <div class="flex items-center gap-2">
              ${isNew ? '<span class="px-1.5 py-0.5 rounded bg-[#B5121B] text-white text-[9px] font-mono font-bold uppercase tracking-wider">NEW</span>' : ''}
              <span class="font-mono text-[10px] text-[#64716A]">${relativeTime}</span>
            </div>
          </div>
          <h3 class="font-display font-bold text-xl text-[#F4F1E8] mb-2">${a.title}</h3>
          <p class="text-sm text-[#A7B2AC] leading-relaxed whitespace-pre-line">${a.body}</p>
        </div>
      </div>
    `;
  }).join("");
}
