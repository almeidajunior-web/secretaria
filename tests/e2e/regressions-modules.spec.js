import { test, expect } from '@playwright/test'
import { openApp, readStore, trackErrors, NOW } from './helpers'

// Regression tests for bugs found in the November 2026 code review.

const planning = {
  categories: [{ id: 'trab', label: 'Trabalho', color: '#2563EB' }],
  grid: {},
  splits: {},
  hourStart: 6,
  hourEnd: 22,
}
const cell = (page, hour, dayIndex = 0) =>
  page
    .locator('div', { hasText: new RegExp(`^${String(hour).padStart(2, '0')}H$`) })
    .locator(`xpath=following-sibling::div[${dayIndex + 1}]`)

test('a brush whose category was deleted stops painting', async ({ page }) => {
  await openApp(page, { planning }, { module: 'Planejamento' })
  await page.getByRole('button', { name: /^Trabalho/ }).click()
  await page.locator('main').getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('button', { name: 'Excluir categoria Trabalho' }).click()
  await page.getByRole('button', { name: 'Excluir', exact: true }).click()
  await page.getByRole('button', { name: 'Fechar' }).click()
  await cell(page, 8).click()
  expect((await readStore(page, 'planning')).grid).toEqual({})
})

test('saving an empty description removes it instead of leaving an empty note', async ({ page }) => {
  await openApp(page, { planning: { ...planning, grid: { '0:8': { categoryId: 'trab', description: 'Foco' } } } }, { module: 'Planejamento' })
  await page.getByRole('button', { name: 'Ver descrição' }).dispatchEvent('mousedown')
  await page.getByPlaceholder('Escreva uma nota para esta janela…').fill('   ')
  await page.getByRole('button', { name: 'Salvar' }).click()
  expect((await readStore(page, 'planning')).grid['0:8']).toEqual({ categoryId: 'trab' })
})

test('a rotina cannot end before it starts', async ({ page }) => {
  await openApp(page, { habits: [], habitLog: {}, goals: [] }, { module: 'Metas' })
  await page.getByRole('button', { name: 'Nova rotina' }).click()
  await page.getByPlaceholder('Ex.: Beber 2 litros de água').fill('Correr')
  const modal = page.locator('.fixed.inset-0')
  await modal.getByText('Indefinidamente').click()
  await modal.locator('input[type="date"]').nth(1).fill('2026-03-01')
  await expect(modal.getByRole('button', { name: 'Adicionar' })).toBeDisabled()
})

test('lowering the progress of a completed goal reopens it', async ({ page }) => {
  await openApp(page, { habits: [], habitLog: {}, goals: [{ id: 'g1', title: 'Maratona', description: '', targetDate: null, progress: 100, status: 'done' }] }, { module: 'Metas' })
  await page.getByText('Maratona').click()
  await page.locator('.fixed.inset-0 input[type="number"]').fill('60')
  await page.getByRole('button', { name: 'Salvar' }).click()
  expect((await readStore(page, 'goals'))[0]).toMatchObject({ progress: 60, status: 'active' })
})

test('Metas moves "today" forward when the app stays open past midnight', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-03-10T23:58:00-03:00') })
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('secretaria:habits', JSON.stringify([{ id: 'h', label: 'Ler', weekdays: [0, 1, 2, 3, 4, 5, 6], startDate: '2026-03-01', endDate: null }]))
    localStorage.setItem('secretaria:habitLog', '{}')
    localStorage.setItem('secretaria:goals', '[]')
    localStorage.setItem('secretaria:metasPeriod', '"week"')
  })
  await page.reload()
  await page.locator('header nav').getByRole('button', { name: 'Metas', exact: true }).click()
  const highlighted = page.locator('p.text-primary.tabular-nums')
  await expect(highlighted).toHaveText('10')
  await page.clock.fastForward('05:00')
  await expect(highlighted).toHaveText('11')
})

test('the app opens on the first visible module when Agenda is hidden', async ({ page }) => {
  await openApp(page, { modulesConfig: { order: ['agenda', 'planning', 'todos', 'compras', 'vencimentos', 'finance', 'metas'], hidden: ['agenda'], groups: [] } })
  await expect(page.locator('header nav').getByRole('button', { name: 'Planejamento', exact: true })).toHaveAttribute('aria-current', 'page')
})

test('filters saved by an older version (missing keys) do not crash the modules', async ({ page }) => {
  const errors = trackErrors(page)
  await openApp(page, { shoppingFilters: { hidePurchased: true }, billsFilters: { hidePaid: true }, tasksFilters: { hideFinished: true } })
  for (const label of ['Compras', 'Vencimentos', 'Tarefas']) {
    await page.locator('header nav').getByRole('button', { name: label, exact: true }).click()
    await expect(page.getByText('Algo deu errado neste módulo')).toHaveCount(0)
  }
  errors.assertNone()
})

test('the undo toast closes on its own even while the module keeps re-rendering', async ({ page }) => {
  await page.clock.install({ time: NOW })
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('secretaria:tags', '[]')
    localStorage.setItem(
      'secretaria:events',
      JSON.stringify([{ id: 'e1', kind: 'event', title: 'Reunião', local: '', color: '#2563EB', tags: [], start: '2026-03-10T14:00:00-03:00', end: '2026-03-10T15:00:00-03:00', status: 'unconfirmed', recurrence: 'none', recurrenceDays: [], recurrenceUntil: null, isAula: false, faltasMax: null, occStatus: {}, exdates: [], linkedIds: [] }])
    )
  })
  await page.reload()
  await page.locator('[data-day]').getByText('Reunião').click()
  await page.getByRole('button', { name: 'Excluir' }).click()
  await page.getByRole('button', { name: 'Excluir', exact: true }).last().click()
  await expect(page.getByRole('button', { name: 'Desfazer' })).toBeVisible()
  // Keep using the Agenda (every click re-renders it) for 12s in total; the
  // toast promises to go away after 6s regardless.
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Próximo', exact: true }).click()
    await page.clock.runFor(4000)
  }
  await expect(page.getByRole('button', { name: 'Desfazer' })).toHaveCount(0)
})
