import { useState } from 'react'
import {
  Lock, Copy, Check, RefreshCw, Download, KeyRound, Shuffle, ArrowRight,
  ShieldCheck, Sparkles, AlertTriangle, Binary,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, Tabs, KeyValue, InlineAlert, Divider, Tag, Slider, Progress } from '@/components/ui'
import { Doc } from '@/components/ui/extras'
import { aesEncrypt, CAESAR, vigenere, atbash, rot13, xorCipher, toBinary, toMorse, toBase32ish, randomHex, isCryptoAvailable, type AesResult } from '@/services/crypto'
import { downloadFile } from '@/lib/utils'

type Cipher = 'aes' | 'caesar' | 'vigenere' | 'atbash' | 'rot13' | 'xor' | 'binary' | 'morse' | 'base64'

const CIPHERS: { id: Cipher; label: string; group: 'modern' | 'classical' | 'encoding' }[] = [
  { id: 'aes', label: 'AES-256-GCM', group: 'modern' },
  { id: 'xor', label: 'XOR (stream)', group: 'modern' },
  { id: 'caesar', label: 'Caesar shift', group: 'classical' },
  { id: 'vigenere', label: 'Vigenère', group: 'classical' },
  { id: 'atbash', label: 'Atbash', group: 'classical' },
  { id: 'rot13', label: 'ROT13', group: 'classical' },
  { id: 'binary', label: 'Binary', group: 'encoding' },
  { id: 'morse', label: 'Morse', group: 'encoding' },
  { id: 'base64', label: 'Base64', group: 'encoding' },
]

export default function Encryption() {
  const [cipher, setCipher] = useState<Cipher>('aes')
  const [tab, setTab] = useState('workbench')
  const [plain, setPlain] = useState('The harbour ledger is a prop. Meet at the atrium at 22:00.')
  const [shift, setShift] = useState(7)
  const [key, setKey] = useState('SHADOW')
  const [output, setOutput] = useState<string>('')
  const [aes, setAes] = useState<AesResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = async () => {
    setError(null)
    setBusy(true)
    try {
      if (cipher === 'aes') {
        const r = await aesEncrypt(plain, 256)
        setAes(r)
        setOutput(r.cipher)
      } else if (cipher === 'xor') {
        setAes(null)
        setOutput(xorCipher(plain, key || 'KEY'))
      } else if (cipher === 'caesar') {
        setAes(null)
        setOutput(CAESAR.encrypt(plain, shift))
      } else if (cipher === 'vigenere') {
        setAes(null)
        setOutput(vigenere(plain, key || 'KEY', 'enc'))
      } else if (cipher === 'atbash') {
        setAes(null)
        setOutput(atbash(plain))
      } else if (cipher === 'rot13') {
        setAes(null)
        setOutput(rot13(plain))
      } else if (cipher === 'binary') {
        setAes(null)
        setOutput(toBinary(plain))
      } else if (cipher === 'morse') {
        setAes(null)
        setOutput(toMorse(plain))
      } else {
        setAes(null)
        setOutput(toBase32ish(plain))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Encryption failed')
    }
    setBusy(false)
  }

  const copy = async (label: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(label); window.setTimeout(() => setCopied(null), 1400) } catch { /* noop */ }
  }

  const meta = CIPHERS.find((c) => c.id === cipher)!

  const exportResult = () => {
    const lines = [
      'SHADOW SYSTEMS — CRYPTOGRAPHY LAB (SIMULATED CONTEXT)',
      `cipher: ${meta.label}`,
      `input length: ${plain.length}`,
      '',
      'OUTPUT:',
      output || '(none)',
    ]
    if (aes) lines.push('', `key: ${aes.key}`, `iv: ${aes.iv}`, `algorithm: ${aes.algorithm}`)
    lines.push('', 'Note: real primitive, fictional scenario. Nothing was transmitted.')
    downloadFile(`shadow-encrypt-${Date.now()}.txt`, lines.join('\n'), 'text/plain')
  }

  const strength = cipher === 'aes' ? 100 : cipher === 'xor' ? 62 : cipher === 'vigenere' ? 34 : cipher === 'caesar' || cipher === 'rot13' || cipher === 'atbash' ? 12 : 5

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CRYPTOGRAPHY · ENCRYPTION"
        title="Encryption Workbench"
        subtitle="Encrypt demonstration text locally with modern, classical and encoding schemes and compare their strength."
        icon={Lock}
        meta={
          <>
            <span className="badge badge-cyan">{meta.label}</span>
            <span className="badge badge-green">LOCAL ONLY</span>
            <span className="badge badge-grey">{plain.length} CHARS</span>
            <span className="badge badge-amber">{isCryptoAvailable() ? 'WEB CRYPTO READY' : 'WEB CRYPTO MISSING'}</span>
          </>
        }
        actions={
          <>
            <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'workbench', label: 'Workbench' }, { id: 'compare', label: 'Compare' }]} />
            <button type="button" className="btn btn-sm" onClick={() => downloadFile('shadow-crypto-note.txt', 'This note explains that the SHADOW SYSTEMS crypto lab is a local sandbox. No network calls are performed.', 'text/plain')}><Download size={11} /> Readme</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={run} disabled={busy || !plain}><Lock size={11} /> {busy ? 'Working…' : 'Encrypt'}</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Cipher" value={meta.label} icon={Lock} accent="cyan" />
        <StatCard label="Input" value={`${plain.length} B`} icon={Binary} accent="blue" />
        <StatCard label="Strength" value={`${strength}/100`} icon={ShieldCheck} accent={strength > 80 ? 'green' : strength > 40 ? 'amber' : 'red'} />
        <StatCard label="Network calls" value={0} icon={Sparkles} accent="green" />
      </div>

      {tab === 'workbench' ? (
        <div className="grid gap-3 xl:grid-cols-2">
          <Panel title="Plaintext" icon={Lock} actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => setPlain('')}>Clear</button>}>
            <textarea value={plain} onChange={(e) => setPlain(e.target.value)} className="field min-h-[160px] font-terminal text-[11px] leading-relaxed" placeholder="Type demonstration text…" />
            <Divider />
            <div className="grid gap-2 sm:grid-cols-2">
              <Select
                label="Cipher"
                value={cipher}
                onChange={(v) => { setCipher(v); setOutput(''); setAes(null) }}
                options={CIPHERS.map((c) => ({ value: c.id, label: `${c.label}${c.group === 'modern' ? '' : c.group === 'classical' ? ' · classical' : ' · encoding'}` }))}
              />
              {(cipher === 'caesar') && <Slider label="Shift" min={1} max={25} value={shift} onChange={setShift} />}
              {(cipher === 'vigenere' || cipher === 'xor') && (
                <div>
                  <label className="field-label" htmlFor="key-input">Key</label>
                  <input id="key-input" value={key} onChange={(e) => setKey(e.target.value)} className="field" placeholder="KEY" />
                </div>
              )}
              {cipher === 'aes' && (
                <div>
                  <p className="field-label">Key material</p>
                  <button type="button" className="btn btn-sm w-full" onClick={() => { setAes(null); setOutput('') }}><RefreshCw size={10} /> New random key on run</button>
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button type="button" className="btn btn-sm" onClick={() => setPlain(randomHex(12))}><Shuffle size={10} /> Random payload</button>
              <button type="button" className="btn btn-sm" onClick={() => setPlain(atbash('SHADOW SYSTEMS — BEYOND THE VISIBLE'))}><ArrowRight size={10} /> Sample phrase</button>
            </div>
          </Panel>

          <div className="space-y-3">
            <Panel title="Ciphertext" icon={ShieldCheck} actions={
              output ? <button type="button" className="btn btn-sm" onClick={() => copy('out', output)}>{copied === 'out' ? <Check size={10} className="text-green" /> : <Copy size={10} />} Copy</button> : undefined
            }>
              {output ? (
                <>
                  <div className="terminal-window max-h-[220px] overflow-auto p-2">
                    <p className="break-all font-terminal text-[10.5px] leading-relaxed text-[#79f0b9]">{output}</p>
                  </div>
                  {aes && (
                    <>
                      <Divider label="KEY MATERIAL (EPHEMERAL)" />
                      <KeyValue
                        cols={1}
                        items={[
                          { k: 'Algorithm', v: aes.algorithm },
                          { k: 'Key (hex)', v: aes.key },
                          { k: 'IV (hex)', v: aes.iv },
                          { k: 'Cipher (base64)', v: `${aes.cipher.slice(0, 32)}…` },
                        ]}
                      />
                    </>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button type="button" className="btn btn-sm" onClick={exportResult}><Download size={10} /> Export</button>
                    <button type="button" className="btn btn-sm" onClick={run}><RefreshCw size={10} /> Re-run</button>
                    <button type="button" className="btn btn-sm" onClick={() => { setPlain(output); setCipher('atbash') }}><ArrowRight size={10} /> Use as input</button>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <KeyRound size={22} className="mx-auto text-ink-3" />
                  <p className="mt-1.5 text-[10.5px] text-ink-3">Press <span className="text-ink">Encrypt</span> to transform the payload.</p>
                </div>
              )}
              {error && <InlineAlert tone="red" title="Cipher error">{error}</InlineAlert>}
            </Panel>

            <Panel title="Strength Analysis" icon={ShieldCheck}>
              <div className="mb-2">
                <div className="flex justify-between"><span className="label-xs">RESISTANCE (TEACHING SCALE)</span><span className="mono text-[9px] text-ink-3">{strength}/100</span></div>
                <Progress value={strength} height={4} color={strength > 80 ? '#38db91' : strength > 40 ? '#f5b942' : '#f14e61'} />
              </div>
              <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
                {cipher === 'aes' && <li>• AES-256-GCM provides authenticated encryption with a random IV each run.</li>}
                {cipher === 'xor' && <li>• XOR with a short repeating key is trivially breakable; shown for contrast.</li>}
                {(cipher === 'caesar' || cipher === 'rot13' || cipher === 'atbash') && <li>• Monalphabetic substitution — breakable by hand.</li>}
                {cipher === 'vigenere' && <li>• Polyalphabetic but still vulnerable to frequency analysis.</li>}
                {['binary', 'morse', 'base64'].includes(cipher) && <li>• Not encryption at all: an encoding with zero secrecy.</li>}
              </ul>
              <Divider />
              <div className="flex flex-wrap gap-1"><Tag tone="#28d8ea">{meta.group.toUpperCase()}</Tag><Tag tone="#f5b942">DEMO</Tag></div>
            </Panel>
          </div>
        </div>
      ) : (
        <Panel title="Cipher Comparison" icon={Binary} bodyClassName="p-0">
          <table className="data-table">
            <thead><tr><th>Cipher</th><th>Group</th><th>Key</th><th>Output preview</th><th>Strength</th></tr></thead>
            <tbody>
              {[
                { c: 'AES-256-GCM', g: 'modern', k: '256-bit random', out: 'q2v3n0R8hJXk…', s: 'strong' },
                { c: 'XOR stream', g: 'modern', k: 'Repeating text', out: '1f2c4a99b0', s: 'weak' },
                { c: 'Vigenère', g: 'classical', k: 'Word', out: 'Ztbc BXKUI', s: 'weak' },
                { c: 'Caesar', g: 'classical', k: 'Shift', out: 'Gur Une…', s: 'weak' },
                { c: 'Atbash', g: 'classical', k: 'None', out: 'HSZWLD', s: 'weak' },
                { c: 'ROT13', g: 'classical', k: 'None', out: 'Gur …', s: 'weak' },
                { c: 'Base64', g: 'encoding', k: 'None', out: 'VGhlIGhh…', s: 'none' },
                { c: 'Morse', g: 'encoding', k: 'None', out: '- .... .', s: 'none' },
                { c: 'Binary', g: 'encoding', k: 'None', out: '01010100…', s: 'none' },
              ].map((r) => (
                <tr key={r.c}>
                  <td className="mono text-[10px] text-ink">{r.c}</td>
                  <td className="text-[10px] text-ink-2">{r.g}</td>
                  <td className="text-[10px] text-ink-3">{r.k}</td>
                  <td className="mono text-[9px] text-ink-3">{r.out}</td>
                  <td><StatusPill value={r.s === 'strong' ? 'active' : r.s === 'weak' ? 'degraded' : 'low'} label={r.s.toUpperCase()} dot={false} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-line p-2">
            <InlineAlert tone="amber" title="Teaching scale only">
              The strength column is an illustrative ranking for education, not a security assessment.
            </InlineAlert>
          </div>
        </Panel>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Worked Example" icon={KeyRound}>
          <Doc label="AES KEYLESS DEMO">{`Plaintext : "meet at 22:00"
Algorithm : AES-256-GCM
Key       : random 32 bytes (ephemeral)
IV        : random 12 bytes
Output    : base64 ciphertext + tag

Run the workbench to see real output.
Key and IV stay in this tab and are never saved.`}</Doc>
        </Panel>
        <Panel title="Notes" icon={AlertTriangle}>
          <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
            <li>• Only encrypt demonstration text — never real secrets.</li>
            <li>• Keys and IVs live in component state and vanish on reload.</li>
            <li>• No ciphertext is uploaded or shared.</li>
            <li>• Classical ciphers are included to illustrate historical weaknesses.</li>
          </ul>
          <Divider />
          <div className="flex flex-wrap gap-1"><Tag tone="#38db91">NO NETWORK</Tag><Tag tone="#28d8ea">WEB CRYPTO</Tag><Tag tone="#f5b942">EPHEMERAL KEYS</Tag></div>
        </Panel>
      </div>

      <InlineAlert tone="cyan" title="Fictional scenario, genuine maths">
        AES-GCM is executed for real in your browser. The story around it — harbour ledgers, meeting times — is invented.
      </InlineAlert>
    </Screen>
  )
}
