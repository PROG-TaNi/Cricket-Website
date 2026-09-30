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
async function initCamera() {
  if (!videoEl) return;

  try {
    qrScanner = new QrScanner(
      videoEl,
      (result) => {
        const text = typeof result === "string" ? result : result.data;
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
});
