// @ts-check
import { generateTrialsCalendar, downloadICS, addToGoogleCalendar } from "../../../lib/ics.js";
import { initTilt } from "../animations/tilt.js";
import { toastMsg } from "../components/toast.js";

export function initFixture() {
  const calBtn = document.getElementById("add-to-calendar-btn");
  if (calBtn) {
    // Create dropdown menu
    const dropdown = document.createElement("div");
    dropdown.className = "absolute bottom-full mb-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-xl py-2 min-w-[200px] hidden z-50";
    dropdown.innerHTML = `
      <button class="cal-option w-full px-4 py-2 text-left text-sm text-[#F4F1E8] hover:bg-[#2A2A2A] transition-colors flex items-center gap-2" data-type="google">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>Google Calendar</span>
      </button>
      <button class="cal-option w-full px-4 py-2 text-left text-sm text-[#F4F1E8] hover:bg-[#2A2A2A] transition-colors flex items-center gap-2" data-type="ics">
        <svg class="w-4 h-4 text-[#31D47B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <span>Download .ICS File</span>
      </button>
    `;
    
    // Position dropdown relative to button
    calBtn.parentElement.style.position = "relative";
    calBtn.parentElement.appendChild(dropdown);

    // Toggle dropdown
    calBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("hidden");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      dropdown.classList.add("hidden");
    });

    // Handle calendar options
    dropdown.querySelectorAll(".cal-option").forEach(option => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        const type = option.dataset.type;
        const calConfig = {
          day1Date: "2026-10-31",
          day2Date: "2026-11-01",
          venue: "VJTI Cricket Ground, Matunga, Mumbai"
        };

        if (type === "google") {
          addToGoogleCalendar(calConfig);
          toastMsg("Opening Google Calendar...", "success");
        } else if (type === "ics") {
          const ics = generateTrialsCalendar(calConfig);
          downloadICS(ics, "VJTI-Cricket-Trials-2026");
          toastMsg("Calendar file downloaded!", "success");
        }

        dropdown.classList.add("hidden");
      });
    });
  }

  // Attach 3D tilt to fixture cards
  initTilt(".fixture-tilt-card", 8);
}
