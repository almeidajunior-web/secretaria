import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// `base: './'` uses relative asset paths so the same build works when served
// from a sub-path or from the root (Netlify).
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    // Unit tests cover the pure logic (src/**/*.test.js); the browser
    // end-to-end suite lives in tests/e2e and runs through Playwright.
    include: ['src/**/*.test.{js,jsx}'],
    environment: 'node',
  },
})
