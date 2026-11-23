// ============================================================================
// SHADOW SYSTEMS — Report generation service
// Deterministic, local-only report compilation grounded in live sim data.
// Nothing is transmitted; exports are produced in-browser.
// ============================================================================
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GeneratedReport } from '@/types'
import { pad } from '@/lib/utils'

export type ReportType = GeneratedReport['type']

export const REPORT_TYPES: { id: ReportType; label: string; department: string }[] = [
  { id: 'intelligence', label: 'Intelligence', department: 'Intelligence Directorate' },
  { id: 'incident', label: 'Incident', department: 'Cyber Operations' },
  { id: 'financial', label: 'Financial', department: 'Financial Intelligence' },
  { id: 'network', label: 'Network', department: 'Network Operations' },
  { id: 'mission', label: 'Mission', department: 'Mission Control' },
  { id: 'surveillance', label: 'Surveillance', department: 'Physical Security' },
]

interface ReportsState {
  reports: GeneratedReport[]
  counter: number
  add: (r: Omit<GeneratedReport, 'id' | 'number'>) => GeneratedReport
  remove: (id: string) => void
  clear: () => void
}

const BASE: GeneratedReport[] = [
  {
    id: 'rpt-seed-1',
    number: 'RPT-4401',
    title: 'SHADOW SYSTEMS — Operational Baseline Brief',
    type: 'intelligence',
    department: 'Intelligence Directorate',
    generated: new Date(Date.now() - 86_400_000 * 2).toISOString(),
    author: 'SHADOW AI',
    summary:
      'Baseline assessment of the simulated operating picture: profile density, case load and link-graph connectivity remain within expected demonstration ranges.',
    analysis: [
      'Case load is dominated by open investigations with moderate progress, consistent with a fresh simulation seed.',
      'Link-graph density indicates a well-connected fictional network without isolated clusters.',
      'No anomalies were detected in the generated evidence register.',
    ],
    metrics: [
      { label: 'Profiles', value: '10' },
      { label: 'Cases', value: '10' },
      { label: 'Evidence', value: '10' },
    ],
    classification: 'FICTIONAL · INTERNAL',
  },
  {
    id: 'rpt-seed-2',
    number: 'RPT-4402',
    title: 'Cyber Posture Snapshot',
    type: 'incident',
    department: 'Cyber Operations',
    generated: new Date(Date.now() - 86_400_000).toISOString(),
    author: 'SHADOW AI',
    summary:
      'Firewall ruleset and vulnerability findings were reviewed. The simulated perimeter shows one degraded segment requiring operator attention.',
    analysis: [
      'Firewall coverage is broad; a small number of rules carry most of the matched traffic.',
      'Critical findings should be remediated before the next mission cycle.',
      'Event volume is evenly distributed across the observation window.',
    ],
    metrics: [
      { label: 'Firewall rules', value: '—' },
      { label: 'Findings', value: '—' },
      { label: 'Critical', value: '—' },
    ],
    classification: 'FICTIONAL · DEMO',
  },
  {
    id: 'rpt-seed-3',
    number: 'RPT-4403',
    title: 'Network Throughput Review',
    type: 'network',
    department: 'Network Operations',
    generated: new Date(Date.now() - 3_600_000 * 6).toISOString(),
    author: 'SHADOW AI',
    summary:
      'Throughput, latency and node health were sampled across the generated topology. Utilisation remains inside demonstration thresholds.',
    analysis: [
      'Average node load is moderate; no host is saturated for a sustained window.',
      'Link congestion events are rare and short-lived.',
      'Storage nodes carry the highest steady-state utilisation.',
    ],
    metrics: [
      { label: 'Nodes', value: '—' },
      { label: 'Links', value: '—' },
      { label: 'Avg latency', value: '—' },
    ],
    classification: 'FICTIONAL · INTERNAL',
  },
]

export const useReports = create<ReportsState>()(
  persist(
    (set, get) => ({
      reports: BASE,
      counter: 4404,
      add: (r) => {
        const number = `RPT-${get().counter + 1}`
        const report: GeneratedReport = {
          ...r,
          id: `rpt-${number.toLowerCase()}-${Date.now().toString(36)}`,
          number,
        }
        set({ reports: [report, ...get().reports], counter: get().counter + 1 })
        return report
      },
      remove: (id) => set({ reports: get().reports.filter((r) => r.id !== id) }),
      clear: () => set({ reports: [], counter: get().counter }),
    }),
    { name: 'shadow-systems-reports', version: 1 },
  ),
)

export function reportToText(r: GeneratedReport): string {
  return [
    '╔════════════════════════════════════════════════════════════════╗',
    '║  SHADOW SYSTEMS · REPORT COMPILATION ENGINE                     ║',
    '╚════════════════════════════════════════════════════════════════╝',
    '',
    `REPORT      : ${r.number}`,
    `TITLE       : ${r.title}`,
    `TYPE        : ${r.type.toUpperCase()}`,
    `DEPARTMENT  : ${r.department}`,
    `GENERATED   : ${r.generated}`,
    `AUTHOR      : ${r.author}`,
    `CLASSIFICATION: ${r.classification}`,
    '',
    '─'.repeat(66),
    '1. SUMMARY',
    '─'.repeat(66),
    wrap(r.summary, 66),
    '',
    '─'.repeat(66),
    '2. ANALYSIS',
    '─'.repeat(66),
    ...r.analysis.flatMap((a, i) => [`${pad(i + 1)}. ${wrap(a, 62, '    ').trimStart()}`]),
    '',
    '─'.repeat(66),
    '3. METRICS',
    '─'.repeat(66),
    ...r.metrics.map((m) => `${m.label.padEnd(28, '.')} ${m.value}`),
    '',
    '─'.repeat(66),
    'NOTICE',
    '─'.repeat(66),
    'This document is entirely fictional and was assembled from',
    'generated demonstration data inside the SHADOW SYSTEMS simulation.',
    'It describes no real person, organisation, account or event.',
    '',
    'SIMULATED — NOT A REAL INTELLIGENCE PRODUCT.',
    `END OF REPORT · ${r.number}`,
  ].join('\n')
}

function wrap(text: string, width: number, indent = '') {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  words.forEach((w) => {
    if ((line + ' ' + w).trim().length > width) {
      lines.push(indent + line.trim())
      line = w
    } else {
      line += ` ${w}`
    }
  })
  if (line.trim()) lines.push(indent + line.trim())
  return lines.join('\n')
}

export function reportToCSV(r: GeneratedReport): string {
  const rows = [
    ['number', 'title', 'type', 'department', 'generated', 'author', 'classification'],
    [r.number, r.title, r.type, r.department, r.generated, r.author, r.classification],
    [],
    ['metric', 'value'],
    ...r.metrics.map((m) => [m.label, m.value]),
    [],
    ['analysis'],
    ...r.analysis.map((a) => [a]),
  ]
  return rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
}

export function findReport(reports: GeneratedReport[], idOrNumber: string) {
  return reports.find((r) => r.id === idOrNumber || r.number === idOrNumber)
}
