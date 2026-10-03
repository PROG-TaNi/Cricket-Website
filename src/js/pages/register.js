// @ts-check
/**
 * Registration page controller — Phase 4
 * 4-step form: Identity → Cricket Profile → Contact → Review & Submit
 *
 * @module register
 */

import "../../css/main.css";
import { initLenis } from "../core/lenis.js";
import { initNav } from "../components/nav.js";
import { toastMsg } from "../components/toast.js";
import { siteConfig } from "../../../config/site.js";
import { generateTrialsCalendar, downloadICS, addToGoogleCalendar } from "../../../lib/ics.js";
import { renderDeveloperCredit } from "../../lib/credit.js";
import QRCode from "qrcode";
import { downloadPlayerCard, sharePlayerCard } from "../components/player-card-canvas.js";

// ── Lenis / Nav init ──────────────────────────────────────────────
initLenis();
initNav();

// ── Developer Credit init ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const creditContainer = document.getElementById('developer-credit');
  if (creditContainer) {
    renderDeveloperCredit(creditContainer);
  }
});

// @ts-ignore
// toast exposed via window.toastMsg only in debug

// ── Validation helpers ────────────────────────────────────────────
const REG_NO_REGEX = /^[A-Z0-9]{4,20}$/;
const NAME_REGEX = /^[A-Za-z\s.''-]{2,80}$/;
const WHATSAPP_CLEAN_REGEX = /^[6-9]\d{9}$/;

/**
 * Normalise WhatsApp input to +91XXXXXXXXXX
 * Accepts: 9876543210 | +91 98765 43210 | 09876543210 | +919876543210
 * @param {string} raw
 * @returns {string | null}
 */
function normaliseWhatsapp(raw) {
  let s = raw.replace(/[\s\-()]/g, "");
  if (s.startsWith("+91")) s = s.slice(3);
  else if (s.startsWith("91") && s.length === 12) s = s.slice(2);
  else if (s.startsWith("0")) s = s.slice(1);
  return WHATSAPP_CLEAN_REGEX.test(s) ? `+91${s}` : null;
}

/**
 * @param {string} id
 * @param {string} msg
 */
function setError(id, msg) {
  const el = document.getElementById(`err-${id}`);
  if (el) el.textContent = msg;
}
/** @param {string} id */
function clearError(id) { setError(id, ""); }

/**
 * @param {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} el
 * @param {boolean} valid
 */
function markValidity(el, valid) {
  el.classList.toggle("valid", valid);
  el.classList.toggle("invalid", !valid);
}

// ── State ─────────────────────────────────────────────────────────
let currentStep = 1;
const TOTAL_STEPS = 4;

/** @type {Record<string, string>} */
const formData = {
  full_name: "",
  reg_no: "",
  program: "",
  year: "",
  branch: "",
  branch_other: "",
  primary_role: "",
  batting_style: "",
  bowling_style: "",
  past_experience: "",
  whatsapp: "",     // normalised +91XXXXXXXXXX
  whatsapp_raw: "",
  consent: "false",
  photo_data: "",
};

// ── DOM refs (all nullable — guard before use) ────────────────────
const $form = /** @type {HTMLFormElement | null} */ (document.getElementById("register-form"));
const $success = document.getElementById("success-screen");
const $regPage = document.getElementById("register-page");
const $closedBanner = document.getElementById("reg-closed-banner");

// ── Stepper rendering ─────────────────────────────────────────────
function renderStepper() {
  const stepper = document.getElementById("reg-stepper");
  if (!stepper) return;
  stepper.innerHTML = Array.from({ length: TOTAL_STEPS }, (_, i) => {
    const n = i + 1;
    const state = n < currentStep ? "completed" : n === currentStep ? "active" : "";
    const label = n < currentStep ? "✓" : String(n);
    return `<div class="stepper-dot ${state}" aria-label="Step ${n}" ${n === currentStep ? 'aria-current="step"' : ""}>${label}</div>`;
  }).join(`<div class="flex-1 h-px bg-white/10"></div>`);

  const progress = document.getElementById("stepper-progress");
  if (progress) {
    progress.style.width = `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 100}%`;
  }
}

// ── Step show / hide ──────────────────────────────────────────────
/**
 * @param {number} step
 */
function goToStep(step) {
  const prev = document.getElementById(`step-${currentStep}`);
  if (prev) prev.classList.add("hidden");
  currentStep = step;
  const next = document.getElementById(`step-${currentStep}`);
  if (next) {
    next.classList.remove("hidden");
    // Focus first focusable element
    const first = next.querySelector("input, select, textarea, button");
    if (first && first instanceof HTMLElement) setTimeout(() => first.focus(), 100);
  }
  renderStepper();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Step 1 validation ─────────────────────────────────────────────
function validateStep1() {
  let ok = true;

  // Photo validation
  if (!formData.photo_data) {
    setError("player-photo", "Please upload your headshot for your player card.");
    ok = false;
  } else {
    clearError("player-photo");
  }

  const nameEl = /** @type {HTMLInputElement} */ (document.getElementById("full-name"));
  const name = nameEl.value.trim();
  if (!NAME_REGEX.test(name)) {
    setError("full-name", "Name must be 2–80 chars. Letters, spaces, . \' - only.");
    markValidity(nameEl, false); ok = false;
  } else {
    clearError("full-name"); markValidity(nameEl, true);
  }

  const regNoEl = /** @type {HTMLInputElement} */ (document.getElementById("reg-no"));
  const regNo = regNoEl.value.toUpperCase().trim();
  regNoEl.value = regNo;
  if (!REG_NO_REGEX.test(regNo)) {
    setError("reg-no", "Enter your VJTI registration number (4–20 alphanumeric chars).");
    markValidity(regNoEl, false); ok = false;
  } else {
    clearError("reg-no"); markValidity(regNoEl, true);
  }

  const programEl = /** @type {HTMLSelectElement} */ (document.getElementById("program"));
  if (!programEl.value) {
    setError("program", "Please select your program.");
    markValidity(programEl, false); ok = false;
  } else {
    clearError("program"); markValidity(programEl, true);
  }

  const yearEl = /** @type {HTMLSelectElement} */ (document.getElementById("year"));
  if (!yearEl.value) {
    setError("year", "Please select your year.");
    markValidity(yearEl, false); ok = false;
  } else {
    clearError("year"); markValidity(yearEl, true);
  }

  const branchEl = /** @type {HTMLSelectElement} */ (document.getElementById("branch"));
  const branchOtherEl = /** @type {HTMLInputElement} */ (document.getElementById("branch-other"));
  if (!branchEl.value) {
    setError("branch", "Please select your branch.");
    markValidity(branchEl, false); ok = false;
  } else if (branchEl.value === "Other" && !branchOtherEl.value.trim()) {
    setError("branch", "Please enter your branch name.");
    markValidity(branchOtherEl, false); ok = false;
  } else {
    clearError("branch");
    markValidity(branchEl, true);
    if (branchEl.value === "Other") markValidity(branchOtherEl, true);
  }

  if (ok) {
    formData.full_name = name;
    formData.reg_no = regNo;
    formData.program = programEl.value;
    formData.year = yearEl.value;
    formData.branch = branchEl.value === "Other" ? branchOtherEl.value.trim() : branchEl.value;
  }
  return ok;
}

// ── Step 2 validation ─────────────────────────────────────────────
function validateStep2() {
  let ok = true;

  const roleInput = /** @type {HTMLInputElement | null} */ (document.querySelector('input[name="primary_role"]:checked'));
  if (!roleInput) {
    setError("primary-role", "Please select your primary role.");
    ok = false;
  } else {
    clearError("primary-role");
    formData.primary_role = roleInput.value;
  }

  const batInput = /** @type {HTMLInputElement | null} */ (document.querySelector('input[name="batting_style"]:checked'));
  if (!batInput) {
    setError("batting-style", "Please select your batting style.");
    ok = false;
  } else {
    clearError("batting-style");
    formData.batting_style = batInput.value;
  }

  const bowlEl = /** @type {HTMLSelectElement} */ (document.getElementById("bowling-style"));
  if (!bowlEl.value) {
    setError("bowling-style", "Please select your bowling style.");
    markValidity(bowlEl, false); ok = false;
  } else {
    clearError("bowling-style"); markValidity(bowlEl, true);
    formData.bowling_style = bowlEl.value;
  }

  const expEl = /** @type {HTMLTextAreaElement} */ (document.getElementById("past-experience"));
  if (expEl.value.length > 1000) {
    setError("past-experience", "Keep it under 1000 characters.");
    markValidity(expEl, false); ok = false;
  } else {
    clearError("past-experience");
    if (expEl.value.trim()) markValidity(expEl, true);
    formData.past_experience = expEl.value.trim();
  }

  return ok;
}

// ── Step 3 validation ─────────────────────────────────────────────
function validateStep3() {
  let ok = true;

  const waEl = /** @type {HTMLInputElement} */ (document.getElementById("whatsapp"));
  const normalised = normaliseWhatsapp(waEl.value);
  if (!normalised) {
    setError("whatsapp", "Enter a valid 10-digit Indian mobile number (starting with 6–9).");
    markValidity(waEl, false); ok = false;
  } else {
    clearError("whatsapp"); markValidity(waEl, true);
    formData.whatsapp = normalised;
    formData.whatsapp_raw = waEl.value;
  }

  const consentEl = /** @type {HTMLInputElement} */ (document.getElementById("consent"));
  if (!consentEl.checked) {
    setError("consent", "You must agree to the consent statement to register.");
    ok = false;
  } else {
    clearError("consent");
    formData.consent = "true";
  }

  return ok;
}

// ── Review summary ────────────────────────────────────────────────
function renderReview() {
  const container = document.getElementById("review-summary");
  if (!container) return;

  /** @type {Array<{key: string, val: string}>} */
  const rows = [
    { key: "Full Name", val: formData.full_name },
    { key: "Reg No", val: formData.reg_no },
    { key: "Program", val: formData.program },
    { key: "Year", val: formData.year },
    { key: "Branch", val: formData.branch },
    { key: "Primary Role", val: formData.primary_role },
    { key: "Batting Style", val: formData.batting_style },
    { key: "Bowling Style", val: formData.bowling_style },
    { key: "WhatsApp", val: formData.whatsapp },
    { key: "Past Experience", val: formData.past_experience || "—" },
  ];

  const photoHeader = formData.photo_data
    ? `
      <div class="flex items-center gap-4 pb-4 border-b border-white/10">
        <img src="${formData.photo_data}" class="w-16 h-16 rounded-full object-cover border-2 border-[#31D47B] shadow-md" alt="Player Headshot" />
        <div>
          <h3 class="font-display font-black text-xl text-white">${escapeHtml(formData.full_name)}</h3>
          <span class="font-mono text-xs text-[#31D47B] tracking-wider">${escapeHtml(formData.reg_no)}</span>
        </div>
      </div>
    `
    : "";

  container.innerHTML = photoHeader + rows.map(r => `
    <div class="review-row">
      <span class="review-key">${r.key}</span>
      <span class="review-val">${escapeHtml(r.val)}</span>
    </div>
  `).join("");
}

/** @param {string} s */
function escapeHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ── Player Card ───────────────────────────────────────────────────
/**
 * @param {any} data
 */
async function renderPlayerCard(data) {
  const container = document.getElementById("player-card-container");
  if (!container) return;

  const photoSrc = (data && data.photo_url) || formData.photo_data;
  const photoHtml = photoSrc
    ? `<div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-[#31D47B] flex-shrink-0 shadow-lg bg-black">
         <img src="${photoSrc}" class="w-full h-full object-cover" alt="${escapeHtml(data.full_name || '')}" />
       </div>`
    : `<div class="w-16 h-16 rounded-2xl border border-white/20 bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
         🏏
       </div>`;

  const regId = data.registration_id || data.registrationId || '';
  let qrHtml = '';
  try {
    const qrDataUrl = await QRCode.toDataURL(regId, { width: 120, margin: 1, color: { dark: '#050807', light: '#F4F1E8' } });
    qrHtml = `<div class="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
      <div class="text-left">
        <div class="text-[10px] font-mono text-[#31D47B] uppercase tracking-wider">CHECK-IN QR</div>
        <div class="text-[11px] text-[#A7B2AC]">Scan at VJTI Ground desk</div>
      </div>
      <div class="w-14 h-14 bg-white rounded-lg p-1 flex-shrink-0">
        <img src="${qrDataUrl}" alt="Check-in QR" class="w-full h-full object-contain" />
      </div>
    </div>`;
  } catch (_) {}

  container.innerHTML = `
    <div class="player-card" id="player-card-el">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div>
          <div class="player-card-badge">VJTI Cricket Trials 2026–27 · Official Pass</div>
          <div class="player-card-name">${escapeHtml(data.full_name || '')}</div>
          <div class="player-card-id">${escapeHtml(regId)}</div>
        </div>
        ${photoHtml}
      </div>
      <div class="player-card-meta">
        <span class="player-card-tag">${escapeHtml(data.primary_role || '')}</span>
        <span class="player-card-tag">${escapeHtml(data.batting_style || '')}</span>
        <span class="player-card-tag">${escapeHtml(data.bowling_style || '')}</span>
        <span class="player-card-tag">${escapeHtml(data.program || '')} · ${escapeHtml(data.year || '')}</span>
        <span class="player-card-tag">${escapeHtml(data.branch || '')}</span>
      </div>
      <div class="player-card-event">
        Trial Day 1: Sat 31 Oct 2026 · Day 2: Sun 1 Nov 2026<br>
        VJTI Cricket Ground, Matunga, Mumbai
      </div>
      ${qrHtml}
    </div>
  `;
}

// ── Submit handler ────────────────────────────────────────────────
async function handleSubmit() {
  console.log("🚀 Starting registration submission...");
  
  const submitBtn = /** @type {HTMLButtonElement} */ (document.getElementById("submit-btn"));
  const submitLabel = document.getElementById("submit-label");
  const submitSpinner = document.getElementById("submit-spinner");

  if (submitBtn) submitBtn.disabled = true;
  if (submitLabel) submitLabel.textContent = "SUBMITTING...";
  if (submitSpinner) submitSpinner.classList.remove("hidden");

  try {
    const payload = {
      full_name: formData.full_name,
      reg_no: formData.reg_no,
      program: formData.program,
      year: formData.year,
      branch: formData.branch,
      primary_role: formData.primary_role,
      batting_style: formData.batting_style,
      bowling_style: formData.bowling_style,
      past_experience: formData.past_experience || null,
      whatsapp: formData.whatsapp,
      photo_url: formData.photo_data || null,
    };

    console.log("📤 Sending registration payload...");
    console.log("Payload:", { ...payload, photo_url: payload.photo_url ? "[base64 data]" : null });

    const apiUrl = '/api/register';
    console.log("API URL:", apiUrl);

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("📥 Response status:", res.status);
    const json = await res.json();
    console.log("📥 Response data:", json);

    if (!res.ok) {
      throw new Error(json.error || `Server error ${res.status}`);
    }

    // Success!
    console.log("✅ Registration successful!");
    showSuccessScreen(json);

  } catch (/** @type {any} */ err) {
    console.error("❌ Registration failed:", err);
    
    // Re-enable button and show error
    if (submitBtn) submitBtn.disabled = false;
    if (submitLabel) submitLabel.textContent = "SUBMIT REGISTRATION";
    if (submitSpinner) submitSpinner.classList.add("hidden");

    toastMsg(err.message || "Registration failed. Please try again.", "error");
  }
}

/**
 * @param {any} data
 */
function showSuccessScreen(data) {
  if ($form) $form.classList.add("hidden");
  if ($success) $success.classList.remove("hidden");
  // Hide stepper
  const stepperEl = document.getElementById("reg-stepper");
  const stepperBar = document.getElementById("stepper-bar");
  if (stepperEl) stepperEl.classList.add("hidden");
  if (stepperBar) stepperBar.classList.add("hidden");

  if (!data.player) {
    data.player = {
      registration_id: data.registrationId,
      full_name: formData.full_name,
      primary_role: formData.primary_role,
      program: formData.program,
      year: formData.year,
      branch: formData.branch,
      batting_style: formData.batting_style,
      bowling_style: formData.bowling_style,
      photo_url: formData.photo_data
    };
  } else {
    data.player.photo_url = data.player.photo_url || formData.photo_data;
  }

  renderPlayerCard(data.player);
  
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

  // Save to localStorage
  try {
    localStorage.setItem("vjti_player", JSON.stringify({
      registrationId: data.registrationId,
      publicToken: data.publicToken,
      firstName: data.firstName,
      photoUrl: formData.photo_data
    }));

    const saved = JSON.parse(localStorage.getItem("vjti_registrations") || "[]");
    saved.push({
      registration_id: data.registrationId,
      reg_no: formData.reg_no,
      whatsapp: formData.whatsapp,
      photo_url: formData.photo_data,
      player: data.player,
      ts: Date.now()
    });
    localStorage.setItem("vjti_registrations", JSON.stringify(saved));
  } catch (_) {}

  // Copy ID button
  const copyBtn = document.getElementById("copy-id-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(data.registrationId).then(() => {
        toastMsg("Registration ID copied!", "success");
      });
    });
  }

  // Download card button - uses client-side high-res canvas generator (never blank!)
  const dlBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("download-card-btn"));
  if (dlBtn) {
    dlBtn.addEventListener("click", async () => {
      try {
        dlBtn.textContent = "⏳ GENERATING PASS...";
        dlBtn.disabled = true;
        
        await downloadPlayerCard(data.player || data);
        
        dlBtn.textContent = "⬇ DOWNLOAD PLAYER CARD";
        dlBtn.disabled = false;
        toastMsg("Player card downloaded! Check your photos / gallery.", "success");
      } catch (err) {
        console.error("Card download error:", err);
        dlBtn.textContent = "⬇ DOWNLOAD PLAYER CARD";
        dlBtn.disabled = false;
        toastMsg("Download failed. Please try again.", "error");
      }
    });
  }

  // Share to Instagram / mobile story button
  const shareBtn = document.getElementById("share-card-btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      try {
        const result = await sharePlayerCard(data.player || data);
        if (result.shared) {
          toastMsg("Shared successfully!", "success");
        } else if (result.downloaded) {
          toastMsg("Card downloaded! Share the photo from your gallery.", "info");
        }
      } catch (err) {
        toastMsg("Share failed. Please download the card instead.", "error");
      }
    });
  }

  // WhatsApp share button
  const waShareBtn = document.getElementById("whatsapp-share-btn");
  if (waShareBtn) {
    waShareBtn.addEventListener("click", () => {
      const message = encodeURIComponent(
        `I'm registered for VJTI Cricket Trials 2026!\n\nRegistration ID: ${data.registrationId}\nRole: ${data.player.primary_role}\n\nTrials: 10-11 Oct 2026\nVenue: VJTI Cricket Ground\n\n${siteUrl}`
      );
      window.open(`https://wa.me/?text=${message}`, "_blank");
    });
  }

  // Add to calendar button with dropdown
  const calBtn = document.getElementById("add-calendar-btn");
  if (calBtn) {
    // Create dropdown menu
    const dropdown = document.createElement("div");
    dropdown.className = "absolute bottom-full mb-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-xl py-2 min-w-[200px] hidden z-50";
    dropdown.innerHTML = `
      <button class="cal-option w-full px-4 py-2 text-left text-sm text-[#F4F1E8] hover:bg-[#2A2A2A] transition-colors flex items-center gap-2" data-type="google">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>Google Calendar</span>
      </button>
      <button class="cal-option w-full px-4 py-2 text-left text-sm text-[#F4F1E8] hover:bg-[#2A2A2A] transition-colors flex items-center gap-2" data-type="ics">
        <svg class="w-4 h-4 text-[#31D47B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <span>Download .ICS File</span>
      </button>
    `;
    
    // Position dropdown relative to button
    calBtn.parentElement.style.position = "relative";
    calBtn.parentElement.appendChild(dropdown);

    // Toggle dropdown
    calBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("hidden");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      dropdown.classList.add("hidden");
    });

    // Handle calendar options
    dropdown.querySelectorAll(".cal-option").forEach(option => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        const type = option.dataset.type;
        const calConfig = {
          day1Date: "2026-10-10",
          day2Date: "2026-10-11",
          reportingTime: siteConfig.trialDays[0].reportingTime || null,
          venue: `${siteConfig.venue.name}, ${siteConfig.venue.location}`,
          mapsUrl: siteConfig.venue.mapsUrl
        };

        if (type === "google") {
          addToGoogleCalendar(calConfig);
          toastMsg("Opening Google Calendar...", "success");
        } else if (type === "ics") {
          const icsContent = generateTrialsCalendar(calConfig);
          downloadICS(icsContent, "VJTI-Cricket-Trials-2026");
          toastMsg("Calendar file downloaded!", "success");
        }

        dropdown.classList.add("hidden");
      });
    });
  }

  // Join WhatsApp group button
  const waGroupBtn = /** @type {HTMLAnchorElement | null} */ (document.getElementById("whatsapp-group-btn"));
  if (waGroupBtn && siteConfig.contacts.whatsappGroupUrl && !siteConfig.contacts.whatsappGroupUrl.includes("placeholder")) {
    waGroupBtn.href = siteConfig.contacts.whatsappGroupUrl;
    waGroupBtn.classList.remove("hidden");
  }

  // Confetti!
  import("canvas-confetti").then(({ default: confetti }) => {
    confetti({ 
      particleCount: 120, 
      spread: 80, 
      origin: { y: 0.6 }, 
      colors: ["#31D47B", "#0F6B3D", "#F4F1E8"] 
    });
  });
}

// ── Dynamic Year cascade ──────────────────────────────────────────
function setupProgramYearCascade() {
  const programEl = /** @type {HTMLSelectElement} */ (document.getElementById("program"));
  const yearEl = /** @type {HTMLSelectElement} */ (document.getElementById("year"));
  if (!programEl || !yearEl) return;

  programEl.addEventListener("change", () => {
    const program = programEl.value;
    yearEl.innerHTML = "";
    yearEl.disabled = !program;

    if (!program) {
      yearEl.innerHTML = `<option value="">Select your program first</option>`;
      return;
    }

    yearEl.innerHTML = `<option value="">Select your year</option>`;
    /** @type {Array<{id: string, label: string}>} */
    const years = siteConfig.programYears[program] || [];
    years.forEach(y => {
      const opt = document.createElement("option");
      opt.value = y.id;
      opt.textContent = y.label;
      yearEl.appendChild(opt);
    });
    yearEl.disabled = false;
  });
}

// ── Branch select ─────────────────────────────────────────────────
function setupBranchSelect() {
  const branchEl = /** @type {HTMLSelectElement} */ (document.getElementById("branch"));
  const branchOtherEl = /** @type {HTMLInputElement} */ (document.getElementById("branch-other"));
  if (!branchEl) return;

  siteConfig.branches.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b;
    opt.textContent = b;
    branchEl.appendChild(opt);
  });

  branchEl.addEventListener("change", () => {
    if (branchEl.value === "Other") {
      branchOtherEl.classList.remove("hidden");
      branchOtherEl.required = true;
    } else {
      branchOtherEl.classList.add("hidden");
      branchOtherEl.required = false;
      branchOtherEl.value = "";
    }
  });
}

// ── Bowling style select ──────────────────────────────────────────
function setupBowlingStyleSelect() {
  const bowlEl = document.getElementById("bowling-style");
  if (!bowlEl) return;
  siteConfig.bowlingStyles.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    bowlEl.appendChild(opt);
  });
}

// ── Textarea char counter ─────────────────────────────────────────
function setupCharCounter() {
  const expEl = /** @type {HTMLTextAreaElement} */ (document.getElementById("past-experience"));
  const counter = document.getElementById("exp-char-count");
  if (!expEl || !counter) return;

  expEl.addEventListener("input", () => {
    const len = expEl.value.length;
    counter.textContent = `${len} / 1000`;
    counter.style.color = len > 950 ? "#ff6b6b" : "#A7B2AC";
  });
}

// ── Experience chips ──────────────────────────────────────────────
function setupExpChips() {
  const chips = document.querySelectorAll(".exp-chip");
  const expEl = /** @type {HTMLTextAreaElement} */ (document.getElementById("past-experience"));
  if (!expEl) return;

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      const prefix = chip.getAttribute("data-chip") || "";
      const current = expEl.value;
      if (!current.includes(prefix)) {
        expEl.value = current ? `${current}\n${prefix}` : prefix;
        expEl.dispatchEvent(new Event("input"));
      }
      expEl.focus();
      expEl.setSelectionRange(expEl.value.length, expEl.value.length);
    });
  });
}

// ── Navigation buttons ────────────────────────────────────────────
function setupNavButtons() {
  // Step 1 → 2
  document.getElementById("step-1-next")?.addEventListener("click", () => {
    if (validateStep1()) goToStep(2);
  });
  // Step 2
  document.getElementById("step-2-back")?.addEventListener("click", () => goToStep(1));
  document.getElementById("step-2-next")?.addEventListener("click", () => {
    if (validateStep2()) goToStep(3);
  });
  // Step 3
  document.getElementById("step-3-back")?.addEventListener("click", () => goToStep(2));
  document.getElementById("step-3-next")?.addEventListener("click", () => {
    if (validateStep3()) {
      renderReview();
      goToStep(4);
    }
  });
  // Step 4
  document.getElementById("step-4-back")?.addEventListener("click", () => goToStep(3));
}

// ── Form submit ───────────────────────────────────────────────────
function setupFormSubmit() {
  if (!$form) return;
  $form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("📝 Form submit event triggered");
    console.log("Current step:", currentStep);
    
    await handleSubmit();
  });
}

// ── Inline real-time validation feedback (blur) ───────────────────
function setupInlineValidation() {
  const nameEl = /** @type {HTMLInputElement} */ (document.getElementById("full-name"));
  nameEl?.addEventListener("blur", () => {
    const v = nameEl.value.trim();
    if (v && !NAME_REGEX.test(v)) {
      setError("full-name", "Letters, spaces, . ' - only. 2–80 chars.");
      markValidity(nameEl, false);
    } else if (v) {
      clearError("full-name"); markValidity(nameEl, true);
    }
  });

  const regNoEl = /** @type {HTMLInputElement} */ (document.getElementById("reg-no"));
  regNoEl?.addEventListener("blur", () => {
    const v = regNoEl.value.toUpperCase().trim();
    regNoEl.value = v;
    if (v && !REG_NO_REGEX.test(v)) {
      setError("reg-no", "4–20 alphanumeric characters.");
      markValidity(regNoEl, false);
    } else if (v) {
      clearError("reg-no"); markValidity(regNoEl, true);
    }
  });

  const waEl = /** @type {HTMLInputElement} */ (document.getElementById("whatsapp"));
  waEl?.addEventListener("blur", () => {
    const n = normaliseWhatsapp(waEl.value);
    if (waEl.value && !n) {
      setError("whatsapp", "Enter a valid 10-digit number starting with 6–9.");
      markValidity(waEl, false);
    } else if (n) {
      clearError("whatsapp"); markValidity(waEl, true);
    }
  });
  
  // Restrict WhatsApp input to 10 digits only
  waEl?.addEventListener("input", (e) => {
    let val = waEl.value.replace(/\D/g, ""); // Remove non-digits
    if (val.startsWith("0")) val = val.slice(1); // Remove leading 0
    if (val.length > 10) val = val.slice(0, 10); // Limit to 10 digits
    waEl.value = val;
  });
}

// ── Photo upload & client-side compression ───────────────────────
function setupPhotoUpload() {
  const fileInput = /** @type {HTMLInputElement | null} */ (document.getElementById("player-photo-input"));
  const previewImg = /** @type {HTMLImageElement | null} */ (document.getElementById("photo-preview-img"));
  const placeholderIcon = document.getElementById("photo-placeholder-icon");
  if (!fileInput) return;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("player-photo", "Please select an image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("player-photo", "Image file exceeds 5MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Offscreen canvas compression to square avatar (max 360x360)
        const canvas = document.createElement("canvas");
        const maxDim = 360;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, w, h);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        formData.photo_data = dataUrl;

        if (previewImg) {
          previewImg.src = dataUrl;
          previewImg.classList.remove("hidden");
        }
        if (placeholderIcon) {
          placeholderIcon.classList.add("hidden");
        }
        clearError("player-photo");
      };
      img.src = event.target?.result?.toString() || "";
    };
    reader.readAsDataURL(file);
  });
}

// ── Boot ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  setupPhotoUpload();
  setupProgramYearCascade();
  setupBranchSelect();
  setupBowlingStyleSelect();
  setupCharCounter();
  setupExpChips();
  setupNavButtons();
  setupFormSubmit();
  setupInlineValidation();
  renderStepper();

  // If registration is closed (from config), show closed banner and hide form
  if (siteConfig.registrationDeadline !== null) {
    const deadline = new Date(siteConfig.registrationDeadline);
    if (Date.now() > deadline.getTime()) {
      if ($closedBanner) $closedBanner.classList.remove("hidden");
      if ($form) $form.classList.add("hidden");
      const stepperEl = document.getElementById("reg-stepper");
      const stepperBar = document.getElementById("stepper-bar");
      if (stepperEl) stepperEl.classList.add("hidden");
      if (stepperBar) stepperBar.classList.add("hidden");
    }
  }
});


