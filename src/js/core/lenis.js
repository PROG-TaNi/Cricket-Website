// @ts-check
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap.js";

/** @type {Lenis | null} */
let lenisInstance = null;

export function initLenis() {
  // Check if reduced motion is requested
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    return null;
  }

  if (lenisInstance) return lenisInstance;

  lenisInstance = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: "vertical",
    smoothWheel: true
  });

  // Sync with GSAP ScrollTrigger
  lenisInstance.on("scroll", ScrollTrigger.update);

  gsap.ticker.add((time) => {
    if (lenisInstance) {
      lenisInstance.raf(time * 1000);
    }
  });

  gsap.ticker.lagSmoothing(0);

  return lenisInstance;
}

export function getLenis() {
  return lenisInstance;
}
