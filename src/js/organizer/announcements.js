// @ts-check
/**
 * Organizer Announcements Controller
 */

import "../../css/main.css";
import { initOrganizerLayout } from "./layout.js";
import { toastMsg } from "../components/toast.js";

const ANNOUNCEMENTS_KEY = "vjti_announcements_cache";

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: "ann-01",
    title: "Trial Reporting Guidelines & Dress Code",
    body: "All players are reminded that full cricket whites are compulsory. Check-in desks open 45 minutes prior to slot times at VJTI Cricket Ground.",
    category: "Urgent",
    created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    id: "ann-02",
    title: "Kit & Safety Gear Recommendations",
    body: "Batters and keepers are strongly advised to carry helmets and guards. Limited communal batting pads will be available on request.",
    category: "General",
    created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  },
  {
    id: "ann-03",
    title: "VJTI Cricket Ground Location Details",
    body: "Trials will be conducted at the VJTI Cricket Ground, featuring one centre wicket. Please arrive 30 minutes before your scheduled slot.",
    category: "General",
    created_at: new Date(Date.now() - 345600000).toISOString() // 4 days ago
  }
];

/**
 * Get announcements
 * @returns {Array<any>}
 */
function getAnnouncements() {
  try {
    const raw = localStorage.getItem(ANNOUNCEMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(DEFAULT_ANNOUNCEMENTS));
  return [...DEFAULT_ANNOUNCEMENTS];
}

/**
 * Render announcements list
 * @param {Array<any>} list
 */
function renderList(list) {
  const container = document.getElementById("announcements-list");
  const countEl = document.getElementById("ann-count");
  if (countEl) countEl.textContent = `${list.length} published`;

  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<div class="p-6 text-center text-[#64716A] font-mono text-xs">No active broadcasts.</div>`;
    return;
  }

  container.innerHTML = list.map((a) => {
    const isUrgent = a.category === "Urgent";
    const badgeStyle = isUrgent 
      ? "bg-red-500/20 text-red-400 border-red-500/30" 
      : "bg-[#31D47B]/20 text-[#31D47B] border-[#31D47B]/30";

    return `
      <div class="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeStyle}">
              ${a.category.toUpperCase()}
            </span>
            <span class="text-[10px] font-mono text-[#64716A]">
              ${new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          </div>
          <h3 class="font-display font-black text-lg text-white">${a.title}</h3>
          <p class="text-xs text-[#A7B2AC] font-mono whitespace-pre-line">${a.body}</p>
        </div>
        <button 
          class="delete-ann-btn self-start sm:self-auto text-xs font-mono text-red-400 hover:text-red-300 p-2 hover:bg-white/5 rounded-lg transition-colors"
          data-id="${a.id}"
          title="Delete announcement"
        >
          <svg class="w-3.5 h-3.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Remove
        </button>
      </div>
    `;
  }).join("");

  // Attach delete buttons
  container.querySelectorAll(".delete-ann-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      if (confirm("Remove this announcement from the public feed?")) {
        const updated = list.filter((item) => item.id !== id);
        localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(updated));
        toastMsg("Announcement removed.", "info");
        renderList(updated);
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await initOrganizerLayout(window.location.pathname);

  let announcements = getAnnouncements();
  renderList(announcements);

  const form = /** @type {HTMLFormElement | null} */ (document.getElementById("create-announcement-form"));
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const titleInput = /** @type {HTMLInputElement | null} */ (document.getElementById("ann-title"));
    const categoryInput = /** @type {HTMLSelectElement | null} */ (document.getElementById("ann-category"));
    const bodyInput = /** @type {HTMLTextAreaElement | null} */ (document.getElementById("ann-body"));

    const newAnn = {
      id: `ann-${Date.now()}`,
      title: titleInput?.value || "",
      category: categoryInput?.value || "General",
      body: bodyInput?.value || "",
      created_at: new Date().toISOString()
    };

    announcements.unshift(newAnn);
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
    renderList(announcements);
    form.reset();
    toastMsg("Announcement published to public site!", "success");
  });
});
