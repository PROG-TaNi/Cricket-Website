// @ts-check
/**
 * Organizer Ground Mode Controller
 * Optimized for mobile touch, sunlight readability, camera QR scanning, and rapid check-in.
 */

import "../../css/main.css";
import { initOrganizerLayout } from "./layout.js";
import { getPlayers, updatePlayer, addWalkInPlayer } from "./data.js";
import { toastMsg } from "../components/toast.js";
import QrScanner from "qr-scanner";

/** @type {Array<any>} */
let players = [];
/** @type {any | null} */
let currentCandidate = null;
/** @type {QrScanner | null} */
let qrScanner = null;

// DOM refs
const syncDot = document.getElementById("sync-status-dot");
const syncText = document.getElementById("sync-status-text");
const groundCounter = document.getElementById("ground-counter");
const tabScannerBtn = document.getElementById("tab-scanner-btn");
const tabManualBtn = document.getElementById("tab-manual-btn");
const scannerSection = document.getElementById("scanner-section");
const manualSection = document.getElementById("manual-section");
const videoEl = /** @type {HTMLVideoElement | null} */ (document.getElementById("qr-video"));
const cameraPlaceholder = document.getElementById("camera-placeholder");
const startCameraBtn = document.getElementById("start-camera-btn");
const manualIdInput = /** @type {HTMLInputElement | null} */ (document.getElementById("manual-id-input"));
const manualSearchBtn = document.getElementById("manual-search-btn");

// Candidate Card DOM refs
const candidateCard = document.getElementById("candidate-card");
const cardRegId = document.getElementById("card-reg-id");
const cardName = document.getElementById("card-name");
const cardInfo = document.getElementById("card-info");
const cardRoleBadge = document.getElementById("card-role-badge");
const cardBatting = document.getElementById("card-batting");
const cardBowling = document.getElementById("card-bowling");
const cardExp = document.getElementById("card-exp");
const btnDay1Present = document.getElementById("checkin-day1-present");
const btnDay1Late = document.getElementById("checkin-day1-late");
const btnDay2Present = document.getElementById("checkin-day2-present");

// Walkin modal DOM refs
const walkinDialog = /** @type {HTMLDialogElement | null} */ (document.getElementById("walkin-dialog"));
const walkinTriggerBtn = document.getElementById("walkin-trigger-btn");
const closeWalkinBtn = document.getElementById("close-walkin-btn");
const walkinForm = /** @type {HTMLFormElement | null} */ (document.getElementById("walkin-form"));

/**
 * Update the checked-in counter badge
 */
function updateCounter() {
  const checkedInCount = players.filter(
    (p) => p.day1_attendance === "present" || p.day1_attendance === "late" || p.day2_attendance === "present"
  ).length;
  if (groundCounter) groundCounter.textContent = String(checkedInCount);
}

/**
 * Format timestamp to readable time
 * @param {string} timestamp
 * @returns {string}
 */
function formatTime(timestamp) {
  if (!timestamp) return "—";
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/**
 * Download attendance as CSV
 * @param {number} day - 1 or 2
 */
function downloadAttendanceCSV(day) {
  const dayPlayers = day === 1
    ? players.filter((p) => p.day1_attendance === "present" || p.day1_attendance === "late")
    : players.filter((p) => p.day2_attendance === "present");

  if (dayPlayers.length === 0) {
    toastMsg(`No attendance records for Day ${day} to download`, "warning");
    return;
  }

  // Prepare CSV content
  const headers = ["Registration ID", "Full Name", "Roll No", "Program", "Year", "Branch", "Role", "Status", "Check-in Time"];
  const rows = dayPlayers.map((p) => {
    const status = day === 1 ? p.day1_attendance : p.day2_attendance;
    const time = formatTime(p.updated_at);
    
    return [
      p.registration_id,
      p.full_name,
      p.reg_no,
      p.program,
      p.year,
      p.branch,
      p.primary_role,
      status.toUpperCase(),
      time
    ];
  });

  // Build CSV
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  const date = day === 1 ? "31-Oct-2026" : "1-Nov-2026";
  link.setAttribute("href", url);
  link.setAttribute("download", `VJTI-Cricket-Day${day}-Attendance-${date}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  toastMsg(`✓ Day ${day} attendance downloaded (${dayPlayers.length} records)`, "success");
}

/**
 * Update attendance tables for both days
 */
function updateAttendanceTables() {
  // Day 1 Attendance (Saturday 31 Oct)
  const day1Players = players.filter(
    (p) => p.day1_attendance === "present" || p.day1_attendance === "late"
  );
  
  const day1Body = document.getElementById("day1-attendance-body");
  const day1Count = document.getElementById("day1-count");
  
  if (day1Body) {
    if (day1Players.length === 0) {
      day1Body.innerHTML = `
        <tr>
          <td colspan="5" class="px-4 py-8 text-center text-[#A7B2AC] text-sm">
            No check-ins yet for Day 1
          </td>
        </tr>
      `;
    } else {
      day1Body.innerHTML = day1Players
        .sort((a, b) => a.registration_id.localeCompare(b.registration_id))
        .map((p) => {
          const statusClass = p.day1_attendance === "late" ? "text-amber-400" : "text-[#31D47B]";
          const statusText = p.day1_attendance === "late" ? "LATE" : "PRESENT";
          
          return `
            <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td class="px-4 py-3 font-mono text-xs text-[#D4FF52]">${p.registration_id}</td>
              <td class="px-4 py-3 text-sm font-medium">${p.full_name}</td>
              <td class="px-4 py-3 font-mono text-xs text-[#A7B2AC]">${p.reg_no}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusClass} bg-white/5">
                  ${statusText}
                </span>
              </td>
              <td class="px-4 py-3 font-mono text-xs text-[#A7B2AC]">${formatTime(p.updated_at)}</td>
            </tr>
          `;
        })
        .join("");
    }
  }
  
  if (day1Count) day1Count.textContent = String(day1Players.length);

  // Day 2 Attendance (Sunday 1 Nov)
  const day2Players = players.filter((p) => p.day2_attendance === "present");
  
  const day2Body = document.getElementById("day2-attendance-body");
  const day2Count = document.getElementById("day2-count");
  
  if (day2Body) {
    if (day2Players.length === 0) {
      day2Body.innerHTML = `
        <tr>
          <td colspan="5" class="px-4 py-8 text-center text-[#A7B2AC] text-sm">
            No check-ins yet for Day 2
          </td>
        </tr>
      `;
    } else {
      day2Body.innerHTML = day2Players
        .sort((a, b) => a.registration_id.localeCompare(b.registration_id))
        .map((p) => `
          <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
            <td class="px-4 py-3 font-mono text-xs text-[#D4FF52]">${p.registration_id}</td>
            <td class="px-4 py-3 text-sm font-medium">${p.full_name}</td>
            <td class="px-4 py-3 font-mono text-xs text-[#A7B2AC]">${p.reg_no}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-[#31D47B] bg-white/5">
                PRESENT
              </span>
            </td>
            <td class="px-4 py-3 font-mono text-xs text-[#A7B2AC]">${formatTime(p.updated_at)}</td>
          </tr>
        `)
        .join("");
    }
  }
  
  if (day2Count) day2Count.textContent = String(day2Players.length);
}

/**
 * Find candidate by query (Reg ID, Roll No, or Public Token)
 * @param {string} rawQuery
 */
function findCandidate(rawQuery) {
  const query = rawQuery.trim().toUpperCase();
  if (!query) return null;

  return players.find((p) => {
    if (p.registration_id.toUpperCase() === query) return true;
    if (p.reg_no.toUpperCase() === query) return true;
    if (p.public_token === query) return true;
    
    // Also support last 4 digits (e.g. "0001" matches "VJTI-CRK-0001")
    if (query.length === 4 && p.registration_id.endsWith(query)) return true;

    return false;
  });
}

/**
 * Present the matched candidate card
 * @param {any} candidate
 */
function displayCandidate(candidate) {
  currentCandidate = candidate;
  if (!candidateCard) return;

  if (cardRegId) cardRegId.textContent = candidate.registration_id;
  if (cardName) cardName.textContent = candidate.full_name;
  if (cardInfo) cardInfo.textContent = `${candidate.program} · ${candidate.year} · ${candidate.branch}`;
  if (cardRoleBadge) cardRoleBadge.textContent = candidate.primary_role;
  if (cardBatting) cardBatting.textContent = candidate.batting_style || "—";
  if (cardBowling) cardBowling.textContent = candidate.bowling_style || "—";
  if (cardExp) cardExp.textContent = candidate.experience || "No prior records listed";

  const cardPhotoImg = /** @type {HTMLImageElement | null} */ (document.getElementById("card-photo-img"));
  const cardPhotoPlaceholder = document.getElementById("card-photo-placeholder");
  if (candidate.photo_url && cardPhotoImg) {
    cardPhotoImg.src = candidate.photo_url;
    cardPhotoImg.classList.remove("hidden");
    cardPhotoPlaceholder?.classList.add("hidden");
  } else {
    cardPhotoImg?.classList.add("hidden");
    cardPhotoPlaceholder?.classList.remove("hidden");
  }

  candidateCard.classList.remove("hidden");
  candidateCard.scrollIntoView({ behavior: "smooth", block: "center" });

  // Play tactile feedback
  if (navigator.vibrate) {
    navigator.vibrate([40, 30, 40]);
  }
}

/**
 * Perform check-in action
 * @param {"present" | "late"} status
 * @param {1 | 2} dayNumber
 */
async function performCheckIn(status, dayNumber) {
  if (!currentCandidate) return;

  const updates = {
    [dayNumber === 1 ? "day1_attendance" : "day2_attendance"]: status,
    status: currentCandidate.status === "registered" ? "checked_in" : currentCandidate.status
  };

  await updatePlayer(currentCandidate.registration_id, updates);
  
  // Update in local memory
  const idx = players.findIndex((p) => p.registration_id === currentCandidate.registration_id);
  if (idx !== -1) {
    players[idx] = { ...players[idx], ...updates };
  }

  updateCounter();
  updateAttendanceTables();
  toastMsg(`✓ Checked in ${currentCandidate.full_name} (${status.toUpperCase()})`, "success");

  // Animate candidate card confirmation
  if (candidateCard) {
    candidateCard.classList.add("border-[#D4FF52]");
    setTimeout(() => {
      candidateCard?.classList.remove("border-[#D4FF52]");
    }, 600);
  }
}

/**
 * Initialize camera scanner
 */
let lastScannedCode = null;
let lastScanTime = 0;
const SCAN_COOLDOWN = 3000; // 3 seconds cooldown between scans of the same code

async function initCamera() {
  if (!videoEl) return;

  try {
    qrScanner = new QrScanner(
      videoEl,
      (result) => {
        const text = typeof result === "string" ? result : result.data;
        const now = Date.now();
        
        // Prevent duplicate scans of the same code within cooldown period
        if (text === lastScannedCode && now - lastScanTime < SCAN_COOLDOWN) {
          return; // Ignore duplicate scan
        }
        
        // Update last scanned code and time
        lastScannedCode = text;
        lastScanTime = now;
        
        const candidate = findCandidate(text);
        if (candidate) {
          displayCandidate(candidate);
          toastMsg(`QR Scanned: ${candidate.full_name}`, "success");
        } else {
          toastMsg(`Unknown QR code: "${text}"`, "warning");
        }
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: "environment"
      }
    );

    await qrScanner.start();
    if (cameraPlaceholder) cameraPlaceholder.classList.add("hidden");
  } catch (err) {
    console.warn("Camera could not start:", err);
    toastMsg("Camera unavailable or permission denied. Use Manual Lookup.", "error");
    if (cameraPlaceholder) {
      cameraPlaceholder.innerHTML = `
        <span class="text-3xl">⚠️</span>
        <p class="font-mono text-xs text-red-400">Camera permission denied</p>
        <button id="switch-to-manual-btn" class="btn-secondary text-xs py-2 px-3">SWITCH TO MANUAL LOOKUP</button>
      `;
      document.getElementById("switch-to-manual-btn")?.addEventListener("click", () => {
        tabManualBtn?.click();
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await initOrganizerLayout(window.location.pathname);

  players = await getPlayers();
  updateCounter();
  updateAttendanceTables();

  // Mode Tabs Switching
  tabScannerBtn?.addEventListener("click", () => {
    tabScannerBtn.classList.add("bg-[#31D47B]", "text-black", "font-bold");
    tabScannerBtn.classList.remove("text-[#A7B2AC]");
    tabManualBtn?.classList.remove("bg-[#31D47B]", "text-black", "font-bold");
    tabManualBtn?.classList.add("text-[#A7B2AC]");

    scannerSection?.classList.remove("hidden");
    manualSection?.classList.add("hidden");
  });

  tabManualBtn?.addEventListener("click", () => {
    tabManualBtn.classList.add("bg-[#31D47B]", "text-black", "font-bold");
    tabManualBtn.classList.remove("text-[#A7B2AC]");
    tabScannerBtn?.classList.remove("bg-[#31D47B]", "text-black", "font-bold");
    tabScannerBtn?.classList.add("text-[#A7B2AC]");

    manualSection?.classList.remove("hidden");
    scannerSection?.classList.add("hidden");
    manualIdInput?.focus();
  });

  // Camera start button
  startCameraBtn?.addEventListener("click", initCamera);

  // Manual search
  const runManualSearch = () => {
    const query = manualIdInput?.value || "";
    const candidate = findCandidate(query);
    if (candidate) {
      displayCandidate(candidate);
      toastMsg(`Found: ${candidate.full_name}`, "success");
    } else {
      toastMsg(`No candidate found for "${query}"`, "warning");
    }
  };

  manualSearchBtn?.addEventListener("click", runManualSearch);
  manualIdInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runManualSearch();
  });

  // Check-In Action Buttons
  btnDay1Present?.addEventListener("click", () => performCheckIn("present", 1));
  btnDay1Late?.addEventListener("click", () => performCheckIn("late", 1));
  btnDay2Present?.addEventListener("click", () => performCheckIn("present", 2));

  // Quick Net Tags
  document.querySelectorAll(".net-tag").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!currentCandidate) return;
      const net = btn.getAttribute("data-net") || "Net 1";
      await updatePlayer(currentCandidate.registration_id, { trial_net: net, status: "in_trials" });
      toastMsg(`Assigned ${currentCandidate.full_name} to ${net}`, "info");
    });
  });

  // Walk-In Candidate Dialog
  walkinTriggerBtn?.addEventListener("click", () => {
    walkinDialog?.showModal();
  });

  closeWalkinBtn?.addEventListener("click", () => {
    walkinDialog?.close();
  });

  walkinForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = /** @type {HTMLInputElement | null} */ (document.getElementById("walkin-name"))?.value || "";
    const regno = /** @type {HTMLInputElement | null} */ (document.getElementById("walkin-regno"))?.value || "";
    const program = /** @type {HTMLSelectElement | null} */ (document.getElementById("walkin-program"))?.value || "Degree";
    const role = /** @type {HTMLSelectElement | null} */ (document.getElementById("walkin-role"))?.value || "Batter";
    const wa = /** @type {HTMLInputElement | null} */ (document.getElementById("walkin-wa"))?.value || "";

    const newPlayer = await addWalkInPlayer({
      full_name: name,
      reg_no: regno.toUpperCase().trim(),
      program,
      year: "1st",
      branch: "General",
      primary_role: role,
      batting_style: "Right-hand",
      bowling_style: "Doesn't bowl",
      whatsapp_number: wa.startsWith("+91") ? wa : `+91${wa}`
    });

    players.unshift(newPlayer);
    updateCounter();
    updateAttendanceTables();
    walkinDialog?.close();
    walkinForm.reset();

    displayCandidate(newPlayer);
    toastMsg(`Registered walk-in: ${newPlayer.registration_id}`, "success");
  });

  // Offline detection
  window.addEventListener("online", () => {
    if (syncDot) syncDot.className = "w-2.5 h-2.5 rounded-full bg-[#31D47B]";
    if (syncText) syncText.textContent = "ONLINE & READY";
  });

  window.addEventListener("offline", () => {
    if (syncDot) syncDot.className = "w-2.5 h-2.5 rounded-full bg-amber-400";
    if (syncText) syncText.textContent = "OFFLINE MODE (QUEUED)";
  });

  // Download attendance CSV buttons
  const downloadDay1Btn = document.getElementById("download-day1-btn");
  const downloadDay2Btn = document.getElementById("download-day2-btn");

  downloadDay1Btn?.addEventListener("click", () => downloadAttendanceCSV(1));
  downloadDay2Btn?.addEventListener("click", () => downloadAttendanceCSV(2));
});
