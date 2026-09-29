// @ts-check
import { gsap } from "../core/gsap.js";

/**
 * Attaches smooth 3D tilt and cursor-following glow to cards on desktop.
 * @param {string | NodeListOf<HTMLElement>} target
 * @param {number} [maxTilt=10]
 */
export function initTilt(target, maxTilt = 10) {
  if (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  /** @type {NodeListOf<HTMLElement>} */
  const elements = /** @type {NodeListOf<HTMLElement>} */ (typeof target === "string" ? document.querySelectorAll(target) : target);

  elements.forEach((el) => {
    const card = el;
    card.style.transformStyle = "preserve-3d";

    const onMouseMove = (/** @type {MouseEvent} */ e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const xPercent = (x / rect.width - 0.5) * 2; // -1 to 1
      const yPercent = (y / rect.height - 0.5) * 2; // -1 to 1

      // Set CSS variables for cursor-following border glow
      card.style.setProperty("--glow-x", `${x}px`);
      card.style.setProperty("--glow-y", `${y}px`);

      gsap.to(card, {
        rotationY: xPercent * maxTilt,
        rotationX: -yPercent * maxTilt,
        transformPerspective: 1000,
        ease: "power1.out",
        duration: 0.3
      });
    };

    const onMouseLeave = () => {
      gsap.to(card, {
        rotationY: 0,
        rotationX: 0,
        ease: "power2.out",
        duration: 0.6
      });
    };

    card.addEventListener("mousemove", onMouseMove);
    card.addEventListener("mouseleave", onMouseLeave);
  });
}
