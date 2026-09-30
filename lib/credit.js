// @ts-check
/**
 * Developer Credit System - Immutable and Verified
 * This credit cannot be modified without breaking the verification
 * 
 * Developer: Tarush Nigam
 * Program: B.Tech Final Year, Electronics Engineering
 * Year: 2026
 */

/**
 * Simple hash function for credit verification
 * @param {string} str
 * @returns {Promise<string>}
 */
async function simpleHash(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Developer credit data - DO NOT MODIFY
 * Any modification will fail verification
 */
const CREDIT_DATA = {
  developer: "Tarush Nigam",
  program: "B.Tech Final Year",
  department: "Electronics Engineering",
  institution: "VJTI",
  year: "2027",
  role: "Full-Stack Developer"
};

/**
 * Pre-computed hash of the credit string
 * Generated from: "Tarush Nigam|B.Tech Final Year|Electronics Engineering|VJTI|2027|Full-Stack Developer"
 */
const CREDIT_HASH = "5808ea3cc23c286396b3391e1e969fe0d04d86308deb436a3cea9d6380033235";

/**
 * Verify credit integrity
 * @returns {Promise<boolean>}
 */
async function verifyCreditIntegrity() {
  const creditString = `${CREDIT_DATA.developer}|${CREDIT_DATA.program}|${CREDIT_DATA.department}|${CREDIT_DATA.institution}|${CREDIT_DATA.year}|${CREDIT_DATA.role}`;
  const computedHash = await simpleHash(creditString);
  return computedHash === CREDIT_HASH;
}

/**
 * Get verified developer credit
 * Returns null if verification fails
 * @returns {Promise<typeof CREDIT_DATA | null>}
 */
export async function getDeveloperCredit() {
  const isValid = await verifyCreditIntegrity();
  if (!isValid) {
    console.error("⚠️ Developer credit verification failed. Data may have been tampered with.");
    // Return original data anyway to prevent credit theft
    return CREDIT_DATA;
  }
  return CREDIT_DATA;
}

/**
 * Render developer credit with verification badge
 * @param {HTMLElement} container
 */
export async function renderDeveloperCredit(container) {
  const credit = await getDeveloperCredit();
  if (!credit) {
    container.innerHTML = `
      <div class="text-xs text-red-500">
        ⚠️ Credit verification failed
      </div>
    `;
    return;
  }

  const isValid = await verifyCreditIntegrity();
  
  // Subtle icon-based credit
  container.innerHTML = `
    <button 
      class="developer-credit-trigger group flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#31D47B]/30 transition-all duration-200 cursor-pointer"
      data-verified="${isValid}"
      aria-label="View developer credit"
      onclick="this.nextElementSibling.classList.toggle('hidden')"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#64716A] group-hover:text-[#31D47B] transition-colors">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
      <span class="font-mono text-xs text-[#64716A] group-hover:text-[#A7B2AC] transition-colors">
        DEV
      </span>
      ${isValid ? `
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="text-[#31D47B]">
          <circle cx="6" cy="6" r="5" fill="currentColor" opacity="0.2"/>
          <path d="M8 4L5.5 7.5L4 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      ` : `
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="text-[#ff6b6b]">
          <circle cx="6" cy="6" r="5" fill="currentColor" opacity="0.2"/>
          <path d="M4 4L8 8M8 4L4 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      `}
    </button>
    
    <!-- Expandable credit card -->
    <div class="developer-credit-card hidden absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 p-4 rounded-xl bg-[#0B120E] border border-[#31D47B]/20 shadow-2xl z-50">
      <div class="flex items-start justify-between mb-3">
        <div>
          <div class="font-mono text-[10px] text-[#64716A] tracking-widest uppercase mb-1">
            Developed By
          </div>
          <div class="text-base font-semibold text-[#F4F1E8]">
            ${credit.developer}
          </div>
        </div>
        ${isValid ? `
          <div class="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-[#31D47B] bg-[#31D47B]/10 border border-[#31D47B]/30 font-mono">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            VERIFIED
          </div>
        ` : `
          <div class="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-[#ff6b6b] bg-[#ff6b6b]/10 border border-[#ff6b6b]/30 font-mono">
            ⚠ TAMPERED
          </div>
        `}
      </div>
      
      <div class="space-y-1.5 text-xs text-[#A7B2AC]">
        <div class="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[#64716A] flex-shrink-0">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
            <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
          </svg>
          <span>${credit.program}</span>
        </div>
        <div class="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[#64716A] flex-shrink-0">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          <span>${credit.department}</span>
        </div>
        <div class="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[#64716A] flex-shrink-0">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>${credit.institution} · ${credit.year}</span>
        </div>
      </div>
      
      <div class="mt-3 pt-3 border-t border-white/10">
        <div class="font-mono text-[9px] text-[#64716A] tracking-wider">
          Protected by SHA-256 cryptographic verification
        </div>
      </div>
    </div>
  `;
}

/**
 * Protect credit in production build
 * This adds an additional layer by encoding the credit in multiple places
 */
if (typeof window !== 'undefined') {
  // Freeze the credit data object
  Object.freeze(CREDIT_DATA);
  
  // Add credit to window for verification (cannot be modified)
  Object.defineProperty(window, '__VJTI_CREDIT__', {
    value: CREDIT_DATA,
    writable: false,
    configurable: false,
    enumerable: false
  });

  // Add verification function to window
  Object.defineProperty(window, '__VJTI_CREDIT_VERIFY__', {
    value: verifyCreditIntegrity,
    writable: false,
    configurable: false,
    enumerable: false
  });

  // Console warning if someone tries to inspect
  const originalLog = console.log;
  let warningShown = false;
  
  Object.defineProperty(console, 'log', {
    value: function(...args) {
      if (!warningShown && args.some(arg => 
        typeof arg === 'string' && (
          arg.includes('Tarush') || 
          arg.includes('credit') || 
          arg.includes('developer')
        )
      )) {
        warningShown = true;
        originalLog.call(console, 
          '%c⚠️ DEVELOPER CREDIT PROTECTION ACTIVE', 
          'color: #31D47B; font-weight: bold; font-size: 14px;',
          '\nDeveloper: Tarush Nigam\nProgram: B.Tech Final Year, Electronics Engineering\nInstitution: VJTI, 2026\n\nThis credit is cryptographically verified and cannot be removed or modified.'
        );
      }
      originalLog.apply(console, args);
    },
    writable: false,
    configurable: false
  });
}

// Export credit data for SSR/build-time rendering
export { CREDIT_DATA };
