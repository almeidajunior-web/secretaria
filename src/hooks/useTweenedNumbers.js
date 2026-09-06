import { useEffect, useRef, useState } from 'react'

const DURATION = 380
// Standard ease-out cubic: fast departure, soft landing. Matches how the rest
// of the interface's 150ms color fades feel, just over a longer distance.
const ease = (t) => 1 - (1 - t) ** 3

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Slides an array of numbers toward its next value instead of snapping.
//
// An SVG path's `d` can't be transitioned by CSS, so the way to animate a
// hand-rolled chart is to animate the *data* and let the path be recomputed
// each frame — that's what this returns. The loop only runs while something
// is actually moving, and stops on its own.
//
// `null` entries pass through untouched: in the habit chart they mean "no
// habit scheduled that day", which is a gap in the line, not a zero to ease
// toward.
export function useTweenedNumbers(target) {
  const [values, setValues] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef(0)
  const startRef = useRef(0)

  useEffect(() => {
    // Reduced motion, or a change in the number of points (period switch,
    // habit added) — there's no meaningful interpolation between arrays of
    // different lengths, so land on the new shape immediately.
    if (prefersReducedMotion() || fromRef.current.length !== target.length) {
      fromRef.current = target
      setValues(target)
      return
    }

    const from = fromRef.current
    startRef.current = performance.now()

    const step = (now) => {
      const t = Math.min(1, (now - startRef.current) / DURATION)
      const k = ease(t)
      const next = target.map((to, i) => {
        const start = from[i]
        if (to == null || start == null) return to
        return start + (to - start) * k
      })
      setValues(next)
      fromRef.current = next
      if (t < 1) rafRef.current = requestAnimationFrame(step)
      else fromRef.current = target
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
    // Compared by content: the caller rebuilds this array every render, so a
    // reference check would restart the tween on every unrelated re-render.
  }, [JSON.stringify(target)]) // eslint-disable-line react-hooks/exhaustive-deps

  return values
}
