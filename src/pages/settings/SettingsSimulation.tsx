import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  FlaskConical, Play, Pause, RotateCcw, Gauge, Activity, Clock, Layers, Database,
  Shuffle, ShieldAlert, Check, Zap, Radio, Eye, Sparkles,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Toggle, Slider, InlineAlert, Divider, KeyValue, Modal, Progress, Tabs, Timestamp } from '@/components/ui'
import { AreaTrend, BarsTrend, Donut, PALETTE, ChartLegend, RadialGauge } from '@/components/charts'
import { useEngine, type SimSpeed } from '@/services/engine'
import { usePrefs } from '@/services/prefs'
import { cn, fmtDateTime, pad, relTime } from '@/lib/utils'

const COUNTS = [
  { key: 'accounts', label: 'Accounts' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'findings', label: 'Findings' },
  { key: 'cameras', label: 'Cameras' },
  { key: 'cases', label: 'Cases' },
  { key: 'networkNodes', label: 'Nodes' },
  { key: 'missions', label: 'Missions' },
  { key: 'crisisIncidents', label: 'Incidents' },
  { key: 'messages', label: 'Messages' },
  { key: 'listings', label: 'Listings' },
] as const

export default function SettingsSimulation() {
  const navigate = useNavigate()
  const s = useEngine()
  const p = usePrefs()
  const [confirmReset, setConfirmReset] = useState(false)
  const [newSeed, setNewSeed] = useState(false)
  const [tab, setTab] = useState('engine')

  const uptime = Math.max(0, (Date.now() - new Date(s.simulatedTime).getTime()) / 1000)

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="SETTINGS · SIMULATION"
        title="Simulation Engine"
        subtitle="Control the deterministic demo engine: cadence, speed and world regeneration."
        icon={FlaskConical}
        meta={
          <>
            <span className="badge badge-cyan">SEED {s.seed}</span>
            <span className="badge badge-grey">{s.speed}× SPEED</span>
            <span className={cn('badge', s.paused ? 'badge-amber' : 'badge-green')}>{s.paused ? 'PAUSED' : 'RUNNING'}</span>
            <span className="badge badge-amber">TICK {s.tick}</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => s.togglePause()}>{s.paused ? <Play size={11} /> : <Pause size={11} />} {s.paused ? 'Resume' : 'Pause'}</button>
            <button type="button" className="btn btn-sm" onClick={() => s.resetSimulation(false)}><RotateCcw size={11} /> Regenerate</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => { setNewSeed(true); setConfirmReset(true) }}><Shuffle size={11} /> New seed</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Seed" value={s.seed} icon={Shuffle} accent="cyan" />
        <StatCard label="Speed" value={`${s.speed}×`} icon={Gauge} accent="green" />
        <StatCard label="Tick" value={s.tick} icon={Activity} accent="blue" />
        <StatCard label="Records" value={COUNTS.reduce((a, c) => a + (s[c.key] as unknown[]).length, 0)} icon={Database} accent="amber" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'engine', label: 'Engine' }, { id: 'world', label: 'World' }, { id: 'cadence', label: 'Cadence' }]} />
        <StatusPill value={s.paused ? 'paused' : 'active'} label={s.paused ? 'ENGINE PAUSED' : 'ENGINE RUNNING'} />
        <span className="mono ml-auto text-[8.5px] text-ink-3">sim {fmtDateTime(new Date(s.simulatedTime).toISOString())}</span>
      </div>

      {tab === 'engine' && (
        <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <Panel title="Controls" icon={Gauge}>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="label-xs mb-1">SPEED</p>
                  <div className="grid grid-cols-4 gap-1">
                    {([0.5, 1, 2, 5] as SimSpeed[]).map((v) => (
                      <button key={v} type="button" className={cn('btn btn-sm', s.speed === v && 'btn-primary')} onClick={() => s.setSpeed(v)}>{v}×</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <Row label="Auto-update" hint="Engine ticks drive live telemetry"><Toggle checked={s.autoUpdate} onChange={() => { /* toggled via pause */ }} label="" disabled /></Row>
                  <Row label="Paused" hint="Stops the tick loop"><Toggle checked={s.paused} onChange={() => s.togglePause()} label="" /></Row>
                </div>
              </div>
              <div className="mt-2 grid gap-1.5">
                <Row label="Cinematic mode" hint="Ambient presentation layer"><Toggle checked={s.cinematic} onChange={() => s.emit('SYSTEM.CINEMATIC_TOGGLE')} label="" /></Row>
                <Row label="Emergency mode" hint="Red HUD overlay"><Toggle checked={s.emergency} onChange={() => (s.emergency ? s.exitEmergency() : s.enterEmergency())} label="" /></Row>
              </div>
              <Divider />
              <div className="flex flex-wrap gap-1.5">
                <button type="button" className="btn btn-sm" onClick={() => navigate('/cinematic')}><Eye size={10} /> Open cinematic</button>
                <button type="button" className="btn btn-sm" onClick={() => navigate('/command-center/health')}><Activity size={10} /> System health</button>
              </div>
            </Panel>

            <Panel title="Tick Telemetry" icon={Activity}>
              <AreaTrend
                data={Array.from({ length: 24 }, (_, i) => ({ t: `${pad(i)}`, tick: 20 + Math.round(Math.abs(Math.sin((i + s.tick) / 3)) * 60) }))}
                keys={[{ key: 'tick', color: PALETTE.cyan, label: 'Load' }]}
                height={180}
              />
              <ChartLegend items={[{ label: 'Simulated engine load', color: PALETTE.cyan }]} />
            </Panel>

            <Panel title="Record Counts" icon={Database} bodyClassName="p-0">
              <table className="data-table">
                <thead><tr><th>Collection</th><th>Records</th><th>Share</th></tr></thead>
                <tbody>
                  {COUNTS.map((c) => {
                    const n = (s[c.key] as unknown[]).length
                    const total = COUNTS.reduce((a, x) => a + (s[x.key] as unknown[]).length, 0)
                    return (
                      <tr key={c.key}>
                        <td className="text-[10px] text-ink-2">{c.label}</td>
                        <td className="mono text-[9.5px] text-ink-3">{n}</td>
                        <td><span className="flex items-center gap-1"><Progress value={(n / Math.max(1, total)) * 100} height={2} className="w-20" /><span className="mono text-[8px] text-ink-3">{Math.round((n / Math.max(1, total)) * 100)}%</span></span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Panel>
          </div>

          <div className="space-y-3">
            <Panel title="Engine Load" icon={Gauge}>
              <RadialGauge value={42 + (s.tick % 30)} color="#38db91" height={150} label="ENGINE" suffix="%" />
              <p className="text-center font-mono text-[8px] text-ink-3">Deterministic · no network calls</p>
            </Panel>
            <Panel title="State" icon={Radio}>
              <KeyValue
                items={[
                  { k: 'Paused', v: s.paused ? 'YES' : 'NO' },
                  { k: 'Speed', v: `${s.speed}×` },
                  { k: 'Auto-update', v: s.autoUpdate ? 'ON' : 'OFF' },
                  { k: 'Cinematic', v: s.cinematic ? 'ON' : 'OFF' },
                  { k: 'Emergency', v: s.emergency ? 'ON' : 'OFF' },
                  { k: 'Session', v: String(s.sessionId ?? 'local').slice(0, 12) },
                ]}
              />
            </Panel>
            <Panel title="Danger Zone" icon={ShieldAlert}>
              <p className="text-[9.5px] leading-relaxed text-ink-2">Regenerating rebuilds every world collection from the current seed. Saved reports and preferences are untouched.</p>
              <button type="button" className="btn btn-sm w-full mt-2" onClick={() => { setNewSeed(false); setConfirmReset(true) }}><RotateCcw size={10} /> Reset with same seed</button>
              <button type="button" className="btn btn-sm btn-danger w-full mt-1.5" onClick={() => { setNewSeed(true); setConfirmReset(true) }}><Shuffle size={10} /> Reset with new seed</button>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'world' && (
        <div className="grid gap-3 lg:grid-cols-3">
          <Panel title="World Summary" icon={Layers} className="lg:col-span-2">
            <div className="grid gap-2 sm:grid-cols-3">
              {COUNTS.map((c) => (
                <div key={c.key} className="border border-line bg-bg p-2">
                  <p className="label-xs truncate">{c.label}</p>
                  <p className="mono text-[13px] text-ink">{(s[c.key] as unknown[]).length}</p>
                </div>
              ))}
            </div>
            <Divider />
            <BarsTrend horizontal data={COUNTS.map((c) => ({ name: c.label.slice(0, 12), v: (s[c.key] as unknown[]).length }))} keys={[{ key: 'v', color: PALETTE.cyan, label: 'Records' }]} height={220} xKey="name" />
            <ChartLegend items={[{ label: 'Records per collection', color: PALETTE.cyan }]} />
          </Panel>
          <div className="space-y-3">
            <Panel title="Composition" icon={Donut as unknown as typeof Layers}>
              <Donut
                data={[
                  { name: 'Finance', value: s.transactions.length, color: PALETTE.green },
                  { name: 'Intel', value: s.evidence.length, color: PALETTE.cyan },
                  { name: 'Comms', value: s.messages.length, color: PALETTE.blue },
                  { name: 'Market', value: s.listings.length, color: PALETTE.amber },
                  { name: 'Ops', value: s.networkNodes.length + s.cameras.length, color: '#a78bfa' },
                ]}
                height={170}
                centerLabel="RECORDS"
                centerValue={String(COUNTS.reduce((a, c) => a + (s[c.key] as unknown[]).length, 0))}
              />
            </Panel>
            <Panel title="Seed" icon={Shuffle}>
              <p className="mono text-[11px] text-ink">{s.seed}</p>
              <p className="mt-1 text-[9.5px] leading-relaxed text-ink-3">The same seed always produces the same demonstration world. A new seed regenerates every collection with fresh values.</p>
              <Divider />
              <Timestamp ts={new Date(s.simulatedTime).toISOString()} />
            </Panel>
          </div>
        </div>
      )}

      {tab === 'cadence' && (
        <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <Panel title="Update Frequency" icon={Clock}>
              <Slider label="Auto-update interval" min={1} max={15} value={p.autoUpdateFrequency} onChange={(v) => p.set('autoUpdateFrequency', v)} suffix="s" />
              <p className="mt-1 text-[9.5px] leading-relaxed text-ink-3">Stored with preferences. The engine ticks on its own fixed interval; this value documents the intended cadence for the demo.</p>
              <Divider />
              <div className="grid gap-1.5">
                <Row label="24-hour clock" hint="Affects every timestamp"><Toggle checked={p.clockFormat === 24} onChange={(v) => p.set('clockFormat', v ? 24 : 12)} label="" /></Row>
                <Row label="Sound cues" hint="Audio on engine events"><Toggle checked={p.soundEnabled} onChange={(v) => p.set('soundEnabled', v)} label="" /></Row>
              </div>
            </Panel>
            <Panel title="Tick History" icon={Activity} bodyClassName="p-0">
              <table className="data-table">
                <thead><tr><th>#</th><th>Topic</th><th>Severity</th><th>When</th></tr></thead>
                <tbody>
                  {s.bus.slice(0, 10).map((b, i) => (
                    <tr key={b.id}>
                      <td className="mono text-[8.5px] text-ink-3">{pad(i + 1)}</td>
                      <td className="mono text-[9px] text-[var(--accent)]">{b.topic}</td>
                      <td className="mono text-[8.5px] text-ink-3">{b.severity ?? 'low'}</td>
                      <td className="mono whitespace-nowrap text-[8px] text-ink-3">{relTime(b.ts)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
          <div className="space-y-3">
            <Panel title="Cadence Preview" icon={Zap}>
              <Slider label="Preview interval" min={1} max={15} value={p.autoUpdateFrequency} onChange={(v) => p.set('autoUpdateFrequency', v)} suffix="s" />
              <div className="mt-2 flex items-center gap-1">
                {Array.from({ length: 15 }).map((_, i) => <span key={i} className={cn('h-3 flex-1', i < p.autoUpdateFrequency ? 'bg-[var(--accent)]' : 'bg-[#1c2a36]')} />)}
              </div>
              <p className="mt-1 font-mono text-[8px] text-ink-3">{p.autoUpdateFrequency} of 15 seconds per cycle</p>
            </Panel>
            <Panel title="Uptime" icon={Clock}>
              <KeyValue items={[{ k: 'Sim clock', v: new Date(s.simulatedTime).toISOString().slice(11, 19) + 'Z' }, { k: 'Elapsed', v: `${Math.floor(uptime)} s` }, { k: 'Speed', v: `${s.speed}×` }]} />
            </Panel>
            <Panel title="Notes" icon={Sparkles}>
              <ul className="space-y-1 text-[9.5px] leading-relaxed text-ink-2">
                <li>• Ticks drive live charts and counters.</li>
                <li>• Pausing freezes simulated time.</li>
                <li>• Speed multiplies the tick interval.</li>
                <li>• Nothing runs while the tab is closed.</li>
              </ul>
            </Panel>
          </div>
        </div>
      )}

      <InlineAlert tone="amber" title="Simulation only">
        The engine generates every record locally. Nothing is fetched, scraped or monitored, and no external system is simulated
        on the other end.
      </InlineAlert>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title={newSeed ? 'Reset with New Seed' : 'Regenerate World'} subtitle="Rebuilds every demonstration collection" icon={RotateCcw}
        footer={<>
          <button type="button" className="btn" onClick={() => setConfirmReset(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => { s.resetSimulation(newSeed); setConfirmReset(false) }}><Check size={11} /> {newSeed ? 'New seed + reset' : 'Regenerate'}</button>
        </>}
      >
        <p className="text-[10.5px] leading-relaxed text-ink-2">
          All generated records — accounts, transactions, findings, cameras, cases, missions, messages, listings and incidents —
          are rebuilt. Reports, preferences and AI history are preserved.
        </p>
        {newSeed && <p className="mt-1.5 font-mono text-[8.5px] text-amber">A random seed will be chosen; previous data cannot be recovered.</p>}
      </Modal>
    </Screen>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line-soft/60 py-1 last:border-0">
      <span className="min-w-0">
        <span className="block text-[10.5px] text-ink-2">{label}</span>
        {hint && <span className="block text-[8.5px] text-ink-3">{hint}</span>}
      </span>
      {children}
    </div>
  )
}
