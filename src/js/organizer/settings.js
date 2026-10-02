// @ts-check
/**
 * Organizer Settings Controller
 */

import "../../css/main.css";
import { initOrganizerLayout } from "./layout.js";
import { getSiteSettings, updateSiteSettings } from "./data.js";
import { changePassword } from "./auth.js";
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

  // Password change form
  const changePasswordForm = /** @type {HTMLFormElement | null} */ (document.getElementById("change-password-form"));
  
  // Setup password visibility toggles
  const passwordToggleBtns = document.querySelectorAll('.password-toggle-btn');
  passwordToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = /** @type {HTMLInputElement | null} */ (document.getElementById(targetId || ''));
      
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          `;
        } else {
          input.type = 'password';
          btn.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          `;
        }
      }
    });
  });
  
  changePasswordForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const currentPasswordInput = /** @type {HTMLInputElement | null} */ (document.getElementById("current-password"));
    const newPasswordInput = /** @type {HTMLInputElement | null} */ (document.getElementById("new-password-settings"));
    const confirmPasswordInput = /** @type {HTMLInputElement | null} */ (document.getElementById("confirm-password"));
    
    const currentPassword = currentPasswordInput?.value || "";
    const newPassword = newPasswordInput?.value || "";
    const confirmPassword = confirmPasswordInput?.value || "";

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toastMsg("Please fill in all password fields.", "error");
      return;
    }

    if (newPassword.length < 8) {
      toastMsg("New password must be at least 8 characters.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      toastMsg("New passwords do not match.", "error");
      return;
    }

    if (currentPassword === newPassword) {
      toastMsg("New password must be different from current password.", "error");
      return;
    }

    const submitButton = /** @type {HTMLButtonElement | null} */ (changePasswordForm.querySelector('button[type="submit"]'));
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = `
        <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>CHANGING...</span>
      `;
    }

    try {
      const result = await changePassword(currentPassword, newPassword);
      
      if (result.success) {
        toastMsg("Password changed successfully!", "success");
        // Clear form
        if (currentPasswordInput) currentPasswordInput.value = "";
        if (newPasswordInput) newPasswordInput.value = "";
        if (confirmPasswordInput) confirmPasswordInput.value = "";
      } else {
        toastMsg(result.error || "Failed to change password", "error");
      }
    } catch (err) {
      toastMsg("Failed to change password. Please try again.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = `
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>CHANGE PASSWORD</span>
        `;
      }
    }
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
