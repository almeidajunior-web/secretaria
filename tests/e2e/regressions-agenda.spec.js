import { test, expect } from '@playwright/test'
import { openApp, readStore } from './helpers'

// Regression tests for Agenda bugs found in the November 2026 code review.

const evt = (over) => ({
  id: 'e1', kind: 'event', title: 'Reunião', local: '', color: '#2563EB', tags: [],
  start: '2026-03-10T14:00:00-03:00', end: '2026-03-10T15:00:00-03:00',
  status: 'unconfirmed', recurrence: 'none', recurrenceDays: [], recurrenceUntil: null,
  isAula: false, faltasMax: null, occStatus: {}, exdates: [], linkedIds: [], ...over,
})
const grid = (page) => page.locator('[data-day]')
const day = (iso) => new Date(iso).toISOString().slice(0, 10)

test('editing the first half of a split series keeps its end date', async ({ page }) => {
  // What "este e os próximos" leaves behind: the old series ends on the 8th,
  // a new one (at 16:00) carries on from the 9th.
  await openApp(page, {
    tags: [],
    events: [
      evt({ id: 'old', title: 'Inglês', recurrence: 'weekly', start: '2026-03-02T14:00:00-03:00', end: '2026-03-02T15:00:00-03:00', recurrenceUntil: '2026-03-09T02:59:59.999Z' }),
      evt({ id: 'new', title: 'Inglês', recurrence: 'weekly', start: '2026-03-09T16:00:00-03:00', end: '2026-03-09T17:00:00-03:00' }),
    ],
  })
  await page.getByRole('button', { name: 'Anterior', exact: true }).click()
  await grid(page).getByText('Inglês').click()
  await page.getByRole('button', { name: 'Editar' }).click()
  await page.getByPlaceholder('Título do evento').fill('Inglês avançado')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await page.getByRole('button', { name: 'Todos os eventos' }).click()

  const old = (await readStore(page, 'events')).find((e) => e.id === 'old')
  expect(old.recurrenceUntil).not.toBeNull()
  // The current week must still show a single occurrence (the new series).
  await page.getByRole('button', { name: 'Hoje' }).click()
  await expect(grid(page).getByText(/^Inglês/)).toHaveCount(1)
})

test('"este e os próximos" keeps the end date edited in the form', async ({ page }) => {
  await openApp(page, {
    tags: [],
    events: [evt({ title: 'Plantão', recurrence: 'custom', recurrenceDays: [1, 3], start: '2026-03-02T14:00:00-03:00', end: '2026-03-02T15:00:00-03:00', recurrenceUntil: '2026-03-31T03:00:00.000Z' })],
  })
  await grid(page).nth(2).getByText('Plantão').click() // Wednesday the 11th
  await page.getByRole('button', { name: 'Editar' }).click()
  await page.locator('input[type="date"]').fill('2026-03-20')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await page.getByRole('button', { name: 'Este e os próximos' }).click()
  const events = await readStore(page, 'events')
  const newSeries = events.find((e) => e.id !== 'e1')
  expect(day(newSeries.recurrenceUntil)).toBe('2026-03-20')
})

test('a status set in the popover survives opening the editor and saving', async ({ page }) => {
  await openApp(page, { tags: [], events: [evt()] })
  await grid(page).getByText('Reunião').click()
  await page.getByRole('button', { name: 'Confirmado', exact: true }).click()
  await page.getByRole('button', { name: 'Editar' }).click()
  await page.getByRole('button', { name: 'Salvar' }).click()
  expect((await readStore(page, 'events'))[0].status).toBe('confirmed')
})

test('Esc on the recurrence choice only closes that choice, not the form', async ({ page }) => {
  await openApp(page, { tags: [], events: [evt({ recurrence: 'weekly' })] })
  await grid(page).getByText('Reunião').click()
  await page.getByRole('button', { name: 'Editar' }).click()
  await page.getByPlaceholder('Título do evento').fill('Reunião nova')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByText('Editar evento recorrente')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByText('Editar evento recorrente')).toHaveCount(0)
  await expect(page.getByText('Descartar alterações não salvas?')).toHaveCount(0)
  await expect(page.getByPlaceholder('Título do evento')).toHaveValue('Reunião nova')
})

test('undoing the deletion of a whole discipline restores every class and their link', async ({ page }) => {
  const aula = (id, other, start) =>
    evt({ id, kind: 'aula', isAula: true, title: 'Cálculo', recurrence: 'weekly', start, end: start.replace('T08', 'T10'), linkedIds: [other], faltasMax: 5 })
  await openApp(page, { tags: [], events: [aula('a', 'b', '2026-03-09T08:00:00-03:00'), aula('b', 'a', '2026-03-11T08:00:00-03:00')] })
  await page.getByRole('button', { name: 'Aulas' }).click()
  await page.getByRole('button', { name: 'Agrupar por disciplina' }).click()
  await page.getByRole('button', { name: 'Excluir' }).click()
  await page.getByRole('button', { name: 'Excluir', exact: true }).last().click()
  expect(await readStore(page, 'events')).toEqual([])
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Desfazer' }).click()
  const restored = await readStore(page, 'events')
  expect(restored.map((e) => e.id).sort()).toEqual(['a', 'b'])
  expect(restored.find((e) => e.id === 'a').linkedIds).toEqual(['b'])
  expect(restored.find((e) => e.id === 'b').linkedIds).toEqual(['a'])
})

test('a horizontal trackpad swipe changes the week without browser warnings', async ({ page }) => {
  const messages = []
  page.on('console', (m) => messages.push(m.text()))
  await openApp(page, { tags: [], events: [] })
  const title = page.locator('main h2').first()
  await page.locator('[data-day]').first().hover()
  await page.mouse.wheel(120, 0)
  await expect(title).toHaveText('Março 2026') // next week is still March
  await expect(page.locator('[data-day]').first()).toHaveAttribute('data-day', /2026-03-16/)
  expect(messages.filter((m) => /passive event listener/i.test(m))).toEqual([])
})
