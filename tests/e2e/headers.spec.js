import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import { openApp, goTo } from './helpers'

// Runs the app under the exact Content-Security-Policy netlify.toml sends in
// production, and fails on any violation — so a change that would only break
// once deployed (an inline script, a new external host) breaks here first.
const CSP = readFileSync(new URL('../../netlify.toml', import.meta.url), 'utf8').match(
  /Content-Security-Policy = "([^"]+)"/
)[1]

test('the app works under the production security policy', async ({ page }) => {
  // The browser's own violation event, recorded from the first script on.
  await page.addInitScript(() => {
    window.__cspViolations = []
    document.addEventListener('securitypolicyviolation', (e) =>
      window.__cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`)
    )
  })
  const violations = []
  page.on('console', (m) => {
    if (/Content Security Policy/i.test(m.text())) violations.push(m.text())
  })
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue()
    const response = await route.fetch()
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': CSP } })
  })

  await openApp(page)
  for (const label of ['Agenda', 'Planejamento', 'Tarefas', 'Compras', 'Vencimentos', 'Finanças', 'Metas']) {
    await goTo(page, label)
    await expect(page.getByText('Algo deu errado neste módulo')).toHaveCount(0)
  }
  // Downloads go through blob: URLs — the spreadsheet and the backup.
  await goTo(page, 'Finanças')
  await page.getByRole('button', { name: 'Lançamentos', exact: true }).click()
  const [xlsx] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar' }).click()])
  expect(xlsx.suggestedFilename()).toMatch(/\.xlsx$/)
  await page.locator('header').getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('button', { name: 'Backup' }).click()
  const [backup] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Exportar backup/ }).click()])
  expect(backup.suggestedFilename()).toMatch(/\.json$/)

  violations.push(...(await page.evaluate(() => window.__cspViolations)))
  expect(violations).toEqual([])
})
