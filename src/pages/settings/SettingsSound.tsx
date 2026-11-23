import { useState } from 'react'
import {
  Volume2, VolumeX, Play, Music, Bell, Radio, Keyboard, Power, Siren, CheckCircle2,
  XCircle, Camera, Rocket, Waves, Info, RotateCcw, Gauge, Layers2, Square,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Toggle, Slider, InlineAlert, Divider, KeyValue, Tag } from '@/components/ui'
import { AreaTrend, PALETTE, ChartLegend, BarsTrend } from '@/components/charts'
import { usePrefs } from '@/services/prefs'
import { audio, SOUND_GROUPS, SOUND_LABELS as SOUND_LABEL_LOOKUP, type SoundKey } from '@/services/audio'
import { cn, pad } from '@/lib/utils'

const DESCRIPTORS: Partial<Record<SoundKey, { desc: string; icon: typeof Bell }>> = {
  navigate: { desc: 'Route change', icon: Radio },
  panelOpen: { desc: 'Panel or drawer opened', icon: Layers2 },
  modalClose: { desc: 'Dialog dismissed', icon: XCircle },
  toggle: { desc: 'Switch flipped', icon: Gauge },
  hoverTick: { desc: 'Pointer hover tick', icon: Info },
  recordArm: { desc: 'Scenario recorder armed', icon: Rocket },
  playbackStart: { desc: 'Tape playback started', icon: Play },
  playbackStop: { desc: 'Tape playback stopped', icon: Square },
  lockOn: { desc: 'Target lock acquired', icon: Siren },
  scan: { desc: 'Sweep / scan pass', icon: Waves },
  uplink: { desc: 'Data uplink handshake', icon: Radio },
}

const SOUNDS: { key: SoundKey; label: string; desc: string; icon: typeof Bell }[] = [
  { key: 'startup', label: 'Startup', desc: 'Boot sequence complete', icon: Power },
  { key: 'keystroke', label: 'Keystroke', desc: 'Text input tick', icon: Keyboard },
  { key: 'granted', label: 'Access granted', desc: 'Authorization success', icon: CheckCircle2 },
  { key: 'denied', label: 'Access denied', desc: 'Authorization failure', icon: XCircle },
  { key: 'mission', label: 'Mission start', desc: 'Runner engaged', icon: Rocket },
  { key: 'alert', label: 'Alert', desc: 'Priority notification', icon: Siren },
  { key: 'txnComplete', label: 'Transaction complete', desc: 'Settlement approved', icon: CheckCircle2 },
  { key: 'txnReject', label: 'Transaction rejected', desc: 'Settlement failed', icon: XCircle },
  { key: 'notify', label: 'Notify', desc: 'Generic notification', icon: Bell },
  { key: 'camera', label: 'Camera', desc: 'Feed state change', icon: Camera },
  { key: 'shutdown', label: 'Shutdown', desc: 'Session ending', icon: Power },
  ...(Object.keys(DESCRIPTORS) as SoundKey[]).map((key) => ({
    key,
    label: SOUND_LABEL_LOOKUP[key] ?? key,
    desc: DESCRIPTORS[key]!.desc,
    icon: DESCRIPTORS[key]!.icon,
  })),
]

export default function SettingsSound() {
  const p = usePrefs()
  const [lastPlayed, setLastPlayed] = useState<SoundKey | null>(null)

  const play = (k: SoundKey) => {
    if (!p.soundEnabled) p.set('soundEnabled', true)
    audio.setEnabled(true)
    audio.setVolume(p.volume)
    audio.play(k)
    setLastPlayed(k)
  }

  const toggle = (v: boolean) => {
    p.set('soundEnabled', v)
    audio.setEnabled(v)
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="SETTINGS · SOUND"
        title="Audio Cues"
        subtitle="Every sound is synthesised locally with the Web Audio API. No samples are downloaded and nothing autoplays."
        icon={Volume2}
        meta={
          <>
            <span className={cn('badge', p.soundEnabled ? 'badge-green' : 'badge-grey')}>{p.soundEnabled ? 'ENABLED' : 'MUTED'}</span>
            <span className="badge badge-cyan">{Math.round(p.volume * 100)}% VOLUME</span>
            <span className="badge badge-grey">{SOUNDS.length} CUES</span>
            <span className="badge badge-amber">NO ASSETS</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => toggle(!p.soundEnabled)}>{p.soundEnabled ? <VolumeX size={11} /> : <Volume2 size={11} />} {p.soundEnabled ? 'Mute' : 'Unmute'}</button>
            <button type="button" className="btn btn-sm" onClick={() => { p.set('volume', 0.4); p.set('soundEnabled', false); audio.setEnabled(false); audio.setVolume(0.4) }}><RotateCcw size={11} /> Defaults</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => play('startup')}><Play size={11} /> Test startup</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="State" value={p.soundEnabled ? 'On' : 'Muted'} icon={p.soundEnabled ? Volume2 : VolumeX} accent={p.soundEnabled ? 'green' : 'grey'} />
        <StatCard label="Volume" value={`${Math.round(p.volume * 100)}%`} icon={Gauge} accent="cyan" />
        <StatCard label="Cues" value={SOUNDS.length} icon={Music} accent="blue" sub={`${p.mutedCues.length} muted`} />
        <StatCard label="Last played" value={lastPlayed ?? '—'} icon={Bell} accent="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Panel title="Master" icon={Volume2}>
            <div className="flex flex-wrap items-center justify-between gap-2 border border-line bg-bg px-2 py-1.5">
              <div className="flex items-center gap-2">
                {p.soundEnabled ? <Volume2 size={14} className="text-green" /> : <VolumeX size={14} className="text-ink-3" />}
                <div>
                  <p className="text-[10.5px] text-ink">Interface audio</p>
                  <p className="text-[8.5px] text-ink-3">{p.soundEnabled ? 'Cues play on interaction' : 'Silent — no audio context created'}</p>
                </div>
              </div>
              <Toggle checked={p.soundEnabled} onChange={toggle} label="" />
            </div>
            <div className="mt-2">
              <Slider label="Volume" min={0} max={1} step={0.05} value={p.volume} onChange={(v) => { p.set('volume', v); audio.setVolume(v) }}  />
              <div className="mt-1 flex items-center gap-1.5">
                <span className="mono text-[8px] text-ink-3">0%</span>
                <div className="flex flex-1 items-end gap-0.5">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <span key={i} className={cn('flex-1', (i / 24) <= p.volume ? 'bg-[var(--accent)]' : 'bg-[#1c2a36]')} style={{ height: `${6 + (i / 24) * 14}px` }} />
                  ))}
                </div>
                <span className="mono text-[8px] text-ink-3">100%</span>
              </div>
            </div>
            <Divider />
            <div className="flex flex-wrap items-center justify-between gap-2 border border-line bg-bg px-2 py-1.5">
              <div className="flex items-center gap-2">
                <Waves size={14} className={p.ambient ? 'text-[var(--accent)]' : 'text-ink-3'} />
                <div>
                  <p className="text-[10.5px] text-ink">Ambient operations bed</p>
                  <p className="text-[8.5px] text-ink-3">Three detuned drones, filtered room tone and a slow LFO. Requires audio enabled.</p>
                </div>
              </div>
              <Toggle
                checked={p.ambient}
                disabled={!p.soundEnabled}
                onChange={(v) => {
                  p.set('ambient', v)
                  audio.setEnabled(p.soundEnabled)
                  audio.setVolume(p.volume)
                  audio.setAmbient(v && p.soundEnabled)
                  if (v && p.soundEnabled) audio.play('uplink')
                }}
                label="Ambient bed"
              />
            </div>
            <Divider />
            <p className="font-mono text-[8px] leading-relaxed text-ink-3">The browser requires a user gesture before audio can start — the first cue may be prepared silently until you click.</p>
          </Panel>

          <Panel title="Cue Library" icon={Music} bodyClassName="p-0"
            actions={
              <span className="mono text-[8.5px] text-ink-3">
                {SOUNDS.length - p.mutedCues.length}/{SOUNDS.length} active
              </span>
            }
          >
            {SOUND_GROUPS.map((group) => (
              <div key={group.group}>
                <div className="flex items-center justify-between border-y border-line-soft bg-bg-2/60 px-2.5 py-1">
                  <span className="label-xs">{group.group}</span>
                  <button
                    type="button"
                    className="font-mono text-[8px] text-ink-3 hover:text-ink"
                    onClick={() => {
                      const allMuted = group.keys.every((k) => p.mutedCues.includes(k))
                      const next = allMuted
                        ? p.mutedCues.filter((k) => !group.keys.includes(k as SoundKey))
                        : Array.from(new Set([...p.mutedCues, ...group.keys]))
                      p.set('mutedCues', next)
                      audio.setMutedCues(next as SoundKey[])
                      audio.play('toggle')
                    }}
                  >
                    {group.keys.every((k) => p.mutedCues.includes(k)) ? 'Enable all' : 'Mute all'}
                  </button>
                </div>
                <ul className="divide-y divide-line-soft">
                  {group.keys.map((key) => {
                    const meta = SOUNDS.find((x) => x.key === key)
                    const Icon = meta?.icon ?? Bell
                    const isMuted = p.mutedCues.includes(key)
                    return (
                      <li key={key} className={cn('flex items-center gap-2 px-2.5 py-1.5', lastPlayed === key && 'bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]', isMuted && 'opacity-45')}>
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-sm border border-line text-[var(--accent)]"><Icon size={11} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[10.5px] text-ink">{SOUND_LABEL_LOOKUP[key]}</span>
                          <span className="block text-[8.5px] text-ink-3">{meta?.desc ?? ''}</span>
                        </span>
                        <span className="mono hidden text-[8px] text-ink-3 sm:block">{key}</span>
                        <Toggle
                          checked={!isMuted}
                          onChange={(on) => {
                            const next = on ? p.mutedCues.filter((k) => k !== key) : [...p.mutedCues, key]
                            p.set('mutedCues', next)
                            audio.setMutedCues(next as SoundKey[])
                          }}
                          label={`${SOUND_LABEL_LOOKUP[key]} enabled`}
                        />
                        <button type="button" className="btn btn-sm !px-2" title={`Preview ${SOUND_LABEL_LOOKUP[key]}`} aria-label={`Preview ${SOUND_LABEL_LOOKUP[key]}`} onClick={() => play(key)}><Play size={9} /></button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2">
            <Panel title="Waveform" icon={Waves}>
              <AreaTrend
                data={Array.from({ length: 32 }, (_, i) => ({ t: `${pad(i)}`, v: Math.round(Math.abs(Math.sin(i / 2.2)) * 60 + Math.abs(Math.cos(i / 3.7)) * 30) }))}
                keys={[{ key: 'v', color: PALETTE.cyan, label: 'Amplitude' }]}
                height={150}
              />
              <ChartLegend items={[{ label: 'Illustrative envelope', color: PALETTE.cyan }]} />
            </Panel>
            <Panel title="Frequency Bands" icon={Radio}>
              <BarsTrend
                data={['LOW', 'MID', 'HIGH', 'AIR'].map((b, i) => ({ b, v: [70, 55, 40, 22][i] }))}
                keys={[{ key: 'v', color: PALETTE.green, label: 'Level' }]}
                height={150}
                xKey="b"
              />
              <ChartLegend items={[{ label: 'Band energy (decorative)', color: PALETTE.green }]} />
            </Panel>
          </div>
        </div>

        <div className="space-y-3">
          <Panel title="Quick Test" icon={Play}>
            <div className="grid grid-cols-2 gap-1">
              {(['startup', 'keystroke', 'granted', 'denied', 'alert', 'notify', 'camera', 'shutdown'] as SoundKey[]).map((k) => (
                <button key={k} type="button" className={cn('btn btn-sm', lastPlayed === k && 'btn-primary')} onClick={() => play(k)}><Play size={9} /> {k}</button>
              ))}
            </div>
            <Divider />
            <p className="font-mono text-[8px] leading-relaxed text-ink-3">Playing a cue is entirely local — Web Audio oscillators and noise bursts, no files.</p>
          </Panel>

          <Panel title="Engine" icon={Bell}>
            <KeyValue
              items={[
                { k: 'Enabled', v: p.soundEnabled ? 'YES' : 'NO' },
                { k: 'Volume', v: `${Math.round(p.volume * 100)}%` },
                { k: 'Context', v: p.soundEnabled ? 'ACTIVE' : 'NOT CREATED' },
                { k: 'Output', v: 'SPEAKERS / DEFAULT' },
              ]}
            />
            <Divider />
            <StatusPill value={p.soundEnabled ? 'active' : 'stopped'} label={p.soundEnabled ? 'AUDIO READY' : 'SILENT'} />
          </Panel>

          <Panel title="Cue Mix" icon={Gauge}>
            <div className="space-y-1">
              {['startup', 'notify', 'alert', 'keystroke', 'mission'].map((k, i) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-[9.5px] text-ink-2">{k}</span>
                  <div className="h-1 w-24 bg-[#16212b]"><div className="h-full bg-[var(--accent)]" style={{ width: `${[80, 64, 48, 92, 56][i]}%` }} /></div>
                </div>
              ))}
            </div>
            <p className="mt-1.5 font-mono text-[7.5px] text-ink-3">Relative gain per cue (illustrative)</p>
          </Panel>

          <Panel title="Notes" icon={Info}>
            <ul className="space-y-1 text-[9.5px] leading-relaxed text-ink-2">
              <li>• Audio is optional and off by default.</li>
              <li>• No microphone or media input is used.</li>
              <li>• Volume and state persist with preferences.</li>
              <li>• Nothing is recorded or transmitted.</li>
            </ul>
            <div className="mt-1.5 flex flex-wrap gap-1"><Tag tone="#28d8ea">WEB AUDIO</Tag><Tag tone="#38db91">LOCAL</Tag><Tag tone="#f5b942">NO ASSETS</Tag></div>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="cyan" title="Synthesised locally">
        Cues are generated with oscillators and filtered noise at runtime. There are no audio files in this project, and no audio
        leaves the browser.
      </InlineAlert>
    </Screen>
  )
}
