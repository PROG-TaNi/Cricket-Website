// @ts-check
import { gsap, ScrollTrigger } from "../core/gsap.js";
import { initMagnetic } from "../animations/magnetic.js";

export function initFinalCta() {
  const finalSection = document.getElementById("final-cta");
  if (!finalSection) return;

  const stumpsContainer = finalSection.querySelector("#cta-stumps-svg");
  const bail1 = finalSection.querySelector("#cta-bail-1");
  const bail2 = finalSection.querySelector("#cta-bail-2");
  const offStump = finalSection.querySelector("#cta-stump-off");
  const legStump = finalSection.querySelector("#cta-stump-leg");
  const midStump = finalSection.querySelector("#cta-stump-mid");
  const bgBackdrop = finalSection.querySelector(".cta-backdrop-img");
  const ball = finalSection.querySelector("#cta-cricket-ball");

  initMagnetic("#final-cta .btn-magnetic", 0.35);

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // Reverse camera zoom (scale 1.25 -> 1) as section enters
    if (bgBackdrop) {
      gsap.fromTo(bgBackdrop,
        { scale: 1.25 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: finalSection,
            start: "top bottom",
            end: "bottom bottom",
            scrub: true
          }
        }
      );
    }

    // Signature Wicket Stumps Hit Animation (Played once on scroll enter)
    if (stumpsContainer && bail1 && bail2 && offStump && legStump && midStump && ball) {
      ScrollTrigger.create({
        trigger: stumpsContainer,
        start: "top 75%",
        once: true,
        onEnter: () => {
          const hitTl = gsap.timeline();

          // 1. Red leather ball flies in fast
          hitTl.fromTo(ball,
            { x: -280, y: -180, scale: 0.2, opacity: 0 },
            { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.5, ease: "power4.in" }
          );

          // 2. Ball impacts stumps: bails fly off into the air
          hitTl.to(bail1, {
            y: -140,
            x: -60,
            rotation: -380,
            duration: 0.8,
            ease: "power2.out"
          }, "-=0.05");

          hitTl.to(bail2, {
            y: -160,
            x: 80,
            rotation: 420,
            duration: 0.85,
            ease: "power2.out"
          }, "<");

          // 3. Stumps tilt and scatter
          hitTl.to(offStump, {
            rotation: -28,
            transformOrigin: "bottom center",
            duration: 0.6,
            ease: "power3.out"
          }, "<");

          hitTl.to(legStump, {
            rotation: 24,
            transformOrigin: "bottom center",
            duration: 0.6,
            ease: "power3.out"
          }, "<");

          hitTl.to(midStump, {
            y: 10,
            rotation: 8,
            transformOrigin: "bottom center",
            duration: 0.5,
            ease: "power1.out"
          }, "<");

          // 4. Ball rebounds
          hitTl.to(ball, {
            x: 50,
            y: 40,
            duration: 0.6,
            ease: "bounce.out"
          }, "-=0.3");
        }
      });
    }
  });
}
