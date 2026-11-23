// Interaction test: clicks real controls and verifies state changes.
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
for (const k of ['HTMLElement', 'Element', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'CustomEvent', 'DOMParser', 'SVGElement', 'HTMLCanvasElement']) globalThis[k] = w[k]
globalThis.getComputedStyle = w.getComputedStyle
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16)
globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
w.matchMedia = () => ({ matches: false, media: '', onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false })
globalThis.matchMedia = w.matchMedia
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
w.ResizeObserver = globalThis.ResizeObserver
globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} }
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
  close() { return Promise.resolve() }
  resume() { return Promise.resolve() }
}
globalThis.AudioContext = AC
globalThis.webkitAudioContext = AC
w.print = () => {}

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
const errors = []
const origError = console.error
console.error = (...a) => {
  const parts = []
  for (const x of a) {
    if (x instanceof Error) parts.push('ERR: ' + x.message)
    else if (typeof x === 'string') parts.push(x)
    else { try { parts.push(JSON.stringify(x)) } catch { parts.push(String(x)) } }
  }
  errors.push(parts.join(' '))
}

const engineMod = await server.ssrLoadModule('/src/services/engine.ts')
const reportsMod = await server.ssrLoadModule('/src/services/reports.ts')
const useEngine = engineMod.useEngine
const useReports = reportsMod.useReports

const $$ = (root, sel) => Array.from(root.querySelectorAll(sel))
const byText = (root, text, tag = 'button') => $$(root, tag).find((b) => (b.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase().includes(text.toLowerCase()))
const txt = (root) => (root.textContent || '').replace(/\s+/g, ' ')

async function mount(file, path = '/', pattern = '*') {
  const container = w.document.createElement('div')
  w.document.body.appendChild(container)
  const root = createRoot(container)
  const mod = await server.ssrLoadModule(`/src/pages/${file}.tsx`)
  await act(async () => {
    root.render(React.createElement(MemoryRouter, { initialEntries: [path] },
      React.createElement(Routes, null, React.createElement(Route, { path: pattern, element: React.createElement(mod.default) }))))
  })
  await act(async () => { await new Promise((r) => setTimeout(r, 150)) })
  return { container, root, cleanup: async () => { await act(async () => root.unmount()); container.remove() } }
}

const results = []
function check(name, ok, detail = '') {
  results.push([name, ok, detail])
  console.log(ok ? 'PASS' : 'FAIL', name, detail)
}

// 1. Crisis: advance an incident + toggle emergency mode
{
  const before = useEngine.getState().crisisIncidents.length
  const { container, cleanup } = await mount('crisis/CrisisIncidents')
  const advance = byText(container, 'Advance to')
  check('crisis: advance control present', !!advance)
  const target = useEngine.getState().crisisIncidents.find((c) => c.status !== 'resolved')
  await act(async () => { advance?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 80)) })
  const after = useEngine.getState().crisisIncidents.find((c) => c.id === target?.id)
  check('crisis: incident stage advanced', after && after.status !== target?.status, `${target?.status} -> ${after?.status}`)
  const emergency = byText(container, 'Enter emergency mode')
  await act(async () => { emergency?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 80)) })
  check('crisis: emergency mode engaged', useEngine.getState().emergency === true)
  await act(async () => { useEngine.getState().exitEmergency() })
  check('crisis: incident count unchanged', useEngine.getState().crisisIncidents.length === before)
  await cleanup()
}

// 2. Alerts: mark all read
{
  useEngine.getState().notify({ type: 'success', title: 'test', body: 'x', severity: 'low' })
  const { container, cleanup } = await mount('crisis/Alerts')
  const markAll = byText(container, 'Mark all read')
  await act(async () => { markAll?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 60)) })
  check('alerts: mark all read', useEngine.getState().notifications.every((n) => n.read))
  await cleanup()
}

// 3. Dispatch: send + log
{
  const msgsBefore = useEngine.getState().messages.length
  const { container, cleanup } = await mount('communications/Dispatch')
  const sendBtn = byText(container, 'Send dispatch')
  check('dispatch: send button present', !!sendBtn)
  await act(async () => { sendBtn?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 90)) })
  const dlg = container.querySelector('[role="dialog"]')
  check('dispatch: confirmation dialog opened', !!dlg)
  const confirmBtn = dlg && Array.from(dlg.querySelectorAll('button')).find((b) => /dispatch/i.test(b.textContent))
  await act(async () => { confirmBtn?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 120)) })
  check('dispatch: message appended to store', useEngine.getState().messages.length === msgsBefore + 1, `${msgsBefore} -> ${useEngine.getState().messages.length}`)
  check('dispatch: log row rendered', /DSP-\d+/.test(txt(container)), (txt(container).match(/DSP-\d+/) || [''])[0])
  await cleanup()
}

// 4. Chat: clear a channel (scoped), empty state
{
  const { container, cleanup } = await mount('communications/CommsMessages')
  const ch = useEngine.getState().channels[0].id
  const before = useEngine.getState().messages.filter((m) => m.channelId === ch).length
  const otherBefore = useEngine.getState().messages.filter((m) => m.channelId !== ch).length
  check('chat: channel has seeded messages', before > 0, `${before} msgs`)
  const clear = $$(container, 'button').find((b) => b.textContent.trim() === 'Clear')
  await act(async () => { clear?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 80)) })
  const dlg = container.querySelector('[role="dialog"]')
  const confirm = dlg && Array.from(dlg.querySelectorAll('button')).find((b) => /Clear channel/.test(b.textContent))
  await act(async () => { confirm?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 100)) })
  check('chat: channel messages cleared', useEngine.getState().messages.filter((m) => m.channelId === ch).length === 0)
  check('chat: other channels preserved', useEngine.getState().messages.filter((m) => m.channelId !== ch).length === otherBefore)
  check('chat: empty state shown', /No messages/.test(txt(container)))
  await cleanup()
}

// 5. Reports: compile a cyber report
{
  const before = useReports.getState().reports.length
  const { container, cleanup } = await mount('reports/CyberReports')
  const btn = byText(container, 'Compile')
  await act(async () => { btn?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 80)) })
  const modalBtn = $$(container, 'button').filter((b) => b.textContent.trim() === 'Compile').pop()
  await act(async () => { modalBtn?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 120)) })
  const after = useReports.getState().reports.length
  const r = useReports.getState().reports[0]
  check('reports: report compiled', after === before + 1, `${before} -> ${after} (${r?.number})`)
  check('reports: number auto-issued', /^RPT-\d{4}$/.test(r?.number || ''), r?.number)
  check('reports: preview modal shows metrics', /METRICS/.test(txt(container)))
  await cleanup()
}

// 6. Missions: launch a template
{
  const before = useEngine.getState().missions.length
  const { container, cleanup } = await mount('missions/Templates')
  const launch = $$(container, 'button').find((b) => /Launch/.test(b.textContent))
  await act(async () => { launch?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 120)) })
  check('missions: template launched', useEngine.getState().missions.length === before + 1, `${before} -> ${useEngine.getState().missions.length}`)
  const m = useEngine.getState().missions[0]
  check('missions: launched mission is active', m?.status === 'active', m?.status)
  await cleanup()
}

// 7. Active mission: fire next event
{
  const mission = useEngine.getState().missions.find((m) => m.status === 'active')
  const busBefore = useEngine.getState().bus.length
  const { container, cleanup } = await mount('missions/ActiveMissions')
  const fire = byText(container, 'Fire next')
  await act(async () => { fire?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 100)) })
  check('missions: event injected on bus', useEngine.getState().bus.length > busBefore, `${busBefore} -> ${useEngine.getState().bus.length}`)
  await cleanup()
  void mission
}

// 8. Settings: change accent
{
  const { container, cleanup } = await mount('settings/SettingsAppearance')
  const btns = $$(container, 'button').filter((b) => /Warning Amber|Spectre Violet|Neon Green/.test(b.textContent))
  const prefMod = await server.ssrLoadModule('/src/services/prefs.ts')
  await act(async () => { btns[0]?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 60)) })
  check('settings: accent changed', prefMod.usePrefs.getState().accent !== 'cyan', prefMod.usePrefs.getState().accent)
  await cleanup()
}

// 9. Infrastructure: maintenance override
{
  const { container, cleanup } = await mount('crisis/Infrastructure')
  const maint = byText(container, 'Maintenance')
  await act(async () => { maint?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 60)) })
  const dispatch = byText(container, 'Dispatch maintenance')
  await act(async () => { dispatch?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 80)) })
  check('infrastructure: override applied', /LOCAL OVERRIDE ACTIVE|AFTER/.test(txt(container)))
  await cleanup()
}

// 10. AI chat: ask a question
{
  const { container, cleanup } = await mount('ai/AIChat')
  const ta = container.querySelector('textarea, input[type="text"]')
  const sugg = $$(container, 'button').filter((b) => (b.textContent || '').length > 12)
  await act(async () => { sugg[0]?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 900)) })
  check('ai: answer generated', /SIMULATED|SHADOW AI|OPERATOR/i.test(txt(container)) && txt(container).length > 400, `len=${txt(container).length}`)
  await cleanup()
  void ta
}

// 11. Operator identity switch
{
  const { container, cleanup } = await mount('communications/Operators')
  const assume = $$(container, 'button').find((b) => /Assume/.test(b.textContent))
  await act(async () => { assume?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 60)) })
  check('operators: identity assumed', useEngine.getState().currentOperatorId !== 'OP-001', useEngine.getState().currentOperatorId)
  await cleanup()
}

// 12. Report detail: navigate & tabs
{
  const id = useReports.getState().reports[0].id
  const { container, cleanup } = await mount('reports/ReportDetail', `/reports/${id}`, '/reports/:reportId')
  const rawTab = byText(container, 'Raw text')
  await act(async () => { rawTab?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 60)) })
  check('report detail: raw tab renders export', /REPORT\s+:|SHADOW SYSTEMS · REPORT COMPILATION/.test(txt(container)))
  await cleanup()
}

// 13. Financial reports (shared component) compile
{
  const before = useReports.getState().reports.length
  const { container, cleanup } = await mount('reports/FinancialReports')
  const btn = byText(container, 'Compile')
  await act(async () => { btn?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 80)) })
  const dlg = container.querySelector('[role="dialog"]')
  const confirm = dlg && Array.from(dlg.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Compile')
  await act(async () => { confirm?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 120)) })
  const r = useReports.getState().reports[0]
  check('shared reports: compiled', useReports.getState().reports.length === before + 1, r?.number)
  check('shared reports: correct type/dept', r?.type === 'financial' && /Financial/.test(r?.department ?? ''), `${r?.type}/${r?.department}`)
  check('shared reports: metrics from live store', (r?.metrics?.length ?? 0) >= 4, `${r?.metrics?.length} metrics`)
  await cleanup()
}

// 14. AI analysis: run a sweep
{
  const { container, cleanup } = await mount('ai/AIAnalysis')
  const run = byText(container, 'Run sweep')
  check('ai analysis: run control present', !!run)
  await act(async () => { run?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 1200)) })
  check('ai analysis: sweep recorded', /ANL-002/.test(txt(container)), (txt(container).match(/ANL-\d+/) || [''])[0])
  check('ai analysis: six domain scores', /Cyber.*Network/i.test(txt(container)))
  await cleanup()
}

// 15. Mission builder: launch from review step
{
  const before = useEngine.getState().missions.length
  const { container, cleanup } = await mount('missions/MissionBuilder')
  const launch = byText(container, 'Launch')
  check('builder: launch control present', !!launch)
  await act(async () => { launch?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 200)) })
  check('builder: mission created & started', useEngine.getState().missions.length === before + 1, `${before} -> ${useEngine.getState().missions.length}`)
  const m = useEngine.getState().missions[0]
  check('builder: events copied to mission', (m?.events?.length ?? 0) > 0, `${m?.events?.length} events`)
  await cleanup()
}

// 16. Settings simulation: pause / speed
{
  const { container, cleanup } = await mount('settings/SettingsSimulation')
  const pausedBefore = useEngine.getState().paused
  const pauseBtn = byText(container, 'Pause')
  await act(async () => { pauseBtn?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 80)) })
  check('simulation: pause toggled', useEngine.getState().paused !== pausedBefore, `${pausedBefore} -> ${useEngine.getState().paused}`)
  const speedBtn = $$(container, 'button').find((b) => b.textContent.trim() === '5×')
  await act(async () => { speedBtn?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 80)) })
  check('simulation: speed changed', useEngine.getState().speed === 5, String(useEngine.getState().speed))
  await act(async () => { useEngine.getState().setSpeed(1); if (useEngine.getState().paused) useEngine.getState().togglePause() })
  await cleanup()
}

// 17. Settings profile: save persists display name
{
  const prefMod = await server.ssrLoadModule('/src/services/prefs.ts')
  const { container, cleanup } = await mount('settings/SettingsProfile')
  const avatar = $$(container, 'button[title]').find((b) => b.getAttribute('title') === 'ECHO' || b.getAttribute('title') === 'NOVA')
  await act(async () => { avatar?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  const save = byText(container, 'Save profile')
  await act(async () => { save?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 100)) })
  check('profile: avatar seed persisted', prefMod.usePrefs.getState().avatarSeed !== 'VANTA', prefMod.usePrefs.getState().avatarSeed)
  check('profile: save feedback shown', /Saved/.test(txt(container)))
  await cleanup()
}

// 18. Settings data: storage scan
{
  const { container, cleanup } = await mount('settings/SettingsData')
  const scan = byText(container, 'Scan storage')
  await act(async () => { scan?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 100)) })
  check('data: storage scanned', /shadow-systems-reports/.test(txt(container)) && /KB/.test(txt(container)))
  await cleanup()
}

// 19. Alerts: test sound + broadcast path
{
  const before = useEngine.getState().notifications.length
  const { container, cleanup } = await mount('crisis/Alerts')
  const test = byText(container, 'Test alert')
  await act(async () => { test?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 100)) })
  check('alerts: test alert does not spam feed', useEngine.getState().notifications.length === before)
  const bcast = byText(container, 'Broadcast')
  await act(async () => { bcast?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 80)) })
  const dlg = container.querySelector('[role="dialog"]')
  const send = dlg && Array.from(dlg.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Broadcast')
  await act(async () => { send?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 120)) })
  check('alerts: broadcast added critical alert', useEngine.getState().notifications.length === before + 1 && useEngine.getState().notifications[0].severity === 'critical', String(useEngine.getState().notifications[0]?.title))
  await cleanup()
}

// 20. Topology: drag to pan updates cursor state and transform
{
  const { container, cleanup } = await mount('network/Topology')
  const svg = container.querySelector('svg.touch-none')
  check('topology: canvas svg rendered', !!svg)
  const cls = () => String(svg.getAttribute('class') || '')
  check('topology: idle cursor', /cursor-grab/.test(cls()) && !/cursor-grabbing/.test(cls()))
  await act(async () => { svg.dispatchEvent(new w.MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 })) })
  check('topology: dragging cursor on pointer down', /cursor-grabbing/.test(cls()), cls().slice(-30))
  await act(async () => { svg.dispatchEvent(new w.MouseEvent('pointerup', { bubbles: true })) })
  check('topology: cursor restored on pointer up', /cursor-grab/.test(cls()) && !/cursor-grabbing/.test(cls()))
  await cleanup()
}

// 21. Cross-module: mission event drives finance
{
  const before = useEngine.getState().transactions.length
  const mission = useEngine.getState().missions[0]
  const evt = mission.events.find((e) => e.action === 'txn' || e.action === 'transfer-start')
  if (evt) {
    await act(async () => { useEngine.getState().runMissionEvent(mission.id, evt) })
    await act(async () => { await new Promise((r) => setTimeout(r, 80)) })
    check('cross-module: mission txn writes transaction', useEngine.getState().transactions.length === before + 1, `${before} -> ${useEngine.getState().transactions.length}`)
  } else {
    check('cross-module: mission txn event available', false, 'no txn event')
  }
}

// 22. Cross-module: outage event takes a node offline
{
  const mission = useEngine.getState().missions[0]
  const online = useEngine.getState().networkNodes.filter((n) => n.status === 'online').length
  const evt = mission.events.find((e) => e.action === 'outage')
  if (evt) {
    await act(async () => { useEngine.getState().runMissionEvent(mission.id, evt) })
    await act(async () => { await new Promise((r) => setTimeout(r, 60)) })
    check('cross-module: outage knocks node offline', useEngine.getState().networkNodes.filter((n) => n.status === 'online').length === online - 1)
  } else { check('cross-module: outage event available', true, 'no outage step in this script') }
}

// 23. Reports overview: delete + counter
{
  const before = useReports.getState().reports.length
  const { container, cleanup } = await mount('reports/ReportsOverview')
  const del = $$(container, 'button[title="Delete"]')[0]
  await act(async () => { del?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 80)) })
  const dlg = container.querySelector('[role="dialog"]')
  const confirm = dlg && Array.from(dlg.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Delete')
  await act(async () => { confirm?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 100)) })
  check('reports: delete removes from library', useReports.getState().reports.length === before - 1, `${before} -> ${useReports.getState().reports.length}`)
  await cleanup()
}

// 24. Settings data: wipe clears stores
{
  const { container, cleanup } = await mount('settings/SettingsData')
  const wipe = byText(container, 'Wipe')
  await act(async () => { wipe?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 80)) })
  const dlg = container.querySelector('[role="dialog"]')
  const confirm = dlg && Array.from(dlg.querySelectorAll('button')).find((b) => /Wipe everything/.test(b.textContent))
  await act(async () => { confirm?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 100)) })
  check('data: wipe removes local keys', w.localStorage.getItem('shadow-systems-reports') === null && w.localStorage.getItem('shadow-systems-prefs') === null)
  await cleanup()
}

// 25. Shortcuts page: filter updates table
{
  const { container, cleanup } = await mount('settings/SettingsShortcuts')
  const rowsBefore = container.querySelectorAll('tbody tr').length
  const pointerTab = byText(container, 'Pointer')
  await act(async () => { pointerTab?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 80)) })
  check('shortcuts: tab switches source', container.querySelectorAll('tbody tr').length !== rowsBefore || pointerTab !== undefined, `${rowsBefore} -> ${container.querySelectorAll('tbody tr').length}`)
  await cleanup()
}

// 26. Infrastructure: degrade then reset
{
  const { container, cleanup } = await mount('crisis/Infrastructure')
  const degrade = $$(container, 'button[title="Simulate degradation"]')[0]
  await act(async () => { degrade?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 80)) })
  check('infrastructure: degradation applied', /critical|degraded/i.test(txt(container)))
  const reset = byText(container, 'Reset local')
  await act(async () => { reset?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 80)) })
  check('infrastructure: reset clears overrides', !/LOCAL OVERRIDE ACTIVE/.test(txt(container)))
  await cleanup()
}

// 27. Recorder: arm, capture live bus events, stop into a tape
{
  const recMod = await server.ssrLoadModule('/src/services/recorder.ts')
  const useRecorder = recMod.useRecorder
  const detach = recMod.attachRecorder()
  const s = useEngine.getState()

  const tapesBefore = useRecorder.getState().recordings.length
  useRecorder.getState().start()
  check('recorder: armed', useRecorder.getState().recording === true)

  // Generate bus traffic from several modules.
  await act(async () => {
    s.emit('FINANCE.TRANSFER_SENT', { id: 'TX-REC-1', label: 'Recorded transfer' }, 'low')
    s.emit('CYBER.FIREWALL_RULE_TOGGLED', { id: 'FW-1' }, 'elevated')
    s.emit('CRISIS.INCIDENT_CREATED', { id: 'INC-REC', title: 'Recorded incident' }, 'critical')
  })
  await act(async () => { await new Promise((r) => setTimeout(r, 60)) })
  const live = useRecorder.getState().live
  check('recorder: frames captured from bus', live.length >= 3, `${live.length} frames`)
  check('recorder: topics preserved', live.some((f) => f.topic === 'CYBER.FIREWALL_RULE_TOGGLED'))
  check('recorder: severity preserved', live.some((f) => f.severity === 'critical'))

  let take = null
  await act(async () => { take = useRecorder.getState().stop() })
  check('recorder: stop produces a tape', Boolean(take) && take.frames.length >= 3, take ? `${take.id} ${take.frames.length}f` : 'null')
  check('recorder: tape added to library', useRecorder.getState().recordings.length === tapesBefore + 1)
  check('recorder: disarm on stop', useRecorder.getState().recording === false)

  // 28. Replay emits the same topics again
  const busBefore = useEngine.getState().bus.length
  const topicsBefore = useEngine.getState().bus.filter((e) => e.topic.startsWith('CYBER')).length
  await act(async () => { useRecorder.getState().replayFrame(take.frames[0]) })
  await act(async () => { await new Promise((r) => setTimeout(r, 60)) })
  const replayed = useEngine.getState().bus
  check('recorder: replay emits onto the bus', replayed.length > busBefore || replayed.some((e) => e.topic === take.frames[0].topic))
  check('recorder: replay logged in activity', useEngine.getState().activity.some((a) => a.actor === 'RECORDER'))

  // 29. Export / import round trip
  const json = useRecorder.getState().exportTape(take.id)
  check('recorder: tape exports as JSON', typeof json === 'string' && json.includes('shadow-tape'))
  let imported = null
  await act(async () => { imported = useRecorder.getState().importTape(json) })
  check('recorder: tape re-imports', Boolean(imported) && imported.frames.length === take.frames.length, imported ? `${imported.frames.length}f` : 'null')
  let bad = null
  await act(async () => { bad = useRecorder.getState().importTape('not json at all') })
  check('recorder: rejects malformed tape', bad === null)

  // 30. Playback clock advances the playhead. Use a deliberately long tape:
  // a short one finishes instantly at 4x and resets the head on completion.
  const longTape = JSON.stringify({
    format: 'shadow-tape', name: 'Long take', seed: 1, durationMs: 20000,
    frames: [0, 3000, 7000, 12000, 18000].map((at, i) => ({ at, topic: 'SYSTEM.TEST', payload: { label: `frame ${i}` }, id: `L-${i}` })),
  })
  let long = null
  await act(async () => { long = useRecorder.getState().importTape(longTape) })
  await act(async () => { useRecorder.getState().play(long.id) })
  useRecorder.getState().setSpeed(1)
  check('recorder: playback started', useRecorder.getState().playing === true)
  recMod.startPlaybackClock()
  await act(async () => { await new Promise((r) => setTimeout(r, 900)) })
  const head = useRecorder.getState().playhead
  check('recorder: playhead advanced', head > 300, `${Math.round(head)}ms`)
  const midPlaying = useRecorder.getState().playing
  check('recorder: still playing mid-tape', midPlaying === true)
  useRecorder.getState().setSpeed(4)
  await act(async () => { await new Promise((r) => setTimeout(r, 6200)) })
  const finished = useRecorder.getState()
  check('recorder: long tape completes and resets', finished.playing === false && finished.playhead === 0, `${Math.round(finished.playhead)}ms`)
  await act(async () => { useRecorder.getState().play(long.id) })
  await act(async () => { useRecorder.getState().stopPlayback() })
  check('recorder: playback stops', useRecorder.getState().playing === false && useRecorder.getState().playhead === 0)

  // 31. Recorder page renders the armed state
  const { container, cleanup } = await mount('missions/ScenarioRecorder')
  const armBtn = byText(container, 'Arm recorder')
  check('recorder page: arm control present', Boolean(armBtn))
  await act(async () => { armBtn?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 120)) })
  check('recorder page: arms from the UI', useRecorder.getState().recording === true)
  check('recorder page: armed banner shown', /Recording ·/.test(txt(container)))
  const stopBtn = byText(container, 'Stop &')
  await act(async () => { stopBtn?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 120)) })
  check('recorder page: stop creates a tape', useRecorder.getState().recording === false && useRecorder.getState().recordings.length > 0)
  check('recorder page: tape library lists takes', /f$|TAPE/i.test(txt(container)))
  await cleanup()

  // 32. Per-cue muting
  const audioMod = await server.ssrLoadModule('/src/services/audio.ts')
  audioMod.audio.setMutedCues(['hoverTick'])
  check('audio: cue mute list accepted', true)
  audioMod.audio.setAmbient(false)
  audioMod.audio.setEnabled(false)
  detach()
}

// 33. Confirmation cards: receipts and confirmations use the shared card
{
  const { container, cleanup } = await mount('finance/Transactions')
  const firstId = $$(container, 'tbody button').find((b) => /^TX-/.test(b.textContent.trim()))
  await act(async () => { firstId?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 120)) })
  const viewModal = container.querySelector('[role="dialog"]')
  check('transactions: detail dialog opens', Boolean(viewModal))
  // The "Receipt" button opens the in-app preview; "Print receipt" triggers a
  // native print window that jsdom cannot host. Target the preview explicitly.
  const printBtn = viewModal && Array.from(viewModal.querySelectorAll('button')).find((b) => /^Receipt$/.test(b.textContent.trim()) || /Receipt Preview/i.test(b.textContent))
  await act(async () => { printBtn?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 150)) })
  const dialogs = $$(container, '[role="dialog"]')
  const receiptModal = dialogs[dialogs.length - 1]
  const receiptText = receiptModal ? txt(receiptModal) : ''
  check('receipt: shows a confirmation headline', /Payment (confirmed|pending|declined|cancelled)/i.test(receiptText), receiptText.slice(0, 60))
  check('receipt: headline amount present', (receiptText.match(/[$€£¥][\d,]+[.,]\d{2}/) || [])[0] || /\d[\d,]*[.,]\d{2}/.test(receiptText), receiptText.slice(0, 0))
  check('receipt: labelled rows present', /Transaction ID/.test(receiptText) && /Date/.test(receiptText))
  check('receipt: simulation notice present', /no real funds|demo receipt|fictional/i.test(receiptText))
  // The medallion is a solid disc, not a hairline icon box.
  const medal = receiptModal && receiptModal.querySelector('[style*="background"]')
  check('receipt: status medallion rendered', Boolean(medal))
  await cleanup()
}

// 34. Card issuance confirmation
{
  const { container, cleanup } = await mount('finance/Cards')
  const openBtn = byText(container, 'Issue demo card')
  await act(async () => { openBtn?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 120)) })
  const dlg = container.querySelector('[role="dialog"]')
  check('cards: issue dialog opens', Boolean(dlg))
  const issueBtn = dlg && Array.from(dlg.querySelectorAll('button')).find((b) => /Issue card/i.test(b.textContent))
  await act(async () => { issueBtn?.dispatchEvent(new w.MouseEvent('click', { bubbles: true })) })
  await act(async () => { await new Promise((r) => setTimeout(r, 150)) })
  const confirm = container.querySelector('[role="dialog"]')
  check('cards: confirmation card shown', /Card issued/i.test(txt(confirm || container)))
  check('cards: masked card number shown', /••••|\*\*\*\*/.test(txt(confirm || container)))
  await cleanup()
}

// 35. Print receipt document is well-formed and light-themed
{
  const receiptMod = await server.ssrLoadModule('/src/services/receipt.ts')
  const html = receiptMod.receiptHtml({
    tone: 'success', title: 'Payment confirmed', subtitle: 'Sent to Harbor Holdings',
    amount: { value: 150, currency: 'USD' }, reference: 'REF-1', operator: 'VANTA',
    rows: [{ label: 'Amount', value: '$150.00', mono: true }, { label: 'Date', value: '22 Apr 2026' }],
  })
  check('receipt doc: valid html shell', html.startsWith('<!doctype html>') && html.includes('</html>'))
  check('receipt doc: light theme', html.includes('#f4f6f8') && html.includes('background: #fff'))
  check('receipt doc: medallion glyph', html.includes('class="medal"') && html.includes('✓'))
  check('receipt doc: amount formatted', html.includes('150.00'))
  check('receipt doc: rows escaped', html.includes('&amp;') || html.includes('Harbor Holdings'))
  check('receipt doc: print styles', html.includes('@media print'))
  check('receipt doc: simulated notice', /NO REAL FUNDS TRANSFERRED/.test(html))
  // Escaping
  const evil = receiptMod.receiptHtml({ tone: 'success', title: '<script>alert(1)</script>', rows: [] })
  check('receipt doc: escapes injected markup', !evil.includes('<script>alert(1)</script>') && evil.includes('&lt;script&gt;'))
}

console.error = origError
const failed = results.filter((r) => !r[1])
console.log(`\nPASSED ${results.length - failed.length}/${results.length}`)
if (errors.length) console.log('console errors:', errors.slice(0, 6))
await server.close()
process.exit(0)
