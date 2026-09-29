// @ts-check
import { siteConfig } from "../core/config.js";

/**
 * Custom Element: <vjti-countdown>
 * Displays a live cricket scoreboard countdown to 10 Oct 2026 00:00:00 IST.
 */
export class VJtiCountdown extends HTMLElement {
  constructor() {
    super();
    /** @type {number | null} */
    this.intervalId = null;
  }

  connectedCallback() {
    this.render();
    this.update();
    this.intervalId = window.setInterval(() => this.update(), 1000);
  }

  disconnectedCallback() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  render() {
    this.className = "inline-flex items-center gap-2 font-mono text-sm md:text-base font-bold tracking-wider";
    this.innerHTML = `
      <div class="flex items-center gap-1.5 bg-[#0b120e]/90 border border-white/10 px-3 py-1.5 rounded-lg shadow-inner">
        <span class="w-2 h-2 rounded-full bg-[#31d47b] animate-ping" style="animation-duration: 2s;"></span>
        <span class="text-xs uppercase text-white/50 tracking-widest font-semibold mr-1">TRIALS IN</span>
        <div class="flex items-center gap-1 text-[#f4f1e8] font-bold" data-countdown-display>
          <span data-days>00</span><span class="text-xs text-[#31d47b]">D</span>
          <span data-hours>00</span><span class="text-xs text-[#31d47b]">H</span>
          <span data-minutes>00</span><span class="text-xs text-[#31d47b]">M</span>
          <span data-seconds>00</span><span class="text-xs text-[#31d47b]">S</span>
        </div>
      </div>
    `;
  }

  update() {
    const target = new Date(siteConfig.countdownTarget).getTime();
    const endTrials = new Date("2026-10-11T23:59:59+05:30").getTime();
    const now = Date.now();
    const diff = target - now;

    const display = this.querySelector("[data-countdown-display]");
    if (!display) return;

    if (now > endTrials) {
      display.innerHTML = `<span class="text-[#a7b2ac] uppercase tracking-wider">TRIALS COMPLETED</span>`;
      return;
    }

    if (diff <= 0) {
      display.innerHTML = `<span class="text-[#ff5252] flex items-center gap-1.5 uppercase tracking-wider"><span class="w-2 h-2 rounded-full bg-[#b5121b] animate-pulse"></span> TRIALS ARE LIVE</span>`;
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const elDays = this.querySelector("[data-days]");
    const elHours = this.querySelector("[data-hours]");
    const elMins = this.querySelector("[data-minutes]");
    const elSecs = this.querySelector("[data-seconds]");

    if (elDays) elDays.textContent = String(days).padStart(2, "0");
    if (elHours) elHours.textContent = String(hours).padStart(2, "0");
    if (elMins) elMins.textContent = String(minutes).padStart(2, "0");
    if (elSecs) elSecs.textContent = String(seconds).padStart(2, "0");
  }
}

if (!customElements.get("vjti-countdown")) {
  customElements.define("vjti-countdown", VJtiCountdown);
}
