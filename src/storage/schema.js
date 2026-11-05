import { PREFIX, readRaw, writeRaw } from './backend'

// Version of the stored data format. Bump it together with a migration in
// `migrate` below when a stored shape changes in a way stores.js's per-store
// `parse` can't absorb on its own.
export const SCHEMA_VERSION = 1
const KEY = `${PREFIX}schemaVersion`

// Runs once, before the app renders.
export function ensureSchemaVersion() {
  const stored = Number(readRaw(KEY))
  if (stored === SCHEMA_VERSION) return
  // No migrations yet — just stamp the current version.
  try {
    writeRaw(KEY, String(SCHEMA_VERSION))
  } catch {
    // storage unavailable: nothing to migrate either
  }
}
