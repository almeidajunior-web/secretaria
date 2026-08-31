import { Repeat } from 'lucide-react'
import { toDateInput } from '../../lib/date'
import { isOverdue } from '../../lib/taskFormat'
import { isBillOverdue } from '../../lib/billFormat'
import { formatCurrency } from '../../lib/currency'
import { tintVars } from '../../lib/color'

// Read-only digest of what else falls on one day, shown under the Agenda's
// mini calendar. `date` is the Agenda's `currentDate`, which is also the day
// the calendar above highlights — so this panel always answers for the lit
// day. That coupling is the point of the widget, not an accident: navigating
// the agenda by week moves both together.
//
// Deliberately not clickable. Opening the owning module filtered to this day
// would need a cross-module filter channel that doesn't exist (and Vencimentos
// has no date filter at all), and a row that looks clickable without being so
// is worse than one that plainly reads as information.
export default function DaySummary({ date, tasks, doneStatusIds, priorities, bills, categories }) {
  const dayStr = toDateInput(date)
  // Tasks and bills both store `dueDate` as 'yyyy-MM-dd', so the day match is
  // a string compare — no parsing, no timezone drift.
  const dayTasks = tasks.filter((t) => t.dueDate === dayStr)
  const dayBills = bills.filter((b) => b.dueDate === dayStr)

  if (dayTasks.length === 0 && dayBills.length === 0) {
    return <p className="px-1 text-[11px] text-text-muted">Nada para este dia.</p>
  }

  const priorityById = Object.fromEntries(priorities.map((p) => [p.id, p]))
  const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]))

  return (
    <div className="flex flex-col gap-3">
      {dayTasks.length > 0 && (
        <Section label="Tarefas" count={dayTasks.length}>
          {dayTasks.map((t) => (
            <Row
              key={t.id}
              color={priorityById[t.priorityId]?.color}
              title={t.title}
              struck={doneStatusIds.has(t.status)}
              alert={isOverdue(t, doneStatusIds)}
              recurring={t.recurrence && t.recurrence !== 'none'}
            />
          ))}
        </Section>
      )}

      {dayBills.length > 0 && (
        <Section label="Vencimentos" count={dayBills.length}>
          {dayBills.map((b) => (
            <Row
              key={b.id}
              color={categoryById[b.categoryId]?.color}
              title={b.title}
              struck={b.paid}
              alert={isBillOverdue(b)}
              recurring={b.recurrence && b.recurrence !== 'none'}
              trailing={formatCurrency(b.amount)}
            />
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ label, count, children }) {
  return (
    <div>
      <p className="mb-1.5 flex items-baseline gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
        <span className="font-medium text-text-secondary">{count}</span>
      </p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

function Row({ color, title, struck, alert, recurring, trailing }) {
  return (
    <div className="flex items-center gap-1.5 px-1 text-[11px] leading-tight">
      {color ? (
        <span className="tint-fill h-1.5 w-1.5 shrink-0 rounded-full" style={tintVars(color)} />
      ) : (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full border border-border-strong" />
      )}
      <span
        className={[
          'min-w-0 flex-1 truncate',
          struck ? 'text-text-muted line-through' : alert ? 'text-danger' : 'text-text-secondary',
        ].join(' ')}
        title={title}
      >
        {title}
      </span>
      {recurring && <Repeat size={10} className="shrink-0 text-text-muted" />}
      {trailing && (
        <span className="shrink-0 tabular-nums text-[10px] text-text-muted">{trailing}</span>
      )}
    </div>
  )
}
