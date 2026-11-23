// App-level mount: full router + shell + every route, checking for crashes.
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/', pretendToBeVisual: true })
const w = dom.window
globalThis.window = w
globalThis.document = w.document
Object.defineProperty(globalThis, 'navigator', { value: w.navigator, configurable: true })
globalThis.localStorage = w.localStorage
globalThis.sessionStorage = w.sessionStorage
for (const k of ['HTMLElement', 'Element', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'CustomEvent', 'DOMParser', 'SVGElement', 'HTMLCanvasElement']) globalThis[k] = w[k]
globalThis.getComputedStyle = w.getComputedStyle
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16)
globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
w.matchMedia = () => ({ matches: false, media: '', onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })
globalThis.matchMedia = w.matchMedia
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
w.ResizeObserver = globalThis.ResizeObserver
globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
w.IntersectionObserver = globalThis.IntersectionObserver
w.Element.prototype.scrollIntoView = function () {}
w.Element.prototype.scrollTo = function () {}
globalThis.crypto ??= w.crypto
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const AC = class {
  constructor() { this.state = 'running'; this.destination = {}; this.currentTime = 0 }
  createOscillator() { return { connect() {}, start() {}, stop() {}, type: '', frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} } } }
  createGain() { return { connect() {}, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } } }
  createBuffer() { return { getChannelData: () => new Float32Array(64) } }
  createBufferSource() { return { connect() {}, start() {}, stop() {}, buffer: null } }
  createBiquadFilter() { return { connect() {}, type: '', frequency: { value: 0 } } }
  createStereoPanner() { return { connect() {}, pan: { value: 0 } } }
  close() { return Promise.resolve() }
  resume() { return Promise.resolve() }
}
globalThis.AudioContext = AC
globalThis.webkitAudioContext = AC
w.AudioContext = AC
w.print = () => {}

const paths = process.argv.slice(2)
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const errors = []
const origError = console.error
console.error = (...a) => {
  const parts = []
  for (const x of a) {
    if (x instanceof Error) parts.push('ERR: ' + x.message + ' @ ' + (x.stack || '').split('\n')[1])
    else if (typeof x === 'string') parts.push(x)
    else { try { parts.push(JSON.stringify(x)) } catch { parts.push(String(x)) } }
  }
  errors.push(parts.join(' '))
}

// mark as booted & granted so pages render
w.localStorage.setItem('shadow-systems-engine', JSON.stringify({ state: { booted: true, speed: 1, autoUpdate: true, currentOperatorId: 'OP-001', seed: 20261123 }, version: 3 }))
w.localStorage.setItem('shadow-systems-prefs', JSON.stringify({ state: { accent: 'cyan', density: 'comfortable', fontScale: 100, motion: 'reduced', texture: false, soundEnabled: false, volume: 0.4, sidebarCollapsed: false, defaultLanding: '/command-center', favoriteModules: ['command'], displayName: 'Operator VANTA', avatarSeed: 'VANTA', terminalFontSize: 12.5, terminalTheme: 'green', autoUpdateFrequency: 5, clockFormat: 24 }, version: 2 }))

const AppMod = await server.ssrLoadModule('/src/App.tsx')
const App = AppMod.default
for (const path of paths) {
  const container = w.document.createElement('div')
  w.document.body.appendChild(container)
  const root = createRoot(container)
  const isPublic = path === '/' || path.startsWith('/access')
  const before = errors.length
  let crash = null
  try {
    await act(async () => {
      root.render(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(App)))
    })
    await act(async () => { await new Promise((r) => setTimeout(r, isPublic ? 3400 : 1400)) })
  } catch (e) {
    crash = String(e).split('\n')[0]
  }
  const fresh = errors.slice(before).map((e) => e.replace(/%o|%s/g, '').replace(/\s+/g, ' ').trim()).filter((e) => !/not wrapped in act|deprecated/.test(e))
  const text = (container.textContent || '').replace(/\s+/g, ' ')
  const hasShell = /Operations/.test(text) || /OVERVIEW|COMMAND|FINANCE/i.test(text)
  const main = container.querySelector('main') || container
  const h1 = main.querySelector('h1, h2, [class*="font-display"]')
  const heading = (h1?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 46)
  const mainLen = (main.textContent || '').replace(/\s+/g, ' ').trim().length
  const shown = `${hasShell ? 'SHELL' : 'NO-SHELL'} len=${mainLen} h="${heading}"`
  if (crash) console.log('CRASH', path, crash)
  else if (fresh.length) console.log('WARN ', path, fresh.length, fresh[0].slice(0, 600))
  else console.log('OK   ', path, '|', shown)
  await act(async () => { root.unmount() })
  container.remove()
}
console.error = origError
await server.close()
process.exit(0)
