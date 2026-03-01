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

const ROOT = process.cwd()
const APP_DIR = join(ROOT, 'app')

const EXCLUDE_DIRS = new Set([
  'node_modules', '.next', '.git', 'backup-vite', 'public', 'locales', 'scripts',
])

const SCAN_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.mts',
])

const SEVERITY_ORDER = { CRITICAL: 0, WARNING: 1, INFO: 2 }

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
}

async function runProjectRules() {
  await Promise.all([
    checkMissingHeaders(),
    checkCsrf(),
    checkMissingError(),
    checkMissingMetadata(),
    checkMissingSeo(),
    checkMissingLoading(),
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
    console.log()
    for (const f of grouped.INFO) {
      console.log(formatFinding(f))
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
