import { useSyncExternalStore } from 'react'

// Storage problems the person needs to know about — kept outside React so the
// low-level read/write code can report them, and any component can show them.
//
//   write:   the browser refused to save (storage full or disabled); the
//            change only lives in this tab until it's fixed.
//   corrupt: something stored couldn't be read; it was set aside under a
//            ':corrupted-backup' key instead of being overwritten.
let problems = []
const listeners = new Set()

function emit() {
  listeners.forEach((l) => l())
}

export function reportProblem(problem) {
  const id = `${problem.kind}:${problem.key}`
  if (problems.some((p) => p.id === id)) return
  problems = [...problems, { ...problem, id }]
  emit()
}

export function clearProblem(kind, key) {
  const id = `${kind}:${key}`
  if (!problems.some((p) => p.id === id)) return
  problems = problems.filter((p) => p.id !== id)
  emit()
}

export function dismissProblems() {
  problems = []
  emit()
}

export function getProblems() {
  return problems
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useStorageProblems() {
  return useSyncExternalStore(subscribe, getProblems, getProblems)
}
