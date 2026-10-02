// @ts-check

/**
 * Locked facts and configuration for VJTI Cricket Trials 2026-27
 * Source of truth: Section 1 of master prompt.
 * Never hard-code these values in components or HTML templates.
 */
export const siteConfig = {
  eventName: "VJTI Leather-Ball Cricket Team Selection Trials 2026–27",
  shortName: "VJTI Cricket Trials 2026",
  tagline: "ONE CAMPUS. ONE TEAM. ONE SHOT.",
  subTagline: "The road to wearing the VJTI whites starts here. Register for the official leather-ball selection trials and earn your place.",
  
  // Trial Days
  trialDays: [
    {
      id: "day-1",
      dayNumber: 1,
      title: "TRIAL DAY 01",
      dayOfWeek: "Saturday",
      dateFormatted: "31 October 2026",
      shortDate: "Sat 31 Oct",
      reportingTime: null, // null -> "TO BE ANNOUNCED"
      status: "upcoming" // upcoming | live | completed
    },
    {
      id: "day-2",
      dayNumber: 2,
      title: "TRIAL DAY 02",
      dayOfWeek: "Sunday",
      dateFormatted: "1 November 2026",
      shortDate: "Sun 1 Nov",
      reportingTime: null, // null -> "TO BE ANNOUNCED"
      status: "upcoming"
    }
  ],

  venue: {
    name: "VJTI Cricket Ground",
    location: "Matunga, Mumbai",
    fullAddress: "VJTI Grounds, H. R. Mahajani Marg, Matunga East, Mumbai 400019",
    mapsUrl: "https://maps.google.com/?q=VJTI+Cricket+Ground+Matunga+Mumbai"
  },

  // Dates & Timezone
  timezone: "Asia/Kolkata",
  countdownTarget: "2026-10-31T00:00:00+05:30",
  registrationDeadline: null, // null -> "TO BE ANNOUNCED"

  // Registration Mode: "native" | "google_form"
  registrationMode: "native",
  googleFormFallbackUrl: "https://docs.google.com/forms/d/e/vjti-cricket-trials-placeholder/viewform",

  // Contacts & Socials (Config placeholders - committee will confirm)
  contacts: {
    generalQuery: "Official Sports Committee, VJTI",
    whatsappGroupUrl: "https://chat.whatsapp.com/vjti-cricket-trials-2026-placeholder",
    instagramHandle: "@vjti_cricket",
    instagramUrl: "https://instagram.com/vjti_cricket",
    supportEmail: "cricket.vjti.trials@gmail.com" // committee contact placeholder
  },

  // Roles: Exactly 3 roles (Batter, Bowler, Wicketkeeper)
  roles: [
    {
      id: "batter",
      title: "Batter",
      tagline: "Build the innings.",
      description: "Patience, temperament, and authority at the crease. Whether opening against the new ball or finishing under lights."
    },
    {
      id: "bowler",
      title: "Bowler",
      tagline: "Control the game.",
      description: "Hit your lengths, break partnerships, exploit the seam and extract turn. Dictate terms with every delivery."
    },
    {
      id: "wicketkeeper",
      title: "Wicketkeeper",
      tagline: "Lead from behind the stumps.",
      description: "Safe hands, lightning reflexes, and the sharpest cricketing brain on the park. The heartbeat of the team in the field."
    }
  ],

  // Form Fields Config
  programs: ["Degree", "Diploma", "M.Tech"],

  programYears: {
    "Degree": [
      { id: "1st", label: "1st Year (FY)" },
      { id: "2nd", label: "2nd Year (SY)" },
      { id: "3rd", label: "3rd Year (TY)" },
      { id: "4th", label: "4th Year (Final)" }
    ],
    "Diploma": [
      { id: "1st", label: "1st Year" },
      { id: "2nd", label: "2nd Year" },
      { id: "3rd", label: "3rd Year" }
    ],
    "M.Tech": [
      { id: "1st", label: "1st Year" },
      { id: "2nd", label: "2nd Year" }
    ]
  },

  branches: [
    "Civil Engineering",
    "Computer Engineering",
    "Electrical Engineering",
    "Electronics Engineering",
    "Electronics & Telecommunication",
    "Information Technology",
    "Instrumentation Engineering",
    "Mechanical Engineering",
    "Production Engineering",
    "Textile Engineering",
    "Other"
  ],

  battingStyles: [
    "Right-hand",
    "Left-hand"
  ],

  bowlingStyles: [
    "Right-arm pace",
    "Left-arm pace",
    "Right-arm medium",
    "Right-arm off-spin",
    "Right-arm leg-spin",
    "Left-arm orthodox",
    "Left-arm wrist-spin",
    "Doesn't bowl"
  ],

  // Past Experience Prompt Chips
  experiencePrompts: [
    "Played for: ",
    "Tournaments: ",
    "Best score / figures: ",
    "Years of leather-ball cricket: "
  ],

  // Key Headline Rules
  headlineRules: [
    {
      number: "01",
      badge: "WHITES",
      title: "WHITES COMPULSORY.",
      quote: "Full whites. This is a leather-ball trial, so dress like it."
    },
    {
      number: "02",
      badge: "KIT",
      title: "BRING YOUR OWN KIT (IF POSSIBLE).",
      quote: "Bat, pads, gloves, helmet, guards, shoes: carry whatever you have. Can't bring everything? Tell the committee at check-in."
    },
    {
      number: "03",
      badge: "TIMING",
      title: "BE ON TIME.",
      quote: "Reporting time is fixed and will be announced here and on WhatsApp. Turn up early, warmed up, ready to go."
    }
  ],

  // Checklist items
  carryList: [
    "VJTI ID card, and your Registration ID (screenshot it or save your player card)",
    "Water bottle, cap, sunscreen (long hours on an open ground)",
    "Supporter and abdomen guard strongly recommended for batters and keepers (leather ball)",
    "Rubber Spike only",
    "Injured or unwell? Tell the committee at check-in. Don't play through it",
    "Keep WhatsApp on. Updates land there first",
    "Play hard, play clean. Respect the selectors, umpires and the ground"
  ],

  // Committee Confirmation Checklist items (flagged for confirmation)
  committeeConfirmation: {
    reportingTime: { value: null, needsConfirmation: true, label: "Official reporting time for Day 1 and Day 2" },
    registrationDeadline: { value: null, needsConfirmation: true, label: "Exact registration close deadline" },
    branchList: { value: "Standard 10 departments", needsConfirmation: true, label: "Branch choices list" },
    leatherBallPolicy: { value: "Open to both experienced and passionate newcomers", needsConfirmation: true, label: "Leather-ball experience requirement" },
    bothDaysPolicy: { value: "Slots will be allotted per player", needsConfirmation: true, label: "Attendance on Day 1 vs Day 2" },
    officialContactPhone: { value: null, needsConfirmation: true, label: "Committee coordinators contact number" },
    whatsappGroupLink: { value: null, needsConfirmation: true, label: "Official WhatsApp announcement group invite link" }
  }
};
