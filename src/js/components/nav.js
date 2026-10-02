// @ts-check
import { getRegisteredPlayer } from "../core/storage.js";

export function initNav() {
  console.log("🔧 initNav called");
  const nav = document.getElementById("vjti-main-nav");
  const toggle = document.getElementById("nav-mobile-toggle");
  const menu = document.getElementById("nav-mobile-menu");
  const ctaSlot = document.getElementById("nav-cta-slot");
  const mobileCtaSlot = document.getElementById("nav-mobile-cta-slot");

  console.log("📱 Nav elements found:", {
    nav: !!nav,
    toggle: !!toggle,
    menu: !!menu,
    ctaSlot: !!ctaSlot,
    mobileCtaSlot: !!mobileCtaSlot
  });

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
    console.log("✅ Setting up mobile menu toggle");
    
    // Test if the button is visible
    const rect = toggle.getBoundingClientRect();
    console.log("📐 Toggle button position:", rect);
    console.log("👆 Toggle button styles:", {
      display: window.getComputedStyle(toggle).display,
      visibility: window.getComputedStyle(toggle).visibility,
      pointerEvents: window.getComputedStyle(toggle).pointerEvents,
      zIndex: window.getComputedStyle(toggle).zIndex
    });
    
    const handleToggle = (e) => {
      console.log("🖱️ HAMBURGER CLICKED!", e.type);
      e.preventDefault();
      e.stopPropagation();
      
      const isOpen = !menu.classList.contains("hidden");
      console.log("Menu currently open?", isOpen);
      if (isOpen) {
        // Close menu
        console.log("🔴 Closing menu");
        menu.classList.add("hidden");
        toggle.classList.remove("nav-open");
        document.body.style.overflow = "";
        // Remove solid black background from nav
        if (nav) {
          nav.classList.remove("!bg-[#050807]", "!border-white/20");
          // Restore scroll-based styling
          onScroll();
        }
      } else {
        // Open menu
        console.log("🟢 Opening menu");
        menu.classList.remove("hidden");
        toggle.classList.add("nav-open");
        document.body.style.overflow = "hidden";
        // Make nav solid black when menu is open
        if (nav) {
          nav.classList.add("!bg-[#050807]", "!border-white/20", "backdrop-blur-md", "shadow-xl");
        }
      }
    };
    
    // Add both click and touchstart for mobile compatibility
    toggle.addEventListener("click", handleToggle);
    toggle.addEventListener("touchstart", handleToggle, { passive: false });
    console.log("📱 Added click and touchstart listeners");

    // Close on mobile link click
    menu.querySelectorAll(".mobile-nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        console.log("🔗 Mobile nav link clicked");
        menu.classList.add("hidden");
        toggle.classList.remove("nav-open");
        document.body.style.overflow = "";
        // Remove solid black background from nav
        if (nav) {
          nav.classList.remove("!bg-[#050807]", "!border-white/20");
          // Restore scroll-based styling
          onScroll();
        }
      });
    });
  } else {
    console.error("❌ Toggle or menu not found!", { toggle, menu });
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
