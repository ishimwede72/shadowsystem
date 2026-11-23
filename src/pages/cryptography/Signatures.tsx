import { useState } from 'react'
import { FileSignature, Copy, Check, ShieldCheck, CircleX, CircleCheck, KeyRound, Download, RefreshCw, Sparkles } from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Tabs, KeyValue, InlineAlert, Divider, Tag, Progress, EmptyState } from '@/components/ui'
import { Doc } from '@/components/ui/extras'
import { ecdsaSign, ecdsaVerify, isCryptoAvailable } from '@/services/crypto'
import { downloadFile } from '@/lib/utils'
import { AreasAndSignatures } from '@/pages/cryptography/internal'

export default function Signatures() {
  const [tab, setTab] = useState('sign')
  const [text, setText] = useState('SHADOW SYSTEMS authorisation token — demo payload 001.')
  const [keyPair, setKeyPair] = useState<{ signature: string; publicKey: string; fingerprint: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const [verifyText, setVerifyText] = useState('')
  const [verifySig, setVerifySig] = useState('')
  const [verifyKey, setVerifyKey] = useState('')
  const [verifyOk, setVerifyOk] = useState<null | boolean>(null)

  const sign = async () => {
    setBusy(true)
    try {
      const r = await ecdsaSign(text)
      setKeyPair(r)
      setVerifyText(text)
      setVerifySig(r.signature)
      setVerifyKey(r.publicKey)
      setVerifyOk(null)
    } finally {
      setBusy(false)
    }
  }

  const verify = async () => {
    setBusy(true)
    try { setVerifyOk(await ecdsaVerify(verifyText, verifySig, verifyKey)) } finally { setBusy(false) }
  }

  const copy = async (k: string, v: string) => { try { await navigator.clipboard.writeText(v); setCopied(k); window.setTimeout(() => setCopied(null), 1400) } catch { /* noop */ } }

  const exportSig = () => {
    if (!keyPair) return
    downloadFile('shadow-signature.json', JSON.stringify({ algorithm: 'ECDSA P-256 (SHA-256)', payload: text, ...keyPair, disclaimer: 'SIMULATED DEMO SIGNATURE' }, null, 2), 'application/json')
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CRYPTOGRAPHY · SIGNATURES"
        title="Digital Signatures"
        subtitle="Genuine ECDSA P-256 signing and verification, performed locally for demonstration payloads."
        icon={FileSignature}
        meta={
          <>
            <span className="badge badge-cyan">ECDSA P-256</span>
            <span className="badge badge-green">LOCAL</span>
            <span className="badge badge-grey">{keyPair ? 'KEY CONSTRUCTED' : 'NO KEY YET'}</span>
            <span className="badge badge-amber">{isCryptoAvailable() ? 'WEB CRYPTO READY' : 'UNAVAILABLE'}</span>
          </>
        }
        actions={
          <>
            <Tabs size="sm" value={tab} onChange={setTab} tabs={[{ id: 'sign', label: 'Sign' }, { id: 'verify', label: 'Verify' }]} />
            <button type="button" className="btn btn-sm btn-primary" onClick={sign} disabled={busy || !text}><FileSignature size={11} /> {busy ? 'Working…' : 'Sign payload'}</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Algorithm" value="ECDSA" icon={FileSignature} accent="cyan" />
        <StatCard label="Curve" value="P-256" icon={KeyRound} accent="blue" />
        <StatCard label="Signature" value={keyPair ? 'READY' : '—'} icon={ShieldCheck} accent={keyPair ? 'green' : 'amber'} />
        <StatCard label="Verification" value={verifyOk === null ? '—' : verifyOk ? 'VALID' : 'INVALID'} icon={verifyOk === null ? ShieldCheck : verifyOk ? CircleCheck : CircleX} accent={verifyOk === null ? 'cyan' : verifyOk ? 'green' : 'red'} />
      </div>

      {tab === 'sign' ? (
        <div className="grid gap-3 xl:grid-cols-2">
          <Panel title="Payload to Sign" icon={FileSignature}>
            <textarea value={text} onChange={(e) => { setText(e.target.value); setVerifyOk(null) }} className="field min-h-[170px] font-terminal text-[10.5px] leading-relaxed" placeholder="Authorisation text…" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button type="button" className="btn btn-sm" onClick={() => setText(`AUTH ${new Date().toISOString()} — simulated clearance token`)}><Sparkles size={10} /> Generate token text</button>
              <button type="button" className="btn btn-sm" onClick={sign}><FileSignature size={10} /> Sign</button>
            </div>
            <Divider />
            <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
              <li>• A fresh P-256 key pair is created for each signature.</li>
              <li>• The signature covers exactly the text above.</li>
              <li>• Private key never leaves the browser tab.</li>
            </ul>
          </Panel>

          <div className="space-y-3">
            <Panel title="Signature Output" icon={KeyRound} actions={keyPair ? <StatusPill value="active" label="SIGNED" /> : undefined}>
              {keyPair ? (
                <>
                  <div className="space-y-2">
                    <div className="border border-line bg-bg p-2">
                      <div className="flex items-center justify-between">
                        <span className="mono text-[8.5px] uppercase tracking-widest text-ink-3">SIGNATURE (DER HEX)</span>
                        <button type="button" className="btn btn-sm !px-1.5" onClick={() => copy('sig', keyPair.signature)}>{copied === 'sig' ? <Check size={9} className="text-green" /> : <Copy size={9} />}</button>
                      </div>
                      <p className="mt-0.5 break-all font-terminal text-[8.5px] leading-relaxed text-[#79f0b9]">{keyPair.signature}</p>
                    </div>
                    <div className="border border-line bg-bg p-2">
                      <div className="flex items-center justify-between">
                        <span className="mono text-[8.5px] uppercase tracking-widest text-ink-3">PUBLIC KEY (BASE64)</span>
                        <button type="button" className="btn btn-sm !px-1.5" onClick={() => copy('pub', keyPair.publicKey)}>{copied === 'pub' ? <Check size={9} className="text-green" /> : <Copy size={9} />}</button>
                      </div>
                      <p className="mt-0.5 break-all font-terminal text-[8.5px] leading-relaxed text-ink-2">{keyPair.publicKey}</p>
                    </div>
                    <KeyValue cols={1} items={[{ k: 'Fingerprint (SHA-256)', v: keyPair.fingerprint }]} />
                  </div>
                  <div className="mt-2 flex gap-1">
                    <button type="button" className="btn btn-sm flex-1" onClick={() => setTab('verify')}><ShieldCheck size={10} /> Go verify</button>
                    <button type="button" className="btn btn-sm flex-1" onClick={exportSig}><Download size={10} /> Export</button>
                    <button type="button" className="btn btn-sm" onClick={sign}><RefreshCw size={10} /></button>
                  </div>
                </>
              ) : (
                <EmptyState icon={FileSignature} title="Nothing signed yet" message="Press “Sign payload” to create a real ECDSA signature over the text." action={<button type="button" className="btn btn-sm btn-primary" onClick={sign}><FileSignature size={10} /> Sign now</button>} />
              )}
            </Panel>

            <Panel title="How it Works" icon={ShieldCheck}>
              <Doc label="ECDSA P-256">{`1. generate ephemeral key pair (P-256)
2. hash payload + sign with SHA-256
3. export public key (raw base64)
4. anyone can verify with the public key

The signature proves the payload was not
altered after signing.

This demo discards the private key after signing.`}</Doc>
            </Panel>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          <Panel title="Verify a Signature" icon={ShieldCheck}>
            <div className="space-y-2">
              <div>
                <label className="field-label" htmlFor="v-payload">Payload</label>
                <textarea id="v-payload" value={verifyText} onChange={(e) => { setVerifyText(e.target.value); setVerifyOk(null) }} className="field min-h-[90px] font-terminal text-[10px]" />
              </div>
              <div>
                <label className="field-label" htmlFor="v-sig">Signature (hex)</label>
                <input id="v-sig" value={verifySig} onChange={(e) => { setVerifySig(e.target.value); setVerifyOk(null) }} className="field font-terminal text-[9px]" />
              </div>
              <div>
                <label className="field-label" htmlFor="v-key">Public key (base64)</label>
                <input id="v-key" value={verifyKey} onChange={(e) => { setVerifyKey(e.target.value); setVerifyOk(null) }} className="field font-terminal text-[9px]" />
              </div>
              <div className="flex gap-1.5">
                <button type="button" className="btn btn-primary flex-1" onClick={verify} disabled={busy || !verifyText || !verifySig || !verifyKey}><ShieldCheck size={11} /> Verify</button>
                <button type="button" className="btn" onClick={() => { setVerifyText(text); setVerifySig(keyPair?.signature ?? ''); setVerifyKey(keyPair?.publicKey ?? ''); setVerifyOk(null) }}>Load signed</button>
              </div>
              {verifyOk !== null && (
                <div className={`flex items-center gap-2 border p-2 ${verifyOk ? 'border-[#1b6349] bg-[#0a2a20] text-[#79f0b9]' : 'border-[#6e2633] bg-[#2a1016] text-[#ff9aa6]'}`}>
                  {verifyOk ? <CircleCheck size={14} /> : <CircleX size={14} />}
                  <span className="text-[11px] uppercase tracking-widest">{verifyOk ? 'Signature valid' : 'Signature invalid'}</span>
                </div>
              )}
              <InlineAlert tone="cyan" title="Try tampering">
                After verifying once, change a single character in the payload and verify again — it will fail.
              </InlineAlert>
            </div>
          </Panel>

          <div className="space-y-3">
            <Panel title="Verification Stats" icon={KeyRound}>
              <KeyValue
                items={[
                  { k: 'Algorithm', v: 'ECDSA P-256 / SHA-256' },
                  { k: 'Payload bytes', v: String(new TextEncoder().encode(verifyText).length) },
                  { k: 'Signature bytes', v: String(Math.floor(verifySig.replace(/[^0-9a-f]/gi, '').length / 2)) },
                  { k: 'Public key bytes', v: String(Math.floor((verifyKey.length * 3) / 4)) },
                  { k: 'Result', v: verifyOk === null ? 'NOT RUN' : verifyOk ? 'VALID' : 'INVALID' },
                ]}
              />
              <Divider />
              <Progress value={verifyOk === null ? 0 : verifyOk ? 100 : 35} label="Verification confidence" showValue color={verifyOk ? '#38db91' : verifyOk === false ? '#f14e61' : '#28d8ea'} />
            </Panel>
            <Panel title="Areas & Signatures" icon={FileSignature}>
              <AreasAndSignatures />
            </Panel>
            <Panel title="Safety" icon={ShieldCheck}>
              <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
                <li>• Keys and signatures are ephemeral demo material.</li>
                <li>• Do not reuse these keys for anything real.</li>
                <li>• Nothing is transmitted or persisted.</li>
              </ul>
              <div className="mt-2 flex flex-wrap gap-1"><Tag tone="#28d8ea">EPHEMERAL</Tag><Tag tone="#38db91">LOCAL</Tag></div>
            </Panel>
          </div>
        </div>
      )}

      <InlineAlert tone="amber" title="Demo signatures only">
        ECDSA works for real here, but these keys and signatures protect nothing outside this page.
      </InlineAlert>
    </Screen>
  )
}
