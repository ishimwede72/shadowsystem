import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Radio, Play, Pause, Square, CheckCircle2, Gauge, Activity, Zap, Layers, Clock,
  ArrowUpRight, AlertTriangle, Terminal, Eye, StepForward, RotateCcw,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, SeverityPill, InlineAlert, Divider, KeyValue, Tag, Progress, EmptyState, Modal, Timestamp } from '@/components/ui'
import { AreaTrend, PALETTE, ChartLegend, Donut, MiniBars } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, pad, relTime } from '@/lib/utils'

const MODULE_ROUTE: Record<string, string> = {
  command: '/command-center', finance: '/finance', cyber: '/cyber/overview', geoint: '/geoint', surveillance: '/surveillance',
  intelligence: '/intelligence', network: '/network', forensics: '/forensics', underground: '/underground/market',
  crypto: '/cryptography', ai: '/ai/chat', crisis: '/crisis', comms: '/communications', missions: '/missions', reports: '/reports',
}

export default function ActiveMissions() {
  const navigate = useNavigate()
  const s = useEngine()
  const [sel, setSel] = useState<string | null>(s.missions.find((m) => m.status === 'active')?.id ?? s.missions[0]?.id ?? null)
  const [confirmStop, setConfirmStop] = useState(false)
  const speedOptions = [0.5, 1, 2, 5] as const

  const mission = s.missions.find((m) => m.id === sel)
  const running = s.missions.filter((m) => m.status === 'active')

  const elapsedSec = mission ? (mission.progress / 100) * mission.etaMinutes * 60 : 0
  const fired = mission?.events.filter((e) => e.at <= elapsedSec) ?? []
  const next = mission?.events.find((e) => e.at > elapsedSec)

  const telemetry = useMemo(
    () => Array.from({ length: 20 }, (_, i) => ({
      t: `${i * 3}s`,
      cpu: 32 + Math.round(Math.abs(Math.sin((i + s.tick) / 3)) * 40),
      mem: 44 + Math.round(Math.abs(Math.cos((i + s.tick) / 4)) * 32),
    })),
    [s.tick],
  )

  useEffect(() => {
    if (mission && mission.status === 'active' && s.paused) s.resumeMission(mission.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission?.id])

  const fireNext = () => {
    if (!mission || !next) return
    s.runMissionEvent(mission.id, next)
    s.notify({ type: 'mission-start', title: 'Event injected', body: next.label, severity: next.severity ?? 'low', module: 'missions' })
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="MISSIONS · ACTIVE"
        title="Active Missions"
        subtitle="Live console for running simulated operations: pause, step events and watch module effects."
        icon={Radio}
        meta={
          <>
            <span className="badge badge-green">{running.length} ACTIVE</span>
            <span className="badge badge-amber">{s.missions.filter((m) => m.status === 'paused').length} PAUSED</span>
            <span className="badge badge-cyan">{fired.length} FIRED</span>
            <span className="badge badge-grey">{s.paused ? 'ENGINE PAUSED' : `SPEED ${s.speed}×`}</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => s.togglePause()}>{s.paused ? <Play size={11} /> : <Pause size={11} />} {s.paused ? 'Resume engine' : 'Pause engine'}</button>
            <button type="button" className="btn btn-sm" onClick={() => { const idx = speedOptions.indexOf(s.speed); s.setSpeed(speedOptions[(idx + 1) % speedOptions.length]) }}><Gauge size={11} /> {s.speed}×</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/missions/templates')}><Layers size={11} /> New</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active" value={running.length} icon={Activity} accent="green" />
        <StatCard label="Events fired" value={fired.length} icon={Zap} accent="amber" />
        <StatCard label="Next event" value={next ? `T+${next.at}s` : '—'} icon={StepForward} accent="cyan" />
        <StatCard label="Tick" value={s.tick} icon={Clock} accent="blue" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[250px_1fr_300px]">
        <Panel title="Running" icon={Radio} bodyClassName="p-0">
          <ul className="max-h-[62vh] divide-y divide-line-soft overflow-y-auto">
            {s.missions.filter((m) => ['active', 'paused', 'scheduled', 'draft'].includes(m.status)).map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => setSel(m.id)} data-selected={sel === m.id} className="w-full px-2 py-1.5 text-left hover:bg-elevated">
                  <div className="flex items-center justify-between gap-1">
                    <span className="mono text-[8px] text-[var(--accent)]">{m.code}</span>
                    <StatusPill value={m.status} dot={false} />
                  </div>
                  <p className="truncate text-[10px] text-ink-2">{m.name}</p>
                  <div className="mt-0.5 flex items-center gap-1">
                    <Progress value={m.progress} height={2} className="flex-1" />
                    <span className="mono text-[7.5px] text-ink-3">{m.progress}%</span>
                  </div>
                </button>
              </li>
            ))}
            {s.missions.filter((m) => ['active', 'paused', 'scheduled', 'draft'].includes(m.status)).length === 0 && (
              <li><EmptyState icon={Radio} title="Nothing running" message="Launch a mission from the builder." /></li>
            )}
          </ul>
        </Panel>

        {mission ? (
          <div className="space-y-3">
            <Panel title={mission.name} subtitle={`${mission.code} · ${mission.category}`} icon={Radio}
              actions={<div className="flex items-center gap-1"><SeverityPill value={mission.severity} /><StatusPill value={mission.status} /></div>}
            >
              <div className="flex items-center gap-2">
                <Progress value={mission.progress} height={6} className="flex-1" />
                <span className="mono text-[12px] text-[var(--accent)]">{mission.progress}%</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[8.5px] text-ink-3">
                <span>STAGE {mission.currentStage}</span><span>·</span>
                <span>ELAPSED {pad(Math.floor(elapsedSec / 60))}:{pad(Math.floor(elapsedSec % 60))}</span><span>·</span>
                <span>ETA {mission.etaMinutes}m</span><span>·</span>
                <span>{fired.length}/{mission.events.length} EVENTS</span>
              </div>

              <Divider label="CONTROLS" />
              <div className="flex flex-wrap gap-1.5">
                {mission.status === 'active' ? (
                  <button type="button" className="btn btn-sm" onClick={() => s.pauseMission(mission.id)}><Pause size={10} /> Pause</button>
                ) : (
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => s.resumeMission(mission.id)} disabled={mission.status === 'completed'}><Play size={10} /> Resume</button>
                )}
                <button type="button" className="btn btn-sm" onClick={fireNext} disabled={!next}><StepForward size={10} /> Fire next</button>
                <button type="button" className="btn btn-sm" onClick={() => s.completeMission(mission.id)}><CheckCircle2 size={10} /> Complete</button>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => setConfirmStop(true)}><Square size={10} /> Stop</button>
                <button type="button" className="btn btn-sm ml-auto" onClick={() => navigate('/missions/builder')}><RotateCcw size={10} /> Rebuild</button>
              </div>
            </Panel>

            <Panel title="Event Script" icon={Zap} bodyClassName="p-0"
              actions={<span className="mono text-[8.5px] text-ink-3">{fired.length} fired</span>}
            >
              <ul className="max-h-[30vh] divide-y divide-line-soft overflow-y-auto">
                {mission.events.map((e) => {
                  const done = e.at <= elapsedSec
                  return (
                    <li key={e.id} className={cn('flex items-center gap-2 px-2.5 py-1', done && 'bg-[color-mix(in_srgb,var(--accent)_4%,transparent)]')}>
                      <span className={cn('mono w-11 shrink-0 text-[8px]', done ? 'text-[var(--accent)]' : 'text-ink-3')}>T+{e.at}s</span>
                      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', done ? 'bg-green' : 'bg-[#253745]')} />
                      <button type="button" className="badge badge-grey shrink-0" onClick={() => navigate(MODULE_ROUTE[e.module] ?? '/command-center')}>{e.module.toUpperCase()} <ArrowUpRight size={7} /></button>
                      <span className="min-w-0 flex-1 truncate text-[9.5px] text-ink-2">{e.label}</span>
                      <SeverityPill value={e.severity ?? 'low'} />
                      <button type="button" className="icon-btn" onClick={() => s.runMissionEvent(mission.id, e)} title="Inject event"><Play size={8} /></button>
                    </li>
                  )
                })}
              </ul>
            </Panel>

            <div className="grid gap-3 sm:grid-cols-2">
              <Panel title="Simulated Telemetry" icon={Activity}>
                <AreaTrend data={telemetry} keys={[{ key: 'cpu', color: PALETTE.cyan, label: 'CPU' }, { key: 'mem', color: PALETTE.amber, label: 'MEM' }]} height={150} />
                <ChartLegend items={[{ label: 'CPU %', color: PALETTE.cyan }, { label: 'Memory %', color: PALETTE.amber }]} />
              </Panel>
              <Panel title="Module Participation" icon={Layers}>
                <Donut
                  data={Array.from(new Set(mission.events.map((e) => e.module))).map((m, i) => ({ name: m, value: mission.events.filter((e) => e.module === m).length, color: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa'][i % 6] }))}
                  height={150}
                  centerLabel="EVENTS"
                  centerValue={String(mission.events.length)}
                />
              </Panel>
            </div>
          </div>
        ) : (
          <Panel title="Console"><EmptyState icon={Radio} title="No mission selected" message="Pick a mission from the list to open its console." /></Panel>
        )}

        <div className="space-y-3">
          <Panel title="Engine State" icon={Gauge}>
            <KeyValue
              items={[
                { k: 'Paused', v: s.paused ? 'YES' : 'NO' },
                { k: 'Speed', v: `${s.speed}×` },
                { k: 'Tick', v: String(s.tick) },
                { k: 'Sim time', v: new Date(s.simulatedTime).toISOString().slice(11, 19) + 'Z' },
                { k: 'Last event', v: s.bus[0] ? relTime(s.bus[0].ts) : '—' },
              ]}
            />
            <Divider />
            <div className="space-y-1.5">
              {speedOptions.map((v) => (
                <button key={v} type="button" className={cn('btn btn-sm w-full', s.speed === v && 'btn-primary')} onClick={() => s.setSpeed(v)}>
                  <Gauge size={10} /> {v}× speed
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Next Event" icon={StepForward}>
            {next ? (
              <>
                <p className="mono text-[9px] text-[var(--accent)]">T+{next.at}s · {next.module.toUpperCase()}</p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-ink-2">{next.label}</p>
                <Divider />
                <p className="font-mono text-[8px] text-ink-3">Fires in {Math.max(0, Math.round(next.at - elapsedSec))}s of simulated time</p>
              </>
            ) : <p className="text-[10px] text-ink-3">No pending events — the script has finished.</p>}
          </Panel>

          <Panel title="Fired Events" icon={Zap} bodyClassName="p-0">
            <ul className="max-h-[200px] divide-y divide-line-soft overflow-y-auto">
              {fired.slice().reverse().slice(0, 8).map((e) => (
                <li key={e.id} className="px-2.5 py-1">
                  <p className="truncate text-[9.5px] text-ink-2">{e.label}</p>
                  <p className="mono text-[7.5px] text-ink-3">T+{e.at}s · {e.module}</p>
                </li>
              ))}
              {fired.length === 0 && <li className="px-2.5 py-2 text-[9.5px] text-ink-3">No events fired yet.</li>}
            </ul>
          </Panel>

          <Panel title="Bus Tail" icon={Terminal}>
            <pre className="terminal-window max-h-[140px] overflow-auto whitespace-pre-wrap p-1.5 font-terminal text-[8px] leading-relaxed text-ink-3">
              {s.bus.slice(0, 8).map((b) => `${b.ts.slice(11, 19)} ${b.topic}`).join('\n') || 'no events'}
            </pre>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="All Missions" icon={Layers} className="lg:col-span-2" bodyClassName="p-0">
          <table className="data-table">
            <thead><tr><th>Mission</th><th>Status</th><th>Progress</th><th>Stage</th><th>Events fired</th><th>Started</th></tr></thead>
            <tbody>
              {s.missions.map((m) => (
                <tr key={m.id} className="cursor-pointer" data-selected={sel === m.id} onClick={() => setSel(m.id)}>
                  <td><span className="mono text-[8px] text-[var(--accent)]">{m.code}</span><span className="block truncate text-[10px] text-ink">{m.name}</span></td>
                  <td><StatusPill value={m.status} dot={false} /></td>
                  <td><span className="flex items-center gap-1"><Progress value={m.progress} height={2} className="w-14" /><span className="mono text-[8px] text-ink-3">{m.progress}%</span></span></td>
                  <td className="max-w-[150px] truncate text-[9px] text-ink-3">{m.currentStage}</td>
                  <td className="mono text-[9px] text-ink-3">{m.events.filter((e) => e.at <= (m.progress / 100) * m.etaMinutes * 60).length}/{m.events.length}</td>
                  <td className="mono whitespace-nowrap text-[8px] text-ink-3">{relTime(m.startedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Operator" icon={Eye}>
          {mission && (
            <>
              <p className="text-[11px] text-ink">{s.operators.find((o) => o.id === mission.operatorId)?.callsign ?? mission.operatorId}</p>
              <p className="mono text-[8.5px] text-ink-3">{s.operators.find((o) => o.id === mission.operatorId)?.role}</p>
              <Divider />
              <Timestamp ts={mission.startedAt} />
            </>
          )}
          <div className="mt-2 flex flex-wrap gap-1"><Tag tone="#28d8ea">RUNNER</Tag><Tag tone="#f5b942">SIMULATED</Tag></div>
          <div className="mt-2"><MiniBars data={Array.from({ length: 12 }, (_, i) => 1 + Math.round(Math.abs(Math.sin((i + s.tick) / 2)) * 9))} color={PALETTE.green} height={44} /></div>
        </Panel>
      </div>

      <InlineAlert tone="amber" title="Simulated mission runner">
        Progress, telemetry and module effects are produced by the demo engine. Nothing is scheduled, executed or transmitted
        outside this browser.
      </InlineAlert>

      <Modal open={confirmStop} onClose={() => setConfirmStop(false)} title="Stop Mission" subtitle={mission?.code} icon={Square}
        footer={<>
          <button type="button" className="btn" onClick={() => setConfirmStop(false)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={() => { if (mission) s.stopMission(mission.id); setConfirmStop(false) }}><Square size={11} /> Stop mission</button>
        </>}
      >
        <p className="text-[10.5px] leading-relaxed text-ink-2">Stopping marks the mission as stopped and logs it in history. Remaining scripted events will not fire.</p>
        <div className="mt-2 flex items-center gap-1.5 font-mono text-[8.5px] text-ink-3"><AlertTriangle size={9} /> {mission ? `${mission.events.length - fired.length} pending events will be skipped` : ''}</div>
      </Modal>

    </Screen>
  )
}
