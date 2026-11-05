import { test, expect } from '@playwright/test'
import { openApp, readStore } from './helpers'

const statuses = [
  { id: 'pendente', label: 'Pendente', color: '#6B7280', isDone: false },
  { id: 'finalizada', label: 'Finalizada', color: '#16A34A', isDone: true },
]
const base = { taskStatuses: statuses, taskPriorities: [{ id: 'alta', label: 'Alta', color: '#DC2626' }], taskTags: [] }
const task = (over) => ({ id: 't1', title: 'Relatório', status: 'pendente', priorityId: null, tagIds: [], dueDate: '2026-03-10', dueTime: null, recurrence: 'none', recurrenceDays: [], recurrenceUntil: null, ...over })

const titleInput = (page, title) => page.locator(`input[value="${title}"]`)

test('quick-adds a task and groups it by due date', async ({ page }) => {
  await openApp(page, { ...base, tasks: [] }, { module: 'Tarefas' })
  await page.getByPlaceholder('Nova tarefa…').fill('Ligar para o banco')
  await page.getByPlaceholder('Nova tarefa…').press('Enter')
  await expect(titleInput(page, 'Ligar para o banco')).toBeVisible()
  await expect(page.getByText('Sem prazo (1)')).toBeVisible()
  expect((await readStore(page, 'tasks'))[0].status).toBe('pendente')
})

test('finishing a task hides it while "ocultando finalizadas" is on', async ({ page }) => {
  await openApp(page, { ...base, tasks: [task()] }, { module: 'Tarefas' })
  await page.getByRole('button', { name: 'Pendente', exact: true }).first().click()
  await page.getByRole('button', { name: 'Finalizada', exact: true }).last().click()
  await expect(titleInput(page, 'Relatório')).toHaveCount(0)
  await page.getByRole('button', { name: 'Ocultando finalizadas' }).click()
  await expect(titleInput(page, 'Relatório')).toBeVisible()
})

test('completing a recurring task moves it to the next occurrence', async ({ page }) => {
  await openApp(page, { ...base, tasks: [task({ recurrence: 'weekly' })] }, { module: 'Tarefas' })
  await page.getByRole('button', { name: 'Pendente', exact: true }).first().click()
  await page.getByRole('button', { name: 'Finalizada', exact: true }).last().click()
  const [stored] = await readStore(page, 'tasks')
  expect(stored).toMatchObject({ dueDate: '2026-03-17', status: 'pendente' })
})

test('overdue recurring tasks roll forward on load', async ({ page }) => {
  await openApp(page, { ...base, tasks: [task({ recurrence: 'daily', dueDate: '2026-03-01' })] }, { module: 'Tarefas' })
  await expect.poll(async () => (await readStore(page, 'tasks'))[0].dueDate).toBe('2026-03-10')
})

test('edits in the modal, renames inline and deletes', async ({ page }) => {
  await openApp(page, { ...base, tasks: [task()] }, { module: 'Tarefas' })
  await titleInput(page, 'Relatório').fill('Relatório mensal')
  await titleInput(page, 'Relatório mensal').press('Enter')
  expect((await readStore(page, 'tasks'))[0].title).toBe('Relatório mensal')

  await page.getByRole('button', { name: 'Nova tarefa' }).click()
  await page.getByPlaceholder('Título da tarefa').fill('Comprar presente')
  await page.getByRole('button', { name: 'Salvar' }).click()
  await expect(titleInput(page, 'Comprar presente')).toBeVisible()

  await page.getByRole('button', { name: 'Excluir tarefa Comprar presente' }).click()
  await page.getByRole('button', { name: 'Excluir', exact: true }).click()
  await expect(titleInput(page, 'Comprar presente')).toHaveCount(0)
})

test('kanban shows one column per status and drags change the status', async ({ page }) => {
  await openApp(page, { ...base, tasks: [task()] }, { module: 'Tarefas' })
  await page.getByRole('button', { name: 'Kanban' }).click()
  const card = page.getByText('Relatório', { exact: true })
  const done = page.locator('div.glass', { has: page.getByText('Finalizada', { exact: true }) }).last()
  await card.dragTo(done)
  expect((await readStore(page, 'tasks'))[0].status).toBe('finalizada')
})

test('postpones a task by one day', async ({ page }) => {
  await openApp(page, { ...base, tasks: [task()] }, { module: 'Tarefas' })
  await page.getByRole('button', { name: 'Adiar tarefa' }).click()
  await page.getByRole('button', { name: '+1 dia' }).click()
  expect((await readStore(page, 'tasks'))[0].dueDate).toBe('2026-03-11')
})
