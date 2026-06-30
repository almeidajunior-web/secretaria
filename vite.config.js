import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// `base: './'` uses relative asset paths so the same build works when served
// from a sub-path (GitHub Pages) or from the root (Netlify/Vercel).
export default defineConfig({
  base: './',
  plugins: [react()],
})
