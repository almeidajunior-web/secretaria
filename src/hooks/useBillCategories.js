import { useEffect, useState } from 'react'
import { loadBillCategories, saveBillCategories } from '../lib/storage'
import { DUES_SEED_CATEGORIES } from '../data/duesSeed'

let nextId = 1
function genCategoryId() {
  return `duecat_${Date.now()}_${nextId++}`
}

// User-editable, reorderable category (Classificação) list for Vencimentos —
// own domain, independent from every other module's tags/categories.
export function useBillCategories() {
  const [categories, setCategories] = useState(() => {
    const stored = loadBillCategories()
    return stored ?? DUES_SEED_CATEGORIES
  })

  useEffect(() => {
    saveBillCategories(categories)
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
