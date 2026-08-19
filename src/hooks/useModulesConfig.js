import { useEffect, useState } from 'react'
import { loadModulesConfig, saveModulesConfig } from '../lib/storage'
import { MODULE_DEFS } from '../data/modules'

const DEFAULT_ORDER = MODULE_DEFS.map((m) => m.id)

// Topbar module order + hidden set. Hiding a module only removes it from the
// nav — its data and any direct link/callback into it keep working, since
// App.jsx's module switch isn't gated by this at all.
export function useModulesConfig() {
  const [config, setConfig] = useState(() => {
    const stored = loadModulesConfig()
    const order = stored?.order?.length ? stored.order : DEFAULT_ORDER
    // A module shipped after the user's config was already saved wouldn't be
    // in their stored order — append anything missing instead of hiding it.
    const missing = DEFAULT_ORDER.filter((id) => !order.includes(id))
    return { order: [...order, ...missing], hidden: stored?.hidden || [] }
  })

  useEffect(() => {
    saveModulesConfig(config)
  }, [config])

  const reorderModules = (newOrder) => setConfig((prev) => ({ ...prev, order: newOrder }))

  const toggleModuleVisibility = (id) =>
    setConfig((prev) => ({
      ...prev,
      hidden: prev.hidden.includes(id)
        ? prev.hidden.filter((x) => x !== id)
        : [...prev.hidden, id],
    }))

  return { order: config.order, hidden: config.hidden, reorderModules, toggleModuleVisibility }
}
