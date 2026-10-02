// @ts-check
/**
 * Stadium Scoreboard - Player Registration Stats
 * Fetches live counts from the database and animates the numbers
 */

import { supabase } from '../core/supabase.js';

/**
 * Animate number from 0 to target value
 */
function animateNumber(element, target, duration = 1500) {
  const start = 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function (ease-out-cubic)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * easeOut);
    
    element.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target; // Ensure final value is exact
    }
  }
  
  requestAnimationFrame(update);
}

/**
 * Fetch player stats from database
 */
async function fetchStats() {
  try {
    // Check if running in dev mode
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDev) {
      // Use dev API server
      const response = await fetch('http://localhost:3001/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    } else {
      // Use Supabase directly in production
      const { data, error } = await supabase
        .from('players')
        .select('primary_role');
      
      if (error) throw error;
      
      const rows = data || [];
      const batters = rows.filter(r => r.primary_role?.toLowerCase() === 'batter').length;
      const bowlers = rows.filter(r => r.primary_role?.toLowerCase() === 'bowler').length;
      const keepers = rows.filter(r => r.primary_role?.toLowerCase() === 'wicketkeeper').length;
      
      return {
        total: rows.length,
        batters,
        bowlers,
        keepers,
        live: true,
        updatedAt: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('❌ Stats fetch error:', error);
    return {
      total: 0,
      batters: 0,
      bowlers: 0,
      keepers: 0,
      live: false
    };
  }
}

/**
 * Update the scoreboard UI with stats
 */
async function updateScoreboard() {
  console.log('📊 Fetching player stats...');
  
  const stats = await fetchStats();
  
  console.log('📊 Stats received:', stats);
  
  // Find elements
  const totalEl = document.querySelector('[data-stat="total"]');
  const battersEl = document.querySelector('[data-stat="batters"]');
  const bowlersEl = document.querySelector('[data-stat="bowlers"]');
  const keepersEl = document.querySelector('[data-stat="keepers"]');
  
  if (!totalEl || !battersEl || !bowlersEl || !keepersEl) {
    console.warn('⚠️ Stats elements not found');
    return;
  }
  
  // Animate numbers
  animateNumber(totalEl, stats.total, 2000);
  setTimeout(() => animateNumber(battersEl, stats.batters, 1200), 400);
  setTimeout(() => animateNumber(bowlersEl, stats.bowlers, 1200), 600);
  setTimeout(() => animateNumber(keepersEl, stats.keepers, 1200), 800);
  
  // Update timestamp if live
  if (stats.live) {
    const timestampEl = document.querySelector('#stats-section .font-mono.text-xs.text-\\[\\#64716A\\]');
    if (timestampEl) {
      timestampEl.textContent = 'Updated live';
      timestampEl.classList.remove('text-[#64716A]');
      timestampEl.classList.add('text-[#31D47B]');
    }
  }
  
  console.log('✅ Scoreboard updated successfully');
}

/**
 * Initialize the stats section
 */
export function initStats() {
  // Only run on pages with the stats section
  if (!document.getElementById('stats-section')) {
    return;
  }
  
  console.log('🏟️ Initializing Stadium Scoreboard...');
  
  // Initial load
  updateScoreboard();
  
  // Refresh every 30 seconds
  setInterval(updateScoreboard, 30000);
  
  // Refresh when user returns to tab
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      updateScoreboard();
    }
  });
}
