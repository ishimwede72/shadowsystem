import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layers, Search, Filter, Rocket, Eye, Clock, Zap, Settings2, Copy,
  ShieldAlert, Sparkles, Check, X, Download, BookOpen,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, SeverityPill, Select, InlineAlert, Divider, Tag, Modal, Progress, Tabs } from '@/components/ui'
import { RadarMetric, Donut, PALETTE, ChartLegend, BarsTrend } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { downloadFile } from '@/lib/utils'
import type { ScenarioTemplate } from '@/types'

export default function Templates() {
  const navigate = useNavigate()
  const s = useEngine()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [tab, setTab] = useState('all')
  const [preview, setPreview] = useState<ScenarioTemplate | null>(null)

  const cats = useMemo(() => Array.from(new Set(s.templates.map((t) => t.category))), [s.templates])

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return s.templates.filter((t) => {
      if (term && !`${t.name} ${t.code} ${t.description} ${t.category}`.toLowerCase().includes(term)) return false
      if (cat !== 'all' && t.category !== cat) return false
      if (tab === 'critical' && t.severity !== 'critical') return false
      if (tab === 'short' && t.durationMinutes > 6) return false
      return true
    })
  }, [s.templates, q, cat, tab])

  const launch = (t: ScenarioTemplate) => {
    const mission = s.createMission({
      code: `${t.code}-${Math.floor(Math.random() * 90 + 10)}`, name: t.name, description: t.description, category: t.category,
      severity: t.severity, status: 'draft', etaMinutes: t.durationMinutes, modules: t.modules, events: t.events.map((e) => ({ ...e })),
      templateId: t.id, operatorId: s.currentOperatorId,
    })
    s.startMission(mission.id)
    navigate('/missions/active')
  }

  const usedCount = (id: string) => s.missions.filter((m) => m.templateId === id).length

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="MISSIONS · TEMPLATES"
        title="Scenario Library"
        subtitle="Six scripted operations that each drive a different combination of modules."
        icon={Layers}
        meta={
          <>
            <span className="badge badge-cyan">{s.templates.length} TEMPLATES</span>
            <span className="badge badge-red">{s.templates.filter((t) => t.severity === 'critical').length} CRITICAL</span>
            <span className="badge badge-amber">{cats.length} CATEGORIES</span>
            <span className="badge badge-green">READY</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile('shadow-templates.json', JSON.stringify(s.templates, null, 2), 'application/json')}><Download size={11} /> Export JSON</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/missions/builder')}><Sparkles size={11} /> Build custom</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Templates" value={s.templates.length} icon={Layers} accent="cyan" />
        <StatCard label="Total events" value={s.templates.reduce((a, t) => a + t.events.length, 0)} icon={Zap} accent="amber" />
        <StatCard label="Categories" value={cats.length} icon={BookOpen} accent="blue" />
        <StatCard label="Instantiated" value={s.missions.filter((m) => m.templateId).length} icon={Rocket} accent="green" />
      </div>

      <Panel title="Filters" icon={Filter}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <p className="label-xs mb-1">SEARCH</p>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Template name, code or description…" className="field pl-7" />
            </div>
          </div>
          <div><p className="label-xs mb-1">CATEGORY</p><Select className="w-40" value={cat} onChange={setCat} options={[{ value: 'all', label: 'All categories' }, ...cats.map((c) => ({ value: c, label: c }))]} /></div>
          <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'all', label: 'All', count: s.templates.length }, { id: 'critical', label: 'Critical' }, { id: 'short', label: '≤6 min' }]} />
        </div>
      </Panel>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((t) => (
          <Panel key={t.id} title={t.code} subtitle={t.category} icon={ShieldAlert}
            actions={<SeverityPill value={t.severity} />}
            className="relative overflow-hidden"
          >
            <span className="absolute inset-x-0 top-0 h-px" style={{ background: t.accent }} />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display text-[13px] leading-tight text-ink">{t.name}</h3>
                <p className="mt-1 line-clamp-3 text-[9.5px] leading-relaxed text-ink-2">{t.description}</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1 font-mono text-[8px] text-ink-3">
              <span className="flex items-center gap-0.5"><Clock size={8} /> {t.durationMinutes}m</span>
              <span>·</span>
              <span className="flex items-center gap-0.5"><Zap size={8} /> {t.events.length} events</span>
              <span>·</span>
              <span className="flex items-center gap-0.5"><Settings2 size={8} /> {t.modules.length} modules</span>
              <span>·</span>
              <span className="flex items-center gap-0.5"><Rocket size={8} /> {usedCount(t.id)} runs</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {t.modules.slice(0, 5).map((m) => <Tag key={m} tone={t.accent}>{m.toUpperCase()}</Tag>)}
              {t.modules.length > 5 && <Tag tone="#65788b">+{t.modules.length - 5}</Tag>}
            </div>
            <div className="mt-2 flex gap-1">
              <button type="button" className="btn btn-sm flex-1" onClick={() => setPreview(t)}><Eye size={10} /> Details</button>
              <button type="button" className="btn btn-sm btn-primary flex-1" onClick={() => launch(t)}><Rocket size={10} /> Launch</button>
            </div>
          </Panel>
        ))}
      </div>

      {filtered.length === 0 && (
        <Panel title="No matches"><div className="py-6 text-center text-[10.5px] text-ink-3">No templates match the current filters.</div></Panel>
      )}

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Coverage Radar" icon={Layers} className="lg:col-span-2">
          <RadarMetric
            data={cats.map((c) => ({ axis: c.slice(0, 9), value: s.templates.filter((t) => t.category === c).length * 33 }))}
            height={200}
          />
          <p className="text-center font-mono text-[8px] text-ink-3">Weighted by templates per category</p>
        </Panel>
        <Panel title="Module Coverage" icon={Settings2}>
          {(() => {
            const m = new Map<string, number>()
            s.templates.forEach((t) => t.modules.forEach((mod) => m.set(mod, (m.get(mod) ?? 0) + 1)))
            const arr = Array.from(m.entries()).sort((a, b) => b[1] - a[1])
            return arr.slice(0, 7).map(([mod, n]) => (
              <div key={mod} className="mb-1">
                <div className="flex justify-between"><span className="text-[10px] uppercase text-ink-2">{mod}</span><span className="mono text-[8px] text-ink-3">{n}</span></div>
                <Progress value={(n / s.templates.length) * 100} height={2} />
              </div>
            ))
          })()}
        </Panel>
      </div>

      <Panel title="Comparison" icon={Sparkles} bodyClassName="p-0">
        <table className="data-table">
          <thead><tr><th>Template</th><th>Category</th><th>Severity</th><th>Duration</th><th>Events</th><th>Modules</th><th>Runs</th><th /></tr></thead>
          <tbody>
            {s.templates.map((t) => (
              <tr key={t.id}>
                <td><span className="mono text-[8px] text-[var(--accent)]">{t.code}</span><span className="block text-[10px] text-ink">{t.name}</span></td>
                <td className="text-[9px] uppercase text-ink-3">{t.category}</td>
                <td><SeverityPill value={t.severity} /></td>
                <td className="mono text-[9px] text-ink-3">{t.durationMinutes}m</td>
                <td className="mono text-[9px] text-ink-3">{t.events.length}</td>
                <td className="mono text-[9px] text-ink-3">{t.modules.length}</td>
                <td className="mono text-[9px] text-ink-3">{usedCount(t.id)}</td>
                <td>
                  <span className="flex gap-1">
                    <button type="button" className="icon-btn" onClick={() => setPreview(t)} title="Preview"><Eye size={9} /></button>
                    <button type="button" className="icon-btn" onClick={() => launch(t)} title="Launch"><Rocket size={9} /></button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Severity Split" icon={ShieldAlert}>
          <Donut
            data={['low', 'elevated', 'critical'].map((sv, i) => ({ name: sv, value: s.templates.filter((t) => t.severity === sv).length, color: [PALETTE.green, PALETTE.amber, PALETTE.red][i] })).filter((d) => d.value)}
            height={160}
            centerLabel="TEMPLATES"
            centerValue={String(s.templates.length)}
          />
        </Panel>
        <Panel title="Events per Template" icon={Zap}>
          <BarsTrend horizontal data={s.templates.map((t) => ({ name: t.code.replace('OP-', ''), v: t.events.length }))} keys={[{ key: 'v', color: PALETTE.cyan, label: 'Events' }]} height={160} xKey="name" />
          <ChartLegend items={[{ label: 'Scripted events', color: PALETTE.cyan }]} />
        </Panel>
      </div>

      <InlineAlert tone="cyan" title="Fictional scenarios">
        These templates describe invented infrastructure, financial and intelligence scenarios. They are narrative material for
        the demonstration only.
      </InlineAlert>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.name ?? ''} subtitle={preview ? `${preview.code} · ${preview.category}` : ''} icon={Eye} size="lg"
        footer={<>
          <button type="button" className="btn" onClick={() => setPreview(null)}><X size={11} /> Close</button>
          <button type="button" className="btn" onClick={() => { if (preview) { setPreview(null); navigate('/missions/builder') } }}><Copy size={11} /> Customise</button>
          <button type="button" className="btn btn-primary" onClick={() => { if (preview) launch(preview) }}><Rocket size={11} /> Launch</button>
        </>}
      >
        {preview && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <SeverityPill value={preview.severity} />
              <StatusPill value="scheduled" label={`${preview.durationMinutes}m ETA`} dot={false} />
              <span className="badge badge-grey">{preview.events.length} events</span>
              <span className="badge badge-grey">{preview.modules.length} modules</span>
            </div>
            <p className="text-[10.5px] leading-relaxed text-ink-2">{preview.description}</p>
            <Divider label="MODULES" />
            <div className="flex flex-wrap gap-1">{preview.modules.map((m) => <Tag key={m} tone={preview.accent}>{m.toUpperCase()}</Tag>)}</div>
            <Divider label="EVENT SCRIPT" />
            <div className="max-h-[240px] overflow-auto border border-line bg-bg p-2">
              {preview.events.map((e) => (
                <div key={e.id} className="flex items-center gap-2 border-b border-line-soft/40 py-0.5 last:border-0">
                  <span className="mono w-12 text-[8px] text-ink-3">T+{e.at}s</span>
                  <span className="text-[8.5px] uppercase text-[var(--accent)]">{e.module}</span>
                  <span className="min-w-0 flex-1 truncate text-[9.5px] text-ink-2">{e.label}</span>
                  <SeverityPill value={e.severity ?? 'low'} />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[8.5px] text-ink-3"><Check size={9} className="text-green" /> Launching instantiates a local mission and starts the runner immediately.</div>
          </div>
        )}
      </Modal>

    </Screen>
  )
}
