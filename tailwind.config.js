/** @type {import('tailwindcss').Config} */

// Each token is written as `rgb(var(--c-x) / <alpha-value>)` rather than a bare
// `var(--c-x)`. With the bare form Tailwind cannot inject an alpha, so every
// `/NN` modifier — the hover tints on all four list views, the destructive
// button hovers, the bulk-action bars, the invoice status badges — compiled to
// nothing at all. The variables in index.css are space-separated RGB channels
// to make this form work.
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: token('primary'),
        'primary-hover': token('primary-hover'),
        'primary-deep': token('primary-deep'),
        'accent-soft': token('accent-soft'),
        surface: token('surface'),
        inset: token('inset'),
        'app-bg': token('app-bg'),
        border: token('border'),
        'border-strong': token('border-strong'),
        text: token('text'),
        'text-secondary': token('text-secondary'),
        'text-muted': token('text-muted'),
        success: token('success'),
        danger: token('danger'),
      },
      // The invoice status badges ask for /12; it isn't in the default scale.
      opacity: {
        12: '0.12',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
