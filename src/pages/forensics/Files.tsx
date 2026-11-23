import { useMemo, useState } from 'react'
import {
  FileText, Search, Download, Upload, ScanLine, Hash, FolderOpen, HardDrive,
  FileArchive, FileImage, FileCode, FileSpreadsheet, Play, CircleCheck,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, EmptyState, InlineAlert, KeyValue, Divider, Tabs, Modal, Progress, Tag } from '@/components/ui'
import { Donut, PALETTE, BarsTrend } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { downloadFile, fmtCompact, fmtDateTime, toCSV } from '@/lib/utils'

function iconFor(mime: string) {
  if (mime.startsWith('image')) return FileImage
  if (mime.includes('zip') || mime.includes('tar')) return FileArchive
  if (mime.includes('json') || mime.includes('javascript') || mime.includes('sql')) return FileCode
  if (mime.includes('csv') || mime.includes('spreadsheet')) return FileSpreadsheet
  return FileText
}

export default function Files() {
  const s = useEngine()
  const [q, setQ] = useState('')
  const [mime, setMime] = useState('all')
  const [status, setStatus] = useState('all')
  const [selected, setSelected] = useState<string | null>(s.files[0]?.id ?? null)
  const [caseId, setCaseId] = useState('all')
  const [tab, setTab] = useState('files')
  const [intake, setIntake] = useState(false)
  const [intakeName, setIntakeName] = useState('')
  const [intakeSize, setIntakeSize] = useState(2048)
  const [busy, setBusy] = useState(false)
  const [analyzed, setAnalyzed] = useState<Record<string, boolean>>({})

  const mimes = useMemo(() => Array.from(new Set(s.files.map((f) => f.mime))), [s.files])

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return s.files.filter((f) => {
      if (t && !`${f.name} ${f.sha256} ${f.mime}`.toLowerCase().includes(t)) return false
      if (mime !== 'all' && f.mime !== mime) return false
      if (status !== 'all' && f.status !== status) return false
      return true
    })
  }, [s.files, q, mime, status])

  const file = s.files.find((f) => f.id === selected)
  const fileStatus = (f: { id: string; status: string }) => (analyzed[f.id] ? 'analyzed' : f.status)

  const mimeDist = useMemo(() => {
    const m = new Map<string, number>()
    s.files.forEach((f) => m.set(f.mime, (m.get(f.mime) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.files])

  const analyze = (id: string) => {
    setBusy(true)
    window.setTimeout(() => {
      setAnalyzed((prev) => ({ ...prev, [id]: true }))
      setBusy(false)
      s.notify({ type: 'success', title: 'Analysis complete', body: `Artefact ${id} processed (simulated)`, severity: 'low', module: 'forensics' })
    }, 900)
  }

  const createIntake = () => {
    if (!intakeName.trim()) return
    s.addFileAnalysis({
      name: intakeName,
      size: intakeSize * 1024,
      mime: 'application/octet-stream',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      sha256: Array.from({ length: 64 }, (_, i) => '0123456789abcdef'[(i * 7 + intakeName.length) % 16]).join(''),
      status: 'pending',
    })
    setIntake(false)
    setIntakeName('')
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="FORENSICS · ARTEFACTS"
        title="File Analyst"
        subtitle="Generated artefacts with simulated hashing and triage status. Uploads here never read a real file."
        icon={FolderOpen}
        meta={
          <>
            <span className="badge badge-cyan">{s.files.length} FILES</span>
            <span className="badge badge-green">{s.files.filter((f) => f.status === 'analyzed').length} ANALYSED</span>
            <span className="badge badge-amber">{s.files.filter((f) => f.status === 'pending').length} PENDING</span>
            <span className="badge badge-grey">{fmtCompact(s.files.reduce((a, f) => a + f.size, 0))} TOTAL</span>
          </>
        }
        actions={
          <>
            <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'files', label: 'Files' }, { id: 'cases', label: 'Lab cases' }]} />
            <button type="button" className="btn btn-sm" onClick={() => downloadFile(`shadow-files-${Date.now()}.csv`, toCSV(s.files.map(({ id, name, size, mime, sha256, status, created }) => ({ id, name, size, mime, sha256, status, created }))), 'text/csv')}><Download size={11} /> Export</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setIntake(true)}><Upload size={11} /> Add artefact</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Files" value={s.files.length} icon={FileText} accent="cyan" />
        <StatCard label="Analysed" value={s.files.filter((f) => f.status === 'analyzed').length} icon={CircleCheck} accent="green" />
        <StatCard label="Pending" value={s.files.filter((f) => f.status === 'pending').length} icon={ScanLine} accent="amber" />
        <StatCard label="Total size" value={fmtCompact(s.files.reduce((a, f) => a + f.size, 0))} icon={HardDrive} accent="blue" />
      </div>

      <Panel title="Filters" icon={Search}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <p className="label-xs mb-1">SEARCH</p>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filename, mime or hash…" className="field pl-7" />
            </div>
          </div>
          <div><p className="label-xs mb-1">TYPE</p><Select className="w-40" value={mime} onChange={setMime} options={[{ value: 'all', label: 'All types' }, ...mimes.map((m) => ({ value: m, label: m }))]} /></div>
          <div><p className="label-xs mb-1">STATUS</p><Select className="w-32" value={status} onChange={setStatus} options={[{ value: 'all', label: 'Any' }, { value: 'analyzed', label: 'Analyzed' }, { value: 'pending', label: 'Pending' }]} /></div>
          {tab === 'cases' && <div><p className="label-xs mb-1">LAB CASE</p><Select className="w-40" value={caseId} onChange={setCaseId} options={[{ value: 'all', label: 'All cases' }, ...s.forensicsCases.map((c) => ({ value: c.id, label: c.id }))]} /></div>}
          <button type="button" className="btn btn-sm" onClick={() => { setQ(''); setMime('all'); setStatus('all') }}>Reset</button>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {tab === 'files' ? (
            <Panel title="Artefact Register" icon={FileText} bodyClassName="p-0">
              <div className="max-h-[52vh] overflow-auto">
                <table className="data-table min-w-[780px]">
                  <thead><tr><th>File</th><th>Type</th><th>Size</th><th>SHA-256</th><th>Created</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {filtered.map((f) => {
                      const Icon = iconFor(f.mime)
                      return (
                        <tr key={f.id} className="cursor-pointer" onClick={() => setSelected(f.id)} data-selected={selected === f.id}>
                          <td className="mono text-[10px] text-ink">
                            <span className="flex items-center gap-1.5"><Icon size={10} className="shrink-0 text-ink-3" /> <span className="truncate">{f.name}</span></span>
                          </td>
                          <td className="text-[9px] text-ink-2">{f.mime}</td>
                          <td className="mono text-[9px]">{fmtCompact(f.size)}</td>
                          <td className="mono text-[8.5px] text-ink-3">{f.sha256.slice(0, 14)}…</td>
                          <td className="mono whitespace-nowrap text-[8.5px] text-ink-3">{fmtDateTime(f.created).split(' ')[0]}</td>
                          <td><StatusPill value={fileStatus(f) === 'analyzed' ? 'completed' : 'pending'} label={fileStatus(f).toUpperCase()} dot={false} /></td>
                          <td><button type="button" className="btn btn-sm !px-1.5" title="Run deep analysis" aria-label={`Analyse ${f.name}`} onClick={(e) => { e.stopPropagation(); analyze(f.id) }}><Play size={8} /></button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && <EmptyState icon={FileText} title="No artefacts match" />}
              </div>
              {busy && <div className="border-t border-line p-2"><Progress value={70} label="Analyzing artefact (simulated)" striped showValue /></div>}
            </Panel>
          ) : (
            <Panel title="Lab Cases" icon={FolderOpen} bodyClassName="p-0">
              <ul className="divide-y divide-line-soft">
                {s.forensicsCases.map((c) => (
                  <li key={c.id} className="px-2.5 py-2">
                    <div className="flex items-center justify-between">
                      <span className="mono text-[9px] text-[var(--accent)]">{c.id}</span>
                      <StatusPill value={c.status === 'complete' ? 'completed' : c.status === 'active' ? 'active' : 'pending'} label={c.status.toUpperCase()} dot={false} />
                    </div>
                    <p className="text-[10.5px] text-ink">{c.title}</p>
                    <p className="font-mono text-[8.5px] text-ink-3">{c.evidenceCount} artefacts · analyst {c.analyst} · opened {fmtDateTime(c.opened).split(' ')[0]}</p>
                    <Progress value={c.progress} height={2} className="mt-1" />
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Type Distribution" icon={FileText}>
              <Donut data={mimeDist.map(([name, value], i) => ({ name: name.split('/')[1] ?? name, value, color: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa'][i % 6] }))} height={180} centerLabel="FILES" centerValue={String(s.files.length)} />
            </Panel>
            <Panel title="Size by Artefact" icon={HardDrive}>
              <BarsTrend horizontal data={[...s.files].sort((a, b) => b.size - a.size).slice(0, 6).map((f) => ({ name: f.name.slice(0, 14), kb: Math.round(f.size / 1024) }))} keys={[{ key: 'kb', color: PALETTE.blue, label: 'KB' }]} height={180} xKey="name" />
            </Panel>
          </div>
        </div>

        <div className="space-y-3">
          {file ? (
            <Panel title={file.name} subtitle={file.id} icon={iconFor(file.mime)} actions={<StatusPill value={fileStatus(file) === 'analyzed' ? 'completed' : 'pending'} label={fileStatus(file).toUpperCase()} />}>
              <KeyValue
                cols={1}
                items={[
                  { k: 'MIME', v: file.mime },
                  { k: 'Size', v: `${fmtCompact(file.size)} (${file.size.toLocaleString()} B)` },
                  { k: 'Created', v: fmtDateTime(file.created) },
                  { k: 'Modified', v: fmtDateTime(file.modified) },
                  { k: 'Entropy', v: `${(6.2 + (file.size % 30) / 10).toFixed(2)} bits/byte (sim)` },
                  { k: 'Carved', v: fileStatus(file) === 'analyzed' ? 'YES' : 'PENDING' },
                ]}
              />
              <Divider label="SHA-256" />
              <p className="break-all font-mono text-[8.5px] leading-relaxed text-ink-3">{file.sha256}</p>
              <div className="mt-2 flex gap-1">
                <button type="button" className="btn btn-sm flex-1" onClick={() => analyze(file.id)}><ScanLine size={10} /> Analyse</button>
                <button type="button" className="btn btn-sm flex-1" onClick={() => navigator.clipboard?.writeText(file.sha256)}><Hash size={10} /> Copy hash</button>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1"><Tag tone="#28d8ea">SYNTHETIC FILE</Tag><Tag>{file.mime.split('/')[0].toUpperCase()}</Tag></div>
            </Panel>
          ) : <Panel title="Artefact"><EmptyState icon={FileText} title="Select an artefact" /></Panel>}

          <Panel title="Triage Policy" icon={ScanLine}>
            <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
              <li>• Artefacts are generated, never read from disk.</li>
              <li>• Hashes are illustrative strings, not real digests.</li>
              <li>• Adding an artefact only appends to in-memory state.</li>
              <li>• Exports are produced client-side.</li>
            </ul>
          </Panel>

          <Panel title="Chain of Custody" icon={FolderOpen}>
            <KeyValue
              items={[
                { k: 'Custodian', v: file ? `LAB-${file.id}` : '—' },
                { k: 'Storage', v: 'IN-MEMORY' },
                { k: 'Encryption', v: 'NONE (DEMO)' },
                { k: 'Verified', v: file && fileStatus(file) === 'analyzed' ? 'YES' : 'NO' },
              ]}
            />
          </Panel>
        </div>
      </div>

      <InlineAlert tone="amber" title="Synthetic files">
        No real file is uploaded, parsed or stored. Names, sizes and digests are generated for the demonstration only.
      </InlineAlert>

      <Modal open={intake} onClose={() => setIntake(false)} title="Add Synthetic Artefact" subtitle="Creates a demonstration file record — no upload occurs" icon={Upload}
        footer={<>
          <button type="button" className="btn" onClick={() => setIntake(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={createIntake} disabled={!intakeName.trim()}><Upload size={11} /> Register artefact</button>
        </>}
      >
        <div className="space-y-3">
          <div>
            <label className="field-label" htmlFor="f-name">Filename</label>
            <input id="f-name" value={intakeName} onChange={(e) => setIntakeName(e.target.value)} className="field" placeholder="e.g. ledger_dump_0912.csv" />
          </div>
          <div>
            <label className="field-label" htmlFor="f-size">Size (KB)</label>
            <input id="f-size" type="number" min={1} max={102400} value={intakeSize} onChange={(e) => setIntakeSize(Number(e.target.value))} className="field" />
          </div>
          <div className="flex items-start gap-2 border border-[#6d5320] bg-[#2a2110] p-2">
            <Upload size={13} className="mt-0.5 shrink-0 text-amber" />
            <p className="text-[10px] leading-relaxed text-[#ffd489]">
              This registers metadata only. SHADOW SYSTEMS does not read files from your device and does not transmit data
              anywhere.
            </p>
          </div>
        </div>
      </Modal>
    </Screen>
  )
}

