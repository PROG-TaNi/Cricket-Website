/**
 * API: Get player registration statistics
 * Returns total count and breakdown by primary role
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Get breakdown by primary role
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('primary_role');

    if (playersError) throw playersError;

    // Count by role
    const roleCounts = {
      batters: 0,
      bowlers: 0,
      keepers: 0
    };

    players?.forEach(player => {
      const role = player.primary_role?.toLowerCase();
      if (role === 'batter' || role === 'batsman') {
        roleCounts.batters++;
      } else if (role === 'bowler') {
        roleCounts.bowlers++;
      } else if (role === 'wicket-keeper' || role === 'keeper') {
        roleCounts.keepers++;
      }
    });

    return res.status(200).json({
      success: true,
      stats: {
        total: totalCount || 0,
        batters: roleCounts.batters,
        bowlers: roleCounts.bowlers,
        keepers: roleCounts.keepers
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stats API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stats: {
        total: 0,
        batters: 0,
        bowlers: 0,
        keepers: 0
      }
    });
  }
}
