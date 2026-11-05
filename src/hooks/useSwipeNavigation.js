import { useEffect, useRef, useState } from 'react'

// Cumulative horizontal delta (px) needed to trigger a period change.
const THRESHOLD = 70
// Ignore further horizontal wheel events for this long after triggering, so a
// single continuous swipe doesn't flip through multiple periods.
const COOLDOWN_MS = 500
// A gap this long between wheel events means the previous gesture ended.
const GAP_RESET_MS = 150

// Trackpad two-finger horizontal swipe → step to the previous/next period.
// Vertical-dominant wheel events (normal scrolling) are left untouched so the
// grid keeps scrolling natively. Returns a ref callback for the agenda's view
// container.
//
// The listener is attached natively with `passive: false`: React registers
// its own onWheel as passive, where preventDefault() is ignored (and Chrome
// logs a warning) — so the browser's own swipe-back gesture could still fire
// on top of the period change.
export function useSwipeNavigation(onPrev, onNext) {
  const [el, setEl] = useState(null)
  // Latest callbacks, read at event time so the listener never needs
  // re-binding when the parent re-renders.
  const handlers = useRef({ onPrev, onNext })
  handlers.current = { onPrev, onNext }

  useEffect(() => {
    if (!el) return
    let accum = 0
    let locked = false
    let lastEventTime = 0
    let unlockTimer = null

    const onWheel = (event) => {
      if (event.ctrlKey) return // pinch-to-zoom, not a pan
      const { deltaX, deltaY } = event
      if (Math.abs(deltaX) <= Math.abs(deltaY)) return // vertical scroll, ignore

      const now = Date.now()
      if (now - lastEventTime > GAP_RESET_MS) accum = 0
      lastEventTime = now

      event.preventDefault()
      if (locked) return

      accum += deltaX
      if (Math.abs(accum) < THRESHOLD) return

      if (accum > 0) handlers.current.onNext()
      else handlers.current.onPrev()

      accum = 0
      locked = true
      clearTimeout(unlockTimer)
      unlockTimer = setTimeout(() => {
        locked = false
      }, COOLDOWN_MS)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
      clearTimeout(unlockTimer)
    }
  }, [el])

  return setEl
}
