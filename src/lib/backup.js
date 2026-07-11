// Manual backup: bundles every localStorage key this app owns (anything
// under the 'secretaria:' prefix) into one downloadable JSON file, and
// restores it later — a simple, dependency-free safety net against
// accidentally clearing browser data, since everything here is local-first.
const PREFIX = 'secretaria:'

function collectData() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    // Skip the corrupted-events recovery copy (see storage.js loadEvents) —
    // it's leftover recovery debris, not part of the real app state.
    if (key && key.startsWith(PREFIX) && !key.endsWith(':corrupted-backup')) {
      data[key] = localStorage.getItem(key)
    }
  }
  return data
}

export function downloadBackup() {
  const payload = {
    app: 'secretaria',
    exportedAt: new Date().toISOString(),
    data: collectData(),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = payload.exportedAt.slice(0, 10)
  a.href = url
  a.download = `secretaria-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Reads and validates a backup file without touching localStorage yet — the
// caller decides whether to actually restore (after a confirm dialog).
export async function parseBackupFile(file) {
  let parsed
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    throw new Error('Arquivo inválido: não é um JSON válido.')
  }
  const entries = parsed && typeof parsed === 'object' ? Object.entries(parsed.data || {}) : []
  const valid = entries.filter(([key]) => key.startsWith(PREFIX))
  if (valid.length === 0) {
    throw new Error('Arquivo inválido: não parece ser um backup do Secretar.ia.')
  }
  return Object.fromEntries(valid)
}

// Replaces every 'secretaria:' key with the backup's contents. Clears first
// so keys absent from an older backup don't linger mixed with current data.
// Caller is expected to reload the page right after — every hook in the app
// initializes its state from localStorage once, on mount.
export function restoreBackupData(data) {
  // Snapshot the keys before removing any — localStorage.length shrinks as
  // we go, which would skip entries if we removed while iterating live.
  const existingKeys = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(PREFIX)) existingKeys.push(key)
  }
  existingKeys.forEach((key) => localStorage.removeItem(key))
  Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, value))
}
