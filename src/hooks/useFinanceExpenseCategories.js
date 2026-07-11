import { useEffect, useState } from 'react'
import { loadFinanceExpenseCategories, saveFinanceExpenseCategories } from '../lib/storage'
import { FINANCE_SEED_EXPENSE_CATEGORIES } from '../data/financeSeed'

let nextId = 1
function genCategoryId() {
  return `fincat_exp_${Date.now()}_${nextId++}`
}

// User-editable, reorderable expense category list — its own domain,
// independent from income categories and every other module's lists.
export function useFinanceExpenseCategories() {
  const [categories, setCategories] = useState(() => {
    const stored = loadFinanceExpenseCategories()
    return stored ?? FINANCE_SEED_EXPENSE_CATEGORIES
  })

  useEffect(() => {
    saveFinanceExpenseCategories(categories)
  }, [categories])

  const addCategory = (label, color) => {
    const l = label.trim()
    if (!l) return null
    const id = genCategoryId()
    setCategories((prev) => [...prev, { id, label: l, color }])
    return id
  }

  const updateCategory = (id, patch) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  const deleteCategory = (id) => {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  const reorderCategories = (newOrderIds) => {
    setCategories((prev) => newOrderIds.map((id) => prev.find((c) => c.id === id)).filter(Boolean))
  }

  return { categories, addCategory, updateCategory, deleteCategory, reorderCategories }
}
