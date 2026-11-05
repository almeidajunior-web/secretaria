import { PREFIX, readRaw, writeRaw } from './backend'
import { reportProblem, clearProblem } from './problems'

// One persisted value — a collection or a preference — described once:
//
//   key        name under 'secretaria:' (unchanged from earlier versions, so
//              existing data and exported backups keep working)
//   label      module name shown if something goes wrong with it
//   format     'json' (default) or 'text' for values stored as a bare string
//   empty      value to use when nothing usable is stored and there's no seed
//   seed       first-run value (demo data); omitted = start from `empty`
//   parse      stored → in-memory value: validates and migrates old shapes.
//              Returning undefined means "this isn't readable".
//   serialize  in-memory → stored shape (defaults to the value itself)
//   lenient    unreadable values silently count as "never saved" — for
//              preferences, where an odd value isn't worth an alarm
export function defineStore(def) {
  return {
    format: 'json',
    parse: (v) => v,
    serialize: (v) => v,
    lenient: false,
    ...def,
    storageKey: PREFIX + def.key,
    empty: def.empty ?? (() => null),
  }
}

function decode(store, raw) {
  return store.format === 'text' ? raw : JSON.parse(raw)
}

function encode(store, value) {
  const shaped = store.serialize(value)
  return store.format === 'text' ? String(shaped) : JSON.stringify(shaped)
}

// Turns a stored string into a value, or undefined if it can't be read.
export function parseRaw(store, raw) {
  try {
    return store.parse(decode(store, raw))
  } catch {
    return undefined
  }
}

// Reads a store: { status: 'absent' | 'ok' | 'corrupt', value }.
//
// An unreadable value is never handed back as "absent". Earlier versions did
// exactly that, so the module seeded its demo data and the next save wrote it
// over the person's real (if damaged) data. Now the original text is kept
// under '<key>:corrupted-backup', the module starts from `empty`, and the
// problem is reported so the interface can say so.
export function loadStore(store) {
  const raw = readRaw(store.storageKey)
  if (raw == null) return { status: 'absent', value: undefined }
  const value = parseRaw(store, raw)
  if (value !== undefined) return { status: 'ok', value }
  if (store.lenient) return { status: 'absent', value: undefined }
  try {
    writeRaw(`${store.storageKey}:corrupted-backup`, raw)
  } catch {
    // best effort — the original stays in place either way (see useStoredState)
  }
  reportProblem({ kind: 'corrupt', key: store.key, label: store.label })
  return { status: 'corrupt', value: store.empty() }
}

// What a module starts with: the stored value, the first-run seed, or empty.
export function initialValue(store, loaded, seedOverride) {
  if (loaded.status !== 'absent') return loaded.value
  const seed = seedOverride ?? store.seed
  return seed ? seed() : store.empty()
}

// Saves a value. Skips the write when nothing changed — besides saving work,
// that's what stops two open tabs from echoing the same change back and forth.
// A refused write is reported (and cleared by the next successful one) rather
// than thrown, so a full storage never takes the module down.
export function saveStore(store, value) {
  const raw = encode(store, value)
  if (readRaw(store.storageKey) === raw) return
  try {
    writeRaw(store.storageKey, raw)
    clearProblem('write', store.key)
  } catch {
    reportProblem({ kind: 'write', key: store.key, label: store.label })
  }
}
