import { MODULE_DEFS } from '../data/modules'

// Pure helpers for the top bar configuration: module order, hidden modules
// and user-defined groups ("drawers"). See useModulesConfig for the shape.

const DEFAULT_ORDER = MODULE_DEFS.map((m) => m.id)
const ALL_MODULE_IDS = new Set(DEFAULT_ORDER)

export const groupSentinel = (groupId) => `group:${groupId}`
const isGroupEntry = (entry) => entry.startsWith('group:')
const groupIdOf = (entry) => entry.slice('group:'.length)

// Repairs whatever was on disk into a config the rest of this hook can trust:
// every real module accounted for exactly once (either loose in `order` or
// inside one group's `moduleIds`), every group's sentinel present in `order`,
// and nothing referencing a module or group that no longer exists. Runs once
// per load, not on every render — corruption here would otherwise resurface
// on every mutation.
export function repairConfig(stored) {
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

// The module the top bar lists first, skipping hidden ones and looking inside
// groups — where the app should open. Null only if every module is hidden.
export function firstVisibleModuleId({ order, groups, hidden }) {
  const groupById = Object.fromEntries(groups.map((g) => [g.id, g]))
  for (const entry of order) {
    const ids = isGroupEntry(entry) ? groupById[groupIdOf(entry)]?.moduleIds || [] : [entry]
    const visible = ids.find((id) => ALL_MODULE_IDS.has(id) && !hidden.includes(id))
    if (visible) return visible
  }
  return null
}

