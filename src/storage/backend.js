// The one place the app touches the browser's storage. Every persistent
// value — domain data and UI preferences alike — is read and written through
// these functions, so moving the data somewhere else (a sync service behind a
// login, for the mobile version) means replacing this file, not the modules.
//
// Today it is localStorage. Access is guarded because the browser can refuse
// it outright (storage disabled, some private modes): reads then behave as
// "nothing stored" and writes report failure to the caller instead of
// crashing the app at startup.

export const PREFIX = 'secretaria:'

function storage() {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function readRaw(key) {
  try {
    return storage()?.getItem(key) ?? null
  } catch {
    return null
  }
}

// Throws when the browser refuses the write (quota exceeded, storage
// disabled) — the caller decides how to surface that.
export function writeRaw(key, raw) {
  const s = storage()
  if (!s) throw new Error('storage unavailable')
  s.setItem(key, raw)
}

export function removeRaw(key) {
  try {
    storage()?.removeItem(key)
  } catch {
    // nothing to do: an unavailable storage has nothing to remove
  }
}

export function allKeys() {
  const s = storage()
  if (!s) return []
  try {
    const keys = []
    for (let i = 0; i < s.length; i++) keys.push(s.key(i))
    return keys.filter(Boolean)
  } catch {
    return []
  }
}

// Calls `listener(key, raw)` whenever ANOTHER tab of the app changes a value
// (the browser only reports changes made elsewhere). Returns an unsubscribe.
export function subscribeExternalChanges(listener) {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (e) => {
    if (e.storageArea && e.storageArea !== storage()) return
    if (e.key) listener(e.key, e.newValue)
  }
  window.addEventListener('storage', onStorage)
  return () => window.removeEventListener('storage', onStorage)
}
