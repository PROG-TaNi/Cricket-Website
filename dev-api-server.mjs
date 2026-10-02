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

// Card endpoint
app.get('/api/card/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { data: player, error } = await supabase
      .from('players')
      .select('registration_id, full_name, primary_role, branch, year, program, photo_url')
      .eq('public_token', token)
      .maybeSingle();

    if (error || !player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    if (req.query.format === 'json') {
      return res.status(200).json({ player });
    }

    const photoSvg = player.photo_url
      ? `<image href="${player.photo_url}" x="80" y="200" width="220" height="220" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo-clip)"/>`
      : `<rect x="80" y="200" width="220" height="220" rx="24" fill="#0A140F"/><text x="190" y="320" fill="#31D47B" font-size="64" font-weight="900" text-anchor="middle" font-family="system-ui, sans-serif">🏏</text>`;

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1350" width="1080" height="1350">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050807"/>
      <stop offset="50%" stop-color="#0B150F"/>
      <stop offset="100%" stop-color="#030604"/>
    </linearGradient>
    <clipPath id="photo-clip">
      <rect x="80" y="200" width="220" height="220" rx="24"/>
    </clipPath>
  </defs>
  <rect width="1080" height="1350" fill="url(#bg)"/>
  <rect x="40" y="40" width="1000" height="1270" rx="32" fill="none" stroke="#31D47B" stroke-width="3" stroke-opacity="0.5"/>
  <rect x="70" y="80" width="340" height="44" rx="22" fill="#31D47B" fill-opacity="0.12" stroke="#31D47B" stroke-opacity="0.4"/>
  <circle cx="95" cy="102" r="6" fill="#31D47B"/>
  <text x="115" y="108" fill="#31D47B" font-size="18" font-weight="bold" font-family="monospace">OFFICIAL TRIAL PASS · 2026</text>
  <text x="1010" y="110" fill="#F4F1E8" font-size="24" font-weight="800" text-anchor="end" font-family="system-ui, sans-serif">VJTI CRICKET CLUB</text>
  <line x1="70" y1="150" x2="1010" y2="150" stroke="#ffffff" stroke-opacity="0.15"/>
  ${photoSvg}
  <rect x="80" y="200" width="220" height="220" rx="24" fill="none" stroke="#31D47B" stroke-width="3"/>
  <text x="340" y="225" fill="#A7B2AC" font-size="16" font-family="monospace" font-weight="bold">REGISTERED CANDIDATE</text>
  <text x="340" y="275" fill="#F4F1E8" font-size="44" font-family="system-ui, sans-serif" font-weight="900">${(player.full_name || '').toUpperCase()}</text>
  <rect x="340" y="305" width="670" height="85" rx="16" fill="#31D47B" fill-opacity="0.12" stroke="#31D47B" stroke-opacity="0.5" stroke-width="2"/>
  <text x="365" y="335" fill="#A7B2AC" font-size="14" font-family="monospace" font-weight="bold">REGISTRATION ID</text>
  <text x="365" y="375" fill="#31D47B" font-size="40" font-family="monospace" font-weight="900">${player.registration_id}</text>
  <rect x="80" y="460" width="440" height="90" rx="16" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.1"/>
  <text x="105" y="490" fill="#8F9D95" font-size="14" font-family="monospace" font-weight="bold">PRIMARY ROLE</text>
  <text x="105" y="525" fill="#D4FF52" font-size="26" font-family="system-ui, sans-serif" font-weight="bold">${(player.primary_role || '').toUpperCase()}</text>
  <rect x="560" y="460" width="440" height="90" rx="16" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.1"/>
  <text x="585" y="490" fill="#8F9D95" font-size="14" font-family="monospace" font-weight="bold">ACADEMIC PROGRAM</text>
  <text x="585" y="525" fill="#F4F1E8" font-size="22" font-family="system-ui, sans-serif" font-weight="bold">${(player.branch || '')} · ${(player.year || '')}</text>
  <rect x="80" y="590" width="920" height="420" rx="24" fill="#000000" fill-opacity="0.4" stroke="#31D47B" stroke-opacity="0.3"/>
  <text x="120" y="660" fill="#31D47B" font-size="18" font-family="monospace" font-weight="bold">● SELECTION TRIALS INFORMATION</text>
  <text x="120" y="730" fill="#D4FF52" font-size="34" font-family="system-ui, sans-serif" font-weight="900">SAT 31 OCT &amp; SUN 01 NOV 2026</text>
  <text x="120" y="790" fill="#F4F1E8" font-size="24" font-family="system-ui, sans-serif">VJTI Cricket Ground, Matunga, Mumbai</text>
  <text x="120" y="850" fill="#F4F1E8" font-size="20" font-family="monospace">COMPULSORY: FULL WHITES &amp; CRICKET GEAR</text>
  <text x="120" y="910" fill="#A7B2AC" font-size="18" font-family="monospace">Show your Registration ID ${player.registration_id} at the check-in desk.</text>
  <line x1="80" y1="1230" x2="1000" y2="1230" stroke="#ffffff" stroke-opacity="0.1"/>
  <text x="80" y="1270" fill="#64716A" font-size="14" font-family="monospace">VEERMATA JIJABAI TECHNOLOGICAL INSTITUTE · CRICKET COMMITTEE</text>
  <text x="1000" y="1270" fill="#64716A" font-size="14" font-family="monospace" text-anchor="end">NON-TRANSFERABLE</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600');
    return res.send(svgContent);
  } catch (error) {
    console.error('❌ Card error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const { data, error } = await supabase.from('players').select('primary_role');
    if (error) throw error;
    const rows = data || [];
    const batters = rows.filter((r) => r.primary_role?.toLowerCase() === 'batter').length;
    const bowlers = rows.filter((r) => r.primary_role?.toLowerCase() === 'bowler').length;
    const keepers = rows.filter((r) => r.primary_role?.toLowerCase() === 'wicketkeeper').length;
    return res.status(200).json({
      total: rows.length,
      batters,
      bowlers,
      keepers,
      live: true,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    return res.status(200).json({ total: 0, batters: 0, bowlers: 0, keepers: 0, live: false });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Dev API server running on http://localhost:${PORT}`);
  console.log(`   Registration endpoint: http://localhost:${PORT}/api/register`);
  console.log(`\n📝 Update your registration form to use this URL for local dev\n`);
});
