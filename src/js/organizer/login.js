// @ts-check
/**
 * Organizer Login Controller
 */

import "../../css/main.css";
import { loginOrganizer, getOrganizerSession, sendPasswordResetOTP, verifyOTPAndResetPassword } from "./auth.js";
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

  // Login form handler
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

  // Forgot Password Modal
  const forgotPasswordLink = document.getElementById("forgot-password-link");
  const forgotPasswordModal = document.getElementById("forgot-password-modal");
  const closeForgotModal = document.getElementById("close-forgot-modal");
  const forgotPasswordForm = /** @type {HTMLFormElement | null} */ (document.getElementById("forgot-password-form"));

  forgotPasswordLink?.addEventListener("click", () => {
    forgotPasswordModal?.classList.remove("hidden");
  });

  closeForgotModal?.addEventListener("click", () => {
    forgotPasswordModal?.classList.add("hidden");
  });

  forgotPasswordModal?.addEventListener("click", (e) => {
    if (e.target === forgotPasswordModal) {
      forgotPasswordModal.classList.add("hidden");
    }
  });

  forgotPasswordForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailInput = /** @type {HTMLInputElement | null} */ (document.getElementById("reset-email"));
    const email = emailInput?.value || "";

    if (!email) {
      toastMsg("Please enter your email address.", "error");
      return;
    }

    const submitButton = /** @type {HTMLButtonElement | null} */ (forgotPasswordForm.querySelector('button[type="submit"]'));
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    try {
      const result = await sendPasswordResetOTP(email);
      
      if (result.success) {
        toastMsg("Verification code sent to your email!", "success");
        forgotPasswordModal?.classList.add("hidden");
        
        // Show OTP modal
        const otpModal = document.getElementById("otp-modal");
        const otpEmailSpan = document.getElementById("otp-email");
        if (otpEmailSpan) otpEmailSpan.textContent = email;
        otpModal?.classList.remove("hidden");
        
        // Store email for OTP verification
        sessionStorage.setItem("reset_email", email);
      } else {
        toastMsg(result.error || "Failed to send verification code", "error");
      }
    } catch (err) {
      toastMsg("Failed to send verification code. Please try again.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Send Code";
      }
    }
  });

  // OTP Verification Modal
  const otpModal = document.getElementById("otp-modal");
  const closeOtpModal = document.getElementById("close-otp-modal");
  const otpForm = /** @type {HTMLFormElement | null} */ (document.getElementById("otp-form"));

  closeOtpModal?.addEventListener("click", () => {
    otpModal?.classList.add("hidden");
    sessionStorage.removeItem("reset_email");
  });

  otpModal?.addEventListener("click", (e) => {
    if (e.target === otpModal) {
      otpModal.classList.add("hidden");
      sessionStorage.removeItem("reset_email");
    }
  });

  otpForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const otpInput = /** @type {HTMLInputElement | null} */ (document.getElementById("otp-code"));
    const newPasswordInput = /** @type {HTMLInputElement | null} */ (document.getElementById("new-password"));
    
    const otp = otpInput?.value || "";
    const newPassword = newPasswordInput?.value || "";
    const email = sessionStorage.getItem("reset_email") || "";

    if (!otp || !newPassword || !email) {
      toastMsg("Please fill in all fields.", "error");
      return;
    }

    if (newPassword.length < 8) {
      toastMsg("Password must be at least 8 characters.", "error");
      return;
    }

    const submitButton = /** @type {HTMLButtonElement | null} */ (otpForm.querySelector('button[type="submit"]'));
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Resetting...";
    }

    try {
      const result = await verifyOTPAndResetPassword(email, otp, newPassword);
      
      if (result.success) {
        toastMsg("Password reset successfully! Please login.", "success");
        otpModal?.classList.add("hidden");
        sessionStorage.removeItem("reset_email");
        
        // Clear forms
        if (otpInput) otpInput.value = "";
        if (newPasswordInput) newPasswordInput.value = "";
      } else {
        toastMsg(result.error || "Invalid or expired code", "error");
      }
    } catch (err) {
      toastMsg("Failed to reset password. Please try again.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Reset Password";
      }
    }
  });

  // Auto-format OTP input
  const otpInput = /** @type {HTMLInputElement | null} */ (document.getElementById("otp-code"));
  otpInput?.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    target.value = target.value.replace(/[^0-9]/g, "").slice(0, 6);
  });
});
