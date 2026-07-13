import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

// Catches render-time errors in the wrapped subtree (scoped to the active
// module in App.jsx, not the whole shell) so a bug in one module shows a
// recoverable message instead of unmounting the entire app to a blank
// white page — the sidebar/topbar stay usable, and the error text (visible
// here and logged to the console) is what we need to diagnose the crash.
// `resetKey` changing (e.g. switching modules) clears the error automatically.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught a render error:', error, info)
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
          <AlertTriangle size={28} className="text-danger" />
          <p className="text-sm font-semibold text-text">Algo deu errado neste módulo</p>
          <p className="max-w-md text-xs text-text-muted">
            Seus dados não foram perdidos — eles continuam salvos no navegador. Tente novamente ou troque de
            módulo na barra lateral.
          </p>
          <pre className="mt-2 max-w-lg overflow-auto rounded-md border border-border bg-surface p-2.5 text-left text-[10px] text-text-muted">
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
          >
            <RotateCcw size={13} />
            Tentar de novo
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
