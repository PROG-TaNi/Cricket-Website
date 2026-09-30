#!/usr/bin/env node
/**
 * Database Integration Test Suite
 * Tests the complete registration flow with Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}`),
  detail: (msg) => console.log(`${colors.gray}  ${msg}${colors.reset}`),
};

// Load environment variables
function loadEnv() {
  try {
    const envFile = readFileSync(join(process.cwd(), '.env'), 'utf8');
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
  } catch (error) {
    log.error('Could not load .env file');
    return {};
  }
}

// Initialize Supabase client
function initSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase credentials in .env file');
  }
  
  if (url.includes('mock-')) {
    throw new Error('Still using mock Supabase URL. Please update .env with real credentials.');
  }
  
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

// Test 1: Check database connection
async function testConnection(supabase) {
  log.section('TEST 1: Database Connection');
  try {
    const { data, error } = await supabase
      .from('players')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    log.success('Successfully connected to Supabase');
    log.detail(`Current player count: ${data?.length || 0}`);
    return true;
  } catch (error) {
    log.error(`Connection failed: ${error.message}`);
    return false;
  }
}

// Test 2: Check table schema
async function testSchema(supabase) {
  log.section('TEST 2: Table Schema Verification');
  
  const requiredTables = ['players', 'announcements', 'settings'];
  let allTablesExist = true;
  
  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows (table exists)
      log.success(`Table '${table}' exists`);
    } catch (error) {
      log.error(`Table '${table}' missing or inaccessible`);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

// Test 3: Insert test player
async function testInsertPlayer(supabase) {
  log.section('TEST 3: Player Registration');
  
  const testPlayer = {
    full_name: 'Test Player ' + Date.now(),
    reg_no: 'TEST' + Math.floor(Math.random() * 10000),
    program: 'Degree',
    year: 'Third Year',
    branch: 'Computer Engineering',
    primary_role: 'Batter',
    batting_style: 'Right-hand',
    bowling_style: 'Right-arm medium',
    whatsapp_number: '+919876543210',
    experience: 'This is a test registration from automated test suite.',
    consent: true,
    status: 'registered'
  };
  
  try {
    // Insert
    const { data: player, error: insertError } = await supabase
      .from('players')
      .insert(testPlayer)
      .select('registration_id, public_token, full_name, reg_no, status')
      .single();
    
    if (insertError) throw insertError;
    
    log.success('Player registered successfully');
    log.detail(`Registration ID: ${player.registration_id}`);
    log.detail(`Public Token: ${player.public_token}`);
    log.detail(`Name: ${player.full_name}`);
    log.detail(`Reg No: ${player.reg_no}`);
    
    // Verify we can read it back
    const { data: readPlayer, error: readError } = await supabase
      .from('players')
      .select('*')
      .eq('registration_id', player.registration_id)
      .single();
    
    if (readError) throw readError;
    
    log.success('Player data retrieved successfully');
    
    return player;
  } catch (error) {
    log.error(`Registration failed: ${error.message}`);
    if (error.code === '23505') {
      log.warning('Duplicate registration number. This is expected if test ran before.');
    }
    return null;
  }
}

// Test 4: Test duplicate prevention
async function testDuplicatePrevention(supabase) {
  log.section('TEST 4: Duplicate Prevention');
  
  const regNo = 'DUP' + Math.floor(Math.random() * 10000);
  const basePlayer = {
    full_name: 'Duplicate Test',
    reg_no: regNo,
    program: 'Degree',
    year: 'Second Year',
    branch: 'Electronics',
    primary_role: 'Bowler',
    batting_style: 'Right-hand',
    bowling_style: 'Right-arm pace',
    whatsapp_number: '+919876543211',
    consent: true
  };
  
  try {
    // First insert
    const { data: first, error: firstError } = await supabase
      .from('players')
      .insert(basePlayer)
      .select('registration_id')
      .single();
    
    if (firstError) throw firstError;
    log.success(`First registration successful: ${first.registration_id}`);
    
    // Try duplicate
    const { error: dupError } = await supabase
      .from('players')
      .insert(basePlayer)
      .select()
      .single();
    
    if (dupError && dupError.code === '23505') {
      log.success('Duplicate registration correctly rejected');
      return true;
    } else {
      log.error('Duplicate registration was NOT rejected - database constraint missing!');
      return false;
    }
  } catch (error) {
    log.error(`Duplicate test failed: ${error.message}`);
    return false;
  }
}

// Test 5: Test statistics function
async function testStatistics(supabase) {
  log.section('TEST 5: Statistics Functions');
  
  try {
    const { data, error } = await supabase.rpc('get_registration_stats');
    
    if (error) throw error;
    
    log.success('Statistics retrieved successfully');
    log.detail(`Total registrations: ${data.total || 0}`);
    log.detail(`Registrations in last 24h: ${data.recent_24h || 0}`);
    
    if (data.by_role) {
      log.detail('Registrations by role:');
      data.by_role.forEach(role => {
        log.detail(`  ${role.primary_role}: ${role.count}`);
      });
    }
    
    return true;
  } catch (error) {
    log.error(`Statistics test failed: ${error.message}`);
    return false;
  }
}

// Test 6: Test player search
async function testPlayerSearch(supabase, registrationId) {
  log.section('TEST 6: Player Search Function');
  
  if (!registrationId) {
    log.warning('Skipping search test (no registration ID from previous tests)');
    return true;
  }
  
  try {
    const { data, error } = await supabase.rpc('find_player', { 
      search_term: registrationId 
    });
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      log.success(`Player found: ${data[0].full_name}`);
      log.detail(`Reg No: ${data[0].reg_no}`);
      log.detail(`Status: ${data[0].status}`);
      return true;
    } else {
      log.error('Player not found');
      return false;
    }
  } catch (error) {
    log.error(`Search test failed: ${error.message}`);
    return false;
  }
}

// Test 7: Test settings table
async function testSettings(supabase) {
  log.section('TEST 7: Settings Management');
  
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*');
    
    if (error) throw error;
    
    log.success(`Settings loaded: ${data.length} keys found`);
    data.forEach(setting => {
      log.detail(`${setting.key}: ${JSON.stringify(setting.value)}`);
    });
    
    return true;
  } catch (error) {
    log.error(`Settings test failed: ${error.message}`);
    return false;
  }
}

// Test 8: Cleanup test data
async function cleanupTestData(supabase) {
  log.section('TEST 8: Cleanup Test Data');
  
  try {
    const { data, error } = await supabase
      .from('players')
      .delete()
      .or('reg_no.like.TEST%,reg_no.like.DUP%,full_name.like.Test Player%,full_name.like.Duplicate Test%')
      .select('registration_id');
    
    if (error) throw error;
    
    const count = data?.length || 0;
    if (count > 0) {
      log.success(`Cleaned up ${count} test registration(s)`);
    } else {
      log.info('No test data to clean up');
    }
    
    return true;
  } catch (error) {
    log.warning(`Cleanup failed (this is OK): ${error.message}`);
    return true; // Don't fail the test suite on cleanup issues
  }
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🏏 VJTI Cricket Registration - Database Test Suite');
  console.log('='.repeat(60));
  
  // Load environment
  log.section('Loading Environment');
  const env = loadEnv();
  log.info(`Supabase URL: ${process.env.VITE_SUPABASE_URL || 'NOT SET'}`);
  log.info(`Using ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service role' : 'anon'} key`);
  
  // Initialize Supabase
  let supabase;
  try {
    supabase = initSupabase();
    log.success('Supabase client initialized');
  } catch (error) {
    log.error(error.message);
    log.info('\nPlease follow SUPABASE_SETUP_GUIDE.md to configure your database.');
    process.exit(1);
  }
  
  // Run tests
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };
  
  const tests = [
    { name: 'Connection', fn: () => testConnection(supabase) },
    { name: 'Schema', fn: () => testSchema(supabase) },
    { name: 'Insert Player', fn: () => testInsertPlayer(supabase), saveResult: 'testPlayer' },
    { name: 'Duplicate Prevention', fn: () => testDuplicatePrevention(supabase) },
    { name: 'Statistics', fn: () => testStatistics(supabase) },
    { name: 'Player Search', fn: (ctx) => testPlayerSearch(supabase, ctx.testPlayer?.registration_id) },
    { name: 'Settings', fn: () => testSettings(supabase) },
    { name: 'Cleanup', fn: () => cleanupTestData(supabase) },
  ];
  
  const context = {};
  
  for (const test of tests) {
    results.total++;
    try {
      const result = await test.fn(context);
      if (result) {
        results.passed++;
        if (test.saveResult) {
          context[test.saveResult] = result;
        }
      } else {
        results.failed++;
      }
    } catch (error) {
      results.failed++;
      log.error(`Test '${test.name}' crashed: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  log.section('TEST SUMMARY');
  console.log(`Total Tests: ${results.total}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  
  if (results.failed === 0) {
    console.log(`\n${colors.green}🎉 All tests passed! Your database is ready.${colors.reset}`);
    console.log(`\nYou can now:`);
    console.log(`  1. Start dev server: npm run dev`);
    console.log(`  2. Test registration: http://localhost:5173/register.html`);
    console.log(`  3. Access dashboard: http://localhost:5173/organizer/`);
  } else {
    console.log(`\n${colors.red}❌ Some tests failed. Please check the errors above.${colors.reset}`);
    console.log(`\nTroubleshooting:`);
    console.log(`  1. Verify .env file has correct Supabase credentials`);
    console.log(`  2. Ensure supabase-setup.sql was run successfully`);
    console.log(`  3. Check Supabase dashboard for errors`);
    console.log(`  4. See SUPABASE_SETUP_GUIDE.md for detailed instructions`);
  }
  
  console.log('='.repeat(60) + '\n');
  
  process.exit(results.failed === 0 ? 0 : 1);
}

// Run the test suite
runTests().catch(error => {
  console.error(`\n${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
