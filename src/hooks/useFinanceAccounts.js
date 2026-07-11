import { useEffect, useState } from 'react'
import { loadFinanceAccounts, saveFinanceAccounts } from '../lib/storage'

let nextId = 1
function genAccountId() {
  return `finacc_${Date.now()}_${nextId++}`
}

// User-editable, reorderable account/bank list (Nubank, Itaú, Carteira...).
// No seed — there's no way to guess the user's real banks, same reasoning
// as Planejamento's grid starting empty.
export function useFinanceAccounts() {
  const [accounts, setAccounts] = useState(() => loadFinanceAccounts() ?? [])

  useEffect(() => {
    saveFinanceAccounts(accounts)
  }, [accounts])

  const addAccount = (label, color) => {
    const l = label.trim()
    if (!l) return null
    const id = genAccountId()
    setAccounts((prev) => [...prev, { id, label: l, color }])
    return id
  }

  const updateAccount = (id, patch) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }

  const deleteAccount = (id) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  const reorderAccounts = (newOrderIds) => {
    setAccounts((prev) => newOrderIds.map((id) => prev.find((a) => a.id === id)).filter(Boolean))
  }

  return { accounts, addAccount, updateAccount, deleteAccount, reorderAccounts }
}
