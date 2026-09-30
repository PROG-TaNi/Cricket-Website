// @ts-check
/**
 * Organizer Selectors' Desk Controller
 */

import "../../css/main.css";
import { initOrganizerLayout } from "./layout.js";
import { getPlayers, updatePlayer } from "./data.js";
import { toastMsg } from "../components/toast.js";

/** @type {Array<any>} */
let players = [];
/** @type {any | null} */
let currentCandidate = null;

// DOM elements
const candidateSelect = /** @type {HTMLSelectElement | null} */ (document.getElementById("desk-candidate-select"));
const regIdEl = document.getElementById("desk-reg-id");
const statusPill = document.getElementById("desk-status-pill");
const nameEl = document.getElementById("desk-name");
const metaEl = document.getElementById("desk-meta");
const overallScoreEl = document.getElementById("desk-overall-score");
const roleEl = document.getElementById("desk-role");
const stylesEl = document.getElementById("desk-styles");
const netBatchEl = document.getElementById("desk-net-batch");

const slider1 = /** @type {HTMLInputElement | null} */ (document.getElementById("score-slider-1"));
const val1 = document.getElementById("score-val-1");
const slider2 = /** @type {HTMLInputElement | null} */ (document.getElementById("score-slider-2"));
const val2 = document.getElementById("score-val-2");
const slider3 = /** @type {HTMLInputElement | null} */ (document.getElementById("score-slider-3"));
const val3 = document.getElementById("score-val-3");
const notesInput = /** @type {HTMLTextAreaElement | null} */ (document.getElementById("desk-notes-input"));

const btnShortlist = document.getElementById("btn-shortlist");
const btnWaitlist = document.getElementById("btn-waitlist");
const btnReject = document.getElementById("btn-reject");

/**
 * Load candidate details into desk
 * @param {any} p
 */
function loadCandidate(p) {
  currentCandidate = p;
  if (!p) return;

  if (regIdEl) regIdEl.textContent = p.registration_id;
  if (nameEl) nameEl.textContent = p.full_name;
  if (metaEl) metaEl.textContent = `${p.program} · ${p.branch} · Year ${p.year}`;
  if (roleEl) roleEl.textContent = p.primary_role;
  if (stylesEl) stylesEl.textContent = `${p.batting_style} · ${p.bowling_style}`;
  if (netBatchEl) netBatchEl.textContent = `${p.trial_batch || "Batch A"} · ${p.trial_net || "Net 1"}`;

  updateStatusPill(p.status);

  // Set sliders based on rating
  const baseRating = p.rating || 7.5;
  if (slider1) slider1.value = String(baseRating);
  if (slider2) slider2.value = String(baseRating);
  if (slider3) slider3.value = String(baseRating);

  if (val1) val1.textContent = String(baseRating);
  if (val2) val2.textContent = String(baseRating);
  if (val3) val3.textContent = String(baseRating);

  computeScore();

  if (notesInput) notesInput.value = p.notes || "";
}

/**
 * Update candidate status pill
 * @param {string} status
 */
function updateStatusPill(status) {
  if (!statusPill) return;
  statusPill.textContent = status.replace("_", " ").toUpperCase();

  if (status === "shortlisted") {
    statusPill.className = "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#31D47B]/20 text-[#31D47B] border border-[#31D47B]/40";
  } else if (status === "waitlisted") {
    statusPill.className = "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30";
  } else if (status === "rejected") {
    statusPill.className = "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30";
  } else {
    statusPill.className = "px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20";
  }
}

/**
 * Compute overall score from sliders
 */
function computeScore() {
  const s1 = parseFloat(slider1?.value || "7");
  const s2 = parseFloat(slider2?.value || "7");
  const s3 = parseFloat(slider3?.value || "7");

  const avg = Math.round(((s1 + s2 + s3) / 3) * 10) / 10;
  if (overallScoreEl) overallScoreEl.textContent = avg.toFixed(1);

  return avg;
}

/**
 * Save candidate evaluation
 * @param {string} [newStatus]
 */
async function saveEvaluation(newStatus) {
  if (!currentCandidate) return;

  const score = computeScore();
  const updates = {
    rating: score,
    notes: notesInput?.value || "",
    status: newStatus || currentCandidate.status
  };

  await updatePlayer(currentCandidate.registration_id, updates);

  currentCandidate = { ...currentCandidate, ...updates };
  updateStatusPill(currentCandidate.status);

  if (newStatus) {
    toastMsg(`Marked ${currentCandidate.full_name} as ${newStatus.toUpperCase()}`, "success");
  } else {
    toastMsg("Evaluation score saved", "info");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await initOrganizerLayout(window.location.pathname);

  players = await getPlayers();

  // Populate candidate selector
  if (candidateSelect) {
    candidateSelect.innerHTML = players.map((p) => `
      <option value="${p.registration_id}">
        ${p.registration_id} · ${p.full_name} (${p.primary_role})
      </option>
    `).join("");

    candidateSelect.addEventListener("change", () => {
      const selectedId = candidateSelect.value;
      const found = players.find((p) => p.registration_id === selectedId);
      if (found) loadCandidate(found);
    });
  }

  // Load first candidate by default
  if (players.length > 0) {
    loadCandidate(players[0]);
  }

  // Slider events
  slider1?.addEventListener("input", () => {
    if (val1) val1.textContent = slider1.value;
    computeScore();
  });
  slider2?.addEventListener("input", () => {
    if (val2) val2.textContent = slider2.value;
    computeScore();
  });
  slider3?.addEventListener("input", () => {
    if (val3) val3.textContent = slider3.value;
    computeScore();
  });

  // Autosave notes on blur
  notesInput?.addEventListener("blur", () => saveEvaluation());

  // Decision buttons
  btnShortlist?.addEventListener("click", () => saveEvaluation("shortlisted"));
  btnWaitlist?.addEventListener("click", () => saveEvaluation("waitlisted"));
  btnReject?.addEventListener("click", () => saveEvaluation("rejected"));
});
