// @ts-check
/**
 * Public Squad Page Controller
 * Displays shortlisted players when squad is released
 */

import "../../css/main.css";
import { initLenis } from "../core/lenis.js";
import { supabase } from "../core/supabase.js";
import { renderDeveloperCredit } from "../../lib/credit.js";

const pendingView = document.getElementById("squad-pending-view");
const revealedView = document.getElementById("squad-revealed-view");
const squadSubtitle = document.getElementById("squad-subtitle");

const battersList = document.getElementById("squad-batters-grid");
const bowlersList = document.getElementById("squad-bowlers-grid");
const keepersList = document.getElementById("squad-keepers-grid");

/**
 * Check if squad has been released
 */
async function checkSquadReleaseStatus() {
  try {
    // First check localStorage for immediate feedback
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
      // Fall back to localStorage
      return localStatus ? JSON.parse(localStatus).released : false;
    }

    const isReleased = data?.value?.released || false;
    
    // Sync with localStorage
    localStorage.setItem("vjti_squad_released", JSON.stringify({
      released: isReleased,
      timestamp: data?.value?.timestamp || new Date().toISOString()
    }));

    return isReleased;
  } catch (err) {
    console.error("Exception checking squad status:", err);
    
    // Fallback to localStorage
    const localStatus = localStorage.getItem("vjti_squad_released");
    if (localStatus) {
      try {
        const parsed = JSON.parse(localStatus);
        return parsed.released || false;
      } catch (e) {
        return false;
      }
    }
    
    return false;
  }
}

/**
 * Load shortlisted/selected players
 */
async function loadSquadPlayers() {
  try {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .in("status", ["shortlisted", "selected"])
      .order("trial_score", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error("Error loading squad players:", err);
    return [];
  }
}

/**
 * Render a player card
 * @param {any} player
 */
function renderPlayerCard(player) {
  return `
    <div class="glass-panel p-4 rounded-xl border border-white/10 hover:border-[#31D47B]/40 transition-all group">
      <div class="flex items-start gap-3">
        ${player.photo_url 
          ? `<img src="${player.photo_url}" alt="${player.full_name}" class="w-12 h-12 rounded-full object-cover border-2 border-[#31D47B]/40 flex-shrink-0" />`
          : `<div class="w-12 h-12 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center flex-shrink-0">
               <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
               </svg>
             </div>`
        }
        <div class="flex-1 min-w-0">
          <h3 class="font-display font-black text-lg text-white leading-tight">${player.full_name}</h3>
          <p class="text-xs font-mono text-[#A7B2AC] mt-0.5">${player.program} · ${player.year} · ${player.branch}</p>
          <div class="flex items-center gap-2 mt-2">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#31D47B]/20 text-[#31D47B]">
              ${player.batting_style}
            </span>
            ${player.bowling_style !== "Doesn't bowl" 
              ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#D4FF52]/20 text-[#D4FF52]">
                   ${player.bowling_style}
                 </span>`
              : ''
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Display squad players grouped by role
 * @param {Array<any>} players
 */
function displaySquad(players) {
  const batters = players.filter((p) => p.primary_role === "Batter");
  const bowlers = players.filter((p) => p.primary_role === "Bowler");
  const keepers = players.filter((p) => p.primary_role === "Wicketkeeper");

  if (battersList) {
    battersList.innerHTML = batters.length > 0
      ? batters.map(renderPlayerCard).join("")
      : '<p class="text-[#A7B2AC] text-sm col-span-full text-center py-8">No batters shortlisted yet.</p>';
  }

  if (bowlersList) {
    bowlersList.innerHTML = bowlers.length > 0
      ? bowlers.map(renderPlayerCard).join("")
      : '<p class="text-[#A7B2AC] text-sm col-span-full text-center py-8">No bowlers shortlisted yet.</p>';
  }

  if (keepersList) {
    keepersList.innerHTML = keepers.length > 0
      ? keepers.map(renderPlayerCard).join("")
      : '<p class="text-[#A7B2AC] text-sm col-span-full text-center py-8">No wicketkeepers shortlisted yet.</p>';
  }
}

/**
 * Initialize page
 */
async function init() {
  initLenis();

  const isReleased = await checkSquadReleaseStatus();

  if (isReleased) {
    // Squad has been released - show players
    const players = await loadSquadPlayers();
    
    if (squadSubtitle) {
      squadSubtitle.textContent = `The final ${players.length}-player squad selected for the 2026–27 season.`;
    }

    pendingView?.classList.add("hidden");
    revealedView?.classList.remove("hidden");

    displaySquad(players);
  } else {
    // Squad not yet released - show pending message
    pendingView?.classList.remove("hidden");
    revealedView?.classList.add("hidden");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  init();
  
  // Initialize developer credit
  const creditContainer = document.getElementById('developer-credit');
  if (creditContainer) {
    renderDeveloperCredit(creditContainer);
  }
});
