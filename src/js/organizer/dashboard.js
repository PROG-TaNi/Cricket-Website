// @ts-check
/**
 * Organizer Dashboard Overview Controller
 */

import "../../css/main.css";
import { initOrganizerLayout } from "./layout.js";
import { getPlayers, getSiteSettings, updateSiteSettings } from "./data.js";
import { toastMsg } from "../components/toast.js";

/**
 * Export array of player records to a downloadable CSV file (with Excel UTF-8 BOM)
 * @param {Array<any>} players
 */
export function exportPlayersToCSV(players) {
  if (!players || players.length === 0) {
    toastMsg("No player data to export.", "warning");
    return;
  }

  const headers = [
    "Registration ID",
    "Full Name",
    "Reg No",
    "Program",
    "Year",
    "Branch",
    "Primary Role",
    "Batting Style",
    "Bowling Style",
    "WhatsApp",
    "Day 1 Attendance",
    "Day 2 Attendance",
    "Status",
    "Rating",
    "Trial Batch",
    "Trial Net",
    "Experience",
    "Selectors Notes"
  ];

  const escapeCSV = (/** @type {any} */ val) => {
    if (val === null || val === undefined) return "";
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = players.map((p) => [
    escapeCSV(p.registration_id),
    escapeCSV(p.full_name),
    escapeCSV(p.reg_no),
    escapeCSV(p.program),
    escapeCSV(p.year),
    escapeCSV(p.branch),
    escapeCSV(p.primary_role),
    escapeCSV(p.batting_style),
    escapeCSV(p.bowling_style),
    escapeCSV(p.whatsapp_number),
    escapeCSV(p.day1_attendance),
    escapeCSV(p.day2_attendance),
    escapeCSV(p.status),
    escapeCSV(p.rating || ""),
    escapeCSV(p.trial_batch || ""),
    escapeCSV(p.trial_net || ""),
    escapeCSV(p.experience || ""),
    escapeCSV(p.notes || "")
  ].join(","));

  // Prepend UTF-8 BOM so Microsoft Excel correctly displays Hindi/special characters
  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = `VJTI-Cricket-Trials-Players-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  toastMsg("CSV exported successfully!", "success");
}

document.addEventListener("DOMContentLoaded", async () => {
  await initOrganizerLayout(window.location.pathname);

  const players = await getPlayers();
  const settings = await getSiteSettings();

  // 1. Compute KPI Metrics
  const total = players.length;
  const day1Present = players.filter((p) => p.day1_attendance === "present" || p.day1_attendance === "late").length;
  const shortlisted = players.filter((p) => p.status === "shortlisted").length;
  const attendancePct = total > 0 ? Math.round((day1Present / total) * 100) : 0;

  const kpiTotalEl = document.getElementById("kpi-total");
  const kpiCheckedInEl = document.getElementById("kpi-checked-in");
  const kpiAttendancePctEl = document.getElementById("kpi-attendance-pct");
  const kpiShortlistedEl = document.getElementById("kpi-shortlisted");

  if (kpiTotalEl) kpiTotalEl.textContent = String(total);
  if (kpiCheckedInEl) kpiCheckedInEl.textContent = String(day1Present);
  if (kpiAttendancePctEl) kpiAttendancePctEl.textContent = `${attendancePct}%`;
  if (kpiShortlistedEl) kpiShortlistedEl.textContent = String(shortlisted);

  // 2. Role Breakdown
  const batters = players.filter((p) => p.primary_role === "Batter").length;
  const bowlers = players.filter((p) => p.primary_role === "Bowler").length;
  const keepers = players.filter((p) => p.primary_role === "Wicketkeeper").length;

  const bCountEl = document.getElementById("role-batters-count");
  const bBarEl = document.getElementById("role-batters-bar");
  const boCountEl = document.getElementById("role-bowlers-count");
  const boBarEl = document.getElementById("role-bowlers-bar");
  const kCountEl = document.getElementById("role-keepers-count");
  const kBarEl = document.getElementById("role-keepers-bar");

  if (bCountEl) bCountEl.textContent = `${batters} (${total > 0 ? Math.round((batters/total)*100) : 0}%)`;
  if (bBarEl) bBarEl.style.width = `${total > 0 ? (batters/total)*100 : 0}%`;

  if (boCountEl) boCountEl.textContent = `${bowlers} (${total > 0 ? Math.round((bowlers/total)*100) : 0}%)`;
  if (boBarEl) boBarEl.style.width = `${total > 0 ? (bowlers/total)*100 : 0}%`;

  if (kCountEl) kCountEl.textContent = `${keepers} (${total > 0 ? Math.round((keepers/total)*100) : 0}%)`;
  if (kBarEl) kBarEl.style.width = `${total > 0 ? (keepers/total)*100 : 0}%`;

  // 3. Render Recent Activity Feed
  const activityContainer = document.getElementById("recent-activity-list");
  if (activityContainer) {
    const recent = [...players].slice(0, 8);
    activityContainer.innerHTML = recent.map((p) => {
      const isPresent = p.day1_attendance === "present";
      const isLate = p.day1_attendance === "late";
      const badgeColor = isPresent ? "text-[#31D47B] bg-[#31D47B]/10 border-[#31D47B]/20" : isLate ? "text-[#D4FF52] bg-[#D4FF52]/10 border-[#D4FF52]/20" : "text-[#A7B2AC] bg-white/5 border-white/10";
      const statusText = isPresent ? "Checked In (Day 1)" : isLate ? "Late Arrival" : "Registered";

      return `
        <div class="py-3 flex items-center justify-between gap-3 text-xs">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-mono font-bold text-white text-[11px]">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                ${p.primary_role === "Batter" 
                  ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />'
                  : p.primary_role === "Bowler"
                  ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />'
                  : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z" />'}
              </svg>
            </span>
            <div>
              <p class="font-bold text-white">${p.full_name} <span class="font-mono text-[#A7B2AC] font-normal text-[11px]">(${p.registration_id})</span></p>
              <p class="text-[#64716A] text-[10px] font-mono">${p.program} ${p.year} · ${p.branch}</p>
            </div>
          </div>
          <div class="text-right">
            <span class="inline-block px-2 py-0.5 rounded border text-[10px] font-mono font-medium ${badgeColor}">
              ${statusText}
            </span>
            ${p.rating ? `<p class="font-mono text-[10px] text-[#31D47B] mt-0.5">Rating: ${p.rating}/10</p>` : ""}
          </div>
        </div>
      `;
    }).join("");
  }

  // 4. Matchday Mode Toggle
  const toggleBtn = document.getElementById("toggle-matchday-btn");
  const bannerTitle = document.getElementById("matchday-banner-title");
  const bannerDesc = document.getElementById("matchday-banner-desc");

  const updateMatchdayUI = (/** @type {boolean} */ isMatchday) => {
    if (bannerTitle) bannerTitle.textContent = isMatchday ? "MATCHDAY MODE ACTIVE — GROUND CHECK-IN LIVE" : "TRIALS COUNTDOWN ACTIVE";
    if (bannerDesc) bannerDesc.textContent = isMatchday ? "Selectors & coordinators: use Ground Mode for real-time QR scanning and net tracking." : "Scheduled for Sat 10 Oct & Sun 11 Oct 2026 at VJTI Cricket Ground.";
    if (toggleBtn) toggleBtn.textContent = isMatchday ? "DISABLE MATCHDAY MODE" : "ACTIVATE MATCHDAY MODE";
  };

  updateMatchdayUI(Boolean(settings?.matchday_mode));

  toggleBtn?.addEventListener("click", async () => {
    const newState = !settings.matchday_mode;
    settings.matchday_mode = newState;
    await updateSiteSettings({ matchday_mode: newState });
    updateMatchdayUI(newState);
    toastMsg(`Matchday mode ${newState ? "activated" : "deactivated"}`, "info");
  });

  // 5. Quick Export Button
  document.getElementById("quick-export-btn")?.addEventListener("click", () => {
    exportPlayersToCSV(players);
  });
});
