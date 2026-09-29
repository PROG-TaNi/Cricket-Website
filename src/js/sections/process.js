// @ts-check
import { gsap, ScrollTrigger } from "../core/gsap.js";

export function initProcess() {
  const processSection = document.getElementById("process");
  if (!processSection) return;

  const track = processSection.querySelector(".process-horizontal-track");
  const marker = processSection.querySelector(".process-cricket-marker");
  const progressLine = processSection.querySelector(".process-progress-line");

  const mm = gsap.matchMedia();

  // Desktop: Horizontal Scroll Scrub
  mm.add("(min-width: 769px) and (prefers-reduced-motion: no-preference)", () => {
    if (!track) return;

    const cards = track.querySelectorAll(".process-card");
    const totalShift = (cards.length - 1) * 380; // horizontal travel distance

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: processSection,
        start: "top 10%",
        end: `+=${totalShift * 1.5}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1
      }
    });

    // Horizontal movement of track
    tl.to(track, {
      x: -totalShift,
      ease: "none"
    }, 0);

    // Progress line fills across
    if (progressLine) {
      tl.to(progressLine, {
        scaleX: 1,
        ease: "none"
      }, 0);
    }

    // Cricket marker travels along
    if (marker) {
      tl.to(marker, {
        x: totalShift,
        rotation: 360 * 2,
        ease: "none"
      }, 0);
    }
  });

  // Mobile: Vertical Timeline Fade-ups
  mm.add("(max-width: 768px)", () => {
    const mobileCards = processSection.querySelectorAll(".process-card");
    gsap.fromTo(mobileCards,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: processSection,
          start: "top 75%"
        }
      }
    );
  });
}
