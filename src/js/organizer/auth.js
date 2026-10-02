// @ts-check
/**
 * Organizer Authentication & Session Management
 * Integrates with Supabase Auth with fallback to authenticated organizer session in dev/offline.
 */

import { supabase } from "../core/supabase.js";

const ORG_STORAGE_KEY = "vjti_org_session";

/**
 * Check if current user has an active organizer session.
 * If requireAuth is true and no session is found, redirects to /organizer/login.html
 * @param {boolean} [requireAuth=true]
 * @returns {Promise<{ email: string, role: string, isDemo?: boolean } | null>}
 */
export async function getOrganizerSession(requireAuth = true) {
  // 1. Check local session (e.g. demo / verified token)
  try {
    const raw = localStorage.getItem(ORG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) {
        return parsed;
      }
    }
  } catch (_) {}

  // 2. Check Supabase Auth
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const orgData = {
        email: session.user.email || "organizer@vjti.ac.in",
        role: "Committee Organizer"
      };
      localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(orgData));
      return orgData;
    }
  } catch (_) {}

  if (requireAuth) {
    const currentPath = encodeURIComponent(window.location.pathname);
    window.location.href = `/organizer/login.html?redirect=${currentPath}`;
    return null;
  }

  return null;
}

/**
 * Log in organizer with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function loginOrganizer(email, password) {
  const cleanEmail = email.trim().toLowerCase();
  
  // Check admin credential first (immediate access)
  if (cleanEmail === "admin@vjti.ac.in" && password === "Tarush@2026") {
    const orgData = {
      email: cleanEmail,
      role: "VJTI Cricket Admin",
      isLocal: true
    };
    localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(orgData));
    return { success: true };
  }
  
  // Try Supabase Auth for other users
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (data?.session) {
      const orgData = {
        email: data.user.email || cleanEmail,
        role: "Committee Organizer"
      };
      localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(orgData));
      return { success: true };
    }
    
    if (error) {
      console.warn("Supabase auth error:", error.message);
    }
  } catch (err) {
    console.warn("Supabase auth exception:", err);
  }

  return { success: false, error: "Invalid credentials. Please check your email and password." };
}

/**
 * Sign out organizer
 */
export async function logoutOrganizer() {
  try {
    await supabase.auth.signOut();
  } catch (_) {}
  localStorage.removeItem(ORG_STORAGE_KEY);
  window.location.href = "/organizer/login.html";
}

/**
 * Send password reset OTP to email
 * @param {string} email
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function sendPasswordResetOTP(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/organizer/login.html`
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to send reset email. Please try again." };
  }
}

/**
 * Verify OTP and reset password
 * @param {string} email
 * @param {string} otp
 * @param {string} newPassword
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function verifyOTPAndResetPassword(email, otp, newPassword) {
  try {
    // Supabase uses the OTP as a token to verify email
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    });

    if (verifyError) {
      return { success: false, error: "Invalid or expired code" };
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Sign out after password reset
    await supabase.auth.signOut();
    localStorage.removeItem(ORG_STORAGE_KEY);

    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to reset password. Please try again." };
  }
}

/**
 * Change password for logged-in admin user
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function changePassword(currentPassword, newPassword) {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.email) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify current password by attempting sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: currentPassword
    });

    if (signInError) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: "Failed to change password. Please try again." };
  }
}
