// SSR smoke test: renders every page to string and reports crashes/warnings.
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

const fail = []
async function render(file, label) {
  try {
    const mod = await server.ssrLoadModule(file)
    const Comp = mod.default
    if (!Comp) { fail.push([label, 'no default export']); return }
    const html = renderToString(React.createElement(MemoryRouter, null, React.createElement(Comp)))
    if (html.length < 200) fail.push([label, `short output ${html.length}`])
    else console.log('OK  ', label, html.length)
  } catch (e) {
    fail.push([label, String(e).slice(0, 300)])
    console.log('FAIL', label, String(e).slice(0, 300))
  }
}

const modules = process.argv.slice(2)
const list = modules.length ? modules : ['landing/Landing','access/Access','system/NotFound','command-center/CommandCenter','command-center/SystemHealth','command-center/ActivityHistory','command-center/CinematicView','finance/FinanceOverview','finance/Accounts','finance/Transactions','finance/Transfers','finance/Cards','finance/Banks','finance/Wallets','finance/Crypto','finance/FinanceAnalytics','cyber/CyberOverview','cyber/Vulnerabilities','cyber/Firewall','cyber/CyberActivity','cyber/TerminalPage','cyber/AccessSim','cyber/CyberEncryption','cyber/PasswordLab','cyber/ServerLab','geoint/GeoOverview','geoint/GeoWorld','geoint/Targets','geoint/Geofencing','geoint/RoutesPage','geoint/GeoHistory','surveillance/SurveillanceOverview','surveillance/CameraWall','surveillance/SurveillanceIncidents','surveillance/Playback','surveillance/Floors','intelligence/IntelOverview','intelligence/Cases','intelligence/People','intelligence/Organizations','intelligence/Relationships','intelligence/Records','intelligence/IntelReports','network/NetworkOverview','network/Topology','network/Servers','network/Devices','network/Traffic','network/Monitoring','forensics/ForensicsOverview','forensics/Evidence','forensics/Files','forensics/Timeline','forensics/HashLab','forensics/Metadata','underground/Market','underground/Vendors','underground/Messages','underground/Orders','cryptography/CryptoOverview','cryptography/Encryption','cryptography/Decryption','cryptography/HashPage','cryptography/Signatures','cryptography/SecretMessages','ai/AIChat','ai/AIReports','ai/AIAnalysis','ai/AISettings','crisis/CrisisOverview','crisis/CrisisIncidents','crisis/Alerts','crisis/Infrastructure','crisis/CrisisTimeline','communications/CommsOverview','communications/CommsMessages','communications/Operators','communications/Calls','communications/Dispatch','missions/MissionDashboard','missions/MissionBuilder','missions/ActiveMissions','missions/MissionHistory','missions/Templates','reports/ReportsOverview','reports/FinancialReports','reports/CyberReports','reports/NetworkReports','reports/IntelReportsPage','reports/MissionReports','reports/ReportDetail','settings/SettingsGeneral','settings/SettingsProfile','settings/SettingsAppearance','settings/SettingsSound','settings/SettingsShortcuts','settings/SettingsSimulation','settings/SettingsData']
for (const m of list) await render(`/src/pages/${m}.tsx`, m)

console.log('\nFAILURES:', fail.length)
fail.forEach(([l, e]) => console.log(' -', l, '::', e))
await server.close()
process.exit(0)
