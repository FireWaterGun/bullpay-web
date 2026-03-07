#!/usr/bin/env node
/**
 * Converts barrel imports from @/components/ui (and ../ui, ../../ui, etc.)
 * into direct imports from individual component files.
 *
 * Usage: node scripts/fix-barrel-imports.mjs [--dry-run]
 */

import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

const DRY_RUN = process.argv.includes('--dry-run')

// Map every named export → { source file, isDefault }
// Based on components/ui/index.js
const EXPORT_MAP = {
  // Button.jsx
  Button:    { file: 'Button', isDefault: true },
  buttonClass: { file: 'Button', isDefault: false },

  // Badge.jsx
  Badge:     { file: 'Badge', isDefault: true },
  labelClass: { file: 'Badge', isDefault: false },
  bgLabelClass: { file: 'Badge', isDefault: false },
  badgeBase: { file: 'Badge', isDefault: false },

  // Input.jsx (all named exports, no default)
  Input:     { file: 'Input', isDefault: false },
  Select:    { file: 'Input', isDefault: false },
  Label:     { file: 'Input', isDefault: false },
  InputGroup: { file: 'Input', isDefault: false },
  InputIcon: { file: 'Input', isDefault: false },
  InputAddon: { file: 'Input', isDefault: false },
  inputClass: { file: 'Input', isDefault: false },

  // Card.jsx
  Card:      { file: 'Card', isDefault: true },
  CardHeader: { file: 'Card', isDefault: false },
  CardBody:  { file: 'Card', isDefault: false },

  // Pagination.jsx
  Pagination: { file: 'Pagination', isDefault: true },

  // Spinner.jsx
  Spinner:   { file: 'Spinner', isDefault: true },
  PageSpinner: { file: 'Spinner', isDefault: false },

  // Alert.jsx
  Alert:     { file: 'Alert', isDefault: true },

  // Table.jsx
  Table:     { file: 'Table', isDefault: true },

  // AvatarInitial.jsx
  AvatarInitial: { file: 'AvatarInitial', isDefault: true },

  // CoinNetworkFilterDropdown.jsx
  CoinNetworkFilterDropdown: { file: 'CoinNetworkFilterDropdown', isDefault: true },

  // ActionMenu.jsx
  ActionMenu: { file: 'ActionMenu', isDefault: true },
}

// Regex to match barrel import lines
// Matches: import { X, Y } from '@/components/ui'
//          import { X, Y } from '../ui'
//          import { X, Y } from '../../ui'   etc.
const BARREL_IMPORT_RE = /^(import\s+\{[^}]+\}\s+from\s+['"])(@\/components\/ui|(?:\.\.\/)+ui)(['"];?\s*)$/

// Multi-line barrel import — starts with `import {` and the from clause is on a later line
const BARREL_IMPORT_MULTILINE_START = /^import\s+\{/
const BARREL_IMPORT_MULTILINE_FROM = /\}\s+from\s+['"](@\/components\/ui|(?:\.\.\/)+ui)['"];?\s*$/

function parseNamedImports(importBlock) {
  // Extract everything between { and }
  const match = importBlock.match(/\{([^}]+)\}/)
  if (!match) return []
  return match[1]
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      // Handle `Foo as Bar`
      const parts = s.split(/\s+as\s+/)
      return { original: parts[0].trim(), alias: parts.length > 1 ? parts[1].trim() : null }
    })
}

function buildDirectImports(namedImports, basePath) {
  // Group imports by source file
  const groups = new Map() // file → { defaults: [], named: [] }

  for (const { original, alias } of namedImports) {
    const info = EXPORT_MAP[original]
    if (!info) {
      console.warn(`  ⚠️  Unknown export: "${original}" — skipping`)
      continue
    }
    if (!groups.has(info.file)) {
      groups.set(info.file, { defaults: [], named: [] })
    }
    const g = groups.get(info.file)
    if (info.isDefault) {
      g.defaults.push({ original, alias })
    } else {
      g.named.push({ original, alias })
    }
  }

  // Generate import lines
  const lines = []
  for (const [file, { defaults, named }] of groups) {
    const importPath = `${basePath}/${file}`
    const parts = []

    if (defaults.length === 1) {
      const d = defaults[0]
      parts.push(d.alias ? `${d.alias}` : d.original)
    } else if (defaults.length > 1) {
      // Shouldn't happen, but handle gracefully
      console.warn(`  ⚠️  Multiple defaults from ${file}:`, defaults)
      parts.push(defaults[0].alias || defaults[0].original)
    }

    if (named.length > 0) {
      const namedStr = named.map(n => n.alias ? `${n.original} as ${n.alias}` : n.original).join(', ')
      parts.push(`{ ${namedStr} }`)
    }

    // If file has both default and named
    if (defaults.length > 0 && named.length > 0) {
      const defStr = defaults[0].alias || defaults[0].original
      const namedStr = named.map(n => n.alias ? `${n.original} as ${n.alias}` : n.original).join(', ')
      lines.push(`import ${defStr}, { ${namedStr} } from '${importPath}'`)
    } else if (defaults.length > 0) {
      const defStr = defaults[0].alias || defaults[0].original
      lines.push(`import ${defStr} from '${importPath}'`)
    } else if (named.length > 0) {
      const namedStr = named.map(n => n.alias ? `${n.original} as ${n.alias}` : n.original).join(', ')
      lines.push(`import { ${namedStr} } from '${importPath}'`)
    }
  }

  return lines
}

function processFile(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  let modified = false
  const newLines = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Try single-line barrel import
    const singleMatch = line.match(BARREL_IMPORT_RE)
    if (singleMatch) {
      const barrelPath = singleMatch[2]
      const basePath = barrelPath === '@/components/ui' ? '@/components/ui' : barrelPath
      const namedImports = parseNamedImports(line)

      if (namedImports.length > 0) {
        const directImports = buildDirectImports(namedImports, basePath)
        newLines.push(...directImports)
        modified = true
        i++
        continue
      }
    }

    // Try multi-line barrel import
    if (BARREL_IMPORT_MULTILINE_START.test(line) && !line.includes('from')) {
      // Collect lines until we find the closing `} from '...'`
      let block = line
      let j = i + 1
      let found = false
      while (j < lines.length && j < i + 20) { // max 20 lines
        block += '\n' + lines[j]
        if (BARREL_IMPORT_MULTILINE_FROM.test(lines[j])) {
          found = true
          break
        }
        // Also check if closing brace + from is on same line after accumulation
        if (/\}\s+from\s+['"](@\/components\/ui|(?:\.\.\/)+ui)['"]/.test(lines[j])) {
          found = true
          break
        }
        j++
      }

      if (found) {
        const fromMatch = block.match(/from\s+['"](@\/components\/ui|(?:\.\.\/)+ui)['"]/)
        if (fromMatch) {
          const barrelPath = fromMatch[1]
          const basePath = barrelPath === '@/components/ui' ? '@/components/ui' : barrelPath
          const namedImports = parseNamedImports(block)

          if (namedImports.length > 0) {
            const directImports = buildDirectImports(namedImports, basePath)
            newLines.push(...directImports)
            modified = true
            i = j + 1
            continue
          }
        }
      }
    }

    newLines.push(line)
    i++
  }

  if (modified) {
    const result = newLines.join('\n')
    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would modify: ${filePath}`)
    } else {
      writeFileSync(filePath, result, 'utf-8')
      console.log(`  ✅ Fixed: ${filePath}`)
    }
  }

  return modified
}

// Find all affected files
function findFiles() {
  const out = execSync(
    `grep -rl --include='*.jsx' --include='*.tsx' --include='*.ts' -e "from '@/components/ui'" -e "from \\"@/components/ui\\"" -e "from '../ui'" -e "from \\"../ui\\"" -e "from '../../ui'" -e "from \\"../../ui\\"" .`,
    { cwd: '/Users/recordset/Projects/bullpay-web', encoding: 'utf-8' }
  )
  return out.trim().split('\n').filter(Boolean).map(f => f.startsWith('./') ? f.slice(2) : f)
}

// Main
console.log(DRY_RUN ? '🔍 DRY RUN MODE\n' : '🔧 FIXING BARREL IMPORTS\n')

const files = findFiles()
console.log(`Found ${files.length} files with barrel imports\n`)

let fixedCount = 0
for (const file of files) {
  const fullPath = `/Users/recordset/Projects/bullpay-web/${file}`
  try {
    if (processFile(fullPath)) fixedCount++
  } catch (err) {
    console.error(`  ❌ Error in ${file}:`, err.message)
  }
}

console.log(`\n✅ Done! Fixed ${fixedCount}/${files.length} files`)
if (DRY_RUN) console.log('   (Re-run without --dry-run to apply changes)')
