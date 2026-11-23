import { useEffect, useRef, useState } from 'react'
import { Play, RotateCcw, Server, ShieldCheck, ShieldX, ChevronRight, Layers, Timer } from 'lucide-react'
import { Panel, PageHeader, Screen, InlineAlert, StatusPill, KeyValue, Divider, Select, Slider, Progress } from '@/components/ui'
import { useEngine, selectOperator } from '@/services/engine'
import { usePrefs } from '@/services/prefs'
import { audio } from '@/services/audio'
import { cn, pad } from '@/lib/utils'

const LAYERS = [
  { id: 'L1', name: 'EDGE ROUTER', detail: 'Fictional perimeter gateway', risk: 'low' },
  { id: 'L2', name: 'FIREWALL CLUSTER', detail: 'Scripted packet filter layer', risk: 'elevated' },
  { id: 'L3', name: 'AUTH SERVICE', detail: 'Demonstration credential layer', risk: 'elevated' },
  { id: 'L4', name: 'APPLICATION CORE', detail: 'Sandbox application tier', risk: 'critical' },
  { id: 'L5', name: 'DATA VAULT', detail: 'Simulated storage volume', risk: 'critical' },
]

const SERVERS = [
  { id: 'SRV-DEMO-01', host: 'shadow-sim-app-01', os: 'SHADOW-LINUX 6.2', ip: '10.42.7.11' },
  { id: 'SRV-DEMO-02', host: 'shadow-sim-db-02', os: 'OBSIDIAN-OS 3.1', ip: '10.42.7.42' },
  { id: 'SRV-DEMO-03', host: 'shadow-sim-vault-03', os: 'LINUX-RT 5.15', ip: '10.42.9.7' },
]

type Result = 'success' | 'failure' | null

export default function ServerLab() {
  const operator = useEngine(selectOperator)
  const addActivity = useEngine((s) => s.logActivity)
  const notify = useEngine((s) => s.notify)
  const soundEnabled = usePrefs((p) => p.soundEnabled)

  const [serverId, setServerId] = useState(SERVERS[0].id)
  const [outcome, setOutcome] = useState<'success' | 'failure'>('success')
  const [speed, setSpeed] = useState(800)
  const [running, setRunning] = useState(false)
  const [layerIdx, setLayerIdx] = useState(-1)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<Result>(null)
  const [log, setLog] = useState<string[]>([])
  const timers = useRef<number[]>([])
  const server = SERVERS.find((s) => s.id === serverId)!

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), [])

  const clearAll = () => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []
  }

  const run = () => {
    clearAll()
    setRunning(true)
    setResult(null)
    setLayerIdx(-1)
    setProgress(0)
    setLog([])

    const failAt = outcome === 'failure' ? 2 + Math.floor(Math.random() * 2) : LAYERS.length

    LAYERS.forEach((layer, i) => {
      const t = window.setTimeout(() => {
        setLayerIdx(i)
        setProgress(Math.round(((i + 1) / LAYERS.length) * 100))
        const blocked = i >= failAt
        setLog((l) => [
          ...l,
          `[${new Date().toTimeString().slice(0, 8)}] ${layer.id} ${layer.name} :: ${blocked ? 'REJECTED — SCRIPTED FAILURE' : 'ACCEPTED'}`,
        ])
        if (soundEnabled) audio.play(blocked ? 'denied' : 'keystroke')
      }, speed * i)
      timers.current.push(t)
    })

    const done = window.setTimeout(() => {
      setRunning(false)
      const res: Result = failAt >= LAYERS.length ? 'success' : 'failure'
      setResult(res)
      setLog((l) => [...l, `[${new Date().toTimeString().slice(0, 8)}] SEQUENCE COMPLETE :: ${res === 'success' ? 'SHELL ESTABLISHED (SIM)' : 'SESSION TERMINATED'}`])
      if (soundEnabled) audio.play(res === 'success' ? 'granted' : 'denied')
      addActivity({
        module: 'cyber',
        actor: 'SERVER LAB',
        action: `Scripted infiltration ${res === 'success' ? 'completed' : 'failed'} against ${server.host}`,
        detail: 'Cinematic sequence · no real server contacted',
        level: res === 'success' ? 'success' : 'warning',
      })
      notify({
        type: res === 'success' ? 'success' : 'failure',
        title: res === 'success' ? 'Cinematic sequence completed' : 'Scripted sequence failed',
        body: `${server.host} — ${res === 'success' ? 'demo shell established (simulated)' : 'session terminated at layer ' + (failAt + 1)}`,
        severity: res === 'success' ? 'low' : 'elevated',
        module: 'cyber',
      })
    }, speed * LAYERS.length + 320)
    timers.current.push(done)
  }

  const reset = () => {
    clearAll()
    setRunning(false)
    setLayerIdx(-1)
    setProgress(0)
    setResult(null)
    setLog([])
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CYBER OPERATIONS · CINEMATIC SEQUENCE"
        title="Server Infiltration Lab"
        subtitle="A scripted movie sequence with success and failure variants. No server, port or network is ever contacted."
        icon={Server}
        meta={
          <>
            <span className="badge badge-cyan">SCRIPTED SCENARIO</span>
            <span className="badge badge-grey">{LAYERS.length} SIMULATED LAYERS</span>
            <span className="badge badge-amber">NO REAL ACCESS</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={reset}><RotateCcw size={11} /> Reset</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={run} disabled={running}><Play size={11} /> {running ? 'Running…' : 'Run scenario'}</button>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[1.35fr_1fr]">
        <Panel title="Infiltration Sequence" icon={Layers} subtitle={`${server.host} · ${server.os}`} bodyClassName="p-0">
          <div className="relative bg-[#04080b] p-4">
            <div className="micro-grid pointer-events-none absolute inset-0 opacity-20" />
            <div className="relative">
              <div className="mb-3 flex items-center justify-between border-b border-[#1c2a36] pb-2">
                <span className="term text-[10px] uppercase tracking-[0.2em] text-[#79f0b9]">infiltration-sequence.sim</span>
                <StatusPill value={result === 'success' ? 'completed' : result === 'failure' ? 'failed' : running ? 'active' : 'pending'} />
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['TARGET', server.id],
                  ['OS', server.os],
                  ['IP (SIM)', server.ip],
                  ['OPERATOR', operator.callsign],
                ].map(([k, v]) => (
                  <div key={k} className="border border-[#1c2a36] bg-[#0a1219] px-2 py-1">
                    <p className="term text-[7.5px] uppercase tracking-widest text-ink-3">{k}</p>
                    <p className="term mt-0.5 truncate text-[9.5px] text-[#79f0b9]">{v}</p>
                  </div>
                ))}
              </div>

              <ol className="space-y-1">
                {LAYERS.map((l, i) => {
                  const attempted = i <= layerIdx || (layerIdx === -1 && !running && progress > 0)
                  const passed = i < (result === 'success' ? LAYERS.length : layerIdx + 1)
                  const failedHere = result === 'failure' && i === layerIdx
                  return (
                    <li
                      key={l.id}
                      className={cn(
                        'flex items-center gap-2 border px-2 py-1.5 transition-colors',
                        failedHere ? 'border-[#6e2633] bg-[#2a1016]'
                          : passed && attempted ? 'border-[#1b6349] bg-[#0a2a20]'
                          : attempted ? 'border-[#6d5320] bg-[#241d0f]'
                          : 'border-[#16232e] bg-[#060c11]',
                      )}
                    >
                      <span className={cn('term w-6 shrink-0 text-[9.5px]', failedHere ? 'text-red' : passed && attempted ? 'text-green' : 'text-ink-3')}>{l.id}</span>
                      <span className={cn('min-w-0 flex-1 truncate term text-[10.5px]', failedHere ? 'text-[#ff9aa6]' : passed && attempted ? 'text-[#79f0b9]' : 'text-ink-2')}>
                        {l.name}
                      </span>
                      <span className="term hidden truncate text-[8.5px] text-ink-3 sm:block">{l.detail}</span>
                      <span className={cn('term shrink-0 text-[8.5px] uppercase tracking-wider', failedHere ? 'text-red' : passed && attempted ? 'text-green' : 'text-ink-3')}>
                        {failedHere ? 'REJECTED' : passed && attempted ? 'PASSED' : attempted ? 'PROBING' : 'IDLE'}
                      </span>
                    </li>
                  )
                })}
              </ol>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between term text-[9px] uppercase tracking-widest text-ink-3">
                  <span>SEQUENCE PROGRESS</span>
                  <span className="text-[#79f0b9]">{progress}%</span>
                </div>
                <div className="h-1 w-full bg-[#101c25]">
                  <div className="h-full bg-[#79f0b9] transition-[width] duration-300" style={{ width: `${progress}%`, boxShadow: '0 0 10px #79f0b9' }} />
                </div>
              </div>

              {result && (
                <div className={cn('mt-3 flex items-center gap-2 border p-2.5', result === 'success' ? 'border-[#1b6349] bg-[#0a2a20]' : 'border-[#6e2633] bg-[#2a1016]')}>
                  {result === 'success' ? <ShieldCheck size={16} className="text-green" /> : <ShieldX size={16} className="text-red" />}
                  <div>
                    <p className={cn('font-display text-[13px] font-semibold uppercase tracking-wider', result === 'success' ? 'text-[#79f0b9]' : 'text-[#ff9aa6]')}>
                      {result === 'success' ? 'SHELL ESTABLISHED (SIMULATED)' : 'SESSION TERMINATED'}
                    </p>
                    <p className="term text-[9px] text-ink-3">SCRIPTED OUTCOME · NO SYSTEM WAS ACCESSED</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-line p-2.5">
            <p className="label-xs mb-1">Sequence log</p>
            <div className="max-h-[130px] overflow-y-auto font-terminal text-[10px] leading-relaxed">
              {log.map((l, i) => (
                <p key={i} className={l.includes('REJECTED') || l.includes('TERMINATED') ? 'text-red' : 'text-green'}>{l}</p>
              ))}
              {log.length === 0 && <p className="text-ink-3">Run the scenario to populate the log.</p>}
            </div>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Scenario Settings" icon={Timer}>
            <div className="space-y-3">
              <Select label="Fictional server" value={serverId} onChange={setServerId} options={SERVERS.map((s) => ({ value: s.id, label: `${s.id} · ${s.host}` }))} />
              <Select
                label="Scripted outcome"
                value={outcome}
                onChange={(v) => setOutcome(v)}
                options={[{ value: 'success', label: 'Successful sequence' }, { value: 'failure', label: 'Failed sequence' }]}
              />
              <Slider label="Layer interval" min={250} max={1600} step={50} value={speed} onChange={setSpeed} suffix="ms" />
            </div>
            <Divider />
            <KeyValue
              cols={1}
              items={[
                { k: 'Target OS', v: server.os },
                { k: 'Target IP', v: `${server.ip} (sim)` },
                { k: 'Layers', v: String(LAYERS.length) },
                { k: 'Containment', v: 'ENFORCED' },
              ]}
            />
          </Panel>

          <Panel title="Layer Risk Profile" icon={Layers}>
            <ul className="space-y-2">
              {LAYERS.map((l) => (
                <li key={l.id}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] text-ink-2">{l.name}</span>
                    <span className={cn('mono text-[8.5px] uppercase', l.risk === 'critical' ? 'text-red' : l.risk === 'elevated' ? 'text-amber' : 'text-green')}>{l.risk}</span>
                  </div>
                  <Progress value={l.risk === 'critical' ? 88 : l.risk === 'elevated' ? 62 : 34} color={l.risk === 'critical' ? '#f14e61' : l.risk === 'elevated' ? '#f5b942' : '#38db91'} height={3} />
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Cinematic Notes" icon={ChevronRight}>
            <ul className="space-y-1.5 text-[10.5px] leading-relaxed text-ink-2">
              <li>• Use <strong className="text-ink">success</strong> for the triumphant reveal shot.</li>
              <li>• Use <strong className="text-ink">failure</strong> for a tension beat or trace scene.</li>
              <li>• Interval controls read naturally as keystrokes at 600–900 ms.</li>
              <li>• Progress bar and layer list animate in sync for B-roll capture.</li>
            </ul>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="amber" title="No real infiltration">
        This is a scripted visual sequence. It performs no authentication attempt, exploits nothing, and cannot access any
        system — the entire animation is rendered from local state in {pad(LAYERS.length)} discrete steps.
      </InlineAlert>
    </Screen>
  )
}
