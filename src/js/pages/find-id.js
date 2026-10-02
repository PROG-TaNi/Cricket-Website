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
import { supabase } from "../core/supabase.js";

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
 * Check if squad has been released
 */
async function checkSquadReleased() {
  try {
    // Check localStorage first
    const localStatus = localStorage.getItem("vjti_squad_released");
    if (localStatus) {
      try {
        const parsed = JSON.parse(localStatus);
        if (parsed.released !== undefined) {
          return parsed.released;
        }
      } catch (e) {
        console.warn("Failed to parse local squad status:", e);
      }
    }

    // Then check Supabase
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "squad_released")
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error checking squad status:", error);
      return false;
    }

    return data?.value?.released || false;
  } catch (err) {
    console.error("Exception checking squad status:", err);
    return false;
  }
}

/**
 * Render congratulations card for selected player
 * @param {{registration_id: string, full_name: string, primary_role: string, program: string, year: string, branch: string, batting_style: string, bowling_style: string, photo_url?: string | null, status: string}} data
 */
function renderCongratulationsCard(data) {
  const container = document.getElementById("find-result");
  if (!container) return;

  const photoHtml = data.photo_url
    ? `<div class="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#31D47B] overflow-hidden mx-auto mb-4 shadow-2xl bg-black animate-pulse-slow">
         <img src="${data.photo_url}" alt="${escapeHtml(data.full_name)}" class="w-full h-full object-cover" />
         <div class="absolute inset-0 bg-gradient-to-t from-[#31D47B]/20 to-transparent"></div>
       </div>`
    : `<div class="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#31D47B] bg-gradient-to-br from-[#31D47B]/20 to-[#D4FF52]/10 flex items-center justify-center mx-auto mb-4 shadow-2xl animate-pulse-slow">
         <svg class="w-12 h-12 text-[#31D47B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
         </svg>
       </div>`;

  container.innerHTML = `
    <!-- Confetti Background Animation -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden" style="z-index: -1;">
      <div class="confetti-piece" style="left: 10%; animation-delay: 0s;"></div>
      <div class="confetti-piece" style="left: 20%; animation-delay: 0.2s;"></div>
      <div class="confetti-piece" style="left: 30%; animation-delay: 0.4s;"></div>
      <div class="confetti-piece" style="left: 40%; animation-delay: 0.6s;"></div>
      <div class="confetti-piece" style="left: 50%; animation-delay: 0.8s;"></div>
      <div class="confetti-piece" style="left: 60%; animation-delay: 1s;"></div>
      <div class="confetti-piece" style="left: 70%; animation-delay: 1.2s;"></div>
      <div class="confetti-piece" style="left: 80%; animation-delay: 1.4s;"></div>
      <div class="confetti-piece" style="left: 90%; animation-delay: 1.6s;"></div>
    </div>

    <!-- Congratulations Card -->
    <div class="glass-panel rounded-3xl p-8 sm:p-10 mb-6 text-center border-2 border-[#31D47B] bg-gradient-to-br from-[#31D47B]/5 via-transparent to-[#D4FF52]/5 relative overflow-hidden">
      
      <!-- Trophy Icon -->
      <div class="absolute top-4 right-4 opacity-10">
        <svg class="w-16 h-16 text-[#D4FF52]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5 3v12a2 2 0 002 2h6a2 2 0 002-2V3M3 7h14M10 3v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <!-- Success Badge -->
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#31D47B] text-black font-mono text-xs font-bold mb-6 animate-bounce-slow shadow-lg">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
        </svg>
        <span>OFFICIALLY SELECTED</span>
      </div>

      ${photoHtml}

      <!-- Congratulations Message -->
      <div class="space-y-3 mb-6">
        <h2 class="font-display text-4xl sm:text-5xl font-black text-[#31D47B] tracking-tight leading-none">
          CONGRATULATIONS!
        </h2>
        <p class="font-display text-2xl sm:text-3xl font-black text-white leading-tight">
          ${escapeHtml(data.full_name)}
        </p>
        <div class="flex items-center justify-center gap-2 text-[#D4FF52] font-mono text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span class="font-bold">${escapeHtml(data.registration_id)}</span>
        </div>
      </div>

      <!-- Selection Message -->
      <div class="bg-white/5 rounded-2xl p-6 border border-[#31D47B]/30 mb-6">
        <p class="text-white text-lg sm:text-xl font-bold leading-relaxed mb-3">
          You have been officially selected for the<br>
          <span class="text-[#31D47B]">VJTI College Cricket Team 2026–27!</span>
        </p>
        <p class="text-[#A7B2AC] text-sm leading-relaxed">
          Your exceptional performance during the trials has earned you a spot on our squad. 
          This is the beginning of an exciting journey. Welcome to the team!
        </p>
      </div>

      <!-- Player Details -->
      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="bg-[#31D47B]/10 rounded-xl p-3 border border-[#31D47B]/20">
          <span class="text-[#64716A] text-xs font-mono block mb-1">ROLE</span>
          <span class="text-white font-bold text-sm">${escapeHtml(data.primary_role)}</span>
        </div>
        <div class="bg-[#D4FF52]/10 rounded-xl p-3 border border-[#D4FF52]/20">
          <span class="text-[#64716A] text-xs font-mono block mb-1">PROGRAM</span>
          <span class="text-white font-bold text-sm">${escapeHtml(data.program)} · ${escapeHtml(data.year)}</span>
        </div>
        <div class="bg-white/5 rounded-xl p-3 border border-white/10">
          <span class="text-[#64716A] text-xs font-mono block mb-1">BATTING</span>
          <span class="text-white font-bold text-sm">${escapeHtml(data.batting_style)}</span>
        </div>
        <div class="bg-white/5 rounded-xl p-3 border border-white/10">
          <span class="text-[#64716A] text-xs font-mono block mb-1">BOWLING</span>
          <span class="text-white font-bold text-sm">${escapeHtml(data.bowling_style)}</span>
        </div>
      </div>

      <!-- Next Steps -->
      <div class="bg-[#D4FF52]/5 rounded-2xl p-6 border border-[#D4FF52]/30 mb-6 text-left">
        <h3 class="font-mono text-xs text-[#D4FF52] uppercase font-bold mb-3 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          WHAT'S NEXT?
        </h3>
        <ul class="space-y-2 text-[#A7B2AC] text-sm">
          <li class="flex items-start gap-2">
            <svg class="w-4 h-4 text-[#31D47B] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <span>Check your WhatsApp for official team communication group link</span>
          </li>
          <li class="flex items-start gap-2">
            <svg class="w-4 h-4 text-[#31D47B] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <span>Practice session details will be shared via the group</span>
          </li>
          <li class="flex items-start gap-2">
            <svg class="w-4 h-4 text-[#31D47B] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <span>Keep your cricket gear ready for upcoming matches</span>
          </li>
          <li class="flex items-start gap-2">
            <svg class="w-4 h-4 text-[#31D47B] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
            <span>Stay fit and maintain peak performance throughout the season</span>
          </li>
        </ul>
      </div>

      <!-- Motivational Quote -->
      <div class="border-t border-white/10 pt-6">
        <p class="text-[#D4FF52] font-display text-lg italic leading-relaxed">
          "Champions aren't made in gyms. Champions are made from something they have deep inside them—a desire, a dream, a vision."
        </p>
        <p class="text-[#64716A] text-xs font-mono mt-2">— Muhammad Ali</p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-col gap-3">
      <a href="/squad.html" class="btn-primary w-full flex items-center justify-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>VIEW FULL SQUAD</span>
      </a>
      <button id="dl-found-card" class="btn-secondary w-full flex items-center justify-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>DOWNLOAD PLAYER CARD</span>
      </button>
      <button id="copy-found-id" class="btn-ghost w-full flex items-center justify-center gap-2 text-xs">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <span>COPY REGISTRATION ID</span>
      </button>
    </div>
  `;
  container.classList.remove("hidden");

  // Download card button
  document.getElementById("dl-found-card")?.addEventListener("click", async () => {
    const btn = /** @type {HTMLButtonElement | null} */ (document.getElementById("dl-found-card"));
    if (btn) {
      btn.innerHTML = `<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg><span>GENERATING...</span>`;
      btn.disabled = true;
    }
    try {
      await downloadPlayerCard(data);
      toastMsg("🎉 Player card downloaded! Check your photos / gallery.", "success");
    } catch (_) {
      toastMsg("Download failed. Try again.", "error");
    } finally {
      if (btn) {
        btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg><span>DOWNLOAD PLAYER CARD</span>`;
        btn.disabled = false;
      }
    }
  });

  // Copy ID button
  document.getElementById("copy-found-id")?.addEventListener("click", () => {
    navigator.clipboard.writeText(data.registration_id).then(() => toastMsg("📋 Registration ID copied!", "success"));
  });
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
        const playerData = json.player || json;
        
        // Check if squad is released and player is selected
        const isSquadReleased = await checkSquadReleased();
        const isSelected = playerData.status === "shortlisted" || playerData.status === "selected";
        
        if (isSquadReleased && isSelected) {
          // Show congratulations card for selected players
          renderCongratulationsCard(playerData);
          toastMsg("🎉 Congratulations! You're in the squad!", "success");
        } else {
          // Show regular player card
          renderPlayerCard(playerData);
          toastMsg("Registration found!", "success");
        }
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

