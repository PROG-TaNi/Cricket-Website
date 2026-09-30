// @ts-check
import { generateTrialsCalendar, downloadICS } from "../../../lib/ics.js";
import { initTilt } from "../animations/tilt.js";

export function initFixture() {
  const calBtn = document.getElementById("add-to-calendar-btn");
  if (calBtn) {
    calBtn.addEventListener("click", () => {
      const ics = generateTrialsCalendar({
        day1Date: "2026-10-10",
        day2Date: "2026-10-11",
        venue: "VJTI Cricket Ground, Matunga, Mumbai",
      });
      downloadICS(ics, "VJTI-Cricket-Trials-2026");
    });
  }

  // Attach 3D tilt to fixture cards
  initTilt(".fixture-tilt-card", 8);
}
