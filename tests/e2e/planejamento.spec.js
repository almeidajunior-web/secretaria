import { test, expect } from '@playwright/test'
import { openApp, readStore } from './helpers'

const planning = {
  categories: [
    { id: 'trab', label: 'Trabalho', color: '#2563EB' },
    { id: 'est', label: 'Estudo', color: '#059669' },
  ],
  grid: {},
  splits: {},
  hourStart: 6,
  hourEnd: 22,
}

// Monday's window for a given hour row: the cell right after the "08H" label.
const cell = (page, hour, dayIndex = 0) =>
  page
    .locator('div', { hasText: new RegExp(`^${String(hour).padStart(2, '0')}H$`) })
    .locator(`xpath=following-sibling::div[${dayIndex + 1}]`)

// One real pointer stroke through the given cells — painting listens to
// mousedown on the first cell and mouseenter on every one after it.
async function dragAcross(page, cells) {
  const centers = []
  for (const c of cells) {
    const b = await c.boundingBox()
    centers.push([b.x + b.width / 2, b.y + b.height / 2])
  }
  await page.mouse.move(...centers[0])
  await page.mouse.down()
  for (const point of centers.slice(1)) await page.mouse.move(...point, { steps: 4 })
  await page.mouse.up()
}

test('paints with the armed category and totals the hours', async ({ page }) => {
  await openApp(page, { planning }, { module: 'Planejamento' })
  await page.getByRole('button', { name: /^Trabalho/ }).click()
  await dragAcross(page, [cell(page, 8), cell(page, 9)])
  await expect(page.getByRole('button', { name: /Trabalho\s*•\s*2h/ })).toBeVisible()
  const { grid } = await readStore(page, 'planning')
  expect(grid['0:8']).toEqual({ categoryId: 'trab' })
  expect(grid['0:9']).toEqual({ categoryId: 'trab' })

  await page.getByRole('button', { name: 'Limpar' }).click()
  await dragAcross(page, [cell(page, 8)])
  await expect(page.getByRole('button', { name: /Trabalho\s*•\s*1h/ })).toBeVisible()
})

test('splits a window and attaches a description', async ({ page }) => {
  await openApp(page, { planning }, { module: 'Planejamento' })
  await cell(page, 10, 2).click({ button: 'right' })
  await page.getByRole('button', { name: 'Dividir bloco' }).click()
  expect((await readStore(page, 'planning')).splits['2:10']).toBe(true)

  await cell(page, 14, 1).click({ button: 'right' })
  await page.getByRole('button', { name: 'Adicionar descrição' }).click()
  await page.getByPlaceholder('Escreva uma nota para esta janela…').fill('Academia')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(page.getByRole('button', { name: 'Ver descrição' })).toHaveCount(1)
  expect((await readStore(page, 'planning')).grid['1:14']).toEqual({ description: 'Academia' })
})

test('manages categories and the hour range in settings', async ({ page }) => {
  await openApp(page, { planning }, { module: 'Planejamento' })
  await page.locator('main').getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('button', { name: 'Faixa de horário' }).click()
  await page.locator('select').nth(1).selectOption('20')
  await page.getByRole('button', { name: 'Fechar' }).click()
  await expect(page.getByText('20H', { exact: true })).toBeVisible()
  await expect(page.getByText('21H', { exact: true })).toHaveCount(0)
})
