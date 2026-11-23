import { useMemo, useState } from 'react'
import { Keyboard, Search, Printer, Download, Layers, Command, MousePointerClick, Info, Sparkles } from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, InlineAlert, Divider, KeyValue, Tag, Tabs, Select } from '@/components/ui'
import { BarsTrend, PALETTE, ChartLegend, Donut } from '@/components/charts'
import { SHORTCUTS } from '@/config/shortcuts'
import { NAV_GROUPS } from '@/config/nav'
import { downloadFile } from '@/lib/utils'

const GESTURES = [
  { keys: 'Click', label: 'Select row / open record', group: 'Pointer' },
  { keys: 'Hover', label: 'Reveal row actions', group: 'Pointer' },
  { keys: 'Scroll', label: 'Scroll panels independently', group: 'Pointer' },
  { keys: 'Tab', label: 'Move focus through controls', group: 'Pointer' },
  { keys: 'Enter', label: 'Activate focused control', group: 'Pointer' },
  { keys: 'Space', label: 'Toggle playback / pause engine', group: 'Pointer' },
]

export default function SettingsShortcuts() {
  const [q, setQ] = useState('')
  const [group, setGroup] = useState('all')
  const [tab, setTab] = useState('keys')

  const groups = useMemo(() => Array.from(new Set(SHORTCUTS.map((s) => s.group))), [])
  const source = tab === 'keys' ? SHORTCUTS : GESTURES

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    return source.filter((s) => {
      if (t && !`${s.keys} ${s.label} ${s.group}`.toLowerCase().includes(t)) return false
      if (group !== 'all' && s.group !== group) return false
      return true
    })
  }, [source, q, group])

  const routes = NAV_GROUPS.flatMap((g) => g.children)

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="SETTINGS · SHORTCUTS"
        title="Keyboard Reference"
        subtitle="Every binding wired into the console, plus point-and-click equivalents."
        icon={Keyboard}
        meta={
          <>
            <span className="badge badge-cyan">{SHORTCUTS.length} BINDINGS</span>
            <span className="badge badge-grey">{groups.length} GROUPS</span>
            <span className="badge badge-green">{routes.length} ROUTES</span>
            <span className="badge badge-amber">NO MODIFIER CONFLICTS</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile('shadow-shortcuts.txt', [...SHORTCUTS, ...GESTURES].map((s) => `${s.keys.padEnd(26)} ${s.label}  [${s.group}]`).join('\n'), 'text/plain')}><Download size={11} /> Export</button>
            <button type="button" className="btn btn-sm" onClick={() => window.print()}><Printer size={11} /> Print</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Bindings" value={SHORTCUTS.length} icon={Keyboard} accent="cyan" />
        <StatCard label="Gestures" value={GESTURES.length} icon={MousePointerClick} accent="blue" />
        <StatCard label="Groups" value={groups.length} icon={Layers} accent="green" />
        <StatCard label="Routes" value={routes.length} icon={Command} accent="amber" />
      </div>

      <Panel title="Search" icon={Search}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <p className="label-xs mb-1">FILTER</p>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Key, action or group…" className="field pl-7" />
            </div>
          </div>
          <div><p className="label-xs mb-1">GROUP</p><Select className="w-36" value={group} onChange={setGroup} options={[{ value: 'all', label: 'All groups' }, ...groups.map((g) => ({ value: g, label: g }))]} /></div>
          <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'keys', label: 'Keys', count: SHORTCUTS.length }, { id: 'pointer', label: 'Pointer', count: GESTURES.length }]} />
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <Panel title="Bindings" icon={Keyboard} bodyClassName="p-0"
          actions={<span className="mono text-[8.5px] text-ink-3">{filtered.length} shown</span>}
        >
          <table className="data-table">
            <thead><tr><th>Keys</th><th>Action</th><th>Group</th></tr></thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.keys + s.label}>
                  <td><kbd className="border border-line bg-bg px-1.5 py-0.5 font-mono text-[9px] text-ink">{s.keys}</kbd></td>
                  <td className="text-[10.5px] text-ink-2">{s.label}</td>
                  <td><span className="badge badge-grey">{s.group}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="px-3 py-4 text-center text-[10px] text-ink-3">No bindings match.</p>}
        </Panel>

        <div className="space-y-3">
          <Panel title="By Group" icon={Layers}>
            <div className="space-y-1">
              {groups.map((g) => {
                const n = SHORTCUTS.filter((s) => s.group === g).length
                return (
                  <div key={g}>
                    <div className="flex justify-between"><span className="text-[10px] text-ink-2">{g}</span><span className="mono text-[8.5px] text-ink-3">{n}</span></div>
                    <div className="h-1 bg-[#16212b]"><div className="h-full bg-[var(--accent)]" style={{ width: `${(n / SHORTCUTS.length) * 100}%` }} /></div>
                  </div>
                )
              })}
            </div>
            <Divider />
            <Donut data={groups.map((g, i) => ({ name: g, value: SHORTCUTS.filter((s) => s.group === g).length, color: [PALETTE.cyan, PALETTE.green, PALETTE.blue, PALETTE.amber, PALETTE.red][i % 5] }))} height={140} centerLabel="KEYS" centerValue={String(SHORTCUTS.length)} />
          </Panel>

          <Panel title="Palette" icon={Command}>
            <KeyValue items={[{ k: 'Open palette', v: 'Ctrl / ⌘ + K' }, { k: 'Focus search', v: '/' }, { k: 'Go to route', v: 'G then letter' }, { k: 'Close', v: 'Esc' }]} />
            <Divider />
            <p className="font-mono text-[8px] leading-relaxed text-ink-3">Bindings are ignored while typing in an input, textarea or terminal.</p>
          </Panel>

          <Panel title="Notes" icon={Info}>
            <ul className="space-y-1 text-[9.5px] leading-relaxed text-ink-2">
              <li>• ⌘ is used on macOS, Ctrl elsewhere.</li>
              <li>• Shortcuts work globally except in editors.</li>
              <li>• G-sequences time out after 1.2 s.</li>
              <li>• No browser-reserved combos are captured.</li>
            </ul>
            <div className="mt-1.5 flex flex-wrap gap-1"><Tag tone="#28d8ea">KEYBOARD FIRST</Tag><Tag tone="#38db91">ACCESSIBLE</Tag></div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Distribution" icon={Sparkles}>
          <BarsTrend horizontal data={groups.map((g) => ({ name: g, v: SHORTCUTS.filter((s) => s.group === g).length }))} keys={[{ key: 'v', color: PALETTE.cyan, label: 'Bindings' }]} height={160} xKey="name" />
          <ChartLegend items={[{ label: 'Bindings per group', color: PALETTE.cyan }]} />
        </Panel>
        <Panel title="Route Cheatsheet" icon={Command} bodyClassName="p-0">
          <table className="data-table">
            <thead><tr><th>Route</th><th>Label</th></tr></thead>
            <tbody>
              {routes.slice(0, 14).map((r) => (
                <tr key={r.to}>
                  <td className="mono text-[9px] text-[var(--accent)]">{r.to}</td>
                  <td className="text-[10px] text-ink-2">{r.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <InlineAlert tone="cyan" title="Reference only">
        This page documents the bindings actually registered in the app. Adjusting them would require editing
        <code className="mono"> src/config/shortcuts.ts</code> and the shortcut provider.
      </InlineAlert>
    </Screen>
  )
}
