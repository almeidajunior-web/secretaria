import { useEffect, useState } from 'react'
import { loadShoppingCategories, saveShoppingCategories } from '../lib/storage'
import { SHOPPING_SEED_CATEGORIES } from '../data/shoppingSeed'

let nextId = 1
function genCategoryId() {
  return `shopcat_${Date.now()}_${nextId++}`
}

// User-editable, reorderable category (Classificação) list for Compras —
// own domain, independent from every other module's tags/categories. Same
// shape/CRUD pattern as useTaskPriorities/useTaskTags.
export function useShoppingCategories() {
  const [categories, setCategories] = useState(() => {
    const stored = loadShoppingCategories()
    return stored ?? SHOPPING_SEED_CATEGORIES
  })

  useEffect(() => {
    saveShoppingCategories(categories)
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
