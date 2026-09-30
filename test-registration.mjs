#!/usr/bin/env node
/**
 * Complete Registration Test - Simulates real user registration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║     🏏 VJTI Cricket Registration - Live Test 🏏      ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);

// Load environment
function loadEnv() {
  const envFile = readFileSync('.env', 'utf8');
  const env = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      env[key] = value;
      process.env[key] = value;
    }
  });
  return env;
}

loadEnv();

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Test data - Multiple realistic players
const testPlayers = [
  {
    full_name: 'Arjun Sharma',
    reg_no: 'D221041001',
    program: 'Degree',
    year: 'Third Year',
    branch: 'Computer Engineering',
    primary_role: 'Batter',
    batting_style: 'Right-hand',
    bowling_style: 'Right-arm medium',
    experience: 'Played for college team 2 years. Best score: 78* against KJ Somaiya. Member of Dadar Cricket Club.',
    whatsapp_number: '+919876543210'
  },
  {
    full_name: 'Rohan Patel',
    reg_no: 'D221042015',
    program: 'Degree',
    year: 'Second Year',
    branch: 'Electronics Engineering',
    primary_role: 'Bowler',
    batting_style: 'Right-hand',
    bowling_style: 'Right-arm pace',
    experience: 'Inter-college fast bowler. Best figures: 4/32. Trained at MIG Cricket Club.',
    whatsapp_number: '+919876543211'
  },
  {
    full_name: 'Priya Deshmukh',
    reg_no: 'D221043028',
    program: 'Degree',
    year: 'Final Year',
    branch: 'Mechanical Engineering',
    primary_role: 'Wicketkeeper',
    batting_style: 'Right-hand',
    bowling_style: "Doesn't bowl",
    experience: 'Wicketkeeper for college women\'s team. 3 years experience. Quick with gloves.',
    whatsapp_number: '+919876543212'
  },
  {
    full_name: 'Kabir Singh',
    reg_no: 'D221044042',
    program: 'Degree',
    year: 'First Year',
    branch: 'Civil Engineering',
    primary_role: 'Batter',
    batting_style: 'Left-hand',
    bowling_style: 'Left-arm orthodox',
    experience: 'All-rounder. School captain. Harris Shield participant. Best: 65 runs, 3/25.',
    whatsapp_number: '+919876543213'
  },
  {
    full_name: 'Sneha Kulkarni',
    reg_no: 'DIP21101',
    program: 'Diploma',
    year: 'Second Year',
    branch: 'Information Technology',
    primary_role: 'Bowler',
    batting_style: 'Right-hand',
    bowling_style: 'Right-arm leg-spin',
    experience: 'Leg-spinner with 2 years experience. Best: 5/28 in inter-school match.',
    whatsapp_number: '+919876543214'
  }
];

// Dummy base64 photo (1x1 pixel transparent PNG)
const dummyPhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Register player
async function registerPlayer(player) {
  console.log(`${colors.blue}► Registering: ${player.full_name}${colors.reset}`);
  console.log(`  Reg No: ${player.reg_no}`);
  console.log(`  Role: ${player.primary_role} | Branch: ${player.branch}`);
  
  try {
    const { data, error } = await supabase
      .from('players')
      .insert({
        ...player,
        photo_url: dummyPhoto,
        consent: true,
        status: 'registered'
      })
      .select('registration_id, public_token, full_name, primary_role, status')
      .single();
    
    if (error) {
      if (error.code === '23505') {
        console.log(`  ${colors.yellow}⚠ Already registered (duplicate)${colors.reset}`);
        return { skipped: true };
      }
      throw error;
    }
    
    console.log(`  ${colors.green}✓ Success! ID: ${data.registration_id}${colors.reset}`);
    console.log(`  Token: ${data.public_token}\n`);
    return data;
  } catch (error) {
    console.log(`  ${colors.red}✗ Failed: ${error.message}${colors.reset}\n`);
    return { error: error.message };
  }
}

// Test duplicate prevention
async function testDuplicatePrevention(regNo) {
  console.log(`${colors.blue}► Testing Duplicate Prevention${colors.reset}`);
  console.log(`  Attempting to register duplicate reg_no: ${regNo}`);
  
  try {
    const { error } = await supabase
      .from('players')
      .insert({
        full_name: 'Duplicate Test',
        reg_no: regNo,
        program: 'Degree',
        year: 'First Year',
        branch: 'Test',
        primary_role: 'Batter',
        batting_style: 'Right-hand',
        bowling_style: "Doesn't bowl",
        whatsapp_number: '+919999999999',
        consent: true
      })
      .select()
      .single();
    
    if (error && error.code === '23505') {
      console.log(`  ${colors.green}✓ Duplicate correctly rejected!${colors.reset}\n`);
      return true;
    } else {
      console.log(`  ${colors.red}✗ Duplicate was NOT rejected - BUG!${colors.reset}\n`);
      return false;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Test failed: ${error.message}${colors.reset}\n`);
    return false;
  }
}

// Get statistics
async function getStatistics() {
  console.log(`${colors.blue}► Fetching Statistics${colors.reset}`);
  
  try {
    const { data, error } = await supabase.rpc('get_registration_stats');
    
    if (error) throw error;
    
    console.log(`  Total Registrations: ${colors.green}${data.total}${colors.reset}`);
    console.log(`  Recent (24h): ${colors.green}${data.recent_24h}${colors.reset}`);
    
    if (data.by_role && data.by_role.length > 0) {
      console.log(`  By Role:`);
      const roleMap = {};
      data.by_role.forEach(r => {
        roleMap[r.primary_role] = (roleMap[r.primary_role] || 0) + parseInt(r.count);
      });
      Object.entries(roleMap).forEach(([role, count]) => {
        console.log(`    ${role}: ${count}`);
      });
    }
    
    if (data.by_program && data.by_program.length > 0) {
      console.log(`  By Program:`);
      const programMap = {};
      data.by_program.forEach(p => {
        programMap[p.program] = (programMap[p.program] || 0) + parseInt(p.count);
      });
      Object.entries(programMap).forEach(([program, count]) => {
        console.log(`    ${program}: ${count}`);
      });
    }
    
    console.log();
    return data;
  } catch (error) {
    console.log(`  ${colors.red}✗ Failed to get statistics: ${error.message}${colors.reset}\n`);
    return null;
  }
}

// Search player
async function searchPlayer(searchTerm) {
  console.log(`${colors.blue}► Searching for: ${searchTerm}${colors.reset}`);
  
  try {
    const { data, error } = await supabase.rpc('find_player', { search_term: searchTerm });
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      const player = data[0];
      console.log(`  ${colors.green}✓ Found!${colors.reset}`);
      console.log(`  Name: ${player.full_name}`);
      console.log(`  Reg No: ${player.reg_no}`);
      console.log(`  Program: ${player.program} - ${player.year}`);
      console.log(`  Branch: ${player.branch}`);
      console.log(`  Status: ${player.status}\n`);
      return player;
    } else {
      console.log(`  ${colors.yellow}⚠ Not found${colors.reset}\n`);
      return null;
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Search failed: ${error.message}${colors.reset}\n`);
    return null;
  }
}

// View recent registrations
async function viewRecentRegistrations() {
  console.log(`${colors.blue}► Recent Registrations (Last 10)${colors.reset}`);
  
  try {
    const { data, error } = await supabase
      .from('players')
      .select('registration_id, full_name, primary_role, branch, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      data.forEach(player => {
        const date = new Date(player.created_at).toLocaleString();
        console.log(`  ${player.registration_id} | ${player.full_name} | ${player.primary_role} | ${player.branch}`);
        console.log(`    Registered: ${date}`);
      });
      console.log();
    } else {
      console.log(`  No registrations found.\n`);
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Failed: ${error.message}${colors.reset}\n`);
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.cyan}Starting comprehensive registration test...\n${colors.reset}`);
  
  const results = [];
  let registeredId = null;
  let registeredRegNo = null;
  
  // Register all test players
  console.log(`${colors.cyan}═══ STEP 1: Register Test Players ═══${colors.reset}\n`);
  for (const player of testPlayers) {
    const result = await registerPlayer(player);
    results.push(result);
    if (result.registration_id) {
      registeredId = result.registration_id;
      registeredRegNo = player.reg_no;
    }
  }
  
  // Test duplicate prevention
  console.log(`${colors.cyan}═══ STEP 2: Test Duplicate Prevention ═══${colors.reset}\n`);
  if (registeredRegNo) {
    await testDuplicatePrevention(registeredRegNo);
  }
  
  // Get statistics
  console.log(`${colors.cyan}═══ STEP 3: Check Statistics ═══${colors.reset}\n`);
  await getStatistics();
  
  // Search for a player
  console.log(`${colors.cyan}═══ STEP 4: Search Functionality ═══${colors.reset}\n`);
  if (registeredId) {
    await searchPlayer(registeredId);
  }
  if (registeredRegNo) {
    await searchPlayer(registeredRegNo);
  }
  
  // View recent registrations
  console.log(`${colors.cyan}═══ STEP 5: View Recent Registrations ═══${colors.reset}\n`);
  await viewRecentRegistrations();
  
  // Summary
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║                    TEST SUMMARY                        ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  const successful = results.filter(r => r.registration_id).length;
  const skipped = results.filter(r => r.skipped).length;
  const failed = results.filter(r => r.error).length;
  
  console.log(`  ${colors.green}✓ Successful Registrations: ${successful}${colors.reset}`);
  console.log(`  ${colors.yellow}⚠ Skipped (already exists): ${skipped}${colors.reset}`);
  console.log(`  ${colors.red}✗ Failed: ${failed}${colors.reset}`);
  
  console.log(`\n${colors.cyan}Next Steps:${colors.reset}`);
  console.log(`  1. Open: ${colors.blue}http://localhost:5173/register.html${colors.reset}`);
  console.log(`  2. Test manual registration with photo upload`);
  console.log(`  3. Check Supabase Table Editor to see all data`);
  console.log(`  4. Open: ${colors.blue}http://localhost:5173/organizer/${colors.reset}`);
  console.log(`  5. View dashboard and test filtering\n`);
  
  if (successful > 0) {
    console.log(`${colors.green}🎉 Database is fully functional and ready for brutal testing!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Some issues detected. Check errors above.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`\n${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
