// @ts-check
/**
 * Squad Reveal Page Controller
 */

import "../../css/main.css";
import { initLenis } from "../core/lenis.js";
import { initNav } from "../components/nav.js";
import { getSiteSettings, getPlayers } from "../organizer/data.js";
import confetti from "canvas-confetti";

initLenis();
initNav();

document.addEventListener("DOMContentLoaded", async () => {
  const settings = await getSiteSettings();
  const pendingView = document.getElementById("squad-pending-view");
  const revealedView = document.getElementById("squad-revealed-view");

  const isPublished = Boolean(settings?.results_published);

  if (isPublished) {
    if (pendingView) pendingView.classList.add("hidden");
    if (revealedView) revealedView.classList.remove("hidden");

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#31D47B", "#D4FF52", "#F4F1E8"]
      });
    } catch (_) {}

    const allPlayers = await getPlayers();
    const squadPlayers = allPlayers.filter((p) => p.status === "shortlisted");

    const batters = squadPlayers.filter((p) => p.primary_role === "Batter");
    const bowlers = squadPlayers.filter((p) => p.primary_role === "Bowler");
    const keepers = squadPlayers.filter((p) => p.primary_role === "Wicketkeeper");

    const battersGrid = document.getElementById("squad-batters-grid");
    const bowlersGrid = document.getElementById("squad-bowlers-grid");
    const keepersGrid = document.getElementById("squad-keepers-grid");

    const renderSquadCard = (/** @type {any} */ p) => `
      <div class="glass-panel p-5 rounded-2xl border-white/10 hover:border-[#31D47B]/40 transition-colors space-y-2">
        <div class="flex items-start justify-between">
          <div>
            <span class="font-mono text-[10px] text-[#31D47B] font-bold">${p.registration_id}</span>
            <h3 class="font-display font-black text-xl text-white mt-0.5">${p.full_name}</h3>
            <p class="text-xs font-mono text-[#A7B2AC]">${p.branch} · ${p.program} (${p.year})</p>
          </div>
          <span class="text-xl">${p.primary_role === "Batter" ? "🏏" : p.primary_role === "Bowler" ? "🎯" : "🧤"}</span>
        </div>
        <div class="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-[#64716A]">
          <span>${p.batting_style}</span>
          <span>${p.bowling_style}</span>
        </div>
      </div>
    `;

    if (battersGrid) {
      battersGrid.innerHTML = batters.length > 0 
        ? batters.map(renderSquadCard).join("") 
        : `<p class="text-xs font-mono text-[#64716A] col-span-3">To be finalized.</p>`;
    }

    if (bowlersGrid) {
      bowlersGrid.innerHTML = bowlers.length > 0 
        ? bowlers.map(renderSquadCard).join("") 
        : `<p class="text-xs font-mono text-[#64716A] col-span-3">To be finalized.</p>`;
    }

    if (keepersGrid) {
      keepersGrid.innerHTML = keepers.length > 0 
        ? keepers.map(renderSquadCard).join("") 
        : `<p class="text-xs font-mono text-[#64716A] col-span-3">To be finalized.</p>`;
    }
  } else {
    if (pendingView) pendingView.classList.remove("hidden");
    if (revealedView) revealedView.classList.add("hidden");
  }
});
