import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  KeyRound, Lock, Unlock, Hash, FileSignature, MessageSquareCode, ArrowUpRight,
  ShieldCheck, Binary, Fingerprint, Cpu, Activity,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, KeyValue, InlineAlert, Divider, Tag, Tabs } from '@/components/ui'
import { Donut, PALETTE, AreaTrend, ChartLegend, RadarMetric } from '@/components/charts'
import { useEngine } from '@/services/engine'
import { HASH_ALGOS, isCryptoAvailable, randomHex } from '@/services/crypto'
import { relTime } from '@/lib/utils'

const MODULES = [
  { id: 'encryption', label: 'Encryption', icon: Lock, path: '/cryptography/encryption', desc: 'AES-GCM, classical ciphers and encoders.' },
  { id: 'decryption', label: 'Decryption', icon: Unlock, path: '/cryptography/decryption', desc: 'Reverse local ciphertext with a known key.' },
  { id: 'hash', label: 'Hashing', icon: Hash, path: '/cryptography/hash', desc: 'SHA-1/256/384/512, CRC32 and FNV-1a.' },
  { id: 'signatures', label: 'Signatures', icon: FileSignature, path: '/cryptography/signatures', desc: 'ECDSA P-256 sign and verify.' },
  { id: 'messages', label: 'Secret messages', icon: MessageSquareCode, path: '/cryptography/messages', desc: 'Morse, binary, Base64 and Caesar toys.' },
]

export default function CryptoOverview() {
  const navigate = useNavigate()
  const s = useEngine()
  const [tab, setTab] = useState('caps')
  const available = isCryptoAvailable()

  const probe = useMemo(() => ({ key: randomHex(8), iv: randomHex(6), fingerprint: randomHex(8).toUpperCase() }), [])

  const usage = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        t: `${i}h`,
        enc: Math.round(6 + Math.abs(Math.sin(i / 2.1)) * 18),
        hash: Math.round(10 + Math.abs(Math.cos(i / 2.6)) * 22),
      })),
    [],
  )

  const readiness = [
    { axis: 'Primitives', value: 100 },
    { axis: 'Coverage', value: 84 },
    { axis: 'Side channels', value: 62 },
    { axis: 'Key hygiene', value: 74 },
    { axis: 'Transparency', value: 96 },
    { axis: 'Demo scope', value: 100 },
  ]

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CRYPTOGRAPHY · OVERVIEW"
        title="Cryptography Lab"
        subtitle="Real cryptographic primitives computed entirely in your browser. A teaching sandbox, not an operational tool."
        icon={KeyRound}
        meta={
          <>
            <span className="badge badge-green">{available ? 'WEB CRYPTO READY' : 'WEB CRYPTO UNAVAILABLE'}</span>
            <span className="badge badge-cyan">LOCAL ONLY</span>
            <span className="badge badge-grey">{HASH_ALGOS.length} HASH ALGOS</span>
            <span className="badge badge-amber">NO UPLOAD</span>
          </>
        }
        actions={<button type="button" className="btn btn-sm btn-primary" onClick={() => navigate('/cryptography/encryption')}><Lock size={11} /> Encrypt something</button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Primitives" value={5} icon={KeyRound} accent="cyan" />
        <StatCard label="Hash algorithms" value={HASH_ALGOS.length} icon={Hash} accent="green" onClick={() => navigate('/cryptography/hash')} />
        <StatCard label="Web Crypto" value={available ? 'YES' : 'NO'} icon={ShieldCheck} accent={available ? 'green' : 'red'} />
        <StatCard label="Keys generated" value="Ephemeral" icon={Fingerprint} accent="blue" />
        <StatCard label="Messages" value={s.messages.length} icon={MessageSquareCode} accent="amber" onClick={() => navigate('/cryptography/messages')} />
        <StatCard label="Network calls" value={0} icon={Cpu} accent="green" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Lab Modules" icon={KeyRound} bodyClassName="p-0"
          actions={<Tabs size="sm" className="border-0" value={tab} onChange={setTab} tabs={[{ id: 'caps', label: 'Modules' }, { id: 'usage', label: 'Usage' }]} />}
        >
          {tab === 'caps' ? (
            <div className="grid gap-2 p-2 sm:grid-cols-2">
              {MODULES.map((m) => (
                <button key={m.id} type="button" onClick={() => navigate(m.path)} className="panel-flat flex items-start gap-2 p-2.5 text-left transition-colors hover:border-line-strong">
                  <span className="grid h-8 w-8 shrink-0 place-items-center border border-line bg-bg"><m.icon size={14} className="text-[var(--accent)]" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-1">
                      <span className="truncate text-[11px] font-medium text-ink">{m.label}</span>
                      <ArrowUpRight size={9} className="shrink-0 text-ink-3" />
                    </span>
                    <span className="mt-0.5 block text-[9.5px] leading-snug text-ink-3">{m.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-2">
              <AreaTrend data={usage} keys={[{ key: 'enc', color: PALETTE.cyan, label: 'Encrypt ops' }, { key: 'hash', color: PALETTE.green, label: 'Hash ops' }]} height={210} />
              <ChartLegend items={[{ label: 'Encryption ops (sim)', color: PALETTE.cyan }, { label: 'Hash ops (sim)', color: PALETTE.green }]} />
            </div>
          )}
        </Panel>

        <div className="space-y-3">
          <Panel title="Environment" icon={ShieldCheck}>
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] text-ink-2">Web Crypto API</span>
              <StatusPill value={available ? 'active' : 'failed'} label={available ? 'AVAILABLE' : 'MISSING'} />
            </div>
            <Divider />
            <KeyValue
              items={[
                { k: 'Secure context', v: String(globalThis.isSecureContext ?? 'unknown') },
                { k: 'Algorithms', v: 'AES-GCM · ECDH · ECDSA · SHA' },
                { k: 'Random source', v: 'crypto.getRandomValues' },
                { k: 'Storage', v: 'MEMORY ONLY' },
                { k: 'Probe key', v: probe.key },
                { k: 'Probe IV', v: probe.iv },
              ]}
            />
          </Panel>

          <Panel title="Posture" icon={ShieldCheck}>
            <RadarMetric data={readiness} height={200} />
          </Panel>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Algorithm Catalogue" icon={Binary} className="lg:col-span-2" bodyClassName="p-0">
          <table className="data-table">
            <thead><tr><th>Primitive</th><th>Type</th><th>Bits</th><th>Use</th><th>Status</th></tr></thead>
            <tbody>
              {[
                { p: 'AES-GCM', t: 'Symmetric', b: '128 / 192 / 256', u: 'Confidentiality + integrity', s: 'active' },
                { p: 'ECDH P-256', t: 'Key agreement', b: '256', u: 'Shared secret generation', s: 'active' },
                { p: 'ECDSA P-256', t: 'Signature', b: '256', u: 'Sign and verify payloads', s: 'active' },
                { p: 'SHA-256 / 384 / 512', t: 'Hash', b: '256 / 384 / 512', u: 'Digest and fingerprinting', s: 'active' },
                { p: 'SHA-1', t: 'Hash (legacy)', b: '160', u: 'Demonstration only', s: 'degraded' },
                { p: 'CRC32 / FNV-1a', t: 'Checksum', b: '32', u: 'Teaching comparison', s: 'degraded' },
              ].map((r) => (
                <tr key={r.p}>
                  <td className="mono text-[10px] text-ink">{r.p}</td>
                  <td className="text-[10px] text-ink-2">{r.t}</td>
                  <td className="mono text-[10px]">{r.b}</td>
                  <td className="text-[10px] text-ink-3">{r.u}</td>
                  <td><StatusPill value={r.s} dot={false} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div className="space-y-3">
          <Panel title="Operation Mix" icon={Cpu}>
            <Donut
              data={[
                { name: 'Hashing', value: 44, color: PALETTE.green },
                { name: 'Encryption', value: 28, color: PALETTE.cyan },
                { name: 'Signatures', value: 16, color: PALETTE.blue },
                { name: 'Encoders', value: 12, color: PALETTE.amber },
              ]}
              height={168}
              centerLabel="OPS"
              centerValue="100"
            />
          </Panel>
          <Panel title="Safety Rules" icon={ShieldCheck}>
            <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
              <li>• Everything operates on text you type.</li>
              <li>• Keys are ephemeral and never persisted.</li>
              <li>• No target, account or network is touched.</li>
              <li>• Not intended for protecting real secrets.</li>
            </ul>
            <Divider />
            <div className="flex flex-wrap gap-1"><Tag tone="#28d8ea">EDUCATIONAL</Tag><Tag tone="#f5b942">LOCAL</Tag><Tag tone="#38db91">NO UPLOAD</Tag></div>
          </Panel>
        </div>
      </div>

      <Panel title="Recent Lab Activity" icon={Activity} bodyClassName="p-0">
        <ul className="divide-y divide-line-soft">
          {s.activity.filter((a) => a.module === 'crypto').slice(0, 6).map((a) => (
            <li key={a.id} className="flex items-center gap-2 px-2.5 py-1.5">
              <span className="dot shrink-0 bg-[var(--accent)]" />
              <span className="min-w-0 flex-1 truncate text-[10px] text-ink-2">{a.action} — {a.detail}</span>
              <span className="mono shrink-0 text-[8px] text-ink-3">{relTime(a.ts)}</span>
            </li>
          ))}
          {s.activity.filter((a) => a.module === 'crypto').length === 0 && (
            <li className="px-2.5 py-3 text-[10px] text-ink-3">No crypto activity yet — try the hash lab.</li>
          )}
        </ul>
      </Panel>

      <InlineAlert tone="cyan" title="Real maths, fictional context">
        AES-GCM, SHA and ECDSA calls are genuine, executed locally in this tab. The surrounding scenario, keys and data are
        synthetic, and nothing is transmitted anywhere.
      </InlineAlert>
    </Screen>
  )
}

