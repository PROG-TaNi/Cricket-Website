// @ts-check
/**
 * Organizer Trials & Net Lanes Controller
 */

import "../../css/main.css";
import { initOrganizerLayout } from "./layout.js";
import { getPlayers, updatePlayer } from "./data.js";
import { toastMsg } from "../components/toast.js";

/** @type {Array<any>} */
let allPlayers = [];
let activeBatch = "Batch A";

const net1List = document.getElementById("net1-list");
const net2List = document.getElementById("net2-list");
const net3List = document.getElementById("net3-list");
const net1Count = document.getElementById("net1-count");
const net2Count = document.getElementById("net2-count");
const net3Count = document.getElementById("net3-count");

/**
 * Render the 3 net lanes for the active batch
 */
function renderLanes() {
  const batchPlayers = allPlayers.filter((p) => (p.trial_batch || "Batch A") === activeBatch);

  const net1Players = batchPlayers.filter((p) => (p.trial_net || "Net 1") === "Net 1");
  const net2Players = batchPlayers.filter((p) => p.trial_net === "Net 2");
  const net3Players = batchPlayers.filter((p) => p.trial_net === "Net 3");

  if (net1Count) net1Count.textContent = String(net1Players.length);
  if (net2Count) net2Count.textContent = String(net2Players.length);
  if (net3Count) net3Count.textContent = String(net3Players.length);

  const renderCard = (/** @type {any} */ p) => `
    <div class="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 hover:border-[#31D47B]/40 transition-colors">
      <div class="flex items-start justify-between">
        <div>
          <span class="font-mono text-[10px] text-[#31D47B] font-bold">${p.registration_id}</span>
          <h4 class="font-bold text-white text-xs">${p.full_name}</h4>
          <p class="text-[10px] text-[#A7B2AC] font-mono">${p.program} (${p.year})</p>
        </div>
        <span class="text-sm">${p.primary_role === "Batter" ? "🏏" : p.primary_role === "Bowler" ? "🎯" : "🧤"}</span>
      </div>

      <div class="flex justify-between items-center text-[10px] font-mono pt-1 border-t border-white/5">
        <span class="text-[#64716A]">${p.batting_style}</span>
        ${p.rating ? `<span class="text-[#31D47B] font-bold">★ ${p.rating}</span>` : ""}
      </div>

      <div class="flex items-center justify-between gap-2 pt-1">
        <span class="text-[9px] font-mono text-[#64716A]">Shift:</span>
        <select 
          class="net-shift-select bg-[#07100B] border border-white/15 rounded px-2 py-0.5 text-[10px] font-mono text-[#A7B2AC] hover:text-white"
          data-reg-id="${p.registration_id}"
        >
          <option value="Net 1" ${p.trial_net === "Net 1" || !p.trial_net ? "selected" : ""}>Move Net 1</option>
          <option value="Net 2" ${p.trial_net === "Net 2" ? "selected" : ""}>Move Net 2</option>
          <option value="Net 3" ${p.trial_net === "Net 3" ? "selected" : ""}>Move Net 3</option>
        </select>
      </div>
    </div>
  `;

  if (net1List) {
    net1List.innerHTML = net1Players.length > 0 
      ? net1Players.map(renderCard).join("") 
      : `<div class="p-6 text-center text-[#64716A] font-mono text-xs">No candidates in Net 1</div>`;
  }

  if (net2List) {
    net2List.innerHTML = net2Players.length > 0 
      ? net2Players.map(renderCard).join("") 
      : `<div class="p-6 text-center text-[#64716A] font-mono text-xs">No candidates in Net 2</div>`;
  }

  if (net3List) {
    net3List.innerHTML = net3Players.length > 0 
      ? net3Players.map(renderCard).join("") 
      : `<div class="p-6 text-center text-[#64716A] font-mono text-xs">No candidates in Net 3</div>`;
  }

  // Attach net switch handlers
  document.querySelectorAll(".net-shift-select").forEach((selectEl) => {
    selectEl.addEventListener("change", async (e) => {
      const select = /** @type {HTMLSelectElement} */ (e.target);
      const regId = select.getAttribute("data-reg-id");
      const targetNet = select.value;
      if (!regId) return;

      await updatePlayer(regId, { trial_net: targetNet });
      const idx = allPlayers.findIndex((p) => p.registration_id === regId);
      if (idx !== -1) {
        allPlayers[idx].trial_net = targetNet;
      }
      toastMsg(`Moved ${regId} to ${targetNet}`, "info");
      renderLanes();
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await initOrganizerLayout(window.location.pathname);

  allPlayers = await getPlayers();
  renderLanes();

  // Batch Tabs Switcher
  document.querySelectorAll(".batch-tab").forEach((tabBtn) => {
    tabBtn.addEventListener("click", () => {
      document.querySelectorAll(".batch-tab").forEach((b) => {
        b.classList.remove("bg-[#31D47B]", "text-black", "font-bold");
        b.classList.add("bg-white/5", "text-[#A7B2AC]");
      });
      tabBtn.classList.add("bg-[#31D47B]", "text-black", "font-bold");
      tabBtn.classList.remove("bg-white/5", "text-[#A7B2AC]");

      activeBatch = tabBtn.getAttribute("data-batch") || "Batch A";
      renderLanes();
    });
  });
});
