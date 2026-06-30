/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--c-primary)',
        'primary-hover': 'var(--c-primary-hover)',
        'primary-deep': 'var(--c-primary-deep)',
        'accent-soft': 'var(--c-accent-soft)',
        surface: 'var(--c-surface)',
        'app-bg': 'var(--c-app-bg)',
        sidebar: 'var(--c-sidebar)',
        border: 'var(--c-border)',
        'border-strong': 'var(--c-border-strong)',
        text: 'var(--c-text)',
        'text-secondary': 'var(--c-text-secondary)',
        'text-muted': 'var(--c-text-muted)',
        success: 'var(--c-success)',
        danger: 'var(--c-danger)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
