// @ts-check
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register plugins once globally
gsap.registerPlugin(ScrollTrigger);

// Prevent mobile address bar height resize jitter
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger };
