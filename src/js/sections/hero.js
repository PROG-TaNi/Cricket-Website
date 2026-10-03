// @ts-check
import { gsap, ScrollTrigger } from "../core/gsap.js";
import { initMagnetic } from "../animations/magnetic.js";

export function initHero() {
  const heroSection = document.getElementById("hero");
  if (!heroSection) return;

  const bgLayers = heroSection.querySelector(".hero-layers-container");
  const headline = heroSection.querySelector(".hero-headline");
  const eyebrow = heroSection.querySelector(".hero-eyebrow");
  const dateVenue = heroSection.querySelector(".hero-date-venue");
  const statement = heroSection.querySelector(".hero-statement");
  const support = heroSection.querySelector(".hero-support");
  const countdown = heroSection.querySelector(".hero-countdown");
  const ctas = heroSection.querySelector(".hero-ctas");
  const statusBadge = heroSection.querySelector(".hero-status");
  const scrollIndicator = heroSection.querySelector(".hero-scroll-indicator");
  
  // Layer elements
  const layerSky = heroSection.querySelector(".layer-sky");
  const layerLights = heroSection.querySelector(".layer-lights");
  const layerStands = heroSection.querySelector(".layer-stands");
  const layerPitch = heroSection.querySelector(".layer-pitch");
  const layerGrass = heroSection.querySelector(".layer-grass");
  const lightGlow = heroSection.querySelector(".hero-light-glow");

  // Sticky Mobile CTA bar
  const stickyCtaBar = document.getElementById("mobile-sticky-cta");

  // Magnetic button on primary CTA (desktop only)
  initMagnetic(".btn-magnetic", 0.35);

  const mm = gsap.matchMedia();

  // 1. DESKTOP ANIMATION (> 768px)
  mm.add("(min-width: 769px) and (prefers-reduced-motion: no-preference)", () => {
    // Camera Dolly Scroll Timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroSection,
        start: "top top",
        end: "+=150%",
        pin: true,
        scrub: 1,
        anticipatePin: 1
      }
    });

    // Sub-elements fade out early (30-50%)
    tl.to([eyebrow, dateVenue, statement, support, countdown, ctas, statusBadge, scrollIndicator], {
      opacity: 0,
      y: -25,
      stagger: 0.02,
      ease: "power1.inOut"
    }, 0);

    // Headline scales 1 -> 2.5 and passes through camera (fading 40-80%)
    tl.to(headline, {
      scale: 2.5,
      opacity: 0,
      ease: "power2.in"
    }, 0.1);

    // Background layers camera dolly into the pitch (scale 1 -> 1.8)
    tl.to(bgLayers, {
      scale: 1.8,
      ease: "power1.inOut"
    }, 0);

    // Foreground grass moves down in parallax
    if (layerGrass) {
      tl.to(layerGrass, {
        yPercent: -15,
        ease: "power1.out"
      }, 0);
    }

    // Floodlight glow intensifies
    if (lightGlow) {
      tl.to(lightGlow, {
        opacity: 0.95,
        scale: 1.4,
        ease: "power1.inOut"
      }, 0);
    }

    // Mouse-move Parallax on desktop
    const onMouseMove = (/** @type {MouseEvent} */ e) => {
      const { clientX, clientY } = e;
      const xNorm = (clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      const yNorm = (clientY / window.innerHeight - 0.5) * 2; // -1 to 1

      gsap.to(layerSky, { x: xNorm * 8, y: yNorm * 4, duration: 1.2, ease: "power2.out" });
      gsap.to(layerLights, { x: xNorm * 18, y: yNorm * 8, duration: 1.2, ease: "power2.out" });
      gsap.to(layerStands, { x: xNorm * 12, y: yNorm * 6, duration: 1.2, ease: "power2.out" });
      gsap.to(layerPitch, { x: xNorm * 22, y: yNorm * 12, duration: 1.2, ease: "power2.out" });
      gsap.to(layerGrass, { x: xNorm * 28, y: yNorm * 16, duration: 1.2, ease: "power2.out" });
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
    };
  });

  // 2. MOBILE ANIMATION (<= 768px)
  mm.add("(max-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
    const tlMobile = gsap.timeline({
      scrollTrigger: {
        trigger: heroSection,
        start: "top top",
        end: "+=100%",
        pin: true,
        scrub: 1,
        anticipatePin: 1
      }
    });

    tlMobile.to([eyebrow, countdown, ctas, statusBadge, scrollIndicator], {
      opacity: 0,
      y: -20,
      ease: "power1.inOut"
    }, 0);

    tlMobile.to(headline, {
      scale: 1.4,
      opacity: 0,
      ease: "power1.in"
    }, 0.1);

    tlMobile.to(bgLayers, {
      scale: 1.35,
      ease: "power1.inOut"
    }, 0);
  });

  // 3. REDUCED MOTION (Clean, non-pinned, accessible fallback)
  mm.add("(prefers-reduced-motion: reduce)", () => {
    // No pinning, no zoom, static layers
    gsap.set([bgLayers, headline], { scale: 1, opacity: 1 });
  });

  // 4. STICKY MOBILE CTA BAR TRIGGER
  if (stickyCtaBar) {
    ScrollTrigger.create({
      trigger: heroSection,
      start: "bottom 80%",
      onEnter: () => {
        stickyCtaBar.classList.remove("translate-y-full", "opacity-0");
        stickyCtaBar.classList.add("translate-y-0", "opacity-100");
      },
      onLeaveBack: () => {
        stickyCtaBar.classList.add("translate-y-full", "opacity-0");
        stickyCtaBar.classList.remove("translate-y-0", "opacity-100");
      }
    });
  }

  // Refresh ScrollTrigger once fonts are ready
  if (document.fonts) {
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });
  }
}
