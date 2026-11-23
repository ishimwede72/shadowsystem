import { useState } from 'react'
import { Unlock, Copy, Check, ArrowRight, RefreshCw, Download, KeyRound, ShieldAlert, Sparkles } from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, Tabs, InlineAlert, Divider, Tag, Slider, Progress } from '@/components/ui'
import { Doc } from '@/components/ui/extras'
import { aesDecrypt, aesEncrypt, CAESAR, vigenere, atbash, rot13, xorDecipher, fromBinary, fromMorse, fromBase32ish, isCryptoAvailable } from '@/services/crypto'
import { downloadFile } from '@/lib/utils'

type Cipher = 'aes' | 'caesar' | 'vigenere' | 'atbash' | 'rot13' | 'xor' | 'binary' | 'morse' | 'base64'

export default function Decryption() {
  const [tab, setTab] = useState('manual')
  const [cipher, setCipher] = useState<Cipher>('aes')
  const [input, setInput] = useState('')
  const [keyHex, setKeyHex] = useState('')
  const [ivHex, setIvHex] = useState('')
  const [wordKey, setWordKey] = useState('SHADOW')
  const [shift, setShift] = useState(7)
  const [out, setOut] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [demo, setDemo] = useState<{ cipher: string; iv: string; key: string; ciphertext: string } | null>(null)

  const run = async () => {
    setError(null)
    setBusy(true)
    try {
      if (!input.trim()) throw new Error('Enter ciphertext first.')
      if (cipher === 'aes') {
        if (!keyHex || !ivHex) throw new Error('AES-GCM requires the key and IV produced during encryption.')
        setOut(await aesDecrypt(input.trim(), ivHex.trim(), keyHex.trim()))
      } else if (cipher === 'xor') setOut(xorDecipher(input.trim(), wordKey || 'KEY'))
      else if (cipher === 'caesar') setOut(CAESAR.decrypt(input, shift))
      else if (cipher === 'vigenere') setOut(vigenere(input, wordKey || 'KEY', 'dec'))
      else if (cipher === 'atbash') setOut(atbash(input))
      else if (cipher === 'rot13') setOut(rot13(input))
      else if (cipher === 'binary') setOut(fromBinary(input))
      else if (cipher === 'morse') setOut(fromMorse(input))
      else setOut(fromBase32ish(input.trim()))
    } catch (e) {
      setOut('')
      setError(e instanceof Error ? e.message : 'Decryption failed — check the key, IV or format.')
    }
    setBusy(false)
  }

  const makeDemo = async () => {
    const text = 'Demonstration payload — harbour ledger entry 22:00. Simulated only.'
    try {
      const r = await aesEncrypt(text, 256)
      setDemo({ cipher: r.cipher, iv: r.iv, key: r.key, ciphertext: text })
      setInput(r.cipher)
      setKeyHex(r.key)
      setIvHex(r.iv)
      setCipher('aes')
      setTab('manual')
      setOut('')
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create demo payload')
    }
  }

  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); setCopied(true); window.setTimeout(() => setCopied(false), 1400) } catch { /* noop */ } }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CRYPTOGRAPHY · DECRYPTION"
        title="Decryption Workbench"
        subtitle="Reverse locally produced ciphertext. Nothing is brute-forced against a real system or service."
        icon={Unlock}
        meta={
          <>
            <span className="badge badge-cyan">{cipher.toUpperCase()}</span>
            <span className="badge badge-green">LOCAL</span>
            <span className="badge badge-amber">KNOWN KEY ONLY</span>
            <span className="badge badge-grey">{isCryptoAvailable() ? 'WEB CRYPTO READY' : 'UNAVAILABLE'}</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={makeDemo}><Sparkles size={11} /> Load demo pair</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={run} disabled={busy}><Unlock size={11} /> {busy ? 'Working…' : 'Decrypt'}</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Cipher" value={cipher.toUpperCase()} icon={Unlock} accent="cyan" />
        <StatCard label="Input" value={`${input.length} chars`} icon={KeyRound} accent="blue" />
        <StatCard label="Result" value={out ? 'RECOVERED' : 'IDLE'} icon={ShieldAlert} accent={out ? 'green' : 'amber'} />
        <StatCard label="Brute force" value="Disabled" icon={ShieldAlert} accent="red" />
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Ciphertext" icon={KeyRound} actions={<Tabs size="sm" className="border-0" value={tab} onChange={setTab} tabs={[{ id: 'manual', label: 'Manual' }, { id: 'demo', label: 'Demo pair' }]} />}>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} className="field min-h-[130px] break-all font-terminal text-[10.5px]" placeholder="Paste ciphertext or hex output…" />
          <Divider />
          <Select
            label="Cipher"
            value={cipher}
            onChange={(v) => { setCipher(v); setOut(''); }}
            options={[
              { value: 'aes', label: 'AES-256-GCM (needs key + IV)' },
              { value: 'xor', label: 'XOR (hex, needs key)' },
              { value: 'caesar', label: 'Caesar shift' },
              { value: 'vigenere', label: 'Vigenère' },
              { value: 'atbash', label: 'Atbash' },
              { value: 'rot13', label: 'ROT13' },
              { value: 'binary', label: 'Binary' },
              { value: 'morse', label: 'Morse' },
              { value: 'base64', label: 'Base64' },
            ]}
          />
          <div className="mt-2 grid gap-2">
            {cipher === 'aes' && (
              <>
                <div>
                  <label className="field-label" htmlFor="k">Key (hex)</label>
                  <input id="k" value={keyHex} onChange={(e) => setKeyHex(e.target.value)} className="field font-terminal text-[10px]" placeholder="64 hex characters" />
                </div>
                <div>
                  <label className="field-label" htmlFor="iv">IV (hex)</label>
                  <input id="iv" value={ivHex} onChange={(e) => setIvHex(e.target.value)} className="field font-terminal text-[10px]" placeholder="24 hex characters" />
                </div>
              </>
            )}
            {(cipher === 'vigenere' || cipher === 'xor') && (
              <div>
                <label className="field-label" htmlFor="wk">Key</label>
                <input id="wk" value={wordKey} onChange={(e) => setWordKey(e.target.value)} className="field" placeholder="SHADOW" />
              </div>
            )}
            {cipher === 'caesar' && <Slider label="Shift" min={1} max={25} value={shift} onChange={setShift} />}
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Recovered Plaintext" icon={Unlock} actions={out ? (
            <div className="flex gap-1">
              <button type="button" className="btn btn-sm" onClick={() => copy(out)}>{copied ? <Check size={10} className="text-green" /> : <Copy size={10} />}</button>
              <button type="button" className="btn btn-sm" onClick={() => downloadFile('shadow-decrypted.txt', out, 'text/plain')}><Download size={10} /></button>
            </div>
          ) : undefined}>
            {out ? (
              <div className="terminal-window max-h-[220px] overflow-auto p-2">
                <p className="whitespace-pre-wrap break-words font-terminal text-[10.5px] leading-relaxed text-[#79f0b9]">{out}</p>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Unlock size={22} className="mx-auto text-ink-3" />
                <p className="mt-1.5 text-[10.5px] text-ink-3">Decrypt to reveal the demonstration plaintext.</p>
              </div>
            )}
            {error && <InlineAlert tone="red" title="Cannot decrypt">{error}</InlineAlert>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button type="button" className="btn btn-sm" onClick={run}><RefreshCw size={10} /> Retry</button>
              <button type="button" className="btn btn-sm" onClick={() => { setInput(''); setOut(''); setError(null) }}>Clear</button>
              {out && <button type="button" className="btn btn-sm" onClick={() => { setInput(out); setCipher('atbash'); setOut('') }}><ArrowRight size={10} /> Re-encrypt</button>}
            </div>
          </Panel>

          {demo && (
            <Panel title="Last Demo Pair" icon={KeyRound} actions={<StatusPill value="active" label="EPHEMERAL" />}>
              <Doc label="DEMO MATERIAL">{`plaintext : ${demo.ciphertext}
key (hex) : ${demo.key}
iv  (hex) : ${demo.iv}
cipher    : ${demo.cipher.slice(0, 44)}…

These values were generated in this tab and
are not stored anywhere.`}</Doc>
            </Panel>
          )}

          <Panel title="Decryption Notes" icon={ShieldAlert}>
            <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
              <li>• Only reverse material you produced here.</li>
              <li>• AES-GCM fails closed if the key or IV is wrong (integrity check).</li>
              <li>• No brute-force, dictionary or rainbow-table attack is provided.</li>
              <li>• Encodings such as Base64 and Morse are not encryption.</li>
            </ul>
            <Divider />
            <div className="flex flex-wrap gap-1"><Tag tone="#38db91">NO NETWORK</Tag><Tag tone="#28d8ea">KNOWN-KEY ONLY</Tag></div>
          </Panel>
        </div>
      </div>

      <Panel title="Supported Formats" icon={KeyRound} bodyClassName="p-0">
        <table className="data-table">
          <thead><tr><th>Cipher</th><th>Input format</th><th>Secret required</th><th>Integrity check</th></tr></thead>
          <tbody>
            <tr><td className="mono text-[10px] text-ink">AES-256-GCM</td><td className="text-[10px]">Base64 ciphertext</td><td className="text-[10px]">Key + IV (hex)</td><td className="text-[10px] text-green">Yes (GCM tag)</td></tr>
            <tr><td className="mono text-[10px] text-ink">XOR stream</td><td className="text-[10px]">Hex</td><td className="text-[10px]">Repeating key</td><td className="text-[10px] text-ink-3">No</td></tr>
            <tr><td className="mono text-[10px] text-ink">Vigenère</td><td className="text-[10px]">Letters</td><td className="text-[10px]">Word</td><td className="text-[10px] text-ink-3">No</td></tr>
            <tr><td className="mono text-[10px] text-ink">Caesar / ROT13 / Atbash</td><td className="text-[10px]">Letters</td><td className="text-[10px]">Shift / none</td><td className="text-[10px] text-ink-3">No</td></tr>
            <tr><td className="mono text-[10px] text-ink">Binary / Morse / Base64</td><td className="text-[10px]">Encoded text</td><td className="text-[10px]">None</td><td className="text-[10px] text-ink-3">No</td></tr>
          </tbody>
        </table>
      </Panel>

      <Progress value={out ? 100 : 0} label="Recovery status" showValue color="#38db91" />
      <InlineAlert tone="cyan" title="Local reversal only">
        Decryption happens in this tab using material you supply. There is no attempt to break, guess or attack any system.
      </InlineAlert>
    </Screen>
  )
}

