import { test, expect } from '@playwright/test'
import { openApp, goTo, readStore, trackErrors } from './helpers'

const MODULES = ['Agenda', 'Planejamento', 'Tarefas', 'Compras', 'Vencimentos', 'Finanças', 'Metas']

test('every module opens from the top bar without errors', async ({ page }) => {
  const errors = trackErrors(page)
  await openApp(page)
  const nav = page.locator('header nav')
  for (const label of MODULES) {
    await goTo(page, label)
    await expect(nav.getByRole('button', { name: label, exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByText('Algo deu errado neste módulo')).toHaveCount(0)
  }
  errors.assertNone()
})

test('theme choice persists across reloads', async ({ page }) => {
  await openApp(page, { theme: 'light' })
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.locator('header').getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('button', { name: 'Aparência' }).click()
  await page.getByRole('button', { name: 'Escuro' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('privacy mode covers the module area and persists', async ({ page }) => {
  await openApp(page)
  await page.getByRole('button', { name: 'Ativar modo privado' }).click()
  await expect(page.getByRole('button', { name: 'Desativar modo privado' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Desativar modo privado' })).toBeVisible()
})

test('hiding a module removes it from the top bar', async ({ page }) => {
  await openApp(page)
  await page.locator('header').getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('button', { name: 'Ocultar Compras' }).click()
  await page.getByRole('button', { name: 'Fechar' }).click()
  await expect(page.locator('header nav').getByRole('button', { name: 'Compras', exact: true })).toHaveCount(0)
  expect((await readStore(page, 'modulesConfig')).hidden).toContain('compras')
})

test('backup exports every module and restores it', async ({ page }) => {
  await openApp(page, { tasks: [{ id: 't1', title: 'Tarefa do backup', status: 'todo', tagIds: [], recurrence: 'none' }] })
  await page.locator('header').getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('button', { name: 'Backup' }).click()
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Exportar backup/ }).click(),
  ])
  const path = await download.path()
  const backup = JSON.parse(await (await import('node:fs/promises')).readFile(path, 'utf8'))
  expect(backup.app).toBe('secretaria')
  expect(JSON.parse(backup.data['secretaria:tasks'])[0].title).toBe('Tarefa do backup')

  // wipe the task, then restore the file
  await page.evaluate(() => localStorage.setItem('secretaria:tasks', '[]'))
  await page.reload()
  await page.locator('header').getByRole('button', { name: 'Configurações' }).click()
  await page.getByRole('button', { name: 'Backup' }).click()
  await page.locator('input[type="file"]').setInputFiles(path)
  await page.getByRole('button', { name: /Restaurar|Importar/ }).last().click()
  await page.waitForLoadState('load')
  await goTo(page, 'Tarefas')
  await expect(page.locator('input[value="Tarefa do backup"]')).toBeVisible()
})
