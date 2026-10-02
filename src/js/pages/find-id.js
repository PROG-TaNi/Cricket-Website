// @ts-check
/**
 * Find My ID page controller
 * Looks up player by reg_no or WhatsApp via /api/find-id
 * Falls back to localStorage if API not available (dev)
 */

import "../../css/main.css";
import { initLenis } from "../core/lenis.js";
import { initNav } from "../components/nav.js";
import { toastMsg } from "../components/toast.js";
import { downloadPlayerCard } from "../components/player-card-canvas.js";
import { renderDeveloperCredit } from "../../lib/credit.js";

initLenis();
initNav();

// Initialize developer credit
document.addEventListener("DOMContentLoaded", () => {
  const creditContainer = document.getElementById('developer-credit');
  if (creditContainer) {
    renderDeveloperCredit(creditContainer);
  }
});

// @ts-ignore


const WHATSAPP_CLEAN_REGEX = /^[6-9]\d{9}$/;
const REG_NO_RE = /^[A-Z0-9]{4,20}$/;

/** @param {string} raw @returns {string | null} */
function normaliseWhatsapp(raw) {
  let s = raw.replace(/[\s\-()]/g, "");
  if (s.startsWith("+91")) s = s.slice(3);
  else if (s.startsWith("91") && s.length === 12) s = s.slice(2);
  else if (s.startsWith("0")) s = s.slice(1);
  return WHATSAPP_CLEAN_REGEX.test(s) ? `+91${s}` : null;
}

/** @param {string} s */
function escapeHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

/**
 * @param {{registration_id: string, full_name: string, primary_role: string, program: string, year: string, branch: string, batting_style: string, bowling_style: string, photo_url?: string | null}} data
 */
function renderPlayerCard(data) {
  const container = document.getElementById("find-result");
  if (!container) return;

  const photoHtml = data.photo_url
    ? `<div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#31D47B]/60 overflow-hidden mx-auto mb-3 shadow-lg bg-black">
         <img src="${data.photo_url}" alt="${escapeHtml(data.full_name)}" class="w-full h-full object-cover" />
       </div>`
    : "";

  container.innerHTML = `
    <div class="player-card mb-6 text-center" id="found-player-card">
      <div class="player-card-badge">VJTI Cricket Trials 2026–27 · Registered</div>
      ${photoHtml}
      <div class="player-card-name">${escapeHtml(data.full_name)}</div>
      <div class="player-card-id">${escapeHtml(data.registration_id)}</div>
      <div class="player-card-meta justify-center">
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
    <div class="flex flex-col gap-3">
      <button id="dl-found-card" class="btn-primary w-full">⬇ DOWNLOAD PLAYER CARD</button>
      <button id="copy-found-id" class="btn-secondary w-full">⧉ COPY REGISTRATION ID</button>
    </div>
  `;
  container.classList.remove("hidden");

  document.getElementById("dl-found-card")?.addEventListener("click", async () => {
    const btn = /** @type {HTMLButtonElement | null} */ (document.getElementById("dl-found-card"));
    if (btn) {
      btn.textContent = "⏳ GENERATING PASS...";
      btn.disabled = true;
    }
    try {
      await downloadPlayerCard(data);
      toastMsg("Player card downloaded! Check your photos / gallery.", "success");
    } catch (_) {
      toastMsg("Download failed. Try again.", "error");
    } finally {
      if (btn) {
        btn.textContent = "⬇ DOWNLOAD PLAYER CARD";
        btn.disabled = false;
      }
    }
  });

  document.getElementById("copy-found-id")?.addEventListener("click", () => {
    navigator.clipboard.writeText(data.registration_id).then(() => toastMsg("Copied!", "success"));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Form submit
  const form = /** @type {HTMLFormElement} */ (document.getElementById("find-id-form"));
  const findLabel = document.getElementById("find-label");
  const resultEl = document.getElementById("find-result");
  const notFoundEl = document.getElementById("find-not-found");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Hide previous results
    if (resultEl) resultEl.classList.add("hidden");
    if (notFoundEl) notFoundEl.classList.add("hidden");

    const regnoEl = /** @type {HTMLInputElement} */ (document.getElementById("lookup-regno"));
    const regnoErr = document.getElementById("err-lookup-regno");
    const regNoVal = (regnoEl?.value || "").toUpperCase().trim();

    if (!REG_NO_RE.test(regNoVal)) {
      if (regnoErr) regnoErr.textContent = "Enter a valid VJTI registration number (4-20 alphanumeric characters).";
      return;
    }
    if (regnoErr) regnoErr.textContent = "";

    const waEl = /** @type {HTMLInputElement} */ (document.getElementById("lookup-wa"));
    const waErr = document.getElementById("err-lookup-wa");
    const waNormalised = normaliseWhatsapp(waEl?.value || "");

    if (!waNormalised) {
      if (waErr) waErr.textContent = "Enter a valid 10-digit Indian mobile number (e.g. 9876543210).";
      return;
    }
    if (waErr) waErr.textContent = "";

    if (findLabel) findLabel.textContent = "VERIFYING...";

    try {
      // 1. Check local storage first (instant offline fallback)
      const saved = JSON.parse(localStorage.getItem("vjti_registrations") || "[]");
      const local = saved.find((/** @type {any} */ r) => r.reg_no === regNoVal && r.whatsapp === waNormalised);

      // 2. Fetch from /api/find-id
      const apiUrl = '/api/find-id';
      
      console.log('🔍 Looking up player via:', apiUrl);
      console.log('Search criteria:', { reg_no: regNoVal, whatsapp: waNormalised });
      
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reg_no: regNoVal, whatsapp: waNormalised })
      });

      if (res.ok) {
        const json = await res.json();
        renderPlayerCard(json.player || json);
        toastMsg("Registration found!", "success");
      } else if (res.status === 404) {
        if (local) {
          // Fallback to local storage if API didn't find but client registered on this device
          const findResultEl = document.getElementById("find-result");
          if (findResultEl) {
            findResultEl.innerHTML = `
              <div class="glass-panel rounded-2xl p-6 text-center">
                <p class="font-mono text-xs text-[#31D47B] tracking-widest uppercase mb-2">Verified From Device</p>
                <p class="font-display text-3xl font-black text-[#D4FF52] mb-2">${escapeHtml(local.registration_id)}</p>
                <p class="text-[#A7B2AC] text-sm">Save or screenshot this ID for matchday check-in.</p>
              </div>`;
            findResultEl.classList.remove("hidden");
          }
        } else {
          notFoundEl?.classList.remove("hidden");
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Lookup failed");
      }
    } catch (err) {
      toastMsg(/** @type {Error} */ (err).message || "Lookup failed. Check your connection.", "error");
    } finally {
      if (findLabel) findLabel.textContent = "VERIFY & FIND REGISTRATION ID";
    }
  });
});

