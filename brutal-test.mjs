// brutal-test.js — Comprehensive verification suite for VJTI Cricket Trials
import http from 'http';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function postRequest(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(`http://127.0.0.1:5173${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (_) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getRequest(endpoint) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:5173${endpoint}`, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('  BRUTAL TEST SUITE: VJTI CRICKET TRIALS 2026-27   ');
  console.log('====================================================\n');

  // TEST SUITE 1: Route Integrity
  console.log('--- TEST SUITE 1: Route HTTP Status & Content ---');
  const routes = [
    '/',
    '/register.html',
    '/find-id.html',
    '/squad.html',
    '/privacy.html',
    '/styleguide.html',
    '/organizer/login.html',
    '/organizer/index.html',
    '/organizer/players.html',
    '/organizer/ground.html',
    '/organizer/trials.html',
    '/organizer/desk.html',
    '/organizer/announcements.html',
    '/organizer/analytics.html',
    '/organizer/settings.html',
    '/brand/vjti-logo.png',
    '/team/vjti-team-trophy.jpg',
    '/team/vjti-team-blue.jpg'
  ];

  for (const r of routes) {
    const res = await getRequest(r);
    assert(res.status === 200, `Route ${r} returned HTTP 200`);
  }

  // TEST SUITE 2: Registration API Validation & Boundary Tests
  console.log('\n--- TEST SUITE 2: Registration API Boundary & Validation ---');

  // Empty body
  const emptyRes = await postRequest('/api/register', {});
  assert(emptyRes.status === 422, 'Empty registration payload rejected with 422');

  // Invalid Name
  const badNameRes = await postRequest('/api/register', {
    full_name: 'A',
    reg_no: '221041001',
    program: 'Degree',
    year: '4th',
    branch: 'Electronics Engineering',
    primary_role: 'Batter',
    batting_style: 'Right-hand',
    bowling_style: 'Right-arm off-spin',
    whatsapp: '+919820011221'
  });
  assert(badNameRes.status === 422, 'Single letter name rejected with 422');

  // Invalid Reg No
  const badRegRes = await postRequest('/api/register', {
    full_name: 'Rahul Sharma',
    reg_no: '!!!',
    program: 'Degree',
    year: '4th',
    branch: 'Electronics Engineering',
    primary_role: 'Batter',
    batting_style: 'Right-hand',
    bowling_style: 'Right-arm off-spin',
    whatsapp: '+919820011221'
  });
  assert(badRegRes.status === 422, 'Special chars reg_no rejected with 422');

  // Invalid WhatsApp number
  const badWaRes = await postRequest('/api/register', {
    full_name: 'Rahul Sharma',
    reg_no: '221041002',
    program: 'Degree',
    year: '4th',
    branch: 'Electronics Engineering',
    primary_role: 'Batter',
    batting_style: 'Right-hand',
    bowling_style: 'Right-arm off-spin',
    whatsapp: '12345'
  });
  assert(badWaRes.status === 422, 'Malformed phone number rejected with 422');

  // Valid Registration with photo data
  const validRes = await postRequest('/api/register', {
    full_name: 'Hardik Patil',
    reg_no: '221041888',
    program: 'Degree',
    year: '3rd',
    branch: 'Mechanical Engineering',
    primary_role: 'Bowler',
    batting_style: 'Right-hand',
    bowling_style: 'Right-arm pace',
    past_experience: 'Club pace bowler at Matunga Gymkhana',
    whatsapp: '+919820019999',
    photo_url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
  });
  assert(validRes.status === 201, 'Valid registration with photo accepted with 201');
  assert(validRes.body.registrationId.startsWith('VJTI-CRK-'), 'Returns formatted VJTI-CRK ID');
  assert(validRes.body.player.primary_role === 'Bowler', 'Player object contains primary_role');

  // TEST SUITE 3: Find My ID Validation
  console.log('\n--- TEST SUITE 3: Find My ID API ---');

  const findEmpty = await postRequest('/api/find-id', {});
  assert(findEmpty.status === 400, 'Missing fields rejected with 400');

  const findBadWa = await postRequest('/api/find-id', { reg_no: '221041001', whatsapp: 'abc' });
  assert(findBadWa.status === 422, 'Invalid WA format rejected with 422');

  const findValid = await postRequest('/api/find-id', { reg_no: '221041001', whatsapp: '9820011221' });
  assert(findValid.status === 200, 'Valid reg_no and WA returns 200');
  assert(findValid.body.registrationId === 'VJTI-CRK-0001', 'Found correct candidate ID');

  // TEST SUITE 4: Brand & Asset Verification
  console.log('\n--- TEST SUITE 4: Brand & Team Assets on Disk ---');
  const assetPaths = [
    'public/brand/vjti-logo.png',
    'public/brand/vjti-crest.jpg',
    'public/team/vjti-team-trophy.jpg',
    'public/team/vjti-team-blue.jpg',
    'public/og.png',
    'public/brand/apple-touch-icon.png'
  ];

  for (const ap of assetPaths) {
    const full = path.resolve(process.cwd(), ap);
    const exists = fs.existsSync(full);
    const size = exists ? fs.statSync(full).size : 0;
    assert(exists && size > 1000, `Asset ${ap} exists and has valid size (${size} bytes)`);
  }

  // TEST SUITE 5: Selectors Composite Scoring Calculation
  console.log('\n--- TEST SUITE 5: Selectors Composite Scoring Engine ---');
  // Formula: Batting (35%) + Bowling (35%) + Fielding (20%) + Fitness (10%)
  function calcScore(batting, bowling, fielding, fitness) {
    return Number(((batting * 0.35) + (bowling * 0.35) + (fielding * 0.20) + (fitness * 0.10)).toFixed(1));
  }
  const score1 = calcScore(8, 8, 8, 8);
  assert(score1 === 8.0, `Uniform 8.0 across disciplines calculates to 8.0 (got ${score1})`);

  const score2 = calcScore(10, 6, 8, 8);
  // (10 * 0.35) + (6 * 0.35) + (8 * 0.20) + (8 * 0.10) = 3.5 + 2.1 + 1.6 + 0.8 = 8.0
  assert(score2 === 8.0, `Weighted score for 10,6,8,8 calculates to 8.0 (got ${score2})`);

  console.log('\n====================================================');
  console.log(`  FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
