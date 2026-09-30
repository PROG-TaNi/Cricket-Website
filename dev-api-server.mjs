#!/usr/bin/env node
/**
 * Simple Express server for local API testing
 * Run with: node dev-api-server.mjs
 */

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const app = express();
const PORT = 3001;

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

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Validation
const REG_NO_REGEX = /^[A-Z0-9]{4,20}$/;
const NAME_REGEX = /^[A-Za-z\s.''-]{2,80}$/;
const WHATSAPP_REGEX = /^\+91[6-9]\d{9}$/;

// Registration endpoint
app.post('/api/register', async (req, res) => {
  console.log('📥 Registration request received');
  
  try {
    const {
      full_name,
      reg_no,
      program,
      year,
      branch,
      primary_role,
      batting_style,
      bowling_style,
      past_experience,
      whatsapp,
      photo_url,
    } = req.body;

    // Validation
    const errors = [];
    if (!NAME_REGEX.test(full_name || '')) errors.push('Invalid full name');
    if (!REG_NO_REGEX.test((reg_no || '').toUpperCase())) errors.push('Invalid registration number');
    if (!['Degree', 'Diploma', 'M.Tech'].includes(program)) errors.push('Invalid program');
    if (!year) errors.push('Year is required');
    if (!branch) errors.push('Branch is required');
    if (!['Batter', 'Bowler', 'Wicketkeeper'].includes(primary_role)) errors.push('Invalid role');
    if (!['Right-hand', 'Left-hand'].includes(batting_style)) errors.push('Invalid batting style');
    if (!WHATSAPP_REGEX.test(whatsapp || '')) errors.push('Invalid WhatsApp number');

    if (errors.length > 0) {
      console.log('❌ Validation errors:', errors);
      return res.status(422).json({ error: errors.join(', ') });
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('players')
      .select('registration_id')
      .eq('reg_no', reg_no.toUpperCase())
      .maybeSingle();

    if (existing) {
      console.log('❌ Duplicate registration:', reg_no);
      return res.status(409).json({
        error: 'This registration number is already registered.',
        registration_id: existing.registration_id,
      });
    }

    // Insert player
    const { data: player, error: insertError } = await supabase
      .from('players')
      .insert({
        full_name: full_name.trim(),
        reg_no: reg_no.toUpperCase().trim(),
        program,
        year,
        branch: branch.trim(),
        primary_role,
        batting_style,
        bowling_style,
        experience: past_experience ? past_experience.trim() : null,
        whatsapp_number: whatsapp,
        photo_url: photo_url ? photo_url.substring(0, 500000) : null,
        consent: true,
        status: 'registered',
      })
      .select('registration_id, public_token, full_name, primary_role, program, year, branch, batting_style, bowling_style, photo_url')
      .single();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }

    console.log('✅ Registration successful:', player.registration_id);

    return res.status(201).json({
      registrationId: player.registration_id,
      publicToken: player.public_token,
      firstName: player.full_name.split(' ')[0],
      player
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dev API server running' });
});

// Find ID endpoint
app.post('/api/find-id', async (req, res) => {
  console.log('🔍 Find ID request received');
  
  try {
    const { reg_no, whatsapp } = req.body;

    if (!reg_no || !whatsapp) {
      return res.status(400).json({ error: 'Both Reg no and WhatsApp number are required.' });
    }

    // Normalize inputs
    const normalizedRegNo = String(reg_no).toUpperCase().trim();
    let normalizedWhatsApp = String(whatsapp).replace(/[\s\-()]/g, '');
    
    // Ensure it starts with +91
    if (!normalizedWhatsApp.startsWith('+91')) {
      if (normalizedWhatsApp.startsWith('91')) {
        normalizedWhatsApp = '+' + normalizedWhatsApp;
      } else {
        normalizedWhatsApp = '+91' + normalizedWhatsApp.replace(/^0/, '');
      }
    }

    console.log('Looking up:', { reg_no: normalizedRegNo, whatsapp: normalizedWhatsApp });

    // Query database - both must match
    const { data, error } = await supabase
      .from('players')
      .select('registration_id, public_token, full_name, primary_role, program, year, branch, batting_style, bowling_style, photo_url, reg_no, whatsapp_number')
      .eq('reg_no', normalizedRegNo)
      .eq('whatsapp_number', normalizedWhatsApp)
      .maybeSingle();

    if (error) {
      console.error('❌ Find ID error:', error);
      return res.status(500).json({ error: 'Lookup failed. Please try again.' });
    }
    
    if (!data) {
      console.log('❌ No match found');
      return res.status(404).json({ error: 'No match found. Check your Reg no and WhatsApp number.' });
    }

    console.log('✅ Player found:', data.registration_id);

    return res.status(200).json({
      registrationId: data.registration_id,
      publicToken: data.public_token,
      firstName: data.full_name.split(' ')[0],
      player: data
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Dev API server running on http://localhost:${PORT}`);
  console.log(`   Registration endpoint: http://localhost:${PORT}/api/register`);
  console.log(`\n📝 Update your registration form to use this URL for local dev\n`);
});
