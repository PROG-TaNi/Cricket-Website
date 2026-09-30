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
import { generateTrialsCalendar, downloadICS } from "../../../lib/ics.js";

// ── Lenis / Nav init ──────────────────────────────────────────────
initLenis();
initNav();
// @ts-ignore
// toast exposed via window.toastMsg only in debug

// ── Turnstile callback (called by Cloudflare script) ─────────────
/** @type {string | null} */
let turnstileToken = null;

// @ts-ignore – injected by Cloudflare Turnstile
window.onTurnstileSuccess = (/** @type {string} */ token) => {
  turnstileToken = token;
  const submitBtn = /** @type {HTMLButtonElement} */ (document.getElementById("submit-btn"));
  if (submitBtn) submitBtn.disabled = false;
};

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

  container.innerHTML = rows.map(r => `
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
 * @param {{registration_id: string, full_name: string, primary_role: string, program: string, year: string, branch: string, batting_style: string, bowling_style: string}} data
 */
function renderPlayerCard(data) {
  const container = document.getElementById("player-card-container");
  if (!container) return;

  container.innerHTML = `
    <div class="player-card" id="player-card-el">
      <div class="player-card-badge">VJTI Cricket Trials 2026–27 · Official</div>
      <div class="player-card-name">${escapeHtml(data.full_name)}</div>
      <div class="player-card-id">${escapeHtml(data.registration_id)}</div>
      <div class="player-card-meta">
        <span class="player-card-tag">${escapeHtml(data.primary_role)}</span>
        <span class="player-card-tag">${escapeHtml(data.batting_style)}</span>
        <span class="player-card-tag">${escapeHtml(data.bowling_style)}</span>
        <span class="player-card-tag">${escapeHtml(data.program)} · ${escapeHtml(data.year)}</span>
        <span class="player-card-tag">${escapeHtml(data.branch)}</span>
      </div>
      <div class="player-card-event">
        Trial Day 1: Sat 10 Oct 2026 · Day 2: Sun 11 Oct 2026<br>
        VJTI Cricket Ground, Matunga, Mumbai
      </div>
    </div>
  `;
}

// ── Submit handler ────────────────────────────────────────────────
async function handleSubmit() {
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
      turnstile_token: turnstileToken,
    };

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || `Server error ${res.status}`);
    }

    // Success!
    showSuccessScreen(json);

  } catch (/** @type {any} */ err) {
    // Re-enable button and show error
    if (submitBtn) submitBtn.disabled = false;
    if (submitLabel) submitLabel.textContent = "SUBMIT REGISTRATION";
    if (submitSpinner) submitSpinner.classList.add("hidden");
    // Re-enable Turnstile
    turnstileToken = null;
    // @ts-ignore
    if (typeof window.turnstile !== "undefined") window.turnstile.reset();

    toastMsg(err.message || "Registration failed. Please try again.", "error");
  }
}

/**
 * @param {{registrationId: string, publicToken: string, firstName: string, player: {registration_id: string, full_name: string, primary_role: string, program: string, year: string, branch: string, batting_style: string, bowling_style: string}}} data
 */
function showSuccessScreen(data) {
  if ($form) $form.classList.add("hidden");
  if ($success) $success.classList.remove("hidden");
  // Hide stepper
  const stepperEl = document.getElementById("reg-stepper");
  const stepperBar = document.getElementById("stepper-bar");
  if (stepperEl) stepperEl.classList.add("hidden");
  if (stepperBar) stepperBar.classList.add("hidden");

  renderPlayerCard(data.player);
  
  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

  // Save to localStorage
  try {
    localStorage.setItem("vjti_player", JSON.stringify({
      registrationId: data.registrationId,
      publicToken: data.publicToken,
      firstName: data.firstName
    }));
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

  // Download card button - uses the API-generated image
  const dlBtn = /** @type {HTMLButtonElement | null} */ (document.getElementById("download-card-btn"));
  if (dlBtn) {
    dlBtn.addEventListener("click", async () => {
      try {
        dlBtn.textContent = "⏳ GENERATING...";
        dlBtn.disabled = true;
        
        // Fetch the image from the API
        const cardUrl = `${siteUrl}/api/card/${data.publicToken}`;
        const response = await fetch(cardUrl);
        
        if (!response.ok) throw new Error("Failed to generate card");
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `VJTI-Cricket-${data.registrationId}.png`;
        a.click();
        URL.revokeObjectURL(url);
        
        dlBtn.textContent = "⬇ DOWNLOAD PLAYER CARD";
        dlBtn.disabled = false;
        toastMsg("Player card downloaded!", "success");
      } catch (err) {
        dlBtn.textContent = "⬇ DOWNLOAD PLAYER CARD";
        dlBtn.disabled = false;
        toastMsg("Download failed. Try the share button instead.", "error");
      }
    });
  }

  // Share to Instagram button
  const shareBtn = document.getElementById("share-card-btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", async () => {
      try {
        const cardUrl = `${siteUrl}/api/card/${data.publicToken}`;
        const response = await fetch(cardUrl);
        if (!response.ok) throw new Error("Failed to generate card");
        
        const blob = await response.blob();
        const file = new File([blob], `VJTI-Cricket-${data.registrationId}.png`, { type: "image/png" });
        
        // Try Web Share API
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "VJTI Cricket Trials 2026",
            text: `I'm registered for VJTI Cricket Trials 2026! ${data.registrationId}`
          });
          toastMsg("Shared successfully!", "success");
        } else {
          // Fallback: download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `VJTI-Cricket-${data.registrationId}.png`;
          a.click();
          URL.revokeObjectURL(url);
          toastMsg("Downloaded! Share manually from your gallery.", "info");
        }
      } catch (err) {
        if (err.name !== "AbortError") { // User cancelled share
          toastMsg("Share failed. Download and share manually.", "error");
        }
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

  // Add to calendar button
  const calBtn = document.getElementById("add-calendar-btn");
  if (calBtn) {
    calBtn.addEventListener("click", () => {
      const icsContent = generateTrialsCalendar({
        day1Date: "2026-10-10",
        day2Date: "2026-10-11",
        reportingTime: siteConfig.trialDays[0].reportingTime || null,
        venue: `${siteConfig.venue.name}, ${siteConfig.venue.location}`,
        mapsUrl: siteConfig.venue.mapsUrl
      });
      downloadICS(icsContent, "VJTI-Cricket-Trials-2026");
      toastMsg("Calendar file downloaded!", "success");
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
    if (!turnstileToken) {
      toastMsg("Please complete the security check.", "error");
      return;
    }
    await handleSubmit();
  });
}

// ── Turnstile site key injection ──────────────────────────────────
function injectTurnstileSiteKey() {
  const widget = document.querySelector(".cf-turnstile");
  if (widget) {
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";
    widget.setAttribute("data-sitekey", siteKey);
  }
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
}

// ── Boot ──────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  setupProgramYearCascade();
  setupBranchSelect();
  setupBowlingStyleSelect();
  setupCharCounter();
  setupExpChips();
  setupNavButtons();
  setupFormSubmit();
  setupInlineValidation();
  injectTurnstileSiteKey();
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


