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
  
  // Try Supabase Auth first
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
  } catch (err) {
    console.warn("Supabase auth attempted, falling back to committee credentials check");
  }

  // Fallback demo/emergency credentials for committee members testing on ground:
  // Allows testing without production SMTP setup
  if (
    (cleanEmail === "admin@vjti.ac.in" && password === "vjti2026") ||
    (cleanEmail === "cricket@vjti.ac.in" && password === "vjti2026") ||
    (cleanEmail.endsWith("@vjti.ac.in") && password === "trials2026")
  ) {
    const orgData = {
      email: cleanEmail,
      role: "VJTI Cricket Committee",
      isDemo: true
    };
    localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(orgData));
    return { success: true };
  }

  return { success: false, error: "Invalid organizer credentials. (Demo: admin@vjti.ac.in / vjti2026)" };
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
