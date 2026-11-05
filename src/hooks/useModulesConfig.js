import { useStoredState } from '../storage/useStoredState'
import { modulesConfigStore } from '../storage/stores'
import { groupSentinel } from '../lib/modulesConfig'

export { firstVisibleModuleId } from '../lib/modulesConfig'

// Topbar module order, hidden set, and user-defined groups ("drawers") that
// cluster modules under one dropdown. `order` is the literal top-level
// sequence — each entry is either a bare module id or a `'group:<id>'`
// sentinel — so reordering loose modules and reordering whole groups are the
// same operation on the same array. A group's own members live in that
// group's `moduleIds`, in their own independent order. Hiding a module only
// removes it from the nav — its data and any direct link/callback into it
// keep working, since App.jsx's module switch isn't gated by this at all.
export function useModulesConfig() {
  // Always a repaired config — the store repairs whatever it reads (see
  // lib/modulesConfig.js#repairConfig).
  const [config, setConfig] = useStoredState(modulesConfigStore)

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
