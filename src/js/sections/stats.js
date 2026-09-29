// @ts-check
import { gsap, ScrollTrigger } from "../core/gsap.js";

// Mock seed data for Phase 3 before live backend endpoint in Phase 4
const MOCK_STATS = {
  totalRegistered: 148,
  batters: 68,
  bowlers: 54,
  wicketkeepers: 26
};

const MOCK_BRANCHES = [
  { branch: "Computer Engineering", count: 34 },
  { branch: "Information Technology", count: 28 },
  { branch: "Mechanical Engineering", count: 24 },
  { branch: "Electronics & Telecomm", count: 20 },
  { branch: "Electrical Engineering", count: 18 },
  { branch: "Civil Engineering", count: 12 },
  { branch: "Production Engineering", count: 8 },
  { branch: "Textile Engineering", count: 4 }
];

export function initStats() {
  const statsSection = document.getElementById("stats-section");
  if (!statsSection) return;

  const totalEl = statsSection.querySelector("[data-stat='total']");
  const battersEl = statsSection.querySelector("[data-stat='batters']");
  const bowlersEl = statsSection.querySelector("[data-stat='bowlers']");
  const keepersEl = statsSection.querySelector("[data-stat='keepers']");
  const branchListEl = statsSection.querySelector("#branch-battle-list");

  // Animate count-up when scrolling into view
  ScrollTrigger.create({
    trigger: statsSection,
    start: "top 80%",
    once: true,
    onEnter: () => {
      // 1. Numbers count up
      const obj = { total: 0, batters: 0, bowlers: 0, keepers: 0 };
      gsap.to(obj, {
        total: MOCK_STATS.totalRegistered,
        batters: MOCK_STATS.batters,
        bowlers: MOCK_STATS.bowlers,
        keepers: MOCK_STATS.wicketkeepers,
        duration: 2.2,
        ease: "power2.out",
        onUpdate: () => {
          if (totalEl) totalEl.textContent = String(Math.floor(obj.total));
          if (battersEl) battersEl.textContent = String(Math.floor(obj.batters));
          if (bowlersEl) bowlersEl.textContent = String(Math.floor(obj.bowlers));
          if (keepersEl) keepersEl.textContent = String(Math.floor(obj.keepers));
        }
      });

      // 2. Animate Branch Battle Bars
      if (branchListEl) {
        const maxCount = MOCK_BRANCHES[0].count;
        branchListEl.innerHTML = MOCK_BRANCHES.map((b, i) => {
          const widthPercent = (b.count / maxCount) * 100;
          return `
            <div class="space-y-1.5 branch-item opacity-0 transform translate-y-3">
              <div class="flex items-center justify-between text-xs font-mono">
                <span class="text-[#f4f1e8] font-bold">${i + 1}. ${b.branch}</span>
                <span class="text-[#31d47b] font-bold">${b.count}</span>
              </div>
              <div class="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div class="h-full bg-gradient-to-r from-[#117A46] to-[#31D47B] rounded-full transition-all duration-1000 ease-out" 
                     style="width: 0%;" 
                     data-width="${widthPercent}%">
                </div>
              </div>
            </div>
          `;
        }).join("");

        // Stagger reveal of branch bars
        gsap.to(branchListEl.querySelectorAll(".branch-item"), {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.6,
          ease: "power2.out",
          onComplete: () => {
            branchListEl.querySelectorAll("[data-width]").forEach((bar) => {
              /** @type {HTMLElement} */ (bar).style.width = bar.getAttribute("data-width") || "0%";
            });
          }
        });
      }
    }
  });
}
