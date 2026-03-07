#!/usr/bin/env node
/**
 * Bootstrap → Tailwind CSS v4 class migration script
 * Converts Bootstrap class names to Tailwind equivalents in JSX files.
 *
 * Usage: node scripts/migrate-bs-to-tw.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const DRY_RUN = process.argv.includes('--dry-run')

// ─── Simple 1:1 Bootstrap → Tailwind class mapping ───
const CLASS_MAP = {
  // Display
  'd-flex': 'flex',
  'd-inline-flex': 'inline-flex',
  'd-block': 'block',
  'd-inline-block': 'inline-block',
  'd-inline': 'inline',
  'd-none': 'hidden',
  'd-grid': 'grid',

  // Flexbox
  'align-items-center': 'items-center',
  'align-items-start': 'items-start',
  'align-items-end': 'items-end',
  'align-items-stretch': 'items-stretch',
  'align-items-baseline': 'items-baseline',
  'justify-content-between': 'justify-between',
  'justify-content-center': 'justify-center',
  'justify-content-end': 'justify-end',
  'justify-content-start': 'justify-start',
  'justify-content-around': 'justify-around',
  'justify-content-evenly': 'justify-evenly',
  'flex-grow-1': 'grow',
  'flex-grow-0': 'grow-0',
  'flex-shrink-0': 'shrink-0',
  'flex-shrink-1': 'shrink',
  'flex-wrap': 'flex-wrap',
  'flex-nowrap': 'flex-nowrap',
  'flex-column': 'flex-col',
  'flex-row': 'flex-row',
  'flex-fill': 'flex-1',

  // Font weight
  'fw-medium': 'font-medium',
  'fw-semibold': 'font-semibold',
  'fw-bold': 'font-bold',
  'fw-normal': 'font-normal',
  'fw-light': 'font-light',
  'fw-bolder': 'font-black',

  // Text
  'text-uppercase': 'uppercase',
  'text-lowercase': 'lowercase',
  'text-capitalize': 'capitalize',
  'text-truncate': 'truncate',
  'text-decoration-none': 'no-underline',
  'text-nowrap': 'whitespace-nowrap',
  'text-break': 'break-words',

  // Text align
  'text-center': 'text-center',
  'text-end': 'text-right',
  'text-start': 'text-left',

  // Border / Rounded
  'rounded-pill': 'rounded-full',
  'rounded-circle': 'rounded-full',
  'rounded-0': 'rounded-none',
  'rounded-1': 'rounded-sm',
  'rounded-2': 'rounded',
  'rounded-3': 'rounded-lg',

  // Shadow
  'shadow-none': 'shadow-none',
  'shadow-sm': 'shadow-sm',
  'shadow-lg': 'shadow-lg',

  // Overflow
  'overflow-auto': 'overflow-auto',
  'overflow-hidden': 'overflow-hidden',
  'overflow-visible': 'overflow-visible',
  'overflow-scroll': 'overflow-scroll',

  // Position
  'position-relative': 'relative',
  'position-absolute': 'absolute',
  'position-fixed': 'fixed',
  'position-sticky': 'sticky',
  'position-static': 'static',

  // Width / Height
  'w-100': 'w-full',
  'w-auto': 'w-auto',
  'h-100': 'h-full',
  'h-auto': 'h-auto',
  'mw-100': 'max-w-full',
  'mh-100': 'max-h-full',
  'vw-100': 'w-screen',
  'vh-100': 'h-screen',
  'min-vw-100': 'min-w-screen',
  'min-vh-100': 'min-h-screen',

  // Visibility
  visible: 'visible',
  invisible: 'invisible',

  // Misc
  small: 'text-sm',
  lead: 'text-lg',
  'img-fluid': 'max-w-full h-auto',
  clearfix: 'after:clear-both after:block after:content-[""]',

  // Spacing: margin (me = margin-end = mr, ms = margin-start = ml)
  'me-0': 'mr-0',
  'me-1': 'mr-1',
  'me-2': 'mr-2',
  'me-3': 'mr-3',
  'me-4': 'mr-4',
  'me-5': 'mr-5',
  'me-auto': 'mr-auto',
  'ms-0': 'ml-0',
  'ms-1': 'ml-1',
  'ms-2': 'ml-2',
  'ms-3': 'ml-3',
  'ms-4': 'ml-4',
  'ms-5': 'ml-5',
  'ms-auto': 'ml-auto',
  'mt-0': 'mt-0',
  'mt-1': 'mt-1',
  'mt-2': 'mt-2',
  'mt-3': 'mt-3',
  'mt-4': 'mt-4',
  'mt-5': 'mt-5',
  'mt-6': 'mt-6',
  'mt-auto': 'mt-auto',
  'mb-0': 'mb-0',
  'mb-1': 'mb-1',
  'mb-2': 'mb-2',
  'mb-3': 'mb-3',
  'mb-4': 'mb-4',
  'mb-5': 'mb-5',
  'mb-auto': 'mb-auto',
  'mx-0': 'mx-0',
  'mx-1': 'mx-1',
  'mx-2': 'mx-2',
  'mx-3': 'mx-3',
  'mx-4': 'mx-4',
  'mx-auto': 'mx-auto',
  'my-0': 'my-0',
  'my-1': 'my-1',
  'my-2': 'my-2',
  'my-3': 'my-3',
  'my-4': 'my-4',

  // Padding (pe = padding-end = pr, ps = padding-start = pl)
  'pe-0': 'pr-0',
  'pe-1': 'pr-1',
  'pe-2': 'pr-2',
  'pe-3': 'pr-3',
  'pe-4': 'pr-4',
  'pe-5': 'pr-5',
  'ps-0': 'pl-0',
  'ps-1': 'pl-1',
  'ps-2': 'pl-2',
  'ps-3': 'pl-3',
  'ps-4': 'pl-4',
  'ps-5': 'pl-5',
  'pt-0': 'pt-0',
  'pt-1': 'pt-1',
  'pt-2': 'pt-2',
  'pt-3': 'pt-3',
  'pt-4': 'pt-4',
  'pt-5': 'pt-5',
  'pb-0': 'pb-0',
  'pb-1': 'pb-1',
  'pb-2': 'pb-2',
  'pb-3': 'pb-3',
  'pb-4': 'pb-4',
  'pb-5': 'pb-5',
  'px-0': 'px-0',
  'px-1': 'px-1',
  'px-2': 'px-2',
  'px-3': 'px-3',
  'px-4': 'px-4',
  'px-5': 'px-5',
  'py-0': 'py-0',
  'py-1': 'py-1',
  'py-2': 'py-2',
  'py-3': 'py-3',
  'py-4': 'py-4',
  'py-5': 'py-5',
  'p-0': 'p-0',
  'p-1': 'p-1',
  'p-2': 'p-2',
  'p-3': 'p-3',
  'p-4': 'p-4',
  'p-5': 'p-5',

  // Gap
  'g-0': 'gap-0',
  'g-1': 'gap-1',
  'g-2': 'gap-2',
  'g-3': 'gap-3',
  'g-4': 'gap-4',
  'g-5': 'gap-5',

  // Bootstrap grid → Tailwind grid/flex
  row: 'grid grid-cols-12 gap-x-6',
  'col-12': 'col-span-12',
  'col-6': 'col-span-6',
  'col-auto': 'col-auto',
  'col-sm-3': 'sm:col-span-3',
  'col-sm-4': 'sm:col-span-4',
  'col-sm-6': 'sm:col-span-6',
  'col-sm-8': 'sm:col-span-8',
  'col-sm-12': 'sm:col-span-12',
  'col-md-2': 'md:col-span-2',
  'col-md-3': 'md:col-span-3',
  'col-md-4': 'md:col-span-4',
  'col-md-5': 'md:col-span-5',
  'col-md-6': 'md:col-span-6',
  'col-md-7': 'md:col-span-7',
  'col-md-8': 'md:col-span-8',
  'col-md-9': 'md:col-span-9',
  'col-md-10': 'md:col-span-10',
  'col-md-12': 'md:col-span-12',
  'col-lg-3': 'lg:col-span-3',
  'col-lg-4': 'lg:col-span-4',
  'col-lg-6': 'lg:col-span-6',
  'col-lg-8': 'lg:col-span-8',
  'col-lg-9': 'lg:col-span-9',
  'col-lg-12': 'lg:col-span-12',
  'col-xl-3': 'xl:col-span-3',
  'col-xl-4': 'xl:col-span-4',
  'col-xl-6': 'xl:col-span-6',
  'col-xl-8': 'xl:col-span-8',

  // Container
  'container-xxl': '',
  'container-p-y': 'py-6',

  // Spinner
  'spinner-border': 'spinner',
  'spinner-border-sm': 'w-4 h-4',

  // Table
  table: 'w-full',
  'table-hover': '',
  'table-borderless': '',
  'table-sm': 'text-sm',
  'table-light': '',
  'table-responsive': 'overflow-x-auto',

  // Form
  'form-control': 'form-input',
  'form-control-sm': 'form-input text-sm py-1',
  'form-select': 'form-input',
  'form-select-sm': 'form-input text-sm py-1',
  'form-text': 'text-xs text-surface-500 mt-1',
  'form-label': 'form-label',
  'form-check': 'flex items-center gap-2',
  'form-check-input': 'w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500',
  'form-check-label': 'text-sm text-surface-700',
  'form-switch': 'relative inline-flex items-center',
  'form-switch-lg': 'relative inline-flex items-center scale-125',
  'input-group': 'flex items-stretch',
  'input-group-text':
    'flex items-center px-3 bg-surface-100 border border-surface-300 text-surface-600 text-sm rounded-l-lg',
  'input-group-merge': 'flex items-stretch',
  'input-group-sm': 'flex items-stretch text-sm',
  'invalid-feedback': 'text-xs text-danger-500 mt-1',

  // Buttons
  'btn-close': 'cursor-pointer text-surface-500 hover:text-surface-700',
  'btn-group': 'inline-flex rounded-lg shadow-sm',
  'btn-xs': 'btn btn-sm text-xs py-0.5 px-2',
  'btn-secondary': 'btn bg-surface-200 text-surface-700 hover:bg-surface-300',
  'btn-warning': 'btn bg-warning-500 text-white hover:bg-warning-600',
  'btn-link': 'btn bg-transparent text-primary-600 hover:underline shadow-none p-0',
  'btn-ghost': 'btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none',
  'btn-text-secondary': 'btn bg-transparent text-surface-600 hover:bg-surface-100 shadow-none',
  'btn-text-primary': 'btn bg-transparent text-primary-600 hover:bg-primary-50 shadow-none',
  'btn-label-secondary': 'btn bg-surface-100 text-surface-700 hover:bg-surface-200 shadow-none',
  'btn-outline-primary':
    'btn border border-primary-600 text-primary-600 bg-transparent hover:bg-primary-600 hover:text-white',
  'btn-outline-secondary': 'btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100',
  'btn-outline-danger':
    'btn border border-danger-500 text-danger-500 bg-transparent hover:bg-danger-500 hover:text-white',
  'btn-outline-warning':
    'btn border border-warning-500 text-warning-500 bg-transparent hover:bg-warning-500 hover:text-white',
  'btn-outline-info': 'btn border border-info-500 text-info-500 bg-transparent hover:bg-info-500 hover:text-white',
  'btn-outline-success':
    'btn border border-success-500 text-success-500 bg-transparent hover:bg-success-500 hover:text-white',

  // Badge / Label
  'bg-label-primary': 'bg-primary-50 text-primary-600',
  'bg-label-secondary': 'bg-surface-100 text-surface-600',
  'bg-label-success': 'bg-green-50 text-green-700',
  'bg-label-danger': 'bg-red-50 text-red-700',
  'bg-label-warning': 'bg-amber-50 text-amber-700',
  'bg-label-info': 'bg-cyan-50 text-cyan-700',

  // Alert
  'alert-danger': 'alert-danger',
  'alert-warning': 'alert-warning',
  'alert-success': 'alert bg-green-50 text-green-800 border-green-200',
  'alert-primary': 'alert bg-primary-50 text-primary-700 border-primary-200',
  'alert-info': 'alert bg-cyan-50 text-cyan-700 border-cyan-200',
  'alert-heading': 'font-semibold mb-2',

  // Card
  'card-body': 'p-5',
  'card-header': 'px-5 py-4 border-b border-surface-200',
  'card-title': 'text-lg font-semibold text-surface-800 mb-0',
  'card-footer': 'px-5 py-3 border-t border-surface-200',

  // Modal
  modal: 'fixed inset-0 z-50 flex items-center justify-center',
  'modal-dialog': 'w-full max-w-lg mx-4',
  'modal-dialog-centered': '',
  'modal-content': 'bg-white rounded-xl shadow-xl',
  'modal-header': 'flex items-center justify-between p-5 border-b border-surface-200',
  'modal-title': 'text-lg font-semibold text-surface-800',
  'modal-body': 'p-5',
  'modal-footer': 'flex items-center justify-end gap-2 p-5 border-t border-surface-200',
  'modal-backdrop': 'fixed inset-0 bg-black/50 z-40',
  'modal-lg': 'max-w-2xl',

  // Dropdown
  'dropdown-toggle': 'cursor-pointer',
  'dropdown-menu': 'absolute z-50 mt-1 min-w-[160px] bg-white border border-surface-200 rounded-lg shadow-lg py-1',
  'dropdown-menu-end': 'right-0',
  'dropdown-item': 'block w-full px-4 py-2 text-sm text-surface-700 hover:bg-surface-50 cursor-pointer',

  // Nav tabs
  'nav-align-top': '',
  'nav-tabs': 'flex border-b border-surface-200 gap-1',
  'nav-item': '',
  'nav-link':
    'px-4 py-2 text-sm font-medium text-surface-500 hover:text-surface-700 border-b-2 border-transparent hover:border-surface-300',

  // Pagination
  'page-item': 'inline-flex',
  'page-link': 'px-3 py-1.5 text-sm border border-surface-300 text-surface-600 hover:bg-surface-50 rounded',

  // Bootstrap show/fade (remove - handled by React state)
  show: '',
  fade: '',
}

// ─── Regex-based replacements for dynamic patterns ───
const REGEX_PATTERNS = [
  // data-bs-* attributes → remove entirely (Bootstrap JS)
  { regex: /\s*data-bs-toggle="[^"]*"/g, replace: '' },
  { regex: /\s*data-bs-dismiss="[^"]*"/g, replace: '' },
  { regex: /\s*data-bs-target="[^"]*"/g, replace: '' },
  { regex: /\s*data-bs-theme="[^"]*"/g, replace: '' },
]

// ─── File walker ───
function walkDir(dir, exts = ['.jsx', '.tsx']) {
  let files = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (
      stat.isDirectory() &&
      !entry.startsWith('.') &&
      entry !== 'node_modules' &&
      entry !== '.next' &&
      entry !== 'build'
    ) {
      files = files.concat(walkDir(full, exts))
    } else if (stat.isFile() && exts.includes(extname(full))) {
      files.push(full)
    }
  }
  return files
}

// ─── Class replacement logic ───
function replaceClasses(content) {
  let changed = false

  // Replace className strings (both static and template literal parts)
  const newContent = content.replace(
    /(className\s*=\s*{?\s*[`"'])([^`"']*?)([`"'])/g,
    (match, prefix, classes, suffix) => {
      const newClasses = classes
        .split(/\s+/)
        .map((cls) => {
          if (cls === '') return cls
          // Check direct mapping
          if (CLASS_MAP[cls] !== undefined) {
            changed = true
            return CLASS_MAP[cls]
          }
          return cls
        })
        .filter((cls) => cls !== '') // Remove empty strings (from removed classes)
        .join(' ')
      return prefix + newClasses + suffix
    }
  )

  // Also handle className={`...${...}...`} template literals
  let result = newContent.replace(/(className\s*=\s*\{`)([\s\S]*?)(`\})/g, (match, prefix, templateContent, suffix) => {
    // Only replace static text parts (not ${...} expressions)
    const newTemplate = templateContent.replace(
      /(?<!\$\{[^}]*)(\b)(d-flex|d-inline-flex|d-block|d-inline-block|d-inline|d-none|d-grid|align-items-center|align-items-start|align-items-end|align-items-stretch|justify-content-between|justify-content-center|justify-content-end|justify-content-start|flex-grow-1|flex-grow-0|flex-shrink-0|flex-shrink-1|flex-wrap|flex-nowrap|flex-column|flex-row|flex-fill|fw-medium|fw-semibold|fw-bold|fw-normal|fw-light|text-uppercase|text-lowercase|text-capitalize|text-truncate|text-decoration-none|text-nowrap|text-break|rounded-pill|rounded-circle|shadow-none|small|container-xxl|container-p-y|me-[0-5]|me-auto|ms-[0-5]|ms-auto|mb-[0-5]|mt-[0-6]|mt-auto|mx-[0-4]|mx-auto|my-[0-4]|pe-[0-5]|ps-[0-5]|pt-[0-5]|pb-[0-5]|px-[0-5]|py-[0-5]|p-[0-5]|g-[0-5]|row|col-12|col-6|col-auto|col-sm-[0-9]+|col-md-[0-9]+|col-lg-[0-9]+|col-xl-[0-9]+|spinner-border|spinner-border-sm|form-control|form-control-sm|form-select|form-select-sm|form-text|form-check|form-check-input|form-check-label|form-switch|form-switch-lg|input-group|input-group-text|input-group-merge|input-group-sm|invalid-feedback|btn-close|btn-group|btn-xs|btn-secondary|btn-warning|btn-link|btn-ghost|btn-text-secondary|btn-text-primary|btn-label-secondary|btn-outline-primary|btn-outline-secondary|btn-outline-danger|btn-outline-warning|btn-outline-info|btn-outline-success|bg-label-primary|bg-label-secondary|bg-label-success|bg-label-danger|bg-label-warning|bg-label-info|alert-danger|alert-warning|alert-success|alert-primary|alert-info|alert-heading|card-body|card-header|card-title|card-footer|modal-dialog-centered|modal-dialog|modal-content|modal-header|modal-title|modal-body|modal-footer|modal-backdrop|modal-lg|modal|dropdown-toggle|dropdown-menu-end|dropdown-menu|dropdown-item|nav-align-top|nav-tabs|nav-item|nav-link|page-item|page-link|table-responsive|table-hover|table-borderless|table-sm|table-light|show|fade)(\b)/g,
      (m, boundary, cls, endBoundary) => {
        if (CLASS_MAP[cls] !== undefined) {
          changed = true
          return boundary + CLASS_MAP[cls] + endBoundary
        }
        return m
      }
    )
    return prefix + newTemplate + suffix
  })

  // Apply regex patterns (data-bs-* removal etc.)
  for (const { regex, replace } of REGEX_PATTERNS) {
    const before = result
    result = result.replace(regex, replace)
    if (result !== before) changed = true
  }

  return { content: result, changed }
}

// ─── Main ───
const root = process.cwd()
const dirs = ['app', 'components']
let totalFiles = 0
let changedFiles = 0
let totalReplacements = 0

for (const dir of dirs) {
  const fullDir = join(root, dir)
  const files = walkDir(fullDir)

  for (const file of files) {
    totalFiles++
    const original = readFileSync(file, 'utf-8')
    const { content, changed } = replaceClasses(original)

    if (changed) {
      changedFiles++
      // Count approximate replacements
      const lines1 = original.split('\n')
      const lines2 = content.split('\n')
      let diffs = 0
      for (let i = 0; i < Math.max(lines1.length, lines2.length); i++) {
        if (lines1[i] !== lines2[i]) diffs++
      }
      totalReplacements += diffs

      if (!DRY_RUN) {
        writeFileSync(file, content, 'utf-8')
      }
      console.log(`${DRY_RUN ? '[DRY] ' : ''}✓ ${file.replace(root + '/', '')} (${diffs} lines changed)`)
    }
  }
}

console.log(`\n${'═'.repeat(60)}`)
console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Migration complete:`)
console.log(`  Files scanned:  ${totalFiles}`)
console.log(`  Files changed:  ${changedFiles}`)
console.log(`  Lines modified: ~${totalReplacements}`)
console.log(`${'═'.repeat(60)}`)
