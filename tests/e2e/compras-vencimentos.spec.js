import { test, expect } from '@playwright/test'
import { openApp, readStore, trackErrors } from './helpers'

const shopBase = {
  shoppingCategories: [{ id: 'mer', label: 'Mercado', color: '#059669' }],
  shoppingPriorities: [{ id: 'urg', label: 'Urgente', color: '#DC2626' }],
}
const titleInput = (page, title) => page.locator(`input[value="${title}"]`)

test.describe('Compras', () => {
  test('quick-adds, checks off and deletes items', async ({ page }) => {
    await openApp(page, { ...shopBase, shoppingItems: [] }, { module: 'Compras' })
    await page.getByPlaceholder('Novo item…').fill('Café')
    await page.getByPlaceholder('Novo item…').press('Enter')
    await expect(titleInput(page, 'Café')).toBeVisible()

    await page.getByRole('button', { name: 'Marcar como comprado' }).click()
    await expect(titleInput(page, 'Café')).toHaveCount(0) // hidden while "ocultando comprados"
    expect((await readStore(page, 'shoppingItems'))[0]).toMatchObject({ purchased: true, purchasedDate: '2026-03-10' })

    await page.getByRole('button', { name: 'Ocultando comprados' }).click()
    await page.getByRole('button', { name: 'Excluir Café' }).click()
    await expect(titleInput(page, 'Café')).toHaveCount(0)
    expect(await readStore(page, 'shoppingItems')).toEqual([])
  })

  test('items bought on an earlier day are cleaned up on load', async ({ page }) => {
    await openApp(
      page,
      { ...shopBase, shoppingItems: [{ id: 's1', title: 'Pão', purchased: true, purchasedDate: '2026-03-09', categoryId: null, priorityId: null }] },
      { module: 'Compras' }
    )
    await expect.poll(() => readStore(page, 'shoppingItems')).toEqual([])
  })

  test('groups by category', async ({ page }) => {
    await openApp(page, { ...shopBase, shoppingItems: [{ id: 's1', title: 'Arroz', purchased: false, categoryId: 'mer', priorityId: null }] }, { module: 'Compras' })
    await page.getByRole('button', { name: 'Agrupar por classificação' }).click()
    await expect(page.getByText('Mercado (1)')).toBeVisible()
  })
})

const billBase = { billCategories: [{ id: 'con', label: 'Consumo', color: '#D97706' }] }
const bill = (over) => ({ id: 'b1', title: 'Luz', amount: 150, dueDate: '2026-03-12', categoryId: 'con', paid: false, paidDate: null, recurrence: 'monthly', recurrenceEnd: null, seriesId: 'sr1', ...over })

test.describe('Vencimentos', () => {
  test('quick-adds a recurring bill straight from the row', async ({ page }) => {
    await openApp(page, { ...billBase, bills: [] }, { module: 'Vencimentos' })
    const row = page.getByPlaceholder('Novo vencimento…').locator('xpath=..')
    await page.getByPlaceholder('Novo vencimento…').fill('Internet')
    await row.getByPlaceholder('0,00').fill('99,90')
    // The real date input is visually collapsed behind the InlineDate label.
    await row.locator('input[type="date"]').fill('2026-03-15', { force: true })
    await row.getByRole('button', { name: 'Não recorrente' }).click()
    await row.getByRole('button', { name: 'Mensal', exact: true }).click()
    await row.getByRole('button', { name: 'Adicionar' }).click()
    expect((await readStore(page, 'bills'))[0]).toMatchObject({ title: 'Internet', amount: 99.9, dueDate: '2026-03-15', recurrence: 'monthly' })
  })

  test('paying a recurring bill keeps it as history and spawns the next cycle', async ({ page }) => {
    await openApp(page, { ...billBase, bills: [bill()] }, { module: 'Vencimentos' })
    await page.getByRole('button', { name: 'Marcar como paga' }).click()
    const bills = await readStore(page, 'bills')
    expect(bills).toHaveLength(2)
    expect(bills[0]).toMatchObject({ paid: true, paidDate: '2026-03-10' })
    expect(bills[1]).toMatchObject({ paid: false, dueDate: '2026-04-12', amount: 150 })
  })

  test('the "Novo vencimento" modal opens and saves', async ({ page }) => {
    const errors = trackErrors(page)
    await openApp(page, { ...billBase, bills: [] }, { module: 'Vencimentos' })
    await page.locator('main').getByRole('button', { name: 'Novo vencimento' }).click()
    const modal = page.locator('.fixed.inset-0')
    await modal.getByPlaceholder('Ex.: Conta de luz, Netflix, Aluguel…').fill('Aluguel')
    await modal.locator('input[type="date"]').first().fill('2026-03-20')
    await modal.getByRole('button', { name: 'Adicionar' }).click()
    await expect(titleInput(page, 'Aluguel')).toBeVisible()
    errors.assertNone()
  })

  test('summary shows pending and overdue totals', async ({ page }) => {
    await openApp(page, { ...billBase, bills: [bill(), bill({ id: 'b2', title: 'Água', amount: 80, dueDate: '2026-03-05', seriesId: 'sr2' })] }, { module: 'Vencimentos' })
    const bar = page.getByText('Pendente no mês').locator('..')
    await expect(bar).toContainText('230,00')
    await expect(page.getByText(/Atrasado\s+R\$\s*80,00/)).toBeVisible()
  })
})
