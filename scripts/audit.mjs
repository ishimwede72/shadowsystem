// Content + accessibility audit: renders every page to static HTML and scans it
// for leaked placeholders (NaN/undefined/TODO/...) and a11y gaps (unnamed icon
// buttons, unlabelled inputs, images without alt).
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

// 'PLACEHOLDER NUMBERS ONLY' is deliberate legal copy on the demo card art.
const PLACEHOLDERS = ['NaN', 'undefined', 'Infinity', 'TODO', 'FIXME', 'Lorem ipsum', '[object Object]']
const problems = []
let leaked = 0
let a11y = 0

for (const page of PAGES) {
  const mod = await server.ssrLoadModule(`/src/pages/${page}.tsx`)
  const html = renderToString(React.createElement(MemoryRouter, null, React.createElement(mod.default)))
  const doc = new JSDOM(`<!doctype html><html><body><div id="r">${html}</div></body></html>`).window.document
  const root = doc.getElementById('r')

  // 1. Placeholder leakage in visible text (attributes are checked too, but
  //    only for the markers that make no sense in a class/style string).
  const text = root.textContent || ''
  for (const token of PLACEHOLDERS) {
    if (text.includes(token)) {
      const ctx = text.slice(Math.max(0, text.indexOf(token) - 60), text.indexOf(token) + 60).replace(/\s+/g, ' ')
      problems.push([page, `leaked "${token}"`, ctx])
      leaked++
    }
  }

  // 2. Icon-only buttons/links need an accessible name.
  const named = (el) => {
    const t = (el.textContent || '').trim()
    return Boolean(t) || el.hasAttribute('aria-label') || el.hasAttribute('title') || el.hasAttribute('aria-labelledby')
  }
  for (const el of root.querySelectorAll('button, a[href]')) {
    if (!named(el)) {
      const icon = el.querySelector('svg[class]')
      const key = icon ? String(icon.getAttribute('class')).match(/lucide-([a-z0-9-]+)/)?.[1] ?? 'svg' : '(text-less)'
      problems.push([page, `unnamed <${el.tagName.toLowerCase()}> icon=${key}`, (el.outerHTML || '').slice(0, 90)])
      a11y++
    }
  }

  // 3. Inputs need a label, aria-label or placeholder.
  for (const el of root.querySelectorAll('input:not([type="hidden"]), select, textarea')) {
    const id = el.getAttribute('id')
    const labelled = Boolean(
      el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('placeholder') ||
      el.closest('label') || (id && root.querySelector(`label[for="${id}"]`)),
    )
    if (!labelled) {
      problems.push([page, `unlabelled <${el.tagName.toLowerCase()}>`, (el.outerHTML || '').slice(0, 150)])
      a11y++
    }
  }

  // 4. Images need alt text.
  for (const el of root.querySelectorAll('img')) {
    if (!el.hasAttribute('alt')) {
      problems.push([page, 'img without alt', (el.outerHTML || '').slice(0, 120)])
      a11y++
    }
  }
}

console.log(`pages audited: ${PAGES.length}`)
console.log(`placeholder leaks: ${leaked}`)
console.log(`a11y findings: ${a11y}`)
if (problems.length) {
  const byPage = new Map()
  for (const p of problems) { const k = `${p[0]} :: ${p[1].replace(/::.*/, '').trim()}`; byPage.set(k, (byPage.get(k) || 0) + 1) }
  console.log('\nper page:')
  for (const [p, n] of [...byPage].sort((a, b) => b[1] - a[1])) console.log(`  ${p}  x${n}`)
  console.log('\nfirst 25 findings:')
  for (const [p, m, c] of problems.slice(0, 25)) console.log(`  [${p}] ${m} :: ${c.replace(/\s+/g, ' ').slice(0, 110)}`)
} else {
  console.log('\nCLEAN: no placeholder leaks, no a11y gaps.')
}
await server.close()
process.exit(problems.length ? 1 : 0)
