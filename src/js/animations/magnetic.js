// @ts-check
import { gsap } from "../core/gsap.js";

/**
 * Attaches a magnetic pull effect to elements on desktop.
 * Automatically disabled on touch devices and for prefers-reduced-motion.
 * @param {string | HTMLElement | NodeListOf<HTMLElement>} target
 * @param {number} [strength=0.35]
 */
export function initMagnetic(target, strength = 0.35) {
  // Check touch / reduced motion
  if (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const elements = typeof target === "string" 
    ? document.querySelectorAll(target) 
    : target instanceof HTMLElement 
    ? [target] 
    : target;

  elements.forEach((el) => {
    /** @type {HTMLElement} */
    const element = el;

    const onMouseMove = (/** @type {MouseEvent} */ e) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      gsap.to(element, {
        x: deltaX,
        y: deltaY,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const onMouseLeave = () => {
      gsap.to(element, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.4)"
      });
    };

    element.addEventListener("mousemove", onMouseMove);
    element.addEventListener("mouseleave", onMouseLeave);
  });
}
