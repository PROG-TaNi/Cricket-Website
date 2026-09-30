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
    title: "Reporting Time Announced: 07:30 AM Sharp",
    body: "All registered players for Trial Day 1 (Saturday 10 October 2026) must report to the VJTI Cricket Ground Pavilion by 07:30 AM in complete whites. Warm-ups begin at 08:00 AM.",
    category: "Schedule",
    created_at: "2026-09-29T10:00:00Z"
  },
  {
    id: "ann-02",
    title: "Mandatory Safety Equipment for Batters & Keepers",
    body: "Due to hard leather-ball play, all batters and wicketkeepers must carry helmets and abdomen guards. Limited common safety gear is available at the pavilion desk.",
    category: "Urgent",
    created_at: "2026-09-28T14:30:00Z"
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
          🗑️ Remove
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
