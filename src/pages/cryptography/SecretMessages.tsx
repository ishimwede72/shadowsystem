import { useMemo, useState } from 'react'
import { MessageSquareCode, Copy, Check, RefreshCw, ArrowRightLeft, Radio, ShieldAlert, Download, Sparkles } from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, KeyValue, InlineAlert, Divider, Tag, Tabs, Slider, EmptyState } from '@/components/ui'
import { Doc } from '@/components/ui/extras'
import {
  CAESAR, vigenere, atbash, rot13, xorCipher, xorDecipher, toBinary, fromBinary,
  toMorse, fromMorse, toBase32ish, fromBase32ish,
} from '@/services/crypto'
import { downloadFile } from '@/lib/utils'

type Mode = 'caesar' | 'vigenere' | 'atbash' | 'rot13' | 'xor' | 'binary' | 'morse' | 'base64'

const encodeCipher = (t: string, m: Mode, shift: number, word: string) => {
  switch (m) {
    case 'caesar': return CAESAR.encrypt(t, shift)
    case 'vigenere': return vigenere(t, word, 'enc')
    case 'atbash': return atbash(t)
    case 'rot13': return rot13(t)
    case 'xor': return xorCipher(t, word || 'KEY')
    case 'binary': return toBinary(t)
    case 'morse': return toMorse(t)
    case 'base64': return toBase32ish(t)
  }
}

export default function SecretMessages() {
  const [tab, setTab] = useState('lab')
  const [mode, setMode] = useState<Mode>('caesar')
  const [text, setText] = useState('The package moves at midnight. Trust only the lantern signal.')
  const [shift, setShift] = useState(9)
  const [word, setWord] = useState('LANTERN')
  const [copied, setCopied] = useState(false)
  const [inbox, setInbox] = useState<{ id: string; from: string; text: string; mode: Mode; ts: string }[]>([
    { id: 'MSG-7', from: 'HARBORMASTER', text: 'Cargo manifest verified. Proceed as planned.', mode: 'caesar', ts: new Date(Date.now() - 1_200_000).toISOString() },
    { id: 'MSG-6', from: 'CINDER', text: 'Lantern signal confirmed at the atrium.', mode: 'vigenere', ts: new Date(Date.now() - 5_400_000).toISOString() },
    { id: 'MSG-5', from: 'NIGHTJAR', text: 'Route changed — use the eastern stairwell.', mode: 'atbash', ts: new Date(Date.now() - 12_000_000).toISOString() },
  ])
  const [selectedMsg, setSelectedMsg] = useState('MSG-7')

  const output = useMemo(
    () => encodeCipher(text, mode, shift, word),
    [text, mode, shift, word],
  )

  const swap = () => {
    setText(decode(output))
  }

  const decode = (t: string, m: Mode = mode) => {
    switch (m) {
      case 'caesar': return CAESAR.decrypt(t, shift)
      case 'vigenere': return vigenere(t, word, 'dec')
      case 'atbash': return atbash(t)
      case 'rot13': return rot13(t)
      case 'xor': return xorDecipher(t, word || 'KEY')
      case 'binary': return fromBinary(t)
      case 'morse': return fromMorse(t)
      case 'base64': return fromBase32ish(t)
    }
  }

  const message = inbox.find((m) => m.id === selectedMsg)

  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); setCopied(true); window.setTimeout(() => setCopied(false), 1400) } catch { /* noop */ } }

  const decryptMsg = (m: (typeof inbox)[number]) => {
    setMode(m.mode)
    setText(decode(m.text, m.mode))
    setTab('lab')
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CRYPTOGRAPHY · SECRET MESSAGES"
        title="Secret Messages"
        subtitle="Playful encoders for invented narrative traffic — plus a simulated decrypt inbox. Nothing is transmitted."
        icon={MessageSquareCode}
        meta={
          <>
            <span className="badge badge-cyan">{mode.toUpperCase()}</span>
            <span className="badge badge-grey">{inbox.length} MESSAGES</span>
            <span className="badge badge-green">LOCAL</span>
            <span className="badge badge-amber">FICTIONAL CHATTER</span>
          </>
        }
        actions={
          <>
            <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'lab', label: 'Encoder' }, { id: 'inbox', label: 'Inbox', count: inbox.length }]} />
            <button type="button" className="btn btn-sm btn-primary" onClick={() => setInbox((i) => [{ id: `MSG-${i.length + 5}`, from: ['CINDER', 'HARBORMASTER', 'GRAYFIN'][i.length % 3], text: text || 'Silent sample', mode, ts: new Date().toISOString() }, ...i])}><Sparkles size={11} /> File message</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Encoder" value={mode.toUpperCase()} icon={MessageSquareCode} accent="cyan" />
        <StatCard label="Messages filed" value={inbox.length} icon={Radio} accent="blue" />
        <StatCard label="Payload" value={`${text.length} chars`} icon={MessageSquareCode} accent="green" />
        <StatCard label="Outbound" value={0} icon={ShieldAlert} accent="red" />
      </div>

      {tab === 'lab' ? (
        <div className="grid gap-3 xl:grid-cols-2">
          <Panel title="Compose" icon={MessageSquareCode} actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => setText('')}>Clear</button>}>
            <textarea value={text} onChange={(e) => setText(e.target.value)} className="field min-h-[150px] font-terminal text-[11px] leading-relaxed" placeholder="Type a fictional message…" />
            <Divider />
            <div className="grid gap-2 sm:grid-cols-2">
              <Select
                label="Scheme"
                value={mode}
                onChange={(v) => setMode(v)}
                options={[
                  { value: 'caesar', label: 'Caesar shift' },
                  { value: 'vigenere', label: 'Vigenère' },
                  { value: 'atbash', label: 'Atbash' },
                  { value: 'rot13', label: 'ROT13' },
                  { value: 'xor', label: 'XOR (hex)' },
                  { value: 'binary', label: 'Binary' },
                  { value: 'morse', label: 'Morse' },
                  { value: 'base64', label: 'Base64' },
                ]}
              />
              {mode === 'caesar' && <Slider label="Shift" min={1} max={25} value={shift} onChange={setShift} />}
              {(mode === 'vigenere' || mode === 'xor') && (
                <div>
                  <label className="field-label" htmlFor="s-key">Key</label>
                  <input id="s-key" value={word} onChange={(e) => setWord(e.target.value)} className="field" />
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button type="button" className="btn btn-sm" onClick={() => setText('Meet at the harbour at 22:00. Bring the lantern.')}>Sample line</button>
              <button type="button" className="btn btn-sm" onClick={swap}><ArrowRightLeft size={10} /> Decode output</button>
              <button type="button" className="btn btn-sm" onClick={() => setText(encodeCipher(text, mode, shift, word))}><RefreshCw size={10} /> Encode twice</button>
            </div>
          </Panel>

          <div className="space-y-3">
            <Panel title="Encoded" icon={ShieldAlert} actions={output ? (
              <div className="flex gap-1">
                <button type="button" className="btn btn-sm" title={copied ? 'Copied' : 'Copy ciphertext'} aria-label={copied ? 'Copied' : 'Copy ciphertext'} onClick={() => copy(output)}>{copied ? <Check size={10} className="text-green" /> : <Copy size={10} />}</button>
                <button type="button" className="btn btn-sm" title="Download message" aria-label="Download message" onClick={() => downloadFile('shadow-secret-message.txt', `scheme: ${mode}\n\n${output}\n\nSIMULATED — no transmission occurred.`, 'text/plain')}><Download size={10} /></button>
              </div>
            ) : undefined}>
              {output ? (
                <div className="terminal-window max-h-[200px] overflow-auto p-2">
                  <p className="break-all font-terminal text-[11px] leading-relaxed text-[#79f0b9]">{output}</p>
                </div>
              ) : <EmptyState icon={MessageSquareCode} title="Nothing encoded" />}
              <Divider label="ROUND TRIP" />
              <div className="border border-line bg-bg p-2">
                <span className="mono text-[8px] uppercase tracking-widest text-ink-3">DECODED</span>
                <p className="mt-0.5 break-words font-terminal text-[10px] text-ink-2">{decode(output) || '—'}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1"><Tag tone="#28d8ea">{mode.toUpperCase()}</Tag><Tag tone="#f5b942">NO TRANSMISSION</Tag></div>
            </Panel>

            <Panel title="Scheme Notes" icon={Radio}>
              <Doc label="SCHEME">{schemeDoc(mode)}</Doc>
            </Panel>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-[320px_1fr]">
          <Panel title="Traffic Inbox" icon={Radio} bodyClassName="p-0">
            <ul className="divide-y divide-line-soft">
              {inbox.map((m) => (
                <li key={m.id}>
                  <button type="button" onClick={() => setSelectedMsg(m.id)} data-selected={selectedMsg === m.id} className="w-full px-2.5 py-2 text-left hover:bg-elevated">
                    <div className="flex items-center justify-between">
                      <span className="mono text-[9px] text-[var(--accent)]">{m.from}</span>
                      <span className="badge badge-grey">{m.mode}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-ink-2">{m.text}</p>
                    <p className="font-mono text-[8px] text-ink-3">{new Date(m.ts).toISOString().slice(11, 16)}Z · simulated</p>
                  </button>
                </li>
              ))}
              {inbox.length === 0 && <li className="px-2.5 py-3 text-[10px] text-ink-3">Inbox is empty.</li>}
            </ul>
          </Panel>

          <Panel title={message ? `${message.from} · ${message.id}` : 'Message'} icon={MessageSquareCode} actions={message && <StatusPill value="active" label={message.mode.toUpperCase()} />}>
            {message ? (
              <div className="space-y-3">
                <div className="border border-line bg-bg p-2">
                  <p className="label-xs mb-1">CIPHERTEXT</p>
                  <p className="break-all font-terminal text-[10.5px] text-[#79f0b9]">{encodeText(message.text, message.mode)}</p>
                </div>
                <div className="border border-line bg-bg p-2">
                  <p className="label-xs mb-1">PLAINTEXT (DEMO REVEAL)</p>
                  <p className="font-terminal text-[10.5px] text-ink-2">{message.text}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" className="btn btn-sm" onClick={() => decryptMsg(message)}><ArrowRightLeft size={10} /> Load into encoder</button>
                  <button type="button" className="btn btn-sm" onClick={() => copy(encodeText(message.text, message.mode))}><Copy size={10} /> Copy ciphertext</button>
                  <button type="button" className="btn btn-sm" onClick={() => setInbox((i) => i.filter((x) => x.id !== message.id))}>Archive</button>
                </div>
                <InlineAlert tone="cyan" title="All chatter is fictional">
                  Senders, timestamps and content are invented for the demo. No message was received from anywhere.
                </InlineAlert>
                <KeyValue
                  items={[
                    { k: 'Scheme', v: message.mode.toUpperCase() },
                    { k: 'Cipher length', v: `${encodeText(message.text, message.mode).length} chars` },
                    { k: 'Plain length', v: `${message.text.length} chars` },
                    { k: 'Source', v: 'SIMULATED INBOX' },
                  ]}
                />
              </div>
            ) : <EmptyState icon={MessageSquareCode} title="Select a message" />}
          </Panel>
        </div>
      )}

      <InlineAlert tone="amber" title="No real messaging">
        These encoders are educational toys. Messages never leave the page, and no recipient, channel or network exists.
      </InlineAlert>
    </Screen>
  )
}

function encodeText(text: string, mode: Mode): string {
  switch (mode) {
    case 'caesar': return CAESAR.encrypt(text, 9)
    case 'vigenere': return vigenere(text, 'LANTERN', 'enc')
    case 'atbash': return atbash(text)
    case 'rot13': return rot13(text)
    case 'xor': return xorCipher(text, 'LANTERN')
    case 'binary': return toBinary(text)
    case 'morse': return toMorse(text)
    case 'base64': return toBase32ish(text)
    default: return text
  }
}

function schemeDoc(mode: Mode): string {
  switch (mode) {
    case 'caesar': return `CAESAR SHIFT\nEach letter moves forward by a fixed\nnumber of places. Trivially breakable\nby trying 25 shifts.`
    case 'vigenere': return `VIGENÈRE\nA repeating keyword provides varying\nshifts. Stronger than Caesar, still\nvulnerable to frequency analysis.`
    case 'atbash': return `ATBASH\nA←→Z substitution. A monoalphabetic\ncipher that offers no real secrecy.`
    case 'rot13': return `ROT13\nCaesar with shift 13. Self-inverse:\napplying it twice restores the text.`
    case 'xor': return `XOR\nBytes are combined with a repeating\nkey. Shown as hex. Short keys leak\npatterns quickly.`
    case 'binary': return `BINARY\nUTF-8 bytes written as 8-bit groups.\nAn encoding, not encryption.`
    case 'morse': return `MORSE\nDots and dashes; slashes separate\nwords. Encoding only, no secrecy.`
    case 'base64': return `BASE64\nThree bytes become four text chars.\nUsed for transport, never secrecy.`
  }
}
