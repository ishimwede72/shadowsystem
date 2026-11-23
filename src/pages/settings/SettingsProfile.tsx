import { useState } from 'react'
import { User, Save, Check, ShieldCheck, Mail, Building2, BadgeCheck, Fingerprint, Camera, RotateCcw, Users, KeyRound } from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, InlineAlert, Divider, KeyValue, Tag, Avatar, Modal, Progress, Timestamp } from '@/components/ui'
import { RadialGauge, PALETTE, ChartLegend, AreaTrend, RadarMetric } from '@/components/charts'
import { usePrefs } from '@/services/prefs'
import { useEngine } from '@/services/engine'
import { downloadFile } from '@/lib/utils'

const AVATAR_SEEDS = ['VANTA', 'NOVA', 'ORACLE', 'CIPHER', 'RAVEN', 'ECHO', 'KESTREL', 'ATLAS', 'VECTOR', 'HALO', 'SABLE', 'ONYX']

export default function SettingsProfile() {
  const s = useEngine()
  const p = usePrefs()
  const [displayName, setDisplayName] = useState(p.displayName)
  const [seed, setSeed] = useState(p.avatarSeed)
  const [role, setRole] = useState('Operations Lead')
  const [unit, setUnit] = useState('SIGMA')
  const [email, setEmail] = useState('operator@shadow.local')
  const [saved, setSaved] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const operator = s.operators.find((o) => o.id === s.currentOperatorId)

  const save = () => {
    p.set('displayName', displayName)
    p.set('avatarSeed', seed)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
    s.notify({ type: 'success', title: 'Profile saved', body: `${displayName} · ${seed}`, severity: 'low' })
  }

  const randomize = () => setSeed(AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)])

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="SETTINGS · PROFILE"
        title="Operator Profile"
        subtitle="The identity shown across the console. Purely cosmetic — no account, sign-in or server exists."
        icon={User}
        meta={
          <>
            <span className="badge badge-cyan">{seed}</span>
            <span className="badge badge-grey">{role.toUpperCase()}</span>
            <span className="badge badge-green">LOCAL IDENTITY</span>
            <span className="badge badge-amber">NO AUTH</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile('shadow-profile.json', JSON.stringify({ displayName, seed, role, unit, email }, null, 2), 'application/json')}><Save size={11} /> Export</button>
            <button type="button" className="btn btn-sm" onClick={() => setResetOpen(true)}><RotateCcw size={11} /> Reset</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={save}>{saved ? <Check size={11} /> : <Save size={11} />} {saved ? 'Saved' : 'Save profile'}</button>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Panel title="Identity" icon={User}>
            <div className="flex flex-wrap items-center gap-3 border-b border-line-soft pb-2.5">
              <Avatar seed={seed} size={64} status="online" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] leading-tight text-ink">{displayName || 'Unnamed operator'}</p>
                <p className="mono text-[9px] text-ink-3">{role} · {unit} unit</p>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  <StatusPill value="online" label="ACTIVE" />
                  <Tag tone="#28d8ea">LOCAL</Tag>
                  <Tag tone="#f5b942">FICTIONAL</Tag>
                </div>
              </div>
              <button type="button" className="btn btn-sm" onClick={randomize}><Camera size={10} /> New avatar</button>
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="sp-name">Display name</label>
                <input id="sp-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="field" placeholder="Operator name" />
              </div>
              <div>
                <label className="field-label" htmlFor="sp-seed">Avatar seed</label>
                <input id="sp-seed" value={seed} onChange={(e) => setSeed(e.target.value)} className="field font-mono" placeholder="VANTA" />
              </div>
              <div>
                <label className="field-label" htmlFor="sp-role">Role</label>
                <input id="sp-role" value={role} onChange={(e) => setRole(e.target.value)} className="field" />
              </div>
              <Select label="Unit" value={unit} onChange={setUnit} options={['SIGMA', 'OMEGA', 'DELTA', 'KILO', 'RELAY'].map((u) => ({ value: u, label: `${u} unit` }))} />
              <div className="sm:col-span-2">
                <label className="field-label" htmlFor="sp-email">Display email</label>
                <input id="sp-email" value={email} onChange={(e) => setEmail(e.target.value)} className="field font-mono" />
              </div>
            </div>

            <Divider label="AVATAR PRESETS" />
            <div className="flex flex-wrap gap-1.5">
              {AVATAR_SEEDS.map((a) => (
                <button key={a} type="button" onClick={() => setSeed(a)} title={a}
                  className={seed === a ? 'rounded-full ring-2 ring-[var(--accent)]' : 'rounded-full opacity-70 hover:opacity-100'}
                >
                  <Avatar seed={a} size={26} />
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Clearance (decorative)" icon={ShieldCheck}>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="label-xs mb-1">LEVEL</p>
                <div className="flex items-center gap-1.5">
                  <span className="badge badge-cyan">C3</span>
                  <Progress value={68} height={4} className="flex-1" color={PALETTE.cyan} />
                  <span className="mono text-[8.5px] text-ink-3">68%</span>
                </div>
                <p className="mt-1 text-[9px] leading-relaxed text-ink-3">Clearance is a visual label used across the simulated console.</p>
              </div>
              <div>
                <p className="label-xs mb-1">ACCESS AREAS</p>
                <div className="flex flex-wrap gap-1">
                  {['COMMAND', 'FINANCE', 'CYBER', 'GEOINT', 'FORENSICS'].map((a) => <Tag key={a} tone="#38db91">{a}</Tag>)}
                </div>
              </div>
            </div>
            <Divider />
            <InlineAlert tone="cyan" title="No authentication involved">
              This profile is a cosmetic local identity. There is no login, password, session token or verification step anywhere in
              the app.
            </InlineAlert>
          </Panel>

          <Panel title="Activity Snapshot" icon={Fingerprint}>
            <AreaTrend
              data={Array.from({ length: 12 }, (_, i) => ({ t: `${i + 1}`, actions: 4 + Math.round(Math.abs(Math.sin((i + s.tick) / 3)) * 14) }))}
              keys={[{ key: 'actions', color: PALETTE.cyan, label: 'Actions' }]}
              height={160}
            />
            <ChartLegend items={[{ label: 'Local actions (generated)', color: PALETTE.cyan }]} />
            <Divider />
            <KeyValue
              items={[
                { k: 'Session', v: String(s.sessionId ?? 'local').slice(0, 12) },
                { k: 'Activity entries', v: String(s.activity.length) },
                { k: 'Notifications', v: String(s.notifications.length) },
                { k: 'Last action', v: s.activity[0]?.action ?? '—' },
              ]}
            />
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Profile Card" icon={BadgeCheck}>
            <div className="border border-line bg-bg p-2.5">
              <div className="flex items-center gap-2">
                <Avatar seed={seed} size={34} status="online" />
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-ink">{displayName || 'Unnamed'}</p>
                  <p className="mono text-[8px] text-ink-3">{seed}</p>
                </div>
              </div>
              <div className="mt-2 space-y-0.5 font-mono text-[8px] text-ink-3">
                <p>ROLE · {role.toUpperCase()}</p>
                <p>UNIT · {unit}</p>
                <p>EMAIL · {email}</p>
                <p className="text-amber">SIMULATED IDENTITY</p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1">
              <StatCard label="Actions" value={s.activity.filter((a) => a.actor === (operator?.callsign ?? '')).length} icon={Fingerprint} accent="cyan" />
              <StatCard label="Missions" value={s.missions.length} icon={Users} accent="amber" />
            </div>
          </Panel>

          <Panel title="Trust Score" icon={ShieldCheck}>
            <RadialGauge value={86} color="#38db91" height={150} label="LOCAL TRUST" suffix="%" />
            <p className="text-center font-mono text-[8px] text-ink-3">Decorative metric · generated</p>
          </Panel>

          <Panel title="Coverage" icon={KeyRound}>
            <RadarMetric data={['Command', 'Finance', 'Cyber', 'Geo', 'Intel', 'Forensic'].map((a, i) => ({ axis: a, value: 40 + i * 8 }))} height={170} />
          </Panel>

          <Panel title="Operator of Record" icon={Building2}>
            <KeyValue
              items={[
                { k: 'Callsign', v: operator?.callsign ?? '—' },
                { k: 'Unit', v: operator?.unit ?? '—' },
                { k: 'Clearance', v: operator?.clearance ?? '—' },
                { k: 'Last seen', v: operator?.lastSeen.slice(11, 16) ?? '—' },
              ]}
            />
            <div className="mt-1.5 flex items-center gap-1 font-mono text-[8px] text-ink-3"><Mail size={8} /> Change operator in Communications → Operators</div>
            <div className="mt-1"><Timestamp ts={new Date().toISOString()} /></div>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="amber" title="Fictional operator">
        Names, callsigns, units and clearance levels are invented for the demonstration. Do not enter real personal details.
      </InlineAlert>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset Profile" subtitle="Restores default display name and avatar" icon={RotateCcw}
        footer={<>
          <button type="button" className="btn" onClick={() => setResetOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => { setDisplayName('Operator VANTA'); setSeed('VANTA'); p.set('displayName', 'Operator VANTA'); p.set('avatarSeed', 'VANTA'); setResetOpen(false) }}><Check size={11} /> Reset</button>
        </>}
      >
        <p className="text-[10.5px] leading-relaxed text-ink-2">Restores the default operator name and avatar seed. Role, unit and email fields are not stored and will revert on reload.</p>
      </Modal>
    </Screen>
  )
}
