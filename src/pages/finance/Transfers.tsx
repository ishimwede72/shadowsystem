import { useMemo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, ArrowRightLeft, Check, ChevronLeft, ChevronRight, CircleAlert,
  Clock, Download, FileText, Landmark, Send, ShieldCheck, X,
} from 'lucide-react'
import { Panel, PageHeader, Screen, KeyValue, StatusPill, Progress, InlineAlert, Divider, EmptyState, ConfirmationCard, SimulatedNotice } from '@/components/ui'
import { useEngine, selectOperator } from '@/services/engine'
import { audio } from '@/services/audio'
import { usePrefs } from '@/services/prefs'
import { receiptBlob } from '@/services/receipt'
import { cn, fmtDateTime, fmtMoney, downloadFile } from '@/lib/utils'
import type { Transaction } from '@/types'

const STEPS = ['Source account', 'Recipient', 'Amount', 'Currency', 'Description', 'Review', 'Simulate']

const PROCESS_STAGES = [
  'INITIALIZING TRANSFER',
  'VALIDATING FICTIONAL ACCOUNT',
  'CALCULATING DEMONSTRATION FEES',
  'PROCESSING SIMULATED PAYMENT',
  'UPDATING SIMULATED BALANCE',
  'GENERATING REFERENCE',
]

type Outcome = 'completed' | 'declined' | 'pending' | 'cancelled'

export default function Transfers() {
  const navigate = useNavigate()
  const accounts = useEngine((s) => s.accounts)
  const banks = useEngine((s) => s.banks)
  const addTransaction = useEngine((s) => s.addTransaction)
  const updateTransaction = useEngine((s) => s.updateTransaction)
  const transactions = useEngine((s) => s.transactions)
  const operator = useEngine(selectOperator)
  const soundEnabled = usePrefs((s) => s.soundEnabled)

  const [step, setStep] = useState(0)
  const [sourceId, setSourceId] = useState(accounts[0]?.id ?? '')
  const [recipient, setRecipient] = useState('')
  const [recipientId, setRecipientId] = useState(accounts[1]?.id ?? '')
  const [savedRecipient, setSavedRecipient] = useState('')
  const [amount, setAmount] = useState('25000')
  const [currency, setCurrency] = useState('USD')
  const [note, setNote] = useState('Simulated treasury settlement')
  const [channel, setChannel] = useState<Transaction['channel']>('SWIFT')
  const [outcome, setOutcome] = useState<Outcome | 'auto'>('auto')
  const [running, setRunning] = useState(false)
  const [stage, setStage] = useState(-1)
  const [result, setResult] = useState<Transaction | null>(null)
  const [history, setHistory] = useState<string[]>([])

  const source = accounts.find((a) => a.id === sourceId)
  const amountNum = Number(amount) || 0
  const fee = Math.round(amountNum * 0.0014 * 100) / 100
  const recipientOptions = useMemo(() => accounts.filter((a) => a.id !== sourceId), [accounts, sourceId])

  useEffect(() => {
    if (savedRecipient) {
      const a = accounts.find((x) => x.id === savedRecipient)
      if (a) {
        setRecipient(a.holder)
        setRecipientId(a.id)
        setCurrency(a.currency)
      }
    } else {
      const a = accounts.find((x) => x.id === recipientId)
      if (a) {
        setRecipient(a.holder)
        setCurrency(a.currency)
      }
    }
  }, [savedRecipient, recipientId, accounts])

  useEffect(() => {
    if (source) setCurrency(source.currency)
  }, [sourceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const canNext = () => {
    if (step === 0) return !!source
    if (step === 1) return recipient.trim().length > 1
    if (step === 2) return amountNum > 0 && amountNum <= (source?.available ?? 0) * 4
    return true
  }

  const run = () => {
    setRunning(true)
    setStage(-1)
    setHistory([])
    const outcomeResolved: Outcome =
      outcome !== 'auto' ? outcome : amountNum > (source?.available ?? 0) ? 'declined' : Math.random() > 0.85 ? 'pending' : 'completed'

    let i = 0
    const interval = setInterval(() => {
      setStage(i)
      setHistory((h) => [...h, PROCESS_STAGES[i]])
      if (soundEnabled) audio.play('keystroke')
      i++
      if (i >= PROCESS_STAGES.length) {
        clearInterval(interval)
        const tx = addTransaction({
          reference: `REF-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          sender: source?.holder ?? 'UNKNOWN',
          senderId: source?.id ?? 'ACC-0000',
          recipient,
          recipientId,
          amount: amountNum,
          currency,
          type: 'outgoing',
          channel,
          status: outcomeResolved,
          timestamp: new Date().toISOString(),
          fee,
          note,
        })
        setResult(tx)
        setRunning(false)
        if (soundEnabled) audio.play(outcomeResolved === 'completed' ? 'txnComplete' : 'txnReject')
      }
    }, 620)
  }

  const reset = () => {
    setStep(0)
    setResult(null)
    setStage(-1)
    setHistory([])
    setRunning(false)
    setAmount('25000')
  }

  const receiptText = (t: Transaction) => `SHADOW SYSTEMS — SIMULATED TRANSFER RECEIPT
=============================================
DEMONSTRATION RECORD — NO REAL FUNDS TRANSFERRED

Reference      : ${t.reference}
Transaction ID : ${t.id}
Status         : ${t.status.toUpperCase()}
Amount         : ${t.currency} ${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
Fee (sim)      : ${t.currency} ${t.fee.toFixed(2)}
Channel        : ${t.channel}
From           : ${t.sender} (${t.senderId})
To             : ${t.recipient} (${t.recipientId})
Timestamp      : ${fmtDateTime(t.timestamp)}
Note           : ${t.note}
Operator       : ${operator.callsign}

All institutions, holders and references are fictional.
Generated locally by the SHADOW SYSTEMS simulation engine.`

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="FINANCIAL SYSTEMS · TRANSFER SIMULATOR"
        title="Money Transfer Simulator"
        subtitle="A seven-step cinematic transfer sequence. Runs entirely against the internal demonstration ledger."
        icon={ArrowRightLeft}
        meta={
          <>
            <span className="badge badge-green">CLOSED LOOP</span>
            <span className="badge badge-grey">{accounts.length} ACCOUNTS AVAILABLE</span>
            <span className="badge badge-amber">NO REAL SETTLEMENT</span>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[1.35fr_1fr]">
        <Panel title="Transfer Workflow" icon={Send} subtitle={`Step ${step + 1} of 7 · ${STEPS[step]}`}>
          {/* stepper */}
          <div className="mb-4 flex items-center gap-1 overflow-x-auto">
            {STEPS.map((st, i) => (
              <div key={st} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => !running && !result && i <= step && setStep(i)}
                  className={cn(
                    'flex items-center gap-1 whitespace-nowrap border px-1.5 py-1 font-mono text-[8.5px] uppercase tracking-wider transition-colors',
                    i === step ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                      : i < step ? 'border-[#1b6349] text-green'
                      : 'border-line text-ink-3',
                  )}
                >
                  {i < step ? <Check size={8} /> : <span>{i + 1}</span>}
                  <span className="hidden sm:inline">{st}</span>
                </button>
                {i < STEPS.length - 1 && <ChevronRight size={10} className="shrink-0 text-ink-3" />}
              </div>
            ))}
          </div>

          {!result && (
            <div className="space-y-3">
              {step === 0 && (
                <div className="space-y-2">
                  <label className="field-label">Select fictional source account</label>
                  <div className="max-h-[300px] space-y-1.5 overflow-y-auto pr-1">
                    {accounts.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSourceId(a.id)}
                        className={cn(
                          'flex w-full items-center justify-between border px-2.5 py-2 text-left transition-colors',
                          sourceId === a.id ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-line-soft hover:bg-elevated',
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block text-[11.5px] text-ink">{a.holder}</span>
                          <span className="block font-mono text-[9px] text-ink-3">{a.id} · {banks.find((b) => b.id === a.bankId)?.code} · {a.category}</span>
                        </span>
                        <span className="text-right">
                          <span className="mono block text-[11px] tabular text-green">{fmtMoney(a.available, a.currency, true)}</span>
                          <span className="mono block text-[8.5px] text-ink-3">AVAILABLE</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="saved-recipient">Saved demo recipient</label>
                    <div className="relative">
                      <select id="saved-recipient" className="field appearance-none" value={savedRecipient} onChange={(e) => { setSavedRecipient(e.target.value); if (!e.target.value) return }}>
                        <option value="">— Manual entry —</option>
                        {recipientOptions.map((a) => (
                          <option key={a.id} value={a.id}>{a.holder} · {a.id}</option>
                        ))}
                      </select>
                      <ChevronRight size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-ink-3" />
                    </div>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="recipient-name">Recipient name (fictional)</label>
                    <input id="recipient-name" className="field" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. Katarina Lindqvist" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label" htmlFor="recipient-acct">Recipient account reference</label>
                    <input id="recipient-acct" className="field" value={recipientId} onChange={(e) => setRecipientId(e.target.value)} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="amount">Transfer amount</label>
                    <input id="amount" type="number" min="1" className="field text-base" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {[5000, 25000, 100000, 250000].map((v) => (
                        <button key={v} type="button" className="badge badge-grey hover:border-[var(--accent)] hover:text-ink" onClick={() => setAmount(String(v))}>
                          {fmtMoney(v, currency, true)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="channel">Payment channel</label>
                    <select id="channel" className="field" value={channel} onChange={(e) => setChannel(e.target.value as Transaction['channel'])}>
                      {['SWIFT', 'SEPA', 'WIRE', 'ACH', 'CRYPTO', 'INTERNAL'].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <p className="mt-1.5 font-mono text-[9px] text-ink-3">SIMULATED FEE ≈ {fmtMoney(fee, currency)} (0.14%)</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="label-xs mb-1">Source liquidity check</p>
                    <Progress value={Math.min(100, (amountNum / Math.max(1, source?.available ?? 1)) * 100)} color={amountNum > (source?.available ?? 0) ? 'var(--color-red)' : 'var(--color-green)'} showValue />
                    {amountNum > (source?.available ?? 0) && (
                      <p className="mt-1 flex items-center gap-1 font-mono text-[9px] text-red"><CircleAlert size={9} /> Exceeds simulated available balance — likely decline.</p>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <label className="field-label">Select fictional currency</label>
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                    {['USD', 'EUR', 'GBP', 'CHF', 'SGD', 'AED', 'JPY', 'CAD'].map((c) => (
                      <button key={c} type="button" onClick={() => setCurrency(c)} className={cn('border px-2 py-2 font-mono text-[11px]', currency === c ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-line-soft text-ink-2 hover:bg-elevated')}>
                        {c}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 font-mono text-[9px] text-ink-3">No FX conversion occurs — this is a display currency only.</p>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <div>
                    <label className="field-label" htmlFor="note">Optional description</label>
                    <textarea id="note" className="field min-h-[70px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reference note for the simulated transfer" />
                  </div>
                  <div>
                    <label className="field-label">Simulated outcome</label>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                      {([['auto', 'Automatic'], ['completed', 'Completed'], ['declined', 'Declined'], ['pending', 'Pending'], ['cancelled', 'Cancelled']] as const).map(([v, l]) => (
                        <button key={v} type="button" onClick={() => setOutcome(v as Outcome | 'auto')} className={cn('border px-1.5 py-1.5 font-mono text-[9px] uppercase tracking-wider', outcome === v ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-line-soft text-ink-3 hover:bg-elevated')}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-2">
                  <div className="border border-line bg-[#0b1119] p-3">
                    <div className="flex items-baseline justify-between border-b border-line pb-2">
                      <div>
                        <p className="label-xs">TRANSFER AMOUNT</p>
                        <p className="stat-value text-2xl text-ink">{fmtMoney(amountNum, currency)}</p>
                      </div>
                      <span className="badge badge-amber">SIMULATED</span>
                    </div>
                    <div className="mt-2">
                      <KeyValue
                        items={[
                          { k: 'From', v: `${source?.holder} (${sourceId})` },
                          { k: 'To', v: `${recipient} (${recipientId})` },
                          { k: 'Channel', v: channel },
                          { k: 'Demo fee', v: fmtMoney(fee, currency) },
                          { k: 'Net debit', v: fmtMoney(amountNum + fee, currency) },
                          { k: 'Description', v: note || '—' },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 border border-[#6d5320] bg-[#2a2110] px-2.5 py-2">
                    <CircleAlert size={12} className="mt-0.5 shrink-0 text-amber" />
                    <p className="text-[10.5px] leading-relaxed text-[#ffd489]">
                      This transfer will only update the internal demonstration ledger. Nothing is sent to a bank, payment
                      processor or blockchain.
                    </p>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-3">
                  {!running && stage < 0 && (
                    <button type="button" className="btn btn-primary w-full py-3" onClick={run}>
                      <ShieldCheck size={13} /> RUN SIMULATION
                    </button>
                  )}
                  {(running || stage >= 0) && (
                    <div className="terminal-window p-3">
                      <div className="flex items-center justify-between border-b border-[#1c2a36] pb-1.5">
                        <span className="term text-[10px] uppercase tracking-widest text-[#79f0b9]">transfer-simulator.log</span>
                        <span className="term text-[9px] text-ink-3">{running ? 'PROCESSING' : 'READY'}</span>
                      </div>
                      <div className="mt-2 min-h-[140px] space-y-1">
                        {PROCESS_STAGES.map((s, i) => (
                          <div key={s} className={cn('flex items-center gap-2 term text-[10.5px]', i <= stage ? 'text-[#79f0b9]' : 'text-ink-3/40')}>
                            <span>{i <= stage ? '✔' : '·'}</span>
                            <span>{s}…</span>
                            {i === stage && running && <span className="animate-pulse">▌</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <ConfirmationCard
                dense
                tone={result.status === 'completed' ? 'success' : result.status === 'pending' ? 'pending' : result.status === 'cancelled' ? 'neutral' : 'failed'}
                title={
                  result.status === 'completed' ? 'Payment confirmed'
                    : result.status === 'declined' ? 'Payment declined'
                    : result.status === 'pending' ? 'Transaction pending'
                    : 'Transaction cancelled'
                }
                subtitle={`${result.sender} → ${result.recipient}`}
                rows={[
                  { label: 'Amount', value: fmtMoney(result.amount, result.currency), emphasis: true, mono: true },
                  { label: 'Date', value: fmtDateTime(result.timestamp) },
                  { label: 'Transaction ID', value: result.id, mono: true },
                  { label: 'Reference', value: result.reference, mono: true },
                  { label: 'Fee (simulated)', value: fmtMoney(result.fee, result.currency), mono: true },
                  { label: 'Channel', value: result.channel },
                ]}
                note="This is a demonstration receipt. No funds moved and no institution was contacted."
              />
              <SimulatedNotice>Simulated transfer · non-settling</SimulatedNotice>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn flex-1" onClick={() => {
                  const r = receiptBlob({
                    tone: result.status === 'completed' ? 'success' : result.status === 'pending' ? 'pending' : 'failed',
                    title: result.status === 'completed' ? 'Payment confirmed' : result.status === 'pending' ? 'Payment pending' : 'Payment declined',
                    subtitle: `${result.sender} → ${result.recipient}`,
                    amount: { value: result.amount, currency: result.currency },
                    reference: result.reference,
                    operator: operator.callsign,
                    rows: [
                      { label: 'Amount', value: fmtMoney(result.amount, result.currency), mono: true },
                      { label: 'Date', value: fmtDateTime(result.timestamp) },
                      { label: 'Transaction ID', value: result.id, mono: true },
                      { label: 'Reference', value: result.reference, mono: true },
                      { label: 'Fee (simulated)', value: fmtMoney(result.fee, result.currency), mono: true },
                      { label: 'Channel', value: result.channel },
                      { label: 'From', value: `${result.sender} (${result.senderId})` },
                      { label: 'To', value: `${result.recipient} (${result.recipientId})` },
                    ],
                    note: 'Every party, account and reference on this receipt is fictional.',
                  })
                  downloadFile(r.name, r.html, r.type)
                }}>
                  <Download size={11} /> Receipt
                </button>
                <button type="button" className="btn flex-1" onClick={() => navigate('/finance/transactions?q=' + result.id)}>
                  <FileText size={11} /> Ledger entry
                </button>
                <button type="button" className="btn btn-primary flex-1" onClick={reset}>
                  <ArrowRight size={11} /> New transfer
                </button>
              </div>
              {result.status === 'pending' && (
                <button
                  type="button"
                  className="btn w-full"
                  onClick={() => {
                    updateTransaction(result.id, { status: 'completed' })
                    setResult({ ...result, status: 'completed' })
                    if (soundEnabled) audio.play('txnComplete')
                  }}
                >
                  <Check size={11} /> Approve demo transfer (simulated)
                </button>
              )}
            </div>
          )}

          {!result && (
            <div className="space-y-3">
              {step === 0 && (
                <div className="space-y-2">
                  <label className="field-label">Select fictional source account</label>
                  <div className="max-h-[300px] space-y-1.5 overflow-y-auto pr-1">
                    {accounts.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSourceId(a.id)}
                        className={cn(
                          'flex w-full items-center justify-between border px-2.5 py-2 text-left transition-colors',
                          sourceId === a.id ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-line-soft hover:bg-elevated',
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block text-[11.5px] text-ink">{a.holder}</span>
                          <span className="block font-mono text-[9px] text-ink-3">{a.id} · {banks.find((b) => b.id === a.bankId)?.code} · {a.category}</span>
                        </span>
                        <span className="text-right">
                          <span className="mono block text-[11px] tabular text-green">{fmtMoney(a.available, a.currency, true)}</span>
                          <span className="mono block text-[8.5px] text-ink-3">AVAILABLE</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="saved-recipient">Saved demo recipient</label>
                    <div className="relative">
                      <select id="saved-recipient" className="field appearance-none" value={savedRecipient} onChange={(e) => { setSavedRecipient(e.target.value); if (!e.target.value) return }}>
                        <option value="">— Manual entry —</option>
                        {recipientOptions.map((a) => (
                          <option key={a.id} value={a.id}>{a.holder} · {a.id}</option>
                        ))}
                      </select>
                      <ChevronRight size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-ink-3" />
                    </div>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="recipient-name">Recipient name (fictional)</label>
                    <input id="recipient-name" className="field" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. Katarina Lindqvist" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label" htmlFor="recipient-acct">Recipient account reference</label>
                    <input id="recipient-acct" className="field" value={recipientId} onChange={(e) => setRecipientId(e.target.value)} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="amount">Transfer amount</label>
                    <input id="amount" type="number" min="1" className="field text-base" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {[5000, 25000, 100000, 250000].map((v) => (
                        <button key={v} type="button" className="badge badge-grey hover:border-[var(--accent)] hover:text-ink" onClick={() => setAmount(String(v))}>
                          {fmtMoney(v, currency, true)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="channel">Payment channel</label>
                    <select id="channel" className="field" value={channel} onChange={(e) => setChannel(e.target.value as Transaction['channel'])}>
                      {['SWIFT', 'SEPA', 'WIRE', 'ACH', 'CRYPTO', 'INTERNAL'].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <p className="mt-1.5 font-mono text-[9px] text-ink-3">SIMULATED FEE ≈ {fmtMoney(fee, currency)} (0.14%)</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="label-xs mb-1">Source liquidity check</p>
                    <Progress value={Math.min(100, (amountNum / Math.max(1, source?.available ?? 1)) * 100)} color={amountNum > (source?.available ?? 0) ? 'var(--color-red)' : 'var(--color-green)'} showValue />
                    {amountNum > (source?.available ?? 0) && (
                      <p className="mt-1 flex items-center gap-1 font-mono text-[9px] text-red"><CircleAlert size={9} /> Exceeds simulated available balance — likely decline.</p>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <label className="field-label">Select fictional currency</label>
                  <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                    {['USD', 'EUR', 'GBP', 'CHF', 'SGD', 'AED', 'JPY', 'CAD'].map((c) => (
                      <button key={c} type="button" onClick={() => setCurrency(c)} className={cn('border px-2 py-2 font-mono text-[11px]', currency === c ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-line-soft text-ink-2 hover:bg-elevated')}>
                        {c}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 font-mono text-[9px] text-ink-3">No FX conversion occurs — this is a display currency only.</p>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-3">
                  <div>
                    <label className="field-label" htmlFor="note">Optional description</label>
                    <textarea id="note" className="field min-h-[70px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reference note for the simulated transfer" />
                  </div>
                  <div>
                    <label className="field-label">Simulated outcome</label>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                      {([['auto', 'Automatic'], ['completed', 'Completed'], ['declined', 'Declined'], ['pending', 'Pending'], ['cancelled', 'Cancelled']] as const).map(([v, l]) => (
                        <button key={v} type="button" onClick={() => setOutcome(v as Outcome | 'auto')} className={cn('border px-1.5 py-1.5 font-mono text-[9px] uppercase tracking-wider', outcome === v ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]' : 'border-line-soft text-ink-3 hover:bg-elevated')}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-2">
                  <div className="border border-line bg-[#0b1119] p-3">
                    <div className="flex items-baseline justify-between border-b border-line pb-2">
                      <div>
                        <p className="label-xs">TRANSFER AMOUNT</p>
                        <p className="stat-value text-2xl text-ink">{fmtMoney(amountNum, currency)}</p>
                      </div>
                      <span className="badge badge-amber">SIMULATED</span>
                    </div>
                    <div className="mt-2">
                      <KeyValue
                        items={[
                          { k: 'From', v: `${source?.holder} (${sourceId})` },
                          { k: 'To', v: `${recipient} (${recipientId})` },
                          { k: 'Channel', v: channel },
                          { k: 'Demo fee', v: fmtMoney(fee, currency) },
                          { k: 'Net debit', v: fmtMoney(amountNum + fee, currency) },
                          { k: 'Description', v: note || '—' },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 border border-[#6d5320] bg-[#2a2110] px-2.5 py-2">
                    <CircleAlert size={12} className="mt-0.5 shrink-0 text-amber" />
                    <p className="text-[10.5px] leading-relaxed text-[#ffd489]">
                      This transfer will only update the internal demonstration ledger. Nothing is sent to a bank, payment
                      processor or blockchain.
                    </p>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-3">
                  {!running && stage < 0 && (
                    <button type="button" className="btn btn-primary w-full py-3" onClick={run}>
                      <ShieldCheck size={13} /> RUN SIMULATION
                    </button>
                  )}
                  {(running || stage >= 0) && (
                    <div className="terminal-window p-3">
                      <div className="flex items-center justify-between border-b border-[#1c2a36] pb-1.5">
                        <span className="term text-[10px] uppercase tracking-widest text-[#79f0b9]">transfer-simulator.log</span>
                        <span className="term text-[9px] text-ink-3">{running ? 'PROCESSING' : 'READY'}</span>
                      </div>
                      <div className="mt-2 min-h-[140px] space-y-1">
                        {PROCESS_STAGES.map((s, i) => (
                          <div key={s} className={cn('flex items-center gap-2 term text-[10.5px]', i <= stage ? 'text-[#79f0b9]' : 'text-ink-3/40')}>
                            <span>{i <= stage ? '✔' : '·'}</span>
                            <span>{s}…</span>
                            {i === stage && running && <span className="animate-pulse">▌</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className={cn('border p-4 text-center',
                result.status === 'completed' ? 'border-[#1b6349] bg-[#0a2a20]'
                  : result.status === 'pending' ? 'border-[#6d5320] bg-[#2a2110]'
                  : 'border-[#6e2633] bg-[#2a1016]',
              )}>
                <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border"
                  style={{ borderColor: result.status === 'completed' ? '#1b6349' : result.status === 'pending' ? '#6d5320' : '#6e2633' }}>
                  {result.status === 'completed' ? <Check size={18} className="text-green" /> : result.status === 'pending' ? <Clock size={18} className="text-amber" /> : <X size={18} className="text-red" />}
                </div>
                <p className="mt-2 font-display text-lg font-semibold uppercase tracking-wide text-ink">
                  {result.status === 'completed' ? 'Payment completed' : result.status === 'declined' ? 'Payment declined' : result.status === 'pending' ? 'Transaction pending' : 'Transaction cancelled'}
                </p>
                <p className="mono mt-0.5 text-[10px] text-ink-3">REFERENCE {result.reference}</p>
              </div>
              <KeyValue
                items={[
                  { k: 'Amount', v: fmtMoney(result.amount, result.currency) },
                  { k: 'Fee', v: fmtMoney(result.fee, result.currency) },
                  { k: 'From', v: `${result.sender} (${result.senderId})` },
                  { k: 'To', v: `${result.recipient} (${result.recipientId})` },
                  { k: 'Channel', v: result.channel },
                  { k: 'Timestamp', v: fmtDateTime(result.timestamp) },
                ]}
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn flex-1" onClick={() => downloadFile(`receipt-${result.reference}.txt`, receiptText(result))}>
                  <Download size={11} /> Receipt
                </button>
                <button type="button" className="btn flex-1" onClick={() => navigate('/finance/transactions?q=' + result.id)}>
                  <FileText size={11} /> Ledger entry
                </button>
                <button type="button" className="btn btn-primary flex-1" onClick={reset}>
                  <ArrowRight size={11} /> New transfer
                </button>
              </div>
              {result.status === 'pending' && (
                <button
                  type="button"
                  className="btn w-full"
                  onClick={() => {
                    updateTransaction(result.id, { status: 'completed' })
                    setResult({ ...result, status: 'completed' })
                    if (soundEnabled) audio.play('txnComplete')
                  }}
                >
                  <Check size={11} /> Approve demo transfer (simulated)
                </button>
              )}
            </div>
          )}

          {!result && (
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
              <button type="button" className="btn btn-sm" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || running}>
                <ChevronLeft size={11} /> Back
              </button>
              {step < 5 ? (
                <button type="button" className="btn btn-sm btn-primary" onClick={() => setStep((s) => Math.min(6, s + 1))} disabled={!canNext()}>
                  Continue <ChevronRight size={11} />
                </button>
              ) : step === 5 ? (
                <button type="button" className="btn btn-sm btn-primary" onClick={() => setStep(6)}>
                  Proceed to simulation <ChevronRight size={11} />
                </button>
              ) : null}
            </div>
          )}
        </Panel>

        <div className="space-y-3">
          <Panel title="Simulation Controls" icon={ShieldCheck} subtitle="Outcome and containment">
            <KeyValue
              items={[
                { k: 'Mode', v: outcome === 'auto' ? 'AUTOMATIC' : outcome.toUpperCase() },
                { k: 'Ledger', v: 'INTERNAL DEMO ONLY' },
                { k: 'Settlement', v: 'NOT REQUESTED' },
                { k: 'External APIs', v: 'NONE' },
                { k: 'Operator', v: operator.callsign },
              ]}
            />
            <Divider label="PROCESS LOG" />
            <ul className="min-h-[80px] space-y-0.5 font-terminal text-[10px]">
              {history.map((h, i) => (
                <li key={i} className="text-ink-2">› {h}</li>
              ))}
              {history.length === 0 && <li className="text-ink-3">Awaiting simulation run…</li>}
            </ul>
          </Panel>

          <Panel title="Recent Simulated Transfers" icon={ArrowRightLeft} bodyClassName="p-0"
            actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('/finance/transactions')}>All <ChevronRight size={10} /></button>}
          >
            <ul className="max-h-[300px] divide-y divide-line-soft overflow-y-auto">
              {transactions.slice(0, 9).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                  <span className="min-w-0">
                    <span className="block truncate text-[10.5px] text-ink-2">{t.sender} → {t.recipient}</span>
                    <span className="block font-mono text-[9px] text-ink-3">{t.id} · {t.channel}</span>
                  </span>
                  <span className="text-right">
                    <span className="mono block text-[10px] tabular text-ink">{fmtMoney(t.amount, t.currency, true)}</span>
                    <StatusPill value={t.status} dot={false} />
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Transfer Rules" icon={Landmark}>
            <ul className="space-y-1.5 text-[10.5px] leading-relaxed text-ink-2">
              <li>• Transfers exceeding available balance are declined.</li>
              <li>• A 0.14% demonstration fee is calculated and recorded.</li>
              <li>• Pending transfers can be approved from the ledger.</li>
              <li>• Every receipt is stamped as a simulated record.</li>
            </ul>
            {accounts.length < 2 && <EmptyState icon={Landmark} title="Need two accounts" message="Create a second fictional account to run a transfer." />}
          </Panel>
        </div>
      </div>

      <InlineAlert tone="green" title="Containment verified">
        This simulator writes exclusively to the in-browser demonstration ledger and never contacts any external payment,
        banking or blockchain service.
      </InlineAlert>
    </Screen>
  )
}
