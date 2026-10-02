// @ts-check
import { gsap, ScrollTrigger } from "../core/gsap.js";

/**
 * Fetches live stats from /api/stats.
 * Returns zeros on any failure so the scoreboard never breaks.
 *
 * @returns {Promise<{ total: number, batters: number, bowlers: number, keepers: number, live: boolean }>}
 */
async function fetchStats() {
  try {
    const res = await fetch("/api/stats", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return {
      total:   Number(json.total   ?? 0),
      batters: Number(json.batters ?? 0),
      bowlers: Number(json.bowlers ?? 0),
      keepers: Number(json.keepers ?? 0),
      live:    Boolean(json.live),
    };
  } catch {
    return { total: 0, batters: 0, bowlers: 0, keepers: 0, live: false };
  }
}

/**
 * Animates the number displayed in an element to a new target value.
 *
 * @param {Element | null} el
 * @param {number} from
 * @param {number} to
 * @param {number} duration
 */
function animateTo(el, from, to, duration) {
  if (!el) return;
  const obj = { v: from };
  gsap.to(obj, {
    v: to,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = String(Math.floor(obj.v));
    },
  });
}

export function initStats() {
  const statsSection = document.getElementById("stats-section");
  if (!statsSection) return;

  const totalEl   = statsSection.querySelector("[data-stat='total']");
  const battersEl = statsSection.querySelector("[data-stat='batters']");
  const bowlersEl = statsSection.querySelector("[data-stat='bowlers']");
  const keepersEl = statsSection.querySelector("[data-stat='keepers']");
  const liveLabel = statsSection.querySelector(".stats-live-badge");

  // Track the current displayed values so updates animate from them
  let current = { total: 0, batters: 0, bowlers: 0, keepers: 0 };

  /**
   * Loads stats from the API and animates to new values.
   * @param {boolean} firstLoad - true → use a longer count-up animation
   */
  async function loadAndAnimate(firstLoad = false) {
    const stats = await fetchStats();
    const duration = firstLoad ? 2.2 : 0.8;

    animateTo(totalEl,   current.total,   stats.total,   duration);
    animateTo(battersEl, current.batters, stats.batters, duration);
    animateTo(bowlersEl, current.bowlers, stats.bowlers, duration);
    animateTo(keepersEl, current.keepers, stats.keepers, duration);

    // Show/hide "LIVE" badge depending on Supabase connection
    if (liveLabel) {
      liveLabel.classList.toggle("opacity-0", !stats.live);
    }

    current = stats;
  }

  // Trigger first load when section scrolls into view
  let hasLoaded = false;
  ScrollTrigger.create({
    trigger: statsSection,
    start: "top 80%",
    once: true,
    onEnter: async () => {
      hasLoaded = true;
      await loadAndAnimate(true);
      // Refresh every 30 seconds while the tab is visible
      const interval = setInterval(() => {
        if (document.hidden) return;
        loadAndAnimate(false);
      }, 30_000);
      // Stop polling if the section is removed (single-page nav)
      statsSection.addEventListener("disconnected", () => clearInterval(interval), { once: true });
    },
  });

  // Also refresh when tab becomes visible again (user switches back)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && hasLoaded) loadAndAnimate(false);
  });
}
