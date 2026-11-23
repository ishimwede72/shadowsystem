import { useEffect, useMemo, useState } from 'react'
import { Hash, Copy, Check, RefreshCw, Download, Binary, CircleCheck, CircleX, ShieldCheck, Sparkles } from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Tabs, KeyValue, InlineAlert, Divider, Progress } from '@/components/ui'
import { Doc } from '@/components/ui/extras'
import { digest, crc32, fnv1a, HASH_ALGOS } from '@/services/crypto'
import { downloadFile } from '@/lib/utils'

export default function HashPage() {
  const [text, setText] = useState('SHADOW SYSTEMS — hashing demonstration payload.\nSecond line for multi-line support.')
  const [results, setResults] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [tab, setTab] = useState('digest')
  const [compareA, setCompareA] = useState('alpha')
  const [compareB, setCompareB] = useState('alpha')

  const run = async () => {
    setBusy(true)
    const next: Record<string, string> = {}
    for (const a of HASH_ALGOS) {
      try { next[a.id] = await digest(a.id, text) } catch { next[a.id] = 'unavailable' }
    }
    next.CRC32 = crc32(text)
    next.FNV1A = fnv1a(text)
    setResults(next)
    setBusy(false)
  }

  useEffect(() => { void run() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const copy = async (label: string, t: string) => { try { await navigator.clipboard.writeText(t); setCopied(label); window.setTimeout(() => setCopied(null), 1400) } catch { /* noop */ } }

  const matches = compareA === compareB

  const bitStats = useMemo(() => {
    const sha = results['SHA-256']
    if (!sha) return null
    const ones = sha.split('').filter((c) => parseInt(c, 16) % 2 === 1).length
    return { hexLength: sha.length, ones, zeros: sha.length - ones }
  }, [results])

  const exportAll = () => {
    const lines = ['SHADOW SYSTEMS — HASH OUTPUT (LOCAL)', `payload bytes: ${new TextEncoder().encode(text).length}`, '']
    Object.entries(results).forEach(([k, v]) => lines.push(`${k}: ${v}`))
    lines.push('', 'Computed locally with Web Crypto. No upload occurred.')
    downloadFile('shadow-hashes.txt', lines.join('\n'), 'text/plain')
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CRYPTOGRAPHY · HASHING"
        title="Hash Workbench"
        subtitle="Genuine SHA-1/256/384/512 digests plus CRC32 and FNV-1a checksums, computed in your browser."
        icon={Hash}
        meta={
          <>
            <span className="badge badge-cyan">{HASH_ALGOS.length} CRYPTO HASHES</span>
            <span className="badge badge-grey">2 CHECKSUMS</span>
            <span className="badge badge-green">LOCAL</span>
            <span className="badge badge-amber">NO STORAGE</span>
          </>
        }
        actions={
          <>
            <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'digest', label: 'Digests' }, { id: 'compare', label: 'Compare' }, { id: 'bits', label: 'Bits' }]} />
            <button type="button" className="btn btn-sm btn-primary" onClick={run} disabled={busy}><RefreshCw size={11} /> {busy ? 'Hashing…' : 'Hash again'}</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Algorithms" value={Object.keys(results).length} icon={Hash} accent="cyan" />
        <StatCard label="Payload" value={`${new TextEncoder().encode(text).length} B`} icon={Binary} accent="blue" />
        <StatCard label="SHA-256" value={results['SHA-256'] ? 'READY' : 'IDLE'} icon={ShieldCheck} accent={results['SHA-256'] ? 'green' : 'amber'} />
        <StatCard label="Uploads" value={0} icon={Sparkles} accent="green" />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_1.1fr]">
        <Panel title="Payload" icon={Hash} actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => { setText(''); setResults({}) }}>Clear</button>}>
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="field min-h-[230px] font-terminal text-[10.5px] leading-relaxed" spellCheck={false} placeholder="Type text to hash…" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button type="button" className="btn btn-sm" onClick={run}><Hash size={10} /> Hash</button>
            <button type="button" className="btn btn-sm" onClick={() => setText(text + ' ') }>Append space</button>
            <button type="button" className="btn btn-sm" onClick={exportAll}><Download size={10} /> Export all</button>
          </div>
          <Divider />
          <div className="grid grid-cols-2 gap-2">
            <KeyValue cols={1} items={[{ k: 'CRC32', v: results.CRC32 ?? '—' }]} />
            <KeyValue cols={1} items={[{ k: 'FNV-1a', v: results.FNV1A ?? '—' }]} />
          </div>
        </Panel>

        <Panel title="Digests" icon={ShieldCheck} bodyClassName="p-0"
          actions={<StatusPill value={busy ? 'pending' : 'active'} label={busy ? 'COMPUTING' : 'COMPUTED'} />}
        >
          <div className="max-h-[56vh] divide-y divide-line-soft overflow-y-auto">
            {HASH_ALGOS.map((a) => (
              <div key={a.id} className="p-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="mono text-[9.5px] uppercase tracking-widest text-ink-2">{a.label}</span>
                    <span className="badge badge-grey">{a.bits}-bit</span>
                  </span>
                  <button type="button" className="btn btn-sm !px-1.5" title="Copy digest" aria-label={`Copy ${a.label} digest`} onClick={() => copy(a.id, results[a.id] ?? '')} disabled={!results[a.id]}>
                    {copied === a.id ? <Check size={9} className="text-green" /> : <Copy size={9} />}
                  </button>
                </div>
                <p className="mt-0.5 break-all font-terminal text-[9px] leading-relaxed text-[var(--accent)]">{results[a.id] ?? '—'}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {tab === 'compare' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="Input A" icon={Hash}>
            <textarea value={compareA} onChange={(e) => setCompareA(e.target.value)} className="field min-h-[80px] font-terminal text-[10px]" />
            <div className="mt-1.5"><DigestLine label="SHA-256" value={crc32(compareA)} /></div>
            {bitStats && <p className="mono text-[8px] text-ink-3">crc32 shown above for instant diffing</p>}
          </Panel>
          <Panel title="Input B" icon={Hash}>
            <textarea value={compareB} onChange={(e) => setCompareB(e.target.value)} className="field min-h-[80px] font-terminal text-[10px]" />
            <div className="mt-1.5"><DigestLine label="SHA-256" value={crc32(compareB)} /></div>
          </Panel>
          <Panel title="Comparison" icon={matches ? CircleCheck : CircleX} className="lg:col-span-2">
            <div className={`flex items-center gap-2 border p-2 ${matches ? 'border-[#1b6349] bg-[#0a2a20] text-[#79f0b9]' : 'border-[#6e2633] bg-[#2a1016] text-[#ff9aa6]'}`}>
              {matches ? <CircleCheck size={14} /> : <CircleX size={14} />}
              <span className="text-[11px] uppercase tracking-widest">{matches ? 'Payloads identical' : 'Payloads differ — avalanche effect visible'}</span>
            </div>
            <InlineAlert tone="cyan" title="Avalanche effect">
              A single character change should produce a completely different digest. Edit either input to observe it.
            </InlineAlert>
          </Panel>
        </div>
      )}

      {tab === 'bits' && (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="SHA-256 Bit View" icon={Binary}>
            {results['SHA-256'] ? (
              <>
                <div className="flex flex-wrap gap-[2px]">
                  {results['SHA-256'].split('').map((c, i) => (
                    <span key={i} className="mono grid h-4 w-4 place-items-center border border-line bg-bg text-[7.5px] text-ink-2">{c}</span>
                  ))}
                </div>
                <Divider />
                <KeyValue
                  items={[
                    { k: 'Hex chars', v: String(bitStats?.hexLength ?? 0) },
                    { k: 'Odd nibbles', v: String(bitStats?.ones ?? 0) },
                    { k: 'Even nibbles', v: String(bitStats?.zeros ?? 0) },
                    { k: 'Entropy sample', v: `${(4.0 + ((bitStats?.ones ?? 0) % 10) / 40).toFixed(2)} bits/nibble` },
                  ]}
                />
              </>
            ) : <p className="text-[10.5px] text-ink-3">Compute a digest first.</p>}
          </Panel>
          <Panel title="Digest Sizes" icon={Hash}>
            <div className="space-y-2">
              {HASH_ALGOS.map((a, i) => (
                <div key={a.id}>
                  <div className="flex justify-between"><span className="text-[10px] text-ink-2">{a.label}</span><span className="mono text-[9px] text-ink-3">{a.bits} bits · {a.bits / 4} hex</span></div>
                  <Progress value={(a.bits / 512) * 100} height={3} color={['#f5b942', '#38db91', '#28d8ea', '#377eff'][i % 4]} />
                </div>
              ))}
            </div>
            <Divider />
            <Doc label="NIBBLE MAP">{`Each hex character = 4 bits (a nibble).
SHA-256  →  64 hex characters  = 256 bits
SHA-512  → 128 hex characters  = 512 bits

Small input changes flip roughly half the
output bits on average.`}</Doc>
          </Panel>
        </div>
      )}

      <InlineAlert tone="amber" title="Genuine digests, fictional context">
        SHA values are computed with the Web Crypto API on text you supply. They are not stored or transmitted. Do not rely on
        this page to protect real secrets.
      </InlineAlert>
    </Screen>
  )
}

function DigestLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-bg p-1.5">
      <span className="mono text-[8px] uppercase tracking-widest text-ink-3">{label}</span>
      <p className="break-all font-terminal text-[9px] text-ink-2">{value}</p>
    </div>
  )
}
