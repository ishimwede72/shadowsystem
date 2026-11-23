// Client-side mount test in jsdom: runs effects, timers and chart layout.
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/', pretendToBeVisual: true })
const w = dom.window
globalThis.window = w
globalThis.document = w.document
Object.defineProperty(globalThis, 'navigator', { value: w.navigator, configurable: true })
globalThis.localStorage = w.localStorage
globalThis.sessionStorage = w.sessionStorage
globalThis.HTMLElement = w.HTMLElement
globalThis.Element = w.Element
globalThis.Node = w.Node
globalThis.Event = w.Event
globalThis.MouseEvent = w.MouseEvent
globalThis.KeyboardEvent = w.KeyboardEvent
globalThis.getComputedStyle = w.getComputedStyle
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16)
globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
w.matchMedia = () => ({ matches: false, media: '', onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })
globalThis.matchMedia = w.matchMedia
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
w.ResizeObserver = globalThis.ResizeObserver
globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
w.IntersectionObserver = globalThis.IntersectionObserver
globalThis.crypto ??= w.crypto
w.Element.prototype.scrollIntoView = function () {}
w.Element.prototype.scrollTo = function () {}
w.Element.prototype.scrollBy = function () {}
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const AC = class {
  constructor() { this.state = 'running'; this.destination = {}; this.currentTime = 0 }
  createOscillator() { return { connect() {}, disconnect() {}, start() {}, stop() {}, type: '', frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} } } }
  createGain() { return { connect() {}, disconnect() {}, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } } }
  createBuffer() { return { getChannelData: () => new Float32Array(64) } }
  createBufferSource() { return { connect() {}, start() {}, stop() {}, buffer: null } }
  createBiquadFilter() { return { connect() {}, type: '', frequency: { value: 0, setValueAtTime() {} }, Q: { value: 0 } } }
  createStereoPanner() { return { connect() {}, pan: { value: 0 } } }
  close() { return Promise.resolve() }
  resume() { return Promise.resolve() }
}
globalThis.AudioContext = AC
globalThis.webkitAudioContext = AC
w.AudioContext = AC

const list = process.argv.slice(2)
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const errors = []
const origError = console.error
console.error = (...args) => { errors.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')); }

const results = []
for (const entry of list) {
  const [file, rest = '/'] = entry.split('@')
  const [path, pattern] = rest.split('#')
  const container = w.document.createElement('div')
  w.document.body.appendChild(container)
  const before = errors.length
  let crash = null
  let nodes = 0
  try {
    const mod = await server.ssrLoadModule(`/src/pages/${file}.tsx`)
    const Comp = mod.default
    const root = createRoot(container)
    await act(async () => {
      root.render(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(Routes, null, React.createElement(Route, { path: pattern && pattern !== '-' ? pattern : '*', element: React.createElement(Comp) }))))
    })
    await act(async () => { await new Promise((r) => setTimeout(r, 120)) })
    nodes = container.querySelectorAll('*').length
    await act(async () => { root.unmount() })
  } catch (e) {
    crash = String(e).split('\n').slice(0, 3).join(' | ')
  }
  const newErrors = errors.slice(before).filter((e) => !/not wrapped in act|ReactDOMTestUtils|deprecated/.test(e))
  results.push({ file, crash, nodes, errors: newErrors })
  if (crash) console.log('CRASH', file, crash)
  else if (newErrors.length) console.log('WARN ', file, newErrors.length, newErrors[0].slice(0, 220))
  else console.log('OK   ', file, 'nodes=', nodes)
  container.remove()
}
console.error = origError
console.log('\nSUMMARY crashes=', results.filter((r) => r.crash).length, 'warned=', results.filter((r) => !r.crash && r.errors.length).length, 'clean=', results.filter((r) => !r.crash && !r.errors.length).length)
await server.close()
process.exit(0)
