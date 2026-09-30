#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

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
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n📋 Recent Players in Database:\n');

const { data, error } = await supabase
  .from('players')
  .select('registration_id, full_name, reg_no, whatsapp_number, created_at')
  .order('created_at', { ascending: false })
  .limit(10);

if (error) {
  console.error('Error:', error);
  process.exit(1);
}

data.forEach((p, i) => {
  console.log(`${i + 1}. ${p.full_name}`);
  console.log(`   ID: ${p.registration_id}`);
  console.log(`   Reg: ${p.reg_no}`);
  console.log(`   WhatsApp: ${p.whatsapp_number}`);
  console.log(`   Created: ${new Date(p.created_at).toLocaleString()}\n`);
});

console.log(`Total shown: ${data.length} players\n`);
