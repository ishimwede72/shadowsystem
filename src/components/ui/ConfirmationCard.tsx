// ============================================================================
// ConfirmationCard — the friendly, human-facing counterpart to the console UI.
//
// The rest of the app is dense, monospace, operator-facing. This is what an end
// user sees after a transaction resolves: a large status medallion, a plain-
// language headline, and generously spaced label/value rows. It renders in-app
// and also into a print/export page, so a receipt looks the same everywhere.
// ============================================================================
import type { ReactNode } from 'react'
import { Check, X, Clock, Ban, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ConfirmTone = 'success' | 'pending' | 'failed' | 'neutral'

const TONES: Record<ConfirmTone, { icon: typeof Check; ring: string; fill: string; text: string; glow: string }> = {
  success: { icon: Check, ring: '#1f8f5f', fill: '#127a4e', text: 'text-[#38db91]', glow: 'shadow-[0_0_0_10px_color-mix(in_srgb,#38db91_8%,transparent)]' },
  pending: { icon: Clock, ring: '#8a6a20', fill: '#7a5c15', text: 'text-[#f5b942]', glow: 'shadow-[0_0_0_10px_color-mix(in_srgb,#f5b942_8%,transparent)]' },
  failed: { icon: X, ring: '#8e2f3c', fill: '#7a2733', text: 'text-[#f14e61]', glow: 'shadow-[0_0_0_10px_color-mix(in_srgb,#f14e61_8%,transparent)]' },
  neutral: { icon: Ban, ring: '#33465a', fill: '#2b3a49', text: 'text-ink-2', glow: 'shadow-[0_0_0_10px_color-mix(in_srgb,#93a3b4_8%,transparent)]' },
}

export interface ConfirmRow {
  label: string
  value: ReactNode
  /** Renders larger, for the headline figure. */
  emphasis?: boolean
  mono?: boolean
}

export function ConfirmationCard({
  tone = 'success',
  title,
  subtitle,
  rows,
  note,
  footer,
  actions,
  dense = false,
  className,
  animate = true,
}: {
  tone?: ConfirmTone
  title: string
  subtitle?: string
  rows: ConfirmRow[]
  note?: ReactNode
  footer?: ReactNode
  actions?: ReactNode
  dense?: boolean
  className?: string
  animate?: boolean
}) {
  const t = TONES[tone]
  const Icon = t.icon

  return (
    <div className={cn('relative', className)}>
      <div className={cn('relative overflow-hidden border border-line bg-bg-2', dense ? 'p-4' : 'p-5 sm:p-7')}>
        {/* soft accent wash behind the medallion */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-[0.18] blur-3xl"
          style={{ background: t.ring }}
        />
        {animate && (
          <span
            className="anim-ring pointer-events-none absolute left-1/2 top-0 h-16 w-16 -translate-x-1/2 rounded-full border"
            style={{ borderColor: t.ring, top: dense ? 16 : 28 }}
          />
        )}

        <div className="relative flex flex-col items-center text-center">
          <div
            className={cn(
              'grid place-items-center rounded-full text-white',
              t.glow,
              dense ? 'h-11 w-11' : 'h-14 w-14 sm:h-16 sm:w-16',
              animate && 'anim-reveal',
            )}
            style={{ background: t.fill }}
          >
            <Icon className={dense ? 'h-6 w-6' : 'h-8 w-8 sm:h-9 sm:w-9'} strokeWidth={3} />
          </div>

          <h3
            className={cn(
              'mt-4 font-display font-semibold tracking-tight text-ink',
              dense ? 'text-lg' : 'text-xl sm:text-2xl',
              animate && 'anim-reveal',
            )}
            style={{ animationDelay: '60ms' }}
          >
            {title}
          </h3>
          {subtitle && (
            <p className={cn('mt-1 max-w-md text-ink-3', dense ? 'text-[11px]' : 'text-xs')}>{subtitle}</p>
          )}
        </div>

        {rows.length > 0 && (
          <dl className={cn('relative mx-auto mt-5 w-full max-w-sm', dense ? 'space-y-2' : 'space-y-2.5')}>
            {rows.map((r, i) => (
              <div
                key={`${r.label}-${i}`}
                className={cn(
                  'flex items-baseline justify-between gap-4 border-b border-line-soft pb-2 last:border-0',
                  animate && 'anim-reveal',
                )}
                style={{ animationDelay: `${120 + i * 55}ms` }}
              >
                <dt className={cn('shrink-0 text-ink-3', r.emphasis ? 'text-sm' : 'text-[11px]')}>{r.label}</dt>
                <dd
                  className={cn(
                    'min-w-0 flex-1 text-right text-ink',
                    r.emphasis ? 'text-xl font-semibold sm:text-2xl' : 'text-sm',
                    r.mono && 'font-mono text-[12.5px] tabular',
                  )}
                >
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {note && (
          <p className={cn('relative mx-auto mt-4 max-w-sm text-center text-[10.5px] leading-relaxed text-ink-3')}>
            {note}
          </p>
        )}

        {actions && <div className="relative mt-5 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
      </div>

      {footer && <div className="border border-t-0 border-line bg-bg px-4 py-2.5">{footer}</div>}
    </div>
  )
}

/** Small "this is simulated" strip, used inside and under confirmation cards. */
export function SimulatedNotice({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-1.5 border border-[#6d5320] bg-[#2a2110]/70 px-2 py-1.5 text-center font-mono text-[8.5px] uppercase tracking-[0.14em] text-[#ffd489]',
        className,
      )}
    >
      <ShieldCheck size={10} className="shrink-0" />
      {children ?? 'Simulated · no real funds moved'}
    </div>
  )
}

/** Torn-paper dashed edge, for receipt styling. */
export function PerforatedEdge() {
  return (
    <div className="relative my-3 h-0 border-t border-dashed border-line">
      <span className="absolute -left-2 -top-[7px] h-3 w-3 rounded-full bg-bg" />
      <span className="absolute -right-2 -top-[7px] h-3 w-3 rounded-full bg-bg" />
    </div>
  )
}
