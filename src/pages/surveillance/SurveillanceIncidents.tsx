import { useMemo, useState } from 'react'
import { ShieldAlert, Camera, Check, Download, Plus, Filter, Clock, AlertTriangle } from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, SeverityPill, Select, Tabs, EmptyState, InlineAlert, KeyValue, Modal, Divider } from '@/components/ui'
import { SyntheticCamera } from '@/components/feeds/SyntheticCamera'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, fmtDateTime, relTime, toCSV } from '@/lib/utils'
import { BarsTrend, Donut, PALETTE } from '@/components/charts'

export default function SurveillanceIncidents() {
  const s = useEngine()
  const [tab, setTab] = useState('all')
  const [severity, setSeverity] = useState('all')
  const [camera, setCamera] = useState('all')
  const [detail, setDetail] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [newType, setNewType] = useState<'motion' | 'interrupted' | 'restored' | 'unusual' | 'recording' | 'zone'>('motion')
  const [newCam, setNewCam] = useState(s.cameras[0]?.id ?? '')

  const filtered = useMemo(
    () =>
      s.surveillanceIncidents.filter((i) => {
        if (tab === 'open' && i.status !== 'open') return false
        if (tab === 'ack' && i.status !== 'acknowledged') return false
        if (tab === 'closed' && i.status !== 'closed') return false
        if (severity !== 'all' && i.severity !== severity) return false
        if (camera !== 'all' && i.cameraId !== camera) return false
        return true
      }),
    [s.surveillanceIncidents, tab, severity, camera],
  )

  const incident = s.surveillanceIncidents.find((i) => i.id === detail)

  const byType = useMemo(() => {
    const m = new Map<string, number>()
    s.surveillanceIncidents.forEach((i) => m.set(i.type, (m.get(i.type) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.surveillanceIncidents])

  const openCount = s.surveillanceIncidents.filter((i) => i.status === 'open').length
  const criticalCount = s.surveillanceIncidents.filter((i) => i.severity === 'critical').length

  const createIncident = () => {
    s.addSurveillanceIncident({
      cameraId: newCam,
      type: newType,
      severity: 'elevated',
      detail: `Operator-created simulated ${newType} event on ${newCam}.`,
      status: 'open',
    })
    setNewOpen(false)
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="SURVEILLANCE · INCIDENTS"
        title="Surveillance Incidents"
        subtitle="Simulated motion, tamper and restoration events with acknowledgement workflow."
        icon={ShieldAlert}
        meta={
          <>
            <span className="badge badge-red">{openCount} OPEN</span>
            <span className="badge badge-amber">{criticalCount} HIGH+</span>
            <span className="badge badge-grey">{s.surveillanceIncidents.length} TOTAL</span>
            <span className="badge badge-cyan">SYNTHETIC</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile(`shadow-surveillance-incidents-${Date.now()}.csv`, toCSV(s.surveillanceIncidents.map(({ id, cameraId, type, severity, status, detail, timestamp }) => ({ id, cameraId, type, severity, status, detail, timestamp }))), 'text/csv')}>
              <Download size={11} /> Export
            </button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setNewOpen(true)}><Plus size={11} /> Log incident</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Open" value={openCount} icon={ShieldAlert} accent="red" onClick={() => setTab('open')} />
        <StatCard label="Acknowledged" value={s.surveillanceIncidents.filter((i) => i.status === 'acknowledged').length} icon={Check} accent="amber" onClick={() => setTab('ack')} />
        <StatCard label="Closed" value={s.surveillanceIncidents.filter((i) => i.status === 'closed').length} icon={Check} accent="green" onClick={() => setTab('closed')} />
        <StatCard label="Critical" value={s.surveillanceIncidents.filter((i) => i.severity === 'critical').length} icon={AlertTriangle} accent="red" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
        <Panel title="Incident Log" icon={ShieldAlert} bodyClassName="p-0"
          actions={
            <div className="flex flex-wrap items-center gap-1.5">
              <Select className="w-24" value={severity} onChange={setSeverity} options={[{ value: 'all', label: 'All sev' }, { value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'elevated', label: 'Elevated' }, { value: 'low', label: 'Low' }]} />
              <Select className="w-32" value={camera} onChange={setCamera} options={[{ value: 'all', label: 'All cameras' }, ...s.cameras.map((c) => ({ value: c.id, label: c.id }))]} />
            </div>
          }
        >
          <Tabs size="sm" className="border-0 px-2 pt-2" value={tab} onChange={setTab}
            tabs={[{ id: 'all', label: 'All', count: s.surveillanceIncidents.length }, { id: 'open', label: 'Open' }, { id: 'ack', label: 'Acknowledged' }, { id: 'closed', label: 'Closed' }]}
          />
          <div className="max-h-[52vh] overflow-auto">
            <table className="data-table min-w-[640px]">
              <thead><tr><th>ID</th><th>Camera</th><th>Type</th><th>Severity</th><th>Detail</th><th>When</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id}>
                    <td className="mono text-[9.5px] text-[var(--accent)]">{i.id}</td>
                    <td className="mono text-[9.5px]">{i.cameraId}</td>
                    <td><span className="badge badge-grey">{i.type}</span></td>
                    <td><SeverityPill value={i.severity} /></td>
                    <td className="max-w-[220px] truncate text-[10.5px] text-ink-2">{i.detail}</td>
                    <td className="mono whitespace-nowrap text-[8.5px] text-ink-3">{relTime(i.timestamp)}</td>
                    <td><StatusPill value={i.status} dot={false} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button type="button" className="btn btn-sm !px-1.5" onClick={() => setDetail(i.id)}>view</button>
                        {i.status === 'open' && <button type="button" className="btn btn-sm !px-1.5" onClick={() => s.ackSurveillanceIncident(i.id)} title="Acknowledge"><Check size={9} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState icon={Filter} title="No incidents match" message="Loosen filters or log a new simulated incident." />}
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="By Type" icon={Filter}>
            <Donut
              data={byType.map(([name, value], i) => ({ name, value, color: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa'][i % 6] }))}
              height={160}
              centerLabel="EVENTS"
              centerValue={String(s.surveillanceIncidents.length)}
            />
          </Panel>
          <Panel title="Daily Volume" icon={Clock} subtitle="Generated incidents per day (sim)">
            <BarsTrend
              data={Array.from({ length: 7 }, (_, i) => ({ d: `D-${6 - i}`, n: 2 + ((i * 7 + 3) % 6) }))}
              keys={[{ key: 'n', color: PALETTE.amber, label: 'Incidents' }]}
              height={140}
              xKey="d"
            />
          </Panel>
          <Panel title="Workflow" icon={Check}>
            <ol className="space-y-1.5 text-[10.5px] text-ink-2">
              <li><span className="badge badge-red mr-1">1</span> Incident is generated with a fictional camera reference.</li>
              <li><span className="badge badge-amber mr-1">2</span> Operator opens the case and reviews the synthetic frame.</li>
              <li><span className="badge badge-green mr-1">3</span> Acknowledge marks the event as seen by the operator.</li>
              <li><span className="badge badge-grey mr-1">4</span> Closed incidents remain available for export.</li>
            </ol>
            <Divider />
            <KeyValue
              items={[
                { k: 'Open', v: String(openCount) },
                { k: 'Oldest open', v: s.surveillanceIncidents.filter((i) => i.status === 'open').length ? relTime(s.surveillanceIncidents.filter((i) => i.status === 'open')[0].timestamp) : '—' },
              ]}
            />
          </Panel>
        </div>
      </div>

      <InlineAlert tone="amber" title="Simulated detections">
        All incident records are generated by the simulation engine. No real motion, tamper or zone breach has occurred.
      </InlineAlert>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={incident ? `${incident.id} · ${incident.type}` : 'Incident'}
        subtitle={incident ? `${incident.cameraId} · ${fmtDateTime(incident.timestamp)}` : undefined}
        icon={ShieldAlert}
        size="lg"
        footer={incident ? (
          <>
            {incident.status === 'open' && <button type="button" className="btn" onClick={() => { s.ackSurveillanceIncident(incident.id); setDetail(null) }}><Check size={11} /> Acknowledge</button>}
            <button type="button" className="btn btn-primary" onClick={() => setDetail(null)}>Close</button>
          </>
        ) : null}
      >
        {incident && (
          <div className="space-y-3">
            <SyntheticCamera seed={incident.cameraId} className="aspect-video border border-line" moving={false} />
            <KeyValue
              items={[
                { k: 'Camera', v: incident.cameraId },
                { k: 'Type', v: incident.type.toUpperCase() },
                { k: 'Severity', v: incident.severity.toUpperCase() },
                { k: 'Status', v: incident.status.toUpperCase() },
                { k: 'Timestamp', v: fmtDateTime(incident.timestamp) },
                { k: 'Source', v: 'SYNTHETIC FEED' },
              ]}
            />
            <div>
              <p className="label-xs mb-1">DETAIL</p>
              <p className="text-[11px] leading-relaxed text-ink-2">{incident.detail}</p>
            </div>
            <InlineAlert tone="cyan" title="Synthetic frame">
              The frame above is rendered on demand from the incident's camera id and does not show any recorded footage.
            </InlineAlert>
          </div>
        )}
      </Modal>

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Log Simulated Incident"
        subtitle="Creates a fictional record for demonstration"
        icon={Plus}
        footer={<>
          <button type="button" className="btn" onClick={() => setNewOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={createIncident}><Plus size={11} /> Create</button>
        </>}
      >
        <div className="space-y-3">
          <Select label="Camera" value={newCam} onChange={setNewCam} options={s.cameras.map((c) => ({ value: c.id, label: `${c.id} · ${c.label}` }))} />
          <Select
            label="Event type"
            value={newType}
            onChange={(v) => setNewType(v as typeof newType)}
            options={[
              { value: 'motion', label: 'Motion detected' },
              { value: 'interrupted', label: 'Feed interrupted' },
              { value: 'restored', label: 'Feed restored' },
              { value: 'unusual', label: 'Unusual activity' },
              { value: 'recording', label: 'Recording anomaly' },
              { value: 'zone', label: 'Zone breach' },
            ]}
          />
          <div className="flex items-center gap-2 border border-line bg-bg p-2">
            <Camera size={14} className="text-ink-3" />
            <span className="font-mono text-[9.5px] text-ink-3">Record will be tagged SIMULATED and visible in the export.</span>
          </div>
          <div className={cn('grid grid-cols-3 gap-1', '')}>
            {s.cameras.slice(0, 3).map((c) => (
              <button key={c.id} type="button" onClick={() => setNewCam(c.id)} className={cn('border', newCam === c.id ? 'border-[var(--accent)]' : 'border-line')}>
                <SyntheticCamera seed={c.id} className="aspect-video" moving={false} scan={false} label={false} noise={false} />
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </Screen>
  )
}
