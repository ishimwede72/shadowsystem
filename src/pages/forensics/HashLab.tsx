import { useMemo, useState } from 'react'
import {
  Hash, Copy, Check, RefreshCw, Download, FileCheck2, ShieldCheck,
  Binary, CircleCheck, CircleX, Sparkles,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Tabs, KeyValue, InlineAlert, Divider, EmptyState, Progress } from '@/components/ui'
import { Doc } from '@/components/ui/extras'
import { downloadFile } from '@/lib/utils'

// ---------- real, local hash implementations (no network, no storage) ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c >>> 0
  }
  return t
})()

export function crc32(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff]
  return ((crc ^ 0xffffffff) >>> 0).toString(16).padStart(8, '0')
}

export function fnv1a(input: string): string {
  let h = 0x811c9dc5
  const bytes = new TextEncoder().encode(input)
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i]
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

async function webCrypt(algo: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512', text: string): Promise<string> {
  if (!globalThis.crypto?.subtle) return 'unavailable-in-context'
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

const MANIFEST = [
  { name: 'ledger_export.csv', size: 412_331 },
  { name: 'access_log_0912.json', size: 88_402 },
  { name: 'meeting_notes.txt', size: 12_004 },
  { name: 'camera_index.csv', size: 240_118 },
  { name: 'wallet_snapshot.bin', size: 1_048_576 },
  { name: 'case_brief.pdf', size: 664_902 },
]

export default function HashLab() {
  const [tab, setTab] = useState('hash')
  const [text, setText] = useState('SHADOW SYSTEMS — simulated integrity check.\nLine two of the demonstration payload.')
  const [digests, setDigests] = useState<{ sha1: string; sha256: string; sha384: string; sha512: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [verifyText, setVerifyText] = useState('')
  const [verifyExpected, setVerifyExpected] = useState('')
  const [verifyResult, setVerifyResult] = useState<null | boolean>(null)
  const [manifestIds, setManifestIds] = useState<string[]>(MANIFEST.slice(0, 4).map((m) => m.name))

  const compute = async () => {
    setBusy(true)
    const [sha1, sha256, sha384, sha512] = await Promise.all([
      webCrypt('SHA-1', text),
      webCrypt('SHA-256', text),
      webCrypt('SHA-384', text),
      webCrypt('SHA-512', text),
    ])
    setDigests({ sha1, sha256, sha384, sha512 })
    setBusy(false)
  }

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      window.setTimeout(() => setCopied(null), 1400)
    } catch {
      setCopied(null)
    }
  }

  const verify = async () => {
    const actual = await webCrypt('SHA-256', verifyText)
    setVerifyResult(actual.trim().toLowerCase() === verifyExpected.trim().toLowerCase())
  }

  const manifestRows = useMemo(
    () =>
      MANIFEST.filter((m) => manifestIds.includes(m.name)).map((m) => {
        const digest = m.name.split('').reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7)
        const hex = Array.from({ length: 64 }, (_, i) => '0123456789abcdef'[(digest >>> (i % 8)) % 16]).join('')
        return { ...m, hex }
      }),
    [manifestIds],
  )

  const heavy = text.length > 4000

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="FORENSICS · INTEGRITY"
        title="Hash Laboratory"
        subtitle="Real SHA-1, SHA-256, SHA-384 and SHA-512 computed locally in your browser, plus CRC32 and FNV-1a checksums."
        icon={Hash}
        meta={
          <>
            <span className="badge badge-cyan">WEB CRYPTO</span>
            <span className="badge badge-green">LOCAL ONLY</span>
            <span className="badge badge-grey">{text.length} CHARS</span>
            <span className="badge badge-amber">NO UPLOAD</span>
          </>
        }
        actions={
          <>
            <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'hash', label: 'Compute' }, { id: 'verify', label: 'Verify' }, { id: 'manifest', label: 'Manifest' }]} />
            <button type="button" className="btn btn-sm btn-primary" onClick={compute} disabled={busy}><Sparkles size={11} /> {busy ? 'Hashing…' : 'Hash payload'}</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Algorithms" value="4 + 2" icon={Binary} accent="cyan" />
        <StatCard label="Digest state" value={digests ? 'READY' : 'IDLE'} icon={ShieldCheck} accent={digests ? 'green' : 'amber'} />
        <StatCard label="Payload" value={`${text.length} B`} icon={Hash} accent="blue" />
        <StatCard label="Manifest files" value={manifestIds.length} icon={FileCheck2} accent="amber" />
      </div>

      {tab === 'hash' && (
        <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
          <Panel title="Input Payload" icon={Hash} subtitle="Text only — nothing is uploaded or persisted" actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => setText('')}>Clear</button>}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
              className="field min-h-[220px] font-terminal text-[10.5px] leading-relaxed"
              placeholder="Type or paste demonstration text…"
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <button type="button" className="btn btn-sm" onClick={() => setText(totalShuffle(text))}><RefreshCw size={10} /> Mutate</button>
              <button type="button" className="btn btn-sm" onClick={() => setText('')}>Empty</button>
              <span className="mono ml-auto text-[8.5px] text-ink-3">{text.length} bytes · {text.split(/\s+/).filter(Boolean).length} words</span>
            </div>
            <Divider />
            <div className="grid grid-cols-2 gap-1.5">
              <KeyValue cols={1} items={[{ k: 'CRC32', v: crc32(text) }]} />
              <KeyValue cols={1} items={[{ k: 'FNV-1a', v: fnv1a(text) }]} />
            </div>
            {heavy && <InlineAlert tone="amber" title="Large payload">Digest computation may take a moment for large inputs.</InlineAlert>}
          </Panel>

          <div className="space-y-3">
            <Panel title="Digests" icon={ShieldCheck} subtitle="Computed with the Web Crypto API">
              {digests ? (
                <div className="space-y-2">
                  {([
                    ['SHA-1', digests.sha1, '#f5b942'],
                    ['SHA-256', digests.sha256, '#38db91'],
                    ['SHA-384', digests.sha384, '#28d8ea'],
                    ['SHA-512', digests.sha512, '#377eff'],
                  ] as const).map(([name, value, tone]) => (
                    <div key={name} className="border border-line bg-bg p-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5" style={{ background: tone }} />
                          <span className="mono text-[9px] uppercase tracking-widest text-ink-2">{name}</span>
                          <span className="mono text-[8px] text-ink-3">{(value.length * 4)}-bit</span>
                        </span>
                        <button type="button" className="btn btn-sm !px-1.5" onClick={() => copy(name, value)}>
                          {copied === name ? <Check size={9} className="text-green" /> : <Copy size={9} />}
                        </button>
                      </div>
                      <p className="mt-1 break-all font-terminal text-[9px] leading-relaxed text-ink-2">{value}</p>
                    </div>
                  ))}
                  <div className="flex gap-1">
                    <button type="button" className="btn btn-sm flex-1" onClick={() => downloadFile('shadow-digests.txt', Object.entries(digests).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join('\n') + `\nCRC32: ${crc32(text)}\nFNV1a: ${fnv1a(text)}\n`, 'text/plain')}>
                      <Download size={10} /> Export digests
                    </button>
                    <button type="button" className="btn btn-sm flex-1" onClick={compute}><RefreshCw size={10} /> Recompute</button>
                  </div>
                </div>
              ) : (
                <EmptyState icon={Hash} title="No digest computed" message="Press “Hash payload” to hash the text locally." action={<button type="button" className="btn btn-sm btn-primary" onClick={compute}><Sparkles size={10} /> Compute now</button>} />
              )}
            </Panel>

            <Panel title="How it works" icon={Binary}>
              <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
                <li>• SHA digests use <code className="mono text-[var(--accent)]">crypto.subtle.digest</code> in your own browser.</li>
                <li>• CRC32 and FNV-1a are implemented in plain TypeScript for instant feedback.</li>
                <li>• No input, digest or result is stored, logged or transmitted.</li>
                <li>• The manifest table below is illustrative demo data.</li>
              </ul>
            </Panel>
          </div>
        </div>
      )}

      {tab === 'verify' && (
        <div className="grid gap-3 xl:grid-cols-2">
          <Panel title="Verify a SHA-256" icon={FileCheck2} subtitle="Paste text and an expected digest">
            <div className="space-y-2">
              <div>
                <label className="field-label" htmlFor="v-text">Payload</label>
                <textarea id="v-text" value={verifyText} onChange={(e) => { setVerifyText(e.target.value); setVerifyResult(null) }} className="field min-h-[120px] font-terminal text-[10px]" placeholder="Demonstration text…" />
              </div>
              <div>
                <label className="field-label" htmlFor="v-hash">Expected SHA-256</label>
                <input id="v-hash" value={verifyExpected} onChange={(e) => { setVerifyExpected(e.target.value); setVerifyResult(null) }} className="field font-terminal text-[10px]" placeholder="64 hex characters" />
              </div>
              <div className="flex gap-1.5">
                <button type="button" className="btn btn-primary flex-1" onClick={verify} disabled={!verifyText || !verifyExpected}><ShieldCheck size={11} /> Verify</button>
                <button type="button" className="btn" onClick={async () => { const d = await webCrypt('SHA-256', verifyText); setVerifyExpected(d) }}>Fill actual</button>
              </div>
              {verifyResult !== null && (
                <div className={verifyResult ? 'border border-[#1b6349] bg-[#0a2a20] p-2 text-[#79f0b9]' : 'border border-[#6e2633] bg-[#2a1016] p-2 text-[#ff9aa6]'}>
                  <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest">
                    {verifyResult ? <CircleCheck size={12} /> : <CircleX size={12} />}
                    {verifyResult ? 'Digest matches' : 'Digest does not match'}
                  </p>
                  <p className="mt-0.5 text-[9.5px] opacity-80">Comparison executed locally against the Web Crypto implementation.</p>
                </div>
              )}
            </div>
          </Panel>

          <Panel title="Digest Comparison" icon={Binary} subtitle="Side-by-side demonstration payloads">
            <div className="space-y-2">
              {['Alpha payload', 'Beta payload'].map((label, i) => (
                <div key={label} className="border border-line bg-bg p-2">
                  <p className="mono text-[9px] uppercase tracking-widest text-ink-3">{label}</p>
                  <p className="mt-0.5 font-terminal text-[10px] text-ink-2">{i === 0 ? 'SHADOW SYSTEMS integrity sample — ALPHA' : 'SHADOW SYSTEMS integrity sample — BETA'}</p>
                  <p className="mt-1 break-all font-terminal text-[8.5px] text-ink-3">{i === 0 ? crc32('ALPHA') : crc32('BETA')} (crc32)</p>
                </div>
              ))}
              <InlineAlert tone="cyan" title="Avalanche effect">
                Changing a single character produces a completely different digest — try mutating the payload on the Compute tab.
              </InlineAlert>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'manifest' && (
        <div className="grid gap-3 xl:grid-cols-[1.3fr_1fr]">
          <Panel title="Integrity Manifest" icon={FileCheck2} bodyClassName="p-0"
            actions={<button type="button" className="btn btn-sm" onClick={() => downloadFile(`shadow-manifest-${Date.now()}.txt`, manifestRows.map((m) => `${m.hex}  ${m.name}`).join('\n') + '\n', 'text/plain')}><Download size={10} /> Export manifest</button>}
          >
            <table className="data-table">
              <thead><tr><th>Artefact</th><th className="text-right">Size</th><th>SHA-256 (illustrative)</th><th>State</th><th></th></tr></thead>
              <tbody>
                {manifestRows.map((m) => (
                  <tr key={m.name}>
                    <td className="mono text-[9.5px] text-ink">{m.name}</td>
                    <td className="mono text-right text-[9px]">{m.size.toLocaleString()} B</td>
                    <td className="mono text-[8px] text-ink-3">{m.hex.slice(0, 26)}…</td>
                    <td><StatusPill value="completed" label="SEALED" dot={false} /></td>
                    <td>
                      <button type="button" className="btn btn-sm !px-1.5" onClick={() => setManifestIds((ids) => ids.filter((x) => x !== m.name))}>remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {manifestRows.length === 0 && <EmptyState icon={FileCheck2} title="Manifest empty" message="Add artefacts from the list on the right." />}
            <div className="border-t border-line bg-[#0d151d] p-2">
              <p className="mono text-[8.5px] leading-relaxed text-ink-3">
                Manifest entries are illustrative. No real file was read, hashed or verified above.
              </p>
            </div>
          </Panel>

          <div className="space-y-3">
            <Panel title="Available Artefacts" icon={Hash} bodyClassName="p-0">
              <ul className="divide-y divide-line-soft">
                {MANIFEST.map((m) => {
                  const on = manifestIds.includes(m.name)
                  return (
                    <li key={m.name} className="flex items-center justify-between px-2.5 py-1.5">
                      <span className="min-w-0">
                        <span className="block truncate font-mono text-[9.5px] text-ink">{m.name}</span>
                        <span className="mono text-[8px] text-ink-3">{m.size.toLocaleString()} B</span>
                      </span>
                      <button type="button" className={on ? 'btn btn-sm btn-ghost' : 'btn btn-sm'} onClick={() => setManifestIds((ids) => (on ? ids.filter((x) => x !== m.name) : [...ids, m.name]))}>
                        {on ? 'Remove' : 'Add'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Panel>
            <Panel title="Manifest Stats" icon={ShieldCheck}>
              <KeyValue
                items={[
                  { k: 'Entries', v: String(manifestRows.length) },
                  { k: 'Total bytes', v: manifestRows.reduce((a, m) => a + m.size, 0).toLocaleString() },
                  { k: 'Algorithm', v: 'SHA-256 (illustrative)' },
                  { k: 'Sealed', v: String(manifestRows.length) },
                ]}
              />
              <Divider />
              <Progress value={(manifestRows.length / MANIFEST.length) * 100} label="Manifest coverage" showValue color="#38db91" />
            </Panel>
            <Panel title="Notes" icon={Binary}>
              <Doc label="MANIFEST">{`Rules
- entries must list name, size and digest
- digest is illustrative for the demo
- a real deployment would use a signed manifest
- nothing leaves the browser

SIMULATED INTEGRITY SYSTEM — SHADOW SYSTEMS`}</Doc>
            </Panel>
          </div>
        </div>
      )}

      <InlineAlert tone="amber" title="Local computation only">
        SHA digests are genuine hashes of the text you type, produced inside this tab with the Web Crypto API. No file is
        uploaded and no result is stored. Demo manifest values are illustrative, not real digests.
      </InlineAlert>
    </Screen>
  )
}

function totalShuffle(t: string) {
  const chars = t.split('')
  for (let i = chars.length - 1; i > 0; i--) {
    const j = (i * 7919 + t.length) % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

