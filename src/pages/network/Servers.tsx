import { useMemo, useState } from 'react'
import { Server, Search, Download, Terminal, Power, RefreshCw, Cpu, HardDrive, ShieldCheck, Activity } from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, EmptyState, InlineAlert, KeyValue, Divider, Progress, Modal, Tabs } from '@/components/ui'
import { BarsTrend, Donut, PALETTE } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, toCSV } from '@/lib/utils'

export default function Servers() {
  const s = useEngine()
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<string | null>(s.networkNodes.find((n) => n.type === 'SERVER')?.id ?? null)
  const [logOpen, setLogOpen] = useState(false)
  const [tab, setTab] = useState('resources')

  const roles = useMemo(() => Array.from(new Set(s.networkNodes.map((n) => n.type))), [s.networkNodes])
  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return s.networkNodes.filter((n) => {
      if (role !== 'all' && n.type !== role) return false
      if (status !== 'all' && n.status !== status) return false
      if (t && !`${n.hostname} ${n.label} ${n.ip} ${n.zone}`.toLowerCase().includes(t)) return false
      return true
    })
  }, [s.networkNodes, role, status, q])

  const node = s.networkNodes.find((n) => n.id === selected)

  const logs = useMemo(() => {
    if (!node) return []
    const seed = node.hostname.charCodeAt(0) + node.hostname.length
    return Array.from({ length: 18 }, (_, i) => {
      const kinds = ['systemd', 'kernel', 'ntpd', 'sshd', 'agent']
      const msgs = [
        'session accepted (simulated)',
        'clock synchronised to sim-clock',
        'health probe passed',
        'memory cache flushed',
        'synthetic workload dispatched',
        'telemetry batch emitted',
      ]
      return {
        ts: `2026-11-23T${String(7 + Math.floor(i / 6)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}:${String((i * 29) % 60).padStart(2, '0')}Z`,
        daemon: kinds[(seed + i) % kinds.length],
        msg: msgs[(seed + i * 3) % msgs.length],
        level: (seed + i) % 11 === 0 ? 'warn' : 'info',
      }
    })
  }, [node])

  const typeDist = useMemo(() => {
    const m = new Map<string, number>()
    s.networkNodes.forEach((n) => m.set(n.type, (m.get(n.type) ?? 0) + 1))
    return Array.from(m.entries())
  }, [s.networkNodes])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="NETWORK · ASSETS"
        title="Servers & Nodes"
        subtitle="Fictional host inventory with simulated resource pressure and status controls."
        icon={Server}
        meta={
          <>
            <span className="badge badge-cyan">{s.networkNodes.length} HOSTS</span>
            <span className="badge badge-green">{s.networkNodes.filter((n) => n.status === 'online').length} ONLINE</span>
            <span className="badge badge-amber">{s.networkNodes.filter((n) => n.status === 'degraded').length} DEGRADED</span>
            <span className="badge badge-red">{s.networkNodes.filter((n) => n.status === 'offline').length} OFFLINE</span>
          </>
        }
        actions={
          <button type="button" className="btn btn-sm" onClick={() => downloadFile(`shadow-hosts-${Date.now()}.csv`, toCSV(s.networkNodes.map(({ id, hostname, type, zone, ip, status, cpu, memory, disk, uptime }) => ({ id, hostname, type, zone, ip, status, cpu, memory, disk, uptime }))), 'text/csv')}><Download size={11} /> Export inventory</button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Hosts" value={s.networkNodes.length} icon={Server} accent="cyan" />
        <StatCard label="Avg CPU" value={`${(s.networkNodes.reduce((a, n) => a + n.cpu, 0) / Math.max(1, s.networkNodes.length)).toFixed(0)}%`} icon={Cpu} accent="green" />
        <StatCard label="Avg disk" value={`${(s.networkNodes.reduce((a, n) => a + n.disk, 0) / Math.max(1, s.networkNodes.length)).toFixed(0)}%`} icon={HardDrive} accent="amber" />
        <StatCard label="Firewalls" value={s.networkNodes.filter((n) => n.type === 'FIREWALL').length} icon={ShieldCheck} accent="blue" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Panel title="Host Inventory" icon={Server} bodyClassName="p-0"
            actions={
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <Search size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-ink-3" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search host…" className="field h-6 w-32 pl-6 text-[10px]" />
                </div>
                <Select className="w-24" value={role} onChange={setRole} options={[{ value: 'all', label: 'All types' }, ...roles.map((r) => ({ value: r, label: r }))]} />
                <Select className="w-24" value={status} onChange={setStatus} options={[{ value: 'all', label: 'Any state' }, { value: 'online', label: 'Online' }, { value: 'degraded', label: 'Degraded' }, { value: 'offline', label: 'Offline' }]} />
              </div>
            }
          >
            <div className="max-h-[52vh] overflow-auto">
              <table className="data-table min-w-[760px]">
                <thead><tr><th>Host</th><th>Type</th><th>Zone</th><th>IP</th><th>CPU</th><th>MEM</th><th>DISK</th><th>Uptime</th><th>Status</th></tr></thead>
                <tbody>
                  {filtered.map((n) => (
                    <tr key={n.id} className="cursor-pointer" onClick={() => setSelected(n.id)} data-selected={selected === n.id}>
                      <td className="mono text-[10px] text-[var(--accent)]">{n.hostname}</td>
                      <td className="text-[9.5px] text-ink-2">{n.type}</td>
                      <td className="text-[9.5px]">{n.zone}</td>
                      <td className="mono text-[9px] text-ink-3">{n.ip}</td>
                      <td className={cn('mono text-[9px]', n.cpu > 80 ? 'text-red' : 'text-ink-2')}>{n.cpu}%</td>
                      <td className="mono text-[9px] text-ink-2">{n.memory}%</td>
                      <td className="mono text-[9px] text-ink-2">{n.disk}%</td>
                      <td className="mono text-[9px] text-ink-3">{n.uptime}</td>
                      <td><StatusPill value={n.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <EmptyState icon={Server} title="No hosts match" />}
            </div>
          </Panel>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="CPU by Host" icon={Cpu} subtitle="Top consumers">
              <BarsTrend horizontal data={[...s.networkNodes].sort((a, b) => b.cpu - a.cpu).slice(0, 7).map((n) => ({ name: n.hostname.slice(0, 12), cpu: n.cpu }))} keys={[{ key: 'cpu', color: PALETTE.cyan, label: 'CPU %' }]} height={180} xKey="name" />
            </Panel>
            <Panel title="Type Mix" icon={Server}>
              <Donut data={typeDist.map(([name, value], i) => ({ name, value, color: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red, '#a78bfa', PALETTE.ink][i % 7] }))} height={180} centerLabel="HOSTS" centerValue={String(s.networkNodes.length)} />
            </Panel>
          </div>
        </div>

        <div className="space-y-3">
          {node ? (
            <>
              <Panel title={node.hostname} subtitle={`${node.id} · ${node.label}`} icon={Server} actions={<StatusPill value={node.status} />}>
                <KeyValue
                  cols={1}
                  items={[
                    { k: 'Type', v: node.type },
                    { k: 'Zone', v: node.zone },
                    { k: 'Address', v: node.ip },
                    { k: 'OS', v: node.os ?? 'EMBEDDED' },
                    { k: 'Uptime', v: node.uptime },
                    { k: 'Latency', v: `${node.latency} ms` },
                  ]}
                />
                <Divider label="RESOURCES" />
                {[['CPU', node.cpu, PALETTE.cyan], ['MEM', node.memory, PALETTE.green], ['DISK', node.disk, PALETTE.amber]].map(([label, v, col]) => (
                  <div key={String(label)} className="mb-1.5">
                    <div className="flex justify-between"><span className="label-xs">{String(label)}</span><span className="mono text-[9px] text-ink-2">{String(v)}%</span></div>
                    <Progress value={Number(v)} height={3} color={String(col)} />
                  </div>
                ))}
                <div className="mt-2 flex flex-wrap gap-1">
                  <button type="button" className="btn btn-sm flex-1" onClick={() => s.updateNetworkNode(node.id, { status: node.status === 'offline' ? 'online' : 'offline' })}>
                    <Power size={10} /> {node.status === 'offline' ? 'Power on' : 'Power off'}
                  </button>
                  <button type="button" className="btn btn-sm flex-1" onClick={() => s.updateNetworkNode(node.id, { cpu: Math.min(98, node.cpu + 15), status: 'degraded' })}><Activity size={10} /> Stress</button>
                  <button type="button" className="btn btn-sm flex-1" onClick={() => setLogOpen(true)}><Terminal size={10} /> Logs</button>
                </div>
              </Panel>

              <Panel title="Links" icon={RefreshCw} bodyClassName="p-0">
                <ul className="divide-y divide-line-soft">
                  {s.networkLinks.filter((l) => l.source === node.id || l.target === node.id).map((l) => {
                    const other = s.networkNodes.find((n) => n.id === (l.source === node.id ? l.target : l.source))
                    return (
                      <li key={l.id} className="flex items-center justify-between px-2.5 py-1">
                        <span className="mono truncate text-[9.5px] text-ink-2">{other?.hostname}</span>
                        <span className="flex items-center gap-2">
                          <span className="mono text-[8.5px] text-ink-3">{l.traffic}%</span>
                          <StatusPill value={l.status === 'up' ? 'online' : l.status === 'congested' ? 'degraded' : 'offline'} label={l.status.toUpperCase()} dot={false} />
                        </span>
                      </li>
                    )
                  })}
                  {s.networkLinks.filter((l) => l.source === node.id || l.target === node.id).length === 0 && <li className="px-2.5 py-3 text-[10px] text-ink-3">No links.</li>}
                </ul>
              </Panel>
            </>
          ) : (
            <Panel title="Host Detail"><EmptyState icon={Server} title="Select a host" /></Panel>
          )}

          <Panel title="Bulk Actions" icon={Power}>
            <div className="space-y-1.5">
              <button type="button" className="btn btn-sm w-full" onClick={() => s.networkNodes.filter((n) => n.status !== 'online').forEach((n) => s.updateNetworkNode(n.id, { status: 'online' }))}>Bring all online</button>
              <button type="button" className="btn btn-sm w-full" onClick={() => s.updateNetworkNode(node?.id ?? s.networkNodes[0].id, { cpu: 20, memory: 30, disk: 25, status: 'online' })}>Reset selected metrics</button>
              <button type="button" className="btn btn-sm w-full" onClick={() => s.networkNodes.filter((n) => n.type === 'SERVER').slice(0, 1).forEach((n) => s.updateNetworkNode(n.id, { status: 'offline' }))}>Simulate server failure</button>
            </div>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="amber" title="Fictional hosts">
        Inventory entries and metrics are generated. No real server, address or operating system is contacted.
      </InlineAlert>

      <Modal open={logOpen} onClose={() => setLogOpen(false)} title={node ? `${node.hostname} · Journal` : 'Journal'} subtitle="Synthetic daemon output" icon={Terminal} size="lg"
        footer={<button type="button" className="btn btn-primary" onClick={() => setLogOpen(false)}>Close</button>}
      >
        <div className="space-y-2">
          <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'resources', label: 'Journal' }, { id: 'meta', label: 'Metadata' }]} />
          {tab === 'resources' && (
            <div className="terminal-window max-h-[46vh] overflow-auto p-2">
              {logs.map((l, i) => (
                <p key={i} className={cn('font-terminal text-[9.5px]', l.level === 'warn' ? 'text-[#ffd489]' : 'text-[#8fd8c6]')}>
                  <span className="text-ink-3">{l.ts}</span> {l.daemon}[{1000 + i}]: {l.msg}
                </p>
              ))}
              <p className="mt-1 font-terminal text-[9.5px] text-ink-3">— synthetic journal, no real syslog source —</p>
            </div>
          )}
          {tab === 'meta' && node && (
            <KeyValue items={[
              { k: 'Hostname', v: node.hostname },
              { k: 'Address', v: node.ip },
              { k: 'OS', v: node.os ?? 'EMBEDDED' },
              { k: 'Zone', v: node.zone },
              { k: 'Uptime', v: node.uptime },
              { k: 'Status', v: node.status.toUpperCase() },
            ]} />
          )}
        </div>
      </Modal>
    </Screen>
  )
}
