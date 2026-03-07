#!/usr/bin/env node

/**
 * Revert inline Tailwind utility expansions back to semantic CSS class names.
 *
 * The migration script incorrectly expanded component class names (like
 * btn-outline-secondary) into multiple inline Tailwind utilities. This script
 * converts them back to the semantic class names that are defined in
 * globals.css @layer components.
 *
 * Usage: node scripts/revert-expanded-classes.mjs [--dry-run]
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const DRY_RUN = process.argv.includes('--dry-run')

// ─── Replacement Map ───
// Each entry: [expanded inline utilities, semantic class name]
// ORDER MATTERS: longer/more specific patterns first to avoid partial matches
const REPLACEMENTS = [
  // Button variants (most specific first)
  [
    'btn border border-primary-600 text-primary-600 bg-transparent hover:bg-primary-600 hover:text-white',
    'btn-outline-primary',
  ],
  [
    'btn border border-danger-500 text-danger-500 bg-transparent hover:bg-danger-500 hover:text-white',
    'btn-outline-danger',
  ],
  ['btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100', 'btn-outline-secondary'],
  ['btn bg-transparent text-primary-600 hover:bg-primary-50 shadow-none', 'btn-text-primary'],
  ['btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none', 'btn-text-secondary'],
  ['btn bg-surface-100 text-surface-700 hover:bg-surface-200 shadow-none', 'btn-label-secondary'],
]

// bg-label replacements — these are trickier because the inline classes are
// generic Tailwind utilities. We only replace when they appear adjacently in a
// className string. The regex will look for both orderings.
const BG_LABEL_REPLACEMENTS = [
  { expanded: ['bg-green-50', 'text-green-700'], semantic: 'bg-label-success' },
  { expanded: ['bg-red-50', 'text-red-700'], semantic: 'bg-label-danger' },
  { expanded: ['bg-amber-50', 'text-amber-700'], semantic: 'bg-label-warning' },
  { expanded: ['bg-cyan-50', 'text-cyan-700'], semantic: 'bg-label-info' },
  { expanded: ['bg-surface-100', 'text-surface-600'], semantic: 'bg-label-secondary' },
  { expanded: ['bg-primary-50', 'text-primary-600'], semantic: 'bg-label-primary' },
]

// ─── File Discovery ───
const rawFiles = execSync("find app components -type f \\( -name '*.jsx' -o -name '*.tsx' \\)", {
  cwd: process.cwd(),
  encoding: 'utf-8',
}).trim()
const files = rawFiles ? rawFiles.split('\n').map((f) => path.resolve(process.cwd(), f)) : []

let totalFilesChanged = 0
let totalReplacements = 0
const stats = {}

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf-8')
  let original = content
  let fileReplacements = 0

  // ── Button variant reversions ──
  for (const [expanded, semantic] of REPLACEMENTS) {
    // The expanded pattern appears inside className strings
    // We need to handle that the 'btn' keyword might already be present
    // separately, so the expanded version might be like "btn btn border..."
    // (since 'btn' was mapped separately AND also included in the expansion)

    // Pattern 1: "btn <expanded>" → "<semantic>" (the extra btn was from the
    // original btn class mapping, so keep just the semantic which implies btn)
    // Actually the semantic class is used ALONGSIDE .btn, e.g. "btn btn-outline-secondary"
    // So we want: "btn <expanded>" → "btn <semantic>"

    // First handle "btn <expanded>" (most common - the migration added `btn` from the base + the expanded variant)
    const btnPrefixed = `btn ${expanded}`
    if (content.includes(btnPrefixed)) {
      const count = content.split(btnPrefixed).length - 1
      content = content.replaceAll(btnPrefixed, `btn ${semantic}`)
      fileReplacements += count
      stats[semantic] = (stats[semantic] || 0) + count
    }

    // Then handle standalone expanded (without preceding btn)
    if (content.includes(expanded)) {
      const count = content.split(expanded).length - 1
      content = content.replaceAll(expanded, `btn ${semantic}`)
      fileReplacements += count
      stats[semantic] = (stats[semantic] || 0) + count
    }
  }

  // ── bg-label reversions ──
  for (const { expanded, semantic } of BG_LABEL_REPLACEMENTS) {
    const [cls1, cls2] = expanded

    // Match both orderings: "bg-X text-X" and "text-X bg-X"
    // Use regex to match them as whole class names (word boundaries)

    // Order 1: cls1 cls2 (possibly with classes between them)
    // We'll be conservative and only match when they are ADJACENT
    const re1 = new RegExp(`\\b${escapeRegExp(cls1)}\\s+${escapeRegExp(cls2)}\\b`, 'g')
    const re2 = new RegExp(`\\b${escapeRegExp(cls2)}\\s+${escapeRegExp(cls1)}\\b`, 'g')

    const matches1 = content.match(re1) || []
    const matches2 = content.match(re2) || []

    if (matches1.length > 0) {
      content = content.replace(re1, semantic)
      fileReplacements += matches1.length
      stats[semantic] = (stats[semantic] || 0) + matches1.length
    }

    if (matches2.length > 0) {
      content = content.replace(re2, semantic)
      fileReplacements += matches2.length
      stats[semantic] = (stats[semantic] || 0) + matches2.length
    }
  }

  if (content !== original) {
    totalFilesChanged++
    totalReplacements += fileReplacements

    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content, 'utf-8')
    }

    const rel = path.relative(process.cwd(), filePath)
    console.log(`  ${DRY_RUN ? '[DRY] ' : ''}${rel} (${fileReplacements} replacements)`)
  }
}

console.log('\n─── Summary ───')
console.log(`Files changed: ${totalFilesChanged}`)
console.log(`Total replacements: ${totalReplacements}`)
console.log('\nPer class:')
for (const [cls, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cls}: ${count}`)
}

if (DRY_RUN) {
  console.log('\n⚠️  Dry run — no files were modified. Remove --dry-run to apply.')
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
