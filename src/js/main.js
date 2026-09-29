// @ts-check
import "../css/main.css";
import { initLenis } from "./core/lenis.js";
import { initNav } from "./components/nav.js";
import { initHero } from "./sections/hero.js";
import "./components/countdown.js";
import { toast } from "./components/toast.js";

// Global toast access
// @ts-ignore
window.toast = toast;

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Lenis smooth scroll
  initLenis();

  // 2. Initialize Navigation controller
  initNav();

  // 3. Initialize Signature Camera-Dolly Hero
  initHero();

  console.log("VJTI Cricket Trials 2026–27 Phase 2 Hero & Nav initialized.");
});
