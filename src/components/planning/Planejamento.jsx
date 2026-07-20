import { useState } from 'react'
import { WEEKDAYS_SHORT_ORDERED } from '../../constants'
import { cellKey } from '../../lib/planningGrid'
import CategoryPalette from './CategoryPalette'
import PlanningGrid from './PlanningGrid'
import PlanningSettingsModal from './PlanningSettingsModal'
import WindowOptionsPopover from './WindowOptionsPopover'
import DescriptionModal from './DescriptionModal'
import ConfirmDialog from '../common/ConfirmDialog'

function windowLabel(day, hour, half) {
  const d = WEEKDAYS_SHORT_ORDERED[day]
  const pad = (n) => String(n).padStart(2, '0')
  if (half == null) return `${d} ${pad(hour)}:00–${pad(hour + 1)}:00`
  if (half === 0) return `${d} ${pad(hour)}:00–${pad(hour)}:30`
  return `${d} ${pad(hour)}:30–${pad(hour + 1)}:00`
}

// Planejamento module: a single fixed weekly grid representing the user's
// default routine (no dates, no navigation) — painted cell-by-cell with a
// brush selected from a user-editable, reorderable category list. Windows
// can be split into 30-min halves and carry a free-text description. Fully
// independent from the Agenda module.
export default function Planejamento({
  categories,
  grid,
  splits,
  hourStart,
  hourEnd,
  paintCell,
  clearWindowCompletely,
  setDescription,
  deleteDescription,
  splitWindow,
  mergeWindow,
  addCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  setHourRange,
  windowsOutsideRange,
  isDark,
}) {
  const [activeBrush, setActiveBrush] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [windowPopover, setWindowPopover] = useState(null) // { day, hour, half, rect }
  const [descriptionTarget, setDescriptionTarget] = useState(null) // { day, hour, half }
  const [eraseConfirm, setEraseConfirm] = useState(null) // { day, hour, half }

  const targetEntry = (t) => (t ? grid[cellKey(t.day, t.hour, t.half)] : null)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-base font-semibold text-text">Planejamento</h1>
      </div>

      <CategoryPalette
        categories={categories}
        grid={grid}
        activeBrush={activeBrush}
        onSelectBrush={setActiveBrush}
        onReorder={reorderCategories}
        onManageClick={() => setSettingsOpen(true)}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PlanningGrid
          categories={categories}
          grid={grid}
          splits={splits}
          hourStart={hourStart}
          hourEnd={hourEnd}
          isDark={isDark}
          activeBrush={activeBrush}
          onPaintCell={paintCell}
          onRequestClearWithConfirm={(day, hour, half) => setEraseConfirm({ day, hour, half })}
          onOpenWindowMenu={(payload) => setWindowPopover(payload)}
          onOpenDescription={(payload) => setDescriptionTarget(payload)}
        />
      </div>

      {settingsOpen && (
        <PlanningSettingsModal
          categories={categories}
          onAdd={addCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}
          onReorder={reorderCategories}
          hourStart={hourStart}
          hourEnd={hourEnd}
          onSetHourRange={setHourRange}
          windowsOutsideRange={windowsOutsideRange}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {windowPopover && (
        <WindowOptionsPopover
          rect={windowPopover.rect}
          isSplit={!!splits[cellKey(windowPopover.day, windowPopover.hour)]}
          hasDescription={!!targetEntry(windowPopover)?.description}
          onSplit={() => {
            splitWindow(windowPopover.day, windowPopover.hour)
            setWindowPopover(null)
          }}
          onMerge={() => {
            mergeWindow(windowPopover.day, windowPopover.hour)
            setWindowPopover(null)
          }}
          onDescription={() => {
            setDescriptionTarget(windowPopover)
            setWindowPopover(null)
          }}
          onClose={() => setWindowPopover(null)}
        />
      )}

      {descriptionTarget && (
        <DescriptionModal
          windowLabel={windowLabel(descriptionTarget.day, descriptionTarget.hour, descriptionTarget.half)}
          initialText={targetEntry(descriptionTarget)?.description}
          onSave={(text) => {
            setDescription(descriptionTarget.day, descriptionTarget.hour, descriptionTarget.half, text)
            setDescriptionTarget(null)
          }}
          onDelete={
            targetEntry(descriptionTarget)?.description
              ? () => {
                  deleteDescription(descriptionTarget.day, descriptionTarget.hour, descriptionTarget.half)
                  setDescriptionTarget(null)
                }
              : undefined
          }
          onClose={() => setDescriptionTarget(null)}
        />
      )}

      {eraseConfirm && (
        <ConfirmDialog
          title="Apagar esta janela?"
          message="Isso também apagará a descrição desta janela. Continuar?"
          confirmLabel="Apagar"
          onConfirm={() => {
            clearWindowCompletely(eraseConfirm.day, eraseConfirm.hour, eraseConfirm.half)
            setEraseConfirm(null)
          }}
          onCancel={() => setEraseConfirm(null)}
        />
      )}
    </div>
  )
}
