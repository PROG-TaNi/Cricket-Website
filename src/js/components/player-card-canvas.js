// @ts-check
/**
 * Player Card Canvas Image Generator
 * Generates high-resolution, premium tournament player pass images (1080×1350)
 * directly in the browser using HTML5 Canvas.
 * 
 * Guarantees 100% valid PNG image binary output that renders perfectly
 * in Photos (Windows, Mac, iOS, Android) and social media.
 * 
 * @module player-card-canvas
 */

import QRCode from "qrcode";

/**
 * @typedef {Object} PlayerCardData
 * @property {string} [registration_id]
 * @property {string} [registrationId]
 * @property {string} [full_name]
 * @property {string} [primary_role]
 * @property {string} [batting_style]
 * @property {string} [bowling_style]
 * @property {string} [program]
 * @property {string} [year]
 * @property {string} [branch]
 * @property {string} [photo_url]
 * @property {string} [photo_data]
 * @property {string} [public_token]
 * @property {string} [publicToken]
 */

/**
 * Rounds a rectangle path on 2D canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

/**
 * Loads an image safely with a timeout fallback
 * @param {string} src
 * @param {number} [timeoutMs=4000]
 * @returns {Promise<HTMLImageElement | null>}
 */
function loadImageSafe(src, timeoutMs = 4000) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    let done = false;

    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        resolve(null);
      }
    }, timeoutMs);

    img.onload = () => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(img);
      }
    };

    img.onerror = () => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(null);
      }
    };

    img.src = src;
  });
}

/**
 * Generate a complete 1080x1350 PNG Player Card
 * @param {PlayerCardData} data
 * @returns {Promise<{ blob: Blob, dataUrl: string }>}
 */
export async function generatePlayerCardImage(data) {
  const regId = data.registration_id || data.registrationId || "VJTI-CRK-0000";
  const fullName = (data.full_name || "VJTI CRICKETER").toUpperCase();
  const role = (data.primary_role || "BATTER").toUpperCase();
  const batStyle = (data.batting_style || "RIGHT-HAND").toUpperCase();
  const bowlStyle = (data.bowling_style || "RIGHT-ARM MEDIUM").toUpperCase();
  const progYear = `${(data.program || "DEGREE").toUpperCase()} · ${(data.year || "YEAR").toUpperCase()}`;
  const branch = (data.branch || "ENGINEERING").toUpperCase();
  const photoSrc = data.photo_url || data.photo_data || "";

  // 1. Create 1080x1350 canvas (standard 4:5 portrait photo ratio)
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize 2D canvas context");

  // 2. Base Background (Rich sports dark gradient)
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#050807");
  bgGrad.addColorStop(0.4, "#0B150F");
  bgGrad.addColorStop(0.85, "#08130C");
  bgGrad.addColorStop(1, "#030604");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Decorative ambient glow at top right and bottom left
  const glowTop = ctx.createRadialGradient(W - 100, 100, 20, W - 100, 100, 600);
  glowTop.addColorStop(0, "rgba(49, 212, 123, 0.18)");
  glowTop.addColorStop(1, "rgba(49, 212, 123, 0)");
  ctx.fillStyle = glowTop;
  ctx.fillRect(0, 0, W, H);

  const glowBottom = ctx.createRadialGradient(150, H - 150, 10, 150, H - 150, 500);
  glowBottom.addColorStop(0, "rgba(212, 255, 82, 0.12)");
  glowBottom.addColorStop(1, "rgba(212, 255, 82, 0)");
  ctx.fillStyle = glowBottom;
  ctx.fillRect(0, 0, W, H);

  // Subtle sports background angle lines
  ctx.save();
  ctx.strokeStyle = "rgba(49, 212, 123, 0.04)";
  ctx.lineWidth = 1.5;
  for (let i = -H; i < W + H; i += 70) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H * 0.6, H);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Card Outer Frame & Border
  const pad = 48;
  const cardW = W - pad * 2;
  const cardH = H - pad * 2;
  const radius = 32;

  // Outer Border
  ctx.save();
  ctx.strokeStyle = "rgba(49, 212, 123, 0.45)";
  ctx.lineWidth = 3;
  roundRect(ctx, pad, pad, cardW, cardH, radius);
  ctx.stroke();

  // Inner subtle border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  roundRect(ctx, pad + 10, pad + 10, cardW - 20, cardH - 20, radius - 8);
  ctx.stroke();
  ctx.restore();

  // 4. Header Bar
  const headY = pad + 40;
  
  // VJTI Header Badge
  ctx.fillStyle = "rgba(49, 212, 123, 0.12)";
  ctx.strokeStyle = "rgba(49, 212, 123, 0.35)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, pad + 32, headY, 340, 44, 22);
  ctx.fill();
  ctx.stroke();

  // Live status green dot
  ctx.beginPath();
  ctx.arc(pad + 54, headY + 22, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#31D47B";
  ctx.fill();

  ctx.font = "bold 18px 'JetBrains Mono', monospace, sans-serif";
  ctx.fillStyle = "#31D47B";
  ctx.textAlign = "left";
  ctx.fillText("OFFICIAL TRIAL PASS · 2026", pad + 72, headY + 28);

  // Institution title
  ctx.font = "800 24px 'Inter', sans-serif";
  ctx.fillStyle = "#F4F1E8";
  ctx.textAlign = "right";
  ctx.fillText("VJTI CRICKET CLUB", W - pad - 36, headY + 30);

  // 5. Divider Line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad + 32, headY + 68);
  ctx.lineTo(W - pad - 32, headY + 68);
  ctx.stroke();

  // 6. Candidate Photo & Identity Section
  const bodyY = headY + 95;
  const photoSize = 310;
  const photoX = pad + 40;
  const photoY = bodyY;

  // Try to load player photo
  let photoImg = await loadImageSafe(photoSrc);

  // Photo Frame
  ctx.save();
  roundRect(ctx, photoX, photoY, photoSize, photoSize, 24);
  ctx.fillStyle = "#0A140F";
  ctx.fill();
  ctx.strokeStyle = "#31D47B";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.clip();

  if (photoImg) {
    // Draw photo maintaining aspect ratio (cover mode)
    const imgAspect = photoImg.width / photoImg.height;
    const boxAspect = 1; // square box
    let dw, dh, dx, dy;
    if (imgAspect > boxAspect) {
      dh = photoSize;
      dw = photoSize * imgAspect;
      dx = photoX - (dw - photoSize) / 2;
      dy = photoY;
    } else {
      dw = photoSize;
      dh = photoSize / imgAspect;
      dx = photoX;
      dy = photoY - (dh - photoSize) / 2;
    }
    ctx.drawImage(photoImg, dx, dy, dw, dh);
  } else {
    // Stylish placeholder if no photo
    ctx.fillStyle = "#112217";
    ctx.fillRect(photoX, photoY, photoSize, photoSize);
    
    // Initials monogram
    const initials = fullName
      .split(" ")
      .filter(Boolean)
      .map(n => n[0])
      .slice(0, 2)
      .join("") || "CR";
    ctx.font = "900 84px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(49, 212, 123, 0.8)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, photoX + photoSize / 2, photoY + photoSize / 2 - 10);

    ctx.font = "bold 16px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#A7B2AC";
    ctx.fillText("VJTI CRICKETER", photoX + photoSize / 2, photoY + photoSize / 2 + 55);
  }
  ctx.restore();

  // Photo corner badge
  ctx.save();
  ctx.fillStyle = "#31D47B";
  roundRect(ctx, photoX + 16, photoY + photoSize - 36, 120, 26, 13);
  ctx.fill();
  ctx.font = "bold 13px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#050807";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("VERIFIED", photoX + 76, photoY + photoSize - 23);
  ctx.restore();

  // Right Side: Candidate Name, Reg ID, Primary Role
  const infoX = photoX + photoSize + 44;
  const maxInfoW = W - pad - 40 - infoX;

  // "CANDIDATE" small label
  ctx.font = "700 16px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#A7B2AC";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("REGISTERED CANDIDATE", infoX, bodyY + 10);

  // Candidate Full Name (wrapped if long)
  ctx.font = "900 48px 'Barlow Condensed', 'Inter', sans-serif";
  ctx.fillStyle = "#F4F1E8";
  
  // Format long names nicely
  const words = fullName.split(" ");
  let line1 = words[0] || "";
  let line2 = words.slice(1).join(" ");
  if (!line2 && words.length > 1) {
    line1 = fullName;
    line2 = "";
  }
  if (ctx.measureText(line1).width > maxInfoW && line1.length > 12) {
    ctx.font = "900 40px 'Barlow Condensed', 'Inter', sans-serif";
  }
  ctx.fillText(line1, infoX, bodyY + 40);
  if (line2) {
    ctx.fillText(line2, infoX, bodyY + 95);
  }

  // Registration ID Box (Large and prominent)
  const idBoxY = line2 ? bodyY + 165 : bodyY + 115;
  ctx.fillStyle = "rgba(49, 212, 123, 0.12)";
  ctx.strokeStyle = "rgba(49, 212, 123, 0.5)";
  ctx.lineWidth = 2;
  roundRect(ctx, infoX, idBoxY, maxInfoW, 90, 18);
  ctx.fill();
  ctx.stroke();

  ctx.font = "700 15px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#A7B2AC";
  ctx.fillText("REGISTRATION ID", infoX + 24, idBoxY + 16);

  ctx.font = "900 42px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#31D47B";
  ctx.fillText(regId, infoX + 24, idBoxY + 38);

  // Primary Role Pill
  const roleBoxY = idBoxY + 110;
  ctx.fillStyle = "#D4FF52";
  roundRect(ctx, infoX, roleBoxY, 200, 46, 12);
  ctx.fill();

  ctx.font = "900 22px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#050807";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(role, infoX + 100, roleBoxY + 23);

  // 7. Attributes Section (Detailed Specs Grid)
  const gridY = bodyY + photoSize + 45;

  const attrBoxW = (cardW - 80 - 24) / 2;
  const attrBoxH = 88;

  const attributes = [
    { label: "BATTING STYLE", val: batStyle },
    { label: "BOWLING STYLE", val: bowlStyle },
    { label: "PROGRAM & YEAR", val: progYear },
    { label: "ACADEMIC BRANCH", val: branch },
  ];

  attributes.forEach((attr, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const ax = pad + 40 + col * (attrBoxW + 24);
    const ay = gridY + row * (attrBoxH + 16);

    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    roundRect(ctx, ax, ay, attrBoxW, attrBoxH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = "700 14px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#8F9D95";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(attr.label, ax + 20, ay + 14);

    ctx.font = "bold 22px 'Inter', sans-serif";
    ctx.fillStyle = "#F4F1E8";
    // Truncate if too long
    let valText = attr.val;
    if (ctx.measureText(valText).width > attrBoxW - 40) {
      ctx.font = "bold 18px 'Inter', sans-serif";
    }
    ctx.fillText(valText, ax + 20, ay + 42);
  });

  // 8. Bottom Matchday & Check-in QR Section
  const qrSectionY = gridY + (attrBoxH + 16) * 2 + 30;
  const qrSectionH = 290;

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.strokeStyle = "rgba(49, 212, 123, 0.25)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, pad + 40, qrSectionY, cardW - 80, qrSectionH, 20);
  ctx.fill();
  ctx.stroke();

  // Generate real QR code image
  const qrSize = 220;
  const qrX = pad + 65;
  const qrY = qrSectionY + 35;

  try {
    const qrDataUrl = await QRCode.toDataURL(regId, {
      width: qrSize,
      margin: 1,
      color: {
        dark: "#050807",
        light: "#F4F1E8"
      }
    });

    const qrImg = await loadImageSafe(qrDataUrl);
    if (qrImg) {
      // Rounded background for QR
      ctx.save();
      roundRect(ctx, qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 16);
      ctx.fillStyle = "#F4F1E8";
      ctx.fill();
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      ctx.restore();
    }
  } catch (err) {
    console.warn("QR Code render error:", err);
  }

  // QR Side Label
  const matchInfoX = qrX + qrSize + 40;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  ctx.font = "bold 14px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#31D47B";
  ctx.fillText("● MATCHDAY ACCESS CREDENTIAL", matchInfoX, qrY + 5);

  ctx.font = "900 32px 'Barlow Condensed', 'Inter', sans-serif";
  ctx.fillStyle = "#F4F1E8";
  ctx.fillText("SELECTION TRIALS 2026–27", matchInfoX, qrY + 32);

  // Trial dates
  ctx.font = "700 20px 'Inter', sans-serif";
  ctx.fillStyle = "#D4FF52";
  ctx.fillText("SAT 31 OCT & SUN 01 NOV 2026", matchInfoX, qrY + 80);

  // Venue
  ctx.font = "500 18px 'Inter', sans-serif";
  ctx.fillStyle = "#A7B2AC";
  ctx.fillText("VJTI Cricket Ground, Matunga, Mumbai", matchInfoX, qrY + 115);

  // Instructions
  ctx.font = "600 15px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#F4F1E8";
  ctx.fillText("COMPULSORY: FULL WHITES & CRICKET KIT", matchInfoX, qrY + 155);

  ctx.font = "14px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#8F9D95";
  ctx.fillText("Show this QR at the ground check-in desk.", matchInfoX, qrY + 185);

  // 9. Footer Security Bar
  const footerY = H - pad - 42;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad + 40, footerY - 14);
  ctx.lineTo(W - pad - 40, footerY - 14);
  ctx.stroke();

  ctx.font = "13px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#64716A";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("VEERMATA JIJABAI TECHNOLOGICAL INSTITUTE · CRICKET SELECTION COMMITTEE", pad + 40, footerY);

  ctx.textAlign = "right";
  ctx.fillText("NON-TRANSFERABLE PASS", W - pad - 40, footerY);

  // 10. Convert canvas to standard PNG blob and dataURL
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        return reject(new Error("Canvas toBlob failed to produce image data"));
      }
      const dataUrl = canvas.toDataURL("image/png", 1.0);
      resolve({ blob, dataUrl });
    }, "image/png", 1.0);
  });
}

/**
 * Downloads the player card as a PNG image file
 * @param {PlayerCardData} data
 * @returns {Promise<boolean>}
 */
export async function downloadPlayerCard(data) {
  try {
    const { blob } = await generatePlayerCardImage(data);
    const regId = data.registration_id || data.registrationId || "PASS";
    const filename = `VJTI-Cricket-${regId}.png`;

    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 1000);

    return true;
  } catch (error) {
    console.error("downloadPlayerCard error:", error);
    throw error;
  }
}

/**
 * Shares or downloads the player card
 * @param {PlayerCardData} data
 * @returns {Promise<{ shared: boolean, downloaded: boolean }>}
 */
export async function sharePlayerCard(data) {
  try {
    const { blob } = await generatePlayerCardImage(data);
    const regId = data.registration_id || data.registrationId || "PASS";
    const filename = `VJTI-Cricket-${regId}.png`;
    const file = new File([blob], filename, { type: "image/png" });

    // Try Web Share API (mobile devices)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "VJTI Cricket Trials 2026",
        text: `I'm registered for VJTI Cricket Trials 2026! Registration ID: ${regId}`
      });
      return { shared: true, downloaded: false };
    }

    // Fallback: download the file
    await downloadPlayerCard(data);
    return { shared: false, downloaded: true };
  } catch (err) {
    if (/** @type {Error} */ (err).name === "AbortError") {
      // User dismissed share dialog
      return { shared: false, downloaded: false };
    }
    // Fallback: download on any error
    await downloadPlayerCard(data);
    return { shared: false, downloaded: true };
  }
}
