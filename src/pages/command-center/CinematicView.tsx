import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Crosshair, Gauge, Maximize2, Radio, Satellite, Siren, Timer } from 'lucide-react'
import { WorldMap } from '@/components/maps/WorldMap'
import { ShadowMark } from '@/components/brand/Logo'
import { useEngine } from '@/services/engine'
import { usePrefs, ACCENTS } from '@/services/prefs'
import { cn, fmtMoney, pad } from '@/lib/utils'
import { PALETTE, AreaTrend } from '@/components/charts'

export default function CinematicView() {
  const s = useEngine()
  const accent = usePrefs((p) => p.accent)
  const [clock, setClock] = useState(() => new Date())
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', ACCENTS[accent].color)
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [accent])

  const markers = useMemo(
    () => [
      ...s.targets.map((t) => ({
        id: t.id,
        label: t.codename,
        lat: t.position.lat,
        lng: t.position.lng,
        tone: (t.risk === 'severe' ? 'red' : t.risk === 'elevated' ? 'amber' : 'cyan') as 'red' | 'amber' | 'cyan',
        kind: 'target' as const,
        pulse: t.moving,
      })),
      ...s.crisisIncidents.filter((c) => c.severity === 'critical').map((c, i) => ({
        id: c.id,
        label: c.id,
        lat: 30 + i * 12,
        lng: -40 + i * 30,
        tone: 'red' as const,
        kind: 'alert' as const,
        pulse: true,
      })),
    ],
    [s.targets, s.crisisIncidents],
  )

  const activeMission = s.missions.find((m) => m.status === 'active')

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0">
        <WorldMap markers={markers} showLegend={false} showLabels={false} interactive className="h-full w-full opacity-80" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_20%,rgba(7,11,17,0.82)_85%)]" />
      </div>
      <div className="scanlines pointer-events-none absolute inset-0 opacity-25" />

      <header className="relative z-20 flex items-center justify-between border-b border-line/60 bg-bg/60 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <ShadowMark size={26} />
          <div className="leading-none">
            <p className="font-display text-[13px] font-bold uppercase tracking-[0.24em] text-ink">SHADOW·SYSTEMS</p>
            <p className="mt-0.5 font-mono text-[7.5px] uppercase tracking-[0.34em] text-ink-3">BEYOND THE VISIBLE</p>
          </div>
          <span className="badge badge-green ml-2"><span className="dot animate-[pulse-dot_2s_infinite] bg-green" /> CINEMATIC MODE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="mono text-[11px] tabular text-ink">{pad(clock.getUTCHours())}:{pad(clock.getUTCMinutes())}:{pad(clock.getUTCSeconds())} UTC</span>
          <Link to="/command-center" className="btn btn-sm"><ArrowLeft size={11} /> Exit presentation</Link>
        </div>
      </header>

      <div className="relative z-10 grid min-h-[calc(100vh-53px)] gap-3 p-4 lg:grid-cols-[300px_1fr_320px]">
        <aside className="space-y-3">
          <section className="panel bg-panel/70 backdrop-blur">
            <div className="panel-header"><span className="label-sm flex items-center gap-1.5"><Satellite size={11} /> GLOBAL PICTURE</span></div>
            <div className="space-y-2 p-3">
              {[
                ['TRACKED TARGETS', s.targets.length, PALETTE.cyan],
                ['IN MOTION', s.targets.filter((t) => t.moving).length, PALETTE.green],
                ['ACTIVE MISSIONS', s.missions.filter((m) => m.status === 'active').length, PALETTE.amber],
                ['CRITICAL INCIDENTS', s.crisisIncidents.filter((c) => c.severity === 'critical').length, PALETTE.red],
              ].map(([label, value, color]) => (
                <div key={String(label)} className="flex items-end justify-between border-b border-line-soft/50 pb-1.5">
                  <span className="label-xs">{label}</span>
                  <span className="stat-value text-2xl" style={{ color: color as string }}>{value as number}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel bg-panel/70 backdrop-blur">
            <div className="panel-header"><span className="label-sm flex items-center gap-1.5"><Radio size={11} /> LIVE FEED</span></div>
            <div className="max-h-[280px] overflow-hidden p-2 font-terminal text-[10px] leading-relaxed">
              {s.activity.slice(0, 14).map((a) => (
                <div key={a.id} className="flex gap-1.5 border-b border-line-soft/30 py-0.5">
                  <span className="shrink-0 text-ink-3">{new Date(a.ts).toTimeString().slice(0, 8)}</span>
                  <span className="truncate text-ink-2">{a.action}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <div className="flex flex-col items-center justify-center text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-[var(--accent)]">OPERATIONAL OVERVIEW</p>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-none tracking-[0.06em] text-ink text-glow sm:text-6xl">
            {activeMission?.name ?? 'THE FUTURE OF DIGITAL OPERATIONS'}
          </h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="badge badge-cyan">{s.transactions.length} LEDGER ENTRIES</span>
            <span className="badge badge-green">{fmtMoney(s.transactions.reduce((a, t) => a + t.amount, 0), 'USD', true)} SIM VOLUME</span>
            <span className="badge badge-blue">{s.networkNodes.length} NETWORK NODES</span>
            <span className="badge badge-amber">{s.cameras.length} CAMERAS</span>
          </div>
          {activeMission && (
            <div className="mt-6 w-full max-w-xl border border-line bg-bg/70 p-3 backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="label-xs flex items-center gap-1"><Crosshair size={10} /> {activeMission.code}</span>
                <span className="mono text-[10px] text-[var(--accent)]">{activeMission.progress}%</span>
              </div>
              <div className="mt-2 h-1 w-full bg-[#16212b]">
                <div className="h-full bg-[var(--accent)] transition-[width] duration-500" style={{ width: `${activeMission.progress}%` }} />
              </div>
              <p className="mt-1.5 text-left font-mono text-[9.5px] uppercase tracking-wider text-ink-3">{activeMission.currentStage}</p>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <section className="panel bg-panel/70 backdrop-blur">
            <div className="panel-header"><span className="label-sm flex items-center gap-1.5"><Gauge size={11} /> SYSTEM VITALS</span></div>
            <div className="p-2.5">
              <AreaTrend
                data={s.traffic.slice(-18)}
                keys={[{ key: 'inbound', color: PALETTE.cyan }, { key: 'outbound', color: PALETTE.blue }]}
                height={100}
                showGrid={false}
              />
            </div>
            <div className="grid grid-cols-3 divide-x divide-line border-t border-line">
              {[
                ['CPU', `${34 + (s.tick % 20)}%`],
                ['MEM', `${52 + (s.tick % 12)}%`],
                ['EVT/s', `${8 + (s.tick % 9)}`],
              ].map(([l, v]) => (
                <div key={l} className="p-2 text-center">
                  <p className="label-xs">{l}</p>
                  <p className="mono mt-0.5 text-[11px] text-[var(--accent)]">{v}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel bg-panel/70 backdrop-blur">
            <div className="panel-header"><span className="label-sm flex items-center gap-1.5"><Siren size={11} /> INCIDENTS</span></div>
            <ul className="divide-y divide-line-soft">
              {s.crisisIncidents.slice(0, 4).map((c) => (
                <li key={c.id} className="px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('mono text-[9px]', c.severity === 'critical' ? 'text-red' : c.severity === 'elevated' ? 'text-amber' : 'text-green')}>{c.id}</span>
                    <span className="mono text-[8px] uppercase text-ink-3">{c.status}</span>
                  </div>
                  <p className="truncate text-[10.5px] text-ink-2">{c.title}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel bg-panel/70 p-3 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="label-xs flex items-center gap-1"><Timer size={10} /> SESSION CLOCK</span>
              <span className="mono text-[10px] text-ink-2">{s.speed}x</span>
            </div>
            <p className="mono mt-1 text-lg tabular text-ink">{pad(clock.getUTCHours())}:{pad(clock.getUTCMinutes())}:{pad(clock.getUTCSeconds())}</p>
            <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.2em] text-ink-3">SIMULATION CONTAINMENT VERIFIED</p>
          </section>

          <button type="button" onClick={() => document.documentElement.requestFullscreen?.()} className="btn w-full bg-panel/70 backdrop-blur">
            <Maximize2 size={11} /> Fullscreen presentation
          </button>
        </aside>
      </div>
    </div>
  )
}
