#!/usr/bin/env node
/**
 * Copy only the image assets actually referenced in DashboardHome (and similar)
 * from full-version/assets/img/* into bull-web/public/assets/img/*.
 * (ESM version)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const fullImgRoot = path.resolve(projectRoot, '../full-version/assets/img');
const targetRoot = path.resolve(projectRoot, 'public/assets/img');

if (!fs.existsSync(fullImgRoot)) {
  console.error('Missing source folder:', fullImgRoot);
  process.exit(1);
}

// Minimal required files (extend if more references appear)
const required = [
  'illustrations/man-with-laptop.png',
  'icons/unicons/wallet-info.png',
  'icons/unicons/paypal.png',
  'icons/unicons/wallet-primary.png',
  'icons/unicons/wallet.png',
  'icons/unicons/chart.png',
  'icons/unicons/cc-primary.png',
  'icons/unicons/cc-warning.png',
  'avatars/1.png',
  'avatars/5.png',
  'avatars/6.png',
  'avatars/12.png',
  'icons/brands/chrome.png',
  'icons/brands/safari.png',
  'icons/brands/firefox.png',
  'icons/brands/edge.png',
  'icons/brands/opera.png',
  'icons/brands/uc.png',
  'icons/brands/windows.png'
];

let copied = 0;
let missing = 0;

function copyFile(rel) {
  const src = path.join(fullImgRoot, rel);
  const dest = path.join(targetRoot, rel);
  if (!fs.existsSync(src)) {
    console.warn('[miss] ', rel);
    missing++;
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log('[copied]', rel);
  copied++;
}

required.forEach(copyFile);
console.log(`\nDone. Copied: ${copied}, Missing: ${missing}`);
if (missing) process.exitCode = 2;
