// @ts-check
import { downloadTrialsCalendar } from "../../../lib/ics.js";
import { initTilt } from "../animations/tilt.js";

export function initFixture() {
  const calBtn = document.getElementById("add-to-calendar-btn");
  if (calBtn) {
    calBtn.addEventListener("click", () => {
      downloadTrialsCalendar();
    });
  }

  // Attach 3D tilt to fixture cards
  initTilt(".fixture-tilt-card", 8);
}
