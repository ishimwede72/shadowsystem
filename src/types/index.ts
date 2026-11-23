// ============================================================================
// SHADOW SYSTEMS — Core domain types
// All records represent FICTIONAL simulation data only.
// ============================================================================

export type EntityStatus = 'active' | 'inactive' | 'pending' | 'suspended'
export type Severity = 'low' | 'elevated' | 'critical'
export type RiskLevel = 'low' | 'guarded' | 'elevated' | 'high' | 'severe'

export interface Operator {
  id: string
  callsign: string
  displayName: string
  role: string
  clearance: 'C1' | 'C2' | 'C3' | 'C4' | 'OMEGA'
  avatarSeed: string
  status: 'online' | 'away' | 'offline' | 'field'
  email: string
  unit: string
  lastSeen: string
}

// ---------------------------- Finance ---------------------------------------
export interface Bank {
  id: string
  name: string
  code: string
  country: string
  countryCode: string
  currency: string
  swift: string
  logoMark: string
  status: EntityStatus
  accountCount: number
  volume: number
  tier: 'TIER 1' | 'TIER 2' | 'TIER 3'
}

export interface Account {
  id: string
  holder: string
  bankId: string
  category: 'PERSONAL' | 'BUSINESS' | 'CORPORATE' | 'SAVINGS' | 'INTERNATIONAL'
  currency: string
  available: number
  total: number
  status: EntityStatus
  iban: string
  opened: string
  ownerId?: string
}

export type TransactionStatus = 'completed' | 'pending' | 'declined' | 'cancelled'
export type TransactionChannel = 'SWIFT' | 'SEPA' | 'WIRE' | 'ACH' | 'CRYPTO' | 'INTERNAL' | 'CARD'

export interface Transaction {
  id: string
  reference: string
  sender: string
  senderId: string
  recipient: string
  recipientId: string
  amount: number
  currency: string
  type: 'incoming' | 'outgoing'
  channel: TransactionChannel
  status: TransactionStatus
  timestamp: string
  fee: number
  note: string
  simulated: true
}

export interface Card {
  id: string
  holder: string
  accountId: string
  last4: string
  category: 'DEBIT' | 'CREDIT' | 'PREPAID' | 'CORPORATE'
  brand: 'SHADOW DEBIT' | 'SHADOW CREDIT' | 'ORBIT'
  expiry: string
  status: 'active' | 'frozen' | 'expired'
  limit: number
  spent: number
  design: string
}

export interface Asset {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  holding: number
  allocation: number
  spark: number[]
}

export interface Wallet {
  id: string
  label: string
  address: string
  network: string
  balanceUsd: number
  assets: { symbol: string; amount: number; usd: number }[]
  status: EntityStatus
}

// ---------------------------- Cyber -----------------------------------------
export interface SecurityFinding {
  id: string
  systemId: string
  asset: string
  title: string
  severity: Severity
  score: number
  status: 'open' | 'triaged' | 'remediated' | 'accepted'
  remediation: string
  discovered: string
}

export interface FirewallRule {
  id: string
  name: string
  direction: 'INBOUND' | 'OUTBOUND'
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ANY'
  port: string
  action: 'ALLOW' | 'DENY' | 'LOG'
  enabled: boolean
  hits: number
}

export interface CyberEvent {
  id: string
  type: string
  severity: Severity
  source: string
  target: string
  detail: string
  timestamp: string
  blocked: boolean
}

// ---------------------------- GeoINT ----------------------------------------
export interface GeoPoint {
  lat: number
  lng: number
}

export interface Target {
  id: string
  codename: string
  name: string
  role: string
  status: 'tracked' | 'dormant' | 'lost' | 'confirmed'
  position: GeoPoint
  lastPosition: GeoPoint
  moving: boolean
  speedKts: number
  heading: number
  missionId?: string
  city: string
  country: string
  risk: RiskLevel
  trail: GeoPoint[]
  activity: { ts: string; label: string; lat: number; lng: number }[]
}

export interface GeoFence {
  id: string
  name: string
  center: GeoPoint
  radiusKm: number
  active: boolean
  triggers: number
  color: string
}

export interface Route {
  id: string
  name: string
  from: string
  to: string
  waypoints: GeoPoint[]
  distanceKm: number
  eta: string
}

// ---------------------------- Surveillance ----------------------------------
export interface Camera {
  id: string
  label: string
  location: string
  zone: string
  floor: number
  status: 'online' | 'offline' | 'degraded' | 'maintenance'
  recording: boolean
  signal: number
  favorite: boolean
  x: number
  y: number
  fps: number
  resolution: string
}

export interface SurveillanceIncident {
  id: string
  cameraId: string
  type: 'motion' | 'interrupted' | 'restored' | 'unusual' | 'recording' | 'zone'
  severity: Severity
  detail: string
  timestamp: string
  status: 'open' | 'acknowledged' | 'closed'
}

// ---------------------------- Intelligence ----------------------------------
export interface Identity {
  id: string
  name: string
  alias: string[]
  dob: string
  nationality: string
  occupation: string
  address: string
  avatarSeed: string
  risk: RiskLevel
  status: 'active' | 'monitored' | 'cleared' | 'flagged'
  caseIds: string[]
  orgId?: string
  tags: string[]
  associatedAccounts: string[]
}

export interface Organization {
  id: string
  name: string
  hq: string
  country: string
  category: string
  status: EntityStatus
  profileIds: string[]
  caseIds: string[]
  risk: RiskLevel
  founded: string
  revenue: string
}

export interface InvestigationCase {
  id: string
  title: string
  code: string
  status: 'open' | 'active' | 'cold' | 'closed'
  priority: Severity
  lead: string
  opened: string
  updated: string
  summary: string
  evidenceIds: string[]
  profileIds: string[]
  orgIds: string[]
  progress: number
}

export interface EvidenceRecord {
  id: string
  caseId: string
  description: string
  category: 'DOCUMENT' | 'DEVICE' | 'COMMS' | 'FINANCIAL' | 'PHOTO' | 'DATA'
  collected: string
  status: 'sealed' | 'analyzed' | 'pending' | 'released'
  notes: string
  hash: string
}

export interface GraphNode {
  id: string
  label: string
  type: 'person' | 'org' | 'account' | 'case' | 'phone' | 'evidence'
  risk?: RiskLevel
  x?: number
  y?: number
}

export interface GraphLink {
  source: string
  target: string
  label: string
  strength: number
}

// ---------------------------- Network ---------------------------------------
export interface NetworkNode {
  id: string
  hostname: string
  label: string
  type: 'ROUTER' | 'SWITCH' | 'SERVER' | 'FIREWALL' | 'NODE' | 'GATEWAY' | 'STORAGE'
  zone: string
  status: 'online' | 'offline' | 'degraded'
  ip: string
  latency: number
  load: number
  os?: string
  cpu: number
  memory: number
  disk: number
  uptime: string
  x: number
  y: number
}

export interface NetworkLink {
  id: string
  source: string
  target: string
  bandwidth: number
  status: 'up' | 'down' | 'congested'
  traffic: number
}

export interface TrafficSample {
  t: string
  inbound: number
  outbound: number
  packets: number
  latency: number
}

// ---------------------------- Forensics -------------------------------------
export interface ForensicsCase {
  id: string
  title: string
  status: 'active' | 'analyzing' | 'complete' | 'archived'
  evidenceCount: number
  analyst: string
  opened: string
  progress: number
}

export interface FileAnalysis {
  id: string
  name: string
  size: number
  mime: string
  created: string
  modified: string
  sha256: string
  status: 'analyzed' | 'pending'
}

export interface TimelineEvent {
  id: string
  ts: string
  category: string
  evidenceId: string
  caseId: string
  description: string
  severity: Severity
}

// ---------------------------- Underground -----------------------------------
export interface Vendor {
  id: string
  handle: string
  rating: number
  reviews: number
  deals: number
  status: 'verified' | 'probation' | 'flagged' | 'offline'
  joined: string
  specialties: string[]
  avatarSeed: string
}

export interface Listing {
  id: string
  title: string
  vendorId: string
  category: 'FORGED-CREDENTIAL-KIT' | 'PROP-DEVICE' | 'SCRIPT-KIT' | 'FICTION-INTEL' | 'PROP-TOOL' | 'DEMO-ACCESS'
  price: number
  currency: string
  stock: number
  escrow: boolean
  rating: number
  description: string
  status: 'live' | 'paused' | 'sold-out'
}

export interface MarketOrder {
  id: string
  listingId: string
  vendorId: string
  buyer: string
  amount: number
  escrow: 'held' | 'released' | 'disputed' | 'cancelled'
  status: 'open' | 'shipped' | 'complete' | 'cancelled'
  created: string
}

// ---------------------------- Missions --------------------------------------
export type MissionStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'failed' | 'stopped'

export interface MissionEvent {
  id: string
  at: number // seconds from mission start
  module: ModuleKey
  action: string
  label: string
  payload?: Record<string, unknown>
  severity?: Severity
  duration?: number
}

export interface Mission {
  id: string
  code: string
  name: string
  description: string
  category: string
  severity: Severity
  status: MissionStatus
  progress: number
  currentStage: string
  startedAt: string
  etaMinutes: number
  modules: ModuleKey[]
  events: MissionEvent[]
  templateId?: string
  operatorId: string
}

export interface ScenarioTemplate {
  id: string
  code: string
  name: string
  description: string
  category: string
  severity: Severity
  durationMinutes: number
  modules: ModuleKey[]
  events: MissionEvent[]
  accent: string
}

export type ModuleKey =
  | 'command'
  | 'finance'
  | 'cyber'
  | 'geoint'
  | 'surveillance'
  | 'intelligence'
  | 'network'
  | 'forensics'
  | 'underground'
  | 'crypto'
  | 'ai'
  | 'crisis'
  | 'comms'
  | 'missions'
  | 'reports'

// ---------------------------- Crisis ----------------------------------------
export interface CrisisIncident {
  id: string
  title: string
  severity: Severity
  status: 'monitoring' | 'escalated' | 'contained' | 'resolved'
  affected: string[]
  reported: string
  updated: string
  description: string
  timeline: { ts: string; label: string; done: boolean }[]
  countdown?: number
}

export interface InfrastructureNode {
  id: string
  name: string
  type: 'GRID' | 'WATER' | 'TELECOM' | 'FINANCE' | 'HEALTH' | 'TRANSIT'
  health: number
  status: 'nominal' | 'degraded' | 'critical' | 'offline'
  region: string
  load: number
}

// ---------------------------- Comms -----------------------------------------
export interface Channel {
  id: string
  name: string
  kind: 'channel' | 'direct' | 'dispatch' | 'broadcast'
  members: string[]
  unread: number
  topic: string
}

export interface ChatMessage {
  id: string
  channelId: string
  operatorId: string
  body: string
  ts: string
  encrypted: boolean
  delivery: 'sending' | 'sent' | 'delivered' | 'read'
  attachments?: { name: string; kind: string }[]
}

export interface CallRecord {
  id: string
  operatorId: string
  direction: 'incoming' | 'outgoing'
  status: 'ringing' | 'active' | 'ended' | 'missed'
  started: string
  duration: number
  channel: string
}

// ---------------------------- System ----------------------------------------
export interface Notification {
  id: string
  type:
    | 'success'
    | 'failure'
    | 'pending'
    | 'incident'
    | 'mission-start'
    | 'mission-complete'
    | 'camera'
    | 'node'
    | 'finance'
    | 'emergency'
    | 'ai'
  title: string
  body: string
  ts: string
  read: boolean
  severity: Severity
  module?: ModuleKey
  href?: string
}

export interface ActivityEntry {
  id: string
  ts: string
  module: ModuleKey | 'system'
  actor: string
  action: string
  detail: string
  level: 'info' | 'success' | 'warning' | 'critical'
}

export interface BusEvent {
  id: string
  topic: string
  payload: Record<string, unknown>
  ts: string
  severity?: Severity
}

export interface AppService {
  id: string
  name: string
  status: 'operational' | 'degraded' | 'offline' | 'standby'
  health: number
  latency: number
  detail: string
}

export interface GeneratedReport {
  id: string
  number: string
  title: string
  type:
    | 'intelligence'
    | 'incident'
    | 'financial'
    | 'network'
    | 'mission'
    | 'surveillance'
  department: string
  generated: string
  author: string
  summary: string
  analysis: string[]
  metrics: { label: string; value: string }[]
  classification: 'FICTIONAL · INTERNAL' | 'FICTIONAL · RESTRICTED' | 'FICTIONAL · DEMO'
}

export interface MarketTicker {
  symbol: string
  price: number
  change: number
}
