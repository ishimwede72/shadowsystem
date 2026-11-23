import { Palette, Check, RotateCcw, Monitor, Sparkles, Type, Grid3x3, Eye, Layers, Sun, Contrast } from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, Toggle, Slider, InlineAlert, Divider, KeyValue, Tag, Modal } from '@/components/ui'
import { ACCENTS, type AccentKey, usePrefs } from '@/services/prefs'
import { PALETTE, Donut, ChartLegend } from '@/components/charts'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const SWATCHES = [
  { name: 'Background', value: '#070B11' },
  { name: 'Panel', value: '#101923' },
  { name: 'Elevated', value: '#16212B' },
  { name: 'Line', value: '#233241' },
  { name: 'Ink', value: '#E9F0F6' },
  { name: 'Ink 2', value: '#93A3B4' },
  { name: 'Ink 3', value: '#65788B' },
  { name: 'Green', value: '#38DB91' },
  { name: 'Blue', value: '#377EFF' },
  { name: 'Amber', value: '#F5B942' },
  { name: 'Red', value: '#F14E61' },
  { name: 'Violet', value: '#A78BFA' },
]

export default function SettingsAppearance() {
  const p = usePrefs()
  const [resetOpen, setResetOpen] = useState(false)

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="SETTINGS · APPEARANCE"
        title="Appearance"
        subtitle="Accent, density, scale and atmosphere. Changes apply instantly and persist in this browser."
        icon={Palette}
        meta={
          <>
            <span className="badge badge-cyan">{ACCENTS[p.accent].label.toUpperCase()}</span>
            <span className="badge badge-grey">{p.density.toUpperCase()}</span>
            <span className="badge badge-grey">{p.fontScale}%</span>
            <span className="badge badge-amber">{p.motion === 'full' ? 'MOTION FULL' : 'MOTION REDUCED'}</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => { p.set('accent', 'cyan'); p.set('density', 'comfortable'); p.set('fontScale', 100); p.set('motion', 'full'); p.set('texture', true) }}><RotateCcw size={11} /> Defaults</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setResetOpen(true)}><Sparkles size={11} /> Reset theme</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Accent" value={ACCENTS[p.accent].label.split(' ')[0]} icon={Palette} accent="cyan" />
        <StatCard label="Density" value={p.density} icon={Layers} accent="blue" />
        <StatCard label="Scale" value={`${p.fontScale}%`} icon={Type} accent="green" />
        <StatCard label="Texture" value={p.texture ? 'ON' : 'OFF'} icon={Grid3x3} accent="amber" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          <Panel title="Accent Colour" icon={Palette}>
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.entries(ACCENTS) as [AccentKey, { color: string; label: string }][]).map(([key, a]) => (
                <button key={key} type="button" onClick={() => p.set('accent', key)}
                  className={cn('flex items-center gap-2 border p-1.5 text-left transition', p.accent === key ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-line hover:bg-elevated')}
                >
                  <span className="h-6 w-6 shrink-0 rounded-sm" style={{ background: a.color, boxShadow: `0 0 12px ${a.color}55` }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] text-ink">{a.label}</span>
                    <span className="mono block text-[8px] text-ink-3">{a.color}</span>
                  </span>
                  {p.accent === key && <Check size={11} className="shrink-0 text-[var(--accent)]" />}
                </button>
              ))}
            </div>
            <Divider />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="label-xs">LIVE PREVIEW</span>
              <button type="button" className="btn btn-sm">Default</button>
              <button type="button" className="btn btn-sm btn-primary">Primary</button>
              <span className="badge badge-cyan">BADGE</span>
              <span className="mono text-[9px] text-[var(--accent)]">accent text</span>
            </div>
          </Panel>

          <Panel title="Density & Scale" icon={Layers}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Density" value={p.density} onChange={(v) => p.set('density', v as typeof p.density)} options={[{ value: 'compact', label: 'Compact — more rows' }, { value: 'comfortable', label: 'Comfortable — balanced' }, { value: 'spacious', label: 'Spacious — generous' }]} />
              <Select label="Motion" value={p.motion} onChange={(v) => p.set('motion', v as typeof p.motion)} options={[{ value: 'full', label: 'Full animation' }, { value: 'reduced', label: 'Reduced motion' }]} />
            </div>
            <div className="mt-2">
              <Slider label="Font scale" min={85} max={125} step={5} value={p.fontScale} onChange={(v) => p.set('fontScale', v)} suffix="%" />
            </div>
            <div className="mt-2 flex items-center justify-between border border-line bg-bg px-2 py-1.5">
              <span className="min-w-0"><span className="block text-[10.5px] text-ink-2">Texture overlay</span><span className="block text-[8.5px] text-ink-3">Grid and scanline atmosphere</span></span>
              <Toggle checked={p.texture} onChange={(v) => p.set('texture', v)} label="" />
            </div>
          </Panel>

          <Panel title="Design Tokens" icon={Eye}>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
              {SWATCHES.map((sw) => (
                <div key={sw.name} className="border border-line bg-bg">
                  <div className="h-9" style={{ background: sw.value }} />
                  <div className="px-1 py-0.5">
                    <p className="truncate text-[8.5px] text-ink-2">{sw.name}</p>
                    <p className="mono text-[7.5px] text-ink-3">{sw.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-1.5 font-mono text-[8px] leading-relaxed text-ink-3">Source of truth: <span className="text-[var(--accent)]">src/index.css</span> using Tailwind v4 <span className="text-ink-2">@theme</span> tokens.</p>
          </Panel>

          <Panel title="Preview" icon={Monitor}>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="panel-flat p-2">
                <p className="label-xs">PANEL FLAT</p>
                <p className="mt-0.5 text-[10.5px] text-ink">Sample content block</p>
                <p className="text-[9px] text-ink-3">Secondary copy in a flat panel.</p>
                <div className="mt-1.5 flex gap-1"><span className="badge badge-green">OK</span><span className="badge badge-amber">WARN</span><span className="badge badge-red">FAIL</span></div>
              </div>
              <div className="panel p-2">
                <p className="label-xs">STATUS</p>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">Active</span><StatusPill value="active" /></div>
                  <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">Paused</span><StatusPill value="paused" /></div>
                  <div className="flex items-center justify-between"><span className="text-[10px] text-ink-2">Critical</span><StatusPill value="critical" /></div>
                </div>
              </div>
            </div>
            <div className="mt-2 border border-line bg-bg p-2">
              <p className="mono text-[9px] text-ink-3">MONO TEXT · 0123456789 · ABCDEFGHIJ</p>
              <p className="font-terminal text-[11px] text-ink-2">&gt; terminal text sample_</p>
              <p className="font-display text-[13px] tracking-[0.18em] text-ink">DISPLAY HEADING</p>
            </div>
          </Panel>
        </div>

        <div className="space-y-3">
          <Panel title="Palette Mix" icon={Palette}>
            <Donut
              data={[
                { name: 'Cyan', value: 34, color: PALETTE.cyan },
                { name: 'Green', value: 26, color: PALETTE.green },
                { name: 'Blue', value: 18, color: PALETTE.blue },
                { name: 'Amber', value: 12, color: PALETTE.amber },
                { name: 'Red', value: 10, color: PALETTE.red },
              ]}
              height={160}
              centerLabel="ACCENT"
              centerValue={p.accent.slice(0, 4).toUpperCase()}
            />
            <ChartLegend items={Object.entries(ACCENTS).slice(0, 5).map(([, a]) => ({ label: a.label, color: a.color }))} />
          </Panel>

          <Panel title="Accessibility" icon={Contrast}>
            <ul className="space-y-1 text-[9.5px] leading-relaxed text-ink-2">
              <li>• Body text uses at least 4.5:1 contrast against panels.</li>
              <li>• Reduced motion stops decorative animation.</li>
              <li>• Density scales row height, not text size.</li>
              <li>• Font scale adjusts the root size.</li>
            </ul>
            <Divider />
            <KeyValue
              items={[
                { k: 'Contrast mode', v: 'TOKENS FIXED' },
                { k: 'Reduced motion', v: p.motion === 'reduced' ? 'ON' : 'OFF' },
                { k: 'Min font', v: `${Math.round(9 * (p.fontScale / 100))} px` },
              ]}
            />
            <div className="mt-1.5"><InlineAlert tone="cyan" title="Static palette">The accent swaps only the highlight colour; the neutral palette stays fixed for legibility.</InlineAlert></div>
          </Panel>

          <Panel title="Typography" icon={Type}>
            <div className="space-y-1.5">
              <div><p className="label-xs">DISPLAY</p><p className="font-display text-[12px] text-ink">SHADOW SYSTEMS</p></div>
              <div><p className="label-xs">BODY</p><p className="text-[10.5px] text-ink-2">Interface copy is set in a neutral sans for readability.</p></div>
              <div><p className="label-xs">MONO</p><p className="mono text-[10px] text-ink-2">ID-0000 · 12.4ms</p></div>
              <div><p className="label-xs">TERMINAL</p><p className="font-terminal text-[10px] text-ink-3">$ shadow status --local</p></div>
            </div>
            <Divider />
            <div className="flex flex-wrap gap-1"><Tag tone={ACCENTS[p.accent].color}>{p.accent.toUpperCase()}</Tag><Tag tone="#38db91">READABLE</Tag></div>
          </Panel>

          <Panel title="Atmosphere" icon={Sun}>
            <Toggle label="Grid background" checked={p.texture} onChange={(v) => p.set('texture', v)} />
            <Divider />
            <p className="font-mono text-[8px] leading-relaxed text-ink-3">
              The grid-bg and scanlines classes are binary effects. Disabling texture removes both without touching colour tokens.
            </p>
          </Panel>
        </div>
      </div>

      <InlineAlert tone="amber" title="Local preferences">
        Appearance settings are stored under <code className="mono">shadow-systems-prefs</code>. Clearing site data restores defaults.
      </InlineAlert>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Reset Theme" subtitle="Restore the default appearance" icon={RotateCcw}
        footer={<>
          <button type="button" className="btn" onClick={() => setResetOpen(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => { p.resetPrefs(); setResetOpen(false) }}><Check size={11} /> Reset everything</button>
        </>}
      >
        <p className="text-[10.5px] leading-relaxed text-ink-2">This resets every preference — accent, density, motion, sound volume, landing page and profile — back to factory defaults.</p>
      </Modal>
    </Screen>
  )
}
