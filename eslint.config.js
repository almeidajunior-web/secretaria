import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

// Lint is a safety net, not a style guide: it flags code that is wrong or
// likely to break (unused variables, hook misuse, undefined names), and leaves
// formatting to the existing house style.
export default [
  { ignores: ['dist', 'node_modules', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: '18.3' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Straight quotes in JSX text render fine; escaping them is noise.
      'react/no-unescaped-entities': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Node-side files: tooling configs and the test suites.
    files: ['*.config.js', 'tests/**/*.js', 'src/**/*.test.js'],
    languageOptions: { globals: { ...globals.node } },
  },
]
