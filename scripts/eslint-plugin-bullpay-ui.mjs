/**
 * Bull Pay — Custom ESLint rules for UI pattern enforcement.
 *
 * These rules provide real-time red/yellow squiggles in VS Code
 * for common anti-patterns caught by the UI lint script.
 */

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Extract the raw string value from a JSXAttribute value node. */
function getClassNameString(node) {
  if (!node || !node.value) return null
  // className="literal"
  if (node.value.type === 'Literal') return node.value.value
  // className={`...`} — only handle simple template literals (no expressions)
  if (
    node.value.type === 'JSXExpressionContainer' &&
    node.value.expression.type === 'TemplateLiteral' &&
    node.value.expression.quasis.length === 1
  ) {
    return node.value.expression.quasis[0].value.raw
  }
  return null
}

// ── Rules ───────────────────────────────────────────────────────────────────

const rules = {
  /**
   * Disallow manual input addon spans — enforce InputGroup + InputAddon.
   */
  'no-manual-input-addon': {
    meta: {
      type: 'suggestion',
      docs: { description: 'Disallow manual input addon <span>; use <InputGroup> + <InputAddon>.' },
      schema: [],
      messages: {
        found: 'Manual input addon. Use <InputGroup> + <InputAddon> or <InputIcon> from @/components/ui.',
      },
    },
    create(context) {
      return {
        JSXAttribute(node) {
          if (node.name.name !== 'className') return
          const val = getClassNameString(node)
          if (!val) return
          if (
            /flex items-center/.test(val) &&
            /(?:bg-surface-100|border-surface-300)/.test(val) &&
            /rounded-[lr]-lg/.test(val)
          ) {
            // Check if this is inside a UI component file (allow there)
            const filename = context.getFilename?.() || context.filename || ''
            if (/components\/ui\//.test(filename)) return
            context.report({ node, messageId: 'found' })
          }
        },
      }
    },
  },

  /**
   * Disallow empty className="".
   */
  'no-empty-classname': {
    meta: {
      type: 'suggestion',
      docs: { description: 'Disallow empty className="" attributes.' },
      fixable: 'code',
      schema: [],
      messages: {
        empty: 'Empty className="". Remove this attribute.',
      },
    },
    create(context) {
      return {
        JSXAttribute(node) {
          if (node.name.name !== 'className') return
          const val = getClassNameString(node)
          if (val === '') {
            context.report({
              node,
              messageId: 'empty',
              fix: (fixer) => fixer.remove(node),
            })
          }
        },
      }
    },
  },

  /**
   * Disallow duplicate CSS classes in className.
   */
  'no-duplicate-classes': {
    meta: {
      type: 'problem',
      docs: { description: 'Disallow duplicate CSS classes in className.' },
      schema: [],
      messages: {
        dup: 'Duplicate class "{{cls}}" in className.',
      },
    },
    create(context) {
      return {
        JSXAttribute(node) {
          if (node.name.name !== 'className') return
          const val = getClassNameString(node)
          if (!val) return
          const classes = val.split(/\s+/).filter(Boolean)
          const seen = new Set()
          for (const cls of classes) {
            if (seen.has(cls)) {
              context.report({ node, messageId: 'dup', data: { cls } })
              return
            }
            seen.add(cls)
          }
        },
      }
    },
  },

  /**
   * Disallow Bootstrap classes in className.
   */
  'no-bootstrap-classes': {
    meta: {
      type: 'problem',
      docs: { description: 'Disallow Bootstrap CSS classes.' },
      schema: [],
      messages: {
        found: 'Bootstrap class "{{cls}}" detected. Use Tailwind equivalent or UI component.',
      },
    },
    create(context) {
      const BOOTSTRAP_RE = /^(?:btn-(?:primary|secondary|danger|success|outline|close|sm|lg)|card-(?:body|header|footer)|modal-(?:dialog|content|header|body|footer)|form-(?:control|select|check|label|group)|input-group-text|dropdown-(?:menu|item|toggle)|nav-(?:tabs|link)|spinner-border|progress-bar|container-fluid|d-flex|d-none|d-block|fw-bold|fw-semibold|fw-normal|rounded-circle|text-muted|text-body|bg-light)$/
      return {
        JSXAttribute(node) {
          if (node.name.name !== 'className') return
          const val = getClassNameString(node)
          if (!val) return
          for (const cls of val.split(/\s+/)) {
            if (BOOTSTRAP_RE.test(cls)) {
              context.report({ node, messageId: 'found', data: { cls } })
              return
            }
          }
        },
      }
    },
  },

  /**
   * Disallow &times; HTML entity — use bx-x icon.
   */
  'no-times-entity': {
    meta: {
      type: 'problem',
      docs: { description: 'Disallow × character as close button. Allow in math context (code, InputAddon).' },
      schema: [],
      messages: {
        found: '× used as close button. Use <i className="bx bx-x"></i> instead.',
      },
    },
    create(context) {
      /** Check if JSXText parent is a math-context element (code, pre, InputAddon). */
      function isMathContext(node) {
        let parent = node.parent
        while (parent) {
          if (parent.type === 'JSXElement' && parent.openingElement?.name) {
            const name = parent.openingElement.name.name || ''
            if (/^(?:code|pre|InputAddon|kbd|samp)$/.test(name)) return true
          }
          parent = parent.parent
        }
        return false
      }
      return {
        JSXText(node) {
          if (!(node.value.includes('×') || node.raw?.includes('&times;'))) return
          if (isMathContext(node)) return
          context.report({ node, messageId: 'found' })
        },
      }
    },
  },

  /**
   * Disallow conflicting spacing classes (e.g. p-5 p-4).
   */
  'no-conflicting-spacing': {
    meta: {
      type: 'problem',
      docs: { description: 'Disallow conflicting spacing classes like p-5 p-4.' },
      schema: [],
      messages: {
        conflict: 'Conflicting spacing classes: "{{a}}" and "{{b}}".',
      },
    },
    create(context) {
      return {
        JSXAttribute(node) {
          if (node.name.name !== 'className') return
          const val = getClassNameString(node)
          if (!val) return
          const classes = val.split(/\s+/).filter(Boolean)
          const prefixes = {}
          for (const cls of classes) {
            const m = cls.match(/^(!?)?(p|m|px|py|mx|my|pt|pb|pl|pr|mt|mb|ml|mr)-/)
            if (m) {
              const key = (m[1] || '') + m[2]
              if (prefixes[key]) {
                context.report({ node, messageId: 'conflict', data: { a: prefixes[key], b: cls } })
                return
              }
              prefixes[key] = cls
            }
          }
        },
      }
    },
  },

  /**
   * Disallow Bootstrap spacing classes (me-, ms-, pe-, ps-).
   */
  'no-bootstrap-spacing': {
    meta: {
      type: 'problem',
      docs: { description: 'Disallow Bootstrap spacing classes (me-, ms-, pe-, ps-). Use Tailwind equivalents.' },
      schema: [],
      messages: {
        found: 'Bootstrap spacing class "{{cls}}". Use {{replacement}} instead.',
      },
    },
    create(context) {
      const BOOTSTRAP_SPACING_RE = /^(me|ms|pe|ps)-(\S+)$/
      const REPLACEMENTS = { me: 'mr', ms: 'ml', pe: 'pr', ps: 'pl' }
      return {
        JSXAttribute(node) {
          if (node.name.name !== 'className') return
          const val = getClassNameString(node)
          if (!val) return
          for (const cls of val.split(/\s+/)) {
            const match = cls.match(BOOTSTRAP_SPACING_RE)
            if (match) {
              const replacement = REPLACEMENTS[match[1]] + '-' + match[2]
              context.report({ node, messageId: 'found', data: { cls, replacement } })
              return
            }
          }
        },
      }
    },
  },

  /**
   * Require type attribute on <button> elements.
   */
  'require-button-type': {
    meta: {
      type: 'suggestion',
      docs: { description: 'Require type attribute on <button> elements to prevent accidental form submission.' },
      schema: [],
      messages: {
        missing: '<button> is missing type attribute. Add type="button" or type="submit".',
      },
    },
    create(context) {
      return {
        JSXOpeningElement(node) {
          if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'button') return
          const hasType = node.attributes.some(
            (attr) => attr.type === 'JSXAttribute' && attr.name.name === 'type'
          )
          if (!hasType) {
            context.report({ node, messageId: 'missing' })
          }
        },
      }
    },
  },
}

// ── Plugin export ───────────────────────────────────────────────────────────

const plugin = {
  meta: {
    name: 'eslint-plugin-bullpay-ui',
    version: '1.0.0',
  },
  rules,
}

export default plugin
