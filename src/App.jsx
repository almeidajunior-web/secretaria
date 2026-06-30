import { useState } from 'react'
import { Construction } from 'lucide-react'
import { useTheme } from './hooks/useTheme'
import { useEvents } from './hooks/useEvents'
import { useTags } from './hooks/useTags'
import Topbar from './components/layout/Topbar'
import Sidebar from './components/layout/Sidebar'
import Agenda from './components/agenda/Agenda'

// Application shell: top bar + sidebar + active module area. Module routing is
// kept in local state so future modules (To Dos, Finanças, Planejamento) can be
// dropped in without restructuring.
export default function App() {
  const { theme, toggleTheme } = useTheme()
  const eventsApi = useEvents()
  // Seed the tag list from tags already present on the events (first run only).
  const seedTags = [...new Set(eventsApi.events.flatMap((e) => e.tags || []))]
  const tagsApi = useTags(seedTags)
  const [activeModule, setActiveModule] = useState('agenda')
  const [currentDate, setCurrentDate] = useState(() => new Date())

  // Deleting a tag removes it from the managed list and from every event.
  const handleDeleteTag = (tag) => {
    tagsApi.removeTag(tag)
    eventsApi.removeTagFromAllEvents(tag)
  }

  return (
    <div className="flex h-full flex-col bg-app-bg text-text">
      <Topbar theme={theme} onToggleTheme={toggleTheme} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          currentDate={currentDate}
          onSelectDate={setCurrentDate}
        />
        <main className="flex-1 overflow-hidden">
          {activeModule === 'agenda' ? (
            <Agenda
              currentDate={currentDate}
              onChangeDate={setCurrentDate}
              {...eventsApi}
              allTags={tagsApi.tags}
              onCreateTag={tagsApi.addTag}
              onDeleteTag={handleDeleteTag}
            />
          ) : (
            <ModulePlaceholder module={activeModule} />
          )}
        </main>
      </div>
    </div>
  )
}

const MODULE_NAMES = {
  todos: 'To Dos',
  finance: 'Finanças',
  planning: 'Planejamento',
}

function ModulePlaceholder({ module }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-text-muted">
      <Construction size={40} strokeWidth={1.5} />
      <p className="text-base font-semibold text-text-secondary">
        {MODULE_NAMES[module] || 'Módulo'}
      </p>
      <p className="text-sm">Em construção</p>
    </div>
  )
}
