import { useMemo, useState } from 'react'
import { Activity, Ban, Check, Plus, Play, ShieldAlert, ShieldCheck, RotateCcw } from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, Toggle, Modal, Select, KeyValue, InlineAlert, SeverityPill } from '@/components/ui'
import { BarsTrend, Donut, PALETTE } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { cn, fmtTime } from '@/lib/utils'
import type { FirewallRule } from '@/types'

interface DemoEvent {
  id: string
  ts: number
  rule: string
  source: string
  action: string
  blocked: boolean
}

export default function Firewall() {
  const firewall = useEngine((s) => s.firewall)
  const toggleRule = useEngine((s) => s.toggleFirewallRule)
  const addRule = useEngine((s) => s.addFirewallRule)
  const addCyberEvent = useEngine((s) => s.addCyberEvent)
  const cyberEvents = useEngine((s) => s.cyberEvents)
  const [createOpen, setCreateOpen] = useState(false)
  const [demoLog, setDemoLog] = useState<DemoEvent[]>([])
  const [running, setRunning] = useState(false)
  const [form, setForm] = useState<Omit<FirewallRule, 'id' | 'hits'>>({
    name: 'ALLOW DEMO NEW PORT',
    direction: 'INBOUND',
    protocol: 'TCP',
    port: '9200',
    action: 'ALLOW',
    enabled: true,
  })

  const summary = useMemo(() => ({
    allow: firewall.filter((f) => f.action === 'ALLOW').length,
    deny: firewall.filter((f) => f.action === 'DENY').length,
    log: firewall.filter((f) => f.action === 'LOG').length,
    enabled: firewall.filter((f) => f.enabled).length,
    hits: firewall.reduce((a, f) => a + f.hits, 0),
  }), [firewall])

  const runDemo = () => {
    setRunning(true)
    setDemoLog([])
    const rules = [...firewall]
    let i = 0
    const interval = setInterval(() => {
      if (i >= Math.min(10, rules.length * 2)) {
        clearInterval(interval)
        setRunning(false)
        return
      }
      const rule = rules[i % rules.length]
      const blocked = rule.action === 'DENY' || !rule.enabled
      const evt: DemoEvent = {
        id: `DEMO-${i}-${Date.now()}`,
        ts: Date.now(),
        rule: rule.name,
        source: `${Math.floor(10 + Math.random() * 200)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(1 + Math.random() * 254)}`,
        action: rule.action,
        blocked,
      }
      setDemoLog((l) => [evt, ...l])
      addCyberEvent({
        type: blocked ? 'FIREWALL BLOCK (SIM)' : 'FIREWALL PASS (SIM)',
        severity: blocked ? 'elevated' : 'low',
        source: evt.source,
        target: 'shadow-sim-firewall',
        detail: `Demo evaluation against rule "${rule.name}"`,
        blocked,
      })
      i++
    }, 420)
  }

  const submit = () => {
    if (!form.name.trim()) return
    addRule(form)
    setCreateOpen(false)
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CYBER OPERATIONS · FIREWALL SIMULATOR"
        title="Firewall Simulator"
        subtitle="Build and evaluate a fictional ruleset. Events are generated locally and never correspond to real traffic."
        icon={ShieldAlert}
        meta={
          <>
            <span className="badge badge-green">{summary.enabled} ENABLED</span>
            <span className="badge badge-amber">{summary.deny} DENY RULES</span>
            <span className="badge badge-grey">{summary.hits.toLocaleString()} SIMULATED HITS</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={runDemo} disabled={running}><Play size={11} /> {running ? 'Running…' : 'Run demo'}</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setCreateOpen(true)}><Plus size={11} /> Add rule</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Panel dense><div className="text-center"><p className="label-xs">ALLOW</p><p className="stat-value text-2xl text-green">{summary.allow}</p></div></Panel>
        <Panel dense><div className="text-center"><p className="label-xs">DENY</p><p className="stat-value text-2xl text-red">{summary.deny}</p></div></Panel>
        <Panel dense><div className="text-center"><p className="label-xs">LOG</p><p className="stat-value text-2xl text-amber">{summary.log}</p></div></Panel>
        <Panel dense><div className="text-center"><p className="label-xs">SIM HITS</p><p className="stat-value text-2xl text-ink">{summary.hits.toLocaleString()}</p></div></Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Ruleset" icon={ShieldAlert} bodyClassName="p-0" actions={<span className="badge badge-grey">{firewall.length} RULES</span>}>
          <div className="max-h-[420px] overflow-y-auto">
            <table className="data-table min-w-[680px]">
              <thead><tr><th>Rule</th><th>Dir</th><th>Proto/Port</th><th>Action</th><th className="text-right">Hits</th><th>Enabled</th></tr></thead>
              <tbody>
                {firewall.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="mono text-[10px] text-ink">{r.name}</span>
                      <span className="block font-mono text-[8.5px] text-ink-3">{r.id}</span>
                    </td>
                    <td className="mono text-[9.5px] text-ink-3">{r.direction}</td>
                    <td className="mono text-[9.5px]">{r.protocol}/{r.port}</td>
                    <td>
                      <span className={cn('badge', r.action === 'DENY' ? 'badge-red' : r.action === 'ALLOW' ? 'badge-green' : 'badge-amber')}>{r.action}</span>
                    </td>
                    <td className="mono text-right text-[10px] tabular">{r.hits.toLocaleString()}</td>
                    <td><Toggle checked={r.enabled} onChange={() => toggleRule(r.id)} label="" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line bg-[#0d151d] px-2.5 py-1.5">
            <p className="font-mono text-[8.5px] uppercase tracking-widest text-ink-3">
              RULES ARE EVALUATED BY THE SIMULATOR ONLY · NO PACKETS LEAVE THE BROWSER
            </p>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Demo Evaluation Log" icon={Activity} subtitle="Canned firewall demonstration" bodyClassName="p-0"
            actions={<button type="button" className="icon-btn" onClick={() => setDemoLog([])} title="Clear log"><RotateCcw size={11} /></button>}
          >
            <div className="max-h-[240px] overflow-y-auto font-terminal text-[10px]">
              {demoLog.map((e) => (
                <div key={e.id} className="flex items-center gap-1.5 border-b border-line-soft/50 px-2 py-[2px]">
                  <span className="shrink-0 text-ink-3">{fmtTime(e.ts)}</span>
                  <span className={cn('shrink-0', e.blocked ? 'text-green' : 'text-red')}>{e.blocked ? <Check size={9} /> : <Ban size={9} />}</span>
                  <span className="min-w-0 flex-1 truncate text-ink-2">{e.rule}</span>
                  <span className={cn('shrink-0 font-mono text-[8.5px] uppercase', e.blocked ? 'text-green' : 'text-amber')}>{e.blocked ? 'BLOCK' : 'PASS'}</span>
                </div>
              ))}
              {demoLog.length === 0 && <p className="p-3 text-ink-3">Run the demo to generate fictional evaluation events.</p>}
            </div>
          </Panel>

          <Panel title="Action Mix" icon={ShieldCheck}>
            <Donut
              data={[
                { name: 'Allow', value: summary.allow, color: PALETTE.green },
                { name: 'Deny', value: summary.deny, color: PALETTE.red },
                { name: 'Log', value: summary.log, color: PALETTE.amber },
              ]}
              height={150}
              centerLabel="RULES"
              centerValue={String(firewall.length)}
            />
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Hit Distribution" icon={Activity} subtitle="Simulated rule utilisation">
          <BarsTrend
            data={firewall.map((r) => ({ t: r.name.slice(0, 12), hits: r.hits }))}
            keys={[{ key: 'hits', color: PALETTE.cyan, label: 'Hits' }]}
            height={200}
            xKey="t"
            horizontal
          />
        </Panel>
        <Panel title="Recent Cyber Events" icon={Activity} bodyClassName="p-0" actions={<span className="badge badge-grey">{cyberEvents.length}</span>}>
          <div className="max-h-[240px] overflow-y-auto">
            <table className="data-table">
              <thead><tr><th>Time</th><th>Type</th><th>Result</th><th>Severity</th></tr></thead>
              <tbody>
                {cyberEvents.slice(0, 14).map((e) => (
                  <tr key={e.id}>
                    <td className="mono text-[9.5px]">{fmtTime(e.timestamp)}</td>
                    <td className="truncate text-[10.5px]">{e.type}</td>
                    <td><StatusPill value={e.blocked ? 'active' : 'pending'} label={e.blocked ? 'BLOCKED' : 'PASSED'} dot={false} /></td>
                    <td><SeverityPill value={e.severity} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <InlineAlert tone="amber" title="Simulated firewall">
        The ruleset is a prop. Toggling, adding and evaluating rules manipulates local state only; no host firewall, packet
        filter or network interface is configured.
      </InlineAlert>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Firewall Rule"
        subtitle="Simulation-only rule definition"
        icon={Plus}
        footer={<>
          <button type="button" className="btn" onClick={() => setCreateOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={!form.name.trim()}><Plus size={11} /> Add rule</button>
        </>}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="rule-name">Rule name</label>
            <input id="rule-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })} />
          </div>
          <Select label="Direction" value={form.direction} onChange={(v) => setForm({ ...form, direction: v })} options={[{ value: 'INBOUND', label: 'Inbound' }, { value: 'OUTBOUND', label: 'Outbound' }]} />
          <Select label="Protocol" value={form.protocol} onChange={(v) => setForm({ ...form, protocol: v })} options={['TCP', 'UDP', 'ICMP', 'ANY'].map((p) => ({ value: p as FirewallRule['protocol'], label: p }))} />
          <div>
            <label className="field-label" htmlFor="rule-port">Port</label>
            <input id="rule-port" className="field" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} />
          </div>
          <Select label="Action" value={form.action} onChange={(v) => setForm({ ...form, action: v })} options={['ALLOW', 'DENY', 'LOG'].map((a) => ({ value: a as FirewallRule['action'], label: a }))} />
          <div className="sm:col-span-2">
            <KeyValue
              items={[
                { k: 'Direction', v: form.direction },
                { k: 'Protocol', v: form.protocol },
                { k: 'Port', v: form.port },
                { k: 'Action', v: form.action },
              ]}
            />
          </div>
        </div>
      </Modal>
    </Screen>
  )
}
