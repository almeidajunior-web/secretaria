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

const DARK_INK_S_CAP = 70 // same intent as the fill cap, a touch looser: small
// glyphs carry less area, so a vivid hue reads as accent rather than as noise
const DARK_INK_S_FLOOR = 25 // the default gray (#6B7280, S 9%) needs chroma or
// it lands on the same blue-gray as --c-text-secondary and stops reading as a
// deliberate tag color
const DARK_INK_L_FLOOR = 66 // text needs a higher floor than the fill's 50: a
// small glyph at L50 sits near 3:1 against --c-surface (#1e293b), under the
// 4.5:1 reading bar, while L66 clears it
const DARK_INK_L_CEIL = 80 // keeps a very light custom pick from washing out

// Returns the color to paint a data color as TEXT (or as a small dot) with in
// dark mode. Same clamp as fillColorForTheme, different floors — see the
// constants above for why text can't reuse the fill's numbers.
export function darkInkColor(hex) {
  if (!hex) return hex
  const [h, s, l] = hexToHsl(hex)
  const s2 = Math.min(Math.max(s, DARK_INK_S_FLOOR), DARK_INK_S_CAP)
  const l2 = Math.min(Math.max(l, DARK_INK_L_FLOOR), DARK_INK_L_CEIL)
  return hslToHex(h, s2, l2)
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
