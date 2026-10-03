// @ts-check
import { getRegisteredPlayer } from "../core/storage.js";

/**
 * Initialize the navigation bar with scroll effects and mobile menu toggle.
 * The mobile menu (#nav-mobile-menu) is a fixed full-screen overlay
 * that is a sibling of <nav>, NOT nested inside it.
 */
export function initNav() {
  const nav = document.getElementById("vjti-main-nav");
  const toggle = document.getElementById("nav-mobile-toggle");
  const menu = document.getElementById("nav-mobile-menu");
  const ctaSlot = document.getElementById("nav-cta-slot");
  const mobileCtaSlot = document.getElementById("nav-mobile-cta-slot");

  // Hamburger bar elements (styled via inline styles in HTML)
  const hbTop = document.getElementById("hb-top");
  const hbMid = document.getElementById("hb-mid");
  const hbBot = document.getElementById("hb-bot");

  if (!nav || !toggle || !menu) {
    console.error("Nav init failed — missing elements:", { nav: !!nav, toggle: !!toggle, menu: !!menu });
    return;
  }

  let isMenuOpen = false;

  /* ── Scroll styling ───────────────────────────────────────────── */
  const handleScroll = () => {
    if (isMenuOpen) return; // keep solid bg while menu is open
    if (window.scrollY > 80) {
      nav.style.backgroundColor = "rgba(5,8,7,0.92)";
      nav.style.backdropFilter = "blur(14px)";
      nav.style.webkitBackdropFilter = "blur(14px)";
      nav.style.borderBottomColor = "rgba(255,255,255,0.1)";
      nav.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)";
      nav.style.paddingTop = "12px";
      nav.style.paddingBottom = "12px";
    } else {
      nav.style.backgroundColor = "";
      nav.style.backdropFilter = "";
      nav.style.webkitBackdropFilter = "";
      nav.style.borderBottomColor = "transparent";
      nav.style.boxShadow = "";
      nav.style.paddingTop = "";
      nav.style.paddingBottom = "";
    }
  };

  /* ── Hamburger animation helpers ─────────────────────────────── */
  const animateOpen = () => {
    if (!hbTop || !hbMid || !hbBot) return;
    hbTop.style.transform = "translateY(7px) rotate(45deg)";
    hbMid.style.opacity = "0";
    hbMid.style.transform = "scaleX(0)";
    hbBot.style.transform = "translateY(-7px) rotate(-45deg)";
  };

  const animateClose = () => {
    if (!hbTop || !hbMid || !hbBot) return;
    hbTop.style.transform = "";
    hbMid.style.opacity = "1";
    hbMid.style.transform = "";
    hbBot.style.transform = "";
  };

  /* ── Open menu ───────────────────────────────────────────────── */
  const openMenu = () => {
    isMenuOpen = true;

    // Show the overlay
    menu.style.display = "flex";
    menu.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");

    // Animate hamburger → X
    animateOpen();

    // Give nav a solid background while menu is open
    nav.style.backgroundColor = "#050807";
    nav.style.borderBottomColor = "rgba(255,255,255,0.15)";
    nav.style.backdropFilter = "blur(14px)";
    nav.style.webkitBackdropFilter = "blur(14px)";

    // Prevent body scroll without layout shift
    document.body.style.overflow = "hidden";
  };

  /* ── Close menu ──────────────────────────────────────────────── */
  const closeMenu = () => {
    isMenuOpen = false;

    // Hide the overlay
    menu.style.display = "none";
    menu.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");

    // Animate X → hamburger
    animateClose();

    // Restore body scroll
    document.body.style.overflow = "";

    // Restore scroll-based nav styling
    handleScroll();
  };

  /* ── Toggle ──────────────────────────────────────────────────── */
  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isMenuOpen ? closeMenu() : openMenu();
  };

  /* ── Event listeners ─────────────────────────────────────────── */
  toggle.addEventListener("click", toggleMenu);
  toggle.addEventListener("touchend", (e) => { e.preventDefault(); toggleMenu(e); }, { passive: false });

  // Close when a nav link is tapped
  menu.querySelectorAll(".mobile-nav-link").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isMenuOpen) closeMenu();
  });

  // Scroll styling
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  // Set initial aria states
  menu.setAttribute("aria-hidden", "true");

  /* ── Player registration chip ────────────────────────────────── */
  const player = getRegisteredPlayer();
  if (player && player.registrationId) {
    const chipHtml = `
      <a href="/find-id.html" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#117A46]/20 border border-[#31D47B]/40 text-[#31D47B] font-mono text-xs font-bold hover:bg-[#117A46]/30 transition-colors">
        <span class="w-2 h-2 rounded-full bg-[#31D47B] animate-pulse"></span>
        <span>YOU'RE IN • ${player.registrationId}</span>
      </a>
    `;
    if (ctaSlot) ctaSlot.innerHTML = chipHtml;
    if (mobileCtaSlot) mobileCtaSlot.innerHTML = chipHtml;
  }

  console.log("✅ Nav initialized — mobile menu ready");
}
