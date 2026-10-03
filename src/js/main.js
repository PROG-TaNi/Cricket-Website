// @ts-check
import "../css/main.css";
import { initLenis } from "./core/lenis.js";
import { initNav } from "./components/nav.js";
import { initHero } from "./sections/hero.js";
import "./components/countdown.js";
import { toast } from "./components/toast.js";
import { renderDeveloperCredit } from "../lib/credit.js";
import { supabase } from "./core/supabase.js";

// Section controllers – Phase 3
import { initFixture } from "./sections/fixture.js";
import { initStats } from "./sections/stats.js";
import { initAnnouncements } from "./sections/announcements.js";
import { initRules } from "./sections/rules.js";
import { initProcess } from "./sections/process.js";
import { initRoles } from "./sections/roles.js";
import { initFaq } from "./sections/faq.js";
import { initLegacy } from "./sections/legacy.js";
import { initFinalCta } from "./sections/final-cta.js";

// Global toast access
// @ts-ignore
window.toast = toast;

/**
 * Fetch the registration deadline from Supabase settings and update the public label.
 * Falls back silently — label stays "TO BE ANNOUNCED" if no value is set.
 */
async function updateDeadlineLabel() {
  const el = document.getElementById("reg-deadline-label");
  if (!el) return;
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "registration_deadline")
      .maybeSingle();

    if (!error && data?.value) {
      const d = new Date(data.value + "T00:00:00");
      const label = d.toLocaleDateString("en-IN", {
        weekday: "short", day: "numeric", month: "short", year: "numeric"
      }).toUpperCase();
      el.textContent = label;
    }
    // else: leave as "TO BE ANNOUNCED"
  } catch (_) {}
}

document.addEventListener("DOMContentLoaded", () => {
  // Core
  initLenis();
  initNav();

  // Developer Credit
  const creditContainer = document.getElementById('developer-credit');
  if (creditContainer) {
    renderDeveloperCredit(creditContainer);
  }

  // Hero (Phase 2)
  initHero();

  // Public sections (Phase 3) – guard each with element check so
  // importing main.js on other pages doesn't throw.
  if (document.querySelector("#fixture")) initFixture();
  if (document.querySelector("#stats-section")) initStats();
  if (document.querySelector("#announcements")) initAnnouncements();
  if (document.querySelector("#rules")) initRules();
  if (document.querySelector("#process")) initProcess();
  if (document.querySelector("#roles")) initRoles();
  if (document.querySelector("#faq")) initFaq();
  if (document.querySelector("#legacy")) initLegacy();
  if (document.querySelector("#final-cta")) initFinalCta();

  // Dynamically load registration deadline from settings
  if (document.getElementById("reg-deadline-label")) updateDeadlineLabel();

  console.log("VJTI Cricket Trials 2026–27 – Phase 3 fully initialized.");
});
