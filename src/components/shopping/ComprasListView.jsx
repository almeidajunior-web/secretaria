import { useEffect, useState } from 'react'
import { Circle, CircleCheck, Plus, Trash2 } from 'lucide-react'
import DescriptionPopover from '../common/DescriptionPopover'
import ChipSelect from '../common/ChipSelect'

// Flat or grouped (by Classificação) item list, every field editable
// directly in the row — no modal in this module at all, everything is
// either inline or a small popover (Descrição). A quick-add row at the
// bottom creates new items without any extra step.
export default function ComprasListView({
  groups,
  categories,
  priorities,
  onToggle,
  onUpdateItem,
  onDeleteClick,
  selectMode,
  selectedIds,
  onToggleSelect,
  onQuickAdd,
}) {
  const isEmpty = groups.every((g) => g.items.length === 0)

  return (
    <div className="thin-scroll flex h-full flex-col overflow-auto">
      {isEmpty ? (
        <p className="px-5 py-8 text-center text-sm text-text-muted">
          Nenhum item por aqui. Use a linha abaixo para adicionar o primeiro.
        </p>
      ) : (
        <div className="flex flex-col">
          {groups.map((group) => (
            <div key={group.key}>
              {group.label && (
                <div className="glass sticky top-0 z-[1] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  {group.label} <span className="font-normal normal-case">({group.items.length})</span>
                </div>
              )}
              {group.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  categories={categories}
                  priorities={priorities}
                  onToggle={() => onToggle(item.id, !item.purchased)}
                  onUpdateItem={onUpdateItem}
                  onDeleteClick={() => onDeleteClick(item.id)}
                  selectMode={selectMode}
                  selected={selectedIds?.has(item.id)}
                  onToggleSelect={() => onToggleSelect(item.id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <QuickAddRow categories={categories} priorities={priorities} onQuickAdd={onQuickAdd} />
    </div>
  )
}

function ItemRow({
  item,
  categories,
  priorities,
  onToggle,
  onUpdateItem,
  onDeleteClick,
  selectMode,
  selected,
  onToggleSelect,
}) {
  const [title, setTitle] = useState(item.title)

  // Resyncs if the title ever changes from outside this input.
  useEffect(() => {
    setTitle(item.title)
  }, [item.title])

  const commitTitle = () => {
    const t = title.trim()
    if (t && t !== item.title) onUpdateItem({ ...item, title: t })
    else setTitle(item.title)
  }

  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2 hover:bg-accent-soft/30">
      {selectMode && (
        <input
          type="checkbox"
          checked={!!selected}
          onChange={onToggleSelect}
          className="h-3.5 w-3.5 shrink-0"
        />
      )}

      <button
        type="button"
        onClick={onToggle}
        aria-label={item.purchased ? 'Marcar como pendente' : 'Marcar como comprado'}
        className="flex h-6 w-6 shrink-0 items-center justify-center text-text-muted hover:text-primary"
      >
        {item.purchased ? (
          <CircleCheck size={18} className="text-primary" fill="currentColor" fillOpacity={0.15} />
        ) : (
          <Circle size={18} />
        )}
      </button>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className={[
          'min-w-0 flex-1 bg-transparent text-[13px] outline-none',
          item.purchased ? 'text-text-muted line-through' : 'text-text',
        ].join(' ')}
      />

      <DescriptionPopover item={item} onUpdateItem={onUpdateItem} />

      <ChipSelect
        value={item.categoryId || null}
        options={categories}
        onChange={(id) => onUpdateItem({ ...item, categoryId: id })}
        nullLabel="Sem classificação"
        clearLabel="Sem classificação"
      />

      <ChipSelect
        value={item.priorityId || null}
        options={priorities}
        onChange={(id) => onUpdateItem({ ...item, priorityId: id })}
        nullLabel="Sem prioridade"
        clearLabel="Sem prioridade"
      />

      <button
        type="button"
        onClick={onDeleteClick}
        aria-label={`Excluir ${item.title}`}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-danger/15 hover:text-danger"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function QuickAddRow({ categories, priorities, onQuickAdd }) {
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priorityId, setPriorityId] = useState('')

  const commit = () => {
    const t = title.trim()
    if (!t) return
    onQuickAdd({
      title: t,
      categoryId: categoryId || null,
      priorityId: priorityId || null,
    })
    setTitle('')
  }

  return (
    <div className="mt-auto flex items-center gap-2 border-t border-border px-4 py-2">
      <Plus size={14} className="shrink-0 text-text-muted" />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        placeholder="Novo item…"
        className="flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
      />
      <ChipSelect
        value={categoryId || null}
        options={categories}
        onChange={(id) => setCategoryId(id || '')}
        nullLabel="Classificação"
        clearLabel="Sem classificação"
      />
      <ChipSelect
        value={priorityId || null}
        options={priorities}
        onChange={(id) => setPriorityId(id || '')}
        nullLabel="Prioridade"
        clearLabel="Sem prioridade"
      />
      <button
        type="button"
        onClick={commit}
        disabled={!title.trim()}
        className="rounded-md bg-primary px-3 py-1 text-[11px] font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        Adicionar
      </button>
    </div>
  )
}
