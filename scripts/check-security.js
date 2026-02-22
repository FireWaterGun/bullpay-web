#!/usr/bin/env node

/**
 * Security Fixes Verification Script for Bull Pay Web
 *
 * Validates that all frontend security fixes from SECURITY_REVIEW.md are in place.
 * Run: npm run check:security
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

let passed = 0;
let failed = 0;
let warnings = 0;

function check(id, description, fn) {
  try {
    const result = fn();
    if (result === true) {
      console.log(`  \x1b[32m✓\x1b[0m [${id}] ${description}`);
      passed++;
    } else if (result === 'warn') {
      console.log(`  \x1b[33m⚠\x1b[0m [${id}] ${description}`);
      warnings++;
    } else {
      console.log(`  \x1b[31m✗\x1b[0m [${id}] ${description}`);
      if (typeof result === 'string') console.log(`      → ${result}`);
      failed++;
    }
  } catch (e) {
    console.log(`  \x1b[31m✗\x1b[0m [${id}] ${description}`);
    console.log(`      → ${e.message}`);
    failed++;
  }
}

// ─── Checks ────────────────────────────────────────────────────────────────

console.log('\n\x1b[1mSecurity Fixes Verification\x1b[0m\n');

// ── Fix 1: Open Redirect ───────────────────────────────────────────────────
console.log('\x1b[36m── Fix 1: Open Redirect Protection ──\x1b[0m');

check('1a', 'src/utils/url.ts exists with isSafeRedirectUrl', () => {
  const src = read('src/utils/url.ts');
  if (!src.includes('export function isSafeRedirectUrl')) return 'isSafeRedirectUrl not exported';
  if (!src.includes("protocol === 'http:'") || !src.includes("protocol === 'https:'"))
    return 'Missing http/https protocol check';
  if (!src.includes('new URL(')) return 'Missing URL parsing';
  return true;
});

check('1b', 'useInvoicePayment.js guards redirect with isSafeRedirectUrl', () => {
  const src = read('src/views/invoices/payment/useInvoicePayment.js');
  if (!src.includes("import { isSafeRedirectUrl }")) return 'Missing import of isSafeRedirectUrl';
  if (!src.includes('isSafeRedirectUrl(invoice.successUrl)')) return 'Redirect not guarded';
  // Ensure window.location.href is wrapped
  const lines = src.split('\n');
  const redirectLine = lines.findIndex(l => l.includes('window.location.href = invoice.successUrl'));
  if (redirectLine === -1) return 'Cannot find redirect line';
  // Check that the guard is on a preceding line
  const contextBefore = lines.slice(Math.max(0, redirectLine - 3), redirectLine + 1).join('\n');
  if (!contextBefore.includes('isSafeRedirectUrl')) return 'isSafeRedirectUrl guard not around redirect';
  return true;
});

check('1c', 'InvoicePaymentV2.jsx guards <a href> with isSafeRedirectUrl', () => {
  const src = read('src/views/invoices/InvoicePaymentV2.jsx');
  if (!src.includes("import { isSafeRedirectUrl }")) return 'Missing import of isSafeRedirectUrl';
  if (!src.includes('isSafeRedirectUrl(invoice.successUrl)')) return 'Link not guarded';
  return true;
});

// ── Fix 2: i18n escapeValue ────────────────────────────────────────────────
console.log('\x1b[36m── Fix 2: i18n escapeValue Comment ──\x1b[0m');

check('2a', 'i18n/index.ts has safety comment for escapeValue: false', () => {
  const src = read('src/i18n/index.ts');
  if (!src.includes('escapeValue: false')) return 'escapeValue setting missing';
  // Check comment exists near escapeValue
  const lines = src.split('\n');
  const idx = lines.findIndex(l => l.includes('escapeValue: false'));
  if (idx <= 0) return 'Cannot find escapeValue line';
  const prevLines = lines.slice(Math.max(0, idx - 2), idx + 1).join('\n').toLowerCase();
  if (!prevLines.includes('react') || !prevLines.includes('xss') || !prevLines.includes('jsx'))
    return 'Missing explanatory comment about React/XSS/JSX safety';
  return true;
});

// ── Fix 3: Pusher Transport Security ───────────────────────────────────────
console.log('\x1b[36m── Fix 3: Pusher Transport Security ──\x1b[0m');

check('3a', 'PusherContext uses conditional enabledTransports based on forceTLS', () => {
  const src = read('src/context/PusherContext.jsx');
  if (src.includes("enabledTransports: ['ws', 'wss']") && !src.includes('forceTLS ?'))
    return "enabledTransports hardcoded to ['ws', 'wss'] — not conditional on forceTLS";
  if (!src.includes("forceTLS ? ['wss']")) return "Missing forceTLS ? ['wss'] conditional";
  return true;
});

// ── Fix 4: CSP Meta Tag ────────────────────────────────────────────────────
console.log('\x1b[36m── Fix 4: Content Security Policy ──\x1b[0m');

check('4a', 'index.html has CSP meta tag', () => {
  const src = read('index.html');
  if (!src.includes('Content-Security-Policy')) return 'CSP meta tag missing';
  return true;
});

check('4b', 'CSP includes frame-src directive', () => {
  const src = read('index.html');
  if (!src.includes("frame-src")) return "Missing frame-src directive";
  return true;
});

check('4c', 'CSP includes script-src directive', () => {
  const src = read('index.html');
  if (!src.includes("script-src 'self'")) return "Missing script-src 'self' directive";
  return true;
});

check('4d', 'CSP restricts default-src to self', () => {
  const src = read('index.html');
  if (!src.includes("default-src 'self'")) return "Missing default-src 'self' directive";
  return true;
});

// ── Fix 5: SRI for External CDN ────────────────────────────────────────────
console.log('\x1b[36m── Fix 5: Subresource Integrity ──\x1b[0m');

check('5a', 'Boxicons CDN link has integrity attribute', () => {
  const src = read('index.html');
  const boxiconsLine = src.split('\n').find(l => l.includes('boxicons') && l.includes('unpkg.com'));
  if (!boxiconsLine) return 'Boxicons CDN link not found';
  if (!boxiconsLine.includes('integrity="sha384-')) return 'Missing SRI integrity hash';
  if (!boxiconsLine.includes('crossorigin="anonymous"')) return 'Missing crossorigin="anonymous"';
  return true;
});

// ── Fix 6: API Key Masking ─────────────────────────────────────────────────
console.log('\x1b[36m── Fix 6: Merchant API Key Masking ──\x1b[0m');

check('6a', 'ApiCredentialsCard has showApiKey state for masking', () => {
  const src = read('src/views/merchant/ApiCredentialsCard.jsx');
  if (!src.includes('showApiKey')) return 'showApiKey state not found';
  if (!src.includes('setShowApiKey')) return 'setShowApiKey setter not found';
  return true;
});

check('6b', 'API key is masked by default (shows dots)', () => {
  const src = read('src/views/merchant/ApiCredentialsCard.jsx');
  if (!src.includes('••••••••')) return 'Masked placeholder dots not found';
  if (!src.includes('.slice(0, 4)') || !src.includes('.slice(-4)'))
    return 'Missing prefix/suffix slicing for partial reveal';
  return true;
});

check('6c', 'API key auto-hides after timeout', () => {
  const src = read('src/views/merchant/ApiCredentialsCard.jsx');
  if (!src.includes('apiKeyTimerRef')) return 'Auto-hide timer ref not found';
  if (!src.includes('30_000') && !src.includes('30000')) return '30s timeout not found';
  return true;
});

check('6d', 'Eye icon toggle for show/hide', () => {
  const src = read('src/views/merchant/ApiCredentialsCard.jsx');
  if (!src.includes('bx-hide') || !src.includes('bx-show')) return 'Eye toggle icons not found';
  return true;
});

// ── Fix 7: Vite Config Security ────────────────────────────────────────────
console.log('\x1b[36m── Fix 7: Vite Config Hardening ──\x1b[0m');

check('7a', 'Dev server host is not exposed (not host: true)', () => {
  const src = read('vite.config.js');
  // Check it does NOT have `host: true` (allow host: '127.0.0.1' or 'localhost' etc.)
  const lines = src.split('\n');
  const hostTrueLines = lines.filter(l => {
    const trimmed = l.trim();
    return trimmed === 'host: true,' || trimmed === 'host: true';
  });
  if (hostTrueLines.length > 0) return 'host: true exposes dev server to network — use 127.0.0.1';
  return true;
});

check('7b', 'Source maps disabled for production', () => {
  const src = read('vite.config.js');
  if (!src.includes('sourcemap')) return 'sourcemap config not found — should be explicitly false';
  if (src.includes('sourcemap: true')) return 'sourcemap is enabled — should be false for production';
  return true;
});

check('7c', 'Console/debugger statements dropped in build', () => {
  const src = read('vite.config.js');
  if (!src.includes("'console'") && !src.includes('"console"'))
    return "esbuild drop: ['console'] not configured";
  if (!src.includes("'debugger'") && !src.includes('"debugger"'))
    return "esbuild drop: ['debugger'] not configured";
  return true;
});

// ── Fix 8: Clipboard Auto-clear ────────────────────────────────────────────
console.log('\x1b[36m── Fix 8: Clipboard Auto-clear ──\x1b[0m');

check('8a', 'copyToClipboard supports autoClearMs option', () => {
  const src = read('src/utils/clipboard.ts');
  if (!src.includes('autoClearMs')) return 'autoClearMs parameter not found';
  if (!src.includes("writeText('')") && !src.includes("writeText(\"\")"))
    return 'Clipboard clear (writeText empty) not found';
  return true;
});

check('8b', 'ApiCredentialsCard uses autoClearMs for API key copy', () => {
  const src = read('src/views/merchant/ApiCredentialsCard.jsx');
  if (!src.includes('autoClearMs')) return 'autoClearMs not used when copying API key';
  return true;
});

// ── Fix 9: Polling Max Retry ───────────────────────────────────────────────
console.log('\x1b[36m── Fix 9: Invoice Polling Limit ──\x1b[0m');

check('9a', 'useInvoicePayment has MAX_POLL_COUNT constant', () => {
  const src = read('src/views/invoices/payment/useInvoicePayment.js');
  if (!src.includes('MAX_POLL_COUNT')) return 'MAX_POLL_COUNT constant not found';
  return true;
});

check('9b', 'Polling increments counter and stops at limit', () => {
  const src = read('src/views/invoices/payment/useInvoicePayment.js');
  if (!src.includes('pollCountRef')) return 'pollCountRef not found';
  if (!src.includes('>= MAX_POLL_COUNT') && !src.includes('> MAX_POLL_COUNT'))
    return 'Poll count limit check not found';
  return true;
});

// ── Fix 10: confirm() → Modal ──────────────────────────────────────────────
console.log('\x1b[36m── Fix 10: No browser confirm() ──\x1b[0m');

const ADMIN_FILES_NO_CONFIRM = [
  'src/views/admin/useEVMFeePolicy.js',
  'src/views/admin/Sweep.jsx',
  'src/views/admin/withdrawal-policy/GasSettingsForm.jsx',
];

ADMIN_FILES_NO_CONFIRM.forEach((file) => {
  const shortName = file.split('/').pop();
  check(`10-${shortName}`, `${shortName} does not use browser confirm()`, () => {
    const src = read(file);
    // Match confirm( but not confirmDelete, confirmReset, etc.
    const matches = src.match(/[^a-zA-Z_]confirm\s*\(/g);
    if (matches) return `Found ${matches.length} raw confirm() call(s) — use modal instead`;
    return true;
  });
});

check('10d', 'ConfirmResetModal component exists', () => {
  const src = read('src/components/ConfirmResetModal.jsx');
  if (!src.includes('export default function ConfirmResetModal')) return 'Component not found';
  if (!src.includes('modal-dialog')) return 'Not using Bootstrap modal';
  return true;
});

// ── Fix 11: Idle Auto-logout ───────────────────────────────────────────────
console.log('\x1b[36m── Fix 11: Idle Auto-logout ──\x1b[0m');

check('11a', 'useIdleLogout hook exists', () => {
  const src = read('src/hooks/useIdleLogout.js');
  if (!src.includes('export default function useIdleLogout'))
    return 'useIdleLogout hook not exported';
  return true;
});

check('11b', 'Idle timeout is 30 minutes', () => {
  const src = read('src/hooks/useIdleLogout.js');
  if (!src.includes('30 * 60 * 1000') && !src.includes('1800000') && !src.includes('30_min'))
    return '30 minute timeout not found';
  return true;
});

check('11c', 'Tracks user activity events', () => {
  const src = read('src/hooks/useIdleLogout.js');
  const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
  const missing = events.filter(e => !src.includes(`'${e}'`));
  if (missing.length > 0) return `Missing event listeners: ${missing.join(', ')}`;
  return true;
});

check('11d', 'Event handlers are throttled', () => {
  const src = read('src/hooks/useIdleLogout.js');
  if (!src.includes('THROTTLE') && !src.includes('throttle') && !src.includes('lastActivity'))
    return 'No throttling mechanism found for event handlers';
  return true;
});

check('11e', 'useIdleLogout integrated in AuthContext', () => {
  const src = read('src/context/AuthContext.jsx');
  if (!src.includes('useIdleLogout')) return 'useIdleLogout not imported/used in AuthContext';
  return true;
});

// ─── Summary ───────────────────────────────────────────────────────────────

console.log('\n\x1b[1m── Summary ──\x1b[0m');
console.log(`  \x1b[32m${passed} passed\x1b[0m  ${warnings > 0 ? `\x1b[33m${warnings} warnings\x1b[0m  ` : ''}\x1b[31m${failed} failed\x1b[0m  (${passed + warnings + failed} total)\n`);

if (failed > 0) {
  console.log('\x1b[31mSome security checks failed! Review the issues above.\x1b[0m\n');
  process.exit(1);
}

if (warnings > 0) {
  console.log('\x1b[33mAll checks passed with warnings.\x1b[0m\n');
} else {
  console.log('\x1b[32mAll security checks passed!\x1b[0m\n');
}
