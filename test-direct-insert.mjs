#!/usr/bin/env node
/**
 * Test direct database insertion
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
};

console.log(`\n${colors.cyan}Testing Direct Database Insert...${colors.reset}\n`);

// Load environment
function loadEnv() {
  const envFile = readFileSync('.env', 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

loadEnv();

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Test player
const testPlayer = {
  full_name: 'Test User ' + Date.now(),
  reg_no: 'WEB' + Math.floor(Math.random() * 10000),
  program: 'Degree',
  year: 'Third Year',
  branch: 'Computer Engineering',
  primary_role: 'Batter',
  batting_style: 'Right-hand',
  bowling_style: 'Right-arm medium',
  experience: 'Testing from web registration',
  whatsapp_number: '+919876543210',
  photo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  consent: true,
  status: 'registered'
};

console.log('Inserting test player:', testPlayer.full_name);
console.log('Reg No:', testPlayer.reg_no);

try {
  const { data, error } = await supabase
    .from('players')
    .insert(testPlayer)
    .select('registration_id, full_name, reg_no, created_at')
    .single();
  
  if (error) {
    console.log(`${colors.red}✗ Insert failed:${colors.reset}`, error.message);
    console.log('Error details:', error);
    process.exit(1);
  }
  
  console.log(`${colors.green}✓ Successfully inserted!${colors.reset}`);
  console.log('Registration ID:', data.registration_id);
  console.log('Full Name:', data.full_name);
  console.log('Reg No:', data.reg_no);
  console.log('Created At:', data.created_at);
  
  console.log(`\n${colors.cyan}Check Supabase Table Editor:${colors.reset}`);
  console.log('https://app.supabase.com → Table Editor → players');
  console.log(`You should see: ${data.full_name} (${data.registration_id})\n`);
  
} catch (error) {
  console.log(`${colors.red}✗ Error:${colors.reset}`, error.message);
  process.exit(1);
}
