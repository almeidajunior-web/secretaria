import { useEffect, useState } from 'react'

// Ticks a `Date` once a minute — shared clock for "current time" indicators
// (Agenda's NowLine, Planejamento's now-line).
export function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])
  return now
}
