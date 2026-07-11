import { useEffect, useState } from 'react'
import { loadFinanceIncomeCategories, saveFinanceIncomeCategories } from '../lib/storage'
import { FINANCE_SEED_INCOME_CATEGORIES } from '../data/financeSeed'

let nextId = 1
function genCategoryId() {
  return `fincat_inc_${Date.now()}_${nextId++}`
}

// User-editable, reorderable income category list — deliberately separate
// from expense categories (mixing "Salário" with "Moradia" makes no sense).
export function useFinanceIncomeCategories() {
  const [categories, setCategories] = useState(() => {
    const stored = loadFinanceIncomeCategories()
    return stored ?? FINANCE_SEED_INCOME_CATEGORIES
  })

  useEffect(() => {
    saveFinanceIncomeCategories(categories)
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
