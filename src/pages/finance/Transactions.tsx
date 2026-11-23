import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowDownRight, ArrowUpRight, Download, FileText, Filter, Printer, Receipt,
  Search, ShieldCheck, X, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, Modal, Select, EmptyState, KeyValue, InlineAlert, SeverityPill, ConfirmationCard, SimulatedNotice } from '@/components/ui'
import { useEngine, selectOperator } from '@/services/engine'
import { printReceipt as printReceiptDoc } from '@/services/receipt'
import { cn, downloadFile, fmtDateTime, fmtMoney, toCSV } from '@/lib/utils'
import type { Transaction } from '@/types'

const PAGE_SIZE = 12

export default function Transactions() {
  const [params] = useSearchParams()
  const transactions = useEngine((s) => s.transactions)
  const operator = useEngine(selectOperator)
  const [q, setQ] = useState(params.get('q') ?? '')
  const [status, setStatus] = useState(params.get('status') ?? 'all')
  const [channel, setChannel] = useState('all')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState<{ key: keyof Transaction; dir: 1 | -1 }>({ key: 'timestamp', dir: -1 })
  const [detail, setDetail] = useState<Transaction | null>(null)
  const [receipt, setReceipt] = useState<Transaction | null>(null)

  const filtered = useMemo(() => {
    const t = q.toLowerCase()
    let list = transactions.filter((x) => {
      if (t && !`${x.id} ${x.reference} ${x.sender} ${x.recipient} ${x.note}`.toLowerCase().includes(t)) return false
      if (status !== 'all' && x.status !== status) return false
      if (channel !== 'all' && x.channel !== channel) return false
      if (type !== 'all' && x.type !== type) return false
      return true
    })
    list = [...list].sort((a, b) => {
      const av = a[sort.key] as string | number
      const bv = b[sort.key] as string | number
      if (av === bv) return 0
      return (av > bv ? 1 : -1) * sort.dir
    })
    return list
  }, [transactions, q, status, channel, type, sort])

  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  const totals = {
    volume: filtered.reduce((a, t) => a + t.amount, 0),
    fees: filtered.reduce((a, t) => a + t.fee, 0),
    completed: filtered.filter((t) => t.status === 'completed').length,
    declined: filtered.filter((t) => t.status === 'declined').length,
  }

  const toggleSort = (key: keyof Transaction) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }))
  }

  const exportCSV = () => {
    downloadFile(
      `shadow-transactions-${Date.now()}.csv`,
      toCSV(filtered.map(({ id, reference, sender, recipient, amount, currency, type, channel, status, timestamp, fee, note }) => ({
        id, reference, sender, recipient, amount, currency, type, channel, status, timestamp, fee, note,
      }))),
      'text/csv',
    )
  }

  const printReceipt = (t: Transaction) => {
    printReceiptDoc({
      tone: t.status === 'completed' ? 'success' : t.status === 'pending' ? 'pending' : t.status === 'cancelled' ? 'neutral' : 'failed',
      title:
        t.status === 'completed' ? 'Payment confirmed'
          : t.status === 'pending' ? 'Payment pending'
          : t.status === 'cancelled' ? 'Payment cancelled'
          : 'Payment declined',
      subtitle: `${t.type === 'incoming' ? 'Received from' : 'Sent to'} ${t.type === 'incoming' ? t.sender : t.recipient}`,
      amount: { value: t.amount, currency: t.currency },
      reference: t.reference,
      operator: operator.callsign,
      rows: [
        { label: 'Amount', value: fmtMoney(t.amount, t.currency), mono: true },
        { label: 'Date', value: fmtDateTime(t.timestamp) },
        { label: 'Transaction ID', value: t.id, mono: true },
        { label: 'Reference', value: t.reference, mono: true },
        { label: 'Rail', value: t.channel },
        { label: 'Fee (simulated)', value: fmtMoney(t.fee, t.currency), mono: true },
        { label: 'From', value: `${t.sender} (${t.senderId})` },
        { label: 'To', value: `${t.recipient} (${t.recipientId})` },
        ...(t.note ? [{ label: 'Note', value: t.note }] : []),
      ],
      note: 'Every party, account and reference on this receipt is fictional.',
    })
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="FINANCIAL SYSTEMS · LEDGER"
        title="Transaction Management"
        subtitle="Searchable, filterable demonstration ledger. Every row is synthetic and clearly marked as simulated."
        icon={Receipt}
        meta={
          <>
            <span className="badge badge-green">{totals.completed} COMPLETED</span>
            <span className="badge badge-amber">{filtered.filter((t) => t.status === 'pending').length} PENDING</span>
            <span className="badge badge-red">{totals.declined} DECLINED</span>
            <span className="badge badge-cyan">{fmtMoney(totals.volume, 'USD', true)} VOLUME</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={exportCSV}><Download size={11} /> Export CSV</button>
            <button type="button" className="btn btn-sm" onClick={() => window.print()}><Printer size={11} /> Print view</button>
          </>
        }
      />

      <Panel
        title="Ledger Entries"
        icon={Filter}
        bodyClassName="p-0"
        actions={<span className="badge badge-grey">{filtered.length} RECORDS</span>}
      >
        <div className="flex flex-wrap items-end gap-2 border-b border-line p-2.5">
          <div className="relative min-w-[180px] flex-1">
            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-3" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0) }} placeholder="Search ID, reference, sender, recipient, note…" className="field pl-7" />
          </div>
          <Select className="w-32" value={status} onChange={(v) => { setStatus(v); setPage(0) }} options={[
            { value: 'all', label: 'All status' }, { value: 'completed', label: 'Completed' },
            { value: 'pending', label: 'Pending' }, { value: 'declined', label: 'Declined' }, { value: 'cancelled', label: 'Cancelled' },
          ]} />
          <Select className="w-32" value={channel} onChange={(v) => { setChannel(v); setPage(0) }} options={[
            { value: 'all', label: 'All rails' }, ...['SWIFT', 'SEPA', 'WIRE', 'ACH', 'CRYPTO', 'INTERNAL', 'CARD'].map((c) => ({ value: c, label: c })),
          ]} />
          <Select className="w-28" value={type} onChange={(v) => { setType(v); setPage(0) }} options={[
            { value: 'all', label: 'All types' }, { value: 'incoming', label: 'Incoming' }, { value: 'outgoing', label: 'Outgoing' },
          ]} />
          {(q || status !== 'all' || channel !== 'all' || type !== 'all') && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setQ(''); setStatus('all'); setChannel('all'); setType('all'); setPage(0) }}>
              <X size={10} /> Clear
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="data-table min-w-[980px]">
            <thead>
              <tr>
                <th className="cursor-pointer" onClick={() => toggleSort('id')}>TXN ID</th>
                <th className="cursor-pointer" onClick={() => toggleSort('sender')}>Sender</th>
                <th className="cursor-pointer" onClick={() => toggleSort('recipient')}>Recipient</th>
                <th className="cursor-pointer text-right" onClick={() => toggleSort('amount')}>Amount</th>
                <th>Rail</th>
                <th>Type</th>
                <th className="cursor-pointer" onClick={() => toggleSort('status')}>Status</th>
                <th className="cursor-pointer" onClick={() => toggleSort('timestamp')}>Timestamp</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((t) => (
                <tr key={t.id}>
                  <td>
                    <button type="button" className="mono text-left text-[10px] text-[var(--accent)] hover:underline" onClick={() => setDetail(t)}>
                      {t.id}
                    </button>
                    <span className="block font-mono text-[8.5px] text-ink-3">{t.reference}</span>
                  </td>
                  <td className="max-w-[150px] truncate text-[11px] text-ink-2">{t.sender}</td>
                  <td className="max-w-[150px] truncate text-[11px] text-ink-2">{t.recipient}</td>
                  <td className={cn('mono text-right text-[11px] tabular', t.type === 'incoming' ? 'text-green' : 'text-ink')}>
                    {fmtMoney(t.amount, t.currency)}
                  </td>
                  <td><span className="badge badge-grey">{t.channel}</span></td>
                  <td>
                    <span className={cn('flex items-center gap-1 font-mono text-[9px] uppercase', t.type === 'incoming' ? 'text-green' : 'text-ink-3')}>
                      {t.type === 'incoming' ? <ArrowDownRight size={9} /> : <ArrowUpRight size={9} />}{t.type}
                    </span>
                  </td>
                  <td><StatusPill value={t.status} /></td>
                  <td className="mono whitespace-nowrap text-[9.5px]">{fmtDateTime(t.timestamp)}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button type="button" className="icon-btn !h-6 !w-6" onClick={() => setDetail(t)} title="Transaction detail"><FileText size={11} /></button>
                      <button type="button" className="icon-btn !h-6 !w-6" onClick={() => setReceipt(t)} title="Receipt preview"><Receipt size={11} /></button>
                      <button type="button" className="icon-btn !h-6 !w-6" onClick={() => printReceipt(t)} title="Print receipt"><Printer size={11} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <EmptyState icon={Receipt} title="No transactions match" message="Adjust the filters above or run a new transfer simulation." />}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-[#0d151d] px-2.5 py-1.5">
          <span className="mono text-[9.5px] text-ink-3">
            Page {page + 1} / {totalPages} · showing {pageItems.length} of {filtered.length}
          </span>
          <span className="mono hidden text-[9.5px] text-ink-3 sm:block">FEES {fmtMoney(totals.fees, 'USD')} (SIM)</span>
          <div className="flex items-center gap-1">
            <button type="button" className="icon-btn !h-6 !w-6" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} aria-label="Previous page"><ChevronLeft size={12} /></button>
            <button type="button" className="icon-btn !h-6 !w-6" disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} aria-label="Next page"><ChevronRight size={12} /></button>
          </div>
        </div>
      </Panel>

      {/* detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`Transaction ${detail?.id ?? ''}`}
        subtitle={detail?.reference}
        icon={FileText}
        footer={
          <>
            <button type="button" className="btn" onClick={() => setDetail(null)}>Close</button>
            <button type="button" className="btn" onClick={() => detail && setReceipt(detail)}><Receipt size={11} /> Receipt</button>
            <button type="button" className="btn btn-primary" onClick={() => detail && printReceipt(detail)}><Printer size={11} /> Print receipt</button>
          </>
        }
      >
        {detail && (
          <div className="space-y-3">
            <InlineAlert tone="amber" title="Simulated record">
              This transaction exists only in the SHADOW SYSTEMS demonstration ledger. No funds moved.
            </InlineAlert>
            <div className="flex items-baseline justify-between border-b border-line pb-3">
              <div>
                <p className="label-xs">Amount</p>
                <p className="stat-value text-2xl text-ink">{fmtMoney(detail.amount, detail.currency)}</p>
              </div>
              <div className="flex items-center gap-2">
                <SeverityPill value={detail.status === 'declined' ? 'elevated' : detail.status === 'completed' ? 'low' : 'elevated'} />
                <StatusPill value={detail.status} />
              </div>
            </div>
            <KeyValue
              items={[
                { k: 'Reference', v: detail.reference },
                { k: 'Transaction ID', v: detail.id },
                { k: 'Sender', v: `${detail.sender} · ${detail.senderId}` },
                { k: 'Recipient', v: `${detail.recipient} · ${detail.recipientId}` },
                { k: 'Channel', v: detail.channel },
                { k: 'Direction', v: detail.type },
                { k: 'Fee (simulated)', v: fmtMoney(detail.fee, detail.currency) },
                { k: 'Timestamp', v: fmtDateTime(detail.timestamp) },
              ]}
            />
            <div>
              <p className="label-xs">Note</p>
              <p className="mt-0.5 text-[11.5px] text-ink-2">{detail.note}</p>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-green">
              <ShieldCheck size={10} /> SIMULATED · MARKED · NON-SETTLING
            </div>
          </div>
        )}
      </Modal>

      {/* receipt modal */}
      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Receipt Preview" subtitle="Demonstration receipt" icon={Receipt} size="sm"
        footer={<>
          <button type="button" className="btn" onClick={() => setReceipt(null)}>Close</button>
          <button type="button" className="btn btn-primary" onClick={() => receipt && printReceipt(receipt)}><Printer size={11} /> Print / save PDF</button>
        </>}
      >
        {receipt && (
          <div className="space-y-3">
            <ConfirmationCard
              tone={receipt.status === 'completed' ? 'success' : receipt.status === 'pending' ? 'pending' : receipt.status === 'cancelled' ? 'neutral' : 'failed'}
              title={
                receipt.status === 'completed' ? 'Payment confirmed'
                  : receipt.status === 'pending' ? 'Payment pending'
                  : receipt.status === 'cancelled' ? 'Payment cancelled'
                  : 'Payment declined'
              }
              subtitle={`${receipt.type === 'incoming' ? 'Received from' : 'Sent to'} ${receipt.type === 'incoming' ? receipt.sender : receipt.recipient}`}
              rows={[
                { label: 'Amount', value: fmtMoney(receipt.amount, receipt.currency), emphasis: true, mono: true },
                { label: 'Date', value: fmtDateTime(receipt.timestamp) },
                { label: 'Transaction ID', value: receipt.id, mono: true },
                { label: 'Reference', value: receipt.reference, mono: true },
                { label: 'Rail', value: receipt.channel },
                { label: 'Fee (simulated)', value: fmtMoney(receipt.fee, receipt.currency), mono: true },
                { label: 'From', value: `${receipt.sender} (${receipt.senderId})` },
                { label: 'To', value: `${receipt.recipient} (${receipt.recipientId})` },
                { label: 'Note', value: receipt.note },
              ]}
              note={`Every party, account and reference on this receipt is fictional. Generated locally · Operator ${operator.callsign}.`}
            />
            <SimulatedNotice>Demo receipt — no real funds transferred</SimulatedNotice>
          </div>
        )}
      </Modal>

      <InlineAlert tone="cyan" title="Ledger containment">
        Exports are generated in-browser from the current session’s generated records. Nothing is uploaded anywhere.
      </InlineAlert>
    </Screen>
  )
}
