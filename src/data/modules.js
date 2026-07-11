import { CalendarDays, LayoutDashboard, CircleCheck, ShoppingCart, Receipt, Wallet } from 'lucide-react'

// Central module registry — id, sidebar label and icon — shared by the
// Sidebar nav, the module order/visibility settings modal, and the
// placeholder screen for modules not yet built. Adding a module here is
// enough to make it navigable and show up in both places.
export const MODULE_DEFS = [
  { id: 'agenda', label: 'Agenda', icon: CalendarDays },
  { id: 'planning', label: 'Planejamento', icon: LayoutDashboard },
  { id: 'todos', label: 'Tarefas', icon: CircleCheck },
  { id: 'compras', label: 'Compras', icon: ShoppingCart },
  { id: 'vencimentos', label: 'Vencimentos', icon: Receipt },
  { id: 'finance', label: 'Finanças', icon: Wallet },
]
