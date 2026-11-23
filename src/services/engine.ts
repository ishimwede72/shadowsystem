// ============================================================================
// SHADOW SYSTEMS — Central simulation engine
// One shared store + event bus. Every module reads and writes through here so
// the entire platform stays internally consistent.
// ============================================================================
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Account, ActivityEntry, AppService, Asset, Bank, BusEvent, CallRecord, Camera,
  Card, Channel, ChatMessage, CrisisIncident, CyberEvent, EvidenceRecord,
  FileAnalysis, FirewallRule, ForensicsCase, GeoFence, GraphLink, GraphNode,
  Identity, InfrastructureNode, InvestigationCase, Listing, MarketOrder,
  Mission, MissionEvent, NetworkLink, NetworkNode, Notification, Operator,
  Organization, Route, ScenarioTemplate, SecurityFinding, SurveillanceIncident,
  Target, TimelineEvent, TrafficSample, Transaction, Vendor, Wallet, Severity,
} from '@/types'
import {
  generateOperators, generateBanks, generateAccounts, generateTransactions,
  generateCards, generateAssets, generateWallets, generateFindings,
  generateFirewallRules, generateCyberEvents, generateTargets, generateGeoFences,
  generateRoutes, generateCameras, generateSurveillanceIncidents,
  generateIdentities, generateOrgs, generateCases, generateEvidence, generateGraph,
  generateNetwork, generateTraffic, generateForensicsCases, generateFiles,
  generateForensicTimeline, generateVendors, generateListings, generateOrders,
  generateCrisisIncidents, generateInfrastructure, generateChannels,
  generateMessages, generateCalls, generateMissions, generateTemplates,
  generateNotifications, generateActivity, generateServices,
} from '@/data/generate'
import { makeRng, pad, uuid } from '@/lib/utils'
import { audio } from './audio'

export type SimSpeed = 0.5 | 1 | 2 | 5

export interface EngineState {
  // ---- meta ----
  booted: boolean
  sessionId: string
  simulatedTime: number
  speed: SimSpeed
  paused: boolean
  autoUpdate: boolean
  cinematic: boolean
  emergency: boolean
  emergencyIncidentId: string | null
  seed: number
  tick: number

  // ---- records ----
  operators: Operator[]
  currentOperatorId: string
  banks: Bank[]
  accounts: Account[]
  transactions: Transaction[]
  cards: Card[]
  assets: Asset[]
  wallets: Wallet[]
  findings: SecurityFinding[]
  firewall: FirewallRule[]
  cyberEvents: CyberEvent[]
  targets: Target[]
  geofences: GeoFence[]
  routes: Route[]
  cameras: Camera[]
  surveillanceIncidents: SurveillanceIncident[]
  identities: Identity[]
  organizations: Organization[]
  cases: InvestigationCase[]
  evidence: EvidenceRecord[]
  graph: { nodes: GraphNode[]; links: GraphLink[] }
  networkNodes: NetworkNode[]
  networkLinks: NetworkLink[]
  traffic: TrafficSample[]
  forensicsCases: ForensicsCase[]
  files: FileAnalysis[]
  forensicTimeline: TimelineEvent[]
  vendors: Vendor[]
  listings: Listing[]
  orders: MarketOrder[]
  crisisIncidents: CrisisIncident[]
  infrastructure: InfrastructureNode[]
  channels: Channel[]
  messages: ChatMessage[]
  calls: CallRecord[]
  missions: Mission[]
  templates: ScenarioTemplate[]
  notifications: Notification[]
  activity: ActivityEntry[]
  services: AppService[]
  bus: BusEvent[]

  // ---- actions ----
  boot: () => void
  setSpeed: (s: SimSpeed) => void
  togglePause: () => void
  tickEngine: (deltaSeconds: number) => void
  emit: (topic: string, payload?: Record<string, unknown>, severity?: Severity) => void
  notify: (n: Omit<Notification, 'id' | 'ts' | 'read'> & { read?: boolean }) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clearNotifications: () => void
  logActivity: (a: Omit<ActivityEntry, 'id' | 'ts'>) => void

  addTransaction: (t: Omit<Transaction, 'id' | 'simulated'>) => Transaction
  updateTransaction: (id: string, patch: Partial<Transaction>) => void
  addAccount: (a: Omit<Account, 'id'>) => Account
  addBank: (b: Omit<Bank, 'id'>) => Bank
  addCard: (c: Omit<Card, 'id'>) => void
  toggleCardFreeze: (id: string) => void
  swapAssets: (from: string, to: string, fromAmount: number, result: number) => void

  addFirewallRule: (r: Omit<FirewallRule, 'id' | 'hits'>) => void
  toggleFirewallRule: (id: string) => void
  addCyberEvent: (e: Omit<CyberEvent, 'id' | 'timestamp'>) => void
  updateFinding: (id: string, patch: Partial<SecurityFinding>) => void

  setTargetPosition: (id: string, lat: number, lng: number) => void
  toggleTargetMoving: (id: string) => void
  addGeofence: (g: Omit<GeoFence, 'id' | 'triggers'>) => void
  toggleGeofence: (id: string) => void

  setCameraStatus: (id: string, status: Camera['status']) => void
  toggleCameraFavorite: (id: string) => void
  addSurveillanceIncident: (i: Omit<SurveillanceIncident, 'id' | 'timestamp'>) => void
  ackSurveillanceIncident: (id: string) => void

  addCase: (c: Omit<InvestigationCase, 'id'>) => InvestigationCase
  updateCase: (id: string, patch: Partial<InvestigationCase>) => void
  addEvidence: (e: Omit<EvidenceRecord, 'id' | 'hash'>) => void

  updateNetworkNode: (id: string, patch: Partial<NetworkNode>) => void
  setNetworkLinkStatus: (id: string, status: NetworkLink['status']) => void

  addForensicsCase: (c: Omit<ForensicsCase, 'id'>) => void
  addFileAnalysis: (f: Omit<FileAnalysis, 'id'>) => void
  addTimelineEvent: (e: Omit<TimelineEvent, 'id'>) => void

  updateListing: (id: string, patch: Partial<Listing>) => void
  addOrder: (o: Omit<MarketOrder, 'id' | 'created'>) => void
  updateOrder: (id: string, patch: Partial<MarketOrder>) => void

  addCrisisIncident: (c: Omit<CrisisIncident, 'id' | 'reported' | 'updated'>) => void
  updateCrisisIncident: (id: string, patch: Partial<CrisisIncident>) => void
  enterEmergency: (incidentId?: string) => void
  exitEmergency: () => void

  sendMessage: (channelId: string, body: string, encrypted?: boolean) => void
  setChannelUnread: (id: string, n: number) => void
  clearChannel: (id: string) => void
  addCall: (c: Omit<CallRecord, 'id'>) => CallRecord
  updateCall: (id: string, patch: Partial<CallRecord>) => void

  createMission: (m: Omit<Mission, 'id' | 'startedAt' | 'progress' | 'currentStage'>) => Mission
  startMission: (id: string) => void
  pauseMission: (id: string) => void
  resumeMission: (id: string) => void
  stopMission: (id: string) => void
  completeMission: (id: string) => void
  deleteMission: (id: string) => void
  runMissionEvent: (missionId: string, event: MissionEvent) => void

  resetSimulation: (newSeed?: boolean) => void
  setOperator: (id: string) => void
}

function buildWorld(seed: number) {
  const rng = makeRng(seed)
  const operators = generateOperators(rng)
  const banks = generateBanks(rng)
  const accounts = generateAccounts(rng, banks, operators)
  const transactions = generateTransactions(rng, accounts)
  const cards = generateCards(rng, accounts)
  const assets = generateAssets(rng)
  const wallets = generateWallets(rng, assets)
  const findings = generateFindings(rng)
  const firewall = generateFirewallRules(rng)
  const cyberEvents = generateCyberEvents(rng)
  const templates = generateTemplates(rng)
  const missions = generateMissions(rng, templates, operators)
  const targets = generateTargets(rng, missions)
  const geofences = generateGeoFences(rng)
  const routes = generateRoutes(rng)
  const cameras = generateCameras(rng)
  const surveillanceIncidents = generateSurveillanceIncidents(rng, cameras)
  const casesSeed = generateCases(rng, operators)
  const orgs = generateOrgs(rng)
  const identities = generateIdentities(rng, orgs, casesSeed)
  const evidence = generateEvidence(rng, casesSeed)
  const graph = generateGraph(rng, identities, orgs, casesSeed)
  const { nodes: networkNodes, links: networkLinks } = generateNetwork(rng)
  const traffic = generateTraffic(rng)
  const forensicsCases = generateForensicsCases(rng, operators)
  const files = generateFiles(rng)
  const forensicTimeline = generateForensicTimeline(rng, forensicsCases)
  const vendors = generateVendors(rng)
  const listings = generateListings(rng, vendors)
  const orders = generateOrders(rng, listings, vendors, operators)
  const crisisIncidents = generateCrisisIncidents(rng)
  const infrastructure = generateInfrastructure(rng)
  const channels = generateChannels()
  const messages = generateMessages(rng, channels, operators)
  const calls = generateCalls(rng, operators)
  const notifications = generateNotifications()
  const activity = generateActivity(operators)
  const services = generateServices()

  // link cases back to orgs
  casesSeed.forEach((c, i) => {
    const org = orgs[i % orgs.length]
    if (!org.caseIds.includes(c.id)) org.caseIds.push(c.id)
    c.orgIds = [org.id]
    c.profileIds = identities.filter((p) => p.caseIds.includes(c.id)).map((p) => p.id)
  })

  return {
    operators, banks, accounts, transactions, cards, assets, wallets, findings,
    firewall, cyberEvents, templates, missions, targets, geofences, routes,
    cameras, surveillanceIncidents,
    cases: casesSeed, orgs, identities, evidence, graph,
    networkNodes, networkLinks, traffic, forensicsCases, files, forensicTimeline,
    vendors, listings, orders, crisisIncidents, infrastructure, channels, messages,
    calls, notifications, activity, services,
  }
}

const SEED = 20261123

export const useEngine = create<EngineState>()(
  persist(
    (set, get) => {
      const world = buildWorld(SEED)
      return {
        booted: false,
        sessionId: `SES-${uuid('').toUpperCase()}`,
        simulatedTime: Date.now(),
        speed: 1,
        paused: false,
        autoUpdate: true,
        cinematic: false,
        emergency: false,
        emergencyIncidentId: null,
        seed: SEED,
        tick: 0,
        currentOperatorId: world.operators[0].id,
        bus: [],
        ...world,
        organizations: world.orgs,

        boot: () => {
          set({ booted: true, simulatedTime: Date.now() })
          get().emit('SYSTEM.BOOT', { session: get().sessionId })
        },

        setSpeed: (speed) => {
          set({ speed })
          get().logActivity({ module: 'system', actor: 'SIM ENGINE', action: `Simulation speed set to ${speed}x`, detail: 'Engine control', level: 'info' })
        },

        togglePause: () => {
          const paused = !get().paused
          set({ paused })
          get().emit(paused ? 'SYSTEM.PAUSED' : 'SYSTEM.RESUMED', {})
        },

        tickEngine: (deltaSeconds) => {
          const s = get()
          if (s.paused) return
          set({ simulatedTime: s.simulatedTime + deltaSeconds * 1000 * s.speed, tick: s.tick + 1 })

          // Ambient engine activity: keeps the platform alive and consistent.
          if (s.tick % 12 !== 0) return
          const rng = Math.random
          const roll = rng()

          if (roll < 0.34) {
            // simulated network traffic drift
            const traffic = [...s.traffic.slice(1), {
              t: new Date().toISOString().slice(11, 16),
              inbound: Math.round(180 + rng() * 740),
              outbound: Math.round(120 + rng() * 620),
              packets: Math.round(40_000 + rng() * 220_000),
              latency: Math.round(4 + rng() * 58),
            }]
            set({ traffic })
          } else if (roll < 0.55) {
            // target drift for moving targets
            const targets = s.targets.map((t) => {
              if (!t.moving) return t
              const step = 0.004 * s.speed
              const lat = t.position.lat + Math.sin((t.heading * Math.PI) / 180) * step
              const lng = t.position.lng + Math.cos((t.heading * Math.PI) / 180) * step
              return {
                ...t,
                lastPosition: t.position,
                position: { lat, lng },
                trail: [...t.trail.slice(-9), { lat, lng }],
              }
            })
            set({ targets })
            const moved = targets.find((t) => t.moving)
            if (moved) get().emit('GEOINT.TARGET_MOVED', { targetId: moved.id, codename: moved.codename })
          } else if (roll < 0.7) {
            // market jitter
            const assets = s.assets.map((a) => {
              const drift = (rng() - 0.48) * a.price * 0.004
              return { ...a, price: Math.max(0.5, Math.round((a.price + drift) * 100) / 100) }
            })
            set({ assets })
          } else if (roll < 0.82) {
            const idx = Math.floor(rng() * s.networkNodes.length)
            const node = s.networkNodes[idx]
            const cpu = Math.max(4, Math.min(98, node.cpu + Math.round((rng() - 0.5) * 14)))
            const memory = Math.max(8, Math.min(96, node.memory + Math.round((rng() - 0.5) * 8)))
            get().updateNetworkNode(node.id, { cpu, memory, load: Math.round((cpu + memory) / 2) })
          } else if (roll < 0.92) {
            const onlineCams = s.cameras.filter((c) => c.status === 'online')
            if (onlineCams.length) {
              const cam = onlineCams[Math.floor(rng() * onlineCams.length)]
              set({
                cameras: s.cameras.map((c) =>
                  c.id === cam.id ? { ...c, signal: Math.max(48, Math.min(99, c.signal + Math.round((rng() - 0.5) * 6))) } : c,
                ),
              })
            }
          } else {
            const activeMission = s.missions.find((m) => m.status === 'active')
            if (activeMission) {
              const progress = Math.min(100, activeMission.progress + 1)
              const events = activeMission.events
              const elapsed = (progress / 100) * (activeMission.etaMinutes * 60)
              const due = events.filter((e) => e.at <= elapsed)
              const last = due[due.length - 1]
              set({
                missions: s.missions.map((m) =>
                  m.id === activeMission.id
                    ? { ...m, progress, currentStage: last?.label ?? m.currentStage }
                    : m,
                ),
              })
            }
          }
        },

        emit: (topic, payload = {}, severity) => {
          const evt: BusEvent = { id: uuid('EV'), topic, payload, ts: new Date().toISOString(), severity }
          set({ bus: [evt, ...get().bus].slice(0, 220) })
        },

        notify: (n) => {
          const notification: Notification = {
            ...n,
            id: `NTF-${uuid('').toUpperCase().slice(0, 6)}`,
            ts: new Date().toISOString(),
            read: n.read ?? false,
          }
          set({ notifications: [notification, ...get().notifications].slice(0, 120) })
          audio.play('notify')
        },

        markRead: (id) =>
          set({ notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }),
        markAllRead: () => set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) }),
        clearNotifications: () => set({ notifications: [] }),

        logActivity: (a) => {
          const entry: ActivityEntry = { ...a, id: `ACT-${uuid('').toUpperCase().slice(0, 6)}`, ts: new Date().toISOString() }
          set({ activity: [entry, ...get().activity].slice(0, 300) })
        },

        // ---------------- Finance ----------------
        addTransaction: (t) => {
          const tx: Transaction = { ...t, id: `TX-${Math.floor(90000 + Math.random() * 9999)}`, simulated: true }
          set({ transactions: [tx, ...get().transactions] })
          get().emit(
            tx.status === 'completed'
              ? 'FINANCE.TRANSACTION_COMPLETED'
              : tx.status === 'declined'
                ? 'FINANCE.TRANSACTION_DECLINED'
                : 'FINANCE.TRANSACTION_STARTED',
            { id: tx.id, amount: tx.amount, currency: tx.currency },
            tx.status === 'declined' ? 'elevated' : 'low',
          )
          get().logActivity({
            module: 'finance',
            actor: 'FINANCE SIM',
            action: `Transfer ${tx.status.toUpperCase()} · ${tx.currency} ${tx.amount.toLocaleString()}`,
            detail: tx.reference,
            level: tx.status === 'completed' ? 'success' : tx.status === 'declined' ? 'warning' : 'info',
          })
          return tx
        },

        updateTransaction: (id, patch) =>
          set({ transactions: get().transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)) }),

        addAccount: (a) => {
          const acc: Account = { ...a, id: `ACC-${pad(2000 + get().accounts.length + 1, 4)}` }
          set({ accounts: [acc, ...get().accounts] })
          get().logActivity({ module: 'finance', actor: 'FINANCE SIM', action: `Account ${acc.id} created for ${acc.holder}`, detail: acc.category, level: 'success' })
          return acc
        },

        addBank: (b) => {
          const bank: Bank = { ...b, id: `BNK-${pad(100 + get().banks.length + 1, 3)}` }
          set({ banks: [bank, ...get().banks] })
          get().logActivity({ module: 'finance', actor: 'FINANCE SIM', action: `Institution ${bank.name} registered`, detail: bank.country, level: 'success' })
          return bank
        },

        addCard: (c) => {
          const card: Card = { ...c, id: `CRD-${pad(get().cards.length + 100, 3)}` }
          set({ cards: [card, ...get().cards] })
          get().notify({ type: 'finance', title: 'Card issued (simulated)', body: `${card.brand} ending ${card.last4} added to demo wallet.`, severity: 'low', module: 'finance' })
        },

        toggleCardFreeze: (id) => {
          const cards = get().cards.map((c) =>
            c.id === id ? { ...c, status: c.status === 'frozen' ? ('active' as const) : ('frozen' as const) } : c,
          )
          set({ cards })
          const card = cards.find((c) => c.id === id)!
          get().notify({
            type: 'pending',
            title: card.status === 'frozen' ? 'Card frozen (simulated)' : 'Card unfrozen',
            body: `${card.brand} •••• ${card.last4} is now ${card.status.toUpperCase()}.`,
            severity: 'low',
            module: 'finance',
          })
        },

        swapAssets: (from, to, fromAmount, result) => {
          const assets = get().assets.map((a) => {
            if (a.symbol === from) return { ...a, holding: Math.max(0, Math.round((a.holding - fromAmount) * 10000) / 10000) }
            if (a.symbol === to) return { ...a, holding: Math.round((a.holding + result) * 10000) / 10000 }
            return a
          })
          set({ assets })
          get().emit('FINANCE.SWAP_COMPLETED', { from, to, fromAmount, result }, 'low')
          audio.play('uplink')
          get().notify({ type: 'success', title: 'Simulated swap executed', body: `${fromAmount} ${from} → ${result.toFixed(6)} ${to}`, severity: 'low', module: 'finance' })
        },

        // ---------------- Cyber ----------------
        addFirewallRule: (r) => {
          const rule: FirewallRule = { ...r, id: `FWR-${pad(get().firewall.length + 100, 3)}`, hits: 0 }
          set({ firewall: [rule, ...get().firewall] })
          get().logActivity({ module: 'cyber', actor: 'FIREWALL SIM', action: `Rule ${rule.name} added`, detail: rule.action, level: 'success' })
        },

        toggleFirewallRule: (id) => {
          set({ firewall: get().firewall.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)) })
          get().emit('CYBER.FIREWALL_RULE_TOGGLED', { id }, 'low')
        },

        addCyberEvent: (e) => {
          const evt: CyberEvent = { ...e, id: `CYE-${pad(get().cyberEvents.length + 100, 4)}`, timestamp: new Date().toISOString() }
          set({ cyberEvents: [evt, ...get().cyberEvents].slice(0, 120) })
        },

        updateFinding: (id, patch) =>
          set({ findings: get().findings.map((f) => (f.id === id ? { ...f, ...patch } : f)) }),

        // ---------------- GeoINT ----------------
        setTargetPosition: (id, lat, lng) =>
          set({
            targets: get().targets.map((t) =>
              t.id === id ? { ...t, lastPosition: t.position, position: { lat, lng }, trail: [...t.trail.slice(-9), { lat, lng }] } : t,
            ),
          }),

        toggleTargetMoving: (id) => {
          const targets = get().targets.map((t) => (t.id === id ? { ...t, moving: !t.moving } : t))
          set({ targets })
          const t = targets.find((x) => x.id === id)!
          get().emit(t.moving ? 'GEOINT.TARGET_TRACKING_STARTED' : 'GEOINT.TARGET_TRACKING_PAUSED', { targetId: id, codename: t.codename })
          if (t.moving) audio.play('lockOn')
        },

        addGeofence: (g) => {
          const fence: GeoFence = { ...g, id: `GEO-${pad(get().geofences.length + 100, 3)}`, triggers: 0 }
          set({ geofences: [fence, ...get().geofences] })
          get().logActivity({ module: 'geoint', actor: 'GEOINT SIM', action: `Geofence ${fence.name} defined`, detail: `${fence.radiusKm}km radius`, level: 'success' })
        },

        toggleGeofence: (id) =>
          set({ geofences: get().geofences.map((g) => (g.id === id ? { ...g, active: !g.active } : g)) }),

        // ---------------- Surveillance ----------------
        setCameraStatus: (id, status) => {
          set({ cameras: get().cameras.map((c) => (c.id === id ? { ...c, status } : c)) })
          const cam = get().cameras.find((c) => c.id === id)!
          audio.play('camera')
          get().emit(status === 'online' ? 'SURVEILLANCE.CAMERA_ONLINE' : 'SURVEILLANCE.CAMERA_OFFLINE', { cameraId: id, label: cam.label }, status === 'online' ? 'low' : 'elevated')
          get().notify({
            type: 'camera',
            title: status === 'online' ? 'Camera feed restored' : 'Camera feed interruption',
            body: `${cam.label} is now ${status.toUpperCase()}.`,
            severity: status === 'online' ? 'low' : 'elevated',
            module: 'surveillance',
          })
        },

        toggleCameraFavorite: (id) =>
          set({ cameras: get().cameras.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c)) }),

        addSurveillanceIncident: (i) => {
          const inc: SurveillanceIncident = { ...i, id: `SVI-${pad(get().surveillanceIncidents.length + 100, 3)}`, timestamp: new Date().toISOString() }
          set({ surveillanceIncidents: [inc, ...get().surveillanceIncidents] })
        },

        ackSurveillanceIncident: (id) =>
          set({ surveillanceIncidents: get().surveillanceIncidents.map((i) => (i.id === id ? { ...i, status: 'acknowledged' } : i)) }),

        // ---------------- Intelligence ----------------
        addCase: (c) => {
          const kase: InvestigationCase = { ...c, id: `CSE-${pad(get().cases.length + 100, 3)}` }
          set({ cases: [kase, ...get().cases] })
          get().notify({ type: 'success', title: 'Case opened', body: `${kase.code} — ${kase.title}`, severity: 'low', module: 'intelligence' })
          return kase
        },

        updateCase: (id, patch) =>
          set({ cases: get().cases.map((c) => (c.id === id ? { ...c, ...patch, updated: new Date().toISOString() } : c)) }),

        addEvidence: (e) => {
          const rec: EvidenceRecord = {
            ...e,
            id: `EVD-${pad(get().evidence.length + 100, 4)}`,
            hash: Math.random().toString(16).slice(2).padEnd(32, 'a').slice(0, 32),
          }
          set({ evidence: [rec, ...get().evidence] })
          get().logActivity({ module: 'forensics', actor: 'EVIDENCE SIM', action: `Evidence ${rec.id} registered`, detail: rec.description, level: 'success' })
        },

        // ---------------- Network ----------------
        updateNetworkNode: (id, patch) =>
          set({ networkNodes: get().networkNodes.map((n) => (n.id === id ? { ...n, ...patch } : n)) }),

        setNetworkLinkStatus: (id, status) =>
          set({ networkLinks: get().networkLinks.map((l) => (l.id === id ? { ...l, status } : l)) }),

        // ---------------- Forensics ----------------
        addForensicsCase: (c) => {
          const kase: ForensicsCase = { ...c, id: `FRC-${pad(get().forensicsCases.length + 100, 3)}` }
          set({ forensicsCases: [kase, ...get().forensicsCases] })
        },

        addFileAnalysis: (f) => set({ files: [{ ...f, id: `FIL-${pad(get().files.length + 100, 3)}` }, ...get().files] }),

        addTimelineEvent: (e) => set({ forensicTimeline: [{ ...e, id: `TLE-${pad(get().forensicTimeline.length + 100, 3)}` }, ...get().forensicTimeline] }),

        // ---------------- Underground ----------------
        updateListing: (id, patch) =>
          set({ listings: get().listings.map((l) => (l.id === id ? { ...l, ...patch } : l)) }),

        addOrder: (o) => {
          const order: MarketOrder = { ...o, id: `ORD-${Math.floor(7000 + Math.random() * 999)}`, created: new Date().toISOString() }
          set({ orders: [order, ...get().orders] })
          get().notify({ type: 'pending', title: 'Demo escrow opened', body: `Order ${order.id} registered with simulated escrow.`, severity: 'low', module: 'underground' })
        },

        updateOrder: (id, patch) =>
          set({ orders: get().orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) }),

        // ---------------- Crisis ----------------
        addCrisisIncident: (c) => {
          const inc: CrisisIncident = { ...c, id: `CRI-${pad(get().crisisIncidents.length + 100, 3)}`, reported: new Date().toISOString(), updated: new Date().toISOString() }
          set({ crisisIncidents: [inc, ...get().crisisIncidents] })
          get().emit('CRISIS.INCIDENT_CREATED', { id: inc.id, title: inc.title }, inc.severity)
          get().notify({ type: 'incident', title: 'Crisis incident logged', body: inc.title, severity: inc.severity, module: 'crisis' })
        },

        updateCrisisIncident: (id, patch) =>
          set({ crisisIncidents: get().crisisIncidents.map((c) => (c.id === id ? { ...c, ...patch, updated: new Date().toISOString() } : c)) }),

        enterEmergency: (incidentId) => {
          set({ emergency: true, emergencyIncidentId: incidentId ?? get().crisisIncidents[0]?.id ?? null })
          audio.play('alert')
          get().emit('CRISIS.EMERGENCY_MODE_ON', { incidentId }, 'critical')
          get().notify({ type: 'emergency', title: 'EMERGENCY MODE ACTIVE', body: 'Full-screen fictional emergency presentation engaged.', severity: 'critical', module: 'crisis' })
        },

        exitEmergency: () => {
          set({ emergency: false })
          get().emit('CRISIS.EMERGENCY_MODE_OFF', {}, 'low')
        },

        // ---------------- Comms ----------------
        sendMessage: (channelId, body, encrypted = true) => {
          const msg: ChatMessage = {
            id: `MSG-${uuid('').toUpperCase().slice(0, 6)}`,
            channelId,
            operatorId: get().currentOperatorId,
            body,
            ts: new Date().toISOString(),
            encrypted,
            delivery: 'sending',
          }
          set({ messages: [...get().messages, msg] })
          setTimeout(() => {
            set({ messages: get().messages.map((m) => (m.id === msg.id ? { ...m, delivery: 'delivered' } : m)) })
          }, 900)
        },

        setChannelUnread: (id, n) =>
          set({ channels: get().channels.map((c) => (c.id === id ? { ...c, unread: n } : c)) }),

        clearChannel: (id) => {
          const removed = get().messages.filter((m) => m.channelId === id).length
          set({ messages: get().messages.filter((m) => m.channelId !== id) })
          get().emit('COMMS.CHANNEL_CLEARED', { channelId: id, removed })
          get().notify({ type: 'success', title: 'Channel cleared', body: `${removed} local messages removed from this channel`, severity: 'low', module: 'comms' })
        },

        addCall: (c) => {
          const call: CallRecord = { ...c, id: `CAL-${pad(get().calls.length + 100, 3)}` }
          set({ calls: [call, ...get().calls] })
          return call
        },

        updateCall: (id, patch) => set({ calls: get().calls.map((c) => (c.id === id ? { ...c, ...patch } : c)) }),

        // ---------------- Missions ----------------
        createMission: (m) => {
          const mission: Mission = {
            ...m,
            id: `MSN-${pad(get().missions.length + 100, 3)}`,
            startedAt: new Date().toISOString(),
            progress: 0,
            currentStage: m.status === 'active' ? 'Initializing' : 'Draft',
          }
          set({ missions: [mission, ...get().missions] })
          get().logActivity({ module: 'missions', actor: 'MISSION ENGINE', action: `Mission ${mission.code} created`, detail: mission.name, level: 'success' })
          return mission
        },

        startMission: (id) => {
          const mission = get().missions.find((m) => m.id === id)
          if (!mission) return
          set({
            missions: get().missions.map((m) =>
              m.id === id ? { ...m, status: 'active', startedAt: new Date().toISOString(), currentStage: m.events[0]?.label ?? 'Initializing' } : m,
            ),
          })
          audio.play('mission')
          get().emit('MISSION.STARTED', { id, code: mission.code, name: mission.name }, mission.severity)
          get().notify({ type: 'mission-start', title: `Mission activated — ${mission.code}`, body: mission.name, severity: mission.severity, module: 'missions', href: `/missions/active` })
          get().logActivity({ module: 'missions', actor: 'MISSION ENGINE', action: `Mission ${mission.code} STARTED`, detail: mission.name, level: 'success' })
        },

        pauseMission: (id) => {
          set({ missions: get().missions.map((m) => (m.id === id ? { ...m, status: 'paused' } : m)) })
          get().emit('MISSION.PAUSED', { id }, 'low')
        },

        resumeMission: (id) => {
          set({ missions: get().missions.map((m) => (m.id === id ? { ...m, status: 'active' } : m)) })
          get().emit('MISSION.RESUMED', { id }, 'low')
        },

        stopMission: (id) => {
          set({ missions: get().missions.map((m) => (m.id === id ? { ...m, status: 'stopped' } : m)) })
          get().emit('MISSION.STOPPED', { id }, 'elevated')
          get().logActivity({ module: 'missions', actor: 'MISSION ENGINE', action: 'Mission stopped', detail: id, level: 'warning' })
        },

        completeMission: (id) => {
          const mission = get().missions.find((m) => m.id === id)
          set({ missions: get().missions.map((m) => (m.id === id ? { ...m, status: 'completed', progress: 100, currentStage: 'Archived' } : m)) })
          get().emit('MISSION.COMPLETED', { id, code: mission?.code }, 'low')
          get().notify({ type: 'mission-complete', title: 'Mission completed', body: `${mission?.code} finished. All participating modules reported.`, severity: 'low', module: 'missions' })
        },

        deleteMission: (id) => set({ missions: get().missions.filter((m) => m.id !== id) }),

        runMissionEvent: (missionId, event) => {
          const s = get()
          const mission = s.missions.find((m) => m.id === missionId)
          s.emit(`MISSION.EVENT.${event.module.toUpperCase()}`, { missionId, action: event.action, label: event.label }, event.severity)
          s.logActivity({
            module: event.module,
            actor: 'MISSION ENGINE',
            action: event.label,
            detail: `${mission?.code ?? missionId} · ${event.action}`,
            level: event.severity === 'critical' ? 'critical' : event.severity === 'elevated' ? 'warning' : 'info',
          })

          // Cross-module effects: one mission event can drive the whole platform.
          switch (event.action) {
            case 'txn':
            case 'transfer-start': {
              const acc = s.accounts[0]
              s.addTransaction({
                reference: `REF-${uuid('').toUpperCase().slice(0, 6)}`,
                sender: acc.holder, senderId: acc.id,
                recipient: s.accounts[1].holder, recipientId: s.accounts[1].id,
                amount: 148_500, currency: acc.currency, type: 'outgoing',
                channel: 'SWIFT', status: 'pending', timestamp: new Date().toISOString(),
                fee: 12.5, note: 'Mission-driven simulation',
              })
              break
            }
            case 'anomaly':
              s.addCyberEvent({
                type: 'MISSION ANOMALY (SIM)', severity: event.severity ?? 'elevated',
                source: '10.42.7.19', target: 'shadow-sim-core',
                detail: event.label, blocked: false,
              })
              break
            case 'alert':
            case 'offline': {
              const cam = s.cameras.find((c) => c.status === 'online')
              if (cam) s.setCameraStatus(cam.id, 'degraded')
              break
            }
            case 'escalate':
            case 'emergency':
              s.enterEmergency()
              break
            case 'report':
              s.notify({ type: 'ai', title: 'SHADOW AI compiled a report', body: `${mission?.code}: ${event.label}`, severity: 'low', module: 'ai', href: '/ai/reports' })
              break
            case 'broadcast':
              s.notify({ type: 'emergency', title: 'Emergency broadcast dispatched', body: `${mission?.code} — ${event.label}`, severity: 'critical', module: 'comms' })
              break
            case 'outage': {
              const target = s.networkNodes.find((n) => n.status === 'online')
              if (target) s.updateNetworkNode(target.id, { status: 'offline', cpu: 0, memory: 0 })
              break
            }
            case 'target-move':
            case 'target-move-start': {
              const t = s.targets[0]
              if (t) s.toggleTargetMoving(t.id)
              break
            }
          }
        },

        resetSimulation: (newSeed = false) => {
          const seed = newSeed ? Math.floor(Math.random() * 1_000_000) : SEED
          const nextWorld = buildWorld(seed)
          set({
            ...nextWorld,
            organizations: nextWorld.orgs,
            seed,
            tick: 0,
            simulatedTime: Date.now(),
            emergency: false,
            emergencyIncidentId: null,
            sessionId: `SES-${uuid('').toUpperCase()}`,
            bus: [],
          })
          get().logActivity({ module: 'system', actor: 'SIM ENGINE', action: 'Demonstration reset', detail: `Seed ${seed}`, level: 'warning' })
          get().notify({ type: 'success', title: 'Simulation reset', body: 'All demonstration records regenerated from the seed.', severity: 'low' })
        },

        setOperator: (id) => set({ currentOperatorId: id }),
      }
    },
    {
      name: 'shadow-systems-engine',
      version: 3,
      // Only persist preferences & session flags — records regenerate per session.
      partialize: (s) => ({
        booted: s.booted,
        speed: s.speed,
        autoUpdate: s.autoUpdate,
        currentOperatorId: s.currentOperatorId,
        seed: s.seed,
      }) as unknown as EngineState,
    },
  ),
)

// ---------------------------------------------------------------------------
export const selectOperator = (s: EngineState) =>
  s.operators.find((o) => o.id === s.currentOperatorId) ?? s.operators[0]

export const unreadCount = (s: EngineState) => s.notifications.filter((n) => !n.read).length

export const useSimulatedClock = () => useEngine((s) => s.simulatedTime)
