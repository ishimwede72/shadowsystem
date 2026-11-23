import { useMemo, useState } from 'react'
import { Laptop, Smartphone, Printer, Tablet, Wifi, Search, Download, ShieldCheck, Ban, MonitorSmartphone, Router } from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, EmptyState, InlineAlert, KeyValue, Divider, Tabs, Progress, Tag, Modal, Toggle } from '@/components/ui'
import { Donut, PALETTE, BarsTrend } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, downloadFile, relTime, toCSV } from '@/lib/utils'

type DeviceKind = 'laptop' | 'phone' | 'tablet' | 'printer' | 'iot'
interface Device {
  id: string
  name: string
  kind: DeviceKind
  mac: string
  ip: string
  zone: string
  vendor: string
  trust: 'trusted' | 'unknown' | 'quarantined'
  lastSeen: string
  signal: number
  os: string
}

const KIND_ICON: Record<DeviceKind, typeof Laptop> = {
  laptop: Laptop,
  phone: Smartphone,
  tablet: Tablet,
  printer: Printer,
  iot: Router,
}

export default function Devices() {
  const s = useEngine()
  const devices = useMemo<Device[]>(() => {
    const kinds: DeviceKind[] = ['laptop', 'phone', 'tablet', 'printer', 'iot']
    const vendors = ['NORDVIK', 'HALCYON', 'MERIDIAN', 'ORVIK', 'TALOS', 'KESTREL']
    const oses = ['FICTOS 12', 'FICTOS 14', 'SYNTH-OS 3', 'SIMKERNEL 5', 'EMBED 1.4']
    const zones = Array.from(new Set(s.networkNodes.map((n) => n.zone)))
    return Array.from({ length: 22 }, (_, i) => {
      const kind = kinds[i % kinds.length]
      return {
        id: `DEV-${String(101 + i)}`,
        name: `${kind.toUpperCase()}-${String(11 + i).padStart(2, '0')}`,
        kind,
        mac: `02:00:${String((i * 13) % 256).padStart(2, '0').toUpperCase()}:${String((i * 29) % 256).padStart(2, '0').toUpperCase()}:${String((i * 7) % 256).padStart(2, '0').toUpperCase()}:${String((i * 41) % 256).padStart(2, '0').toUpperCase()}`,
        ip: `10.${20 + (i % 4)}.${Math.floor(i / 4)}.${10 + i}`,
        zone: zones[i % zones.length] ?? 'CORE',
        vendor: vendors[i % vendors.length],
        trust: i % 7 === 0 ? 'quarantined' : i % 3 === 0 ? 'unknown' : 'trusted',
        lastSeen: new Date(Date.now() - i * 900_000).toISOString(),
        signal: 40 + ((i * 17) % 60),
        os: oses[i % oses.length],
      }
    })
  }, [s.networkNodes])

  const [q, setQ] = useState('')
  const [kind, setKind] = useState('all')
  const [trust, setTrust] = useState('all')
  const [selected, setSelected] = useState<string | null>(devices[0]?.id ?? null)
  const [quarantine, setQuarantine] = useState<Record<string, boolean>>({})
  const [tab, setTab] = useState('list')
  const [detail, setDetail] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return devices.filter((d) => {
      if (kind !== 'all' && d.kind !== kind) return false
      if (trust !== 'all' && d.trust !== trust) return false
      if (t && !`${d.name} ${d.mac} ${d.ip} ${d.vendor}`.toLowerCase().includes(t)) return false
      return true
    })
  }, [devices, q, kind, trust])

  const device = devices.find((d) => d.id === selected)
  const detailDevice = devices.find((d) => d.id === detail)
  const isQuarantined = (id: string) => quarantine[id] ?? devices.find((d) => d.id === id)?.trust === 'quarantined'

  const kindDist = useMemo(() => {
    const m = new Map<string, number>()
    devices.forEach((d) => m.set(d.kind, (m.get(d.kind) ?? 0) + 1))
    return Array.from(m.entries())
  }, [devices])

  const zoneCounts = useMemo(() => {
    const m = new Map<string, number>()
    devices.forEach((d) => m.set(d.zone, (m.get(d.zone) ?? 0) + 1))
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [devices])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="NETWORK · ENDPOINTS"
        title="Connected Devices"
        subtitle="A synthetic inventory of laptops, phones, tablets and IoT endpoints. No real device is discovered or monitored."
        icon={MonitorSmartphone}
        meta={
          <>
            <span className="badge badge-cyan">{devices.length} DEVICES</span>
            <span className="badge badge-green">{devices.filter((d) => d.trust === 'trusted').length} TRUSTED</span>
            <span className="badge badge-amber">{devices.filter((d) => d.trust === 'unknown').length} UNKNOWN</span>
            <span className="badge badge-red">{devices.filter((d) => d.trust === 'quarantined').length} QUARANTINED</span>
          </>
        }
        actions={
          <>
            <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'list', label: 'List' }, { id: 'cards', label: 'Cards' }]} />
            <button type="button" className="btn btn-sm" onClick={() => downloadFile(`shadow-devices-${Date.now()}.csv`, toCSV(devices.map(({ id, name, kind, mac, ip, zone, vendor, trust, os }) => ({ id, name, kind, mac, ip, zone, vendor, trust, os }))), 'text/csv')}><Download size={11} /> Export</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Endpoints" value={devices.length} icon={Laptop} accent="cyan" />
        <StatCard label="Zones" value={zoneCounts.length} icon={Router} accent="blue" />
        <StatCard label="Unknown" value={devices.filter((d) => d.trust === 'unknown').length} icon={ShieldCheck} accent="amber" />
        <StatCard label="Quarantined" value={devices.filter((d) => isQuarantined(d.id)).length} icon={Ban} accent="red" />
      </div>

      <Panel title="Filters" icon={Search}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <p className="label-xs mb-1">SEARCH</p>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, MAC, IP or vendor…" className="field pl-7" />
            </div>
          </div>
          <div><p className="label-xs mb-1">TYPE</p><Select className="w-32" value={kind} onChange={setKind} options={[{ value: 'all', label: 'All types' }, ...kindDist.map(([k]) => ({ value: k, label: k }))]} /></div>
          <div><p className="label-xs mb-1">TRUST</p><Select className="w-32" value={trust} onChange={setTrust} options={[{ value: 'all', label: 'Any' }, { value: 'trusted', label: 'Trusted' }, { value: 'unknown', label: 'Unknown' }, { value: 'quarantined', label: 'Quarantined' }]} /></div>
          <button type="button" className="btn btn-sm" onClick={() => { setQ(''); setKind('all'); setTrust('all') }}>Reset</button>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {tab === 'list' ? (
            <Panel title="Device Inventory" icon={MonitorSmartphone} bodyClassName="p-0">
              <div className="max-h-[52vh] overflow-auto">
                <table className="data-table min-w-[740px]">
                  <thead><tr><th>Device</th><th>Type</th><th>MAC</th><th>IP</th><th>Zone</th><th>Vendor</th><th>Seen</th><th>Trust</th><th></th></tr></thead>
                  <tbody>
                    {filtered.map((d) => {
                      const Icon = KIND_ICON[d.kind]
                      return (
                        <tr key={d.id} className="cursor-pointer" onClick={() => setSelected(d.id)} data-selected={selected === d.id}>
                          <td className="mono text-[10px] text-[var(--accent)]">
                            <span className="flex items-center gap-1.5"><Icon size={10} className="text-ink-3" /> {d.name}</span>
                          </td>
                          <td className="text-[9.5px] uppercase text-ink-2">{d.kind}</td>
                          <td className="mono text-[8.5px] text-ink-3">{d.mac}</td>
                          <td className="mono text-[8.5px] text-ink-3">{d.ip}</td>
                          <td className="text-[9.5px]">{d.zone}</td>
                          <td className="text-[9.5px] text-ink-2">{d.vendor}</td>
                          <td className="mono whitespace-nowrap text-[8.5px] text-ink-3">{relTime(d.lastSeen)}</td>
                          <td><StatusPill value={isQuarantined(d.id) ? 'quarantined' : d.trust} dot={false} /></td>
                          <td>
                            <button type="button" className="btn btn-sm !px-1.5" title={isQuarantined(d.id) ? 'Release from quarantine' : 'Quarantine device'} aria-label={isQuarantined(d.id) ? 'Release from quarantine' : 'Quarantine device'} onClick={(e) => { e.stopPropagation(); setQuarantine((q2) => ({ ...q2, [d.id]: !isQuarantined(d.id) })) }}>
                              <Ban size={9} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && <EmptyState icon={Laptop} title="No devices match" />}
              </div>
            </Panel>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((d) => {
                const Icon = KIND_ICON[d.kind]
                return (
                  <button key={d.id} type="button" onClick={() => setDetail(d.id)} className={cn('panel-flat p-2.5 text-left transition-colors hover:border-line-strong', selected === d.id && 'border-[var(--accent)]')}>
                    <div className="flex items-start justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="grid h-7 w-7 place-items-center border border-line bg-bg"><Icon size={13} className="text-[var(--accent)]" /></span>
                        <span>
                          <span className="mono block text-[10px] text-ink">{d.name}</span>
                          <span className="block font-mono text-[8px] text-ink-3">{d.vendor} · {d.os}</span>
                        </span>
                      </span>
                      <StatusPill value={isQuarantined(d.id) ? 'quarantined' : d.trust} dot={false} />
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <Wifi size={9} className="text-ink-3" />
                      <Progress value={d.signal} height={2} className="flex-1" color={d.signal > 70 ? PALETTE.green : PALETTE.amber} />
                      <span className="mono text-[8px] text-ink-3">{d.signal}%</span>
                    </div>
                    <p className="mt-1 font-mono text-[8px] text-ink-3">{d.ip} · {d.zone}</p>
                  </button>
                )
              })}
            </div>
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Devices by Type" icon={MonitorSmartphone}>
              <Donut data={kindDist.map(([name, value], i) => ({ name, value, color: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red][i % 5] }))} height={170} centerLabel="DEVICES" centerValue={String(devices.length)} />
            </Panel>
            <Panel title="Devices by Zone" icon={Router}>
              <BarsTrend horizontal data={zoneCounts.slice(0, 6).map(([z, n]) => ({ name: z, n }))} keys={[{ key: 'n', color: PALETTE.blue, label: 'Devices' }]} height={170} xKey="name" />
            </Panel>
          </div>
        </div>

        <div className="space-y-3">
          {device ? (
            <Panel title={device.name} subtitle={device.id} icon={KIND_ICON[device.kind]} actions={<StatusPill value={isQuarantined(device.id) ? 'quarantined' : device.trust} />}>
              <KeyValue
                cols={1}
                items={[
                  { k: 'Type', v: device.kind.toUpperCase() },
                  { k: 'MAC', v: device.mac },
                  { k: 'Address', v: device.ip },
                  { k: 'Zone', v: device.zone },
                  { k: 'Vendor', v: device.vendor },
                  { k: 'OS', v: device.os },
                  { k: 'Signal', v: `${device.signal}%` },
                  { k: 'Last seen', v: relTime(device.lastSeen) },
                ]}
              />
              <Divider label="CONTROLS" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-ink-2">Quarantine</span>
                <Toggle checked={isQuarantined(device.id)} onChange={(v) => setQuarantine((q2) => ({ ...q2, [device.id]: v }))} label="" />
              </div>
              <button type="button" className="btn btn-sm w-full mt-2" onClick={() => setDetail(device.id)}>Open device card</button>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <Tag tone="#28d8ea">SYNTHETIC</Tag><Tag>{device.kind.toUpperCase()}</Tag>
              </div>
            </Panel>
          ) : <Panel title="Device Detail"><EmptyState icon={Laptop} title="Select a device" /></Panel>}

          <Panel title="Trust Policy" icon={ShieldCheck}>
            <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
              <li>• Trusted devices may access simulated resources.</li>
              <li>• Unknown devices are flagged for review.</li>
              <li>• Quarantined devices are blocked from generated flows.</li>
              <li>• None of this affects any real device or network.</li>
            </ul>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="amber" title="No discovery">
        The device list is generated from a seed. Nothing scans the local network, browser or hardware.
      </InlineAlert>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detailDevice ? `${detailDevice.name}` : 'Device'} subtitle={detailDevice?.id} icon={MonitorSmartphone} size="md"
        footer={detailDevice ? <>
          <button type="button" className="btn" onClick={() => setQuarantine((q2) => ({ ...q2, [detailDevice.id]: !isQuarantined(detailDevice.id) }))}><Ban size={11} /> Toggle quarantine</button>
          <button type="button" className="btn btn-primary" onClick={() => setDetail(null)}>Close</button>
        </> : null}
      >
        {detailDevice && (
          <div className="space-y-3">
            <KeyValue
              items={[
                { k: 'Type', v: detailDevice.kind.toUpperCase() },
                { k: 'MAC', v: detailDevice.mac },
                { k: 'IP', v: detailDevice.ip },
                { k: 'Zone', v: detailDevice.zone },
                { k: 'Vendor', v: detailDevice.vendor },
                { k: 'OS', v: detailDevice.os },
                { k: 'Signal', v: `${detailDevice.signal}%` },
                { k: 'Last seen', v: relTime(detailDevice.lastSeen) },
              ]}
            />
            <div className="border border-line bg-bg p-2 font-mono text-[9px] text-ink-3">
              <p>device_id={detailDevice.id}</p>
              <p>trust={isQuarantined(detailDevice.id) ? 'quarantined' : detailDevice.trust}</p>
              <p>source=synthetic-inventory</p>
              <p>note=no real endpoint is referenced</p>
            </div>
          </div>
        )}
      </Modal>
    </Screen>
  )
}
