// @ts-check

/**
 * Generates and triggers download of an .ics calendar file for the VJTI Cricket Trials.
 */
export function downloadTrialsCalendar() {
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VJTI Cricket Team//Selection Trials 2026//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    
    // Day 1
    "BEGIN:VEVENT",
    "UID:vjti-cricket-trials-2026-day-1@vjti.ac.in",
    "DTSTAMP:20260929T000000Z",
    "DTSTART;VALUE=DATE:20261010",
    "DTEND;VALUE=DATE:20261011",
    "SUMMARY:VJTI Cricket Selection Trials 2026 - Day 1",
    "DESCRIPTION:VJTI Leather-Ball Cricket Team Selection Trials Day 1. Full whites compulsory. Bring your kit and VJTI ID card.",
    "LOCATION:VJTI Cricket Ground, Matunga, Mumbai",
    "STATUS:CONFIRMED",
    "END:VEVENT",

    // Day 2
    "BEGIN:VEVENT",
    "UID:vjti-cricket-trials-2026-day-2@vjti.ac.in",
    "DTSTAMP:20260929T000000Z",
    "DTSTART;VALUE=DATE:20261011",
    "DTEND;VALUE=DATE:20261012",
    "SUMMARY:VJTI Cricket Selection Trials 2026 - Day 2",
    "DESCRIPTION:VJTI Leather-Ball Cricket Team Selection Trials Day 2. Match simulation and final trial nets.",
    "LOCATION:VJTI Cricket Ground, Matunga, Mumbai",
    "STATUS:CONFIRMED",
    "END:VEVENT",

    "END:VCALENDAR"
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "VJTI-Cricket-Trials-2026.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
