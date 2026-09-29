// @ts-check

const STORAGE_KEYS = {
  PLAYER_REG: "vjti_cricket_registered_player",
  FORM_DRAFT: "vjti_cricket_form_draft"
};

/**
 * @typedef {Object} RegisteredPlayer
 * @property {string} registrationId
 * @property {string} firstName
 * @property {string} publicToken
 */

/**
 * Save player registration to localStorage
 * @param {RegisteredPlayer} data
 */
export function savePlayerRegistration(data) {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER_REG, JSON.stringify(data));
  } catch (err) {
    console.warn("Unable to save to localStorage", err);
  }
}

/**
 * Get registered player from localStorage
 * @returns {RegisteredPlayer | null}
 */
export function getRegisteredPlayer() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYER_REG);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

/**
 * Save registration form draft to sessionStorage
 * @param {Record<string, any>} draftData
 */
export function saveFormDraft(draftData) {
  try {
    sessionStorage.setItem(STORAGE_KEYS.FORM_DRAFT, JSON.stringify(draftData));
  } catch (err) {
    console.warn("Unable to save draft", err);
  }
}

/**
 * Get registration form draft
 * @returns {Record<string, any> | null}
 */
export function getFormDraft() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.FORM_DRAFT);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

/**
 * Clear registration form draft upon successful submission
 */
export function clearFormDraft() {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.FORM_DRAFT);
  } catch (err) {
    // Ignore
  }
}
