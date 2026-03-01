#!/usr/bin/env node

/**
 * Bull Pay — Next.js Security & Best Practices Checker
 *
 * Scans the codebase for security issues and Next.js anti-patterns.
 * Exit code 1 if any CRITICAL findings, 0 otherwise.
 *
 * Usage:
 *   node scripts/check-nextjs.mjs
 *   npm run check:security
 */

import { readdir, readFile, stat, access } from 'node:fs/promises'
import { join, relative, extname, basename, dirname } from 'node:path'

// ─── Constants ──────────────────────────────────────────────────────────────

const VERBOSE = process.argv.includes('--verbose')
const ROOT = process.cwd()
const APP_DIR = join(ROOT, 'app')

const EXCLUDE_DIRS = new Set([
  'node_modules', '.next', '.git', 'backup-vite', 'public', 'locales', 'scripts',
])

const SCAN_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.mts',
])

const SEVERITY_ORDER = { CRITICAL: 0, WARNING: 1, INFO: 2 }

const LARGE_PAGE_THRESHOLD = 400
const LARGE_CLIENT_THRESHOLD = 300
const PROP_COUNT_THRESHOLD = 12
const HEAVY_LIBRARIES = [
  { re: /from\s+['"]ethers['"]/, name: 'ethers' },
  { re: /from\s+['"]pusher-js['"]/, name: 'pusher-js' },
  { re: /from\s+['"]qrcode\.react['"]/, name: 'qrcode.react' },
  { re: /from\s+['"]chart\.js['"]/, name: 'chart.js' },
  { re: /from\s+['"]react-apexcharts['"]/, name: 'react-apexcharts' },
]
let usesNextFont = false

// ANSI colors
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
  bgCyan: '\x1b[46m',
}

// ─── Utilities ──────────────────────────────────────────────────────────────

/**
 * Recursively walk a directory, yielding file paths.
 */
async function* walkDir(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walkDir(full)
    } else if (entry.isFile() && SCAN_EXTENSIONS.has(extname(entry.name))) {
      yield full
    }
  }
}

/**
 * Read a file and return its lines.
 */
async function readFileLines(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8')
    return content.split('\n')
  } catch {
    return []
  }
}

/**
 * Check if a line is a comment.
 */
function isCommentLine(line) {
  const trimmed = line.trim()
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('*/')
  )
}

/**
 * Check if a file exists.
 */
async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Get route groups under app/ — returns array of { name, path }.
 */
async function getRouteGroups() {
  const groups = []
  try {
    const entries = await readdir(APP_DIR, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('(') && entry.name.endsWith(')')) {
        groups.push({ name: entry.name, path: join(APP_DIR, entry.name) })
      }
    }
  } catch {
    // app/ dir missing
  }
  return groups
}

/**
 * Get the relative path from ROOT.
 */
function rel(filePath) {
  return relative(ROOT, filePath)
}

// ─── Finding Collector ──────────────────────────────────────────────────────

const findings = []

function addFinding(ruleId, severity, filePath, line, message) {
  findings.push({
    ruleId,
    severity,
    file: filePath ? rel(filePath) : null,
    line,
    message,
  })
}

// ─── Security Rules ─────────────────────────────────────────────────────────

/**
 * sec-dangerous-html: dangerouslySetInnerHTML — CRITICAL if near escapeValue:false
 */
function checkDangerousHtml(filePath, lines, relPath) {
  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    if (lines[i].includes('dangerouslySetInnerHTML')) {
      // Check within 10 lines for escapeValue: false
      const context = lines.slice(Math.max(0, i - 10), i + 10).join('\n')
      const hasNoEscape = /escapeValue\s*:\s*false/.test(context)
      if (hasNoEscape) {
        addFinding('sec-dangerous-html', 'CRITICAL', filePath, i + 1,
          'dangerouslySetInnerHTML with escapeValue:false nearby — XSS risk')
      } else {
        addFinding('sec-dangerous-html', 'WARNING', filePath, i + 1,
          'dangerouslySetInnerHTML usage — ensure input is sanitized')
      }
    }
  }
}

/**
 * sec-eval: eval(), new Function(), .innerHTML =
 */
function checkEval(filePath, lines) {
  const patterns = [
    { re: /\beval\s*\(/, msg: 'eval() usage — code injection risk' },
    { re: /new\s+Function\s*\(/, msg: 'new Function() usage — code injection risk' },
    { re: /\.innerHTML\s*=/, msg: '.innerHTML assignment — potential XSS' },
  ]
  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    for (const { re, msg } of patterns) {
      if (re.test(lines[i])) {
        addFinding('sec-eval', 'CRITICAL', filePath, i + 1, msg)
      }
    }
  }
}

/**
 * sec-hardcoded-secrets: API keys, tokens, passwords in source.
 */
function checkHardcodedSecrets(filePath, lines, relPath) {
  // Skip .env files, config that references process.env
  const secretPatterns = [
    { re: /(['"`])(?:sk|pk)[-_](?:live|test)[-_][a-zA-Z0-9]{20,}\1/, msg: 'Possible hardcoded API key' },
    { re: /(['"`])eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\1/, msg: 'Possible hardcoded JWT token' },
    { re: /(?:password|passwd|secret|api_key|apikey|api_secret)\s*[:=]\s*(['"`])[^'"`\n]{8,}\1/i, msg: 'Possible hardcoded secret/password' },
  ]

  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    const line = lines[i]
    // Skip process.env references
    if (line.includes('process.env')) continue
    // Skip .env.example / .env.local.example
    if (relPath.includes('.env')) continue

    for (const { re, msg } of secretPatterns) {
      if (re.test(line)) {
        addFinding('sec-hardcoded-secrets', 'CRITICAL', filePath, i + 1, msg)
      }
    }
  }
}

/**
 * sec-missing-headers: Check next.config.ts for security headers.
 */
async function checkMissingHeaders() {
  const configPath = join(ROOT, 'next.config.ts')
  if (!(await fileExists(configPath))) return

  const content = await readFile(configPath, 'utf-8')
  if (!content.includes('headers()') && !content.includes('headers:')) {
    addFinding('sec-missing-headers', 'WARNING', configPath, null,
      'Missing headers() in next.config — add security headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy)')
  }
}

/**
 * sec-cookie-flags: document.cookie= without Secure/SameSite.
 */
function checkCookieFlags(filePath, lines) {
  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    const line = lines[i]
    if (/document\.cookie\s*=/.test(line)) {
      // Skip cookie deletion (max-age=0 or expires=Thu, 01 Jan 1970)
      if (/max-age\s*=\s*0/i.test(line) || /expires\s*=\s*Thu/i.test(line)) continue

      // Check both inline flags and template literal variables (e.g. ${secure})
      const context5 = lines.slice(Math.max(0, i - 5), i + 5).join('\n')
      const hasSecure = /;\s*[Ss]ecure/.test(line) || /\$\{.*[Ss]ecure.*\}/.test(line) || /[Ss]ecure/.test(context5) && /\$\{/.test(line)
      const hasSameSite = /;\s*[Ss]ame[Ss]ite\s*=/.test(line) || /SameSite/.test(line)
      if (!hasSecure || !hasSameSite) {
        const missing = []
        if (!hasSecure) missing.push('Secure')
        if (!hasSameSite) missing.push('SameSite')
        addFinding('sec-cookie-flags', 'WARNING', filePath, i + 1,
          `Cookie set without ${missing.join(', ')} flag(s)`)
      }
    }
  }
}

/**
 * sec-open-redirect: window.location.href = <dynamic>.
 */
function checkOpenRedirect(filePath, lines) {
  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    const line = lines[i]
    const match = line.match(/window\.location(?:\.href)?\s*=\s*(.+)/)
    if (match) {
      const value = match[1].trim()
      // Skip static string paths starting with /
      if (/^['"`]\/[a-zA-Z]/.test(value)) continue
      // Skip empty string
      if (/^['"`]['"`]/.test(value)) continue
      // Skip if guarded by isSafeRedirectUrl within 5 lines above
      const lookback = lines.slice(Math.max(0, i - 5), i + 1).join('\n')
      if (/isSafeRedirectUrl/.test(lookback)) continue
      addFinding('sec-open-redirect', 'WARNING', filePath, i + 1,
        'Dynamic redirect — validate the URL domain to prevent open redirect')
    }
  }
}

/**
 * sec-console-prod: Direct console.* usage (should use logger).
 */
function checkConsoleProd(filePath, lines, relPath) {
  // Skip the logger itself and config files
  const skipFiles = ['lib/utils/logger.ts', 'next.config.ts', 'eslint.config.mjs', 'proxy.ts']
  if (skipFiles.some(f => relPath.endsWith(f))) return
  // Skip scripts/
  if (relPath.startsWith('scripts/') || relPath.startsWith('scripts\\')) return

  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    if (/\bconsole\.(log|warn|error|info|debug)\s*\(/.test(lines[i])) {
      addFinding('sec-console-prod', 'INFO', filePath, i + 1,
        'Direct console.* usage — prefer logger utility for production code')
    }
  }
}

/**
 * sec-csrf: Check if API client has CSRF protection.
 */
async function checkCsrf() {
  const apiClientPath = join(ROOT, 'lib', 'api-client.ts')
  if (!(await fileExists(apiClientPath))) return

  const content = await readFile(apiClientPath, 'utf-8')
  const hasCsrf = /csrf|xsrf|x-csrf|x-xsrf/i.test(content)
  if (!hasCsrf) {
    addFinding('sec-csrf', 'INFO', apiClientPath, null,
      'API client has no CSRF/XSRF token handling — consider adding if using cookie-based auth')
  }
}

// ─── Next.js Best Practice Rules ────────────────────────────────────────────

/**
 * nx-native-img: <img instead of next/image.
 */
function checkNativeImg(filePath, lines, relPath) {
  // Skip CoinImg.jsx — needs onError chain with native img
  if (basename(relPath) === 'CoinImg.jsx') return

  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    // Match <img but not <Image (Next.js) or inside a string
    if (/<img\s/i.test(lines[i]) && !/<Image\s/.test(lines[i])) {
      addFinding('nx-native-img', 'WARNING', filePath, i + 1,
        'Native <img> tag — consider using next/image for optimization')
    }
  }
}

/**
 * nx-missing-error: Route groups without error.tsx.
 */
async function checkMissingError() {
  const groups = await getRouteGroups()
  for (const group of groups) {
    const hasError = (await fileExists(join(group.path, 'error.tsx'))) ||
                     (await fileExists(join(group.path, 'error.jsx')))
    if (!hasError) {
      addFinding('nx-missing-error', 'WARNING', group.path, null,
        `Route group ${group.name} missing error.tsx — add error boundary`)
    }
  }
}

/**
 * nx-missing-metadata: Public pages without metadata export.
 * Checks both the page file itself and sibling layout files.
 */
async function checkMissingMetadata() {
  const publicPages = [
    'app/(public)/landing/page.tsx',
    'app/(public)/landing/page.jsx',
    'app/(public)/pay/[id]/page.jsx',
    'app/(public)/pay/[id]/page.tsx',
    'app/(public)/pay-select/[code]/page.jsx',
    'app/(public)/pay-select/[code]/page.tsx',
    'app/(auth)/login/page.tsx',
    'app/(auth)/login/page.jsx',
    'app/(auth)/register/page.tsx',
    'app/(auth)/register/page.jsx',
  ]

  const metadataRe = /export\s+(const|async\s+function)\s+(metadata|generateMetadata)/

  for (const pagePath of publicPages) {
    const fullPath = join(ROOT, pagePath)
    if (!(await fileExists(fullPath))) continue

    // Check page file itself
    const content = await readFile(fullPath, 'utf-8')
    if (metadataRe.test(content)) continue

    // Check sibling layout files
    const dir = dirname(fullPath)
    let foundInLayout = false
    for (const ext of ['tsx', 'jsx', 'ts', 'js']) {
      const layoutPath = join(dir, `layout.${ext}`)
      if (await fileExists(layoutPath)) {
        const layoutContent = await readFile(layoutPath, 'utf-8')
        if (metadataRe.test(layoutContent)) {
          foundInLayout = true
          break
        }
      }
    }
    if (foundInLayout) continue

    addFinding('nx-missing-metadata', 'WARNING', fullPath, null,
      'Public page without metadata export — add metadata or generateMetadata for SEO')
  }
}

/**
 * nx-missing-seo: Check for robots.txt and sitemap.xml.
 */
async function checkMissingSeo() {
  const checks = [
    { file: 'robots.txt', locations: ['public/robots.txt', 'app/robots.ts', 'app/robots.txt'] },
    { file: 'sitemap.xml', locations: ['public/sitemap.xml', 'app/sitemap.ts', 'app/sitemap.xml'] },
  ]

  for (const check of checks) {
    let found = false
    for (const loc of check.locations) {
      if (await fileExists(join(ROOT, loc))) {
        found = true
        break
      }
    }
    if (!found) {
      addFinding('nx-missing-seo', 'WARNING', null, null,
        `Missing ${check.file} — add to public/ or app/ for SEO`)
    }
  }
}

/**
 * nx-missing-loading: Route groups without loading.tsx.
 */
async function checkMissingLoading() {
  const groups = await getRouteGroups()
  for (const group of groups) {
    const hasLoading = (await fileExists(join(group.path, 'loading.tsx'))) ||
                       (await fileExists(join(group.path, 'loading.jsx')))
    if (!hasLoading) {
      addFinding('nx-missing-loading', 'INFO', group.path, null,
        `Route group ${group.name} missing loading.tsx — add for better UX`)
    }
  }
}

/**
 * nx-thin-wrapper: Page with 'use client' + < 15 lines + no hooks.
 */
function checkThinWrapper(filePath, lines, relPath) {
  // Only check page files
  if (!basename(relPath).startsWith('page.')) return

  const nonEmptyLines = lines.filter(l => l.trim().length > 0)
  if (nonEmptyLines.length > 15) return

  const content = lines.join('\n')
  if (!content.includes("'use client'") && !content.includes('"use client"')) return

  // Check for hook usage
  const hasHooks = /\buse[A-Z]\w+\s*\(/.test(content)
  if (hasHooks) return

  addFinding('nx-thin-wrapper', 'INFO', filePath, 1,
    "'use client' page with < 15 lines and no hooks — may not need client directive")
}

/**
 * nx-router-push: router.push('/static') that could be <Link>.
 */
function checkRouterPush(filePath, lines) {
  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    const match = lines[i].match(/router\.push\(\s*(['"`])(\/[^'"`\n]+)\1\s*\)/)
    if (match) {
      // Check context — skip if inside a submit handler, try/catch, or after await
      const prevLines = lines.slice(Math.max(0, i - 5), i).join('\n')
      const isPostAction = /\bawait\b|\bsubmit\b|\btry\b|\bcatch\b|\b\.then\b|toast\.|\.post\(|\.put\(|\.delete\(|\.patch\(|apiFetch/.test(prevLines)
      if (isPostAction) continue

      addFinding('nx-router-push', 'INFO', filePath, i + 1,
        `router.push('${match[2]}') for navigation — consider using <Link> for better prefetching`)
    }
  }
}

/**
 * nx-any-type: Usage of 'any' type in .ts/.tsx files.
 */
function checkAnyType(filePath, lines, relPath) {
  const ext = extname(relPath)
  if (ext !== '.ts' && ext !== '.tsx') return

  const patterns = [
    { re: /:\s*any\b/, msg: "': any' type annotation" },
    { re: /\bas\s+any\b/, msg: "'as any' type assertion" },
    { re: /<any>/, msg: "'<any>' type parameter" },
  ]

  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    for (const { re, msg } of patterns) {
      if (re.test(lines[i])) {
        addFinding('nx-any-type', 'INFO', filePath, i + 1,
          `${msg} — prefer specific types`)
        break // One finding per line
      }
    }
  }
}

/**
 * nx-mixed-ext: Report once if project has both .jsx and .tsx.
 */
let jsxCount = 0
let tsxCount = 0

function trackExtension(relPath) {
  const ext = extname(relPath)
  if (ext === '.jsx') jsxCount++
  if (ext === '.tsx') tsxCount++
}

function reportMixedExtensions() {
  if (jsxCount > 0 && tsxCount > 0) {
    addFinding('nx-mixed-ext', 'INFO', null, null,
      `Project has ${jsxCount} .jsx and ${tsxCount} .tsx files — consider standardizing to .tsx`)
  }
}

/**
 * nx-useeffect-fetch: useEffect with async fetch in page files.
 */
function checkUseEffectFetch(filePath, lines, relPath) {
  // Only check page files
  if (!basename(relPath).startsWith('page.')) return

  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    if (/\buseEffect\s*\(/.test(lines[i])) {
      // Look ahead 10 lines for fetch/api calls
      const effectBody = lines.slice(i, Math.min(lines.length, i + 15)).join('\n')
      if (/\bawait\b.*\b(fetch|apiFetch|get|post)\b|\b(fetch|apiFetch|get|post)\b.*\bthen\b/i.test(effectBody)) {
        addFinding('nx-useeffect-fetch', 'INFO', filePath, i + 1,
          'useEffect with data fetching in page — consider server-side data loading')
      }
    }
  }
}

// ─── Structure & RSC Boundary Rules ─────────────────────────────────────────

/**
 * nx-client-layout: 'use client' in layout files (except root) — forces all children to be client.
 */
function checkClientLayout(filePath, lines, relPath) {
  if (!basename(relPath).startsWith('layout.')) return
  // Skip root layout — has its own rule
  if (relPath === 'app/layout.tsx' || relPath === 'app/layout.jsx') return
  // Skip (dashboard) layout — legitimately needs 'use client' (useState, useEffect, useRouter, localStorage, Pusher)
  if (relPath.includes('(dashboard)')) return

  const firstNonEmpty = lines.find(l => l.trim().length > 0)
  if (firstNonEmpty && /^['"]use client['"]/.test(firstNonEmpty.trim())) {
    addFinding('nx-client-layout', 'WARNING', filePath, 1,
      "'use client' in layout — forces all children to be client components")
  }
}

/**
 * nx-root-layout-client: Root app/layout.tsx must not have 'use client' — guard regression.
 */
async function checkRootLayoutClient() {
  for (const ext of ['tsx', 'jsx']) {
    const layoutPath = join(APP_DIR, `layout.${ext}`)
    if (!(await fileExists(layoutPath))) continue

    const lines = await readFileLines(layoutPath)
    const firstNonEmpty = lines.find(l => l.trim().length > 0)
    if (firstNonEmpty && /^['"]use client['"]/.test(firstNonEmpty.trim())) {
      addFinding('nx-root-layout-client', 'CRITICAL', layoutPath, 1,
        "Root layout has 'use client' — breaks SSR for entire app")
    }
    break
  }
}

/**
 * nx-missing-notfound: Route groups without not-found.tsx.
 */
async function checkMissingNotFound() {
  const groups = await getRouteGroups()
  for (const group of groups) {
    const hasNotFound = (await fileExists(join(group.path, 'not-found.tsx'))) ||
                        (await fileExists(join(group.path, 'not-found.jsx')))
    if (!hasNotFound) {
      addFinding('nx-missing-notfound', 'WARNING', group.path, null,
        `Route group ${group.name} missing not-found.tsx — add custom 404 page`)
    }
  }
}

/**
 * nx-unnecessary-client: Page has 'use client' but no hooks or event handlers — may be server component.
 */
function checkUnnecessaryClient(filePath, lines, relPath) {
  if (!basename(relPath).startsWith('page.')) return

  const content = lines.join('\n')
  if (!content.includes("'use client'") && !content.includes('"use client"')) return

  const hasHooks = /\buse[A-Z]\w+\s*\(/.test(content)
  const hasEventHandler = /\bon[A-Z]\w+\s*=/.test(content)
  const hasRef = /\bref\s*=/.test(content)
  const hasState = /\buseState\b|\buseReducer\b/.test(content)
  const hasBrowserApi = /\bwindow\b|\bdocument\b|\bnavigator\b|\blocalStorage\b|\bsessionStorage\b/.test(content)

  if (!hasHooks && !hasEventHandler && !hasRef && !hasState && !hasBrowserApi) {
    addFinding('nx-unnecessary-client', 'INFO', filePath, 1,
      "'use client' page has no hooks/event handlers — could be a server component")
  }
}

// ─── Performance & Optimization Rules ───────────────────────────────────────

/**
 * Track next/font usage during file scan.
 */
function trackNextFont(lines) {
  if (usesNextFont) return
  const content = lines.join('\n')
  if (/from\s+['"]next\/font/.test(content)) {
    usesNextFont = true
  }
}

/**
 * nx-missing-font: Using <link> Google Fonts instead of next/font/google.
 */
async function checkMissingFont() {
  // If project already uses next/font somewhere, skip (font is only loaded once in root layout)
  if (usesNextFont) return

  for (const ext of ['tsx', 'jsx']) {
    const layoutPath = join(APP_DIR, `layout.${ext}`)
    if (!(await fileExists(layoutPath))) continue

    const content = await readFile(layoutPath, 'utf-8')
    if (/href\s*=\s*['"][^'"]*fonts\.googleapis\.com/.test(content)) {
      addFinding('nx-missing-font', 'WARNING', layoutPath, null,
        '<link> to Google Fonts — use next/font/google for better performance & no layout shift')
    }
    break
  }
}

/**
 * nx-heavy-page-import: Page imports heavy library directly without next/dynamic.
 */
function checkHeavyPageImport(filePath, lines, relPath) {
  if (!basename(relPath).startsWith('page.')) return

  const content = lines.join('\n')
  // If page uses next/dynamic, it's likely wrapping heavy imports
  if (/from\s+['"]next\/dynamic['"]/.test(content)) return

  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    for (const { re, name } of HEAVY_LIBRARIES) {
      if (re.test(lines[i])) {
        addFinding('nx-heavy-page-import', 'INFO', filePath, i + 1,
          `Page imports heavy library '${name}' directly — consider next/dynamic for code splitting`)
      }
    }
  }
}

/**
 * nx-large-page: Page > 400 non-empty lines — should extract components.
 */
function checkLargePage(filePath, lines, relPath) {
  if (!basename(relPath).startsWith('page.')) return

  const nonEmptyCount = lines.filter(l => l.trim().length > 0).length
  if (nonEmptyCount > LARGE_PAGE_THRESHOLD) {
    addFinding('nx-large-page', 'INFO', filePath, null,
      `Page has ${nonEmptyCount} non-empty lines (threshold: ${LARGE_PAGE_THRESHOLD}) — consider extracting components`)
  }
}

/**
 * nx-inline-handler-list: onClick={() => in .map() — creates new function per render.
 */
function checkInlineHandlerList(filePath, lines) {
  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    const line = lines[i]

    // Must have an inline event handler: on[A-Z]...={() =>
    if (!/on[A-Z]\w*\s*=\s*\{.*=>\s*/.test(line)) continue

    // Skip simple e.preventDefault() / e.stopPropagation() patterns
    if (/on\w+\s*=\s*\{\s*\(e\)\s*=>\s*e\.(preventDefault|stopPropagation)\(\)\s*\}/.test(line)) continue

    // Check context: is this inside a .map()? Look back 15 lines
    const prevLines = lines.slice(Math.max(0, i - 15), i + 1).join('\n')
    if (/\.map\s*\(/.test(prevLines)) {
      addFinding('nx-inline-handler-list', 'INFO', filePath, i + 1,
        'Inline arrow handler inside .map() — creates new function each render, consider useCallback or extract handler')
    }
  }
}

/**
 * nx-index-key: key={i} / key={index} in .map() — should use stable ID.
 */
function checkIndexKey(filePath, lines) {
  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue

    if (/\bkey\s*=\s*\{\s*(i|idx|index)\s*\}/.test(lines[i])) {
      // Verify .map() context — look back 15 lines
      const prevLines = lines.slice(Math.max(0, i - 15), i + 1).join('\n')
      if (/\.map\s*\(/.test(prevLines)) {
        addFinding('nx-index-key', 'INFO', filePath, i + 1,
          'Array index used as key in .map() — use a stable unique ID for better reconciliation')
      }
    }
  }
}

// ─── SEO & Hydration Rules ──────────────────────────────────────────────────

/**
 * nx-session-storage: localStorage/sessionStorage.getItem outside useEffect — hydration mismatch.
 */
function checkSessionStorage(filePath, lines) {
  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    const line = lines[i]

    if (!/\b(localStorage|sessionStorage)\.getItem\s*\(/.test(line)) continue

    // Check if we're inside useEffect, event handler, or function body
    const lookback = lines.slice(Math.max(0, i - 40), i).join('\n')
    const isInUseEffect = /\buseEffect\s*\(/.test(lookback)
    const isInEventHandler = /\bon[A-Z]\w*\s*=\s*\{/.test(lookback)
    const isInFunction = /\bfunction\s+\w+\s*\(/.test(lookback) && !/^(export\s+)?(default\s+)?function\s+\w+/.test(lookback)
    const isInCallback = /\buseCallback\s*\(/.test(lookback)

    if (!isInUseEffect && !isInEventHandler && !isInFunction && !isInCallback) {
      addFinding('nx-session-storage', 'WARNING', filePath, i + 1,
        'localStorage/sessionStorage.getItem outside useEffect — causes hydration mismatch')
    }
  }
}

/**
 * nx-prop-count: Component receives > 12 props — should consolidate.
 */
function checkPropCount(filePath, lines) {
  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    const line = lines[i]

    // Match PascalCase function/const with destructured params: function MyComp({ a, b, c, ... })
    // or const MyComp = ({ a, b, c, ... }) =>
    const funcMatch = line.match(/(?:function|const)\s+([A-Z]\w+)\s*(?:=\s*)?\(\s*\{/)
    if (!funcMatch) continue

    // Collect the destructured params — may span multiple lines
    let braceContent = ''
    let braceDepth = 0
    let found = false
    for (let j = i; j < Math.min(lines.length, i + 20); j++) {
      for (const ch of lines[j]) {
        if (ch === '{') braceDepth++
        else if (ch === '}') {
          braceDepth--
          if (braceDepth === 0) { found = true; break }
        }
        if (braceDepth === 1 && ch !== '{') braceContent += ch
      }
      if (found) break
    }

    if (!found) continue

    // Count props — split by comma, filter empties
    const props = braceContent.split(',').map(p => p.trim()).filter(p => p.length > 0 && !p.startsWith('//'))
    if (props.length > PROP_COUNT_THRESHOLD) {
      addFinding('nx-prop-count', 'INFO', filePath, i + 1,
        `Component ${funcMatch[1]} has ${props.length} props (threshold: ${PROP_COUNT_THRESHOLD}) — consider consolidating into an object prop`)
    }
  }
}

/**
 * nx-barrel-reexport: Barrel index.ts with `as` rename — naming conflict signal.
 */
function checkBarrelReexport(filePath, lines, relPath) {
  if (basename(relPath) !== 'index.ts' && basename(relPath) !== 'index.tsx' &&
      basename(relPath) !== 'index.js' && basename(relPath) !== 'index.jsx') return

  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    if (/export\s+\{[^}]*\bas\b[^}]*\}\s+from/.test(lines[i])) {
      addFinding('nx-barrel-reexport', 'INFO', filePath, i + 1,
        'Barrel re-export with `as` rename — may indicate naming conflict, consider renaming at source')
    }
  }
}

// ─── Additional Rules (Next.js App Router & Security) ────────────────────

/**
 * sec-target-blank: target="_blank" without rel="noopener noreferrer".
 */
function checkTargetBlank(filePath, lines) {
  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    const line = lines[i]
    if (/target\s*=\s*['"]_blank['"]/.test(line)) {
      // Check same line and next 2 lines for rel="noopener"
      const context = lines.slice(i, Math.min(lines.length, i + 3)).join(' ')
      if (!/rel\s*=\s*['"][^'"]*noopener/.test(context)) {
        addFinding('sec-target-blank', 'INFO', filePath, i + 1,
          'target="_blank" without rel="noopener noreferrer" — tabnabbing risk')
      }
    }
  }
}

/**
 * sec-env-exposed: Server-only env vars (non-NEXT_PUBLIC_) in 'use client' files.
 */
function checkEnvExposed(filePath, lines) {
  const content = lines.join('\n')
  if (!content.includes("'use client'") && !content.includes('"use client"')) return

  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    const match = lines[i].match(/process\.env\.([A-Z_][A-Z0-9_]*)/)
    if (match && !match[1].startsWith('NEXT_PUBLIC_') && match[1] !== 'NODE_ENV') {
      addFinding('sec-env-exposed', 'WARNING', filePath, i + 1,
        `Server-only env var process.env.${match[1]} in 'use client' file — undefined in browser, use NEXT_PUBLIC_ prefix`)
    }
  }
}

/**
 * nx-native-anchor: <a href="/..."> internal links that should use next/link.
 */
function checkNativeAnchor(filePath, lines) {
  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    const line = lines[i]
    if (/<a\s[^>]*href\s*=\s*['"]\/[a-zA-Z]/.test(line)) {
      // Skip if has onClick handler (intentional behavior)
      if (/onClick/.test(line)) continue
      // Skip if has target="_blank"
      if (/target\s*=\s*['"]_blank/.test(line)) continue
      addFinding('nx-native-anchor', 'INFO', filePath, i + 1,
        'Native <a> with internal href — use next/link <Link> for client-side navigation & prefetching')
    }
  }
}

/**
 * nx-pages-router-api: Pages Router APIs used in App Router project.
 */
function checkPagesRouterApi(filePath, lines) {
  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    const line = lines[i]
    if (/from\s+['"]next\/router['"]/.test(line)) {
      addFinding('nx-pages-router-api', 'WARNING', filePath, i + 1,
        "Import from 'next/router' — use 'next/navigation' in App Router")
    }
    if (/export\s+(async\s+)?function\s+(getServerSideProps|getStaticProps|getStaticPaths)\b/.test(line)) {
      const fn = line.match(/(getServerSideProps|getStaticProps|getStaticPaths)/)[1]
      addFinding('nx-pages-router-api', 'WARNING', filePath, i + 1,
        `${fn} is a Pages Router API — use App Router data fetching patterns`)
    }
  }
}

/**
 * nx-searchparams-suspense: useSearchParams() without Suspense boundary.
 */
function checkSearchParamsSuspense(filePath, lines) {
  const content = lines.join('\n')
  if (!/\buseSearchParams\s*\(/.test(content)) return
  if (/\bSuspense\b/.test(content)) return

  for (let i = 0; i < lines.length; i++) {
    if (/\buseSearchParams\s*\(/.test(lines[i])) {
      addFinding('nx-searchparams-suspense', 'WARNING', filePath, i + 1,
        'useSearchParams() without Suspense boundary — causes hydration errors in production')
      break
    }
  }
}

/**
 * nx-missing-alt: <img> or <Image> without alt attribute.
 */
function checkMissingAlt(filePath, lines) {
  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    if (/<(?:img|Image)\s/.test(lines[i])) {
      const context = lines.slice(i, Math.min(lines.length, i + 4)).join(' ')
      const tagMatch = context.match(/<(?:img|Image)\s[^>]*\/?>/)
      if (tagMatch && !/\balt\s*=/.test(tagMatch[0])) {
        addFinding('nx-missing-alt', 'INFO', filePath, i + 1,
          '<img>/<Image> without alt attribute — required for accessibility')
      }
    }
  }
}

/**
 * nx-error-client: error.tsx/jsx must have 'use client' directive.
 */
function checkErrorClient(filePath, lines, relPath) {
  const name = basename(relPath)
  if (name !== 'error.tsx' && name !== 'error.jsx') return

  const firstNonEmpty = lines.find(l => l.trim().length > 0)
  if (!firstNonEmpty || !/^['"]use client['"]/.test(firstNonEmpty.trim())) {
    addFinding('nx-error-client', 'CRITICAL', filePath, 1,
      "error.tsx must have 'use client' — Next.js requires error boundaries to be client components")
  }
}

/**
 * nx-large-client: 'use client' non-page file > LARGE_CLIENT_THRESHOLD lines.
 */
function checkLargeClient(filePath, lines, relPath) {
  // Skip page files — covered by nx-large-page
  if (basename(relPath).startsWith('page.')) return

  const content = lines.join('\n')
  if (!content.includes("'use client'") && !content.includes('"use client"')) return

  const nonEmptyCount = lines.filter(l => l.trim().length > 0).length
  if (nonEmptyCount > LARGE_CLIENT_THRESHOLD) {
    addFinding('nx-large-client', 'INFO', filePath, null,
      `Client component has ${nonEmptyCount} non-empty lines (threshold: ${LARGE_CLIENT_THRESHOLD}) — consider splitting server/client parts`)
  }
}

/**
 * nx-sequential-await: 3+ sequential await statements that could use Promise.all.
 */
function checkSequentialAwait(filePath, lines) {
  let consecutive = 0
  let startLine = 0

  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    const trimmed = lines[i].trim()
    if (trimmed.length === 0) continue

    if (/^(?:const|let|var)\s.*=\s*await\b/.test(trimmed) || /^await\b/.test(trimmed)) {
      if (consecutive === 0) startLine = i
      consecutive++
    } else {
      if (consecutive >= 3) {
        addFinding('nx-sequential-await', 'INFO', filePath, startLine + 1,
          `${consecutive} sequential await statements — consider Promise.all() for independent calls`)
      }
      consecutive = 0
    }
  }
  if (consecutive >= 3) {
    addFinding('nx-sequential-await', 'INFO', filePath, startLine + 1,
      `${consecutive} sequential await statements — consider Promise.all() for independent calls`)
  }
}

/**
 * nx-hardcoded-localhost: Hardcoded localhost/127.0.0.1 URLs in source code.
 */
function checkHardcodedLocalhost(filePath, lines, relPath) {
  // Skip config files that legitimately define defaults
  const skipFiles = ['next.config.ts', 'next.config.js', 'next.config.mjs', 'lib/api-client.ts', 'lib/constants.ts']
  if (skipFiles.some(f => relPath.endsWith(f))) return

  for (let i = 0; i < lines.length; i++) {
    if (isCommentLine(lines[i])) continue
    // Skip lines with process.env (likely fallback/default)
    if (/process\.env/.test(lines[i])) continue
    if (/['"`]https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(lines[i])) {
      addFinding('nx-hardcoded-localhost', 'WARNING', filePath, i + 1,
        'Hardcoded localhost URL — use environment variable instead')
    }
  }
}

// ─── Runner ─────────────────────────────────────────────────────────────────

async function runFileRules(filePath) {
  const relPath = rel(filePath)
  const lines = await readFileLines(filePath)

  trackExtension(relPath)

  // Security rules
  checkDangerousHtml(filePath, lines, relPath)
  checkEval(filePath, lines)
  checkHardcodedSecrets(filePath, lines, relPath)
  checkCookieFlags(filePath, lines)
  checkOpenRedirect(filePath, lines)
  checkConsoleProd(filePath, lines, relPath)

  // Next.js rules
  checkNativeImg(filePath, lines, relPath)
  checkThinWrapper(filePath, lines, relPath)
  checkRouterPush(filePath, lines)
  checkAnyType(filePath, lines, relPath)
  checkUseEffectFetch(filePath, lines, relPath)

  // Structure & RSC boundary rules
  checkClientLayout(filePath, lines, relPath)
  checkUnnecessaryClient(filePath, lines, relPath)

  // Performance & optimization rules
  trackNextFont(lines)
  checkHeavyPageImport(filePath, lines, relPath)
  checkLargePage(filePath, lines, relPath)
  checkInlineHandlerList(filePath, lines)
  checkIndexKey(filePath, lines)

  // SEO & hydration rules
  checkSessionStorage(filePath, lines)
  checkPropCount(filePath, lines)
  checkBarrelReexport(filePath, lines, relPath)

  // Additional rules (Next.js App Router & security)
  checkTargetBlank(filePath, lines)
  checkEnvExposed(filePath, lines)
  checkNativeAnchor(filePath, lines)
  checkPagesRouterApi(filePath, lines)
  checkSearchParamsSuspense(filePath, lines)
  checkMissingAlt(filePath, lines)
  checkErrorClient(filePath, lines, relPath)
  checkLargeClient(filePath, lines, relPath)
  checkSequentialAwait(filePath, lines)
  checkHardcodedLocalhost(filePath, lines, relPath)
}

async function runProjectRules() {
  await Promise.all([
    checkMissingHeaders(),
    checkCsrf(),
    checkMissingError(),
    checkMissingMetadata(),
    checkMissingSeo(),
    checkMissingLoading(),
    checkRootLayoutClient(),
    checkMissingNotFound(),
    checkMissingFont(),
  ])
}

// ─── Reporter ───────────────────────────────────────────────────────────────

function formatFinding(f) {
  const loc = f.file
    ? f.line ? `${f.file}:${f.line}` : f.file
    : '(project-level)'
  return `  ${C.dim}[${f.ruleId}]${C.reset} ${C.white}${loc}${C.reset}\n    ${f.message}`
}

function printReport() {
  const grouped = { CRITICAL: [], WARNING: [], INFO: [] }

  for (const f of findings) {
    grouped[f.severity].push(f)
  }

  // Sort within each group by file, then line
  for (const sev of Object.keys(grouped)) {
    grouped[sev].sort((a, b) => {
      const fileA = a.file || ''
      const fileB = b.file || ''
      if (fileA !== fileB) return fileA.localeCompare(fileB)
      return (a.line || 0) - (b.line || 0)
    })
  }

  const total = findings.length
  const counts = {
    CRITICAL: grouped.CRITICAL.length,
    WARNING: grouped.WARNING.length,
    INFO: grouped.INFO.length,
  }

  console.log()
  console.log(`${C.bold}${'='.repeat(56)}${C.reset}`)
  console.log(`${C.bold} BULL PAY — Next.js Security & Best Practices Check${C.reset}`)
  console.log(`${C.bold}${'='.repeat(56)}${C.reset}`)
  console.log()

  if (grouped.CRITICAL.length > 0) {
    console.log(`${C.red}${C.bold}── CRITICAL ${'─'.repeat(44)}${C.reset}`)
    console.log()
    for (const f of grouped.CRITICAL) {
      console.log(formatFinding(f))
      console.log()
    }
  }

  if (grouped.WARNING.length > 0) {
    console.log(`${C.yellow}${C.bold}── WARNING ${'─'.repeat(45)}${C.reset}`)
    console.log()
    for (const f of grouped.WARNING) {
      console.log(formatFinding(f))
      console.log()
    }
  }

  if (grouped.INFO.length > 0) {
    console.log(`${C.cyan}${C.bold}── INFO ${'─'.repeat(48)}${C.reset}`)
    if (VERBOSE) {
      console.log()
      for (const f of grouped.INFO) {
        console.log(formatFinding(f))
        console.log()
      }
    } else {
      console.log(`  ${C.dim}${grouped.INFO.length} findings (use --verbose to show)${C.reset}`)
      console.log()
    }
  }

  if (total === 0) {
    console.log(`${C.green}${C.bold}  No findings — all checks passed!${C.reset}`)
    console.log()
  }

  console.log(`${C.bold}${'='.repeat(56)}${C.reset}`)
  const critColor = counts.CRITICAL > 0 ? C.red : C.green
  const warnColor = counts.WARNING > 0 ? C.yellow : C.green
  console.log(
    `${C.bold} Summary: ` +
    `${critColor}${counts.CRITICAL} CRITICAL${C.reset}${C.bold}, ` +
    `${warnColor}${counts.WARNING} WARNING${C.reset}${C.bold}, ` +
    `${C.cyan}${counts.INFO} INFO${C.reset}`
  )
  console.log(`${C.bold}${'='.repeat(56)}${C.reset}`)
  console.log()

  return counts.CRITICAL > 0 ? 1 : 0
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  let fileCount = 0

  // Scan all project files
  for await (const filePath of walkDir(ROOT)) {
    await runFileRules(filePath)
    fileCount++
  }

  // Project-level rules
  await runProjectRules()

  // Report mixed extensions once
  reportMixedExtensions()

  const exitCode = printReport()

  console.log(`${C.dim}  Scanned ${fileCount} files${C.reset}`)
  console.log()

  process.exit(exitCode)
}

main().catch((err) => {
  console.error('check-nextjs.mjs failed:', err)
  process.exit(2)
})
