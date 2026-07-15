// HSL helpers backing the dark-mode fill treatment for large, opaque color
// blocks (Planejamento grid cells, Agenda confirmed-status event cards).
// Separate from constants.js/withAlpha, which stays the simple hex->rgba
// primitive used by the existing low-alpha tag/tint convention elsewhere.

// #rrggbb -> [h(0-360), s(0-100), l(0-100)]
export function hexToHsl(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let hh = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        hh = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        hh = (b - r) / d + 2
        break
      default:
        hh = (r - g) / d + 4
    }
    hh /= 6
  }
  return [hh * 360, s * 100, l * 100]
}

// [h,s,l] -> "#RRGGBB"
export function hslToHex(h, s, l) {
  const s1 = s / 100
  const l1 = l / 100
  const k = (n) => (n + h / 30) % 12
  const a = s1 * Math.min(l1, 1 - l1)
  const f = (n) => l1 - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0')
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase()
}

const DARK_FILL_S_CAP = 68 // reins in saturated defaults (red/purple/olive/etc sit at 71-95%)
const DARK_FILL_S_FLOOR = 20 // gives near-gray colors (default gray sits at 9%) enough chroma
// to read as an intentional color instead of blending with the app's own
// neutral chrome (--c-border/--c-text-muted are also low-saturation blue-grays)
const DARK_FILL_L_FLOOR = 50 // guarantees legibility for very dark colors (default navy sits
// at L33%) against the near-black app bg (#0b1220, L8%)
const DARK_FILL_L_CEIL = 64 // guards arbitrary very light custom hex picks from blowing out
// toward white

// Returns the color to paint a large, opaque fill (planning grid cell,
// confirmed-status event card) with.
//
// Light mode (isDark=false): returns `hex` unchanged - zero visual change
// from prior behavior.
//
// Dark mode: clamps saturation/lightness in HSL space and returns a new
// opaque hex - there is no alpha/rgba step. Alpha-compositing a dark color
// over the app's already-dark surfaces would pull the visible result
// further down, not lighten it - so the lightness floor has to happen in
// HSL space before any transparency, and once it has, no transparency is
// needed to get a calm, legible, "clearly colored" block.
export function fillColorForTheme(hex, isDark) {
  if (!isDark || !hex) return hex
  const [h, s, l] = hexToHsl(hex)
  const s2 = Math.min(Math.max(s, DARK_FILL_S_FLOOR), DARK_FILL_S_CAP)
  const l2 = Math.min(Math.max(l, DARK_FILL_L_FLOOR), DARK_FILL_L_CEIL)
  return hslToHex(h, s2, l2)
}
