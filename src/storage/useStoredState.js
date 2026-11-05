import { useEffect, useRef, useState } from 'react'
import { subscribeExternalChanges } from './backend'
import { loadStore, initialValue, parseRaw, saveStore } from './store'

// useState for a persisted store (see stores.js): starts from what's saved
// (or the first-run seed), saves every change, and follows changes made in
// another open tab of the app.
//
// Following other tabs is what keeps two tabs from silently undoing each
// other: each tab holds a whole collection in memory and saves it whole, so
// before this, a save from a tab that hadn't seen the other tab's changes
// wrote the old collection right over them.
//
// `options.seed` overrides the store's own first-run value.
export function useStoredState(store, options = {}) {
  const loadedRef = useRef(null)
  if (loadedRef.current === null) loadedRef.current = loadStore(store)
  const [value, setValue] = useState(() => initialValue(store, loadedRef.current, options.seed))

  // An unreadable value stays where it is (a copy is also set aside) until
  // this module actually changes something — the very first save is skipped
  // for it, unlike seeds and migrated data, which are written right away.
  const skipNextSave = useRef(loadedRef.current.status === 'corrupt')
  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    saveStore(store, value)
  }, [store, value])

  useEffect(
    () =>
      subscribeExternalChanges((key, raw) => {
        if (key !== store.storageKey || raw == null) return
        const next = parseRaw(store, raw)
        if (next !== undefined) setValue(next)
      }),
    [store]
  )

  return [value, setValue]
}
