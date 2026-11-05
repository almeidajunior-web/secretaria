import { vencimentoDaCompra } from '../../../lib/creditCard'

// Pure helpers for the lançamentos table rows.

// The invoice due date for a credit entry, or null for anything else.
export function invoiceDueDate(entry, creditCfg) {
  if (entry.paymentMethodId !== 'credito' || !entry.date || !creditCfg?.closingDay || !creditCfg?.dueDay) {
    return null
  }
  return vencimentoDaCompra(entry.date, creditCfg.closingDay, creditCfg.dueDay)
}

// Strips the "(i/N)" suffix installments carry, for the collapsed group title.
export function baseInstallmentTitle(title) {
  return (title || '').replace(/\s*\(\d+\/\d+\)\s*$/, '')
}

// Turns a flat, already-sorted entry list into render units: installment
// series (same installmentGroupId) collapse into one group; everything else is
// a single row. Order follows the first-seen member of each series.
export function buildRenderUnits(entries) {
  const units = []
  const groupIndex = new Map()
  for (const entry of entries) {
    const gid = entry.installmentGroupId
    if (!gid) {
      units.push({ kind: 'single', key: entry.id, entry })
      continue
    }
    if (groupIndex.has(gid)) {
      units[groupIndex.get(gid)].items.push(entry)
    } else {
      groupIndex.set(gid, units.length)
      units.push({ kind: 'group', key: gid, groupId: gid, items: [entry] })
    }
  }
  return units
}
