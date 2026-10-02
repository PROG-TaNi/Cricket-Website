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
  
  // Check for password override (if admin changed password)
  if (cleanEmail === "admin@vjti.ac.in") {
    try {
      const overrideRaw = localStorage.getItem("vjti_admin_password_override");
      if (overrideRaw) {
        const override = JSON.parse(overrideRaw);
        // Check if new password matches
        if (password === override.newPassword) {
          const orgData = {
            email: cleanEmail,
            role: "VJTI Cricket Admin",
            isLocal: true
          };
          localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(orgData));
          return { success: true };
        }
      }
    } catch (_) {}
    
    // Check default admin credential
    if (password === "CricketAdmin#2026!") {
      const orgData = {
        email: cleanEmail,
        role: "VJTI Cricket Admin",
        isLocal: true
      };
      localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(orgData));
      return { success: true };
    }
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
    // Check if user is logged in with local/hardcoded credentials
    const localSession = localStorage.getItem(ORG_STORAGE_KEY);
    let sessionData = null;
    
    try {
      sessionData = localSession ? JSON.parse(localSession) : null;
    } catch (_) {}
    
    // If using hardcoded credentials (isLocal flag)
    if (sessionData && sessionData.isLocal && sessionData.email === "admin@vjti.ac.in") {
      // Verify current password against hardcoded password
      if (currentPassword !== "CricketAdmin#2026!") {
        return { success: false, error: "Current password is incorrect" };
      }
      
      // For hardcoded credentials, we can't actually change the password
      // But we can update a local override in localStorage
      const passwordOverride = {
        email: "admin@vjti.ac.in",
        oldPassword: "CricketAdmin#2026!",
        newPassword: newPassword,
        changedAt: new Date().toISOString()
      };
      
      localStorage.setItem("vjti_admin_password_override", JSON.stringify(passwordOverride));
      
      return { 
        success: true, 
        message: "Password updated locally. Use the new password on next login." 
      };
    }
    
    // Try Supabase for other users
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.email) {
      return { success: false, error: "Not authenticated with Supabase" };
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
