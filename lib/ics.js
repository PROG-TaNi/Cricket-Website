// @ts-check
/**
 * Simple .ics calendar file generator for trial days
 * Generates an iCalendar file with both trial days
 * 
 * @module ics
 */

/**
 * Format a date to iCal format: YYYYMMDD
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Format a date-time to iCal format: YYYYMMDDTHHmmss
 * @param {Date} date
 * @returns {string}
 */
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Generate .ics file content for VJTI Cricket Trials
 * @param {{
 *   day1Date: string,
 *   day2Date: string,
 *   reportingTime?: string | null,
 *   venue: string,
 *   mapsUrl?: string
 * }} config
 * @returns {string} .ics file content
 */
export function generateTrialsCalendar(config) {
  const {
    day1Date,
    day2Date,
    reportingTime = null,
    venue = "VJTI Cricket Ground, Matunga, Mumbai",
    mapsUrl = "https://maps.google.com/?q=VJTI+Cricket+Ground+Matunga"
  } = config;

  const now = new Date();
  const dtstamp = formatDateTime(now);

  // Parse dates (YYYY-MM-DD format expected)
  const [y1, m1, d1] = day1Date.split("-").map(Number);
  const [y2, m2, d2] = day2Date.split("-").map(Number);
  
  const date1 = new Date(y1, m1 - 1, d1);
  const date2 = new Date(y2, m2 - 1, d2);

  // If reporting time is provided, create timed events, otherwise all-day
  let day1Start, day1End, day2Start, day2End;
  let day1AllDay, day2AllDay;

  if (reportingTime && reportingTime !== "TO BE ANNOUNCED") {
    // Parse reporting time (format: "HH:MM AM/PM" or "HH:MM")
    const timeParts = reportingTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeParts) {
      let hours = parseInt(timeParts[1], 10);
      const minutes = parseInt(timeParts[2], 10);
      const meridiem = timeParts[3]?.toUpperCase();
      
      if (meridiem === "PM" && hours < 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;

      const start1 = new Date(y1, m1 - 1, d1, hours, minutes);
      const end1 = new Date(start1);
      end1.setHours(end1.getHours() + 6); // Assume 6-hour duration

      const start2 = new Date(y2, m2 - 1, d2, hours, minutes);
      const end2 = new Date(start2);
      end2.setHours(end2.getHours() + 6);

      day1Start = formatDateTime(start1);
      day1End = formatDateTime(end1);
      day2Start = formatDateTime(start2);
      day2End = formatDateTime(end2);
      day1AllDay = false;
      day2AllDay = false;
    } else {
      // Fall back to all-day if parsing fails
      day1Start = formatDate(date1);
      day1End = formatDate(new Date(date1.getTime() + 86400000)); // +1 day
      day2Start = formatDate(date2);
      day2End = formatDate(new Date(date2.getTime() + 86400000));
      day1AllDay = true;
      day2AllDay = true;
    }
  } else {
    // All-day events
    day1Start = formatDate(date1);
    day1End = formatDate(new Date(date1.getTime() + 86400000)); // +1 day
    day2Start = formatDate(date2);
    day2End = formatDate(new Date(date2.getTime() + 86400000));
    day1AllDay = true;
    day2AllDay = true;
  }

  const description1 = reportingTime && reportingTime !== "TO BE ANNOUNCED"
    ? `VJTI Leather-Ball Cricket Team Selection Trials - Day 1\\n\\nReporting Time: ${reportingTime}\\nVenue: ${venue}\\n\\nBring your whites, kit, ID card, and Registration ID.\\n\\nFor more information: ${typeof window !== "undefined" ? window.location.origin : "https://vjti-cricket.vercel.app"}`
    : `VJTI Leather-Ball Cricket Team Selection Trials - Day 1\\n\\nReporting time will be announced via WhatsApp and on the website.\\nVenue: ${venue}\\n\\nBring your whites, kit, ID card, and Registration ID.\\n\\nFor more information: ${typeof window !== "undefined" ? window.location.origin : "https://vjti-cricket.vercel.app"}`;

  const description2 = reportingTime && reportingTime !== "TO BE ANNOUNCED"
    ? `VJTI Leather-Ball Cricket Team Selection Trials - Day 2\\n\\nReporting Time: ${reportingTime}\\nVenue: ${venue}\\n\\nBring your whites, kit, ID card, and Registration ID.\\n\\nFor more information: ${typeof window !== "undefined" ? window.location.origin : "https://vjti-cricket.vercel.app"}`
    : `VJTI Leather-Ball Cricket Team Selection Trials - Day 2\\n\\nReporting time will be announced via WhatsApp and on the website.\\nVenue: ${venue}\\n\\nBring your whites, kit, ID card, and Registration ID.\\n\\nFor more information: ${typeof window !== "undefined" ? window.location.origin : "https://vjti-cricket.vercel.app"}`;

  // Build .ics file
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VJTI Cricket//Trials 2026//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:VJTI Cricket Trials 2026",
    "X-WR-TIMEZONE:Asia/Kolkata",
    "",
    "BEGIN:VEVENT",
    `UID:vjti-cricket-trial-day-1@${typeof window !== "undefined" ? window.location.hostname : "vjti-cricket.vercel.app"}`,
    `DTSTAMP:${dtstamp}`,
    day1AllDay ? `DTSTART;VALUE=DATE:${day1Start}` : `DTSTART:${day1Start}`,
    day1AllDay ? `DTEND;VALUE=DATE:${day1End}` : `DTEND:${day1End}`,
    "SUMMARY:VJTI Cricket Trials - Day 1",
    `DESCRIPTION:${description1}`,
    `LOCATION:${venue}`,
    mapsUrl ? `GEO:${mapsUrl}` : "",
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:VJTI Cricket Trials tomorrow!",
    "TRIGGER:-P1D", // 1 day before
    "END:VALARM",
    "END:VEVENT",
    "",
    "BEGIN:VEVENT",
    `UID:vjti-cricket-trial-day-2@${typeof window !== "undefined" ? window.location.hostname : "vjti-cricket.vercel.app"}`,
    `DTSTAMP:${dtstamp}`,
    day2AllDay ? `DTSTART;VALUE=DATE:${day2Start}` : `DTSTART:${day2Start}`,
    day2AllDay ? `DTEND;VALUE=DATE:${day2End}` : `DTEND:${day2End}`,
    "SUMMARY:VJTI Cricket Trials - Day 2",
    `DESCRIPTION:${description2}`,
    `LOCATION:${venue}`,
    mapsUrl ? `GEO:${mapsUrl}` : "",
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:VJTI Cricket Trials tomorrow!",
    "TRIGGER:-P1D",
    "END:VALARM",
    "END:VEVENT",
    "",
    "END:VCALENDAR"
  ];

  return lines.filter(line => line !== "").join("\r\n");
}

/**
 * Download .ics file to user's device
 * @param {string} content - .ics file content
 * @param {string} filename - filename without extension
 */
export function downloadICS(content, filename = "VJTI-Cricket-Trials-2026") {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar URL for adding event
 * @param {{
 *   title: string,
 *   startDate: string,
 *   endDate: string,
 *   description: string,
 *   location: string
 * }} config
 * @returns {string} Google Calendar URL
 */
export function generateGoogleCalendarUrl(config) {
  const { title, startDate, endDate, description, location } = config;
  
  // Format: YYYYMMDDTHHMMSS or YYYYMMDD for all-day
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startDate}/${endDate}`,
    details: description,
    location: location,
    sf: "true",
    output: "xml"
  });
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Add both trial days to Google Calendar
 * Opens two Google Calendar tabs for Day 1 and Day 2
 * @param {{
 *   day1Date: string,
 *   day2Date: string,
 *   reportingTime?: string | null,
 *   venue: string,
 *   mapsUrl?: string
 * }} config
 */
export function addToGoogleCalendar(config) {
  const {
    day1Date,
    day2Date,
    reportingTime = null,
    venue = "VJTI Cricket Ground, Matunga, Mumbai",
    mapsUrl = "https://maps.google.com/?q=VJTI+Cricket+Ground+Matunga"
  } = config;

  // Parse dates
  const [y1, m1, d1] = day1Date.split("-").map(Number);
  const [y2, m2, d2] = day2Date.split("-").map(Number);
  
  const date1 = new Date(y1, m1 - 1, d1);
  const date2 = new Date(y2, m2 - 1, d2);

  let day1Start, day1End, day2Start, day2End;

  if (reportingTime && reportingTime !== "TO BE ANNOUNCED") {
    // Parse reporting time
    const timeParts = reportingTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeParts) {
      let hours = parseInt(timeParts[1], 10);
      const minutes = parseInt(timeParts[2], 10);
      const meridiem = timeParts[3]?.toUpperCase();
      
      if (meridiem === "PM" && hours < 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;

      const start1 = new Date(y1, m1 - 1, d1, hours, minutes);
      const end1 = new Date(start1);
      end1.setHours(end1.getHours() + 6);

      const start2 = new Date(y2, m2 - 1, d2, hours, minutes);
      const end2 = new Date(start2);
      end2.setHours(end2.getHours() + 6);

      day1Start = formatDateTime(start1);
      day1End = formatDateTime(end1);
      day2Start = formatDateTime(start2);
      day2End = formatDateTime(end2);
    } else {
      // All-day fallback
      day1Start = formatDate(date1);
      day1End = formatDate(new Date(date1.getTime() + 86400000));
      day2Start = formatDate(date2);
      day2End = formatDate(new Date(date2.getTime() + 86400000));
    }
  } else {
    // All-day events
    day1Start = formatDate(date1);
    day1End = formatDate(new Date(date1.getTime() + 86400000));
    day2Start = formatDate(date2);
    day2End = formatDate(new Date(date2.getTime() + 86400000));
  }

  const description1 = reportingTime && reportingTime !== "TO BE ANNOUNCED"
    ? `VJTI Leather-Ball Cricket Team Selection Trials - Day 1\n\nReporting Time: ${reportingTime}\nVenue: ${venue}\n\nBring your whites, kit, ID card, and Registration ID.\n\nFor more information: ${typeof window !== "undefined" ? window.location.origin : "https://vjti-cricket.vercel.app"}`
    : `VJTI Leather-Ball Cricket Team Selection Trials - Day 1\n\nReporting time will be announced via WhatsApp and on the website.\nVenue: ${venue}\n\nBring your whites, kit, ID card, and Registration ID.\n\nFor more information: ${typeof window !== "undefined" ? window.location.origin : "https://vjti-cricket.vercel.app"}`;

  const description2 = reportingTime && reportingTime !== "TO BE ANNOUNCED"
    ? `VJTI Leather-Ball Cricket Team Selection Trials - Day 2\n\nReporting Time: ${reportingTime}\nVenue: ${venue}\n\nBring your whites, kit, ID card, and Registration ID.\n\nFor more information: ${typeof window !== "undefined" ? window.location.origin : "https://vjti-cricket.vercel.app"}`
    : `VJTI Leather-Ball Cricket Team Selection Trials - Day 2\n\nReporting time will be announced via WhatsApp and on the website.\nVenue: ${venue}\n\nBring your whites, kit, ID card, and Registration ID.\n\nFor more information: ${typeof window !== "undefined" ? window.location.origin : "https://vjti-cricket.vercel.app"}`;

  // Open Day 1
  const url1 = generateGoogleCalendarUrl({
    title: "VJTI Cricket Trials - Day 1",
    startDate: day1Start,
    endDate: day1End,
    description: description1,
    location: venue
  });
  
  // Open Day 2
  const url2 = generateGoogleCalendarUrl({
    title: "VJTI Cricket Trials - Day 2",
    startDate: day2Start,
    endDate: day2End,
    description: description2,
    location: venue
  });

  // Open both in new tabs
  window.open(url1, "_blank");
  setTimeout(() => {
    window.open(url2, "_blank");
  }, 500); // Small delay to ensure both tabs open
}
