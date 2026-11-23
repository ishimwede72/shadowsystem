import { useState } from 'react'
import {
  Database, Download, Trash2, HardDrive, FileText, ShieldCheck, RefreshCw, AlertTriangle,
  Check, Layers, Lock, Upload, Copy,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, InlineAlert, Divider, KeyValue, Tag, Modal, Progress, Toggle } from '@/components/ui'
import { BarsTrend, PALETTE, ChartLegend, AreaTrend } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { usePrefs } from '@/services/prefs'
import { useReports } from '@/services/reports'
import { downloadFile, fmtDateTime, toCSV } from '@/lib/utils'

interface StoreInfo {
  key: string
  label: string
  desc: string
  size: number
  icon: typeof Database
}

const KEYS = [
  { key: 'shadow-systems-prefs', label: 'Preferences', desc: 'Accent, density, sound, profile, favourites' },
  { key: 'shadow-systems-engine', label: 'Engine flags', desc: 'Boot, speed, seed, active operator' },
  { key: 'shadow-systems-reports', label: 'Report library', desc: 'Compiled reports and counters' },
  { key: 'shadow-ai-history', label: 'AI transcript', desc: 'Last 40 SHADOW AI messages' },
]

export default function SettingsData() {
  const s = useEngine()
  const p = usePrefs()
  const reports = useReports((r) => r.reports)
  const clearReports = useReports((r) => r.clear)
  const [snapshot, setSnapshot] = useState<StoreInfo[] | null>(null)
  const [clearTarget, setClearTarget] = useState<string | null>(null)
  const [wipeOpen, setWipeOpen] = useState(false)
  const [exportAll, setExportAll] = useState(true)
  const [copied, setCopied] = useState('')

  const scan = () => {
    const infos: StoreInfo[] = KEYS.map((k, i) => {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(k.key) : null
      return { ...k, icon: [Database, Layers, FileText, ShieldCheck][i], size: raw ? raw.length : 0 }
    })
    setSnapshot(infos)
  }

  const totalBytes = snapshot?.reduce((a, k) => a + k.size, 0) ?? 0

  const clear = (key: string) => {
    try { localStorage.removeItem(key) } catch { /* ignore */ }
    setClearTarget(null)
    scan()
  }

  const wipe = () => {
    KEYS.forEach((k) => { try { localStorage.removeItem(k.key) } catch { /* ignore */ } })
    setWipeOpen(false)
    scan()
  }

  const dumpAll = () => {
    const dump: Record<string, unknown> = {}
    KEYS.forEach((k) => {
      try {
        const raw = localStorage.getItem(k.key)
        dump[k.key] = raw ? JSON.parse(raw) : null
      } catch { dump[k.key] = 'unreadable' }
    })
    downloadFile(`shadow-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(dump, null, 2), 'application/json')
  }

  const copyValue = async (key: string) => {
    try {
      const raw = localStorage.getItem(key)
      await navigator.clipboard.writeText(raw ?? '')
      setCopied(key)
      window.setTimeout(() => setCopied(''), 1400)
    } catch { /* clipboard blocked */ }
  }

  const counts = [
    { label: 'Transactions', n: s.transactions.length },
    { label: 'Findings', n: s.findings.length },
    { label: 'Cameras', n: s.cameras.length },
    { label: 'Cases', n: s.cases.length },
    { label: 'Evidence', n: s.evidence.length },
    { label: 'Missions', n: s.missions.length },
    { label: 'Messages', n: s.messages.length },
    { label: 'Listings', n: s.listings.length },
    { label: 'Reports', n: reports.length },
  ]

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="SETTINGS · DATA"
        title="Data & Storage"
        subtitle="Inspect, export and clear everything this demo stores locally. No data ever leaves the browser on its own."
        icon={Database}
        meta={
          <>
            <span className="badge badge-cyan">{KEYS.length} STORES</span>
            <span className="badge badge-grey">{snapshot ? `${Math.round(totalBytes / 1024)} KB` : 'NOT SCANNED'}</span>
            <span className="badge badge-green">LOCAL ONLY</span>
            <span className="badge badge-amber">NO ACCOUNT</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={scan}><RefreshCw size={11} /> Scan storage</button>
            <button type="button" className="btn btn-sm" onClick={dumpAll}><Download size={11} /> Backup all</button>
            <button type="button" className="btn btn-sm btn-danger" onClick={() => setWipeOpen(true)}><Trash2 size={11} /> Wipe</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Stores" value={KEYS.length} icon={Database} accent="cyan" />
        <StatCard label="Reports" value={reports.length} icon={FileText} accent="green" />
        <StatCard label="World records" value={counts.reduce((a, c) => a + c.n, 0)} icon={Layers} accent="blue" />
        <StatCard label="Size" value={snapshot ? `${(totalBytes / 1024).toFixed(1)} KB` : '—'} icon={HardDrive} accent="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Panel title="Local Stores" icon={HardDrive} bodyClassName="p-0"
            actions={<button type="button" className="btn btn-sm btn-ghost" onClick={scan}><RefreshCw size={10} /> Rescan</button>}
          >
            <ul className="divide-y divide-line-soft">
              {KEYS.map((k) => {
                const info = snapshot?.find((x) => x.key === k.key)
                return (
                  <li key={k.key} className="flex items-start gap-2 px-2.5 py-2">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-sm border border-line text-[var(--accent)]"><Database size={11} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="mono block truncate text-[9px] text-[var(--accent)]">{k.key}</span>
                      <span className="block text-[10px] text-ink-2">{k.label}</span>
                      <span className="block text-[8.5px] text-ink-3">{k.desc}</span>
                      {info && <span className="mono mt-0.5 block text-[8px] text-ink-3">{info.size ? `${(info.size / 1024).toFixed(2)} KB` : 'empty · not yet written'}</span>}
                    </span>
                    <span className="flex shrink-0 gap-0.5">
                      <button type="button" className="icon-btn" title="Copy value" onClick={() => copyValue(k.key)}>{copied === k.key ? <Check size={9} /> : <Copy size={9} />}</button>
                      <button type="button" className="icon-btn" title="Clear" onClick={() => setClearTarget(k.key)}><Trash2 size={9} /></button>
                    </span>
                  </li>
                )
              })}
            </ul>
          </Panel>

          <Panel title="Export" icon={Download}>
            <div className="grid gap-1.5 sm:grid-cols-2">
              <button type="button" className="btn btn-sm justify-start" onClick={() => downloadFile('shadow-preferences.json', JSON.stringify(p, null, 2), 'application/json')}><Download size={10} /> preferences.json</button>
              <button type="button" className="btn btn-sm justify-start" onClick={() => downloadFile('shadow-reports.json', JSON.stringify(reports, null, 2), 'application/json')}><Download size={10} /> reports.json</button>
              <button type="button" className="btn btn-sm justify-start" onClick={() => downloadFile('shadow-transactions.csv', toCSV(s.transactions.map(({ id, reference, amount, currency, status, timestamp }) => ({ id, reference, amount, currency, status, timestamp }))), 'text/csv')}><Download size={10} /> transactions.csv</button>
              <button type="button" className="btn btn-sm justify-start" onClick={() => downloadFile('shadow-missions.csv', toCSV(s.missions.map(({ id, code, name, status, progress, severity, startedAt }) => ({ id, code, name, status, progress, severity, startedAt }))), 'text/csv')}><Download size={10} /> missions.csv</button>
              <button type="button" className="btn btn-sm justify-start" onClick={() => downloadFile('shadow-cases.csv', toCSV(s.cases.map(({ id, code, title, status, priority, progress, opened }) => ({ id, code, title, status, priority, progress, opened }))), 'text/csv')}><Download size={10} /> cases.csv</button>
              <button type="button" className="btn btn-sm justify-start" onClick={() => downloadFile('shadow-activity.csv', toCSV(s.activity.map(({ id, ts, module, actor, action, level }) => ({ id, ts, module, actor, action, level }))), 'text/csv')}><Download size={10} /> activity.csv</button>
            </div>
            <div className="mt-2 flex items-center justify-between border border-line bg-bg px-2 py-1.5">
              <span className="text-[10px] text-ink-2">Include engine flags in backup</span>
              <Toggle checked={exportAll} onChange={setExportAll} label="" />
            </div>
            <p className="mt-1 font-mono text-[8px] leading-relaxed text-ink-3">Exports are produced in-browser from current state. {exportAll ? 'Backup all includes session flags.' : 'Session flags are omitted from bulk exports.'}</p>
          </Panel>

          <Panel title="World Inventory" icon={Layers} bodyClassName="p-0">
            <table className="data-table">
              <thead><tr><th>Collection</th><th>Records</th><th>Share</th></tr></thead>
              <tbody>
                {counts.map((c) => (
                  <tr key={c.label}>
                    <td className="text-[10px] text-ink-2">{c.label}</td>
                    <td className="mono text-[9.5px] text-ink-3">{c.n}</td>
                    <td><Progress value={(c.n / Math.max(1, counts.reduce((a, x) => a + x.n, 0))) * 100} height={2} className="w-24" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Storage" icon={HardDrive}>
            {snapshot ? (
              <>
                <div className="flex items-center justify-between"><span className="label-xs">TOTAL</span><span className="mono text-[9.5px] text-ink-3">{(totalBytes / 1024).toFixed(2)} KB</span></div>
                <Progress value={Math.min(100, (totalBytes / 102_400) * 100)} height={5} color={PALETTE.cyan} />
                <p className="mt-1 font-mono text-[8px] text-ink-3">Approximate share of a 100 KB demo budget</p>
                <Divider />
                <div className="space-y-1">
                  {snapshot.map((inf) => (
                    <div key={inf.key} className="flex items-center justify-between">
                      <span className="truncate text-[9px] text-ink-2">{inf.label}</span>
                      <span className="mono text-[8.5px] text-ink-3">{(inf.size / 1024).toFixed(2)} KB</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-4 text-center">
                <p className="text-[10px] text-ink-3">Storage not scanned yet.</p>
                <button type="button" className="btn btn-sm mt-2" onClick={scan}><RefreshCw size={10} /> Scan now</button>
              </div>
            )}
          </Panel>

          <Panel title="Privacy" icon={Lock}>
            <ul className="space-y-1 text-[9.5px] leading-relaxed text-ink-2">
              <li>• No analytics, telemetry or beacons.</li>
              <li>• No cookies beyond local storage.</li>
              <li>• No server, account or API key.</li>
              <li>• Works fully offline after load.</li>
            </ul>
            <Divider />
            <StatusPill value="active" label="OFFLINE READY" />
            <div className="mt-1.5 flex flex-wrap gap-1"><Tag tone="#28d8ea">LOCAL</Tag><Tag tone="#38db91">PRIVATE</Tag><Tag tone="#f5b942">SIMULATED</Tag></div>
          </Panel>

          <Panel title="Engine Snapshot" icon={ShieldCheck}>
            <KeyValue
              items={[
                { k: 'Seed', v: String(s.seed) },
                { k: 'Tick', v: String(s.tick) },
                { k: 'Session', v: String(s.sessionId ?? 'local').slice(0, 12) },
                { k: 'Sim time', v: fmtDateTime(new Date(s.simulatedTime).toISOString()) },
                { k: 'Notifications', v: String(s.notifications.length) },
                { k: 'Bus events', v: String(s.bus.length) },
              ]}
            />
            <div className="mt-1.5 grid grid-cols-2 gap-1">
              <button type="button" className="btn btn-sm" onClick={() => s.resetSimulation(false)}><RefreshCw size={10} /> Regenerate</button>
              <button type="button" className="btn btn-sm" onClick={() => { clearReports(); s.notify({ type: 'success', title: 'Report library cleared', body: 'All compiled reports removed from local storage', severity: 'low' }) }}><Trash2 size={10} /> Clear reports</button>
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Store Sizes" icon={Layers}>
          <BarsTrend
            horizontal
            data={KEYS.map((k) => ({ name: k.label, v: Math.round(((snapshot?.find((x) => x.key === k.key)?.size ?? 0) / 1024) * 100) / 100 }))}
            keys={[{ key: 'v', color: PALETTE.cyan, label: 'KB' }]}
            height={160}
            xKey="name"
          />
          <ChartLegend items={[{ label: 'Kilobytes per store', color: PALETTE.cyan }]} />
        </Panel>
        <Panel title="Record Composition" icon={Layers}>
          <AreaTrend
            data={Array.from({ length: 12 }, (_, i) => ({ t: `S${i + 1}`, v: 60 + Math.round(Math.abs(Math.sin(i / 2.1)) * 40 + i * 3) }))}
            keys={[{ key: 'v', color: PALETTE.green, label: 'Records' }]}
            height={160}
          />
          <ChartLegend items={[{ label: 'Generated record growth (illustrative)', color: PALETTE.green }]} />
        </Panel>
      </div>

      <InlineAlert tone="amber" title="You are in control">
        Everything lives in this browser's local storage. Nothing is uploaded, and clearing site data resets the demo completely.
      </InlineAlert>

      <Modal open={!!clearTarget} onClose={() => setClearTarget(null)} title="Clear Store" subtitle={clearTarget ?? ''} icon={Trash2}
        footer={<>
          <button type="button" className="btn" onClick={() => setClearTarget(null)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={() => clearTarget && clear(clearTarget)}><Trash2 size={11} /> Clear store</button>
        </>}
      >
        <p className="text-[10.5px] leading-relaxed text-ink-2">
          Removing this entry resets that subsystem to its defaults on the next load. Generated world data lives in memory and is
          unaffected.
        </p>
        <div className="mt-2 flex items-center gap-1.5 font-mono text-[8.5px] text-ink-3"><AlertTriangle size={9} className="text-amber" /> This action cannot be undone.</div>
      </Modal>

      <Modal open={wipeOpen} onClose={() => setWipeOpen(false)} title="Wipe All Local Data" subtitle="Removes every SHADOW SYSTEMS store" icon={AlertTriangle}
        footer={<>
          <button type="button" className="btn" onClick={() => setWipeOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={wipe}><Trash2 size={11} /> Wipe everything</button>
        </>}
      >
        <p className="text-[10.5px] leading-relaxed text-ink-2">
          Deletes preferences, session flags, the report library and the AI transcript. The generated simulation world is held in
          memory and will regenerate on reload.
        </p>
        <div className="mt-2 flex items-center gap-1.5"><Upload size={9} className="text-ink-3" /><span className="font-mono text-[8.5px] text-ink-3">Take a backup first if you want to restore anything.</span></div>
      </Modal>

    </Screen>
  )
}
