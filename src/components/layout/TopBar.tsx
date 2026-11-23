import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, Search, Command, Fullscreen, HelpCircle, Menu, SlidersHorizontal,
  Gauge, Pause, Play, Siren, Volume2, VolumeX, Wifi, Radio,
} from 'lucide-react'
import { NAV_GROUPS, resolvePageTitle } from '@/config/nav'
import { cn, fmtClock, pad } from '@/lib/utils'
import { SimulationBadge } from '@/components/brand/Logo'
import { useEngine, selectOperator, unreadCount } from '@/services/engine'
import { usePrefs } from '@/services/prefs'
import { Avatar, StatusPill } from '@/components/ui'
import type { SimSpeed } from '@/services/engine'

export function TopBar({
  onOpenMenu,
  onOpenSearch,
  onOpenNotifications,
  onOpenPalette,
  onOpenHelp,
}: {
  onOpenMenu: () => void
  onOpenSearch: () => void
  onOpenNotifications: () => void
  onOpenPalette: () => void
  onOpenHelp: () => void
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const page = resolvePageTitle(location.pathname)
  const operator = useEngine(selectOperator)
  const unread = useEngine(unreadCount)
  const emergency = useEngine((s) => s.emergency)
  const paused = useEngine((s) => s.paused)
  const speed = useEngine((s) => s.speed)
  const simulatedTime = useEngine((s) => s.simulatedTime)
  const togglePause = useEngine((s) => s.togglePause)
  const setSpeed = useEngine((s) => s.setSpeed)
  const enterEmergency = useEngine((s) => s.enterEmergency)
  const soundEnabled = usePrefs((s) => s.soundEnabled)
  const setPref = usePrefs((s) => s.set)
  const [speedOpen, setSpeedOpen] = useState(false)
  const [clock, setClock] = useState(Date.now())
  const speedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) setSpeedOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const d = new Date(simulatedTime)
  const real = new Date(clock)
  const utcOffset = -real.getTimezoneOffset() / 60

  const fullscreen = () => {
    if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.()
    else void document.exitFullscreen?.()
  }

  return (
    <header className="z-30 flex h-[52px] shrink-0 items-center gap-2 border-b border-line bg-bg-2/95 px-2 backdrop-blur sm:px-3">
      <button type="button" className="icon-btn lg:hidden" onClick={onOpenMenu} aria-label="Open navigation">
        <Menu size={17} />
      </button>

      {/* page context */}
      <div className="hidden min-w-0 items-center gap-2 md:flex">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
          {page?.group.label ?? 'SHADOW SYSTEMS'}
        </span>
        <span className="text-ink-3">/</span>
        <span className="truncate font-display text-[13px] font-medium uppercase tracking-wide text-ink">
          {page?.child.label ?? 'Overview'}
        </span>
      </div>

      {/* search */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="ml-auto flex h-8 min-w-0 items-center gap-2 border border-line bg-bg px-2.5 text-ink-3 transition-colors hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:text-ink-2 md:ml-4 md:w-[240px] lg:w-[320px]"
      >
        <Search size={12} className="shrink-0" />
        <span className="hidden truncate text-[11px] sm:block">Search records, modules, actions…</span>
        <kbd className="ml-auto hidden items-center gap-0.5 border border-line px-1 font-mono text-[9px] text-ink-3 sm:flex">
          <Command size={8} />K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1 md:ml-2">
        <SimulationBadge compact />
        <button
          type="button"
          onClick={onOpenPalette}
          className="icon-btn hidden sm:inline-flex"
          title="Command palette (Ctrl/Cmd + K)"
          aria-label="Command palette"
        >
          <Command size={15} />
        </button>

        {/* simulation clock + controls */}
        <div className="hidden items-center gap-1.5 border border-line bg-bg px-2 py-1 xl:flex" ref={speedRef}>
          <span className="relative flex items-center gap-1">
            <span className="dot animate-[pulse-dot_2s_ease-in-out_infinite] bg-green" />
            <span className="label-xs">SIM TIME</span>
          </span>
          <span className="mono text-[11px] tabular text-ink">{pad(d.getUTCHours())}:{pad(d.getUTCMinutes())}:{pad(d.getUTCSeconds())}</span>
          <span className="mono text-[8.5px] text-ink-3">UTC</span>
          <span className="mx-1 h-3 w-px bg-line" />
          <button type="button" onClick={togglePause} className="icon-btn !h-6 !w-6" title={paused ? 'Resume simulation' : 'Pause simulation'}>
            {paused ? <Play size={11} /> : <Pause size={11} />}
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSpeedOpen((v) => !v)}
              className="mono flex items-center gap-1 text-[10.5px] text-[var(--accent)] hover:text-white"
              title="Simulation speed"
            >
              <Gauge size={11} /> {speed}x
            </button>
            {speedOpen && (
              <div className="absolute right-0 top-7 z-40 w-32 border border-line bg-panel p-1 shadow-xl">
                {([0.5, 1, 2, 5] as SimSpeed[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSpeed(s)
                      setSpeedOpen(false)
                    }}
                    className={cn(
                      'block w-full px-2 py-1 text-left font-mono text-[10px] uppercase tracking-wider hover:bg-elevated',
                      s === speed ? 'text-[var(--accent)]' : 'text-ink-2',
                    )}
                  >
                    {s}x {s === 1 && '· normal'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          className="icon-btn"
          onClick={() => navigate('/command-center/health')}
          title="System health"
          aria-label="System health"
        >
          <Wifi size={15} className="text-green" />
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={() => setPref('soundEnabled', !soundEnabled)}
          title={soundEnabled ? 'Mute sound' : 'Enable sound'}
          aria-label="Toggle sound"
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>

        <button
          type="button"
          onClick={() => (emergency ? navigate('/crisis') : enterEmergency())}
          className={cn('icon-btn', emergency && 'text-red')}
          title={emergency ? 'Emergency mode active' : 'Activate emergency mode'}
          aria-label="Emergency mode"
        >
          <Siren size={15} className={emergency ? 'animate-pulse' : undefined} />
        </button>

        <button
          type="button"
          onClick={onOpenNotifications}
          className="icon-btn relative"
          title="Notifications"
          aria-label={`Notifications (${unread} unread)`}
        >
          <Bell size={15} />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-red px-0.5 font-mono text-[8px] text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        <button type="button" onClick={fullscreen} className="icon-btn hidden sm:inline-flex" title="Fullscreen" aria-label="Fullscreen">
          <Fullscreen size={15} />
        </button>
        <button type="button" onClick={onOpenHelp} className="icon-btn hidden sm:inline-flex" title="Help" aria-label="Help">
          <HelpCircle size={15} />
        </button>
        <button
          type="button"
          onClick={() => navigate('/settings/appearance')}
          className="icon-btn hidden sm:inline-flex"
          title="Quick settings"
          aria-label="Quick settings"
        >
          <SlidersHorizontal size={15} />
        </button>

        <button
          type="button"
          onClick={() => navigate('/settings/profile')}
          className="ml-1 flex items-center gap-1.5 border border-line bg-bg px-1.5 py-1 hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
          title={`${operator.displayName} · ${operator.clearance}`}
        >
          <Avatar seed={operator.displayName} size={20} status={operator.status} />
          <span className="hidden font-mono text-[9.5px] uppercase tracking-wider text-ink-2 sm:block">{operator.callsign}</span>
        </button>
      </div>

      {/* second line: global status ticker (desktop) */}
      <div className="pointer-events-none absolute inset-x-0 top-[52px] hidden h-0 lg:block" />
      <StatusStrip utcOffset={utcOffset} />
    </header>
  )
}

function StatusStrip({ utcOffset }: { utcOffset: number }) {
  const services = useEngine((s) => s.services)
  const emergency = useEngine((s) => s.emergency)
  const paused = useEngine((s) => s.paused)
  const op = useEngine(selectOperator)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="absolute inset-x-0 bottom-[-22px] z-30 hidden h-[22px] items-center gap-4 border-b border-line bg-[#080d13] px-3 lg:flex">
      <span className="flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink-3">
        <Radio size={9} className="text-[var(--accent)]" /> LINK ACTIVE
      </span>
      <span className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink-3">
        NODE <span className="text-ink-2">EU-CENTRAL-04</span>
      </span>
      <span className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink-3">
        SERVICES <span className="text-green">{services.filter((s) => s.status === 'operational').length}/{services.length}</span>
      </span>
      <span className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink-3">
        OPERATOR <span className="text-ink-2">{op.callsign}</span>
      </span>
      {/* mobile nav is fine to hide here */}
      {NAV_GROUPS.slice(0, 0).map(() => null)}
      <span className="ml-auto flex items-center gap-3">
        {paused ? (
          <StatusPill value="pending" label="SIM PAUSED" />
        ) : (
          <span className="flex items-center gap-1 font-mono text-[8.5px] uppercase tracking-[0.16em] text-green">
            <span className="dot animate-[pulse-dot_2s_ease-in-out_infinite] bg-green" /> SIMULATION RUNNING
          </span>
        )}
        {emergency && <StatusPill value="critical" label="EMERGENCY" />}
        <span className="font-mono text-[8.5px] tabular text-ink-3">
          LOCAL {fmtClock(now)} · UTC{utcOffset >= 0 ? '+' : ''}{utcOffset}
        </span>
      </span>
    </div>
  )
}
