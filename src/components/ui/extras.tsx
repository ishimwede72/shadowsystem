import type { ReactNode } from 'react'
import { cn, pad } from '@/lib/utils'

/** Monospace document surface used for dossiers, receipts and exports. */
export function Doc({
  children,
  className,
  label,
}: {
  children: ReactNode
  className?: string
  label?: string
}) {
  return (
    <div className={cn('relative border border-line bg-[#070d12] p-2.5', className)}>
      {label && <span className="absolute -top-2 left-2 bg-panel px-1 font-mono text-[7.5px] uppercase tracking-widest text-ink-3">{label}</span>}
      <pre className="whitespace-pre-wrap break-words font-terminal text-[9.5px] leading-relaxed text-ink-2">{children}</pre>
    </div>
  )
}

/** Thin segmented meter used in dense tables. */
export function Meter({ value, max = 100, tone = 'var(--accent)', segments = 16 }: { value: number; max?: number; tone?: string; segments?: number }) {
  const filled = Math.round((value / max) * segments)
  return (
    <span className="inline-flex gap-[1px]" aria-hidden="true">
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className="h-2 w-[2px]" style={{ background: i < filled ? tone : '#1c2a36' }} />
      ))}
    </span>
  )
}

/** Compact horizontal bar row for ranked lists. */
export function RankBar({ label, value, max, suffix, tone = 'var(--accent)' }: { label: string; value: number; max: number; suffix?: string; tone?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-32 shrink-0 truncate text-[10px] text-ink-2">{label}</span>
      <span className="h-1 flex-1 bg-[#16212b]">
        <span className="block h-full" style={{ width: `${Math.min(100, (value / Math.max(1, max)) * 100)}%`, background: tone }} />
      </span>
      <span className="mono w-14 shrink-0 text-right text-[9px] text-ink-3">{value}{suffix}</span>
    </div>
  )
}

/** Clock-style timestamp used in replay and log surfaces. */
export function Stamp({ ms, offset = 0 }: { ms: number; offset?: number }) {
  const total = Math.floor(ms / 1000) + offset
  const h = Math.floor(total / 3600) % 24
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return <span className="mono text-[9.5px] text-ink-3">T+{pad(h)}:{pad(m)}:{pad(s)}</span>
}

/** Empty-safe list divider wrapper. */
export function Rail({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('space-y-1', className)}>{children}</div>
}
