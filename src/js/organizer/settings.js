// @ts-check
/**
 * Organizer Settings Controller
 */

import "../../css/main.css";
import { initOrganizerLayout } from "./layout.js";
import { getSiteSettings, updateSiteSettings } from "./data.js";
import { toastMsg } from "../components/toast.js";

document.addEventListener("DOMContentLoaded", async () => {
  await initOrganizerLayout(window.location.pathname);

  const settings = await getSiteSettings();

  const toggleRegOpen = /** @type {HTMLInputElement | null} */ (document.getElementById("toggle-reg-open"));
  const toggleMatchday = /** @type {HTMLInputElement | null} */ (document.getElementById("toggle-matchday"));
  const toggleSquadReveal = /** @type {HTMLInputElement | null} */ (document.getElementById("toggle-squad-reveal"));
  const inputWaGroup = /** @type {HTMLInputElement | null} */ (document.getElementById("input-wa-group"));
  const inputDay1Time = /** @type {HTMLInputElement | null} */ (document.getElementById("input-day1-time"));
  const inputDay2Time = /** @type {HTMLInputElement | null} */ (document.getElementById("input-day2-time"));
  const settingsForm = /** @type {HTMLFormElement | null} */ (document.getElementById("settings-form"));
  const resetDataBtn = document.getElementById("reset-data-btn");

  // Populate current values
  if (toggleRegOpen) toggleRegOpen.checked = settings.registration_open ?? true;
  if (toggleMatchday) toggleMatchday.checked = settings.matchday_mode ?? false;
  if (toggleSquadReveal) toggleSquadReveal.checked = settings.results_published ?? false;
  if (inputWaGroup) inputWaGroup.value = settings.whatsapp_group_url || "";
  if (inputDay1Time) inputDay1Time.value = settings.day1_reporting_time || "07:30 AM";
  if (inputDay2Time) inputDay2Time.value = settings.day2_reporting_time || "08:00 AM";

  // Toggle handlers
  toggleRegOpen?.addEventListener("change", async () => {
    const val = toggleRegOpen.checked;
    await updateSiteSettings({ registration_open: val });
    toastMsg(`Registration window ${val ? "opened" : "closed"}`, "info");
  });

  toggleMatchday?.addEventListener("change", async () => {
    const val = toggleMatchday.checked;
    await updateSiteSettings({ matchday_mode: val });
    toastMsg(`Matchday mode ${val ? "activated" : "deactivated"}`, "info");
  });

  toggleSquadReveal?.addEventListener("change", async () => {
    const val = toggleSquadReveal.checked;
    await updateSiteSettings({ results_published: val });
    toastMsg(`Squad reveal page ${val ? "published" : "hidden"}`, "info");
  });

  // Settings form submission
  settingsForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const updates = {
      whatsapp_group_url: inputWaGroup?.value || "",
      day1_reporting_time: inputDay1Time?.value || "",
      day2_reporting_time: inputDay2Time?.value || ""
    };

    await updateSiteSettings(updates);
    toastMsg("Settings updated successfully!", "success");
  });

  // Reset demo candidate store
  resetDataBtn?.addEventListener("click", () => {
    if (confirm("Reset local player check-ins and ratings to original seed data?")) {
      localStorage.removeItem("vjti_org_players_cache");
      toastMsg("Candidate records reset to initial seeds.", "info");
      setTimeout(() => window.location.reload(), 500);
    }
  });
});
