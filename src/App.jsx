import { Suspense, lazy, useEffect, useState } from 'react'
import { Construction } from 'lucide-react'
import { useTheme } from './hooks/useTheme'
import { usePrivacyMode } from './hooks/usePrivacyMode'
import { useModulesConfig, firstVisibleModuleId } from './hooks/useModulesConfig'
import { MODULE_DEFS } from './data/modules'
import { useModuleData } from './app/useModuleData'
import Topbar from './components/layout/Topbar'
import ModulesSettingsModal from './components/layout/ModulesSettingsModal'
import PrivacyOverlay from './components/layout/PrivacyOverlay'
import StorageNotice from './components/layout/StorageNotice'
import ErrorBoundary from './components/common/ErrorBoundary'

const MODULE_NAMES = Object.fromEntries(MODULE_DEFS.map((m) => [m.id, m.label]))

// Screen for each module id (see data/modules.js for the registry). Each is
// its own bundle: opening the app downloads only the shell, the data layer
// and the module on screen; the rest follow in the background (see
// preloadModules), so switching modules stays instant.
const MODULE_LOADERS = {
  agenda: () => import('./components/agenda/Agenda'),
  planning: () => import('./components/planning/Planejamento'),
  todos: () => import('./components/tasks/Tarefas'),
  compras: () => import('./components/shopping/Compras'),
  vencimentos: () => import('./components/dues/Vencimentos'),
  finance: () => import('./components/finance/Financas'),
  metas: () => import('./components/goals/Metas'),
}
const MODULE_SCREENS = Object.fromEntries(Object.entries(MODULE_LOADERS).map(([id, load]) => [id, lazy(load)]))

// Fetches every module bundle once the browser is idle after the first paint.
function preloadModules() {
  const run = () => Object.values(MODULE_LOADERS).forEach((load) => load().catch(() => {}))
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 })
  else setTimeout(run, 1500)
}

// Application shell: a top bar carrying both the brand and the module
// navigation, over the active module's full-width area. Module routing is kept
// in local state so future modules can be dropped in without restructuring.
export default function App() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const { hidden: privacyHidden, togglePrivacyMode } = usePrivacyMode()
  const modulesConfigApi = useModulesConfig()
  const { modules, badges } = useModuleData()
  // Opens on the first module the top bar shows — normally the Agenda, but
  // not when the Agenda has been hidden, which used to land on a module with
  // no nav item lit.
  const [activeModule, setActiveModule] = useState(
    () => firstVisibleModuleId(modulesConfigApi) ?? 'agenda'
  )
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [modulesSettingsOpen, setModulesSettingsOpen] = useState(false)

  // What only the shell knows: the Agenda's date (kept here so it survives
  // switching modules) and the theme, which the grids need for colors.
  const shellProps = {
    agenda: { currentDate, onChangeDate: setCurrentDate, isDark },
    planning: { isDark },
  }
  const ActiveModule = MODULE_SCREENS[activeModule]

  useEffect(preloadModules, [])

  return (
    <div className="app-ground flex h-full flex-col text-text">
      <Topbar
        theme={theme}
        privacyHidden={privacyHidden}
        onTogglePrivacy={togglePrivacyMode}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        moduleOrder={modulesConfigApi.order}
        hiddenModules={modulesConfigApi.hidden}
        moduleGroups={modulesConfigApi.groups}
        badges={badges}
        onOpenSettings={() => setModulesSettingsOpen(true)}
      />
      <StorageNotice />
      {/* `relative` anchors PrivacyOverlay's `absolute inset-0`, which is why
          this wrapper stays even with a single child. */}
      <div className="relative flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-hidden">
          <ErrorBoundary resetKey={activeModule}>
          {/* No spinner: a module bundle arrives in a blink, and a flashing
              loader would read as the app being slow. */}
          <Suspense fallback={null}>
            {ActiveModule ? (
              <ActiveModule {...modules[activeModule]} {...shellProps[activeModule]} />
            ) : (
              <ModulePlaceholder module={activeModule} />
            )}
          </Suspense>
          </ErrorBoundary>
        </main>

        {privacyHidden && <PrivacyOverlay />}
      </div>

      {modulesSettingsOpen && (
        <ModulesSettingsModal
          order={modulesConfigApi.order}
          hidden={modulesConfigApi.hidden}
          groups={modulesConfigApi.groups}
          onToggleVisibility={modulesConfigApi.toggleModuleVisibility}
          onMoveModule={modulesConfigApi.moveModule}
          onMoveGroup={modulesConfigApi.moveGroup}
          onCreateGroup={modulesConfigApi.createGroup}
          onUpdateGroup={modulesConfigApi.updateGroup}
          onDeleteGroup={modulesConfigApi.deleteGroup}
          theme={theme}
          onToggleTheme={toggleTheme}
          onClose={() => setModulesSettingsOpen(false)}
        />
      )}
    </div>
  )
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
