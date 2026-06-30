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

function blankEvent(start) {
  const s = start || roundToHalfHour(new Date())
  const e = new Date(s.getTime() + 30 * 60000)
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
  setOccurrenceStatus,
  allTags,
  onCreateTag,
  onDeleteTag,
}) {
  const [view, setView] = useState('week')
  const [modal, setModal] = useState(null) // { event }
  const [popover, setPopover] = useState(null) // { occ, rect }

  const title = buildTitle(view, currentDate)

  const handlePrev = () => onChangeDate(stepDate(view, currentDate, -1))
  const handleNext = () => onChangeDate(stepDate(view, currentDate, 1))
  const handleToday = () => onChangeDate(new Date())

  const openCreate = (start) => {
    setPopover(null)
    setModal({ event: blankEvent(start) })
  }

  const openEdit = (occ) => {
    setPopover(null)
    const original = events.find((e) => e.id === occ.eventId)
    if (original) setModal({ event: original })
  }

  const handleSave = (data) => {
    if (data.id) updateEvent(data)
    else addEvent(data)
    setModal(null)
  }

  const handleDelete = (occ) => {
    deleteEvent(occ.eventId)
    setPopover(null)
  }

  const selectDay = (day) => {
    onChangeDate(new Date(day))
    setView('day')
  }

  const viewProps = {
    currentDate,
    events,
    onEventClick: (occ, rect) => setPopover({ occ, rect }),
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
        {view === 'week' && <WeekView {...viewProps} onSlotClick={openCreate} />}
        {view === 'day' && <DayView {...viewProps} onSlotClick={openCreate} />}
        {view === 'month' && <MonthView {...viewProps} onSelectDay={selectDay} />}
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
