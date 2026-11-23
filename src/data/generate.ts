// ============================================================================
// Deterministic fictional data generator.
// Every record here is synthetic and intended for cinematic demonstration only.
// ============================================================================
import {
  FIRST_NAMES, LAST_NAMES, CITIES, FICTIONAL_BANKS, ORG_NAMES, ORG_CATEGORIES,
  OPERATOR_NAMES, CAMERA_ZONES, TAG_POOL, VULN_TITLES, REMEDIATIONS,
  FILE_NAMES, MIME_TYPES, LISTING_POOL, OPERATION_TEMPLATES,
} from './vocabulary'
import { pick, intBetween, between, pad } from '@/lib/utils'
import type {
  Account, Asset, Bank, CallRecord, Camera, Channel, ChatMessage, CrisisIncident,
  CyberEvent, EvidenceRecord, FileAnalysis, FirewallRule, ForensicsCase, GeoFence,
  GraphLink, GraphNode, Identity, InfrastructureNode, InvestigationCase, Listing,
  MarketOrder, Mission, MissionEvent, NetworkLink, NetworkNode, Notification,
  Operator, Organization, Route, ScenarioTemplate, SecurityFinding,
  SurveillanceIncident, Target, TimelineEvent, TrafficSample, Transaction, Vendor,
  Wallet, Card, ActivityEntry, AppService, Severity,
} from '@/types'

const B32 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const HEX = '0123456789abcdef'

function code(rng: () => number, len: number, alphabet = B32) {
  let s = ''
  for (let i = 0; i < len; i++) s += alphabet[Math.floor(rng() * alphabet.length)]
  return s
}

function iso(rng: () => number, daysAgoMax = 14) {
  const now = Date.now()
  const offset = between(rng, 0, daysAgoMax * 86400_000)
  return new Date(now - offset).toISOString()
}

// ---------------------------------------------------------------------------
export function generateOperators(rng: () => number): Operator[] {
  return OPERATOR_NAMES.map((o, i) => ({
    id: `OPR-${pad(i + 1, 3)}`,
    callsign: o.callsign,
    displayName: o.name,
    role: o.role,
    clearance: o.clearance as Operator['clearance'],
    avatarSeed: o.callsign,
    status: i === 0 ? 'online' : pick(rng, ['online', 'online', 'away', 'field', 'offline']),
    email: `${o.callsign.toLowerCase()}@shadow.systems.demo`,
    unit: o.unit,
    lastSeen: iso(rng, 1),
  }))
}

export function generateBanks(rng: () => number): Bank[] {
  return FICTIONAL_BANKS.map((b, i) => ({
    id: `BNK-${pad(i + 1, 3)}`,
    name: b.name,
    code: b.code,
    country: b.country,
    countryCode: b.cc,
    currency: b.currency,
    swift: `${b.code}${code(rng, 2)}XX${code(rng, 2)}`,
    logoMark: b.mark,
    status: i === 5 ? 'pending' : 'active',
    accountCount: intBetween(rng, 3, 24),
    volume: Math.round(between(rng, 12, 480) * 1_000_000),
    tier: pick(rng, ['TIER 1', 'TIER 2', 'TIER 3']),
  }))
}

const ACCOUNT_CATS = ['PERSONAL', 'BUSINESS', 'CORPORATE', 'SAVINGS', 'INTERNATIONAL'] as const

export function generateAccounts(rng: () => number, banks: Bank[], operators: Operator[]): Account[] {
  const accounts: Account[] = []
  for (let i = 0; i < 18; i++) {
    const bank = banks[i % banks.length]
    const cat = ACCOUNT_CATS[i % ACCOUNT_CATS.length]
    const holder =
      i % 3 === 0
        ? operators[i % operators.length].displayName
        : `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`
    const total = Math.round(between(rng, 18_000, 4_800_000) * 100) / 100
    accounts.push({
      id: `ACC-${pad(1001 + i, 4)}`,
      holder,
      bankId: bank.id,
      category: cat,
      currency: bank.currency,
      available: Math.round(total * between(rng, 0.62, 0.98) * 100) / 100,
      total,
      status: i === 7 ? 'pending' : i === 15 ? 'suspended' : 'active',
      iban: `${bank.countryCode}${code(rng, 2)} ${code(rng, 4)} ${code(rng, 4)} ${code(rng, 4)}`,
      opened: iso(rng, 900),
    })
  }
  return accounts
}

const CHANNELS = ['SWIFT', 'SEPA', 'WIRE', 'ACH', 'CRYPTO', 'INTERNAL', 'CARD'] as const

export function generateTransactions(rng: () => number, accounts: Account[], count = 46): Transaction[] {
  const txs: Transaction[] = []
  for (let i = 0; i < count; i++) {
    const a = accounts[intBetween(rng, 0, accounts.length - 1)]
    const b = accounts[intBetween(rng, 0, accounts.length - 1)]
    const status = pick(rng, [
      'completed', 'completed', 'completed', 'completed',
      'pending', 'pending', 'declined', 'cancelled',
    ]) as Transaction['status']
    const type = rng() > 0.45 ? 'outgoing' : 'incoming'
    txs.push({
      id: `TX-${pad(90001 + i, 5)}`,
      reference: `REF-${code(rng, 4)}-${code(rng, 6)}`,
      sender: type === 'outgoing' ? a.holder : b.holder,
      senderId: type === 'outgoing' ? a.id : b.id,
      recipient: type === 'outgoing' ? b.holder : a.holder,
      recipientId: type === 'outgoing' ? b.id : a.id,
      amount: Math.round(between(rng, 120, 486_000) * 100) / 100,
      currency: a.currency,
      type,
      channel: pick(rng, CHANNELS),
      status,
      timestamp: iso(rng, 21),
      fee: Math.round(between(rng, 0, 42) * 100) / 100,
      note: pick(rng, [
        'Simulated settlement', 'Demo clearing batch', 'Fictional vendor payment',
        'Simulated treasury move', 'Demonstration remittance', 'Synthetic payroll cycle',
        'Fictional escrow release', 'Simulated interbank sweep',
      ]),
      simulated: true,
    })
  }
  return txs.sort((x, y) => +new Date(y.timestamp) - +new Date(x.timestamp))
}

const CARD_DESIGNS = ['obsidian', 'aurora', 'crimson', 'titanium']

export function generateCards(rng: () => number, accounts: Account[]): Card[] {
  return Array.from({ length: 8 }, (_, i) => {
    const acc = accounts[i % accounts.length]
    return {
      id: `CRD-${pad(i + 1, 3)}`,
      holder: acc.holder,
      accountId: acc.id,
      last4: String(intBetween(rng, 1000, 9999)),
      category: pick(rng, ['DEBIT', 'CREDIT', 'PREPAID', 'CORPORATE']) as Card['category'],
      brand: pick(rng, ['SHADOW DEBIT', 'SHADOW CREDIT', 'ORBIT']) as Card['brand'],
      expiry: `${pad(intBetween(rng, 1, 12))}/${String(27 + intBetween(rng, 0, 3)).slice(-2)}`,
      status: i === 3 ? 'frozen' : 'active',
      limit: pick(rng, [5000, 10000, 25000, 50000, 100000]),
      spent: Math.round(between(rng, 200, 22000)),
      design: CARD_DESIGNS[i % CARD_DESIGNS.length],
    }
  })
}

const ASSETS_BASE = [
  { symbol: 'BTC', name: 'Bitcoin (sim)', price: 68420.55 },
  { symbol: 'ETH', name: 'Ethereum (sim)', price: 3562.18 },
  { symbol: 'USDT', name: 'Tether (sim)', price: 1.0002 },
  { symbol: 'SOL', name: 'Solana (sim)', price: 172.44 },
  { symbol: 'XMR-P', name: 'Monero Prop', price: 148.22 },
  { symbol: 'ZEC-P', name: 'Zcash Prop', price: 38.91 },
]

export function generateAssets(rng: () => number): Asset[] {
  return ASSETS_BASE.map((a, i) => {
    const spark = Array.from({ length: 28 }, (_, k) => {
      const base = Math.sin(k / 3 + i) * 0.5 + 1
      return Math.round(a.price * base * between(rng, 0.92, 1.08) * 100) / 100
    })
    const holding = a.symbol === 'USDT' ? between(rng, 40_000, 120_000) : between(rng, 0.2, 22)
    return {
      id: `AST-${pad(i + 1, 3)}`,
      symbol: a.symbol,
      name: a.name,
      price: a.price,
      change24h: Math.round(between(rng, -8.4, 11.2) * 100) / 100,
      holding: Math.round(holding * 10000) / 10000,
      allocation: 0,
      spark,
    }
  }).map((a, _i, all) => {
    const total = all.reduce((sum, x) => sum + x.holding * x.price, 0)
    return { ...a, allocation: Math.round(((a.holding * a.price) / total) * 1000) / 10 }
  })
}

export function generateWallets(rng: () => number, assets: Asset[]): Wallet[] {
  return Array.from({ length: 5 }, (_, i) => {
    const subset = assets.slice(i % 2, (i % 2) + 3)
    const holdings = subset.map((a) => {
      const amount = Math.round(between(rng, 0.4, 14) * 1000) / 1000
      return { symbol: a.symbol, amount, usd: Math.round(amount * a.price) }
    })
    return {
      id: `WLT-${pad(i + 1, 3)}`,
      label: pick(rng, ['PRIMARY VAULT', 'OPS ESCROW', 'RESERVE COLD', 'TREASURY MIRROR', 'PROP SETTLEMENT']),
      address: `0x${code(rng, 34, HEX)}`,
      network: pick(rng, ['ETH-MAIN (SIM)', 'SOL-SIM', 'BTC-SIM', 'POLYGON-SIM']),
      balanceUsd: holdings.reduce((s, h) => s + h.usd, 0),
      assets: holdings,
      status: i === 4 ? 'inactive' : 'active',
    }
  })
}

// ---------------------------- Cyber -----------------------------------------
export function generateFindings(rng: () => number): SecurityFinding[] {
  return Array.from({ length: 14 }, (_, i) => {
    const sev = pick(rng, ['low', 'elevated', 'elevated', 'critical']) as SecurityFinding['severity']
    return {
      id: `FND-${pad(i + 1, 3)}`,
      systemId: `SYS-${code(rng, 4)}`,
      asset: pick(rng, ['dmz-web-01 (sim)', 'db-core-02 (sim)', 'vpn-gw-01 (sim)', 'mail-relay-03 (sim)', 'api-edge-04 (sim)']),
      title: VULN_TITLES[i % VULN_TITLES.length],
      severity: sev,
      score: Math.round(between(rng, sev === 'critical' ? 8.4 : sev === 'elevated' ? 5.2 : 1.2, sev === 'critical' ? 9.9 : sev === 'elevated' ? 7.9 : 3.9) * 10) / 10,
      status: pick(rng, ['open', 'triaged', 'remediated', 'accepted']) as SecurityFinding['status'],
      remediation: REMEDIATIONS[i % REMEDIATIONS.length],
      discovered: iso(rng, 30),
    }
  })
}

export function generateFirewallRules(rng: () => number): FirewallRule[] {
  const defs = [
    ['ALLOW DEMO HTTPS', 'INBOUND', 'TCP', '443', 'ALLOW'],
    ['ALLOW DEMO SSH (LAB)', 'INBOUND', 'TCP', '22', 'ALLOW'],
    ['DENY SAMPLE TELNET', 'INBOUND', 'TCP', '23', 'DENY'],
    ['LOG FICTION ICMP', 'INBOUND', 'ICMP', '*', 'LOG'],
    ['ALLOW SIM DNS', 'OUTBOUND', 'UDP', '53', 'ALLOW'],
    ['DENY PROP SMB EXTERNAL', 'OUTBOUND', 'TCP', '445', 'DENY'],
    ['ALLOW INTERNAL API', 'OUTBOUND', 'TCP', '8443', 'ALLOW'],
    ['DENY SYNTHETIC ADMIN', 'INBOUND', 'TCP', '8080', 'DENY'],
  ] as const
  return defs.map((d, i) => ({
    id: `FWR-${pad(i + 1, 3)}`,
    name: d[0],
    direction: d[1] as FirewallRule['direction'],
    protocol: d[2] as FirewallRule['protocol'],
    port: d[3],
    action: d[4] as FirewallRule['action'],
    enabled: i !== 5,
    hits: intBetween(rng, 0, 4800),
  }))
}

export function generateCyberEvents(rng: () => number): CyberEvent[] {
  const types = [
    'PORT SCAN (SIM)', 'BRUTE FORCE (SIM)', 'MALFORMED PACKET', 'POLICY VIOLATION',
    'ANOMALOUS BEACON', 'CERT MISMATCH', 'RATE LIMIT TRIPPED', 'SYNTHETIC PAYLOAD',
  ]
  return Array.from({ length: 24 }, (_, i) => ({
    id: `CYE-${pad(i + 1, 4)}`,
    type: pick(rng, types),
    severity: pick(rng, ['low', 'low', 'elevated', 'critical']) as SecurityFinding['severity'],
    source: `${intBetween(rng, 10, 223)}.${intBetween(rng, 0, 255)}.${intBetween(rng, 0, 255)}.${intBetween(rng, 1, 254)}`,
    target: `shadow-sim-${code(rng, 3).toLowerCase()}`,
    detail: 'Event generated inside the closed demonstration sandbox.',
    timestamp: iso(rng, 3),
    blocked: rng() > 0.35,
  })).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
}

// ---------------------------- GeoINT ----------------------------------------
const TARGET_CODENAMES = ['NIGHTJAR', 'OBSIDIAN', 'LANTERN', 'GRAYFIN', 'CINDER', 'HALYARD', 'MERIDIAN-V', 'TALLOW', 'VESPER', 'QUARRY', 'MARLOW', 'SORREL']

export function generateTargets(rng: () => number, missions: Mission[]): Target[] {
  return TARGET_CODENAMES.slice(0, 10).map((cn, i) => {
    const city = CITIES[(i * 3) % CITIES.length]
    const pos = { lat: city.lat + between(rng, -0.14, 0.14), lng: city.lng + between(rng, -0.14, 0.14) }
    const trail = Array.from({ length: 8 }, (_v, k) => ({
      lat: pos.lat + Math.sin(k / 2) * 0.12,
      lng: pos.lng + Math.cos(k / 2) * 0.12,
    }))
    return {
      id: `TGT-${pad(i + 1, 3)}`,
      codename: cn,
      name: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
      role: pick(rng, ['Logistics Broker', 'Financial Intermediary', 'Courier', 'Analyst', 'Contractor', 'Facilitator']),
      status: pick(rng, ['tracked', 'tracked', 'dormant', 'lost', 'confirmed']) as Target['status'],
      position: pos,
      lastPosition: { lat: pos.lat - 0.05, lng: pos.lng - 0.04 },
      moving: i < 4,
      speedKts: Math.round(between(rng, 0, 42)),
      heading: Math.round(between(rng, 0, 360)),
      missionId: missions.length ? missions[i % missions.length].id : undefined,
      city: city.city,
      country: city.country,
      risk: pick(rng, ['low', 'guarded', 'elevated', 'high', 'severe']) as Target['risk'],
      trail,
      activity: Array.from({ length: 5 }, (_x, k) => ({
        ts: new Date(Date.now() - (k + 1) * 3_600_000 * between(rng, 1, 6)).toISOString(),
        label: pick(rng, ['Signal check', 'Location fix', 'Movement recorded', 'Comms burst', 'Dwell detected']),
        lat: pos.lat + between(rng, -0.2, 0.2),
        lng: pos.lng + between(rng, -0.2, 0.2),
      })),
    }
  })
}

export function generateGeoFences(rng: () => number): GeoFence[] {
  return Array.from({ length: 6 }, (_, i) => {
    const city = CITIES[(i * 5) % CITIES.length]
    return {
      id: `GEO-${pad(i + 1, 3)}`,
      name: `${city.city.toUpperCase()} ${pick(rng, ['PORT ZONE', 'AIRPORT RING', 'FINANCIAL DISTRICT', 'DATA CAMPUS', 'LOGISTICS HUB', 'EMBASSY PERIMETER'])}`,
      center: { lat: city.lat, lng: city.lng },
      radiusKm: Math.round(between(rng, 3, 42)),
      active: i !== 4,
      triggers: intBetween(rng, 0, 18),
      color: pick(rng, ['#28d8ea', '#377eff', '#f5b942', '#38db91', '#f14e61']),
    }
  })
}

export function generateRoutes(rng: () => number): Route[] {
  return Array.from({ length: 5 }, (_, i) => {
    const a = CITIES[(i * 4) % CITIES.length]
    const b = CITIES[(i * 4 + 7) % CITIES.length]
    const mid = {
      lat: (a.lat + b.lat) / 2 + between(rng, -3, 3),
      lng: (a.lng + b.lng) / 2 + between(rng, -3, 3),
    }
    return {
      id: `RTE-${pad(i + 1, 3)}`,
      name: `${a.city.toUpperCase()} → ${b.city.toUpperCase()}`,
      from: a.city,
      to: b.city,
      waypoints: [
        { lat: a.lat, lng: a.lng },
        mid,
        { lat: b.lat, lng: b.lng },
      ],
      distanceKm: Math.round(between(rng, 900, 11_200)),
      eta: `${intBetween(rng, 2, 19)}h ${intBetween(rng, 0, 59)}m`,
    }
  })
}

// ---------------------------- Surveillance ----------------------------------
export function generateCameras(rng: () => number): Camera[] {
  const floors = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, -1, -1, 6, 6]
  return Array.from({ length: 14 }, (_, i) => {
    const zone = CAMERA_ZONES[i % CAMERA_ZONES.length]
    const city = CITIES[(i * 2) % CITIES.length]
    return {
      id: `CAM-${pad(i + 1, 2)}`,
      label: `CAM-${pad(i + 1, 2)} / ${zone}`,
      location: `${city.city} · ${pick(rng, ['Annex A', 'Tower 2', 'Depot 7', 'Block C', 'Yard 3'])}`,
      zone,
      floor: floors[i],
      status: pick(rng, ['online', 'online', 'online', 'online', 'degraded', 'offline', 'maintenance']) as Camera['status'],
      recording: rng() > 0.2,
      signal: Math.round(between(rng, 42, 99)),
      favorite: i < 3,
      x: 8 + (i % 4) * 22 + between(rng, -3, 3),
      y: 12 + Math.floor(i / 4) * 24 + between(rng, -3, 3),
      fps: pick(rng, [24, 25, 30, 30, 60]),
      resolution: pick(rng, ['1080p', '1440p', '2160p']),
    }
  })
}

export function generateSurveillanceIncidents(rng: () => number, cameras: Camera[]): SurveillanceIncident[] {
  const types: SurveillanceIncident['type'][] = ['motion', 'interrupted', 'restored', 'unusual', 'recording', 'zone']
  const details: Record<SurveillanceIncident['type'], string> = {
    motion: 'Motion simulation detected in monitored zone.',
    interrupted: 'Demonstration feed interrupted — simulated signal loss.',
    restored: 'Simulated camera feed restored to nominal state.',
    unusual: 'Unusual activity demonstration flagged by review queue.',
    recording: 'Demonstration recording cycle completed successfully.',
    zone: 'Fictional security zone boundary alert triggered.',
  }
  return Array.from({ length: 13 }, (_, i) => {
    const type = types[i % types.length]
    return {
      id: `SVI-${pad(i + 1, 3)}`,
      cameraId: cameras[i % cameras.length].id,
      type,
      severity: pick(rng, ['low', 'low', 'elevated', 'critical']) as SurveillanceIncident['severity'],
      detail: details[type],
      timestamp: iso(rng, 2),
      status: pick(rng, ['open', 'acknowledged', 'closed']) as SurveillanceIncident['status'],
    }
  }).sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
}

// ---------------------------- Intelligence ----------------------------------
export function generateOrgs(rng: () => number): Organization[] {
  return ORG_NAMES.slice(0, 9).map((name, i) => {
    const city = CITIES[(i * 6) % CITIES.length]
    return {
      id: `ORG-${pad(i + 1, 3)}`,
      name,
      hq: city.city,
      country: city.country,
      category: ORG_CATEGORIES[i % ORG_CATEGORIES.length],
      status: pick(rng, ['active', 'active', 'inactive', 'pending']) as Organization['status'],
      profileIds: [],
      caseIds: [],
      risk: pick(rng, ['low', 'guarded', 'elevated', 'high']) as Organization['risk'],
      founded: String(intBetween(rng, 1974, 2019)),
      revenue: `$${intBetween(rng, 12, 940)}M`,
    }
  })
}

export function generateIdentities(rng: () => number, orgs: Organization[], cases: InvestigationCase[]): Identity[] {
  return Array.from({ length: 16 }, (_, i) => {
    const first = pick(rng, FIRST_NAMES)
    const last = LAST_NAMES[(i * 3) % LAST_NAMES.length]
    const city = CITIES[(i * 7) % CITIES.length]
    const org = orgs[i % orgs.length]
    const caseIds = [cases[i % cases.length].id]
    if (i % 3 === 0) caseIds.push(cases[(i + 2) % cases.length].id)
    return {
      id: `PRF-${pad(i + 1, 4)}`,
      name: `${first} ${last}`,
      alias: [pick(rng, TARGET_CODENAMES), code(rng, 3)],
      dob: `${intBetween(rng, 1961, 2001)}-${pad(intBetween(rng, 1, 12))}-${pad(intBetween(rng, 1, 28))}`,
      nationality: city.country,
      occupation: pick(rng, ['Consultant', 'Logistics Manager', 'Financial Broker', 'Entrepreneur', 'Security Analyst', 'Shipping Agent', 'Data Engineer']),
      address: `${intBetween(rng, 1, 240)} ${pick(rng, ['Alder', 'Kestrel', 'Marlow', 'Vesper', 'Granite'])} ${pick(rng, ['Street', 'Avenue', 'Quay'])}, ${city.city}`,
      avatarSeed: `${first}-${last}`,
      risk: pick(rng, ['low', 'guarded', 'elevated', 'high', 'severe']) as Identity['risk'],
      status: pick(rng, ['active', 'monitored', 'cleared', 'flagged']) as Identity['status'],
      caseIds,
      orgId: org.id,
      tags: Array.from(new Set([pick(rng, TAG_POOL), pick(rng, TAG_POOL), pick(rng, TAG_POOL)])),
      associatedAccounts: [`ACC-${pad(1001 + (i % 18), 4)}`],
    }
  }).map((p) => {
    const org = orgs.find((o) => o.id === p.orgId)
    if (org) org.profileIds.push(p.id)
    return p
  })
}

export function generateCases(rng: () => number, operators: Operator[]): InvestigationCase[] {
  const titles = [
    'Meridian Shadow Ledger', 'Kerbside Signal Trace', 'Obsidian Cargo Chain',
    'Ghost Harbor Intrusion', 'Halcyon Shell Network', 'Red Ledger Anomaly',
    'Kestrel Flight Divergence', 'Solaris Grid Overlap', 'Tessera Broadcast Gap',
    'Ironbridge Testbed Access',
  ]
  return titles.map((title, i) => {
    const opened = iso(rng, 180)
    return {
      id: `CSE-${pad(i + 1, 3)}`,
      title,
      code: `CASE-${code(rng, 3)}-${2026}`,
      status: pick(rng, ['open', 'active', 'active', 'cold', 'closed']) as InvestigationCase['status'],
      priority: pick(rng, ['low', 'elevated', 'elevated', 'critical']) as InvestigationCase['priority'],
      lead: operators[i % operators.length].displayName,
      opened,
      updated: iso(rng, 4),
      summary:
        'Fictional case file assembled from synthetic records inside the SHADOW SYSTEMS demonstration environment. All entities, accounts and events are generated for cinematic use.',
      evidenceIds: [],
      profileIds: [],
      orgIds: [],
      progress: intBetween(rng, 12, 96),
    }
  })
}

export function generateEvidence(rng: () => number, cases: InvestigationCase[]): EvidenceRecord[] {
  const descs = [
    'Synthetic transfer ledger extract', 'Fictional device image manifest',
    'Generated comms burst transcript', 'Demo reconnaissance photograph',
    'Synthetic contract draft', 'Placeholder network capture',
    'Fictional interview summary', 'Generated logistics invoice set',
    'Demo satellite tile reference', 'Synthetic access log excerpt',
    'Fictional keyring export', 'Sample ticket stub scan',
  ]
  return Array.from({ length: 22 }, (_, i) => {
    const c = cases[i % cases.length]
    const rec: EvidenceRecord = {
      id: `EVD-${pad(i + 1, 4)}`,
      caseId: c.id,
      description: descs[i % descs.length],
      category: pick(rng, ['DOCUMENT', 'DEVICE', 'COMMS', 'FINANCIAL', 'PHOTO', 'DATA']) as EvidenceRecord['category'],
      collected: iso(rng, 60),
      status: pick(rng, ['sealed', 'analyzed', 'pending', 'released']) as EvidenceRecord['status'],
      notes: 'Collected inside closed simulation sandbox. Non-operational.',
      hash: code(rng, 32, HEX),
    }
    c.evidenceIds.push(rec.id)
    return rec
  })
}

export function generateGraph(
  rng: () => number,
  identities: Identity[],
  orgs: Organization[],
  cases: InvestigationCase[],
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = []
  const links: GraphLink[] = []
  identities.slice(0, 8).forEach((p, i) => {
    const angle = (i / 8) * Math.PI * 2
    nodes.push({ id: p.id, label: p.name, type: 'person', risk: p.risk, x: 420 + Math.cos(angle) * 250, y: 300 + Math.sin(angle) * 200 })
  })
  orgs.slice(0, 5).forEach((o, i) => {
    const angle = (i / 5) * Math.PI * 2 + 0.7
    nodes.push({ id: o.id, label: o.name, type: 'org', risk: o.risk, x: 420 + Math.cos(angle) * 380, y: 300 + Math.sin(angle) * 300 })
  })
  cases.slice(0, 4).forEach((c, i) => {
    nodes.push({ id: c.id, label: c.title, type: 'case', x: 140 + i * 190, y: 560 })
  })
  identities.slice(0, 4).forEach((p, i) => {
    nodes.push({ id: p.associatedAccounts[0], label: p.associatedAccounts[0], type: 'account', x: 80 + i * 240, y: 60 })
  })
  for (let i = 0; i < 4; i++) {
    nodes.push({ id: `PHN-${pad(i + 5, 3)}`, label: `+41 555 ${code(rng, 4)}`, type: 'phone', x: 720 + i * 60, y: 80 + i * 40 })
  }
  identities.slice(0, 8).forEach((p, i) => {
    links.push({ source: p.id, target: p.orgId!, label: 'EMPLOYED_BY', strength: 2 })
    if (i % 2 === 0) links.push({ source: p.id, target: p.caseIds[0], label: 'SUBJECT_OF', strength: 3 })
    if (i % 3 === 0 && cases[i + 1]) links.push({ source: p.id, target: cases[(i + 1) % cases.length].id, label: 'MENTIONED_IN', strength: 1 })
    links.push({ source: p.id, target: p.associatedAccounts[0], label: 'OWNS_ACCOUNT', strength: 2 })
  })
  identities.slice(2, 6).forEach((p, i) => {
    links.push({ source: p.id, target: `PHN-${pad(i + 5, 3)}`, label: 'USES_NUMBER', strength: 1 })
  })
  cases.slice(0, 4).forEach((c, i) => {
    links.push({ source: c.id, target: orgs[i].id, label: 'INVESTIGATES', strength: 3 })
  })
  links.push({ source: orgs[0].id, target: orgs[1].id, label: 'TRANSFERRED_FUNDS', strength: 2 })
  links.push({ source: orgs[2].id, target: orgs[3].id, label: 'SHARED_DIRECTOR', strength: 1 })
  links.push({ source: orgs[1].id, target: orgs[4].id, label: 'SUBSIDIARY_OF', strength: 2 })
  return { nodes, links }
}

// ---------------------------- Network ---------------------------------------
export function generateNetwork(rng: () => number): { nodes: NetworkNode[]; links: NetworkLink[] } {
  const defs: Array<[string, NetworkNode['type'], string, number, number]> = [
    ['CORE-RTR-01', 'ROUTER', 'CORE', 50, 50],
    ['EDGE-GW-01', 'GATEWAY', 'EDGE', 50, 14],
    ['FW-PRIMARY', 'FIREWALL', 'EDGE', 50, 84],
    ['SW CORE A', 'SWITCH', 'CORE', 22, 30],
    ['SW CORE B', 'SWITCH', 'CORE', 78, 30],
    ['SIM-NODE-07', 'NODE', 'SIMULATION', 14, 72],
    ['SIM-NODE-12', 'NODE', 'SIMULATION', 86, 72],
    ['APP-SRV-01', 'SERVER', 'APP', 10, 50],
    ['APP-SRV-02', 'SERVER', 'APP', 90, 50],
    ['DB-SRV-01', 'SERVER', 'DATA', 30, 88],
    ['DB-SRV-02', 'SERVER', 'DATA', 70, 88],
    ['SAN-STOR-01', 'STORAGE', 'DATA', 50, 96],
    ['VPN-GW-01', 'GATEWAY', 'EDGE', 12, 14],
    ['MON-SRV-01', 'SERVER', 'MGMT', 88, 14],
  ]
  const nodes: NetworkNode[] = defs.map((d, i) => ({
    id: `NOD-${pad(i + 1, 3)}`,
    hostname: d[0].replace(/\s/g, '-'),
    label: d[0],
    type: d[1],
    zone: d[2],
    status: pick(rng, ['online', 'online', 'online', 'online', 'online', 'degraded', 'offline']) as NetworkNode['status'],
    ip: `10.${intBetween(rng, 0, 40)}.${intBetween(rng, 0, 250)}.${intBetween(rng, 2, 250)}`,
    latency: Math.round(between(rng, 1, 84)),
    load: Math.round(between(rng, 8, 94)),
    os: d[1] === 'SERVER' || d[1] === 'STORAGE' ? pick(rng, ['SHADOW-LINUX 6.2', 'OBSIDIAN-OS 3.1', 'LINUX-RT 5.15']) : undefined,
    cpu: Math.round(between(rng, 6, 92)),
    memory: Math.round(between(rng, 18, 94)),
    disk: Math.round(between(rng, 12, 88)),
    uptime: `${intBetween(rng, 2, 240)}d ${intBetween(rng, 0, 23)}h`,
    x: d[3],
    y: d[4],
  }))
  const linkDefs: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [0, 4], [3, 7], [3, 8], [4, 7], [4, 8],
    [1, 12], [2, 13], [3, 5], [4, 6], [5, 6], [7, 9], [8, 10], [9, 11], [10, 11],
  ]
  const links: NetworkLink[] = linkDefs.map((l, i) => ({
    id: `LNK-${pad(i + 1, 3)}`,
    source: nodes[l[0]].id,
    target: nodes[l[1]].id,
    bandwidth: pick(rng, [1, 10, 40, 100]),
    status: pick(rng, ['up', 'up', 'up', 'up', 'congested', 'down']) as NetworkLink['status'],
    traffic: Math.round(between(rng, 2, 96)),
  }))
  return { nodes, links }
}

export function generateTraffic(rng: () => number, points = 48): TrafficSample[] {
  return Array.from({ length: points }, (_, i) => {
    const d = new Date(Date.now() - (points - i) * 5 * 60_000)
    return {
      t: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      inbound: Math.round(between(rng, 180, 920)),
      outbound: Math.round(between(rng, 120, 760)),
      packets: Math.round(between(rng, 40_000, 260_000)),
      latency: Math.round(between(rng, 4, 62)),
    }
  })
}

// ---------------------------- Forensics -------------------------------------
export function generateForensicsCases(rng: () => number, operators: Operator[]): ForensicsCase[] {
  const titles = [
    'Ledger Fabric Analysis', 'Volatile Memory Capture', 'Comms Packet Reconstruction',
    'Device Image Triage', 'Timeline Reconstruction', 'Artifact Correlation Study',
  ]
  return titles.map((title, i) => ({
    id: `FRC-${pad(i + 1, 3)}`,
    title,
    status: pick(rng, ['active', 'analyzing', 'complete', 'archived']) as ForensicsCase['status'],
    evidenceCount: intBetween(rng, 2, 14),
    analyst: operators[(i + 6) % operators.length].displayName,
    opened: iso(rng, 40),
    progress: intBetween(rng, 18, 100),
  }))
}

export function generateFiles(rng: () => number): FileAnalysis[] {
  return FILE_NAMES.slice(0, 10).map((name, i) => ({
    id: `FIL-${pad(i + 1, 3)}`,
    name,
    size: intBetween(rng, 12_800, 48_000_000),
    mime: MIME_TYPES[i % MIME_TYPES.length],
    created: iso(rng, 90),
    modified: iso(rng, 20),
    sha256: code(rng, 64, HEX),
    status: pick(rng, ['analyzed', 'analyzed', 'pending']) as FileAnalysis['status'],
  }))
}

export function generateForensicTimeline(rng: () => number, cases: ForensicsCase[]): TimelineEvent[] {
  const cats = ['FILE ACCESS', 'LOGIN', 'TRANSFER', 'DEVICE CONNECT', 'COMMS', 'EXPORT', 'DELETION', 'POLICY EVENT']
  return Array.from({ length: 20 }, (_, i) => ({
    id: `TLE-${pad(i + 1, 3)}`,
    ts: new Date(Date.now() - i * 2_740_000 - intBetween(rng, 0, 900_000)).toISOString(),
    category: cats[i % cats.length],
    evidenceId: `EVD-${pad((i % 22) + 1, 4)}`,
    caseId: cases[i % cases.length].id,
    description: pick(rng, [
      'Synthetic artifact extracted from demo image.',
      'Placeholder log entry correlated to case timeline.',
      'Fictional file access recorded in sandbox.',
      'Generated network beacon matched to profile.',
      'Demo export archive created and hashed.',
    ]),
    severity: pick(rng, ['low', 'low', 'elevated', 'critical']) as TimelineEvent['severity'],
  })).sort((a, b) => +new Date(b.ts) - +new Date(a.ts))
}

// ---------------------------- Underground -----------------------------------
export function generateVendors(rng: () => number): Vendor[] {
  const handles = ['nullcipher', 'ghostwire_', 'obsidian.vx', 'blackpearl', 'ra7signal', 'zero.cool', 'ferrum', 'nightpath', 'ashfall', 'quanta.']
  return handles.map((handle, i) => ({
    id: `VND-${pad(i + 1, 3)}`,
    handle,
    rating: Math.round(between(rng, 3.1, 5) * 10) / 10,
    reviews: intBetween(rng, 12, 980),
    deals: intBetween(rng, 4, 420),
    status: pick(rng, ['verified', 'verified', 'probation', 'flagged', 'offline']) as Vendor['status'],
    joined: iso(rng, 900),
    specialties: [pick(rng, ['PROPS', 'SCRIPTS', 'INTEL', 'DEVICES', 'ACCESS'])],
    avatarSeed: handle,
  }))
}

export function generateListings(rng: () => number, vendors: Vendor[]): Listing[] {
  return LISTING_POOL.map((l, i) => {
    const v = vendors[i % vendors.length]
    return {
      id: `LST-${pad(i + 1, 3)}`,
      title: l.title,
      vendorId: v.id,
      category: l.category as Listing['category'],
      price: Math.round(between(rng, 120, 9400)),
      currency: pick(rng, ['USD', 'EUR', 'XMR-P']),
      stock: intBetween(rng, 0, 32),
      escrow: rng() > 0.25,
      rating: Math.round(between(rng, 3.2, 5) * 10) / 10,
      description: l.desc,
      status: pick(rng, ['live', 'live', 'live', 'paused', 'sold-out']) as Listing['status'],
    }
  })
}

export function generateOrders(rng: () => number, listings: Listing[], vendors: Vendor[], operators: Operator[]): MarketOrder[] {
  return Array.from({ length: 12 }, (_, i) => {
    const l = listings[i % listings.length]
    return {
      id: `ORD-${pad(7001 + i, 4)}`,
      listingId: l.id,
      vendorId: vendors[i % vendors.length].id,
      buyer: operators[i % operators.length].callsign,
      amount: l.price,
      escrow: pick(rng, ['held', 'released', 'disputed', 'cancelled']) as MarketOrder['escrow'],
      status: pick(rng, ['open', 'shipped', 'complete', 'cancelled']) as MarketOrder['status'],
      created: iso(rng, 8),
    }
  })
}

// ---------------------------- Crisis ----------------------------------------
export function generateCrisisIncidents(rng: () => number): CrisisIncident[] {
  const titles = [
    'Simulated grid desync — NORTH RING',
    'Synthetic telecom blackout — SECTOR 4',
    'Demo financial clearing stall',
    'Fictional water telemetry drift',
    'Placeholder port authority outage',
  ]
  return titles.map((title, i) => ({
    id: `CRI-${pad(i + 1, 3)}`,
    title,
    severity: pick(rng, ['low', 'elevated', 'elevated', 'critical']) as CrisisIncident['severity'],
    status: pick(rng, ['monitoring', 'escalated', 'contained', 'resolved']) as CrisisIncident['status'],
    affected: [pick(rng, ['GRID-A', 'TEL-4', 'FIN-CLEARING', 'WATER-N', 'PORT-7'])],
    reported: iso(rng, 1),
    updated: iso(rng, 0.2),
    description: 'Fictional scenario incident generated for cinematic demonstration. No real infrastructure is involved.',
    timeline: ['Detection', 'Triage', 'Containment', 'Recovery', 'Review'].map((label, k) => ({
      ts: new Date(Date.now() - (5 - k) * 900_000).toISOString(),
      label,
      done: k < intBetween(rng, 1, 5),
    })),
    countdown: i === 3 ? 842 : undefined,
  }))
}

export function generateInfrastructure(rng: () => number): InfrastructureNode[] {
  const defs: Array<[string, InfrastructureNode['type'], string]> = [
    ['NORTH RING GRID', 'GRID', 'SECTOR 1'],
    ['HARBOR GRID', 'GRID', 'SECTOR 4'],
    ['CLEARWATER PUMP 2', 'WATER', 'SECTOR 2'],
    ['CIVIC WATER MAIN', 'WATER', 'SECTOR 3'],
    ['RELAY TOWER 14', 'TELECOM', 'SECTOR 1'],
    ['FIBER BACKBONE E', 'TELECOM', 'SECTOR 5'],
    ['CENTRAL CLEARING', 'FINANCE', 'SECTOR 2'],
    ['RESERVE VAULT LINK', 'FINANCE', 'SECTOR 4'],
    ['ST. AUGUSTINE LINK', 'HEALTH', 'SECTOR 3'],
    ['METRO LINE B', 'TRANSIT', 'SECTOR 5'],
  ]
  return defs.map((d, i) => {
    const health = intBetween(rng, 24, 99)
    return {
      id: `INF-${pad(i + 1, 3)}`,
      name: d[0],
      type: d[1],
      health,
      status: health > 82 ? 'nominal' : health > 55 ? 'degraded' : health > 24 ? 'critical' : 'offline',
      region: d[2],
      load: intBetween(rng, 12, 96),
    }
  })
}

// ---------------------------- Comms -----------------------------------------
export function generateChannels(): Channel[] {
  const defs: Channel[] = [
    { id: 'CHN-001', name: 'command-alpha', kind: 'channel', members: ['OPR-001', 'OPR-002', 'OPR-003', 'OPR-005'], unread: 0, topic: 'Command cell coordination' },
    { id: 'CHN-002', name: 'cyber-cell', kind: 'channel', members: ['OPR-009', 'OPR-002', 'OPR-006'], unread: 3, topic: 'Cyber operations sandbox' },
    { id: 'CHN-003', name: 'geoint-watch', kind: 'channel', members: ['OPR-004', 'OPR-010', 'OPR-012'], unread: 0, topic: 'Geospatial monitoring' },
    { id: 'CHN-004', name: 'finance-ops', kind: 'channel', members: ['OPR-003', 'OPR-001'], unread: 1, topic: 'Financial simulation ledger' },
    { id: 'CHN-005', name: 'dispatch', kind: 'dispatch', members: ['OPR-012', 'OPR-008'], unread: 2, topic: 'Mission dispatch board' },
    { id: 'CHN-006', name: 'broadcast', kind: 'broadcast', members: ['*'], unread: 0, topic: 'Organisation-wide announcements' },
  ]
  const directs = ['OPR-002', 'OPR-004', 'OPR-009'].map((m, i) => ({
    id: `DMC-${pad(i + 1, 3)}`,
    name: `@${['cipher', 'helios', 'wraith'][i]}`,
    kind: 'direct' as const,
    members: ['OPR-001', m],
    unread: i === 1 ? 1 : 0,
    topic: 'Direct encrypted channel',
  }))
  return [...defs, ...directs]
}

export function generateMessages(rng: () => number, channels: Channel[], operators: Operator[]): ChatMessage[] {
  const bodies = [
    'Sandbox node 07 is holding steady — latency nominal.',
    'Copy that. Rerouting demo traffic through relay 12.',
    'Mission timeline updated, next checkpoint in 4 minutes.',
    'Synthetic ledger reconciled. Zero anomalies in the demo batch.',
    'Camera cluster B is back online. Signal at 94%.',
    'Watch the fictional target movement — they just shifted sector.',
    'Encrypted relay handshake completed successfully.',
    'Pulling the demo evidence set into forensics now.',
    'All modules reporting green on the status wall.',
    'Reminder: everything on this channel is simulated.',
  ]
  const out: ChatMessage[] = []
  let k = 0
  channels.forEach((ch) => {
    const count = ch.kind === 'direct' ? 4 : 6
    for (let i = 0; i < count; i++) {
      const op = operators[(k * 3) % operators.length]
      out.push({
        id: `MSG-${pad(++k, 4)}`,
        channelId: ch.id,
        operatorId: op.id,
        body: bodies[(k + i) % bodies.length],
        ts: new Date(Date.now() - (count - i) * 460_000 - intBetween(rng, 0, 120_000)).toISOString(),
        encrypted: rng() > 0.2,
        delivery: 'read',
      })
    }
  })
  return out
}

export function generateCalls(rng: () => number, operators: Operator[]): CallRecord[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: `CAL-${pad(i + 1, 3)}`,
    operatorId: operators[i % operators.length].id,
    direction: pick(rng, ['incoming', 'outgoing']) as CallRecord['direction'],
    status: (i === 0 ? 'ringing' : pick(rng, ['ended', 'ended', 'missed'])) as CallRecord['status'],
    started: iso(rng, 1),
    duration: intBetween(rng, 12, 1800),
    channel: pick(rng, ['SECURE VOICE', 'RELAY 3', 'SATELLITE LINK']),
  }))
}

// ---------------------------- Missions --------------------------------------
function buildEvents(templateId: string, rng: () => number): MissionEvent[] {
  const bases: Record<string, Array<[number, string, string, string]>> = {
    'tpl-blackout': [
      [0, 'command', 'scene-init', 'Command center initialized'],
      [45, 'geoint', 'map-focus', 'Global map focused on affected region'],
      [95, 'network', 'anomaly', 'Simulated network anomaly injected'],
      [150, 'surveillance', 'alert', 'Surveillance alert raised on CAM-04'],
      [210, 'finance', 'txn', 'Financial transaction simulation started'],
      [275, 'crisis', 'escalate', 'Incident severity escalated to CRITICAL'],
      [340, 'ai', 'report', 'AI incident summary generated'],
      [400, 'comms', 'broadcast', 'Emergency broadcast dispatched'],
    ],
    'tpl-ghost': [
      [0, 'command', 'scene-init', 'Command center initialized'],
      [40, 'intelligence', 'open-case', 'Case file GHOST PROTOCOL opened'],
      [100, 'intelligence', 'graph-expand', 'Relationship graph expanded'],
      [170, 'forensics', 'evidence', 'Evidence package ingested'],
      [230, 'cyber', 'terminal', 'Terminal simulation engaged'],
      [300, 'geoint', 'target-move', 'Target movement tracked'],
      [370, 'ai', 'report', 'Intelligence briefing compiled'],
    ],
    'tpl-silent': [
      [0, 'command', 'scene-init', 'Command center initialized'],
      [40, 'finance', 'transfer-start', 'Transfer simulation initialized'],
      [110, 'finance', 'validate', 'Fictional account validated'],
      [180, 'finance', 'settle', 'Simulated payment processed'],
      [250, 'cyber', 'watch', 'Anomaly watch engaged'],
      [320, 'ai', 'report', 'Financial activity summary generated'],
    ],
    'tpl-redsignal': [
      [0, 'command', 'scene-init', 'Command center initialized'],
      [35, 'comms', 'blackout', 'Simulated comms blackout declared'],
      [90, 'crisis', 'emergency', 'Emergency mode activated'],
      [150, 'network', 'outage', 'Server outage scenario injected'],
      [215, 'surveillance', 'offline', 'Camera cluster signal lost'],
      [280, 'ai', 'report', 'Crisis report generated'],
      [345, 'comms', 'restore', 'Communications restored'],
    ],
    'tpl-darkhorizon': [
      [0, 'command', 'scene-init', 'Command center initialized'],
      [50, 'geoint', 'map-focus', 'Three-continent map sweep'],
      [120, 'geoint', 'target-move', 'Target movement begins'],
      [190, 'surveillance', 'alert', 'Surveillance uptick on target'],
      [260, 'intelligence', 'profile', 'Profile enrichment applied'],
      [330, 'ai', 'report', 'Daily intelligence briefing generated'],
    ],
    'tpl-zerotrace': [
      [0, 'command', 'scene-init', 'Command center initialized'],
      [40, 'forensics', 'acquire', 'Evidence acquired and hashed'],
      [110, 'forensics', 'timeline', 'Forensic timeline reconstructed'],
      [180, 'intelligence', 'link', 'Case relationships linked'],
      [250, 'crypto', 'verify', 'Hash verification completed'],
      [320, 'ai', 'report', 'Case summary generated'],
    ],
  }
  return (bases[templateId] ?? bases['tpl-blackout']).map((b, i) => ({
    id: `EVT-${pad(i + 1, 2)}-${Math.floor(rng() * 999)}`,
    at: b[0],
    module: b[1] as MissionEvent['module'],
    action: b[2],
    label: b[3],
    duration: 8,
    severity: pick(rng, ['low', 'elevated', 'critical']) as MissionEvent['severity'],
  }))
}

export function generateTemplates(rng: () => number): ScenarioTemplate[] {
  return OPERATION_TEMPLATES.map((t) => ({
    id: t.id,
    code: t.code,
    name: t.name,
    description: t.description,
    category: t.category,
    severity: t.severity as ScenarioTemplate['severity'],
    durationMinutes: t.durationMinutes,
    modules: Array.from(new Set(buildEvents(t.id, rng).map((e) => e.module))),
    events: buildEvents(t.id, rng),
    accent: t.accent,
  }))
}

export function generateMissions(rng: () => number, templates: ScenarioTemplate[], operators: Operator[]): Mission[] {
  const active = [0, 4].map((i) => {
    const t = templates[i]
    return {
      id: `MSN-${pad(i + 1, 3)}`,
      code: t.code,
      name: t.name,
      description: t.description,
      category: t.category,
      severity: t.severity,
      status: (i === 0 ? 'active' : 'paused') as Mission['status'],
      progress: i === 0 ? 62 : 34,
      currentStage: t.events[Math.min(t.events.length - 1, i === 0 ? 4 : 2)].label,
      startedAt: new Date(Date.now() - (i === 0 ? 26 : 71) * 60_000).toISOString(),
      etaMinutes: t.durationMinutes,
      modules: t.modules,
      events: t.events,
      templateId: t.id,
      operatorId: operators[i].id,
    }
  })
  const done = templates.slice(1, 5).map((t, i) => ({
    id: `MSN-${pad(10 + i, 3)}`,
    code: t.code,
    name: t.name,
    description: t.description,
    category: t.category,
    severity: t.severity,
    status: 'completed' as Mission['status'],
    progress: 100,
    currentStage: 'Archived',
    startedAt: iso(rng, 9),
    etaMinutes: t.durationMinutes,
    modules: t.modules,
    events: t.events,
    templateId: t.id,
    operatorId: operators[(i + 3) % operators.length].id,
  }))
  return [...active, ...done]
}

// ---------------------------- Notifications / Activity -----------------------
export function generateNotifications(): Notification[] {
  const defs: Array<[Notification['type'], string, string, Severity, Notification['module']]> = [
    ['success', 'Transaction simulation completed', 'Demo transfer TX-90014 settled in the internal ledger.', 'low', 'finance'],
    ['incident', 'Camera feed interrupted', 'CAM-06 reported a simulated signal loss.', 'elevated', 'surveillance'],
    ['mission-start', 'Operation BLACKOUT activated', 'Multi-module scenario now running.', 'elevated', 'missions'],
    ['node', 'Node NOD-011 disconnected', 'Simulated network node dropped from topology.', 'elevated', 'network'],
    ['ai', 'AI report generated', 'Incident report #RPT-4417 is ready for review.', 'low', 'ai'],
    ['emergency', 'Crisis escalation', 'SECTOR 4 declared ELEVATED in simulation.', 'critical', 'crisis'],
    ['pending', 'Transfer awaiting approval', 'Demo transfer TX-90031 is pending review.', 'low', 'finance'],
    ['failure', 'Simulation access denied', 'Demo authorization sequence returned DENIED.', 'elevated', 'cyber'],
    ['success', 'Mission completed', 'Operation ZERO TRACE finished with all modules reporting.', 'low', 'missions'],
    ['finance', 'Receipt generated', 'Simulated receipt available for TX-90022.', 'low', 'finance'],
    ['camera', 'Camera restored', 'CAM-02 back online at 96% signal.', 'low', 'surveillance'],
    ['incident', 'New fictional incident', 'CRI-004 logged by the crisis engine.', 'critical', 'crisis'],
    ['success', 'Report exported', 'Financial activity summary exported as CSV.', 'low', 'reports'],
    ['node', 'Topology resynchronised', 'All simulated nodes re-registered.', 'low', 'network'],
    ['pending', 'Review queued', 'Two demo evidence items awaiting examination.', 'low', 'forensics'],
  ]
  return defs.map((d, i) => ({
    id: `NTF-${pad(i + 1, 3)}`,
    type: d[0],
    title: d[1],
    body: d[2],
    ts: new Date(Date.now() - (i + 1) * 620_000).toISOString(),
    read: i > 6,
    severity: d[3],
    module: d[4],
  }))
}

export function generateActivity(operators: Operator[]): ActivityEntry[] {
  const defs: Array<[ActivityEntry['module'], string, ActivityEntry['level']]> = [
    ['finance', 'Simulated transfer completed to Meridian Fortis Bank', 'success'],
    ['cyber', 'Terminal session opened on demo node', 'info'],
    ['geoint', 'Fictional target NIGHTJAR moved to new sector', 'info'],
    ['surveillance', 'Camera CAM-04 feed restored', 'success'],
    ['network', 'Node NOD-011 disconnected from topology', 'warning'],
    ['intelligence', 'Case CSE-003 updated with new evidence', 'info'],
    ['forensics', 'Evidence EVD-0007 hashed with SHA-256', 'success'],
    ['missions', 'Operation GHOST PROTOCOL advanced to stage 3', 'info'],
    ['crisis', 'Synthetic incident CRI-002 escalated', 'critical'],
    ['system', 'Simulation speed changed to 2x', 'info'],
    ['crypto', 'Local AES-GCM demonstration executed', 'success'],
    ['comms', 'Encrypted message delivered to cyber-cell', 'info'],
    ['underground', 'Demo listing status changed to PAUSED', 'warning'],
    ['ai', 'SHADOW AI compiled a briefing', 'success'],
  ]
  return defs.map((d, i) => ({
    id: `ACT-${pad(i + 1, 4)}`,
    ts: new Date(Date.now() - i * 1_140_000).toISOString(),
    module: d[0],
    actor: operators[i % operators.length].callsign,
    action: d[1],
    detail: 'Generated by the SHADOW SYSTEMS simulation engine.',
    level: d[2],
  }))
}

export function generateServices(): AppService[] {
  const defs: Array<[string, AppService['status'], number]> = [
    ['Application Engine', 'operational', 99.98],
    ['Network Simulator', 'operational', 99.91],
    ['Financial Simulator', 'operational', 99.87],
    ['Intelligence Module', 'operational', 99.72],
    ['Map Renderer', 'operational', 99.95],
    ['Event Engine', 'operational', 99.99],
    ['AI Assistant', 'operational', 98.84],
    ['Data Storage', 'operational', 99.96],
    ['Notification Relay', 'degraded', 97.2],
  ]
  return defs.map((d, i) => ({
    id: `SVC-${pad(i + 1, 2)}`,
    name: d[0],
    status: d[1],
    health: d[2],
    latency: Math.round(between(Math.random, 4, 38)),
    detail: 'Internal simulation service. No external dependencies.',
  }))
}

// ---------------------------------------------------------------------------
export const DATA_COUNTS = {
  banks: 6,
  accounts: 18,
  transactions: 46,
  identities: 16,
  organizations: 9,
  networkNodes: 14,
  cameras: 14,
  cases: 10,
  templates: 6,
  operators: 12,
  notifications: 15,
} as const
