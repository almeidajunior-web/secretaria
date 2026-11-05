import { test, expect } from '@playwright/test'
import { openApp, readStore, trackErrors } from './helpers'

const E = (id, date, type, title, amount, extra = {}) => ({
  id, date, type, title, amount, description: '', categoryId: null, paymentMethodId: 'debito',
  accountId: 'nu', essential: false, recurrence: 'none', ...extra,
})
const base = {
  financeAccounts: [{ id: 'nu', label: 'Nubank', color: '#7C3AED', initialBalance: 1000 }],
  financeTab: 'resumo',
  financeFilters: { categoryIds: [], paymentMethodIds: [], accountIds: [], types: [] },
  financeEntries: [
    E('f1', '2026-02-05', 'income', 'Salário', 5000),
    E('f2', '2026-02-10', 'expense', 'Aluguel', 1500),
    E('f3', '2026-03-05', 'income', 'Salário', 5000),
    E('f4', '2026-03-08', 'expense', 'Água', 80),
  ],
}
const text = async (page) => (await page.locator('main').innerText()).replace(/\u00a0/g, ' ')

test('Resumo follows the month picked in the toolbar', async ({ page }) => {
  const errors = trackErrors(page)
  await openApp(page, base, { module: 'Finanças' })
  await expect(page.locator('main h2').first()).toHaveText('Março de 2026')
  expect(await text(page)).toContain('R$ 4.920,00') // saldo do mês
  await page.getByRole('button', { name: 'Mês anterior' }).click()
  await expect(page.locator('main h2').first()).toHaveText('Fevereiro de 2026')
  expect(await text(page)).toContain('R$ 3.500,00')
  expect(await text(page)).toContain('saldo em 28/02/2026')
  await page.getByRole('button', { name: 'Mês atual' }).click()
  await expect(page.locator('main h2').first()).toHaveText('Março de 2026')
  errors.assertNone()
})

test('Lançamentos filters by month, shows all months and searches by title', async ({ page }) => {
  await openApp(page, { ...base, financeTab: 'lancamentos' }, { module: 'Finanças' })
  const rows = page.locator('tbody tr')
  await expect(rows).toHaveCount(3) // quick-add row + 2 March entries
  await page.getByRole('button', { name: 'Todos os meses' }).click()
  await expect(rows).toHaveCount(5)
  await page.getByPlaceholder('Buscar lançamento…').fill('agua')
  await expect(rows).toHaveCount(2)
})

test('quick-adds a lançamento with Enter in the value field', async ({ page }) => {
  await openApp(page, { ...base, financeTab: 'lancamentos' }, { module: 'Finanças' })
  const quick = page.locator('tbody tr').first()
  await page.getByPlaceholder('Novo lançamento…').fill('Mercado')
  await quick.locator('input[type="date"]').fill('2026-03-09', { force: true })
  await quick.getByPlaceholder('0,00').fill('250,40')
  await quick.getByPlaceholder('0,00').press('Enter')
  const added = (await readStore(page, 'financeEntries')).find((e) => e.title === 'Mercado')
  expect(added).toMatchObject({ amount: 250.4, date: '2026-03-09', type: 'expense' })
})

test('exports what the table shows as .xlsx', async ({ page }) => {
  await openApp(page, { ...base, financeTab: 'lancamentos' }, { module: 'Finanças' })
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar' }).click()])
  expect(download.suggestedFilename()).toBe('financas-2026-03.xlsx')
})

test('a recurring lançamento keeps one future instance pending', async ({ page }) => {
  await openApp(page, { ...base, financeEntries: [E('r1', '2026-03-05', 'expense', 'Academia', 120, { recurrence: 'monthly', seriesId: 's1' })] }, { module: 'Finanças' })
  await expect.poll(async () => (await readStore(page, 'financeEntries')).map((e) => e.date)).toEqual(['2026-03-05', '2026-04-05'])
})

test('the modal splits a card purchase into installments', async ({ page }) => {
  await openApp(page, { ...base, financeEntries: [], financeCreditCard: { closingDay: 25, dueDay: 5 } }, { module: 'Finanças' })
  await page.getByRole('button', { name: 'Novo lançamento' }).click()
  const modal = page.locator('.fixed.inset-0')
  await modal.getByPlaceholder('Ex.: Supermercado, Salário, Uber…').fill('Geladeira')
  await modal.getByPlaceholder('0,00').fill('3000')
  await modal.locator('input[type="date"]').first().fill('2026-03-10')
  await modal.locator('select').nth(1).selectOption('credito')
  await modal.getByText('Parcelado?').click()
  await modal.locator('input[type="number"]').fill('3')
  await modal.getByRole('button', { name: 'Adicionar' }).click()
  const stored = await readStore(page, 'financeEntries')
  expect(stored.map((e) => [e.title, e.amount, e.date])).toEqual([
    ['Geladeira (1/3)', 1000, '2026-03-10'],
    ['Geladeira (2/3)', 1000, '2026-04-10'],
    ['Geladeira (3/3)', 1000, '2026-05-10'],
  ])
})

test('settings lists the managed lists', async ({ page }) => {
  await openApp(page, base, { module: 'Finanças' })
  await page.locator('main').getByRole('button', { name: 'Configurações' }).click()
  for (const section of ['Categorias de despesa', 'Categorias de receita', 'Formas de pagamento', 'Contas']) {
    await expect(page.getByRole('button', { name: section })).toBeVisible()
  }
})
