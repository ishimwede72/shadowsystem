import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen, FileText, Hash, Clock, Microscope, ArrowUpRight, ScanLine,
  ShieldCheck, HardDrive,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, SeverityPill, KeyValue, Progress, InlineAlert, Divider } from '@/components/ui'
import { Donut, PALETTE, AreaTrend, HeatStrip, ChartLegend } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, fmtCompact, relTime } from '@/lib/utils'

export default function ForensicsOverview() {
  const navigate = useNavigate()
  const s = useEngine()

  const active = s.forensicsCases.filter((c) => c.status === 'active' || c.status === 'analyzing')
  const totalBytes = s.files.reduce((a, f) => a + f.size, 0)

  const caseDist = useMemo(() => {
    const m = new Map<string, number>()
    s.forensicsCases.forEach((c) => m.set(c.status, (m.get(c.status) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.forensicsCases])

  const processing = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({ t: `${i}h`, artifacts: Math.round(12 + Math.abs(Math.sin(i / 2)) * 26), verified: Math.round(8 + Math.abs(Math.cos(i / 2.4)) * 18) })),
    [],
  )

  const mimeDist = useMemo(() => {
    const m = new Map<string, number>()
    s.files.forEach((f) => m.set(f.mime.split('/')[0], (m.get(f.mime.split('/')[0]) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.files])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="FORENSICS · OVERVIEW"
        title="Digital Forensics"
        subtitle="A fictional laboratory workspace for file triage, hashing, metadata review and timeline reconstruction."
        icon={Microscope}
        meta={
          <>
            <span className="badge badge-cyan">{s.forensicsCases.length} LAB CASES</span>
            <span className="badge badge-green">{active.length} ACTIVE</span>
            <span className="badge badge-grey">{s.files.length} FILES</span>
            <span className="badge badge-amber">SYNTHETIC ARTEFACTS</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => navigate('/forensics/hashes')}><Hash size={11} /> Hash lab</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/forensics/timeline')}><Clock size={11} /> Timeline</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Lab cases" value={s.forensicsCases.length} icon={FolderOpen} accent="cyan" onClick={() => navigate('/forensics/files')} />
        <StatCard label="Active" value={active.length} icon={ScanLine} accent="green" />
        <StatCard label="Files" value={s.files.length} icon={FileText} accent="blue" />
        <StatCard label="Analysed" value={s.files.filter((f) => f.status === 'analyzed').length} icon={ShieldCheck} accent="green" />
        <StatCard label="Timeline events" value={s.forensicTimeline.length} icon={Clock} accent="amber" onClick={() => navigate('/forensics/timeline')} />
        <StatCard label="Artifact volume" value={fmtCompact(totalBytes)} icon={HardDrive} accent="cyan" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Artifact Processing" icon={Microscope} className="lg:col-span-2" subtitle="Simulated extraction and verification">
          <AreaTrend
            data={processing}
            keys={[{ key: 'artifacts', color: PALETTE.cyan, label: 'Artifacts' }, { key: 'verified', color: PALETTE.green, label: 'Verified' }]}
            height={210}
          />
          <ChartLegend items={[{ label: 'Artifacts extracted', color: PALETTE.cyan }, { label: 'Hashes verified', color: PALETTE.green }]} />
        </Panel>
        <Panel title="Lab Case Status" icon={FolderOpen}>
          <Donut
            data={caseDist.map(([name, value], i) => ({ name, value, color: [PALETTE.cyan, PALETTE.amber, PALETTE.green, PALETTE.line][i % 4] }))}
            height={190}
            centerLabel="CASES"
            centerValue={String(s.forensicsCases.length)}
          />
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr]">
        <Panel title="Lab Case Board" icon={FolderOpen} bodyClassName="p-0"
          actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/forensics/files')}>Open files <ArrowUpRight size={10} /></button>}
        >
          <ul className="divide-y divide-line-soft">
            {s.forensicsCases.map((c) => (
              <li key={c.id} className="px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="mono block text-[8.5px] text-[var(--accent)]">{c.id}</span>
                    <span className="block truncate text-[10.5px] text-ink">{c.title}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <StatusPill value={c.status === 'complete' ? 'completed' : c.status === 'active' ? 'active' : c.status === 'analyzing' ? 'pending' : 'closed'} label={c.status.toUpperCase()} dot={false} />
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Progress value={c.progress} height={2} className="flex-1" color={c.status === 'complete' ? PALETTE.green : PALETTE.cyan} />
                  <span className="mono text-[8.5px] text-ink-3">{c.progress}%</span>
                  <span className="mono hidden text-[8.5px] text-ink-3 sm:block">{c.analyst}</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="space-y-3">
          <Panel title="Recent Artefacts" icon={FileText} bodyClassName="p-0">
            <ul className="max-h-[220px] divide-y divide-line-soft overflow-y-auto">
              {s.files.slice(0, 8).map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[10px] text-ink">{f.name}</span>
                    <span className="block truncate font-mono text-[8px] text-ink-3">{f.sha256.slice(0, 20)}…</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="mono text-[8px] text-ink-3">{fmtCompact(f.size)}</span>
                    <StatusPill value={f.status === 'analyzed' ? 'completed' : 'pending'} label={f.status.toUpperCase()} dot={false} />
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="File Types" icon={HardDrive}>
            <HeatStrip data={s.files.map((f) => f.size / 1024)} />
            <div className="mt-1 flex justify-between font-mono text-[8.5px] text-ink-3"><span>SMALL</span><span>LARGE</span></div>
            <Divider />
            <div className="grid grid-cols-2 gap-1">
              {mimeDist.map(([m, n], i) => (
                <span key={m} className="flex items-center justify-between">
                  <span className="flex items-center gap-1 font-mono text-[8.5px] uppercase text-ink-3">
                    <span className="h-1.5 w-1.5" style={{ background: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red][i % 5] }} />{m}
                  </span>
                  <span className="mono text-[9px] text-ink-2">{n}</span>
                </span>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Evidence Health" icon={ShieldCheck}>
          <KeyValue
            items={[
              { k: 'Forensic files', v: String(s.files.length) },
              { k: 'Hashes pending', v: String(s.files.filter((f) => f.status === 'pending').length) },
              { k: 'Timeline events', v: String(s.forensicTimeline.length) },
              { k: 'Critical events', v: String(s.forensicTimeline.filter((e) => e.severity === 'critical').length) },
              { k: 'Chain integrity', v: 'SIMULATED' },
              { k: 'Storage', v: 'IN-MEMORY' },
            ]}
          />
          <Divider />
          <div className="flex flex-wrap gap-1">
            <span className="badge badge-cyan">NO REAL FILES</span>
            <span className="badge badge-grey">NO DISK ACCESS</span>
            <span className="badge badge-amber">DEMO DATA</span>
          </div>
        </Panel>

        <Panel title="Latest Timeline Entries" icon={Clock} bodyClassName="p-0">
          <ul className="max-h-[240px] divide-y divide-line-soft overflow-y-auto">
            {[...s.forensicTimeline].sort((a, b) => +new Date(b.ts) - +new Date(a.ts)).slice(0, 8).map((e) => (
              <li key={e.id} className="flex items-center gap-2 px-2.5 py-1.5">
                <SeverityPill value={e.severity} />
                <span className="min-w-0 flex-1 truncate text-[10px] text-ink-2">{e.description}</span>
                <span className={cn('mono shrink-0 text-[8px] uppercase', e.severity === 'critical' ? 'text-red' : 'text-ink-3')}>{e.category}</span>
                <span className="shrink-0 font-mono text-[8px] text-ink-3">{relTime(e.ts)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <InlineAlert tone="amber" title="Fictional forensics">
        Every file, hash, timestamp and timeline event is generated in the browser. No real disk, image, device or evidence
        store is accessed.
      </InlineAlert>
    </Screen>
  )
}
