import { useCallback, useRef } from 'react'

// Cumulative horizontal delta (px) needed to trigger a period change.
const THRESHOLD = 70
// Ignore further horizontal wheel events for this long after triggering, so a
// single continuous swipe doesn't flip through multiple periods.
const COOLDOWN_MS = 500
// A gap this long between wheel events means the previous gesture ended.
const GAP_RESET_MS = 150

// Trackpad two-finger horizontal swipe → step to the previous/next period.
// Vertical-dominant wheel events (normal scrolling) are left untouched so the
// grid keeps scrolling natively. Returns an `onWheel` handler to spread onto
// the agenda's view container.
export function useSwipeNavigation(onPrev, onNext) {
  const accum = useRef(0)
  const locked = useRef(false)
  const lastEventTime = useRef(0)
  const unlockTimer = useRef(null)

  const onWheel = useCallback(
    (event) => {
      if (event.ctrlKey) return // pinch-to-zoom, not a pan
      const { deltaX, deltaY } = event
      if (Math.abs(deltaX) <= Math.abs(deltaY)) return // vertical scroll, ignore

      const now = Date.now()
      if (now - lastEventTime.current > GAP_RESET_MS) accum.current = 0
      lastEventTime.current = now

      event.preventDefault()
      if (locked.current) return

      accum.current += deltaX
      if (Math.abs(accum.current) < THRESHOLD) return

      if (accum.current > 0) onNext()
      else onPrev()

      accum.current = 0
      locked.current = true
      clearTimeout(unlockTimer.current)
      unlockTimer.current = setTimeout(() => {
        locked.current = false
      }, COOLDOWN_MS)
    },
    [onPrev, onNext]
  )

  return onWheel
}
