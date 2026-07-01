import { useState } from 'react'
import {
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addYears,
  subYears,
} from 'date-fns'
import { fmt, capitalize, roundToHalfHour } from '../../lib/date'
import { EVENT_COLORS } from '../../constants'
import AgendaToolbar from './AgendaToolbar'
import WeekView from './WeekView'
import DayView from './DayView'
import MonthView from './MonthView'
import YearView from './YearView'
import EventPopover from './EventPopover'
import EventModal from './EventModal'
import RecurrenceScopeDialog from './RecurrenceScopeDialog'

function blankEvent(start, end) {
  const s = start || roundToHalfHour(new Date())
  const e = end || new Date(s.getTime() + 30 * 60000)
  return {
    title: '',
    start: s,
    end: e,
    local: '',
    color: EVENT_COLORS[0],
    tags: [],
    status: 'unconfirmed',
    recurrence: 'none',
    recurrenceDays: [],
    recurrenceUntil: null,
    isAula: false,
    faltasMax: null,
    occStatus: {},
    exdates: [],
  }
}

// Orchestrates the agenda: toolbar, the four views, and the modal/popover.
export default function Agenda({
  currentDate,
  onChangeDate,
  events,
  addEvent,
  updateEvent,
  deleteEvent,
  moveOccurrence,
  deleteOccurrence,
  editOccurrence,
  setOccurrenceStatus,
  allTags,
  onCreateTag,
  onDeleteTag,
}) {
  const [view, setView] = useState('week')
  const [modal, setModal] = useState(null) // { event, occ? }
  const [popover, setPopover] = useState(null) // { occ, rect }
  const [scopeAction, setScopeAction] = useState(null) // { kind, occ, ... }

  const title = buildTitle(view, currentDate)

  const handlePrev = () => onChangeDate(stepDate(view, currentDate, -1))
  const handleNext = () => onChangeDate(stepDate(view, currentDate, 1))
  const handleToday = () => onChangeDate(new Date())

  const openCreate = (start, end) => {
    setPopover(null)
    setModal({ event: blankEvent(start, end) })
  }

  const openEdit = (occ) => {
    setPopover(null)
    const original = events.find((e) => e.id === occ.eventId)
    // Edit the specific instance's date/time while keeping the series identity.
    if (original) setModal({ event: { ...original, start: occ.start, end: occ.end }, occ })
  }

  const handleSave = (data) => {
    const occ = modal?.occ
    setModal(null)
    if (!data.id) {
      addEvent(data)
      return
    }
    const event = events.find((e) => e.id === data.id)
    if (event && event.recurrence !== 'none' && occ) {
      setScopeAction({ kind: 'edit', occ, data })
    } else {
      updateEvent(data)
    }
  }

  const handleMove = (occ, newStart, newEnd) => {
    const event = events.find((e) => e.id === occ.eventId)
    if (event && event.recurrence !== 'none') {
      setScopeAction({ kind: 'move', occ, newStart, newEnd })
    } else {
      moveOccurrence(occ, newStart, newEnd, 'all')
    }
  }

  const handleDelete = (occ) => {
    setPopover(null)
    const event = events.find((e) => e.id === occ.eventId)
    if (event && event.recurrence !== 'none') {
      setScopeAction({ kind: 'delete', occ })
    } else {
      deleteEvent(occ.eventId)
    }
  }

  const applyScope = (scope) => {
    const a = scopeAction
    setScopeAction(null)
    if (!a) return
    if (a.kind === 'move') moveOccurrence(a.occ, a.newStart, a.newEnd, scope)
    else if (a.kind === 'delete') deleteOccurrence(a.occ, scope)
    else if (a.kind === 'edit') editOccurrence(a.occ, a.data, scope)
  }

  const selectDay = (day) => {
    onChangeDate(new Date(day))
    setView('day')
  }

  const viewProps = {
    currentDate,
    events,
    onCreateRange: openCreate,
    onEventClick: (occ, rect) => setPopover({ occ, rect }),
    onMove: handleMove,
  }

  return (
    <div className="flex h-full flex-col">
      <AgendaToolbar
        view={view}
        onChangeView={setView}
        title={title}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onNew={() => openCreate()}
      />

      <div className="flex-1 overflow-hidden">
        {view === 'week' && <WeekView {...viewProps} />}
        {view === 'day' && <DayView {...viewProps} />}
        {view === 'month' && (
          <MonthView currentDate={currentDate} events={events} onSelectDay={selectDay} />
        )}
        {view === 'year' && <YearView currentDate={currentDate} onSelectDay={selectDay} />}
      </div>

      {popover && (
        <EventPopover
          occ={popover.occ}
          events={events}
          rect={popover.rect}
          onClose={() => setPopover(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onSetStatus={setOccurrenceStatus}
        />
      )}

      {modal && (
        <EventModal
          initial={modal.event}
          allTags={allTags}
          onCreateTag={onCreateTag}
          onDeleteTag={onDeleteTag}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {scopeAction && (
        <RecurrenceScopeDialog
          kind={scopeAction.kind}
          onChoose={applyScope}
          onCancel={() => setScopeAction(null)}
        />
      )}
    </div>
  )
}

function stepDate(view, date, dir) {
  switch (view) {
    case 'day':
      return dir > 0 ? addDays(date, 1) : subDays(date, 1)
    case 'week':
      return dir > 0 ? addWeeks(date, 1) : subWeeks(date, 1)
    case 'month':
      return dir > 0 ? addMonths(date, 1) : subMonths(date, 1)
    case 'year':
      return dir > 0 ? addYears(date, 1) : subYears(date, 1)
    default:
      return date
  }
}

function buildTitle(view, date) {
  switch (view) {
    case 'day':
      return capitalize(fmt(date, "d 'de' MMMM 'de' yyyy"))
    case 'year':
      return fmt(date, 'yyyy')
    default:
      return capitalize(fmt(date, 'MMMM yyyy'))
  }
}
