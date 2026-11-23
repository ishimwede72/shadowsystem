// ============================================================================
// Print/export receipt renderer.
//
// Produces a self-contained HTML document for window.print() or a saved PDF.
// Deliberately light-themed and typographically calm: the console is dark and
// dense, but a receipt a user might keep should look like a receipt.
// ============================================================================
import { fmtDateTime, fmtMoney } from '@/lib/utils'

export type ReceiptTone = 'success' | 'pending' | 'failed' | 'neutral'

export interface ReceiptData {
  tone: ReceiptTone
  title: string
  subtitle?: string
  /** The headline figure, if there is one. */
  amount?: { value: number; currency: string }
  rows: { label: string; value: string; mono?: boolean }[]
  note?: string
  operator?: string
  reference?: string
}

const TONE = {
  success: { label: 'CONFIRMED', glyph: '✓', fg: '#0f7a4f', bg: '#e8f7ef', ring: '#127a4e' },
  pending: { label: 'PENDING', glyph: '◷', fg: '#8a6300', bg: '#fdf6e3', ring: '#a8770a' },
  failed: { label: 'DECLINED', glyph: '✕', fg: '#a3273a', bg: '#fdecef', ring: '#8e2f3c' },
  neutral: { label: 'CANCELLED', glyph: '–', fg: '#5b6b7b', bg: '#eef2f5', ring: '#5b6b7b' },
} as const

export function receiptHtml(d: ReceiptData): string {
  const t = TONE[d.tone]
  const rows = d.rows
    .map(
      (r) => `<div class="row"><span class="k">${esc(r.label)}</span><span class="v${r.mono ? ' mono' : ''}">${esc(r.value)}</span></div>`,
    )
    .join('')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(d.title)}${d.reference ? ` · ${esc(d.reference)}` : ''}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 40px 20px; background: #f4f6f8; color: #16202b;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .card {
    max-width: 430px; margin: 0 auto; background: #fff; border-radius: 14px;
    border: 1px solid #e3e8ee; box-shadow: 0 18px 40px -18px rgba(16,32,48,.22);
    overflow: hidden;
  }
  .brand {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 22px; border-bottom: 1px solid #eef2f6;
  }
  .brand strong { font-size: 11.5px; letter-spacing: .18em; font-weight: 700; }
  .brand span { font-size: 9px; letter-spacing: .16em; color: #8798a8; text-transform: uppercase; }
  .body { padding: 30px 26px 26px; text-align: center; }
  .medal {
    width: 74px; height: 74px; margin: 0 auto; border-radius: 50%;
    background: ${t.ring}; color: #fff; display: flex; align-items: center; justify-content: center;
    font-size: 36px; line-height: 1; font-weight: 700;
    box-shadow: 0 0 0 12px ${t.bg};
  }
  h1 { font-size: 25px; letter-spacing: -.015em; margin: 22px 0 0; font-weight: 700; }
  .sub { margin: 6px 0 0; font-size: 12.5px; color: #6b7c8d; line-height: 1.5; }
  .amount { font-size: 34px; font-weight: 700; letter-spacing: -.02em; margin: 18px 0 2px; }
  .amount small { font-size: 15px; font-weight: 600; color: #6b7c8d; margin-right: 4px; }
  .rows { margin: 22px 0 0; text-align: left; }
  .row {
    display: flex; align-items: baseline; justify-content: space-between; gap: 16px;
    padding: 9px 0; border-bottom: 1px solid #f0f4f7;
  }
  .row:last-child { border-bottom: 0; }
  .k { font-size: 12.5px; color: #6b7c8d; white-space: nowrap; }
  .v { font-size: 13px; color: #16202b; text-align: right; word-break: break-word; }
  .mono { font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  .status {
    display: inline-block; margin-top: 18px; padding: 4px 10px; border-radius: 999px;
    background: ${t.bg}; color: ${t.fg}; font-size: 9.5px; font-weight: 700; letter-spacing: .14em;
  }
  .note { margin: 16px 0 0; font-size: 11px; color: #8798a8; line-height: 1.6; }
  .foot {
    border-top: 1px dashed #dfe6ec; margin-top: 22px; padding-top: 14px;
    font-size: 9.5px; color: #93a3b4; line-height: 1.7; text-align: center;
  }
  .sim {
    margin-top: 14px; background: #fff8e6; border: 1px solid #f0d9a0; color: #7a5200;
    border-radius: 8px; padding: 8px 10px; font-size: 10px; font-weight: 600;
    letter-spacing: .04em; text-align: center;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .card { box-shadow: none; border: 0; max-width: none; }
    @page { margin: 14mm; }
  }
</style>
</head>
<body>
  <div class="card">
    <div class="brand">
      <strong>SHADOW&nbsp;SYSTEMS</strong>
      <span>${esc(t.label)}</span>
    </div>
    <div class="body">
      <div class="medal">${t.glyph}</div>
      <h1>${esc(d.title)}</h1>
      ${d.subtitle ? `<p class="sub">${esc(d.subtitle)}</p>` : ''}
      ${
        d.amount
          ? `<p class="amount"><small>${esc(d.amount.currency)}</small>${d.amount.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>`
          : ''
      }
      <span class="status">${t.label}</span>
      <div class="rows">${rows}</div>
      ${d.note ? `<p class="note">${esc(d.note)}</p>` : ''}
      <div class="sim">DEMONSTRATION RECEIPT — NO REAL FUNDS TRANSFERRED</div>
      <div class="foot">
        Issued ${esc(fmtDateTime(Date.now()))}${d.operator ? ` · Operator ${esc(d.operator)}` : ''}<br />
        All institutions, holders and references are fictional.<br />
        Generated locally by the SHADOW SYSTEMS simulation engine.
      </div>
    </div>
  </div>
</body>
</html>`
}

function esc(v: string): string {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Opens the receipt in a new window and triggers the print dialog. */
export function printReceipt(d: ReceiptData) {
  const w = window.open('', '_blank', 'width=560,height=820')
  if (!w) return false
  w.document.write(receiptHtml(d))
  w.document.close()
  return true
}

/** Downloads the receipt as a standalone HTML file (opens in any browser). */
export function receiptBlob(d: ReceiptData): { name: string; html: string; type: string } {
  const slug = (d.reference ?? d.title).replace(/[^A-Za-z0-9-]+/g, '-').toUpperCase()
  return { name: `receipt-${slug}.html`, html: receiptHtml(d), type: 'text/html' }
}

/** Money helper shared by callers so receipts format consistently. */
export const receiptMoney = (v: number, c: string) => fmtMoney(v, c)
