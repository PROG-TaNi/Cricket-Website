// @ts-check
import { gsap, ScrollTrigger } from "../core/gsap.js";

export function initRules() {
  const rulesSection = document.getElementById("rules");
  if (!rulesSection) return;

  const cards = gsap.utils.toArray(".stacking-rule-card");
  const checklistItems = gsap.utils.toArray(".carry-checklist-item");

  const mm = gsap.matchMedia();

  // Desktop Stacking Cards Pin & Zoom-Back Effect
  mm.add("(min-width: 769px) and (prefers-reduced-motion: no-preference)", () => {
    cards.forEach((card, index) => {
      // Pin each card except the last
      if (index < cards.length - 1) {
        ScrollTrigger.create({
          trigger: /** @type {HTMLElement} */ (card),
          start: "top 15%",
          endTrigger: rulesSection,
          end: "bottom 80%",
          pin: true,
          pinSpacing: false,
          scrub: true,
          onUpdate: (self) => {
            // As user scrolls past, scale down and dim the card
            const progress = self.progress;
            gsap.to(card, {
              scale: 1 - progress * 0.08,
              opacity: 1 - progress * 0.4,
              filter: `blur(${progress * 4}px)`,
              ease: "none",
              overwrite: "auto"
            });
          }
        });
      }
    });
  });

  // Checklist Items reveal with animated tick
  if (checklistItems.length > 0) {
    ScrollTrigger.create({
      trigger: "#carry-checklist-container",
      start: "top 80%",
      once: true,
      onEnter: () => {
        gsap.fromTo(checklistItems, 
          { opacity: 0, x: -20 },
          { opacity: 1, x: 0, stagger: 0.1, duration: 0.6, ease: "power2.out" }
        );
      }
    });
  }
}
