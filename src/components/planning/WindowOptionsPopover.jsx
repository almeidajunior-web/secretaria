import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SplitSquareHorizontal, Merge, FileText } from 'lucide-react'

const WIDTH = 220

// Small popover anchored next to a right-clicked, filled grid window —
// offers splitting/merging the hour and adding/editing its description.
// Same anchored-position/outside-click-to-close pattern as EventPopover.
export default function WindowOptionsPopover({
  rect,
  isSplit,
  hasDescription,
  onSplit,
  onMerge,
  onDescription,
  onClose,
}) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ left: rect.left, top: rect.bottom + 4 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const w = el.offsetWidth || WIDTH
    const h = el.offsetHeight
    let left = rect.left
    if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8
    left = Math.max(8, left)
    let top = rect.bottom + 4
    if (top + h > window.innerHeight - 8) top = rect.top - h - 4
    top = Math.max(8, top)
    setPos({ left, top })
  }, [rect])

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{ left: pos.left, top: pos.top, width: WIDTH }}
      className="fixed z-50 flex flex-col gap-0.5 rounded-xl border border-border bg-surface p-1.5 shadow-lg"
    >
      {isSplit ? (
        <MenuButton icon={Merge} onClick={onMerge}>
          Unir novamente
        </MenuButton>
      ) : (
        <MenuButton icon={SplitSquareHorizontal} onClick={onSplit}>
          Dividir em blocos de 30 min
        </MenuButton>
      )}
      <MenuButton icon={FileText} onClick={onDescription}>
        {hasDescription ? 'Editar descrição' : 'Adicionar descrição'}
      </MenuButton>
    </div>
  )
}

function MenuButton({ icon: Icon, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-text-secondary hover:bg-accent-soft hover:text-primary"
    >
      <Icon size={14} className="shrink-0" />
      {children}
    </button>
  )
}
