// @ts-check
/**
 * Organizer Analytics Controller
 * Renders demographic, branch, role, and attendance conversion charts using Chart.js.
 */

import "../../css/main.css";
import { initOrganizerLayout } from "./layout.js";
import { getPlayers } from "./data.js";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

document.addEventListener("DOMContentLoaded", async () => {
  await initOrganizerLayout(window.location.pathname);

  const players = await getPlayers();
  const total = players.length;

  const batters = players.filter((p) => p.primary_role === "Batter").length;
  const bowlers = players.filter((p) => p.primary_role === "Bowler").length;
  const keepers = players.filter((p) => p.primary_role === "Wicketkeeper").length;
  const day1Present = players.filter((p) => p.day1_attendance === "present" || p.day1_attendance === "late").length;
  const shortlisted = players.filter((p) => p.status === "shortlisted").length;

  // High level metrics
  const mTotal = document.getElementById("metric-total");
  const mBatters = document.getElementById("metric-batters");
  const mBowlers = document.getElementById("metric-bowlers");
  const mTurnout = document.getElementById("metric-turnout");

  if (mTotal) mTotal.textContent = String(total);
  if (mBatters) mBatters.textContent = `${total > 0 ? Math.round((batters / total) * 100) : 0}%`;
  if (mBowlers) mBowlers.textContent = `${total > 0 ? Math.round((bowlers / total) * 100) : 0}%`;
  if (mTurnout) mTurnout.textContent = `${total > 0 ? Math.round((day1Present / total) * 100) : 0}%`;

  // 1. Roles Doughnut Chart
  const ctxRoles = /** @type {HTMLCanvasElement | null} */ (document.getElementById("chart-roles"));
  if (ctxRoles) {
    new Chart(ctxRoles, {
      type: "doughnut",
      data: {
        labels: ["Batters", "Bowlers", "Wicketkeepers"],
        datasets: [{
          data: [batters, bowlers, keepers],
          backgroundColor: ["#31D47B", "#D4FF52", "#F4F1E8"],
          borderColor: "#07100B",
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#A7B2AC", font: { family: "monospace", size: 11 } }
          }
        }
      }
    });
  }

  // 2. Branch Leaderboard Chart
  const branchCounts = {};
  players.forEach((p) => {
    const b = p.branch || "Other";
    branchCounts[b] = (branchCounts[b] || 0) + 1;
  });

  const sortedBranches = Object.entries(branchCounts).sort((a, b) => b[1] - a[1]);
  const branchLabels = sortedBranches.map((item) => item[0].replace(" Engineering", ""));
  const branchData = sortedBranches.map((item) => item[1]);

  const ctxBranches = /** @type {HTMLCanvasElement | null} */ (document.getElementById("chart-branches"));
  if (ctxBranches) {
    new Chart(ctxBranches, {
      type: "bar",
      data: {
        labels: branchLabels,
        datasets: [{
          label: "Registrations",
          data: branchData,
          backgroundColor: "#31D47B",
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: "#64716A", stepSize: 1 }, grid: { color: "rgba(255,255,255,0.05)" } },
          y: { ticks: { color: "#A7B2AC", font: { family: "monospace", size: 10 } }, grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // 3. Year & Program Chart
  const yearCounts = { "1st Year": 0, "2nd Year": 0, "3rd Year": 0, "Final Year": 0 };
  players.forEach((p) => {
    if (p.year === "1st") yearCounts["1st Year"]++;
    else if (p.year === "2nd") yearCounts["2nd Year"]++;
    else if (p.year === "3rd") yearCounts["3rd Year"]++;
    else if (p.year === "4th") yearCounts["Final Year"]++;
  });

  const ctxYears = /** @type {HTMLCanvasElement | null} */ (document.getElementById("chart-years"));
  if (ctxYears) {
    new Chart(ctxYears, {
      type: "bar",
      data: {
        labels: Object.keys(yearCounts),
        datasets: [{
          label: "Candidates",
          data: Object.values(yearCounts),
          backgroundColor: "#D4FF52",
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: "#A7B2AC", font: { family: "monospace" } }, grid: { display: false } },
          y: { ticks: { color: "#64716A", stepSize: 1 }, grid: { color: "rgba(255,255,255,0.05)" } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // 4. Selection Funnel Chart
  const ctxFunnel = /** @type {HTMLCanvasElement | null} */ (document.getElementById("chart-funnel"));
  if (ctxFunnel) {
    new Chart(ctxFunnel, {
      type: "bar",
      data: {
        labels: ["Registered", "Day 1 Turnout", "In Trials", "Shortlisted"],
        datasets: [{
          label: "Candidates",
          data: [
            total,
            day1Present,
            players.filter((p) => p.status === "in_trials" || p.status === "shortlisted").length,
            shortlisted
          ],
          backgroundColor: ["rgba(255,255,255,0.2)", "#F4F1E8", "#D4FF52", "#31D47B"],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: "#A7B2AC", font: { family: "monospace" } }, grid: { display: false } },
          y: { ticks: { color: "#64716A" }, grid: { color: "rgba(255,255,255,0.05)" } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }
});
