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
    const target = /** @type {HTMLInputElement} */ (e.target);
    target.value = target.value.replace(/[^0-9]/g, "").slice(0, 6);
  });

  // Password visibility toggle
  const passwordInput = /** @type {HTMLInputElement | null} */ (form?.querySelector('input[type="password"]'));
  if (passwordInput && passwordInput.parentElement) {
    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'absolute right-3 top-1/2 -translate-y-1/2 text-[#A7B2AC] hover:text-white transition-colors';
    toggleBtn.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    `;
    
    // Make parent relative
    passwordInput.parentElement.style.position = 'relative';
    passwordInput.style.paddingRight = '40px';
    passwordInput.parentElement.appendChild(toggleBtn);
    
    toggleBtn.addEventListener('click', () => {
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        `;
      } else {
        passwordInput.type = 'password';
        toggleBtn.innerHTML = `
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        `;
      }
    });
  }
});
