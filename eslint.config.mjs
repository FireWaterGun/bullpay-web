import nextConfig from 'eslint-config-next'
import bullpayUi from './scripts/eslint-plugin-bullpay-ui.mjs'

const config = [
  ...nextConfig,

  // ── Next.js overrides ──
  {
    rules: {
      '@next/next/no-css-tags': 'off',
      '@next/next/no-page-custom-font': 'off',
      '@next/next/no-img-element': 'warn',
    },
  },

  // ── React Compiler rules (aspirational — downgrade to warn, fix gradually) ──
  {
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },

  // ── Strict JavaScript / TypeScript quality ──
  {
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-implicit-coercion': ['error', { boolean: false }],
      curly: ['error', 'multi-line', 'consistent'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-assign': 'error',
      'no-self-compare': 'error',
      'no-throw-literal': 'error',
      'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
      'prefer-template': 'warn',
      'no-nested-ternary': 'off', // common in JSX conditional rendering
    },
  },

  // ── Bull Pay UI custom rules (JSX/TSX only) ──
  {
    files: ['**/*.jsx', '**/*.tsx'],
    plugins: {
      'bullpay-ui': bullpayUi,
    },
    rules: {
      'bullpay-ui/no-manual-input-addon': 'error',
      'bullpay-ui/no-empty-classname': 'warn',
      'bullpay-ui/no-duplicate-classes': 'error',
      'bullpay-ui/no-bootstrap-classes': 'error',
      'bullpay-ui/no-bootstrap-spacing': 'error',
      'bullpay-ui/no-times-entity': 'error',
      'bullpay-ui/no-conflicting-spacing': 'error',
      'bullpay-ui/require-button-type': 'warn',
    },
  },

  // ── Ignore patterns ──
  {
    ignores: ['build/**', '.next/**', 'node_modules/**', 'scripts/**'],
  },
]

export default config
