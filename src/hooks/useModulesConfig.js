import { useEffect, useState } from 'react'
import { loadModulesConfig, saveModulesConfig } from '../lib/storage'
import { MODULE_DEFS } from '../data/modules'

const DEFAULT_ORDER = MODULE_DEFS.map((m) => m.id)
const ALL_MODULE_IDS = new Set(DEFAULT_ORDER)

const groupSentinel = (groupId) => `group:${groupId}`
const isGroupEntry = (entry) => entry.startsWith('group:')
const groupIdOf = (entry) => entry.slice('group:'.length)

// Repairs whatever was on disk into a config the rest of this hook can trust:
// every real module accounted for exactly once (either loose in `order` or
// inside one group's `moduleIds`), every group's sentinel present in `order`,
// and nothing referencing a module or group that no longer exists. Runs once
// per load, not on every render — corruption here would otherwise resurface
// on every mutation.
function repairConfig(stored) {
  const order = stored?.order?.length ? [...stored.order] : [...DEFAULT_ORDER]
  const hidden = stored?.hidden || []
  // Rebuilt field by field rather than spread, so a stray key from an older
  // shape (groups used to carry a `color`) doesn't survive the round trip.
  const groups = (stored?.groups || []).map((g) => ({
    id: g.id,
    label: g.label,
    moduleIds: g.moduleIds.filter((id) => ALL_MODULE_IDS.has(id)),
  }))

  const inGroup = new Set(groups.flatMap((g) => g.moduleIds))

  // A module referenced by a group is no longer loose — drop any stray bare
  // entry for it left over in `order` (belt-and-suspenders; normal mutation
  // through this hook never produces this, but a hand-edited/old backup
  // could).
  let repaired = order.filter((entry) => isGroupEntry(entry) || !inGroup.has(entry))

  // Every group needs exactly one sentinel in `order` — append if missing.
  for (const g of groups) {
    if (!repaired.includes(groupSentinel(g.id))) repaired.push(groupSentinel(g.id))
  }

  // Drop sentinels for groups that no longer exist.
  const groupIds = new Set(groups.map((g) => g.id))
  repaired = repaired.filter((entry) => !isGroupEntry(entry) || groupIds.has(groupIdOf(entry)))

  // A module shipped after this config was saved is in neither `order` nor
  // any group — append it loose rather than hiding it.
  const accountedFor = new Set([...repaired.filter((e) => !isGroupEntry(e)), ...inGroup])
  const missing = DEFAULT_ORDER.filter((id) => !accountedFor.has(id))

  return { order: [...repaired, ...missing], hidden, groups }
}

// Topbar module order, hidden set, and user-defined groups ("drawers") that
// cluster modules under one dropdown. `order` is the literal top-level
// sequence — each entry is either a bare module id or a `'group:<id>'`
// sentinel — so reordering loose modules and reordering whole groups are the
// same operation on the same array. A group's own members live in that
// group's `moduleIds`, in their own independent order. Hiding a module only
// removes it from the nav — its data and any direct link/callback into it
// keep working, since App.jsx's module switch isn't gated by this at all.
export function useModulesConfig() {
  const [config, setConfig] = useState(() => repairConfig(loadModulesConfig()))

  useEffect(() => {
    saveModulesConfig(config)
  }, [config])

  const toggleModuleVisibility = (id) =>
    setConfig((prev) => ({
      ...prev,
      hidden: prev.hidden.includes(id)
        ? prev.hidden.filter((x) => x !== id)
        : [...prev.hidden, id],
    }))

  // Moves a module to a specific slot: `targetGroupId` is the destination
  // group's id, or null for the top-level loose list; `beforeModuleId` is the
  // existing module to insert ahead of, or null to append at the end of the
  // destination. Removing the module from wherever it currently lives is
  // always the first step, so reordering within one container and moving
  // across containers are the same code path.
  const moveModule = (moduleId, targetGroupId, beforeModuleId) =>
    setConfig((prev) => {
      const order = prev.order.filter((entry) => entry !== moduleId)
      const strippedGroups = prev.groups.map((g) => ({
        ...g,
        moduleIds: g.moduleIds.filter((id) => id !== moduleId),
      }))

      if (targetGroupId == null) {
        const at = beforeModuleId ? order.indexOf(beforeModuleId) : -1
        order.splice(at === -1 ? order.length : at, 0, moduleId)
        return { ...prev, order, groups: strippedGroups }
      }

      const groups = strippedGroups.map((g) => {
        if (g.id !== targetGroupId) return g
        const at = beforeModuleId ? g.moduleIds.indexOf(beforeModuleId) : -1
        const moduleIds = [...g.moduleIds]
        moduleIds.splice(at === -1 ? moduleIds.length : at, 0, moduleId)
        return { ...g, moduleIds }
      })
      return { ...prev, order, groups }
    })

  // Reorders a group among the top-level entries (other groups and loose
  // modules alike). Groups can't nest, so this never touches `groups` itself.
  const moveGroup = (groupId, beforeEntry) =>
    setConfig((prev) => {
      const sentinel = groupSentinel(groupId)
      const order = prev.order.filter((entry) => entry !== sentinel)
      const at = beforeEntry ? order.indexOf(beforeEntry) : -1
      order.splice(at === -1 ? order.length : at, 0, sentinel)
      return { ...prev, order }
    })

  const createGroup = (label) => {
    const id = `group_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    setConfig((prev) => ({
      ...prev,
      groups: [...prev.groups, { id, label, moduleIds: [] }],
      order: [...prev.order, groupSentinel(id)],
    }))
    return id
  }

  const updateGroup = (id, patch) =>
    setConfig((prev) => ({
      ...prev,
      groups: prev.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }))

  // Deleting a group returns its modules to the loose top-level list, in
  // their place — it un-nests, rather than losing them.
  const deleteGroup = (id) =>
    setConfig((prev) => {
      const group = prev.groups.find((g) => g.id === id)
      if (!group) return prev
      const sentinel = groupSentinel(id)
      const order = [...prev.order]
      const at = order.indexOf(sentinel)
      if (at === -1) order.push(...group.moduleIds)
      else order.splice(at, 1, ...group.moduleIds)
      return { ...prev, order, groups: prev.groups.filter((g) => g.id !== id) }
    })

  return {
    order: config.order,
    hidden: config.hidden,
    groups: config.groups,
    toggleModuleVisibility,
    moveModule,
    moveGroup,
    createGroup,
    updateGroup,
    deleteGroup,
  }
}
