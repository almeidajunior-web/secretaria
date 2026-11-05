import { expect } from '@playwright/test'

// Every spec runs on Tuesday, 10 March 2026, 10:00 (São Paulo).
export const TODAY = '2026-03-10'
export const NOW = new Date('2026-03-10T10:00:00-03:00')

// Opens the app on a frozen clock with exactly `data` in storage (keys are
// the storage names without the 'secretaria:' prefix). Keys left out are
// simply absent, so that module falls back to its first-run demo data —
// pass an empty array to start a module empty instead.
//
// The data is written before any of the app's own scripts run, and only on
// the page's first load (a sessionStorage marker survives reloads), so later
// reloads in a test see what the app saved. Writing it after a first load
// instead raced the lazily-loaded module screens, which could save their
// default preferences on top of the test's.
export async function openApp(page, data = {}, { module } = {}) {
  await page.clock.setFixedTime(NOW)
  await page.addInitScript((entries) => {
    if (sessionStorage.getItem('__seeded')) return
    sessionStorage.setItem('__seeded', '1')
    localStorage.clear()
    for (const [key, value] of Object.entries(entries)) {
      // The theme is the one key stored as a bare string, not as JSON.
      const raw = key === 'theme' ? value : JSON.stringify(value)
      localStorage.setItem(`secretaria:${key}`, raw)
    }
  }, data)
  await page.goto('/')
  if (module) await goTo(page, module)
}

export async function goTo(page, label) {
  await page.locator('header nav').getByRole('button', { name: label, exact: true }).click()
}

export async function readStore(page, key) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(`secretaria:${k}`)), key)
}

// Fails the test on any uncaught page error — a crash in a module would
// otherwise only show up as a missing element much later.
export function trackErrors(page) {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  return {
    assertNone: () => expect(errors, errors.join('\n')).toEqual([]),
  }
}
