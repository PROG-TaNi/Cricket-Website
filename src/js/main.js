// @ts-check
import "../css/main.css";
import { initLenis } from "./core/lenis.js";
import { initNav } from "./components/nav.js";
import "./components/countdown.js";
import { toast } from "./components/toast.js";

// Make toast available globally if needed
// @ts-ignore
window.toast = toast;

document.addEventListener("DOMContentLoaded", () => {
  // Initialize smooth scroll
  initLenis();

  // Initialize navigation
  initNav();

  console.log("VJTI Cricket Trials 2026-27 core system initialized.");
});
