#!/usr/bin/env node

/**
 * Best Practices Checker for Bull Pay Web
 *
 * Scans src/ for common anti-patterns and project-specific conventions.
 * Run: npm run check:bp
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, basename, dirname } from 'node:path';

// ─── Configuration ───────────────────────────────────────────────────────────

const SRC_DIR = join(import.meta.dirname, '..', 'src');
const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const EXCLUDE_DIRS = new Set(['backup', 'node_modules', 'locales']);

// ─── Rule Definitions ────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   id: string,
 *   severity: 'error' | 'warn',
 *   description: string,
 *   check: (ctx: FileContext) => Issue[]
 * }} Rule
 *
 * @typedef {{
 *   filePath: string,
 *   relPath: string,
 *   content: string,
 *   lines: string[],
 *   ext: string
 * }} FileContext
 *
 * @typedef {{
 *   ruleId: string,
 *   severity: 'error' | 'warn',
 *   file: string,
 *   line?: number,
 *   message: string
 * }} Issue
 */

/** @type {Rule[]} */
const RULES = [
  // ─── Category A: React Patterns ──────────────────────────────────────────

  {
    id: 'sequential-await',
    severity: 'warn',
    description: 'Sequential awaits that could potentially run in parallel',
    check({ lines, relPath }) {
      const issues = [];
      for (let i = 1; i < lines.length; i++) {
        const prev = lines[i - 1].trim();
        const curr = lines[i].trim();
        if (
          /^(const|let|var)?\s*\w.*=\s*await\s/.test(prev) &&
          /^(const|let|var)?\s*\w.*=\s*await\s/.test(curr)
        ) {
          // Check the second await doesn't reference the first line's variable
          const prevVar = prev.match(/^(?:const|let|var)\s+(\w+)/);
          if (prevVar && curr.includes(prevVar[1])) continue; // dependent — skip

          issues.push({
            ruleId: 'sequential-await',
            severity: 'warn',
            file: relPath,
            line: i + 1,
            message: 'Sequential awaits may be parallelizable with Promise.all().',
          });
        }
      }
      return issues;
    },
  },

  {
    id: 'no-index-as-key',
    severity: 'warn',
    description: 'Array index used as key in .map() — causes bugs on reorder/filter',
    check({ lines, relPath, ext }) {
      if (ext !== '.jsx' && ext !== '.tsx') return [];
      const issues = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match key={index}, key={i}, key={idx}, key={k} inside .map() callbacks
        if (/key\s*=\s*\{(index|idx|i|k)\}/.test(line)) {
          issues.push({
            ruleId: 'no-index-as-key',
            severity: 'warn',
            file: relPath,
            line: i + 1,
            message: 'Avoid using array index as key. Use a unique identifier (e.g. item.id) instead.',
          });
        }
      }
      return issues;
    },
  },

  {
    id: 'no-async-useEffect',
    severity: 'error',
    description: 'useEffect callback must not be async — cleanup becomes a Promise',
    check({ lines, relPath, ext }) {
      if (ext !== '.jsx' && ext !== '.tsx' && ext !== '.js') return [];
      const issues = [];
      for (let i = 0; i < lines.length; i++) {
        if (/useEffect\s*\(\s*async/.test(lines[i])) {
          issues.push({
            ruleId: 'no-async-useEffect',
            severity: 'error',
            file: relPath,
            line: i + 1,
            message: 'useEffect callback cannot be async. Define an async function inside and call it.',
          });
        }
      }
      return issues;
    },
  },

  {
    id: 'no-direct-dom',
    severity: 'warn',
    description: 'Direct DOM access in React — use useRef instead',
    check({ lines, relPath, ext }) {
      if (ext !== '.jsx' && ext !== '.tsx') return [];
      // Skip entry point
      if (relPath === 'src/main.jsx' || relPath === 'src/main.tsx') return [];
      const issues = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('//') || line.startsWith('*')) continue;
        if (/document\.(getElementById|querySelector|getElementsBy|querySelectorAll)\s*\(/.test(line)) {
          // Allow Bootstrap interop: modal backdrop cleanup, tooltip init, body style reset
          if (/document\.body\./.test(line)) continue;
          if (/document\.querySelectorAll\s*\(\s*['"]\.modal-backdrop['"]/.test(line)) continue;
          if (/document\.querySelectorAll\s*\(\s*['"]\[data-bs-/.test(line)) continue;
          // Allow smooth scroll to section by id
          if (/\.scrollIntoView\s*\(/.test(line)) continue;
          issues.push({
            ruleId: 'no-direct-dom',
            severity: 'warn',
            file: relPath,
            line: i + 1,
            message: 'Avoid direct DOM access in React components. Use useRef() instead.',
          });
        }
      }
      return issues;
    },
  },

  {
    id: 'conditional-render-zero',
    severity: 'warn',
    description: '{count && <JSX>} can render 0 or NaN instead of nothing',
    check({ lines, relPath }) {
      const issues = [];
      // Common string variable names that won't be 0/NaN — skip these
      const STRING_NAMES =
        /^(description|title|name|label|message|error|text|content|value|type|status|role|email|url|path|id|key|code|token|address|hash|src|alt|href|className|placeholder|icon|img|image|avatar|logo|color|theme|variant|size|style|class|tooltip|hint|info|detail|note|comment|reason|caption|header|footer|summary|subtitle|prefix|suffix|format|pattern|data|result|response|item|option|selected|current|default|initial|prev|next|first|last|children|child|parent|ref|callback|handler|action|method|mode|lang|locale|currency|symbol|unit|network|chain|coin|wallet|invoice|transaction|payment|user|merchant|admin|permission|navigation)$/;

      const re = /\{\s*(\w+(?:\.\w+)*)\s*&&\s*</g;
      for (let i = 0; i < lines.length; i++) {
        let m;
        while ((m = re.exec(lines[i])) !== null) {
          const expr = m[1];
          // Skip if already boolean-ized (!!x, Boolean(x), x > 0, x !== 0, etc.)
          const before = lines[i].slice(0, m.index + 1).trimEnd();
          if (/!!$/.test(before) || /Boolean\($/.test(before)) continue;
          // Skip obvious booleans: isX, hasX, showX, etc.
          if (/^(is|has|show|should|can|will|did)[A-Z]/.test(expr)) continue;

          // Only flag .length patterns (most likely numeric)
          if (expr.endsWith('.length')) {
            issues.push({
              ruleId: 'conditional-render-zero',
              severity: 'warn',
              file: relPath,
              line: i + 1,
              message: `{${expr} && <…>} may render 0. Use {${expr} > 0 && <…>}.`,
            });
          } else if (/^\w+$/.test(expr) && !STRING_NAMES.test(expr)) {
            // Single variable — only flag if name suggests numeric (count, total, num, etc.)
            if (/^(count|total|num|amount|sum|size|index|page|limit|offset|balance|fee|price|qty|quantity|length|width|height|max|min|step)$/i.test(expr)) {
              issues.push({
                ruleId: 'conditional-render-zero',
                severity: 'warn',
                file: relPath,
                line: i + 1,
                message: `{${expr} && <…>} may render 0/NaN. Use {${expr} > 0 && <…>} or {!!${expr} && <…>}.`,
              });
            }
          }
        }
      }
      return issues;
    },
  },

  {
    id: 'jsx-no-target-blank',
    severity: 'warn',
    description: 'target="_blank" without rel="noopener noreferrer" — security risk',
    check({ lines, relPath, ext }) {
      if (ext !== '.jsx' && ext !== '.tsx') return [];
      const issues = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/target\s*=\s*["']_blank["']/.test(line)) {
          // Check current line and adjacent lines for rel="noopener noreferrer"
          const context = (lines[i - 1] || '') + line + (lines[i + 1] || '');
          if (!/rel\s*=\s*["']noopener\s*noreferrer["']/.test(context)) {
            issues.push({
              ruleId: 'jsx-no-target-blank',
              severity: 'warn',
              file: relPath,
              line: i + 1,
              message: 'Add rel="noopener noreferrer" to links with target="_blank" (reverse tabnabbing risk).',
            });
          }
        }
      }
      return issues;
    },
  },

  {
    id: 'no-dangerouslySetInnerHTML',
    severity: 'error',
    description: 'dangerouslySetInnerHTML is an XSS attack vector',
    check({ lines, relPath, ext }) {
      if (ext !== '.jsx' && ext !== '.tsx') return [];
      const issues = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('dangerouslySetInnerHTML')) {
          issues.push({
            ruleId: 'no-dangerouslySetInnerHTML',
            severity: 'error',
            file: relPath,
            line: i + 1,
            message: 'Avoid dangerouslySetInnerHTML — XSS risk. Use safe rendering alternatives.',
          });
        }
      }
      return issues;
    },
  },

  // ─── Category B: Project-Specific ────────────────────────────────────────

  {
    id: 'no-direct-clipboard',
    severity: 'error',
    description: 'Use copyToClipboard() from utils/clipboard.ts',
    check({ lines, relPath }) {
      if (relPath === 'src/utils/clipboard.ts') return [];
      const issues = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('navigator.clipboard')) {
          issues.push({
            ruleId: 'no-direct-clipboard',
            severity: 'error',
            file: relPath,
            line: i + 1,
            message: 'Use copyToClipboard() from utils/clipboard.ts instead of navigator.clipboard.',
          });
        }
      }
      return issues;
    },
  },

  {
    id: 'no-hardcoded-color',
    severity: 'warn',
    description: 'Hardcoded hex color in inline style',
    check({ lines, relPath }) {
      // Skip test files
      if (relPath.includes('.test.') || relPath.includes('.spec.')) return [];
      // Skip files that use crypto brand colors (BTC orange, ETH blue, etc.)
      const BRAND_COLOR_FILES = new Set([
        'src/views/crypto/CoinList.jsx',
        'src/views/crypto/NetworkList.jsx',
        'src/components/CoinImg.jsx',
        'src/utils/coinAssets.ts',
      ]);
      if (BRAND_COLOR_FILES.has(relPath)) return [];
      const issues = [];
      const seen = new Set();
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip color palette/constant definitions (data visualization colors)
        if (/^\s*const\s+\w*(COLOR|PALETTE|COLORS)\w*\s*=/.test(line)) continue;
        // Match style={{ ... #hex ... }} or color: '#hex'
        if (/style\s*=\s*\{/.test(line) || /:\s*['"]#/.test(line) || /color\s*:\s*['"]#/.test(line)) {
          // Remove color-mix() expressions before detecting hex colors (they use #000/#fff as mix targets)
          const cleanLine = line.replace(/color-mix\((?:[^()]*|\([^()]*\))*\)/g, '');
          const colors = cleanLine.match(/#[0-9a-fA-F]{3,8}/g);
          if (colors) {
            // Deduplicate per line — report only unique colors per line
            const uniqueOnLine = [...new Set(colors)];
            for (const color of uniqueOnLine) {
              const key = `${relPath}:${i}:${color}`;
              if (seen.has(key)) continue;
              seen.add(key);
              issues.push({
                ruleId: 'no-hardcoded-color',
                severity: 'warn',
                file: relPath,
                line: i + 1,
                message: `Hardcoded color '${color}' in style. Use Bootstrap theme class or CSS variable instead.`,
              });
            }
          }
        }
      }
      return issues;
    },
  },

  {
    id: 'no-console-log',
    severity: 'error',
    description: 'console.log()/debug() should not be in production code',
    check({ lines, relPath, ext }) {
      // Skip test files
      if (relPath.includes('.test.') || relPath.includes('.spec.') || relPath.includes('__test')) {
        return [];
      }
      const issues = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Skip comments
        if (line.startsWith('//') || line.startsWith('*')) continue;
        if (line.includes('console.log(') || line.includes('console.log (')) {
          issues.push({
            ruleId: 'no-console-log',
            severity: 'error',
            file: relPath,
            line: i + 1,
            message: 'Remove console.log() or replace with console.warn()/console.error().',
          });
        }
        if (line.includes('console.debug(') || line.includes('console.debug (')) {
          issues.push({
            ruleId: 'no-console-log',
            severity: 'error',
            file: relPath,
            line: i + 1,
            message: 'Remove console.debug() or replace with console.warn()/console.error().',
          });
        }
      }
      return issues;
    },
  },

  {
    id: 'use-shared-role-utils',
    severity: 'warn',
    description: 'Duplicate role utilities — use shared utils/roles.js',
    check({ lines, relPath }) {
      if (relPath === 'src/utils/roles.js') return [];
      const issues = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (
          /const\s+ROLE_ICON\s*=/.test(line) ||
          /const\s+ROLE_COLOR\s*=/.test(line) ||
          /function\s+formatRoleLabel\s*\(/.test(line) ||
          /const\s+formatRoleLabel\s*=/.test(line)
        ) {
          issues.push({
            ruleId: 'use-shared-role-utils',
            severity: 'warn',
            file: relPath,
            line: i + 1,
            message: 'Duplicate role utility. Import from utils/roles.js instead.',
          });
        }
      }
      return issues;
    },
  },

  {
    id: 'use-shared-format-date',
    severity: 'warn',
    description: 'Duplicate formatDate — use shared utils/format.ts',
    check({ lines, relPath }) {
      if (relPath === 'src/utils/format.ts') return [];
      const issues = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (
          /function\s+formatDate\s*\(/.test(line) ||
          /const\s+formatDate\s*=/.test(line)
        ) {
          // Skip chart-specific inline formatters (e.g. `const formatDate = (d) => d.toLocaleDateString(...)`)
          if (/toLocaleDateString/.test(line)) continue;
          issues.push({
            ruleId: 'use-shared-format-date',
            severity: 'warn',
            file: relPath,
            line: i + 1,
            message: 'Duplicate formatDate(). Import from utils/format.ts instead.',
          });
        }
      }
      return issues;
    },
  },

  // ─── Category C: Code Quality ────────────────────────────────────────────

  {
    id: 'large-component',
    severity: 'warn',
    description: 'Component file exceeds recommended line count',
    check({ lines, relPath, ext }) {
      // Different thresholds for different file types
      const isComponent = (ext === '.jsx' || ext === '.tsx') &&
        (relPath.startsWith('src/views/') || relPath.startsWith('src/components/'));
      const isHook = relPath.startsWith('src/hooks/');
      const isApiFile = relPath.startsWith('src/api/');
      const isUtilFile = relPath.startsWith('src/utils/');
      const threshold = isComponent ? 400 : isHook ? 300 : isApiFile ? 2000 : isUtilFile ? 1500 : 800;
      const label = isComponent ? 'component' : isHook ? 'hook' : 'file';

      if (lines.length > threshold) {
        return [
          {
            ruleId: 'large-component',
            severity: 'warn',
            file: relPath,
            message: `${lines.length} lines (threshold: ${threshold}). Consider splitting this ${label}.`,
          },
        ];
      }
      return [];
    },
  },
];

// ─── Duplicate File Rule (cross-file, runs separately) ──────────────────────

/**
 * Find .js/.ts pairs with same basename in same directory
 * @param {string[]} allFiles
 * @returns {Issue[]}
 */
function checkDuplicateFiles(allFiles) {
  const issues = [];
  /** @type {Map<string, string[]>} */
  const byDir = new Map();

  for (const f of allFiles) {
    const dir = dirname(f);
    const name = basename(f);
    const key = dir;
    if (!byDir.has(key)) byDir.set(key, []);
    byDir.get(key).push(name);
  }

  for (const [dir, files] of byDir) {
    const stems = new Map();
    for (const file of files) {
      const ext = extname(file);
      const stem = basename(file, ext);
      // Group: .js with .ts, .jsx with .tsx
      const normalizedExt = ext.replace('x', '');
      const key = `${stem}|${normalizedExt}`;
      if (!stems.has(key)) stems.set(key, []);
      stems.get(key).push(file);
    }

    for (const [, group] of stems) {
      if (group.length > 1) {
        const relDir = relative(join(SRC_DIR, '..'), dir);
        issues.push({
          ruleId: 'duplicate-file',
          severity: 'error',
          file: relDir,
          message: `Duplicate files: ${group.join(', ')}. Remove the obsolete version.`,
        });
      }
    }
  }
  return issues;
}

// ─── File Collection ─────────────────────────────────────────────────────────

/**
 * Recursively collect source files
 * @param {string} dir
 * @returns {string[]}
 */
function collectFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      results.push(...collectFiles(fullPath));
    } else if (EXTENSIONS.has(extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const files = collectFiles(SRC_DIR);
  /** @type {Issue[]} */
  const allIssues = [];
  let filesWithIssues = 0;

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const relPath = relative(join(SRC_DIR, '..'), filePath);
    const ext = extname(filePath);

    /** @type {FileContext} */
    const ctx = { filePath, relPath, content, lines, ext };

    const fileIssues = [];
    for (const rule of RULES) {
      fileIssues.push(...rule.check(ctx));
    }

    if (fileIssues.length > 0) filesWithIssues++;
    allIssues.push(...fileIssues);
  }

  // Cross-file checks
  allIssues.push(...checkDuplicateFiles(files));

  // ─── Output ──────────────────────────────────────────────────────────────

  const errors = allIssues.filter((i) => i.severity === 'error');
  const warnings = allIssues.filter((i) => i.severity === 'warn');

  // Sort: errors first, then warnings, then by file
  allIssues.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
    return a.file.localeCompare(b.file) || (a.line || 0) - (b.line || 0);
  });

  // Print issues
  if (allIssues.length > 0) {
    console.log('');
    for (const issue of allIssues) {
      const severity = issue.severity === 'error' ? '\x1b[31merror\x1b[0m' : '\x1b[33mwarn\x1b[0m';
      const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
      console.log(`  ${severity}  \x1b[2m[${issue.ruleId}]\x1b[0m ${location}`);
      console.log(`         ${issue.message}`);
    }
    console.log('');
  }

  // Summary
  const passedFiles = files.length - filesWithIssues;
  console.log('\x1b[1mBest Practices Check Complete\x1b[0m');
  console.log('\x1b[2m─────────────────────────────\x1b[0m');
  console.log(`  ${allIssues.length} issues found (${errors.length} error, ${warnings.length} warning)`);

  if (errors.length > 0) {
    const errorCounts = {};
    for (const e of errors) errorCounts[e.ruleId] = (errorCounts[e.ruleId] || 0) + 1;
    const errorSummary = Object.entries(errorCounts)
      .map(([id, n]) => `${id}(${n})`)
      .join(', ');
    console.log(`  \x1b[31m${errors.length} error:   ${errorSummary}\x1b[0m`);
  }

  if (warnings.length > 0) {
    const warnCounts = {};
    for (const w of warnings) warnCounts[w.ruleId] = (warnCounts[w.ruleId] || 0) + 1;
    const warnSummary = Object.entries(warnCounts)
      .map(([id, n]) => `${id}(${n})`)
      .join(', ');
    console.log(`  \x1b[33m${warnings.length} warning: ${warnSummary}\x1b[0m`);
  }

  console.log('');
  console.log(`  ${files.length} files scanned, ${passedFiles} passed`);
  console.log('');

  // Exit code: 1 if any errors
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
