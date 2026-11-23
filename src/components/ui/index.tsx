import { useEffect, useRef, useState, type ReactNode, type ElementType } from 'react'
import { cn, pad, fmtNum } from '@/lib/utils'
import { ChevronDown, ChevronRight, X, AlertTriangle, Inbox } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Severity, RiskLevel } from '@/types'

// ---------------------------------------------------------------- Panel -----
export function Panel({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className,
  bodyClassName,
  dense,
  scroll,
  corners = true,
  badge,
}: {
  title?: string
  subtitle?: string
  icon?: LucideIcon
  actions?: ReactNode
  children?: ReactNode
  className?: string
  bodyClassName?: string
  dense?: boolean
  scroll?: boolean
  corners?: boolean
  badge?: ReactNode
}) {
  return (
    <section className={cn('panel flex min-h-0 flex-col', corners && 'corner-marks', className)}>
      {(title || actions) && (
        <header className="panel-header shrink-0">
          <div className="flex min-w-0 items-center gap-2">
            {Icon && <Icon size={13} className="shrink-0 text-[var(--accent)]" />}
            <div className="min-w-0">
              {title && <h3 className="truncate font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ink">{title}</h3>}
              {subtitle && <p className="truncate text-[10px] text-ink-3">{subtitle}</p>}
            </div>
            {badge}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        </header>
      )}
      <div className={cn('min-h-0 flex-1', dense ? 'p-2' : 'p-3', scroll && 'overflow-auto', bodyClassName)}>{children}</div>
    </section>
  )
}

// ---------------------------------------------------------------- Page ------
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  icon: Icon,
  meta,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
  icon?: LucideIcon
  meta?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line-soft pb-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          {Icon && <Icon size={13} className="text-[var(--accent)]" />}
          {eyebrow && <span className="label-xs text-[var(--accent)]">{eyebrow}</span>}
        </div>
        <h1 className="page-title text-xl text-ink sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-xs text-ink-2">{subtitle}</p>}
        {meta && <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

// ---------------------------------------------------------------- Badge -----
const SEV_CLASS: Record<string, string> = {
  low: 'badge-green',
  elevated: 'badge-amber',
  critical: 'badge-red',
  high: 'badge-red',
  severe: 'badge-red',
  guarded: 'badge-blue',
  moderate: 'badge-amber',
  success: 'badge-green',
  pending: 'badge-amber',
  failed: 'badge-red',
  info: 'badge-blue',
  neutral: 'badge-grey',
  active: 'badge-cyan',
  online: 'badge-green',
  offline: 'badge-grey',
  degraded: 'badge-amber',
  open: 'badge-cyan',
  closed: 'badge-grey',
  completed: 'badge-green',
  declined: 'badge-red',
  cancelled: 'badge-grey',
  frozen: 'badge-blue',
  flagged: 'badge-red',
  monitored: 'badge-amber',
  cleared: 'badge-green',
  sealed: 'badge-blue',
  analyzed: 'badge-green',
  archived: 'badge-grey',
  live: 'badge-green',
  paused: 'badge-amber',
  'sold-out': 'badge-red',
  verified: 'badge-green',
  probation: 'badge-amber',
  monitored_c: 'badge-amber',
  draft: 'badge-grey',
  scheduled: 'badge-blue',
  stopped: 'badge-grey',
  escalated: 'badge-red',
  contained: 'badge-amber',
  resolved: 'badge-green',
  suspended: 'badge-red',
  inactive: 'badge-grey',
  triangulated: 'badge-cyan',
  triaged: 'badge-blue',
  remediated: 'badge-green',
  accepted: 'badge-grey',
  acknowledged: 'badge-blue',
  available: 'badge-green',
  frozenCard: 'badge-blue',
  maintenance: 'badge-blue',
  upcoming: 'badge-blue',
  degraded_s: 'badge-amber',
}

export function StatusPill({
  value,
  label,
  className,
  dot = true,
}: {
  value: string
  label?: string
  className?: string
  dot?: boolean
}) {
  const cls = SEV_CLASS[value.toLowerCase()] ?? 'badge-grey'
  return (
    <span className={cn('badge', cls, className)}>
      {dot && <i className="dot" style={{ background: 'currentColor' }} />}
      {label ?? value}
    </span>
  )
}

export function SeverityPill({ value }: { value: Severity | RiskLevel }) {
  return <StatusPill value={value} label={value.toUpperCase()} />
}

// ---------------------------------------------------------------- Stat ------
export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  accent = 'cyan',
  sub,
  spark,
  onClick,
}: {
  label: string
  value: string | number
  delta?: { value: number; label?: string }
  icon?: LucideIcon
  accent?: 'cyan' | 'green' | 'blue' | 'amber' | 'red' | 'grey'
  sub?: string
  spark?: number[]
  onClick?: () => void
}) {
  const colorMap = {
    cyan: 'var(--color-cyan)',
    green: 'var(--color-green)',
    blue: 'var(--color-blue)',
    amber: 'var(--color-amber)',
    red: 'var(--color-red)',
    grey: 'var(--color-ink-3)',
  }
  const c = colorMap[accent]
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'panel corner-marks group relative overflow-hidden p-3 text-left transition-colors',
        onClick && 'cursor-pointer hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--color-line))]',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="label-xs truncate">{label}</span>
        {Icon && <Icon size={14} style={{ color: c }} className="shrink-0 opacity-80" />}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="stat-value text-2xl leading-none" style={{ color: c === 'var(--color-ink-3)' ? undefined : c }}>
          {typeof value === 'number' ? fmtNum(value) : value}
        </span>
        {delta && (
          <span className={cn('mono text-[10px]', delta.value >= 0 ? 'text-green' : 'text-red')}>
            {delta.value >= 0 ? '▲' : '▼'} {Math.abs(delta.value).toFixed(1)}%
          </span>
        )}
      </div>
      {spark && <Sparkline data={spark} color={c} className="mt-2" />}
      {sub && <p className="mt-1.5 truncate font-mono text-[9px] uppercase tracking-wider text-ink-3">{sub}</p>}
    </button>
  )
}

export function Sparkline({
  data,
  color = 'var(--color-cyan)',
  className,
  height = 26,
  fill = true,
}: {
  data: number[]
  color?: string
  className?: string
  height?: number
  fill?: boolean
}) {
  if (!data.length) return null
  const w = 100
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / span) * (height - 2) - 1}`)
  const id = `sg-${Math.round(min * 1000)}-${data.length}`
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cn('h-6 w-full', className)} style={{ height }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <polygon points={`0,${height} ${pts.join(' ')} ${w},${height}`} fill={`url(#${id})`} />}
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// ---------------------------------------------------------------- Tabs ------
export function Tabs({
  tabs,
  value,
  onChange,
  className,
  size = 'md',
}: {
  tabs: { id: string; label: string; count?: number; icon?: LucideIcon }[]
  value: string
  onChange: (id: string) => void
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1 border-b border-line-soft', className)}>
      {tabs.map((t) => {
        const active = t.id === value
        const Icon = t.icon
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={cn(
              'relative -mb-px flex items-center gap-1.5 border-b border-transparent px-2.5 font-mono uppercase tracking-wider transition-colors',
              size === 'sm' ? 'py-1.5 text-[9px]' : 'py-2 text-[10px]',
              active ? 'border-[var(--accent)] text-ink' : 'text-ink-3 hover:text-ink-2',
            )}
          >
            {Icon && <Icon size={11} />}
            {t.label}
            {t.count !== undefined && (
              <span className={cn('rounded-sm px-1 text-[9px]', active ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'bg-elevated text-ink-3')}>
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------- Progress --
export function Progress({
  value,
  color = 'var(--accent)',
  height = 4,
  label,
  showValue,
  striped,
  className,
}: {
  value: number
  color?: string
  height?: number
  label?: string
  showValue?: boolean
  striped?: boolean
  className?: string
}) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-ink-3">
          <span>{label}</span>
          {showValue && <span className="tabular text-ink-2">{v.toFixed(0)}%</span>}
        </div>
      )}
      <div className="w-full overflow-hidden rounded-full bg-[#16212b]" style={{ height }}>
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${v}%`,
            background: striped
              ? `repeating-linear-gradient(45deg, ${color}, ${color} 6px, color-mix(in srgb, ${color} 55%, transparent) 6px, color-mix(in srgb, ${color} 55%, transparent) 12px)`
              : color,
            boxShadow: `0 0 10px -2px ${color}`,
          }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Modal -----
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  icon: Icon,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  icon?: LucideIcon
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' }
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        className={cn('panel corner-marks w-full animate-[fadeUp_.18s_ease-out] shadow-2xl', widths[size])}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="panel-header">
          <div className="flex min-w-0 items-center gap-2">
            {Icon && (
              <span className="text-[var(--accent)]">
                <Icon size={14} />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="truncate font-mono text-[11px] uppercase tracking-[0.16em] text-ink">{title}</h2>
              {subtitle && <p className="truncate text-[10px] text-ink-3">{subtitle}</p>}
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </header>
        <div className="max-h-[70vh] overflow-auto p-4">{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-[#0d151d] p-3">{footer}</footer>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Drawer ----
export function Drawer({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg',
  side = 'right',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: string
  side?: 'left' | 'right'
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[75] flex bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={cn('flex h-full w-full flex-col border-line bg-bg-2 shadow-2xl', width, side === 'right' ? 'ml-auto border-l' : 'mr-auto border-r')}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="panel-header shrink-0">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Empty -----
export function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  action,
}: {
  icon?: LucideIcon
  title: string
  message?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full border border-line bg-elevated">
        <Icon size={20} className="text-ink-3" />
      </div>
      <p className="font-display text-sm text-ink-2">{title}</p>
      {message && <p className="max-w-sm text-[11px] text-ink-3">{message}</p>}
      {action}
    </div>
  )
}

// ---------------------------------------------------------------- Toggle ----
export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
}) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-2', disabled && 'cursor-not-allowed opacity-40')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-4 w-8 shrink-0 rounded-full border transition-colors',
          checked ? 'border-[color-mix(in_srgb,var(--accent)_60%,transparent)] bg-[color-mix(in_srgb,var(--accent)_30%,transparent)]' : 'border-line bg-[#0d151d]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-2.5 w-2.5 rounded-full transition-all',
            checked ? 'left-[17px] bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]' : 'left-0.5 bg-ink-3',
          )}
        />
      </button>
      {label && <span className="text-[11px] text-ink-2">{label}</span>}
    </label>
  )
}

// ---------------------------------------------------------------- Slider ----
export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  suffix,
  accent = 'var(--accent)',
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  suffix?: string
  accent?: string
}) {
  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-ink-3">
          <span>{label}</span>
          <span className="tabular text-ink-2">{value}{suffix}</span>
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-[#22303c] accent-[var(--accent)]"
        style={{ accentColor: accent }}
        aria-label={label}
      />
    </div>
  )
}

// ---------------------------------------------------------------- Select ----
export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  ariaLabel,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  label?: string
  ariaLabel?: string
  className?: string
}) {
  return (
    <div className={className}>
      {label && <span className="field-label">{label}</span>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          aria-label={label ?? options.find((o) => o.value === value)?.label ?? ariaLabel ?? 'Filter'}
          className="field appearance-none pr-7"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-3" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Keyval ----
export function KeyValue({ items, cols = 2 }: { items: { k: string; v: ReactNode }[]; cols?: number }) {
  return (
    <dl className={cn('grid gap-x-4 gap-y-2', cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : cols === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1')}>
      {items.map((it) => (
        <div key={it.k} className="min-w-0 border-b border-line-soft/60 pb-1.5">
          <dt className="label-xs">{it.k}</dt>
          <dd className="truncate font-mono text-[11px] text-ink">{it.v}</dd>
        </div>
      ))}
    </dl>
  )
}

// ---------------------------------------------------------------- Section ---
export function Collapsible({
  title,
  children,
  defaultOpen = false,
  icon: Icon,
  right,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  icon?: LucideIcon
  right?: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-line-soft">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 bg-[#0d151d] px-3 py-2 text-left hover:bg-elevated"
      >
        <span className="flex items-center gap-2">
          {open ? <ChevronDown size={12} className="text-ink-3" /> : <ChevronRight size={12} className="text-ink-3" />}
          {Icon && <Icon size={12} className="text-[var(--accent)]" />}
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink">{title}</span>
        </span>
        {right}
      </button>
      {open && <div className="p-3">{children}</div>}
    </div>
  )
}

// ---------------------------------------------------------------- Alert -----
export function InlineAlert({
  tone = 'amber',
  title,
  children,
  icon: Icon = AlertTriangle,
}: {
  tone?: 'amber' | 'red' | 'cyan' | 'green'
  title?: string
  children?: ReactNode
  icon?: LucideIcon
}) {
  const tones = {
    amber: 'border-[#6d5320] bg-[#2a2110] text-[#ffd489]',
    red: 'border-[#6e2633] bg-[#2a1016] text-[#ff9aa6]',
    cyan: 'border-[#1a6472] bg-[#0c2830] text-[#7ff0fb]',
    green: 'border-[#1b6349] bg-[#0a2a20] text-[#79f0b9]',
  }
  return (
    <div className={cn('flex items-start gap-2 border px-3 py-2 text-[11px]', tones[tone])}>
      <Icon size={13} className="mt-0.5 shrink-0" />
      <div>
        {title && <p className="font-mono text-[10px] uppercase tracking-wider">{title}</p>}
        {children && <div className="mt-0.5 opacity-90">{children}</div>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- Counter ---
export function CountUp({ value, duration = 700, decimals = 0 }: { value: number; duration?: number; decimals?: number }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  const raf = useRef(0)
  useEffect(() => {
    const from = prev.current
    const to = value
    prev.current = value
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(from + (to - from) * eased)
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [value, duration])
  return <span className="tabular">{display.toFixed(decimals)}</span>
}

// ---------------------------------------------------------------- SimClock --
export function Ticker({ items }: { items: string[] }) {
  return (
    <div className="overflow-hidden">
      <div className="marquee-track flex w-max gap-8 whitespace-nowrap">
        {[0, 1].map((k) => (
          <div key={k} className="flex gap-8">
            {items.map((i, idx) => (
              <span key={idx} className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
                {i}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="hairline my-3" />
  return (
    <div className="my-3 flex items-center gap-2">
      <span className="label-xs whitespace-nowrap">{label}</span>
      <span className="hairline flex-1" />
    </div>
  )
}

export function Avatar({ seed, size = 28, status }: { seed: string; size?: number; status?: string }) {
  const hue = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const initials = seed.replace(/[^A-Za-z0-9 ]/g, '').split(/[\s_.]/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('')
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className="grid h-full w-full place-items-center rounded-sm border font-mono font-medium"
        style={{
          fontSize: size * 0.36,
          background: `linear-gradient(145deg, hsl(${hue} 32% 18%), hsl(${hue} 45% 9%))`,
          borderColor: `hsl(${hue} 40% 28%)`,
          color: `hsl(${hue} 70% 72%)`,
        }}
      >
        {initials}
      </span>
      {status && (
        <i
          className={cn(
            'absolute -bottom-0.5 -right-0.5 rounded-full border border-bg',
            status === 'online' || status === 'field'
              ? 'bg-green'
              : status === 'away'
                ? 'bg-amber'
                : 'bg-ink-3',
          )}
          style={{ width: Math.max(6, size * 0.24), height: Math.max(6, size * 0.24) }}
        />
      )}
    </span>
  )
}

export function KV({ k, v, mono = true }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line-soft/50 py-1 last:border-0">
      <span className="label-xs shrink-0">{k}</span>
      <span className={cn('truncate text-right text-[11px] text-ink', mono && 'font-mono')}>{v}</span>
    </div>
  )
}

export function Timestamp({ ts, mode = 'datetime' }: { ts: string | number | Date; mode?: 'time' | 'date' | 'datetime' }) {
  const d = new Date(ts)
  if (mode === 'time') return <span className="mono text-[10px] text-ink-3">{pad(d.getHours())}:{pad(d.getMinutes())}:{pad(d.getSeconds())}</span>
  if (mode === 'date') return <span className="mono text-[10px] text-ink-3">{d.toISOString().slice(0, 10)}</span>
  return <span className="mono text-[10px] text-ink-3">{d.toISOString().slice(0, 10)} {pad(d.getHours())}:{pad(d.getMinutes())}</span>
}

export function Tag({ children, tone }: { children: ReactNode; tone?: string }) {
  return (
    <span className="badge badge-grey" style={tone ? { color: tone, borderColor: `${tone}55`, background: `${tone}18` } : undefined}>
      {children}
    </span>
  )
}

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-auto w-full max-w-[1800px] space-y-3', className)}>{children}</div>
}

export function As<E extends ElementType, P extends object>(Component: E) {
  return Component as E & ((props: P) => ReactNode)
}
