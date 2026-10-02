// @ts-check
/**
 * Organizer Players Roster Controller
 * Handles table filtering, sorting, slide-over evaluation drawer, attendance toggles, and CSV export.
 */

import "../../css/main.css";
import { initOrganizerLayout } from "./layout.js";
import { getPlayers, updatePlayer } from "./data.js";
import { exportPlayersToCSV } from "./dashboard.js";
import { toastMsg } from "../components/toast.js";

/** @type {Array<any>} */
let allPlayers = [];
/** @type {Array<any>} */
let filteredPlayers = [];
/** @type {any | null} */
let activeDrawerPlayer = null;

// DOM references
const tbody = document.getElementById("players-tbody");
const searchInput = /** @type {HTMLInputElement | null} */ (document.getElementById("player-search-input"));
const filterRole = /** @type {HTMLSelectElement | null} */ (document.getElementById("filter-role"));
const filterStatus = /** @type {HTMLSelectElement | null} */ (document.getElementById("filter-status"));
const filterDay1 = /** @type {HTMLSelectElement | null} */ (document.getElementById("filter-day1"));
const filterProgram = /** @type {HTMLSelectElement | null} */ (document.getElementById("filter-program"));
const filterBatch = /** @type {HTMLSelectElement | null} */ (document.getElementById("filter-batch"));
const countMatchedEl = document.getElementById("players-count-matched");
const countTotalEl = document.getElementById("players-count-total");

// Drawer DOM references
const drawer = document.getElementById("player-drawer");
const drawerOverlay = document.getElementById("player-drawer-overlay");
const closeDrawerBtn = document.getElementById("close-drawer-btn");
const drawerRegId = document.getElementById("drawer-reg-id");
const drawerName = document.getElementById("drawer-name");
const drawerProgramYear = document.getElementById("drawer-program-year");
const drawerRegNo = document.getElementById("drawer-reg-no");
const drawerBranch = document.getElementById("drawer-branch");
const drawerWaLink = /** @type {HTMLAnchorElement | null} */ (document.getElementById("drawer-wa-link"));
const drawerRole = document.getElementById("drawer-role");
const drawerBatting = document.getElementById("drawer-batting");
const drawerBowling = document.getElementById("drawer-bowling");
const drawerExperience = document.getElementById("drawer-experience");
const drawerDay1Select = /** @type {HTMLSelectElement | null} */ (document.getElementById("drawer-day1-select"));
const drawerDay2Select = /** @type {HTMLSelectElement | null} */ (document.getElementById("drawer-day2-select"));
const drawerRatingSlider = /** @type {HTMLInputElement | null} */ (document.getElementById("drawer-rating-slider"));
const drawerRatingVal = document.getElementById("drawer-rating-val");
const drawerBatchSelect = /** @type {HTMLSelectElement | null} */ (document.getElementById("drawer-batch-select"));
const drawerNetSelect = /** @type {HTMLSelectElement | null} */ (document.getElementById("drawer-net-select"));
const drawerNotes = /** @type {HTMLTextAreaElement | null} */ (document.getElementById("drawer-notes"));
const drawerStatusSelect = /** @type {HTMLSelectElement | null} */ (document.getElementById("drawer-status-select"));
const savePlayerBtn = document.getElementById("save-player-btn");

/**
 * Filter players based on search and dropdown values
 */
function applyFilters() {
  const query = (searchInput?.value || "").toLowerCase().trim();
  const role = filterRole?.value || "";
  const status = filterStatus?.value || "";
  const day1 = filterDay1?.value || "";
  const program = filterProgram?.value || "";
  const batch = filterBatch?.value || "";

  filteredPlayers = allPlayers.filter((p) => {
    // Search query
    if (query) {
      const matchSearch =
        (p.full_name || "").toLowerCase().includes(query) ||
        (p.registration_id || "").toLowerCase().includes(query) ||
        (p.reg_no || "").toLowerCase().includes(query) ||
        (p.whatsapp_number || "").includes(query);
      if (!matchSearch) return false;
    }

    // Role
    if (role && p.primary_role !== role) return false;

    // Status
    if (status && p.status !== status) return false;

    // Day 1 Attendance
    if (day1 && p.day1_attendance !== day1) return false;

    // Program
    if (program && p.program !== program) return false;

    // Batch
    if (batch && p.trial_batch !== batch) return false;

    return true;
  });

  renderTable();
}

/**
 * Render filtered players into the table
 */
function renderTable() {
  if (!tbody) return;

  if (countMatchedEl) countMatchedEl.textContent = String(filteredPlayers.length);
  if (countTotalEl) countTotalEl.textContent = String(allPlayers.length);

  if (filteredPlayers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="p-8 text-center text-[#A7B2AC] font-mono">
          No candidates match the current filters.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredPlayers.map((p) => {
    const isShortlisted = p.status === "shortlisted";
    const statusBadge = 
      isShortlisted ? "bg-[#31D47B]/20 text-[#31D47B] border-[#31D47B]/40" :
      p.status === "in_trials" ? "bg-[#D4FF52]/15 text-[#D4FF52] border-[#D4FF52]/30" :
      p.status === "waitlisted" ? "bg-amber-500/15 text-amber-300 border-amber-500/30" :
      p.status === "rejected" ? "bg-red-500/15 text-red-400 border-red-500/30" :
      "bg-white/5 text-[#A7B2AC] border-white/10";

    const day1Badge = 
      p.day1_attendance === "present" ? "text-[#31D47B] bg-[#31D47B]/10 font-bold" :
      p.day1_attendance === "late" ? "text-[#D4FF52] bg-[#D4FF52]/10" :
      p.day1_attendance === "absent" ? "text-red-400 bg-red-500/10" :
      "text-[#64716A]";

    const day2Badge = 
      p.day2_attendance === "present" ? "text-[#31D47B] bg-[#31D47B]/10 font-bold" :
      p.day2_attendance === "late" ? "text-[#D4FF52] bg-[#D4FF52]/10" :
      p.day2_attendance === "absent" ? "text-red-400 bg-red-500/10" :
      "text-[#64716A]";

    return `
      <tr 
        class="hover:bg-white/[0.04] cursor-pointer transition-colors" 
        data-reg-id="${p.registration_id}"
      >
        <td class="p-3.5 pl-5 font-mono font-bold text-[#31D47B] whitespace-nowrap">
          ${p.registration_id}
        </td>
        <td class="p-3.5 whitespace-nowrap">
          <div class="flex items-center gap-2.5">
            ${p.photo_url ? `<img src="${p.photo_url}" alt="${p.full_name}" class="w-7 h-7 rounded-full object-cover border border-[#31D47B]/40 flex-shrink-0" />` : `<div class="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0"><svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>`}
            <div>
              <div class="font-bold text-white text-xs">${p.full_name}</div>
              <div class="text-[10px] text-[#64716A] font-mono">${p.program} (${p.year})</div>
            </div>
          </div>
        </td>
        <td class="p-3.5 font-mono text-[#A7B2AC] whitespace-nowrap">
          ${p.reg_no}
        </td>
        <td class="p-3.5 whitespace-nowrap">
          <span class="inline-flex items-center gap-1.5 font-medium text-white">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              ${p.primary_role === "Batter" 
                ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />'
                : p.primary_role === "Bowler"
                ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />'
                : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z" />'}
            </svg>
            <span>${p.primary_role}</span>
          </span>
          <span class="block text-[10px] text-[#64716A]">${p.batting_style} · ${p.bowling_style}</span>
        </td>
        <td class="p-3.5 text-[#A7B2AC] whitespace-nowrap">
          ${p.branch}
        </td>
        <td class="p-3.5 text-center whitespace-nowrap font-mono text-[10px]">
          <span class="px-2 py-0.5 rounded ${day1Badge}">${p.day1_attendance.toUpperCase()}</span>
        </td>
        <td class="p-3.5 text-center whitespace-nowrap font-mono text-[10px]">
          <span class="px-2 py-0.5 rounded ${day2Badge}">${p.day2_attendance.toUpperCase()}</span>
        </td>
        <td class="p-3.5 text-center whitespace-nowrap font-mono text-[10px]">
          <span class="px-2.5 py-1 rounded-full border ${statusBadge}">${p.status.replace("_", " ").toUpperCase()}</span>
        </td>
        <td class="p-3.5 text-right pr-5 font-mono font-bold whitespace-nowrap">
          ${p.rating ? `<span class="text-[#31D47B]">${p.rating}</span><span class="text-[#64716A] text-[10px]">/10</span>` : `<span class="text-[#64716A]">—</span>`}
        </td>
      </tr>
    `;
  }).join("");

  // Attach row click events to open drawer
  tbody.querySelectorAll("tr[data-reg-id]").forEach((row) => {
    row.addEventListener("click", () => {
      const regId = row.getAttribute("data-reg-id");
      const player = allPlayers.find((p) => p.registration_id === regId);
      if (player) openDrawer(player);
    });
  });
}

/**
 * Open the candidate detail slide-over drawer
 * @param {any} player
 */
function openDrawer(player) {
  activeDrawerPlayer = player;

  if (drawerRegId) drawerRegId.textContent = player.registration_id;
  if (drawerName) drawerName.textContent = player.full_name;
  if (drawerProgramYear) drawerProgramYear.textContent = `${player.program} · ${player.year} Year`;
  if (drawerRegNo) drawerRegNo.textContent = player.reg_no;
  if (drawerBranch) drawerBranch.textContent = player.branch;

  const drawerPhotoImg = /** @type {HTMLImageElement | null} */ (document.getElementById("drawer-photo-img"));
  const drawerPhotoPlaceholder = document.getElementById("drawer-photo-placeholder");
  if (player.photo_url && drawerPhotoImg) {
    drawerPhotoImg.src = player.photo_url;
    drawerPhotoImg.classList.remove("hidden");
    drawerPhotoPlaceholder?.classList.add("hidden");
  } else {
    drawerPhotoImg?.classList.add("hidden");
    drawerPhotoPlaceholder?.classList.remove("hidden");
  }

  if (drawerWaLink) {
    const waClean = (player.whatsapp_number || "").replace(/\D/g, "");
    drawerWaLink.href = `https://wa.me/${waClean}?text=Hi%20${encodeURIComponent(player.full_name)},%20this%20is%20regarding%20VJTI%20Cricket%20Trials%202026.`;
  }

  if (drawerRole) drawerRole.textContent = player.primary_role;
  if (drawerBatting) drawerBatting.textContent = player.batting_style;
  if (drawerBowling) drawerBowling.textContent = player.bowling_style;
  if (drawerExperience) drawerExperience.textContent = player.experience || "No previous records stated.";

  if (drawerDay1Select) drawerDay1Select.value = player.day1_attendance || "pending";
  if (drawerDay2Select) drawerDay2Select.value = player.day2_attendance || "pending";

  const rating = player.rating || 7.0;
  if (drawerRatingSlider) drawerRatingSlider.value = String(rating);
  if (drawerRatingVal) drawerRatingVal.textContent = `${rating} / 10`;

  if (drawerBatchSelect) drawerBatchSelect.value = player.trial_batch || "Batch A";
  if (drawerNetSelect) drawerNetSelect.value = player.trial_net || "Net 1";

  if (drawerNotes) drawerNotes.value = player.notes || "";
  if (drawerStatusSelect) drawerStatusSelect.value = player.status || "registered";

  drawerOverlay?.classList.remove("hidden");
  drawer?.classList.remove("translate-x-full");
}

/**
 * Close drawer
 */
function closeDrawer() {
  drawer?.classList.add("translate-x-full");
  drawerOverlay?.classList.add("hidden");
  activeDrawerPlayer = null;
}

document.addEventListener("DOMContentLoaded", async () => {
  await initOrganizerLayout(window.location.pathname);

  allPlayers = await getPlayers();
  filteredPlayers = [...allPlayers];
  renderTable();

  // Filter & Search input handlers
  searchInput?.addEventListener("input", applyFilters);
  filterRole?.addEventListener("change", applyFilters);
  filterStatus?.addEventListener("change", applyFilters);
  filterDay1?.addEventListener("change", applyFilters);
  filterProgram?.addEventListener("change", applyFilters);
  filterBatch?.addEventListener("change", applyFilters);

  // Reset filters
  document.getElementById("reset-filters-btn")?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (filterRole) filterRole.value = "";
    if (filterStatus) filterStatus.value = "";
    if (filterDay1) filterDay1.value = "";
    if (filterProgram) filterProgram.value = "";
    if (filterBatch) filterBatch.value = "";
    applyFilters();
  });

  // Drawer rating slider real-time label update
  drawerRatingSlider?.addEventListener("input", () => {
    if (drawerRatingVal) drawerRatingVal.textContent = `${drawerRatingSlider.value} / 10`;
  });

  // Drawer Close handlers
  closeDrawerBtn?.addEventListener("click", closeDrawer);
  drawerOverlay?.addEventListener("click", closeDrawer);

  // Save Player updates
  savePlayerBtn?.addEventListener("click", async () => {
    if (!activeDrawerPlayer) return;

    const updates = {
      day1_attendance: drawerDay1Select?.value,
      day2_attendance: drawerDay2Select?.value,
      rating: parseFloat(drawerRatingSlider?.value || "7"),
      trial_batch: drawerBatchSelect?.value,
      trial_net: drawerNetSelect?.value,
      notes: drawerNotes?.value || "",
      status: drawerStatusSelect?.value
    };

    savePlayerBtn.textContent = "SAVING...";
    await updatePlayer(activeDrawerPlayer.registration_id, updates);
    
    // Update local state
    const idx = allPlayers.findIndex((p) => p.registration_id === activeDrawerPlayer.registration_id);
    if (idx !== -1) {
      allPlayers[idx] = { ...allPlayers[idx], ...updates };
    }

    applyFilters();
    toastMsg(`Updated ${activeDrawerPlayer.full_name} (${activeDrawerPlayer.registration_id})`, "success");
    savePlayerBtn.textContent = "SAVE EVALUATION";
    closeDrawer();
  });

  // Export CSV button
  document.getElementById("export-csv-btn")?.addEventListener("click", () => {
    exportPlayersToCSV(filteredPlayers);
  });
});
