#!/usr/bin/env node

/**
 * Bull Pay — UI Pattern Lint
 *
 * Scans JSX/TSX files for CSS anti-patterns, Bootstrap remnants,
 * and component misuse. Catches issues that would otherwise require
 * manual audit passes.
 *
 * Usage:
 *   node scripts/ui-lint.mjs              # normal
 *   node scripts/ui-lint.mjs --verbose    # show context for each finding
 *   node scripts/ui-lint.mjs --fix-hint   # show suggested fix for each finding
 *
 * Exit code 1 if any ERROR findings, 0 otherwise.
 */

import { readdir, readFile } from 'node:fs/promises'
import { join, relative, extname } from 'node:path'

// ─── Config ─────────────────────────────────────────────────────────────────

const ROOT = process.cwd()
const VERBOSE = process.argv.includes('--verbose')
const FIX_HINT = process.argv.includes('--fix-hint')

const SCAN_DIRS = ['app', 'components', 'src/components']
const SCAN_EXTS = new Set(['.jsx', '.tsx'])

// Files/dirs to skip
const SKIP = new Set(['node_modules', '.next', 'build', 'dist', 'out', '.git'])

// ─── Severity ───────────────────────────────────────────────────────────────

const ERROR = 'error'     // blocks commit
const WARN  = 'warn'      // advisory

// ─── Rules ──────────────────────────────────────────────────────────────────

/**
 * Each rule: { id, severity, pattern (regex), message, fixHint?, exclude? }
 *
 * `pattern`  — applied per-line. Use multiline rules sparingly.
 * `exclude`  — regex: skip files matching this pattern (e.g. UI component itself).
 * `fixHint`  — shown with --fix-hint flag.
 * `context`  — function(line, allLines, idx) → bool. Extra filter beyond regex.
 */
const RULES = [

  // ── 1. Manual input group spans (must use InputGroup + InputAddon) ──────
  {
    id: 'no-manual-input-addon',
    severity: ERROR,
    pattern: /className="[^"]*flex items-center[^"]*(?:bg-surface-100|border-surface-300)[^"]*(?:rounded-[lr]-lg|text-sm)/,
    message: 'Manual input addon <span>. Use <InputGroup> + <InputAddon> or <InputIcon> instead.',
    fixHint: 'Import { InputGroup, InputAddon } from "@/components/ui" and wrap Input + Addon.',
    exclude: /components\/ui\//,
  },

  // ── 2. Non-standard close button classes ────────────────────────────────
  {
    id: 'close-btn-non-standard',
    severity: WARN,
    // Matches close buttons that have bx-x but NOT the standard class set
    pattern: /className="[^"]*(?:text-surface-400)[^"]*hover:text-surface-(?:600|700)[^"]*"/,
    message: 'Non-standard close button color. Standard: "cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none".',
    fixHint: 'Replace with: className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none"',
    // Exclude non-button contexts (icon buttons for collapse, navigation etc.)
    context: (line) => /bx.bx-x/.test(line),
  },

  // ── 3. Empty className ──────────────────────────────────────────────────
  {
    id: 'empty-classname',
    severity: WARN,
    pattern: /className=""/,
    message: 'Empty className="". Remove it.',
    fixHint: 'Delete the className="" attribute entirely.',
  },

  // ── 4. Duplicate utility classes ────────────────────────────────────────
  {
    id: 'duplicate-classes',
    severity: ERROR,
    pattern: /className="([^"]*)"/,
    message: 'Duplicate CSS classes in className.',
    context: (line, _lines, _idx, match) => {
      if (!match?.[1]) return false
      const classes = match[1].split(/\s+/).filter(Boolean)
      const seen = new Set()
      for (const cls of classes) {
        if (seen.has(cls)) return true
        seen.add(cls)
      }
      return false
    },
    fixHint: 'Remove the duplicated class(es).',
  },

  // ── 5. Bootstrap remnant classes ────────────────────────────────────────
  {
    id: 'bootstrap-class',
    severity: ERROR,
    pattern: /className="[^"]*\b(?:btn-primary|btn-secondary|btn-danger|btn-success|btn-outline|btn-close|btn-sm|btn-lg|card-body|card-header|card-footer|modal-dialog|modal-content|modal-header|modal-body|modal-footer|form-control|form-select|form-check|form-label|form-group|input-group-text|dropdown-menu|dropdown-item|dropdown-toggle|nav-tabs|nav-link|spinner-border|progress-bar|container-fluid|d-flex|d-none|d-block|fw-bold|fw-semibold|fw-normal|rounded-circle|text-muted|text-body|bg-light)\b/,
    message: 'Bootstrap class detected. Use Tailwind equivalent or UI component.',
    fixHint: 'Replace Bootstrap class with Tailwind utility or the matching UI component from @/components/ui.',
    // Ignore comments
    context: (line) => !/^\s*(\/\/|\/\*|\*)/.test(line),
  },

  // ── 6. Bootstrap spacing utilities ──────────────────────────────────────
  {
    id: 'bootstrap-spacing',
    severity: ERROR,
    pattern: /className="[^"]*\b(?:me-[0-5]|ms-[0-5]|pe-[0-5]|ps-[0-5]|mb-auto|mt-auto)\b/,
    message: 'Bootstrap spacing class (me-/ms-/pe-/ps-). Use Tailwind ml-/mr-/pl-/pr-.',
    fixHint: 'me-X → mr-X, ms-X → ml-X, pe-X → pr-X, ps-X → pl-X.',
    context: (line) => !/^\s*(\/\/|\/\*|\*)/.test(line),
  },

  // ── 7. &times; HTML entity in JSX ──────────────────────────────────────
  {
    id: 'html-times-entity',
    severity: ERROR,
    pattern: /&times;/,
    message: '&times; HTML entity. Use <i className="bx bx-x"></i> icon.',
    fixHint: 'Replace &times; (or ×) with <i className="bx bx-x"></i>.',
  },

  // ── 8. Conflicting padding/margin classes ──────────────────────────────
  {
    id: 'conflicting-spacing',
    severity: WARN,
    pattern: /className="([^"]*)"/,
    message: 'Conflicting spacing classes (e.g. p-5 p-4).',
    context: (line, _lines, _idx, match) => {
      if (!match?.[1]) return false
      const classes = match[1].split(/\s+/).filter(Boolean)
      // Group by prefix: p-, m-, px-, py-, mx-, my-, pt-, pb-, pl-, pr-, mt-, mb-, ml-, mr-
      const prefixes = {}
      for (const cls of classes) {
        const m = cls.match(/^(!?)?(p|m|px|py|mx|my|pt|pb|pl|pr|mt|mb|ml|mr)-/)
        if (m) {
          const key = (m[1] || '') + m[2]
          if (prefixes[key]) return true // duplicate prefix = conflict
          prefixes[key] = cls
        }
      }
      return false
    },
    fixHint: 'Keep only one spacing class per direction (e.g. p-5 p-4 → p-4).',
  },

  // ── 9. High z-index values (Bootstrap era) ─────────────────────────────
  {
    id: 'high-z-index',
    severity: WARN,
    pattern: /z-index:\s*(\d{4,})/,
    message: 'Very high z-index (≥1000). Use Tailwind z-scale: z-10 to z-50.',
    fixHint: 'sidebar=40, navbar=9, mobile-backdrop=45, modal=50.',
    exclude: /node_modules/,
  },

  // ── 10. Missing cursor-pointer on interactive close buttons ────────────
  {
    id: 'close-btn-no-cursor',
    severity: WARN,
    pattern: /<button[^>]*className="(?!.*cursor-pointer)[^"]*"[^>]*>[\s\S]*?bx-x/,
    message: 'Close button missing cursor-pointer class.',
    fixHint: 'Add cursor-pointer to the button className.',
    exclude: /components\/ui\//,
  },

  // ── 11. Bare <hr /> without styling ────────────────────────────────────
  {
    id: 'bare-hr',
    severity: WARN,
    pattern: /<hr\s*\/?>/,
    message: 'Bare <hr /> without Tailwind classes. Add border-surface-200 etc.',
    fixHint: '<hr className="border-surface-200 my-4" />',
  },

  // ── 12. rounded-full missing space before { (template literal bug) ────
  {
    id: 'rounded-full-space',
    severity: ERROR,
    pattern: /rounded-full\$\{/,
    message: 'Missing space after rounded-full before ${. Results in "rounded-full..." class.',
    fixHint: 'Add space: "rounded-full ${..."',
  },

  // ── 13. Inline style with color hex (should use tokens) ────────────────
  {
    id: 'inline-style-color',
    severity: WARN,
    pattern: /style=\{\{[^}]*(?:color|background|backgroundColor)\s*:\s*['"]#[0-9a-fA-F]{3,8}['"]/,
    message: 'Inline style with hardcoded hex color. Prefer Tailwind classes or CSS variables.',
    fixHint: 'Use text-{color} or bg-{color} Tailwind class, or var(--color-*).',
    // Allow intentional uses like chart colors
    exclude: /chart|graph|landing/i,
  },

  // ── 14. Missing 'use client' in interactive components ─────────────────
  {
    id: 'missing-use-client',
    severity: WARN,
    pattern: /\b(?:useState|useEffect|useCallback|useRef|useMemo|useReducer)\b/,
    message: 'React hook used but file may be missing \'use client\' directive.',
    context: (line, allLines, idx) => {
      // Only fire once per file, on the first hook usage
      if (idx > 0) {
        for (let i = 0; i < idx; i++) {
          if (/\b(?:useState|useEffect|useCallback|useRef|useMemo|useReducer)\b/.test(allLines[i])) return false
        }
      }
      // Check if 'use client' is present anywhere in the first 5 lines
      for (let i = 0; i < Math.min(5, allLines.length); i++) {
        if (/['"]use client['"]/.test(allLines[i])) return false
      }
      return true
    },
    fixHint: "Add 'use client' at the top of the file.",
  },

  // ── 15. Direct DOM manipulation (prefer React patterns) ────────────────
  {
    id: 'direct-dom-query',
    severity: WARN,
    pattern: /document\.(?:getElementById|getElementsBy|querySelector)\b/,
    message: 'Direct DOM query. Prefer useRef or React state for DOM access.',
    fixHint: 'Use useRef() to get a reference to the DOM element instead.',
    // Allow in non-component utility files
    exclude: /(?:utils|lib|helpers|scripts)\//i,
  },

  // ── 16. Hardcoded pixel values in className (prefer Tailwind scale) ────
  {
    id: 'hardcoded-px-class',
    severity: WARN,
    pattern: /className="[^"]*\b(?:w|h|min-w|min-h|max-w|max-h|gap|space-[xy])-\[(?:\d{4,})px\]/,
    message: 'Large hardcoded pixel value in className. Consider using Tailwind scale values.',
    fixHint: 'Use Tailwind spacing scale (e.g. w-96, max-w-2xl) when possible.',
  },

  // ── 17. onclick handler with string (not function) ─────────────────────
  {
    id: 'onclick-string',
    severity: ERROR,
    pattern: /onclick="/i,
    message: 'HTML onclick="..." used. Use React onClick={handler} instead.',
    fixHint: 'Replace onclick="..." with onClick={() => ...}.',
    context: (line) => !/^\s*(\/\/|\/\*|\*)/.test(line),
  },

  // ── 18. Accessibility: img without alt ─────────────────────────────────
  {
    id: 'img-no-alt',
    severity: WARN,
    pattern: /<img\s(?:(?!alt=)[^>])*\/?>/,
    message: '<img> without alt attribute. Add alt text for accessibility.',
    fixHint: 'Add alt="description" to the <img> tag.',
    context: (line) => !/^\s*(\/\/|\/\*|\*)/.test(line),
  },

  // ── 19. Accessibility: button without type ─────────────────────────────
  {
    id: 'button-no-type',
    severity: WARN,
    pattern: /<button\s(?:(?!type=)[^>])*>/,
    message: '<button> without type attribute. Defaults to "submit" which may cause form submissions.',
    fixHint: 'Add type="button" (or "submit" if intentional).',
    context: (line) => !/^\s*(\/\/|\/\*|\*)/.test(line) && !/Button\s/.test(line),
    exclude: /components\/ui\//,
  },
]

// ─── Scanner ────────────────────────────────────────────────────────────────

async function* walkFiles(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walkFiles(full)
    } else if (SCAN_EXTS.has(extname(entry.name))) {
      yield full
    }
  }
}

async function* walkCssFiles(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walkCssFiles(full)
    } else if (extname(entry.name) === '.css') {
      yield full
    }
  }
}

async function lintFile(filePath, relPath) {
  const content = await readFile(filePath, 'utf-8')
  const lines = content.split('\n')
  const findings = []

  for (const rule of RULES) {
    // Skip excluded files
    if (rule.exclude?.test(relPath)) continue

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const match = line.match(rule.pattern)
      if (!match) continue

      // Extra context filter
      if (rule.context && !rule.context(line, lines, i, match)) continue

      findings.push({
        rule: rule.id,
        severity: rule.severity,
        file: relPath,
        line: i + 1,
        message: rule.message,
        fixHint: rule.fixHint,
        source: line.trim().substring(0, 120),
      })
    }
  }

  return findings
}

// ─── Reporter ───────────────────────────────────────────────────────────────

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
}

function printFindings(findings) {
  if (findings.length === 0) {
    console.log(`\n${COLORS.green}✓${COLORS.reset} No UI pattern issues found!\n`)
    return
  }

  // Group by file
  const byFile = {}
  for (const f of findings) {
    ;(byFile[f.file] ??= []).push(f)
  }

  console.log('')
  for (const [file, items] of Object.entries(byFile)) {
    console.log(`${COLORS.bold}${file}${COLORS.reset}`)
    for (const item of items) {
      const sev = item.severity === ERROR
        ? `${COLORS.red}error${COLORS.reset}`
        : `${COLORS.yellow}warn${COLORS.reset}`
      console.log(`  ${COLORS.dim}L${item.line}${COLORS.reset}  ${sev}  ${item.message}  ${COLORS.dim}(${item.rule})${COLORS.reset}`)
      if (VERBOSE) {
        console.log(`        ${COLORS.dim}${item.source}${COLORS.reset}`)
      }
      if (FIX_HINT && item.fixHint) {
        console.log(`        ${COLORS.cyan}Fix: ${item.fixHint}${COLORS.reset}`)
      }
    }
    console.log('')
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`${COLORS.bold}Bull Pay UI Lint${COLORS.reset} — scanning for anti-patterns...\n`)

  const allFindings = []
  let fileCount = 0

  for (const scanDir of SCAN_DIRS) {
    const absDir = join(ROOT, scanDir)
    for await (const filePath of walkFiles(absDir)) {
      fileCount++
      const relPath = relative(ROOT, filePath)
      const findings = await lintFile(filePath, relPath)
      allFindings.push(...findings)
    }
  }

  // Also scan CSS files for z-index
  let cssFileCount = 0
  const cssDir = join(ROOT, 'app')
  for await (const filePath of walkCssFiles(cssDir)) {
    cssFileCount++
    const relPath = relative(ROOT, filePath)
    const content = await readFile(filePath, 'utf-8')
    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      for (const rule of RULES) {
        if (rule.id !== 'high-z-index') continue
        const match = lines[i].match(rule.pattern)
        if (match) {
          allFindings.push({
            rule: rule.id,
            severity: rule.severity,
            file: relPath,
            line: i + 1,
            message: rule.message,
            fixHint: rule.fixHint,
            source: lines[i].trim().substring(0, 120),
          })
        }
      }
    }
  }

  console.log(`${COLORS.dim}Scanned ${fileCount} JSX/TSX files + ${cssFileCount} CSS files (${RULES.length} rules)${COLORS.reset}`)

  printFindings(allFindings)

  // Summary
  const errors = allFindings.filter((f) => f.severity === ERROR)
  const warns = allFindings.filter((f) => f.severity === WARN)

  if (allFindings.length > 0) {
    console.log(
      `${COLORS.bold}Summary:${COLORS.reset} ` +
      `${errors.length ? `${COLORS.red}${errors.length} error(s)${COLORS.reset}` : '0 errors'}, ` +
      `${warns.length ? `${COLORS.yellow}${warns.length} warning(s)${COLORS.reset}` : '0 warnings'}`
    )
    console.log(`${COLORS.dim}Run with --verbose for source context, --fix-hint for suggestions.${COLORS.reset}\n`)
  }

  process.exit(errors.length > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(2)
})
