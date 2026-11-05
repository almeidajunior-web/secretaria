import { test, expect } from '@playwright/test'
import { openApp, readStore, trackErrors } from './helpers'

const evt = (over) => ({
  id: 'e1',
  kind: 'event',
  title: 'Reunião',
  start: '2026-03-10T14:00:00-03:00',
  end: '2026-03-10T15:00:00-03:00',
  local: '',
  color: '#2563EB',
  tags: [],
  status: 'unconfirmed',
  recurrence: 'none',
  recurrenceDays: [],
  recurrenceUntil: null,
  isAula: false,
  faltasMax: null,
  occStatus: {},
  exdates: [],
  linkedIds: [],
  ...over,
})

const grid = (page) => page.locator('[data-day]')

test('creates an event from the modal and keeps it after reload', async ({ page }) => {
  const errors = trackErrors(page)
  await openApp(page, { events: [], tags: [] })
  await page.getByRole('button', { name: 'Novo evento' }).click()
  await page.getByPlaceholder('Título do evento').fill('Dentista')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(grid(page).getByText('Dentista')).toBeVisible()
  await page.reload()
  await expect(grid(page).getByText('Dentista')).toBeVisible()
  const [stored] = await readStore(page, 'events')
  // Created from the button: starts at the current half hour, lasts 1h.
  expect(new Date(stored.end) - new Date(stored.start)).toBe(60 * 60 * 1000)
  errors.assertNone()
})

test('moving the start keeps the duration (Google Calendar style)', async ({ page }) => {
  await openApp(page, { events: [], tags: [] })
  await page.getByRole('button', { name: 'Novo evento' }).click()
  const [start, end] = await page.locator('input[type="datetime-local"]').all()
  await start.fill('2026-03-12T08:00')
  await expect(end).toHaveValue('2026-03-12T09:00')
})

test('popover changes status, edits and deletes with undo', async ({ page }) => {
  await openApp(page, { events: [evt()], tags: [] })
  await grid(page).getByText('Reunião').click()
  await page.getByRole('button', { name: 'Confirmado', exact: true }).click()
  expect((await readStore(page, 'events'))[0].status).toBe('confirmed')

  await page.getByRole('button', { name: 'Editar' }).click()
  await page.getByPlaceholder('Título do evento').fill('Reunião de equipe')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(grid(page).getByText('Reunião de equipe')).toBeVisible()

  await grid(page).getByText('Reunião de equipe').click()
  await page.getByRole('button', { name: 'Excluir' }).click()
  await page.getByRole('dialog').or(page.locator('body')).getByRole('button', { name: 'Excluir' }).last().click()
  await expect(grid(page).getByText('Reunião de equipe')).toHaveCount(0)
  await page.getByRole('button', { name: 'Desfazer' }).click()
  await expect(grid(page).getByText('Reunião de equipe')).toBeVisible()
})

test('a weekly series shows every week, and "somente este" removes one occurrence', async ({ page }) => {
  await openApp(page, { events: [evt({ title: 'Inglês', recurrence: 'weekly', start: '2026-03-03T14:00:00-03:00', end: '2026-03-03T15:00:00-03:00' })], tags: [] })
  await expect(grid(page).getByText('Inglês')).toHaveCount(1)
  await grid(page).getByText('Inglês').click()
  await page.getByRole('button', { name: 'Excluir' }).click()
  await page.getByRole('button', { name: 'Somente este evento' }).click()
  await expect(grid(page).getByText('Inglês')).toHaveCount(0)
  await page.getByRole('button', { name: 'Próximo', exact: true }).click()
  await expect(grid(page).getByText('Inglês')).toHaveCount(1)
  expect((await readStore(page, 'events'))[0].exdates).toEqual(['2026-03-10'])
})

test('switches between year, month, week and day views', async ({ page }) => {
  await openApp(page, { events: [evt()], tags: [] })
  const title = page.locator('main h2').first()
  await page.getByRole('button', { name: 'Mensal' }).click()
  await expect(title).toHaveText('Março 2026')
  await page.getByRole('button', { name: 'Anual' }).click()
  await expect(title).toHaveText('2026')
  await page.getByRole('button', { name: 'Diária' }).click()
  await expect(title).toHaveText('10 de março de 2026')
  await page.getByRole('button', { name: 'Semanal' }).click()
  await expect(grid(page)).toHaveCount(7)
})

test('class absences are counted from unconfirmed past occurrences', async ({ page }) => {
  await openApp(page, {
    events: [evt({ id: 'a', kind: 'aula', isAula: true, title: 'Cálculo', faltasMax: 4, status: 'unconfirmed', recurrence: 'weekly', start: '2026-02-24T08:00:00-03:00', end: '2026-02-24T09:00:00-03:00' })],
    tags: [],
  })
  await page.getByRole('button', { name: 'Aulas' }).click()
  // Feb 24 and Mar 3 are past and unconfirmed; Mar 10 08:00 is also past at 10:00.
  await expect(page.getByRole('cell', { name: '3/4' })).toBeVisible()
})

test('provas list opens', async ({ page }) => {
  await openApp(page, { events: [evt({ kind: 'prova', isAula: true, title: 'P1', start: '2026-03-20T08:00:00-03:00', end: '2026-03-20T10:00:00-03:00' })], tags: [] })
  await page.getByRole('button', { name: 'Provas' }).click()
  await expect(page.getByRole('cell', { name: '10 dias' })).toBeVisible()
})

// Grid geometry: 06:00 at the top, 48px per hour (constants.js).
const yFor = (box, hour) => box.y + (hour - 6) * 48

test('dragging on empty grid space opens a new event with that range', async ({ page }) => {
  await openApp(page, { events: [], tags: [] })
  const wed = grid(page).nth(2)
  const box = await wed.boundingBox()
  await page.mouse.move(box.x + 20, yFor(box, 14) + 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 20, yFor(box, 15.5), { steps: 5 })
  await page.mouse.up()
  const [start, end] = await page.locator('input[type="datetime-local"]').all()
  await expect(start).toHaveValue('2026-03-11T14:00')
  await expect(end).toHaveValue('2026-03-11T15:30')
})

test('dragging an event moves it to another day and time', async ({ page }) => {
  await openApp(page, { events: [evt()], tags: [] })
  const card = grid(page).getByText('Reunião')
  const cardBox = await card.boundingBox()
  const thu = await grid(page).nth(3).boundingBox()
  await page.mouse.move(cardBox.x + 5, cardBox.y + 5)
  await page.mouse.down()
  await page.mouse.move(thu.x + 20, cardBox.y + 5 + 48, { steps: 8 })
  await page.mouse.up()
  const [stored] = await readStore(page, 'events')
  expect(new Date(stored.start).toISOString()).toBe(new Date('2026-03-12T15:00:00-03:00').toISOString())
  expect(new Date(stored.end) - new Date(stored.start)).toBe(60 * 60 * 1000)
})
