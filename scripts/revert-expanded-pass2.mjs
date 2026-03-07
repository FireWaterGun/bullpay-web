#!/usr/bin/env node

/**
 * Second pass: revert remaining expanded patterns and fix duplicate btn classes.
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const DRY_RUN = process.argv.includes('--dry-run')

// ─── Additional button expansions missed in first pass ───
const REPLACEMENTS = [
  // btn-outline-* patterns (with leading "btn " or "btn btn " prefix)
  [
    'btn border border-warning-500 text-warning-500 bg-transparent hover:bg-warning-500 hover:text-white',
    'btn btn-outline-warning',
  ],
  [
    'btn border border-success-500 text-success-500 bg-transparent hover:bg-success-500 hover:text-white',
    'btn btn-outline-success',
  ],
  [
    'btn border border-info-500 text-info-500 bg-transparent hover:bg-info-500 hover:text-white',
    'btn btn-outline-info',
  ],
  // btn-secondary expanded
  ['btn bg-surface-200 text-surface-700 hover:bg-surface-300', 'btn btn-secondary'],
  // btn-warning expanded (solid)
  ['btn bg-warning-500 text-white hover:bg-warning-600', 'btn btn-warning'],
]

const rawFiles = execSync("find app components -type f \\( -name '*.jsx' -o -name '*.tsx' \\)", {
  cwd: process.cwd(),
  encoding: 'utf-8',
}).trim()
const files = rawFiles ? rawFiles.split('\n').map((f) => path.resolve(process.cwd(), f)) : []

let totalFilesChanged = 0
let totalReplacements = 0

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf-8')
  let original = content
  let fileReplacements = 0

  // ── Revert expanded patterns ──
  for (const [expanded, semantic] of REPLACEMENTS) {
    // Handle "btn btn <expanded>" (triple btn from migration)
    const tripleBtnPrefixed = `btn ${expanded}`
    if (content.includes(tripleBtnPrefixed)) {
      // "btn btn border border-..." → "btn btn-outline-..."
      // But semantic already has "btn " prefix, so "btn " + semantic
      const count = content.split(tripleBtnPrefixed).length - 1
      content = content.replaceAll(tripleBtnPrefixed, semantic)
      fileReplacements += count
    }

    // Handle standalone expanded
    if (content.includes(expanded)) {
      const count = content.split(expanded).length - 1
      content = content.replaceAll(expanded, semantic)
      fileReplacements += count
    }
  }

  // ── Fix duplicate "btn btn" → "btn" ──
  // But preserve "btn btn-*" which is valid (base + variant)
  // We look for "btn btn " followed by NON "btn-" i.e. "btn btn btn-" → "btn btn-"
  // Also "btn btn " at end or before space → "btn "
  let prev
  do {
    prev = content
    // "btn btn btn-xxx" → "btn btn-xxx"
    content = content.replace(/\bbtn btn btn-/g, 'btn btn-')
    // "btn btn " where next word is NOT "btn-" → "btn "
    content = content.replace(/\bbtn btn(?= [^b])/g, 'btn')
    content = content.replace(/\bbtn btn(?= b[^t])/g, 'btn')
    content = content.replace(/\bbtn btn(?= bt[^n])/g, 'btn')
    content = content.replace(/\bbtn btn(?= btn[^-])/g, 'btn')
    // "btn btn" at end of string in className
    content = content.replace(/\bbtn btn"/g, 'btn"')
  } while (content !== prev)

  if (content !== original) {
    const changes = fileReplacements || (content !== original ? 1 : 0)
    totalFilesChanged++
    totalReplacements += changes

    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content, 'utf-8')
    }

    const rel = path.relative(process.cwd(), filePath)
    console.log(`  ${DRY_RUN ? '[DRY] ' : ''}${rel}`)
  }
}

console.log(`\n─── Summary ───`)
console.log(`Files changed: ${totalFilesChanged}`)
console.log(`Total replacements: ${totalReplacements}`)

if (DRY_RUN) {
  console.log('\n⚠️  Dry run — no files were modified.')
}
