import { useState } from 'react'
import { Binary, Lock, Unlock, Copy, Check, KeyRound, ShieldCheck, Cpu } from 'lucide-react'
import { Panel, PageHeader, Screen, InlineAlert, KeyValue, Divider, StatusPill } from '@/components/ui'
import { useEngine } from '@/services/engine'
import { cn } from '@/lib/utils'
import { PALETTE, BarsTrend } from '@/components/charts'

export default function CyberEncryption() {
  const addActivity = useEngine((s) => s.logActivity)
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt')
  const [text, setText] = useState('OPERATION BLACKOUT — phase two commences at 04:00Z.')
  const [key, setKey] = useState('shadow-demo-key-2026')
  const [output, setOutput] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [log, setLog] = useState<string[]>([])

  const push = (l: string) => setLog((prev) => [...prev.slice(-9), l])

  // XOR-based reversible demonstration cipher (clearly labelled as such):
  // the production cryptography module uses real Web Crypto AES-GCM.
  const transform = () => {
    setBusy(true)
    setTimeout(() => {
      try {
        const bytes = new TextEncoder().encode(text)
        const keyBytes = new TextEncoder().encode(key || 'shadow')
        const out = Array.from(bytes).map((b, i) => b ^ keyBytes[i % keyBytes.length])
        const encoded = btoa(String.fromCharCode(...out))
        const decoded = atob(encoded)
        const plain = new TextDecoder().decode(Uint8Array.from(Array.from(decoded).map((c, i) => c.charCodeAt(0) ^ keyBytes[i % keyBytes.length])))
        if (mode === 'encrypt') {
          setOutput(encoded)
          push(`encrypted ${bytes.length} bytes → ${encoded.length} base64 chars`)
        } else {
          setOutput(plain)
          push(`decrypted ${decoded.length} bytes → ${plain.length} chars`)
        }
        addActivity({ module: 'cyber', actor: 'ENC LAB', action: `Demonstration ${mode} executed`, detail: `${bytes.length} bytes, XOR demo cipher`, level: 'success' })
      } catch {
        setOutput('DECRYPTION ERROR — ciphertext or key invalid')
        push('decryption failed')
      }
      setBusy(false)
    }, 320)
  }

  const copyOut = () => {
    navigator.clipboard?.writeText(output).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const bytes = new TextEncoder().encode(text)
  const byteRows = Array.from(bytes).slice(0, 16)

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CYBER OPERATIONS · ENCRYPTION WORKBENCH"
        title="Encryption Demonstration"
        subtitle="A reversible demo cipher for cinematic explanation. For genuine AES-GCM/SHA-256 use the Cryptography lab."
        icon={Lock}
        meta={
          <>
            <span className="badge badge-green">LOCAL COMPUTE</span>
            <span className="badge badge-grey">DEMO CIPHER</span>
            <span className="badge badge-amber">NOT FOR REAL SECRETS</span>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Cipher Workbench" icon={Binary} subtitle={`${mode === 'encrypt' ? 'ENCRYPT' : 'DECRYPT'} MODE`}>
          <div className="mb-2 flex gap-1">
            {(['encrypt', 'decrypt'] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={cn('btn btn-sm flex-1 capitalize', mode === m && 'btn-primary')}>
                {m === 'encrypt' ? <Lock size={11} /> : <Unlock size={11} />} {m}
              </button>
            ))}
          </div>

          <label className="field-label" htmlFor="enc-text">{mode === 'encrypt' ? 'Plaintext' : 'Ciphertext (base64)'}</label>
          <textarea id="enc-text" value={text} onChange={(e) => setText(e.target.value)} className="field min-h-[90px] font-mono text-[11.5px]" spellCheck={false} />

          <div className="mt-2">
            <label className="field-label" htmlFor="enc-key">Demonstration key</label>
            <div className="flex gap-1.5">
              <input id="enc-key" value={key} onChange={(e) => setKey(e.target.value)} className="field flex-1" spellCheck={false} />
              <button type="button" className="btn btn-sm" onClick={() => setKey(Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10))}>
                <KeyRound size={10} /> Generate
              </button>
            </div>
          </div>

          <button type="button" className="btn btn-primary mt-3 w-full" onClick={transform} disabled={busy || !text}>
            {mode === 'encrypt' ? <Lock size={12} /> : <Unlock size={12} />} {busy ? 'Processing…' : `Run demo ${mode}`}
          </button>

          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="field-label mb-0">Output</span>
              <button type="button" className="btn btn-sm btn-ghost" onClick={copyOut} disabled={!output}>
                {copied ? <Check size={10} className="text-green" /> : <Copy size={10} />} {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="mt-1 max-h-[120px] min-h-[60px] overflow-auto border border-line bg-[#050a0e] p-2 font-terminal text-[10.5px] leading-relaxed text-[#79f0b9]">
              {output || '// output renders here'}
            </pre>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Byte View" icon={Cpu} subtitle="First 16 bytes of input">
            <div className="grid grid-cols-4 gap-1 sm:grid-cols-8">
              {byteRows.map((b, i) => (
                <div key={i} className="border border-line-soft p-1 text-center">
                  <p className="mono text-[9.5px] text-[var(--accent)]">{b.toString(16).padStart(2, '0').toUpperCase()}</p>
                  <p className="mono text-[7.5px] text-ink-3">{String.fromCharCode(b).replace(/\s/g, '·')}</p>
                </div>
              ))}
            </div>
            <Divider />
            <KeyValue
              cols={1}
              items={[
                { k: 'Input length', v: `${bytes.length} bytes` },
                { k: 'Cipher', v: 'XOR DEMO (reversible)' },
                { k: 'Key length', v: `${key.length} chars` },
                { k: 'Processing', v: 'IN-BROWSER' },
              ]}
            />
          </Panel>

          <Panel title="Execution Log" icon={Binary} bodyClassName="p-0">
            <div className="min-h-[120px] p-2 font-terminal text-[10px]">
              {log.map((l, i) => (
                <p key={i} className="text-ink-2">› {l}</p>
              ))}
              {log.length === 0 && <p className="text-ink-3">No operations executed yet.</p>}
            </div>
          </Panel>

          <InlineAlert tone="cyan" title="Where real crypto lives">
            Open <strong>Cryptography → Encryption</strong> for a genuine AES-GCM implementation using the Web Crypto API.
          </InlineAlert>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Cipher Comparison" icon={ShieldCheck} subtitle="Educational reference">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Algorithm</th><th>Type</th><th>Key size</th><th>Status</th></tr></thead>
              <tbody>
                {[
                  ['AES-256-GCM', 'Symmetric AEAD', '256 bit', 'ACTIVE STANDARD'],
                  ['ChaCha20-Poly1305', 'Symmetric AEAD', '256 bit', 'ACTIVE STANDARD'],
                  ['RSA-4096', 'Asymmetric', '4096 bit', 'LEGACY / SIGNING'],
                  ['ECDSA P-256', 'Asymmetric', '256 bit', 'ACTIVE STANDARD'],
                  ['SHA-256', 'Hash', 'n/a', 'INTEGRITY'],
                  ['XOR demo', 'Demonstration', 'variable', 'CINEMATIC ONLY'],
                ].map((r) => (
                  <tr key={r[0]}>
                    <td className="mono text-[10px] text-ink">{r[0]}</td>
                    <td className="text-[10.5px]">{r[1]}</td>
                    <td className="mono text-[10px] text-ink-3">{r[2]}</td>
                    <td><StatusPill value={r[3].includes('CINEMATIC') ? 'pending' : 'active'} label={r[3]} dot={false} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Key Space Visualisation" icon={KeyRound} subtitle="Illustrative relative strength (log scale)">
          <BarsTrend
            data={[
              { t: 'XOR 8', bits: 8 },
              { t: 'DES 56', bits: 56 },
              { t: 'AES-128', bits: 128 },
              { t: 'AES-256', bits: 256 },
              { t: 'RSA-4096', bits: 512 },
              { t: 'ECC-256', bits: 128 },
            ]}
            keys={[{ key: 'bits', color: PALETTE.green, label: 'Security bits' }]}
            height={190}
            xKey="t"
          />
        </Panel>
      </div>
    </Screen>
  )
}
