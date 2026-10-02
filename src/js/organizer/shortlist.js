// @ts-check
/**
 * Organizer Shortlist Controller
 * Manages shortlisted players and squad release
 */

import "../../css/main.css";
import { initOrganizerLayout } from "./layout.js";
import { getPlayers, updatePlayer } from "./data.js";
import { toastMsg } from "../components/toast.js";
import { supabase } from "../core/supabase.js";

/** @type {Array<any>} */
let shortlistedPlayers = [];

// DOM refs
const shortlistBody = document.getElementById("shortlist-table-body");
const shortlistCount = document.getElementById("shortlist-count");
const releaseSquadBtn = document.getElementById("release-squad-btn");
const squadStatusBanner = document.getElementById("squad-status-banner");
const squadReleasedBanner = document.getElementById("squad-released-banner");

// KPI elements
const kpiShortlisted = document.getElementById("kpi-shortlisted");
const kpiBatters = document.getElementById("kpi-batters");
const kpiBowlers = document.getElementById("kpi-bowlers");
const kpiKeepers = document.getElementById("kpi-keepers");

/**
 * Load squad release status from settings
 */
async function loadSquadStatus() {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "squad_released")
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error("Error loading squad status:", error);
      return false;
    }

    const isReleased = data?.value?.released || false;
    updateSquadStatusUI(isReleased);
    return isReleased;
  } catch (err) {
    console.error("Exception loading squad status:", err);
    return false;
  }
}

/**
 * Update UI based on squad release status
 * @param {boolean} isReleased
 */
function updateSquadStatusUI(isReleased) {
  if (isReleased) {
    squadStatusBanner?.classList.add("hidden");
    squadReleasedBanner?.classList.remove("hidden");
    if (releaseSquadBtn) {
      releaseSquadBtn.disabled = true;
      releaseSquadBtn.classList.add("opacity-50", "cursor-not-allowed");
      releaseSquadBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>SQUAD ALREADY RELEASED</span>
      `;
    }
  } else {
    squadStatusBanner?.classList.remove("hidden");
    squadReleasedBanner?.classList.add("hidden");
  }
}

/**
 * Release squad to public
 */
async function releaseSquad() {
  if (shortlistedPlayers.length === 0) {
    toastMsg("Cannot release empty squad. Shortlist players first.", "error");
    return;
  }

  const confirmed = confirm(
    `Release squad with ${shortlistedPlayers.length} players to the public website?\n\nThis action cannot be undone and the squad will be visible at /squad.html immediately.`
  );

  if (!confirmed) return;

  try {
    // Upsert squad_released setting
    const { error } = await supabase
      .from("settings")
      .upsert({
        key: "squad_released",
        value: { released: true, timestamp: new Date().toISOString() },
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    toastMsg("✓ Squad released to public successfully!", "success");
    updateSquadStatusUI(true);
  } catch (err) {
    console.error("Error releasing squad:", err);
    toastMsg("Failed to release squad. Check console.", "error");
  }
}

/**
 * Remove player from shortlist (revert to registered)
 * @param {string} registrationId
 */
async function removeFromShortlist(registrationId) {
  const confirmed = confirm("Remove this player from shortlist? They will revert to 'registered' status.");
  if (!confirmed) return;

  await updatePlayer(registrationId, { status: "registered" });
  toastMsg("Player removed from shortlist", "info");
  
  // Reload data
  await loadShortlistedPlayers();
}

/**
 * Load shortlisted players
 */
async function loadShortlistedPlayers() {
  const allPlayers = await getPlayers();
  shortlistedPlayers = allPlayers.filter((p) => p.status === "shortlisted" || p.status === "selected");
  
  updateKPIs();
  renderTable();
}

/**
 * Update KPI cards
 */
function updateKPIs() {
  if (kpiShortlisted) kpiShortlisted.textContent = String(shortlistedPlayers.length);
  
  const batters = shortlistedPlayers.filter((p) => p.primary_role === "Batter").length;
  const bowlers = shortlistedPlayers.filter((p) => p.primary_role === "Bowler").length;
  const keepers = shortlistedPlayers.filter((p) => p.primary_role === "Wicketkeeper").length;
  
  if (kpiBatters) kpiBatters.textContent = String(batters);
  if (kpiBowlers) kpiBowlers.textContent = String(bowlers);
  if (kpiKeepers) kpiKeepers.textContent = String(keepers);
}

/**
 * Render shortlisted players table
 */
function renderTable() {
  if (!shortlistBody) return;
  
  if (shortlistCount) {
    shortlistCount.textContent = `${shortlistedPlayers.length} player${shortlistedPlayers.length !== 1 ? 's' : ''}`;
  }

  if (shortlistedPlayers.length === 0) {
    shortlistBody.innerHTML = `
      <tr>
        <td colspan="5" class="p-8 text-center text-[#A7B2AC] text-sm">
          No shortlisted players yet. Use Selectors' Desk to shortlist candidates.
        </td>
      </tr>
    `;
    return;
  }

  shortlistBody.innerHTML = shortlistedPlayers
    .sort((a, b) => (b.trial_score || 0) - (a.trial_score || 0)) // Sort by score descending
    .map((p) => {
      const roleIcon = p.primary_role === "Batter"
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />'
        : p.primary_role === "Bowler"
        ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />'
        : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z" />';

      return `
        <tr class="hover:bg-white/5 transition-colors">
          <td class="p-3.5 whitespace-nowrap">
            <div class="flex items-center gap-2.5">
              ${p.photo_url 
                ? `<img src="${p.photo_url}" alt="${p.full_name}" class="w-8 h-8 rounded-full object-cover border border-[#31D47B]/40 flex-shrink-0" />`
                : `<div class="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                     <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                     </svg>
                   </div>`
              }
              <div>
                <div class="font-bold text-white text-sm">${p.full_name}</div>
                <div class="text-[10px] text-[#64716A] font-mono">${p.registration_id}</div>
              </div>
            </div>
          </td>
          <td class="p-3.5 font-mono text-[#A7B2AC] text-sm whitespace-nowrap">${p.reg_no}</td>
          <td class="p-3.5 whitespace-nowrap">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-[#31D47B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${roleIcon}
              </svg>
              <span class="text-white text-sm font-medium">${p.primary_role}</span>
            </div>
            <div class="text-[10px] text-[#64716A] mt-0.5">${p.batting_style} · ${p.bowling_style}</div>
          </td>
          <td class="p-3.5 text-center">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold ${
              (p.trial_score || 0) >= 8 ? "bg-[#31D47B]/20 text-[#31D47B]" : "bg-white/10 text-white"
            }">
              ${p.trial_score ? p.trial_score.toFixed(1) : "—"}
            </span>
          </td>
          <td class="p-3.5">
            <div class="flex items-center justify-center gap-2">
              <button 
                class="remove-shortlist-btn px-3 py-1.5 text-xs font-mono text-red-400 hover:bg-red-500/10 border border-red-500/30 rounded-lg transition-colors"
                data-reg-id="${p.registration_id}"
                title="Remove from shortlist"
              >
                <svg class="w-3.5 h-3.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Remove
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  // Attach remove button listeners
  document.querySelectorAll(".remove-shortlist-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const regId = btn.getAttribute("data-reg-id");
      if (regId) removeFromShortlist(regId);
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await initOrganizerLayout(window.location.pathname);

  await loadSquadStatus();
  await loadShortlistedPlayers();

  releaseSquadBtn?.addEventListener("click", releaseSquad);
});
