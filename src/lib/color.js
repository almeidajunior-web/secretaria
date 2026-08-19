// HSL helpers backing the dark-mode treatment of data-driven colors: large
// opaque blocks (Planejamento grid cells, Agenda confirmed-status event
// cards) via fillColorForTheme, and small colored text/dots (tag, priority,
// status and category chips) via darkInkColor/tintVars.
// Builds on constants.js/withAlpha, which stays the simple hex->rgba
// primitive behind the app's low-alpha tint convention.

import { withAlpha } from '../constants'

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

const DARK_FILL_S_CAP = 78 // reins in saturated defaults (red/purple/olive/etc sit at
// 71-95%) without flattening them — large blocks were explicitly asked to read
// calmer than the raw palette, so this stays a real cap, just a looser one
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

// Relative luminance (WCAG) of an [r,g,b] triple, and the contrast ratio
// between two of them. Needed because the ink treatment below targets a
// contrast number instead of a fixed lightness.
function relLuminance([r, g, b]) {
  const f = (v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

function contrast(a, b) {
  const [hi, lo] = [relLuminance(a), relLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}

// The lightest surface a chip actually lands on in dark mode: its own
// low-alpha tint composited over the glass card, which itself sits on the
// gradient ground. Measured rather than guessed, and deliberately a little
// lighter than any real backdrop so the result holds on all of them.
const DARK_INK_REF_BG = [30, 42, 70]
const DARK_INK_TARGET = 4.6 // a hair over the 4.5:1 reading bar

const DARK_INK_S_FLOOR = 32 // the default gray (#6B7280, S 9%) needs chroma or
// it lands on the same blue-gray as --c-text-secondary and stops reading as a
// deliberate tag color
const DARK_INK_S_CAP = 90 // only reins in a genuinely neon custom pick; the
// stock palette (S 64-95) now keeps essentially all of its chroma
const DARK_INK_L_FLOOR = 52 // contrast alone would let green/cyan/olive settle
// around L35: legible, but a dark color on a dark ground reads as recessed
// rather than lit. This floor is what makes them look alive; it never lowers a
// color, so it cannot break the contrast the search below guarantees
const DARK_INK_L_CEIL = 82 // stops the search before a hue washes out to white

// Returns the color to paint a data color as TEXT (or as a small dot) with in
// dark mode.
//
// Lightness is raised only until the color clears the reading bar, then the
// search stops. A fixed floor (this used to sit at L66) has to be set for the
// worst hue in the palette, so every other hue overshoots it: green landed at
// 10.9:1 and olive at 11.5:1 against a 4.5:1 target, and all ten colors came
// out at the same lightness — which is precisely what made them read as one
// washed-out pastel family instead of ten distinct colors. Targeting the
// contrast number instead lets a green stay green and only lifts navy, the
// one color that genuinely cannot be read as-is.
const inkCache = new Map()

export function darkInkColor(hex) {
  if (!hex) return hex
  const cached = inkCache.get(hex)
  if (cached) return cached

  const [h, s, l] = hexToHsl(hex)
  const s2 = Math.min(Math.max(s, DARK_INK_S_FLOOR), DARK_INK_S_CAP)
  let l2 = Math.max(l, DARK_INK_L_FLOOR)
  let out = hslToHex(h, s2, l2)
  while (l2 < DARK_INK_L_CEIL && contrast(hexToRgb(out), DARK_INK_REF_BG) < DARK_INK_TARGET) {
    l2 += 1
    out = hslToHex(h, s2, l2)
  }

  inkCache.set(hex, out)
  return out
}

// Inline style carrying BOTH theme variants of a data color, consumed by the
// .tint-ink / .tint-fill / .tint-soft classes in index.css, which pick one
// under the `dark` class already on <html>.
//
// Why CSS picks instead of an `isDark` prop: fillColorForTheme's two consumers
// live in modules that already receive `isDark`, but these chips render from
// ChipSelect and TagPickerPopover — shared leaves used by Tarefas, Compras,
// Vencimentos and Finanças, and Tarefas doesn't take `isDark` at all. Emitting
// both variants keeps the math here without threading a prop through four
// module trees.
export function tintVars(hex, softAlpha = 0.15) {
  if (!hex) return undefined
  const dark = darkInkColor(hex)
  return {
    '--tint': hex,
    '--tint-soft': withAlpha(hex, softAlpha),
    '--tint-dark': dark,
    '--tint-soft-dark': withAlpha(dark, softAlpha),
  }
}
