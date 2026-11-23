import { Link } from 'react-router-dom'
import { Compass, ArrowLeft } from 'lucide-react'
import { ShadowMark } from '@/components/brand/Logo'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <ShadowMark size={52} />
      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--accent)]">ERROR 404</p>
      <h1 className="mt-2 font-display text-3xl font-semibold uppercase tracking-wide text-ink">Route not found</h1>
      <p className="mt-2 max-w-md text-[12px] text-ink-2">
        This operational route does not exist in the current simulation build. The command center remains available.
      </p>
      <div className="mt-5 flex gap-2">
        <Link to="/command-center" className="btn btn-primary"><Compass size={12} /> Command center</Link>
        <Link to="/" className="btn"><ArrowLeft size={12} /> Landing page</Link>
      </div>
    </div>
  )
}
