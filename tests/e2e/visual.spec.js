import { test, expect } from '@playwright/test'
import { openApp, goTo } from './helpers'

// Pixel comparison of every module, light and dark, on the first-run demo
// data (deterministic: the clock is frozen, so the seeds always land on the
// same days). Screenshots depend on the machine's fonts, so baselines are
// local, not committed: record them before a refactor with
//   npm run test:visual -- --update-snapshots
// and compare after with `npm run test:visual`. Excluded from CI.
const MODULES = ['Agenda', 'Planejamento', 'Tarefas', 'Compras', 'Vencimentos', 'Finanças', 'Metas']

for (const theme of ['light', 'dark']) {
  test.describe(`@visual ${theme}`, () => {
    for (const label of MODULES) {
      test(`${label}`, async ({ page }) => {
        await openApp(page, { theme })
        await goTo(page, label)
        await page.waitForTimeout(600) // let the chart tweens settle
        await expect(page).toHaveScreenshot(`${label}-${theme}.png`, { fullPage: true, animations: 'disabled' })
      })
    }

    test('Finanças Lançamentos', async ({ page }) => {
      await openApp(page, { theme, financeTab: 'lancamentos' })
      await goTo(page, 'Finanças')
      await expect(page).toHaveScreenshot(`Financas-lancamentos-${theme}.png`, { animations: 'disabled' })
    })

    test('Tarefas Kanban', async ({ page }) => {
      await openApp(page, { theme, tasksViewMode: 'kanban' })
      await goTo(page, 'Tarefas')
      await expect(page).toHaveScreenshot(`Tarefas-kanban-${theme}.png`, { animations: 'disabled' })
    })

    test('Agenda mês e modal', async ({ page }) => {
      await openApp(page, { theme, agendaViewMode: 'month' })
      await expect(page).toHaveScreenshot(`Agenda-mes-${theme}.png`, { animations: 'disabled' })
      await page.getByRole('button', { name: 'Novo evento' }).click()
      await expect(page).toHaveScreenshot(`Agenda-modal-${theme}.png`, { animations: 'disabled' })
    })

    test('Configurações', async ({ page }) => {
      await openApp(page, { theme })
      await page.locator('header').getByRole('button', { name: 'Configurações' }).click()
      await expect(page).toHaveScreenshot(`Configuracoes-${theme}.png`, { animations: 'disabled' })
    })
  })
}
