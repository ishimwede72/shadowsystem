import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Rocket, Layers, Plus, Trash2, ArrowLeft, ArrowRight, Check, Wand2, Clock,
  Zap, Target, ChevronRight, CircleDot, AlertTriangle, Settings2, Play, Gauge,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, SeverityPill, Select, InlineAlert, Divider, KeyValue, Tag, Progress, Modal, Slider } from '@/components/ui'
import { RadarMetric, PALETTE, BarsTrend, ChartLegend } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, pad } from '@/lib/utils'
import type { MissionEvent, ModuleKey, ScenarioTemplate, Severity } from '@/types'

const MODULES: { key: ModuleKey; label: string }[] = [
  { key: 'command', label: 'Command' }, { key: 'finance', label: 'Finance' }, { key: 'cyber', label: 'Cyber' },
  { key: 'geoint', label: 'GEOINT' }, { key: 'surveillance', label: 'Surveillance' }, { key: 'intelligence', label: 'Intelligence' },
  { key: 'network', label: 'Network' }, { key: 'forensics', label: 'Forensics' }, { key: 'underground', label: 'Underground' },
  { key: 'crypto', label: 'Cryptography' }, { key: 'ai', label: 'SHADOW AI' }, { key: 'crisis', label: 'Crisis' },
  { key: 'comms', label: 'Comms' }, { key: 'reports', label: 'Reports' },
]

const STEPS = ['basics', 'events', 'review'] as const

export default function MissionBuilder() {
  const navigate = useNavigate()
  const s = useEngine()
  const [step, setStep] = useState<(typeof STEPS)[number]>('basics')
  const [templateId, setTemplateId] = useState<string>('tpl-blackout')
  const [name, setName] = useState('OPERATION CUSTOM')
  const [code, setCode] = useState('OP-CUSTOM')
  const [category, setCategory] = useState('INFRASTRUCTURE')
  const [severity, setSeverity] = useState<Severity>('elevated')
  const [description, setDescription] = useState('A custom simulated operation assembled in the mission builder.')
  const [eta, setEta] = useState(6)
  const [modules, setModules] = useState<ModuleKey[]>(['command', 'cyber', 'network'])
  const [events, setEvents] = useState<MissionEvent[]>(() => s.templates[0]?.events ?? [])
  const [previewOpen, setPreviewOpen] = useState(false)

  const template = s.templates.find((t) => t.id === templateId)

  const applyTemplate = (t: ScenarioTemplate) => {
    setTemplateId(t.id)
    setName(t.name)
    setCode(t.code)
    setCategory(t.category)
    setSeverity(t.severity)
    setDescription(t.description)
    setEta(t.durationMinutes)
    setEvents(t.events.map((e) => ({ ...e })))
    setModules(t.modules)
  }

  const toggleModule = (m: ModuleKey) => {
    setModules((list) => (list.includes(m) ? list.filter((x) => x !== m) : [...list, m]))
    const evt = s.templates.flatMap((t) => t.events).find((e) => e.module === m)
    if (evt && !modules.includes(m)) {
      setEvents((list) => [...list, { ...evt, id: `EVT-C-${list.length + 1}`, at: (list[list.length - 1]?.at ?? 0) + 40 }].sort((a, b) => a.at - b.at))
    }
  }

  const reindex = () => setEvents((list) => list.map((e, i) => ({ ...e, id: `EVT-C-${i + 1}` })).sort((a, b) => a.at - b.at))

  const addEvent = () => {
    setEvents((list) => [...list, {
      id: `EVT-C-${list.length + 1}`,
      at: (list[list.length - 1]?.at ?? 0) + 45,
      module: 'command',
      action: 'scene-init',
      label: 'New simulated step',
      duration: 8,
      severity: 'low',
    }])
  }

  const removeEvent = (id: string) => setEvents((list) => list.filter((e) => e.id !== id))

  const totalEvents = events.length
  const lastAt = events[events.length - 1]?.at ?? 0
  const coverage = Math.round((modules.length / MODULES.length) * 100)

  const create = () => {
    const mission = s.createMission({
      code, name, description, category, severity, status: 'draft',
      etaMinutes: eta, modules, events, templateId, operatorId: s.currentOperatorId,
    })
    s.startMission(mission.id)
    navigate('/missions/active')
  }

  const sparkline = useMemo(
    () => Array.from({ length: Math.max(1, Math.ceil(Math.max(lastAt, eta * 60) / 30)) }, (_, i) => ({
      t: `${pad(Math.floor((i * 30) / 60))}:${pad((i * 30) % 60)}`,
      v: events.filter((e) => e.at >= i * 30 && e.at < (i + 1) * 30).length,
    })),
    [events, eta, lastAt],
  )

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="MISSIONS · BUILDER"
        title="Mission Builder"
        subtitle="Assemble a scripted multi-module operation from a template, then tune modules and events."
        icon={Wand2}
        meta={
          <>
            <span className="badge badge-cyan">3 STEPS</span>
            <span className="badge badge-grey">{totalEvents} EVENTS</span>
            <span className="badge badge-amber">{modules.length} MODULES</span>
            <span className="badge badge-green">DRAFT</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => { setStep('basics'); setName('OPERATION CUSTOM'); setCode('OP-CUSTOM'); setEvents([]); setModules([]) }}><Trash2 size={11} /> Clear</button>
            <button type="button" className="btn btn-sm" onClick={() => setPreviewOpen(true)} disabled={!code || !name}><Play size={11} /> Preview</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={create} disabled={!code || !name || events.length === 0}><Rocket size={11} /> Launch</button>
          </>
        }
      />

      <div className="flex items-center gap-1.5">
        {STEPS.map((st, i) => (
          <button key={st} type="button" onClick={() => setStep(st)}
            className={cn('flex flex-1 items-center gap-2 border px-2 py-1.5 text-left transition', step === st ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-line bg-panel hover:bg-elevated')}
          >
            <span className={cn('grid h-4.5 w-4.5 place-items-center rounded-full border font-mono text-[8px]', step === st ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-line text-ink-3')}>{i + 1}</span>
            <span className="min-w-0">
              <span className="block text-[10px] capitalize text-ink">{st}</span>
              <span className="block truncate font-mono text-[7.5px] text-ink-3">{st === 'basics' ? 'Identity & template' : st === 'events' ? 'Modules & script' : 'Review & launch'}</span>
            </span>
          </button>
        ))}
      </div>

      {step === 'basics' && (
        <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <Panel title="Template" icon={Layers}>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {s.templates.map((t) => (
                  <button key={t.id} type="button" onClick={() => applyTemplate(t)}
                    className={cn('border p-2 text-left transition', templateId === t.id ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-line hover:bg-elevated')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="mono text-[8.5px]" style={{ color: t.accent }}>{t.code}</span>
                      <SeverityPill value={t.severity} />
                    </div>
                    <p className="mt-0.5 truncate text-[10.5px] text-ink">{t.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-[9px] leading-relaxed text-ink-3">{t.description}</p>
                    <div className="mt-1 flex items-center gap-1 font-mono text-[7.5px] text-ink-3">
                      <span>{t.durationMinutes}m</span><span>·</span><span>{t.events.length} events</span><span>·</span><span>{t.modules.length} modules</span>
                    </div>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Identity" icon={Target}>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="mb-name">Name</label>
                  <input id="mb-name" value={name} onChange={(e) => setName(e.target.value)} className="field" />
                </div>
                <div>
                  <label className="field-label" htmlFor="mb-code">Code</label>
                  <input id="mb-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="field font-mono" />
                </div>
                <Select label="Category" value={category} onChange={setCategory} options={['INFRASTRUCTURE', 'INTELLIGENCE', 'FINANCIAL', 'CYBER', 'CRISIS', 'FORENSIC'].map((c) => ({ value: c, label: c }))} />
                <Select label="Severity" value={severity} onChange={(v) => setSeverity(v as Severity)} options={[{ value: 'low', label: 'Low' }, { value: 'elevated', label: 'Elevated' }, { value: 'critical', label: 'Critical' }]} />
              </div>
              <div className="mt-2">
                <label className="field-label" htmlFor="mb-desc">Description</label>
                <textarea id="mb-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="field min-h-[70px] text-[11px]" />
              </div>
              <div className="mt-2">
                <Slider label="ETA (minutes)" min={2} max={30} value={eta} onChange={setEta} suffix="m" />
              </div>
            </Panel>
          </div>

          <div className="space-y-3">
            <Panel title="Preview" icon={Rocket} actions={<SeverityPill value={severity} />}>
              <p className="mono text-[8.5px] text-[var(--accent)]">{code}</p>
              <h3 className="font-display text-[14px] leading-tight text-ink">{name || 'Untitled mission'}</h3>
              <p className="mt-1 text-[10px] leading-relaxed text-ink-2">{description}</p>
              <Divider />
              <KeyValue
                items={[
                  { k: 'Category', v: category },
                  { k: 'ETA', v: `${eta} min` },
                  { k: 'Events', v: String(events.length) },
                  { k: 'Modules', v: String(modules.length) },
                  { k: 'Template', v: template?.name ?? '—' },
                ]}
              />
              <Divider />
              <button type="button" className="btn btn-sm w-full" onClick={() => setStep('events')}>Next: script <ArrowRight size={10} /></button>
            </Panel>

            <Panel title="Template Coverage" icon={Gauge}>
              <Progress value={coverage} height={4} />
              <p className="mt-1 font-mono text-[8.5px] text-ink-3">{modules.length} of {MODULES.length} modules engaged ({coverage}%)</p>
              <Divider />
              <div className="flex flex-wrap gap-1">
                {modules.map((m) => <Tag key={m} tone="#28d8ea">{m.toUpperCase()}</Tag>)}
                {modules.length === 0 && <span className="text-[9.5px] text-ink-3">No modules selected.</span>}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {step === 'events' && (
        <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <Panel title="Modules" icon={Settings2}>
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                {MODULES.map((m) => {
                  const on = modules.includes(m.key)
                  return (
                    <button key={m.key} type="button" onClick={() => toggleModule(m.key)}
                      className={cn('flex items-center gap-1 border px-1.5 py-1 text-left', on ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-ink' : 'border-line text-ink-3')}
                    >
                      <span className={cn('grid h-3 w-3 shrink-0 place-items-center rounded-sm border', on ? 'border-[var(--accent)]' : 'border-line')}>{on && <Check size={7} />}</span>
                      <span className="truncate text-[9.5px]">{m.label}</span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-1.5 font-mono text-[8px] text-ink-3">Selecting a module seeds one representative event from the template library.</p>
            </Panel>

            <Panel title="Event Script" icon={Zap} bodyClassName="p-0"
              actions={<>
                <button type="button" className="btn btn-sm" onClick={reindex}><Wand2 size={10} /> Reindex</button>
                <button type="button" className="btn btn-sm btn-primary" onClick={addEvent}><Plus size={10} /> Add</button>
              </>}
            >
              <div className="max-h-[42vh] overflow-auto">
                <table className="data-table min-w-[680px]">
                  <thead><tr><th>T+ (s)</th><th>Module</th><th>Action</th><th>Label</th><th>Severity</th><th /></tr></thead>
                  <tbody>
                    {events.map((e, i) => (
                      <tr key={e.id}>
                        <td>
                          <input type="number" value={e.at} onChange={(ev) => setEvents((list) => list.map((x, xi) => xi === i ? { ...x, at: Number(ev.target.value) } : x))} className="field w-16 font-mono text-[9px]" />
                        </td>
                        <td>
                          <Select className="w-28" value={e.module} onChange={(v) => setEvents((list) => list.map((x, xi) => xi === i ? { ...x, module: v as ModuleKey } : x))} options={MODULES.map((m) => ({ value: m.key, label: m.label }))} />
                        </td>
                        <td><input value={e.action} onChange={(ev) => setEvents((list) => list.map((x, xi) => xi === i ? { ...x, action: ev.target.value } : x))} className="field w-28 font-mono text-[9px]" /></td>
                        <td><input value={e.label} onChange={(ev) => setEvents((list) => list.map((x, xi) => xi === i ? { ...x, label: ev.target.value } : x))} className="field min-w-[180px] text-[9.5px]" /></td>
                        <td><SeverityPill value={e.severity ?? 'low'} /></td>
                        <td><button type="button" className="icon-btn" onClick={() => removeEvent(e.id)} title="Remove"><Trash2 size={9} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {events.length === 0 && <p className="px-3 py-4 text-center text-[10px] text-ink-3">No events yet. Add one or pick a template.</p>}
              </div>
            </Panel>

            <div className="flex gap-1.5">
              <button type="button" className="btn btn-sm" onClick={() => setStep('basics')}><ArrowLeft size={10} /> Back</button>
              <button type="button" className="btn btn-sm btn-primary ml-auto" onClick={() => setStep('review')}>Review <ArrowRight size={10} /></button>
            </div>
          </div>

          <div className="space-y-3">
            <Panel title="Event Density" icon={Clock}>
              <BarsTrend data={sparkline} keys={[{ key: 'v', color: PALETTE.amber, label: 'Events' }]} height={150} xKey="t" />
              <ChartLegend items={[{ label: 'Events per 30s', color: PALETTE.amber }]} />
            </Panel>
            <Panel title="Module Mix" icon={Target}>
              <RadarMetric
                data={MODULES.slice(0, 8).map((m) => ({ axis: m.label.slice(0, 8), value: events.filter((e) => e.module === m.key).length * 25 }))}
                height={170}
              />
            </Panel>
            <Panel title="Script Stats" icon={CircleDot}>
              <KeyValue
                items={[
                  { k: 'Events', v: String(events.length) },
                  { k: 'Last at', v: `T+${lastAt}s` },
                  { k: 'Critical', v: String(events.filter((e) => e.severity === 'critical').length) },
                  { k: 'ETA', v: `${eta}m` },
                ]}
              />
              <Divider />
              <p className="font-mono text-[8px] leading-relaxed text-ink-3">
                {lastAt > eta * 60 ? <span className="text-amber"><AlertTriangle size={8} className="mr-1 inline" />Last event is past the ETA — it may never fire.</span> : 'Script fits inside the ETA window.'}
              </p>
            </Panel>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <Panel title="Review" icon={Check}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="mono text-[9px] text-[var(--accent)]">{code}</p>
                  <h3 className="font-display text-[15px] text-ink">{name}</h3>
                  <p className="mt-0.5 max-w-lg text-[10px] leading-relaxed text-ink-2">{description}</p>
                </div>
                <SeverityPill value={severity} />
              </div>
              <Divider />
              <div className="grid gap-2 sm:grid-cols-2">
                <KeyValue items={[{ k: 'Category', v: category }, { k: 'ETA', v: `${eta} min` }, { k: 'Events', v: String(events.length) }]} />
                <KeyValue items={[{ k: 'Modules', v: String(modules.length) }, { k: 'Coverage', v: `${coverage}%` }, { k: 'Template', v: template?.code ?? '—' }]} />
              </div>
              <Divider label="SCRIPT" />
              <ol className="space-y-1">
                {events.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 border-b border-line-soft/40 py-0.5 text-[10px]">
                    <span className="mono w-12 shrink-0 text-ink-3">T+{e.at}s</span>
                    <span className="badge badge-grey shrink-0">{e.module.toUpperCase()}</span>
                    <span className="min-w-0 flex-1 truncate text-ink-2">{e.label}</span>
                    <SeverityPill value={e.severity ?? 'low'} />
                  </li>
                ))}
              </ol>
              <div className="mt-2 flex gap-1.5">
                <button type="button" className="btn btn-sm" onClick={() => setStep('events')}><ArrowLeft size={10} /> Back</button>
                <button type="button" className="btn btn-sm btn-primary ml-auto" onClick={create} disabled={!code || !name || !events.length}><Rocket size={10} /> Launch mission</button>
              </div>
            </Panel>
          </div>

          <div className="space-y-3">
            <Panel title="Launch Checks" icon={AlertTriangle}>
              <ul className="space-y-1">
                <Check2 ok={!!name} label="Name set" />
                <Check2 ok={!!code} label="Code issued" />
                <Check2 ok={events.length > 0} label={`${events.length} events scripted`} />
                <Check2 ok={modules.length > 0} label={`${modules.length} modules engaged`} />
                <Check2 ok={lastAt <= eta * 60} label="Events inside ETA" />
              </ul>
              <Divider />
              <button type="button" className="btn btn-sm w-full" onClick={() => setPreviewOpen(true)}><Play size={10} /> Dry-run preview</button>
            </Panel>
            <Panel title="Modules" icon={Settings2}>
              <div className="flex flex-wrap gap-1">{modules.map((m) => <Tag key={m} tone="#28d8ea">{m.toUpperCase()}</Tag>)}</div>
              {modules.length === 0 && <p className="text-[9.5px] text-ink-3">None selected.</p>}
            </Panel>
          </div>
        </div>
      )}

      <InlineAlert tone="cyan" title="Simulated launch">
        Launching creates a mission in the local store and starts the scripted runner. Events affect demo modules only — no real
        systems are touched.
      </InlineAlert>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Dry-run Preview" subtitle={`${code} · ${events.length} events`} icon={Play} size="lg"
        footer={<>
          <button type="button" className="btn" onClick={() => setPreviewOpen(false)}>Close</button>
          <button type="button" className="btn btn-primary" onClick={() => { setPreviewOpen(false); create() }} disabled={!events.length}><Rocket size={11} /> Launch</button>
        </>}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusPill value="scheduled" label="DRY RUN" />
            <span className="badge badge-grey">{eta}m ETA</span>
            <span className="badge badge-amber">{events.filter((e) => e.severity === 'critical').length} critical</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <KeyValue cols={1} items={[{ k: 'Events', v: String(events.length) }]} />
            <KeyValue cols={1} items={[{ k: 'Modules', v: String(modules.length) }]} />
            <KeyValue cols={1} items={[{ k: 'Last', v: `T+${lastAt}s` }]} />
            <KeyValue cols={1} items={[{ k: 'Overrun', v: lastAt > eta * 60 ? 'YES' : 'NO' }]} />
          </div>
          <div className="max-h-[240px] overflow-auto border border-line bg-bg p-2">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-2 border-b border-line-soft/40 py-0.5 last:border-0">
                <span className="mono w-12 text-[8px] text-ink-3">T+{e.at}s</span>
                <span className="text-[8.5px] uppercase text-[var(--accent)]">{e.module}</span>
                <span className="min-w-0 flex-1 truncate text-[9.5px] text-ink-2">{e.label}</span>
                <ChevronRight size={8} className="text-ink-3" />
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </Screen>
  )
}

function Check2({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-1.5 text-[10px]">
      <span className={cn('grid h-3.5 w-3.5 place-items-center rounded-full border', ok ? 'border-green bg-[#0a2a20] text-green' : 'border-red bg-[#2a0d13] text-red')}>
        {ok ? <Check size={7} /> : <AlertTriangle size={7} />}
      </span>
      <span className={ok ? 'text-ink-2' : 'text-ink-3'}>{label}</span>
    </li>
  )
}
