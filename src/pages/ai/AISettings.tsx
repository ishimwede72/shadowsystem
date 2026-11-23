import { useState } from 'react'
import { Settings2, ShieldCheck, Trash2, Save, Check, Cpu, Sparkles, AlertTriangle, Database } from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, Select, Toggle, Slider, InlineAlert, Divider, KeyValue, Tag, Modal } from '@/components/ui'
import { usePrefs } from '@/services/prefs'
import { useEngine } from '@/services/engine'
import { SUGGESTIONS } from '@/services/ai'
import { downloadFile } from '@/lib/utils'

interface AiPrefs {
  persona: 'analyst' | 'concise' | 'detailed'
  verbosity: number
  includeRefs: boolean
  autoSave: boolean
  fictionBanner: boolean
  redactNames: boolean
  temperature: number
  maxTokens: number
}

const DEFAULTS: AiPrefs = {
  persona: 'analyst',
  verbosity: 60,
  includeRefs: true,
  autoSave: true,
  fictionBanner: true,
  redactNames: false,
  temperature: 0,
  maxTokens: 1200,
}

const KEY = 'shadow-ai-prefs'

export default function AISettings() {
  const s = useEngine()
  const soundEnabled = usePrefs((p) => p.soundEnabled)
  const setPrefsStore = usePrefs((p) => p.set)
  const [prefs, setPrefs] = useState<AiPrefs>(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AiPrefs>) }
    } catch { /* ignore */ }
    return DEFAULTS
  })
  const [saved, setSaved] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)

  const update = <K extends keyof AiPrefs>(k: K, v: AiPrefs[K]) => setPrefs((p) => ({ ...p, [k]: v }))

  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)) } catch { /* quota */ }
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
    s.notify({ type: 'success', title: 'AI settings saved', body: 'Stored locally in this browser', severity: 'low', module: 'ai' })
  }

  const reset = () => setPrefs(DEFAULTS)

  const clearHistory = () => {
    try { localStorage.removeItem('shadow-ai-history') } catch { /* noop */ }
    setClearOpen(false)
    s.notify({ type: 'success', title: 'AI transcript cleared', body: 'Local history removed', severity: 'low', module: 'ai' })
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="SHADOW AI · SETTINGS"
        title="AI Configuration"
        subtitle="Tune response style and privacy behaviour for the local rule engine. Everything is stored in this browser."
        icon={Settings2}
        meta={
          <>
            <span className="badge badge-cyan">RULE ENGINE</span>
            <span className="badge badge-green">LOCAL STORAGE</span>
            <span className="badge badge-grey">{SUGGESTIONS.length} PROMPTS</span>
            <span className="badge badge-amber">NO REMOTE MODEL</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={reset}><Trash2 size={11} /> Reset defaults</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={save}>{saved ? <Check size={11} /> : <Save size={11} />} {saved ? 'Saved' : 'Save settings'}</button>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Panel title="Response Style" icon={Sparkles}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Persona" value={prefs.persona} onChange={(v) => update('persona', v as AiPrefs['persona'])} options={[{ value: 'analyst', label: 'Analyst — balanced' }, { value: 'concise', label: 'Concise — minimal' }, { value: 'detailed', label: 'Detailed — explain more' }]} />
              <Slider label="Verbosity" min={0} max={100} value={prefs.verbosity} onChange={(v) => update('verbosity', v)} suffix="%" />
            </div>
            <div className="mt-3 grid gap-1.5">
              <Row label="Include module references" hint="Attach quick links under answers"><Toggle checked={prefs.includeRefs} onChange={(v) => update('includeRefs', v)} label="" /></Row>
              <Row label="Fiction banner on answers" hint="Always show the simulated-content reminder"><Toggle checked={prefs.fictionBanner} onChange={(v) => update('fictionBanner', v)} label="" /></Row>
              <Row label="Redact person names" hint="Replace profile names with initials in answers"><Toggle checked={prefs.redactNames} onChange={(v) => update('redactNames', v)} label="" /></Row>
            </div>
          </Panel>

          <Panel title="Advanced (illustrative)" icon={Cpu}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Slider label="Temperature" min={0} max={1} step={0.1} value={prefs.temperature} onChange={(v) => update('temperature', v)} />
              <Slider label="Max answer length" min={200} max={4000} step={100} value={prefs.maxTokens} onChange={(v) => update('maxTokens', v)} suffix=" tok" />
            </div>
            <InlineAlert tone="cyan" title="Cosmetic controls">
              The engine is deterministic, so temperature has no real effect. These controls exist to complete the interface
              and are persisted with your preferences.
            </InlineAlert>
          </Panel>

          <Panel title="Data & Privacy" icon={ShieldCheck}>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="border border-line bg-bg p-2">
                <p className="label-xs mb-1">TRANSCRIPT</p>
                <p className="text-[10px] leading-relaxed text-ink-2">Stored in localStorage under <code className="mono text-[var(--accent)]">shadow-ai-history</code>.</p>
                <button type="button" className="btn btn-sm mt-2 w-full" onClick={() => setClearOpen(true)}><Trash2 size={10} /> Clear transcript</button>
              </div>
              <div className="border border-line bg-bg p-2">
                <p className="label-xs mb-1">SETTINGS</p>
                <p className="text-[10px] leading-relaxed text-ink-2">Stored under <code className="mono text-[var(--accent)]">shadow-ai-prefs</code> on save.</p>
                <button type="button" className="btn btn-sm mt-2 w-full" onClick={() => downloadFile('shadow-ai-prefs.json', JSON.stringify(prefs, null, 2), 'application/json')}><Database size={10} /> Export settings</button>
              </div>
            </div>
            <Divider />
            <div className="grid gap-2 sm:grid-cols-2">
              <Row label="Chat autosave" hint="Persist transcript between reloads"><Toggle checked={prefs.autoSave} onChange={(v) => update('autoSave', v)} label="" /></Row>
              <Row label="Sound feedback" hint="Plays UI sounds when enabled globally"><Toggle checked={soundEnabled} onChange={(v) => setPrefsStore('soundEnabled', v)} label="" /></Row>
            </div>
          </Panel>

          <Panel title="Prompt Library" icon={Sparkles} bodyClassName="p-0">
            <table className="data-table">
              <thead><tr><th>Group</th><th>Prompt</th><th>Text</th></tr></thead>
              <tbody>
                {SUGGESTIONS.map((sg) => (
                  <tr key={sg.id}>
                    <td className="text-[9.5px] uppercase text-ink-3">{sg.group}</td>
                    <td className="text-[10px] text-ink">{sg.label}</td>
                    <td className="mono text-[8.5px] text-ink-3">{sg.prompt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Engine Profile" icon={Cpu} actions={<StatusPill value="active" label="READY" />}>
            <KeyValue
              items={[
                { k: 'Type', v: 'Deterministic rules' },
                { k: 'Persona', v: prefs.persona.toUpperCase() },
                { k: 'Verbosity', v: `${prefs.verbosity}%` },
                { k: 'References', v: prefs.includeRefs ? 'ON' : 'OFF' },
                { k: 'Name redaction', v: prefs.redactNames ? 'ON' : 'OFF' },
                { k: 'Autosave', v: prefs.autoSave ? 'ON' : 'OFF' },
              ]}
            />
            <Divider />
            <div className="flex flex-wrap gap-1"><Tag tone="#28d8ea">LOCAL</Tag><Tag tone="#38db91">DETERMINISTIC</Tag><Tag tone="#f5b942">NO NETWORK</Tag></div>
          </Panel>

          <Panel title="Safety" icon={AlertTriangle}>
            <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
              <li>• SHADOW AI has no internet access.</li>
              <li>• It cannot execute actions on your behalf.</li>
              <li>• Answers are generated from demo data only.</li>
              <li>• Do not paste personal or sensitive information.</li>
            </ul>
          </Panel>

          <Panel title="Current Preferences" icon={Settings2}>
            <pre className="terminal-window max-h-[200px] overflow-auto p-2 font-terminal text-[8.5px] leading-relaxed text-ink-2">{JSON.stringify(prefs, null, 2)}</pre>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="cyan" title="Nothing leaves the browser">
        These settings are for a local rule engine. No API key, endpoint or account is used or stored.
      </InlineAlert>

      <Modal
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        title="Clear AI Transcript"
        subtitle="Removes the saved conversation from localStorage"
        icon={Trash2}
        footer={<>
          <button type="button" className="btn" onClick={() => setClearOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={clearHistory}><Trash2 size={11} /> Clear transcript</button>
        </>}
      >
        <p className="text-[10.5px] leading-relaxed text-ink-2">
          This only deletes the stored transcript. Simulation data, reports and other preferences are untouched.
        </p>
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
