import { useEffect, useState } from 'react'
import { loadFinancePaymentMethods, saveFinancePaymentMethods } from '../lib/storage'
import { FINANCE_SEED_PAYMENT_METHODS } from '../data/financeSeed'

let nextId = 1
function genMethodId() {
  return `finpm_${Date.now()}_${nextId++}`
}

// User-editable, reorderable payment method list (Dinheiro, Pix, Crédito...).
export function useFinancePaymentMethods() {
  const [methods, setMethods] = useState(() => {
    const stored = loadFinancePaymentMethods()
    return stored ?? FINANCE_SEED_PAYMENT_METHODS
  })

  useEffect(() => {
    saveFinancePaymentMethods(methods)
  }, [methods])

  const addMethod = (label, color) => {
    const l = label.trim()
    if (!l) return null
    const id = genMethodId()
    setMethods((prev) => [...prev, { id, label: l, color }])
    return id
  }

  const updateMethod = (id, patch) => {
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  const deleteMethod = (id) => {
    setMethods((prev) => prev.filter((m) => m.id !== id))
  }

  const reorderMethods = (newOrderIds) => {
    setMethods((prev) => newOrderIds.map((id) => prev.find((m) => m.id === id)).filter(Boolean))
  }

  return { methods, addMethod, updateMethod, deleteMethod, reorderMethods }
}
