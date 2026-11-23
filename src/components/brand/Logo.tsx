import { cn } from '@/lib/utils'

/**
 * SHADOW SYSTEMS mark — an original geometric shield enclosing an abstract
 * aperture eye, cut from dark metal with a single neon accent.
 */
export function ShadowMark({ size = 32, className, animated = false }: { size?: number; className?: string; animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn(className, animated && 'animate-[logoReveal_1.1s_cubic-bezier(.2,.8,.2,1)_both]')}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ss-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b4d5d" />
          <stop offset="45%" stopColor="#16222d" />
          <stop offset="100%" stopColor="#2a3a48" />
        </linearGradient>
        <linearGradient id="ss-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#28d8ea" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#28d8ea" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="ss-accent" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38db91" />
          <stop offset="100%" stopColor="#28d8ea" />
        </linearGradient>
      </defs>

      {/* shield body */}
      <path
        d="M24 2.5 42.5 10v13.2c0 10.2-7.4 18.6-18.5 22.3C12.9 41.8 5.5 33.4 5.5 23.2V10L24 2.5Z"
        fill="url(#ss-metal)"
        stroke="url(#ss-edge)"
        strokeWidth="1.4"
      />
      {/* inner shield line */}
      <path
        d="M24 7.2 38.2 13v10.3c0 8-5.8 14.8-14.2 17.8-8.4-3-14.2-9.8-14.2-17.8V13L24 7.2Z"
        fill="none"
        stroke="#28d8ea"
        strokeOpacity="0.28"
        strokeWidth="0.8"
      />
      {/* aperture eye */}
      <ellipse cx="24" cy="23" rx="10.2" ry="6.1" fill="none" stroke="url(#ss-accent)" strokeWidth="1.5" />
      <circle cx="24" cy="23" r="3.1" fill="#28d8ea" fillOpacity="0.9" />
      <circle cx="24" cy="23" r="4.8" fill="none" stroke="#28d8ea" strokeOpacity="0.4" strokeWidth="0.7" />
      {/* ticks */}
      <path d="M24 14.2v-2.4M24 34.2v-2.4M14.4 23h-2.2M35.8 23h-2.2" stroke="#38db91" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="24" cy="23" r="1.2" fill="#e9f0f6" />
    </svg>
  )
}

export function Wordmark({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const scale = {
    sm: { mark: 22, title: 'text-[13px]', sub: 'text-[6.5px]', gap: 'gap-2' },
    md: { mark: 30, title: 'text-[15px]', sub: 'text-[7px]', gap: 'gap-2.5' },
    lg: { mark: 46, title: 'text-2xl', sub: 'text-[9px]', gap: 'gap-3.5' },
  }[size]
  return (
    <div className={cn('flex items-center', scale.gap, className)}>
      <ShadowMark size={scale.mark} />
      <div className="leading-none">
        <div className={cn('font-display font-bold uppercase tracking-[0.22em] text-ink', scale.title)}>
          SHADOW<span className="text-[var(--accent)]">·</span>SYSTEMS
        </div>
        <div className={cn('mt-1 font-mono uppercase tracking-[0.34em] text-ink-3', scale.sub)}>BEYOND THE VISIBLE</div>
      </div>
    </div>
  )
}

export function SimulationBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 border border-[#6d5320] bg-[#2a2110] px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.16em] text-[#ffd489]"
      title="All records, transactions and operations in SHADOW SYSTEMS are fictional simulations."
    >
      <span className="dot animate-[pulse-dot_2s_ease-in-out_infinite] bg-amber" />
      {compact ? 'SIM' : 'SIMULATION'}
    </span>
  )
}
