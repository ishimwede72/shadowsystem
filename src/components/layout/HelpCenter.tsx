import { useState } from 'react'
import { BookOpen, Keyboard, ShieldQuestion, LifeBuoy } from 'lucide-react'
import { Modal, Tabs, Collapsible, InlineAlert } from '@/components/ui'
import { NAV_GROUPS } from '@/config/nav'
import { SHORTCUTS } from '@/config/shortcuts'

const MODULE_HELP: Record<string, string> = {
  command: 'The command center is the operational spine. Metric cards are computed live from the simulation engine, the world map plots fictional targets, and the feed streams every generated event.',
  finance: 'A closed-loop financial simulator. Institutions, accounts, transactions, cards and crypto positions are synthetic. Transfers update the internal demo ledger only and never touch a payment network.',
  cyber: 'Contains a scripted terminal, firewall simulator, password-entropy lab, encryption demos and vulnerability assessment records. Every command runs inside the local sandbox.',
  geoint: 'Map-first geospatial module. Targets move along generated coordinates; trail history, geofences and routes are all reconstructable and reversible.',
  surveillance: 'A camera-grid simulator rendering animated synthetic feeds with playback, incident generation and a multi-floor building map.',
  intelligence: 'Investigation database with fictional profiles, organisations, cases and an interactive relationship graph. Global search indexes every record.',
  network: 'NOC simulator with live topology, traffic charts, server telemetry and link status. Node load drifts mechanically on each engine tick.',
  forensics: 'Evidence-first laboratory: hashing lab, metadata extraction, timeline reconstruction and a case/evidence registry.',
  underground: 'A harmless movie-prop marketplace. Listings are fictional props and demo access, with simulated escrow and an optional market shutdown scenario.',
  crypto: 'Cryptography lab. AES-GCM, SHA-256 and signature demonstrations are genuinely computed in your browser using the Web Crypto API.',
  ai: 'SHADOW AI is a local, rule-based operations assistant grounded in the platform’s own sample data. No external model is contacted.',
  crisis: 'Crisis response with severity tiers, infrastructure telemetry, incident timelines and a full-screen emergency presentation mode.',
  comms: 'Operator directory, encrypted channels, dispatch board and simulated call handling — all local state.',
  missions: 'The scenario engine. Build missions from event blocks, run them and watch every module react in synchrony. Record and replay supported.',
  reports: 'Report generation across six domains with printable HTML/PDF output, each stamped with the simulation disclaimer.',
  settings: 'Appearance, sound, simulation defaults, operator profile, data export and reset controls.',
}

export function HelpCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState('modules')
  return (
    <Modal open={open} onClose={onClose} title="Help & Documentation" subtitle="SHADOW SYSTEMS operator handbook" icon={LifeBuoy} size="lg">
      <Tabs
        tabs={[
          { id: 'modules', label: 'Modules', icon: BookOpen },
          { id: 'keys', label: 'Shortcuts', icon: Keyboard },
          { id: 'safety', label: 'Safety', icon: ShieldQuestion },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="mt-3">
        {tab === 'modules' && (
          <div className="space-y-1.5">
            {NAV_GROUPS.map((g) => (
              <Collapsible key={g.id} title={g.label} icon={g.icon}>
                <p className="text-[11.5px] leading-relaxed text-ink-2">{MODULE_HELP[g.id]}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {g.children.map((c) => (
                    <span key={c.to} className="badge badge-grey">{c.label}</span>
                  ))}
                </div>
              </Collapsible>
            ))}
          </div>
        )}
        {tab === 'keys' && (
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {SHORTCUTS.map((s) => (
              <div key={s.keys} className="flex items-center justify-between border border-line-soft px-2.5 py-1.5">
                <span className="text-[11px] text-ink-2">{s.label}</span>
                <kbd className="border border-line bg-bg px-1.5 py-0.5 font-mono text-[9.5px] text-[var(--accent)]">{s.keys}</kbd>
              </div>
            ))}
          </div>
        )}
        {tab === 'safety' && (
          <div className="space-y-2">
            <InlineAlert tone="amber" title="Fictional simulation environment">
              SHADOW SYSTEMS is a cinematic simulation platform for film, television, music video and demonstration use. Every
              institution, account, transaction, identity, camera and network node is generated demonstration data.
            </InlineAlert>
            <div className="space-y-1.5 text-[11.5px] leading-relaxed text-ink-2">
              <p>• Banking flows never settle real money and are confined to an internal ledger.</p>
              <p>• Hacking sequences only execute scripted local actions — no network access is attempted or possible.</p>
              <p>• Location scenarios use generated coordinates. Any use of your own browser location requires explicit consent and can be stopped immediately.</p>
              <p>• Surveillance uses synthetic animated feeds only; no camera hardware is contacted.</p>
              <p>• No credentials are collected, stored or transmitted. The demo passcode never leaves your browser.</p>
              <p>• Cryptographic operations are performed locally with the Web Crypto API.</p>
            </div>
            <InlineAlert tone="cyan" title="Export & reset">
              You can regenerate every record at any time from Settings → Data, or via the command palette’s “Reset demonstration”.
            </InlineAlert>
          </div>
        )}
      </div>
    </Modal>
  )
}
