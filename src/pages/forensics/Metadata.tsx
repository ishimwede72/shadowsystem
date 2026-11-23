import { useMemo, useState } from 'react'
import {
  Tags, FileText, Search, Download, Eye, EyeOff, ShieldAlert, Copy, Check,
  MapPin, Clock, Cpu, Binary,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, EmptyState, InlineAlert, KeyValue, Divider, Tabs, Tag, Progress } from '@/components/ui'
import { Doc } from '@/components/ui/extras'
import { useEngine } from '@/services/engine'
import { downloadFile, fmtDateTime } from '@/lib/utils'

export default function Metadata() {
  const s = useEngine()
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<string | null>(s.files[0]?.id ?? null)
  const [reveal, setReveal] = useState(false)
  const [tab, setTab] = useState('fields')
  const [copied, setCopied] = useState(false)

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return s.files.filter((f) => !t || `${f.name} ${f.mime} ${f.sha256}`.toLowerCase().includes(t))
  }, [s.files, q])

  const file = s.files.find((f) => f.id === selected)

  const meta = useMemo(() => {
    if (!file) return null
    const seed = file.name.length + file.size
    return [
      { group: 'Identification', fields: [
        { k: 'File name', v: file.name },
        { k: 'Artefact ID', v: file.id },
        { k: 'MIME type', v: file.mime },
        { k: 'Size', v: `${file.size.toLocaleString()} bytes` },
      ]},
      { group: 'Timestamps', fields: [
        { k: 'Created (sim)', v: fmtDateTime(file.created) },
        { k: 'Modified (sim)', v: fmtDateTime(file.modified) },
        { k: 'Accessed (sim)', v: fmtDateTime(new Date(+new Date(file.modified) + 3_600_000)) },
      ]},
      { group: 'Technical', fields: [
        { k: 'Entropy', v: `${(6.1 + (seed % 28) / 10).toFixed(2)} bits/byte` },
        { k: 'Encoding', v: seed % 3 === 0 ? 'UTF-8' : seed % 3 === 1 ? 'Binary' : 'UTF-16LE' },
        { k: 'Compressed', v: seed % 2 === 0 ? 'No' : 'Deflate (sim)' },
        { k: 'Pages', v: String(1 + (seed % 40)) },
      ]},
      { group: 'Provenance', fields: [
        { k: 'Source', v: 'SIMULATED COLLECTION' },
        { k: 'Custodian', v: `LAB-${file.id}` },
        { k: 'Location', v: 'IN-MEMORY' },
        { k: 'Consent', v: 'NOT APPLICABLE (FICTION)' },
      ]},
    ]
  }, [file])

  const exifLike = useMemo(() => {
    if (!file) return []
    const seed = file.name.length
    return [
      { k: 'Device (fictional)', v: seed % 2 === 0 ? 'NORDVIK CAM-4' : 'HALCYON SCAN-2' },
      { k: 'Artist', v: 'SHADOW SYSTEMS DEMO' },
      { k: 'GPS', v: reveal ? '51.5074° N, 0.1278° W (simulated)' : '••••••••••' },
      { k: 'Colour space', v: 'sRGB' },
      { k: 'Orientation', v: 'Normal' },
      { k: 'Software', v: 'SYNTH-RENDER 2.1' },
    ]
  }, [file, reveal])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="FORENSICS · METADATA"
        title="Metadata Inspector"
        subtitle="Generated metadata fields for fictional artefacts, with a privacy toggle for location-style fields."
        icon={Tags}
        meta={
          <>
            <span className="badge badge-cyan">{s.files.length} ARTEFACTS</span>
            <span className="badge badge-grey">{filtered.length} SHOWN</span>
            <span className="badge badge-amber">SIMULATED EXIF</span>
          </>
        }
        actions={
          file ? (
            <button type="button" className="btn btn-sm" onClick={() => downloadFile(`${file.id}-metadata.json`, JSON.stringify({ file: { id: file.id, name: file.name, mime: file.mime, size: file.size, sha256: file.sha256 }, metadata: meta, exif: exifLike, disclaimer: 'SIMULATED METADATA' }, null, 2), 'application/json')}><Download size={11} /> Export JSON</button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Artefacts" value={s.files.length} icon={FileText} accent="cyan" />
        <StatCard label="Fields exposed" value={meta ? meta.reduce((a, g) => a + g.fields.length, 0) : 0} icon={Tags} accent="green" />
        <StatCard label="Location masked" value={reveal ? 'NO' : 'YES'} icon={MapPin} accent={reveal ? 'red' : 'amber'} />
        <StatCard label="Source" value="SYNTHETIC" icon={Binary} accent="blue" />
      </div>

      <Panel title="Artefact Search" icon={Search}>
        <div className="relative max-w-md">
          <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filename, mime or hash…" className="field pl-7" />
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[300px_1fr]">
        <Panel title="Artefacts" icon={FileText} bodyClassName="p-0" actions={<span className="badge badge-grey">{filtered.length}</span>}>
          <ul className="max-h-[58vh] divide-y divide-line-soft overflow-y-auto">
            {filtered.map((f) => (
              <li key={f.id}>
                <button type="button" onClick={() => setSelected(f.id)} data-selected={selected === f.id} className="w-full px-2.5 py-1.5 text-left hover:bg-elevated">
                  <span className="block truncate font-mono text-[10px] text-ink">{f.name}</span>
                  <span className="block truncate font-mono text-[8px] text-ink-3">{f.mime} · {f.size.toLocaleString()} B</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        {file && meta ? (
          <div className="space-y-3">
            <Panel title={file.name} subtitle={file.id} icon={Tags} actions={<StatusPill value={file.status === 'analyzed' ? 'completed' : 'pending'} label={file.status.toUpperCase()} />}>
              <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'fields', label: 'Fields' }, { id: 'exif', label: 'EXIF-like' }, { id: 'raw', label: 'Raw' }]} />
              {tab === 'fields' && (
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {meta.map((g) => (
                    <div key={g.group}>
                      <p className="label-xs mb-1">{g.group.toUpperCase()}</p>
                      <KeyValue cols={1} items={g.fields} />
                    </div>
                  ))}
                </div>
              )}
              {tab === 'exif' && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between border border-line bg-bg p-2">
                    <span className="flex items-center gap-1.5 text-[10px] text-ink-2">
                      {reveal ? <Eye size={11} /> : <EyeOff size={11} />} Location-style fields
                    </span>
                    <button type="button" className="btn btn-sm" onClick={() => setReveal((r) => !r)}>{reveal ? 'Mask again' : 'Reveal (simulated)'}</button>
                  </div>
                  <KeyValue items={exifLike} />
                  <InlineAlert tone="amber" title="Privacy by default">
                    Location-style fields are masked until you reveal them. All values are invented and never derived from a
                    real photo or device.
                  </InlineAlert>
                </div>
              )}
              {tab === 'raw' && (
                <div className="mt-2">
                  <Doc label="METADATA JSON">{JSON.stringify({ file: { id: file.id, name: file.name, mime: file.mime, size: file.size, sha256: file.sha256 }, metadata: meta, exif: exifLike, disclaimer: 'SIMULATED — not derived from any real file' }, null, 2)}</Doc>
                  <div className="mt-1.5 flex gap-1">
                    <button type="button" className="btn btn-sm" onClick={() => { navigator.clipboard?.writeText(JSON.stringify({ meta, exifLike }, null, 2)); setCopied(true); window.setTimeout(() => setCopied(false), 1400) }}>
                      {copied ? <Check size={10} className="text-green" /> : <Copy size={10} />} Copy JSON
                    </button>
                  </div>
                </div>
              )}
            </Panel>

            <div className="grid gap-3 lg:grid-cols-2">
              <Panel title="Field Completeness" icon={Tags}>
                <div className="space-y-1.5">
                  {meta.map((g, i) => (
                    <div key={g.group}>
                      <div className="flex justify-between">
                        <span className="text-[10px] text-ink-2">{g.group}</span>
                        <span className="mono text-[9px] text-ink-3">{g.fields.length}/{g.fields.length}</span>
                      </div>
                      <Progress value={100} height={2} color={['#28d8ea', '#38db91', '#377eff', '#f5b942'][i % 4]} />
                    </div>
                  ))}
                </div>
                <Divider />
                <div className="flex flex-wrap gap-1"><Tag tone="#28d8ea">GENERATED</Tag><Tag tone="#f5b942">EXIF MASKED</Tag></div>
              </Panel>
              <Panel title="Observations" icon={ShieldAlert}>
                <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
                  <li className="flex gap-1.5"><Clock size={10} className="mt-0.5 shrink-0 text-ink-3" /> Timestamps are offset from the generated artefact time.</li>
                  <li className="flex gap-1.5"><Cpu size={10} className="mt-0.5 shrink-0 text-ink-3" /> Technical fields are derived deterministically from the file name.</li>
                  <li className="flex gap-1.5"><MapPin size={10} className="mt-0.5 shrink-0 text-ink-3" /> Location fields are fictional and masked by default.</li>
                </ul>
                <Divider />
                <KeyValue items={[{ k: 'Artefact', v: file.id }, { k: 'MIME', v: file.mime }, { k: 'Size', v: `${file.size.toLocaleString()} B` }]} />
              </Panel>
            </div>
          </div>
        ) : (
          <Panel title="Metadata"><EmptyState icon={Tags} title="Select an artefact" message="Choose a file from the list to inspect its generated metadata." /></Panel>
        )}
      </div>

      <Panel title="Metadata Coverage" icon={Tags} bodyClassName="p-0">
        <div className="max-h-[34vh] overflow-auto">
          <table className="data-table min-w-[680px]">
            <thead><tr><th>Artefact</th><th>MIME</th><th>Encoding</th><th>Entropy</th><th>GPS field</th><th>Status</th></tr></thead>
            <tbody>
              {s.files.map((f) => (
                <tr key={f.id} className="cursor-pointer" onClick={() => setSelected(f.id)} data-selected={selected === f.id}>
                  <td className="mono text-[9.5px] text-[var(--accent)]">{f.name}</td>
                  <td className="text-[9px] text-ink-2">{f.mime}</td>
                  <td className="mono text-[9px]">{f.size % 3 === 0 ? 'UTF-8' : f.size % 3 === 1 ? 'Binary' : 'UTF-16LE'}</td>
                  <td className="mono text-[9px]">{(6.1 + (f.size % 28) / 10).toFixed(2)}</td>
                  <td className="mono text-[9px] text-ink-3">MASKED</td>
                  <td><StatusPill value={f.status === 'analyzed' ? 'completed' : 'pending'} label={f.status.toUpperCase()} dot={false} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <InlineAlert tone="amber" title="Fictional metadata">
        Field values are generated from the artefact's properties. Nothing is extracted from a real document, image or media
        file.
      </InlineAlert>
    </Screen>
  )
}

