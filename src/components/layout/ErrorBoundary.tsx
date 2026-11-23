import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw, TriangleAlert } from 'lucide-react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SHADOW SYSTEMS] runtime error', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-grid-bg flex min-h-screen items-center justify-center p-6">
          <div className="panel corner-marks max-w-lg p-6 text-center">
            <TriangleAlert size={28} className="mx-auto text-amber" />
            <h1 className="mt-3 font-display text-lg uppercase tracking-wide text-ink">Module fault isolated</h1>
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-2">
              The simulation engine intercepted an unexpected runtime error. No data was transmitted anywhere — this is a
              local demonstration environment.
            </p>
            <pre className="mt-3 max-h-28 overflow-auto border border-line bg-bg p-2 text-left font-mono text-[10px] text-red">
              {this.state.error.message}
            </pre>
            <div className="mt-4 flex justify-center gap-2">
              <button type="button" className="btn btn-primary" onClick={() => { this.setState({ error: null }); window.location.reload() }}>
                <RotateCcw size={12} /> Restart interface
              </button>
              <button type="button" className="btn" onClick={() => window.location.assign('/command-center')}>
                Command center
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
