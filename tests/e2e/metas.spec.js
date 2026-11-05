import { test, expect } from '@playwright/test'
import { openApp, readStore, trackErrors } from './helpers'

const habit = { id: 'h1', label: 'Ler', description: '', weekdays: [0, 1, 2, 3, 4, 5, 6], startDate: '2026-03-01', endDate: null }

test('creates a rotina and cycles a day through its states', async ({ page }) => {
  const errors = trackErrors(page)
  await openApp(page, { habits: [], habitLog: {}, goals: [], metasPeriod: 'week' }, { module: 'Metas' })
  await page.getByRole('button', { name: 'Nova rotina' }).click()
  await page.getByPlaceholder('Ex.: Beber 2 litros de água').fill('Meditar')
  await page.getByRole('button', { name: 'Adicionar' }).click()

  const today = page.getByRole('button', { name: 'Meditar — 10/03' })
  const stateOf = async () => {
    const [h] = await readStore(page, 'habits')
    return (await readStore(page, 'habitLog'))[`${h.id}:2026-03-10`]
  }
  await today.click()
  expect(await stateOf()).toBe('done')
  await today.click()
  expect(await stateOf()).toBe('miss')
  await today.click()
  expect(await stateOf()).toBe('na')
  await today.click()
  expect(await stateOf()).toBeUndefined()
  errors.assertNone()
})

test('days before the start date are not clickable', async ({ page }) => {
  await openApp(page, { habits: [{ ...habit, startDate: '2026-03-10' }], habitLog: {}, goals: [], metasPeriod: 'week' }, { module: 'Metas' })
  await expect(page.getByRole('button', { name: 'Ler — 09/03' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Ler — 10/03' })).toBeVisible()
})

test('switches week and month windows', async ({ page }) => {
  await openApp(page, { habits: [habit], habitLog: {}, goals: [], metasPeriod: 'week' }, { module: 'Metas' })
  await expect(page.getByRole('button', { name: /^Ler — / })).toHaveCount(7)
  await page.getByRole('button', { name: 'Mês', exact: true }).click()
  await expect(page.locator('main h2').first()).toHaveText('Março de 2026')
  await expect(page.getByRole('button', { name: /^Ler — / })).toHaveCount(31)
})

test('creates and completes a goal', async ({ page }) => {
  await openApp(page, { habits: [], habitLog: {}, goals: [] }, { module: 'Metas' })
  await page.getByRole('button', { name: 'Nova meta' }).click()
  await page.getByPlaceholder('Ex.: Terminar a especialização').fill('Correr 10 km')
  await page.getByRole('button', { name: 'Adicionar' }).click()
  await expect(page.getByText('Correr 10 km')).toBeVisible()
  expect((await readStore(page, 'goals'))[0]).toMatchObject({ title: 'Correr 10 km', status: 'active', progress: 0 })
})
