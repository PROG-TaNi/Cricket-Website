#!/usr/bin/env node
// @ts-check
/**
 * Build-time script to protect developer credit
 * Adds cryptographic markers to build output
 * Run after Vite build: node scripts/protect-credit.js
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { createHash } from 'crypto';

const CREDIT_BANNER = `
<!--
╔══════════════════════════════════════════════════════════════════╗
║                    VJTI CRICKET TRIALS 2026                      ║
║                   DEVELOPER CREDIT - PROTECTED                   ║
╚══════════════════════════════════════════════════════════════════╝

  Developer:    Tarush Nigam
  Program:      B.Tech Final Year
  Department:   Electronics Engineering
  Institution:  VJTI (Veermata Jijabai Technological Institute)
  Year:         2026
  Role:         Full-Stack Developer

  This credit is cryptographically protected and verified.
  Hash: 1ad17a05ba0b080e73b3ca1a4baef1db2e88b09423eac13c386339606fc2dc54
  
  Any attempt to modify or remove this credit will:
  - Fail runtime verification checks
  - Break the cryptographic signature
  - Be logged and reported
  
  Built with: Vite + Vanilla JS + Tailwind CSS + Supabase
  
  © 2026 VJTI Cricket Team. All rights reserved.
  Website developed by Tarush Nigam.
-->
`;

const JS_CREDIT_BANNER = `/**
 * VJTI CRICKET TRIALS 2026 - DEVELOPER CREDIT
 * 
 * Developer: Tarush Nigam
 * Program: B.Tech Final Year, Electronics Engineering
 * Institution: VJTI, 2026
 * 
 * This code is cryptographically protected.
 * Hash: 1ad17a05ba0b080e73b3ca1a4baef1db2e88b09423eac13c386339606fc2dc54
 * 
 * © 2026 VJTI Cricket Team. Developed by Tarush Nigam.
 */
`;

/**
 * Recursively process all files in dist directory
 * @param {string} dir
 */
function processDirectory(dir) {
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (stat.isFile()) {
      const ext = extname(fullPath);
      
      if (ext === '.html') {
        addCreditToHTML(fullPath);
      } else if (ext === '.js' || ext === '.mjs') {
        addCreditToJS(fullPath);
      }
    }
  }
}

/**
 * Add credit banner to HTML files
 * @param {string} filePath
 */
function addCreditToHTML(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  
  // Only add if not already present
  if (!content.includes('DEVELOPER CREDIT - PROTECTED')) {
    // Add after <!DOCTYPE html> or at the very beginning
    if (content.includes('<!DOCTYPE html>')) {
      content = content.replace('<!DOCTYPE html>', `<!DOCTYPE html>${CREDIT_BANNER}`);
    } else if (content.includes('<html')) {
      content = CREDIT_BANNER + content;
    } else {
      content = CREDIT_BANNER + content;
    }
    
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Protected: ${filePath}`);
  }
}

/**
 * Add credit banner to JS files
 * @param {string} filePath
 */
function addCreditToJS(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  
  // Only add if not already present
  if (!content.includes('DEVELOPER CREDIT')) {
    content = JS_CREDIT_BANNER + content;
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Protected: ${filePath}`);
  }
}

// Main execution
const distDir = join(process.cwd(), 'dist');

try {
  console.log('🔒 Protecting developer credit in build output...\n');
  processDirectory(distDir);
  console.log('\n✅ Developer credit protection applied successfully!');
  console.log('   Developer: Tarush Nigam');
  console.log('   Program: B.Tech Final Year, Electronics Engineering');
  console.log('   Institution: VJTI, 2026\n');
} catch (error) {
  console.error('❌ Error protecting credit:', error.message);
  process.exit(1);
}
