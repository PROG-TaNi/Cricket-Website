// @ts-check
import { getRegisteredPlayer } from "../core/storage.js";

export function initNav() {
  const nav = document.getElementById("vjti-main-nav");
  const toggle = document.getElementById("nav-mobile-toggle");
  const menu = document.getElementById("nav-mobile-menu");
  const ctaSlot = document.getElementById("nav-cta-slot");
  const mobileCtaSlot = document.getElementById("nav-mobile-cta-slot");

  // Scroll blur & background
  const onScroll = () => {
    if (!nav) return;
    if (window.scrollY > 80) {
      nav.classList.add("bg-[#050807]/90", "backdrop-blur-md", "border-white/10", "shadow-xl");
      nav.classList.remove("border-transparent", "py-4");
      nav.classList.add("py-3");
    } else {
      nav.classList.remove("bg-[#050807]/90", "backdrop-blur-md", "border-white/10", "shadow-xl", "py-3");
      nav.classList.add("border-transparent", "py-4");
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu toggle
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const isOpen = !menu.classList.contains("hidden");
      if (isOpen) {
        menu.classList.add("hidden");
        document.body.style.overflow = "";
      } else {
        menu.classList.remove("hidden");
        document.body.style.overflow = "hidden";
      }
    });

    // Close on mobile link click
    menu.querySelectorAll(".mobile-nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.add("hidden");
        document.body.style.overflow = "";
      });
    });
  }

  // Check if player is already registered
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
}
