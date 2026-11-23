// Visual/structural review: renders every page and reports layout-relevant
// metrics so issues that would be visible on screen can be caught without a
// screenshot (identical repeats, absurd numbers, un-scrollable tables,
// inconsistent headers, text that will overflow its container).
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' })
globalThis.window = dom.window
globalThis.document = dom.window.document
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true })
globalThis.localStorage = dom.window.localStorage
globalThis.sessionStorage = dom.window.sessionStorage
globalThis.HTMLElement = dom.window.HTMLElement
globalThis.Element = dom.window.Element
globalThis.Node = dom.window.Node
globalThis.getComputedStyle = dom.window.getComputedStyle
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16)
globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
globalThis.crypto ??= dom.window.crypto
globalThis.AudioContext = class { createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { value: 0, setValueAtTime() {} }, type: '' } } createGain() { return { connect() {}, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } } } createBuffer() { return { getChannelData: () => new Float32Array(10) } } createBufferSource() { return { connect() {}, start() {} } } createBiquadFilter() { return { connect() {}, frequency: { value: 0 }, type: '' } } get destination() { return {} } get currentTime() { return 0 } }
globalThis.webkitAudioContext = globalThis.AudioContext

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const { PAGES } = await import('./page-list.mjs')

const rows = []
const issues = []

for (const page of PAGES) {
  const mod = await server.ssrLoadModule(`/src/pages/${page}.tsx`)
  const html = renderToString(React.createElement(MemoryRouter, null, React.createElement(mod.default)))
  const doc = new JSDOM(`<!doctype html><html><body><div id="r">${html}</div></body></html>`).window.document
  const root = doc.getElementById('r')
  const text = (root.textContent || '').replace(/\s+/g, ' ').trim()

  const panels = root.querySelectorAll('.panel').length
  // ResponsiveContainer emits no markup during SSR, so count chart primitives
  // from the module source rather than the rendered tree.
  const fs = await import('node:fs/promises')
  const src = await fs.readFile(`src/pages/${page}.tsx`, 'utf8')
  const charts = (src.match(/<(AreaTrend|LineTrend|BarsTrend|Donut|RadialGauge|RadarMetric|Sparkline|HeatStrip|MiniBars)\b/g) || []).length
  const svgs = root.querySelectorAll('svg').length
  const tables = root.querySelectorAll('table').length
  const trs = root.querySelectorAll('tbody tr').length
  const cards = root.querySelectorAll('[class*="stat"], .stat-card').length
  const h1 = (root.querySelector('h1')?.textContent || '').trim()
  const h1count = root.querySelectorAll('h1').length
  if (h1count !== 1) issues.push([page, `expected exactly one <h1>, found ${h1count}`])
  if (!h1) issues.push([page, 'page has no <h1> title'])
  // Heading order: no skipped levels below the h1.
  const levels = [...root.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1]))
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) { issues.push([page, `heading level jumps h${levels[i - 1]} -> h${levels[i]}`]); break }
  }
  const words = text ? text.split(' ').length : 0

  // Numbers that would look absurd on screen.
  const money = [...text.matchAll(/\$[\d,]+(?:\.\d+)?/g)].map((m) => Number(m[0].replace(/[$,]/g, '')))
  const biggest = money.length ? Math.max(...money) : 0
  if (biggest > 5_000_000_000) issues.push([page, `absurd money value $${biggest.toLocaleString()}`])
  if (/\$-[\d,]/.test(text)) issues.push([page, 'negative money rendered as $-x'])

  // Wide tables must be able to scroll horizontally. Either they sit in an
  // explicit overflow container, or they are a child of a panel body, which
  // .panel > div:has(table) makes scrollable in index.css.
  for (const t of root.querySelectorAll('table')) {
    let p = t.parentElement
    let ok = false
    for (let i = 0; i < 4 && p; i++, p = p.parentElement) {
      const cls = String(p.getAttribute('class') || '')
      if (/overflow-x|overflow-auto|overflow-y/.test(cls)) { ok = true; break }
      if (/\bpanel\b/.test(cls)) { ok = true; break } // covered by the :has() rule
    }
    if (!ok) issues.push([page, `table (${t.querySelectorAll('thead th').length} cols) not in a scroll container`])
  }

  // Clone detection: a whole row repeating means the generator collided. Status
  // columns repeating is normal, so compare rows, not cells.
  for (const t of root.querySelectorAll('table')) {
    const rowsOfCells = [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('td')].map((c) => c.textContent.trim()).join('|'))
    if (rowsOfCells.length > 5) {
      const uniq = new Set(rowsOfCells).size
      if (uniq / rowsOfCells.length < 0.9) issues.push([page, `duplicate rows in table (${rowsOfCells.length - uniq} of ${rowsOfCells.length} identical)`])
    }
  }

  rows.push({ page, h1, panels, charts, svgs, tables, trs, words, biggest })
}

const pad = (s, n) => String(s).padEnd(n)
console.log(pad('page', 42), pad('panels', 7), pad('chart', 6), pad('tables', 7), pad('rows', 6), pad('words', 7), 'max $')
for (const r of rows) {
  console.log(pad(r.page, 42), pad(r.panels, 7), pad(r.charts, 6), pad(r.tables, 7), pad(r.trs, 6), pad(r.words, 7), r.biggest ? r.biggest.toLocaleString() : '-')
}

const light = rows.filter((r) => r.words < 120)
const noCharts = rows.filter((r) => r.charts === 0 && r.tables === 0)
console.log(`\npages: ${rows.length} · total panels: ${rows.reduce((a, r) => a + r.panels, 0)} · charts: ${rows.reduce((a, r) => a + r.charts, 0)} · table rows: ${rows.reduce((a, r) => a + r.trs, 0)}`)
if (light.length) console.log('sparse pages (<120 words):', light.map((r) => `${r.page}(${r.words})`).join(', '))
if (noCharts.length) console.log('pages with no chart or table:', noCharts.map((r) => `${r.page}(${r.words}w)`).join(', '))
console.log(`\nstructural issues: ${issues.length}`)
for (const [p, m] of issues.slice(0, 40)) console.log(' -', p, '::', m)

await server.close()
process.exit(0)
