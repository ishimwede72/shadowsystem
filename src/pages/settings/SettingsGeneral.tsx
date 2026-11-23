import { useNavigate } from 'react-router-dom'
import {
  Settings2, Monitor, Rocket, Save, RotateCcw, Sparkles, Volume2, User, Palette,
  Keyboard, FlaskConical, Database, ArrowUpRight, Check, Home, Clock, Layers, Info,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, Toggle, InlineAlert, Divider, KeyValue, Tag, Modal } from '@/components/ui'
import { usePrefs, ACCENTS, type AccentKey } from '@/services/prefs'
import { useEngine } from '@/services/engine'
import { NAV_GROUPS } from '@/config/nav'
import { downloadFile, fmtDateTime } from '@/lib/utils'
import { useState } from 'react'

const TILES = [
  { to: '/settings/profile', label: 'Operator profile', icon: User, hint: 'Name, callsign, avatar', desc: 'Identity used across the console.' },
  { to: '/settings/appearance', label: 'Appearance', icon: Palette, hint: 'Accent, density, motion', desc: 'Theme tokens and layout density.' },
  { to: '/settings/sound', label: 'Sound', icon: Volume2, hint: 'Interface audio cues', desc: 'Toggle and tune UI sounds.' },
  { to: '/settings/shortcuts', label: 'Shortcuts', icon: Keyboard, hint: 'Keyboard reference', desc: 'Every binding in one table.' },
  { to: '/settings/simulation', label: 'Simulation', icon: FlaskConical, hint: 'Seed, speed, tick', desc: 'Engine cadence and world reset.' },
  { to: '/settings/data', label: 'Data & storage', icon: Database, hint: 'Export and clear', desc: 'Local storage controls.' },
]

export default function SettingsGeneral() {
  const navigate = useNavigate()
  const s = useEngine()
  const p = usePrefs()
  const [resetOpen, setResetOpen] = useState(false)

  const flatten = NAV_GROUPS.flatMap((g) => g.children)
  const landingOptions: { value: string; label: string }[] = []
  const seenLanding = new Set<string>()
  for (const c of [{ to: '/command-center', label: 'Command Center' }, ...flatten]) {
    if (seenLanding.has(c.to)) continue
    seenLanding.add(c.to)
    landingOptions.push({ value: c.to, label: c.label })
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="SETTINGS · GENERAL"
        title="Preferences"
        subtitle="Console-wide configuration. Preferences are stored in this browser and never uploaded."
        icon={Settings2}
        meta={
          <>
            <span className="badge badge-cyan">LOCAL PREFS</span>
            <span className="badge badge-grey">{ACCENTS[p.accent].label.toUpperCase()}</span>
            <span className="badge badge-green">{p.soundEnabled ? 'SOUND ON' : 'SILENT'}</span>
            <span className="badge badge-amber">v2 STORE</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => downloadFile('shadow-prefs.json', JSON.stringify(p, null, 2), 'application/json')}><Save size={11} /> Export prefs</button>
            <button type="button" className="btn btn-sm" onClick={() => setResetOpen(true)}><RotateCcw size={11} /> Reset all</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Accent" value={ACCENTS[p.accent].label.split(' ')[0]} icon={Palette} accent="cyan" />
        <StatCard label="Density" value={p.density} icon={Layers} accent="blue" />
        <StatCard label="Landing" value={p.defaultLanding.replace('/', '')} icon={Home} accent="green" />
        <StatCard label="Modules" value={flatten.length} icon={Rocket} accent="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Panel title="Console" icon={Monitor}>
            <div className="grid gap-2 sm:grid-cols-2">
              <Select label="Default landing page" value={p.defaultLanding} onChange={(v) => p.set('defaultLanding', v)} options={landingOptions.slice(0, 26)} />
              <Select label="Clock format" value={String(p.clockFormat)} onChange={(v) => p.set('clockFormat', Number(v) as 12 | 24)} options={[{ value: '24', label: '24-hour' }, { value: '12', label: '12-hour' }]} />
              <Select label="Density" value={p.density} onChange={(v) => p.set('density', v as typeof p.density)} options={[{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'spacious', label: 'Spacious' }]} />
              <Select label="Accent" value={p.accent} onChange={(v) => p.set('accent', v as AccentKey)} options={Object.entries(ACCENTS).map(([k, a]) => ({ value: k, label: a.label }))} />
            </div>
            <div className="mt-2 grid gap-1.5">
              <Row label="Texture overlay" hint="Grid and scanline atmosphere"><Toggle checked={p.texture} onChange={(v) => p.set('texture', v)} label="" /></Row>
              <Row label="Collapsed sidebar" hint="Start with a narrow navigation rail"><Toggle checked={p.sidebarCollapsed} onChange={(v) => p.set('sidebarCollapsed', v)} label="" /></Row>
            </div>
          </Panel>

          <Panel title="Shortcut Tiles" icon={Sparkles}>
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {TILES.map((t) => (
                <button key={t.to} type="button" onClick={() => navigate(t.to)}
                  className="group border border-line bg-bg p-2 text-left transition hover:border-[var(--accent)] hover:bg-elevated"
                >
                  <div className="flex items-center justify-between">
                    <t.icon size={13} className="text-[var(--accent)]" />
                    <ArrowUpRight size={10} className="text-ink-3 group-hover:text-ink" />
                  </div>
                  <p className="mt-1 text-[10.5px] text-ink">{t.label}</p>
                  <p className="text-[8.5px] leading-relaxed text-ink-3">{t.desc}</p>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Operator" icon={User}>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="sg-name">Display name</label>
                <input id="sg-name" value={p.displayName} onChange={(e) => p.set('displayName', e.target.value)} className="field" />
              </div>
              <div>
                <label className="field-label" htmlFor="sg-seed">Avatar seed</label>
                <input id="sg-seed" value={p.avatarSeed} onChange={(e) => p.set('avatarSeed', e.target.value)} className="field font-mono" />
              </div>
            </div>
            <Divider />
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusPill value="online" label="ACTIVE OPERATOR" />
              <span className="mono text-[8.5px] text-ink-3">{s.operators.find((o) => o.id === s.currentOperatorId)?.callsign ?? 'VANTA'}</span>
              <button type="button" className="btn btn-sm ml-auto" onClick={() => navigate('/settings/profile')}>Edit profile <ArrowUpRight size={9} /></button>
            </div>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Session" icon={Clock}>
            <KeyValue
              items={[
                { k: 'Session', v: String(s.sessionId ?? 'local').slice(0, 14) },
                { k: 'Seed', v: String(s.seed) },
                { k: 'Tick', v: String(s.tick) },
                { k: 'Speed', v: `${s.speed}×` },
                { k: 'Booted', v: s.booted ? 'YES' : 'NO' },
                { k: 'Sim time', v: fmtDateTime(new Date(s.simulatedTime).toISOString()) },
              ]}
            />
            <Divider />
            <div className="flex flex-wrap gap-1"><Tag tone="#28d8ea">LOCAL</Tag><Tag tone="#38db91">OFFLINE</Tag><Tag tone="#f5b942">SIMULATED</Tag></div>
          </Panel>

          <Panel title="Current Preferences" icon={Settings2}>
            <pre className="terminal-window max-h-[240px] overflow-auto p-2 font-terminal text-[8px] leading-relaxed text-ink-3">{JSON.stringify({
              accent: p.accent, density: p.density, fontScale: p.fontScale, motion: p.motion, texture: p.texture,
              soundEnabled: p.soundEnabled, volume: p.volume, sidebarCollapsed: p.sidebarCollapsed,
              defaultLanding: p.defaultLanding, clockFormat: p.clockFormat,
            }, null, 2)}</pre>
          </Panel>

          <Panel title="Where things live" icon={Info}>
            <ul className="space-y-1 text-[9.5px] leading-relaxed text-ink-2">
              <li>• <span className="mono text-[var(--accent)]">shadow-systems-prefs</span> — UI preferences</li>
              <li>• <span className="mono text-[var(--accent)]">shadow-systems-engine</span> — session flags</li>
              <li>• <span className="mono text-[var(--accent)]">shadow-systems-reports</span> — report library</li>
              <li>• <span className="mono text-[var(--accent)]">shadow-ai-history</span> — AI transcript</li>
            </ul>
            <div className="mt-1.5"><button type="button" className="btn btn-sm w-full" onClick={() => navigate('/settings/data')}><Database size={10} /> Manage storage</button></div>
          </Panel>
        </div>
      </div>

      <Panel title="Module Quick Access" icon={Layers}>
        <div className="flex flex-wrap gap-1">
          {flatten.map((c) => (
            <button key={c.to} type="button" onClick={() => navigate(c.to)} className="badge badge-grey hover:text-ink">{c.label}</button>
          ))}
        </div>
        <Divider />
        <p className="font-mono text-[8px] text-ink-3">{flatten.length} routes registered · Ctrl/⌘+K opens the command palette from anywhere.</p>
      </Panel>

      <InlineAlert tone="cyan" title="Nothing leaves this browser">
        Preferences, session flags and saved data are all stored locally. The app makes no network requests after load.
      </InlineAlert>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset All Preferences" subtitle="Restores every setting to its default" icon={RotateCcw}
        footer={<>
          <button type="button" className="btn" onClick={() => setResetOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => { p.resetPrefs(); setResetOpen(false) }}><Check size={11} /> Reset preferences</button>
        </>}
      >
        <p className="text-[10.5px] leading-relaxed text-ink-2">This restores accent, density, sound, landing page and layout defaults. Simulation data and reports are not affected.</p>
      </Modal>
    </Screen>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line-soft/60 py-1 last:border-0">
      <span className="min-w-0">
        <span className="block text-[10.5px] text-ink-2">{label}</span>
        {hint && <span className="block text-[8.5px] text-ink-3">{hint}</span>}
      </span>
      {children}
    </div>
  )
}
