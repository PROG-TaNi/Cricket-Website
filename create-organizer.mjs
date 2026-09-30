#!/usr/bin/env node
/**
 * Create Organizer Account in Supabase Auth
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load env
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

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const email = 'organizer@vjti.cricket';
const password = 'VJTICricket2026!';

console.log('\n🔐 Creating Organizer Account...\n');
console.log(`Email: ${email}`);
console.log(`Password: ${password}`);
console.log('');

const { data, error } = await supabase.auth.admin.createUser({
  email: email,
  password: password,
  email_confirm: true
});

if (error) {
  if (error.message.includes('already been registered')) {
    console.log('✓ Account already exists! You can login with:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log('');
    console.log('🔗 Login at: http://localhost:5173/organizer/login.html\n');
  } else {
    console.error('✗ Error:', error.message);
  }
} else {
  console.log('✓ Organizer account created successfully!');
  console.log(`  User ID: ${data.user.id}`);
  console.log('');
  console.log('📋 Login credentials:');
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${password}`);
  console.log('');
  console.log('🔗 Login at: http://localhost:5173/organizer/login.html\n');
}
