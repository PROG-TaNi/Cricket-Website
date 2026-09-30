// @ts-check
/**
 * Organizer Login Controller
 */

import "../../css/main.css";
import { loginOrganizer, getOrganizerSession } from "./auth.js";
import { toastMsg } from "../components/toast.js";

document.addEventListener("DOMContentLoaded", async () => {
  // If already logged in, redirect to dashboard
  const session = await getOrganizerSession(false);
  if (session) {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get("redirect") || "/organizer/index.html";
    window.location.href = redirect;
    return;
  }

  const form = /** @type {HTMLFormElement | null} */ (document.getElementById("org-login-form"));
  const submitBtn = /** @type {HTMLButtonElement | null} */ (form?.querySelector('button[type="submit"]'));

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailInput = /** @type {HTMLInputElement | null} */ (form.querySelector('input[type="email"]'));
    const passwordInput = /** @type {HTMLInputElement | null} */ (form.querySelector('input[type="password"]'));

    const email = emailInput?.value || "";
    const password = passwordInput?.value || "";

    if (!email || !password) {
      toastMsg("Please enter both email and password.", "error");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "AUTHENTICATING...";
    }

    try {
      const result = await loginOrganizer(email, password);

      if (result.success) {
        toastMsg("Authentication successful. Redirecting...", "success");
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get("redirect") || "/organizer/index.html";
        setTimeout(() => {
          window.location.href = redirect;
        }, 400);
      } else {
        toastMsg(result.error || "Authentication failed", "error");
      }
    } catch (err) {
      toastMsg("Authentication failed. Please check connection.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "AUTHENTICATE →";
      }
    }
  });
});
