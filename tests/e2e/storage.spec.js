import { test, expect } from '@playwright/test'
import { openApp, goTo, readStore, NOW } from './helpers'

const statuses = [
  { id: 'pendente', label: 'Pendente', color: '#6B7280', isDone: false },
  { id: 'finalizada', label: 'Finalizada', color: '#16A34A', isDone: true },
]

test('two open tabs keep each other’s changes', async ({ context }) => {
  const a = await context.newPage()
  await openApp(a, { tasks: [], taskStatuses: statuses, taskPriorities: [], taskTags: [] }, { module: 'Tarefas' })
  const b = await context.newPage()
  await b.clock.setFixedTime(NOW)
  await b.goto('/')
  await goTo(b, 'Tarefas')

  await a.getByPlaceholder('Nova tarefa…').fill('Criada na aba A')
  await a.getByPlaceholder('Nova tarefa…').press('Enter')
  // Tab B picks it up without a reload…
  await expect(b.locator('input[value="Criada na aba A"]')).toBeVisible()

  // …so adding in tab B keeps tab A's task instead of writing over it.
  await b.getByPlaceholder('Nova tarefa…').fill('Criada na aba B')
  await b.getByPlaceholder('Nova tarefa…').press('Enter')
  await expect(a.locator('input[value="Criada na aba B"]')).toBeVisible()
  expect((await readStore(a, 'tasks')).map((t) => t.title).sort()).toEqual(['Criada na aba A', 'Criada na aba B'])
})

test('unreadable data is set aside and reported, never replaced by demo data', async ({ page }) => {
  await openApp(page)
  await page.evaluate(() => localStorage.setItem('secretaria:tasks', '{"isso nao e": "uma lista"}'))
  await page.reload()
  await goTo(page, 'Tarefas')
  await expect(page.getByRole('alert')).toContainText('Alguns dados salvos estavam ilegíveis')
  await expect(page.getByRole('alert')).toContainText('Tarefas')
  const stored = await page.evaluate(() => ({
    tasks: localStorage.getItem('secretaria:tasks'),
    backup: localStorage.getItem('secretaria:tasks:corrupted-backup'),
  }))
  expect(stored).toEqual({ tasks: '{"isso nao e": "uma lista"}', backup: '{"isso nao e": "uma lista"}' })
  await page.getByRole('button', { name: 'Fechar aviso' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('a full storage is reported instead of failing silently', async ({ page }) => {
  await openApp(page, { billCategories: [], bills: [{ id: 'b1', title: 'Luz', amount: 100, dueDate: '2026-03-12', categoryId: null, paid: false, paidDate: null, recurrence: 'none', seriesId: null }] }, { module: 'Vencimentos' })
  await page.evaluate(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'secretaria:bills') throw new DOMException('cheio', 'QuotaExceededError')
      return original.call(this, key, value)
    }
  })
  await page.getByRole('button', { name: 'Marcar como paga' }).click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível salvar as últimas alterações')
  await expect(page.getByRole('alert')).toContainText('Vencimentos')
  // The module keeps working in this tab.
  await expect(page.getByRole('button', { name: 'Marcar como pendente' })).toHaveCount(0) // hidden: "ocultando pagas"
})
