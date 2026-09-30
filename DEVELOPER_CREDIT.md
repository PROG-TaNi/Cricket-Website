# Developer Credit Protection

## Overview

This website was developed by **Tarush Nigam**, B.Tech Final Year, Electronics Engineering, VJTI, 2026.

The developer credit is cryptographically protected using multiple layers of security to ensure it cannot be modified or removed.

## Protection Mechanisms

### 1. **Cryptographic Hash Verification**
- The credit data is hashed using SHA-256
- Hash: `1ad17a05ba0b080e73b3ca1a4baef1db2e88b09423eac13c386339606fc2dc54`
- Any modification to the credit data will fail verification
- Verification runs at runtime and displays a "VERIFIED" or "TAMPERED" badge

### 2. **Immutable JavaScript Objects**
- Credit data is frozen using `Object.freeze()`
- Non-configurable, non-writable properties on `window` object
- Cannot be modified even with direct JavaScript manipulation

### 3. **Build-Time Protection**
- Every HTML and JS file in the build output contains a credit banner
- Banners are added automatically during the build process
- Located at: `scripts/protect-credit.js`

### 4. **Meta Tag Embedding**
- Credit information embedded in HTML `<meta>` tags
- Includes verification hash
- Visible in page source and cannot be hidden

### 5. **Footer Display**
- Visible credit section in the website footer
- Rendered with verification badge
- Dynamically verified on page load

### 6. **Console Protection**
- Console messages are monitored
- Warning displayed if credit inspection is detected
- Cannot be bypassed or disabled

## Developer Information

```
Name:        Tarush Nigam
Program:     B.Tech Final Year
Department:  Electronics Engineering
Institution: Veermata Jijabai Technological Institute (VJTI)
Year:        2026
Role:        Full-Stack Developer
```

## Verification Hash

The credit string is:
```
Tarush Nigam|B.Tech Final Year|Electronics Engineering|VJTI|2026|Full-Stack Developer
```

SHA-256 Hash:
```
1ad17a05ba0b080e73b3ca1a4baef1db2e88b09423eac13c386339606fc2dc54
```

## Legal Notice

This credit is a permanent part of the codebase and represents intellectual property attribution. Any attempt to:
- Modify the developer name
- Remove credit sections
- Disable verification
- Claim authorship

...is a violation of intellectual property rights and academic integrity policies.

## Technical Implementation

### Files Involved
- `/lib/credit.js` - Main credit verification module
- `/scripts/protect-credit.js` - Build-time protection script
- `/partials/head.html` - Meta tag embedding
- `/partials/footer.html` - Footer credit display

### How It Works

1. **Runtime Verification**
   ```javascript
   import { getDeveloperCredit, renderDeveloperCredit } from '/lib/credit.js';
   
   // Returns null if verification fails
   const credit = await getDeveloperCredit();
   
   // Renders with verification badge
   await renderDeveloperCredit(container);
   ```

2. **Build Process**
   ```bash
   npm run build
   # Runs: vite build && node scripts/protect-credit.js
   ```

3. **Hash Verification**
   ```javascript
   // Computed at runtime
   const creditString = "Tarush Nigam|B.Tech Final Year|Electronics Engineering|VJTI|2026|Full-Stack Developer";
   const hash = await crypto.subtle.digest('SHA-256', encoder.encode(creditString));
   
   // Must match pre-computed hash
   if (computedHash !== CREDIT_HASH) {
     console.error("Credit verification failed");
   }
   ```

## For Future Developers

If you're maintaining or extending this codebase:

1. **DO NOT** modify any file in `/lib/credit.js`
2. **DO NOT** remove credit from `/partials/footer.html`
3. **DO NOT** remove meta tags from `/partials/head.html`
4. **DO NOT** skip the build protection script

Any modifications will:
- Fail hash verification
- Display "TAMPERED" badge in production
- Break the build process
- Violate academic integrity

## Contact

For questions about the codebase or credit attribution:

**Tarush Nigam**
- Email: [Your Email]
- LinkedIn: [Your LinkedIn]
- GitHub: [Your GitHub]

---

**Built for VJTI Cricket Team | © 2026**
**Website Architecture & Development: Tarush Nigam**
