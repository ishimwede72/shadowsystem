// Reserved-fictional seed vocabulary for SHADOW SYSTEMS demo data.
// Institution names are invented and do not reference real providers.

export const FIRST_NAMES = [
  'Adrian', 'Katarina', 'Dmitri', 'Amara', 'Lucien', 'Noor', 'Elias', 'Zara',
  'Mateo', 'Ingrid', 'Rafael', 'Yuki', 'Oleksandr', 'Priya', 'Tobias', 'Nadia',
  'Cyrus', 'Halima', 'Viktor', 'Sana', 'Julien', 'Mirela', 'Kenji', 'Farah',
  'Anton', 'Leila', 'Soren', 'Anya', 'Marcus', 'Iris', 'Rami', 'Selene',
  'Bastian', 'Tara', 'Emil', 'Noora', 'Idris', 'Camille', 'Otto', 'Linnea',
] as const

export const LAST_NAMES = [
  'Vasquez', 'Lindqvist', 'Moreau', 'Okonkwo', 'Petrov', 'Delacroix', 'Haddad',
  'Rasmussen', 'Kovalenko', 'Sato', 'Ferreira', 'Novak', 'Andersson', 'Rahman',
  'Beaumont', 'Castellan', 'Ivanov', 'Duarte', 'Kessler', 'Varga', 'Ozawa',
  'Marchetti', 'Thorne', 'Karam', 'Lindgren', 'Reyes', 'Devereux', 'Solberg',
  'Achebe', 'Weiss', 'Takahashi', 'Bauer', 'Costa', 'Halloran', 'Mbeki',
] as const

export const CITIES = [
  { city: 'Zurich', country: 'Switzerland', cc: 'CH', lat: 47.3769, lng: 8.5417, tz: 'Europe/Zurich' },
  { city: 'Singapore', country: 'Singapore', cc: 'SG', lat: 1.3521, lng: 103.8198, tz: 'Asia/Singapore' },
  { city: 'Dubai', country: 'UAE', cc: 'AE', lat: 25.2048, lng: 55.2708, tz: 'Asia/Dubai' },
  { city: 'London', country: 'United Kingdom', cc: 'GB', lat: 51.5072, lng: -0.1276, tz: 'Europe/London' },
  { city: 'Reykjavik', country: 'Iceland', cc: 'IS', lat: 64.1466, lng: -21.9426, tz: 'Atlantic/Reykjavik' },
  { city: 'Tallinn', country: 'Estonia', cc: 'EE', lat: 59.437, lng: 24.7536, tz: 'Europe/Tallinn' },
  { city: 'Panama City', country: 'Panama', cc: 'PA', lat: 8.9824, lng: -79.5199, tz: 'America/Panama' },
  { city: 'Kigali', country: 'Rwanda', cc: 'RW', lat: -1.9441, lng: 30.0619, tz: 'Africa/Kigali' },
  { city: 'Cape Town', country: 'South Africa', cc: 'ZA', lat: -33.9249, lng: 18.4241, tz: 'Africa/Johannesburg' },
  { city: 'Sao Paulo', country: 'Brazil', cc: 'BR', lat: -23.5505, lng: -46.6333, tz: 'America/Sao_Paulo' },
  { city: 'Toronto', country: 'Canada', cc: 'CA', lat: 43.6532, lng: -79.3832, tz: 'America/Toronto' },
  { city: 'Seoul', country: 'South Korea', cc: 'KR', lat: 37.5665, lng: 126.978, tz: 'Asia/Seoul' },
  { city: 'Tokyo', country: 'Japan', cc: 'JP', lat: 35.6762, lng: 139.6503, tz: 'Asia/Tokyo' },
  { city: 'Oslo', country: 'Norway', cc: 'NO', lat: 59.9139, lng: 10.7522, tz: 'Europe/Oslo' },
  { city: 'Valletta', country: 'Malta', cc: 'MT', lat: 35.8989, lng: 14.5146, tz: 'Europe/Malta' },
  { city: 'Nairobi', country: 'Kenya', cc: 'KE', lat: -1.2921, lng: 36.8219, tz: 'Africa/Nairobi' },
  { city: 'Bogota', country: 'Colombia', cc: 'CO', lat: 4.711, lng: -74.0721, tz: 'America/Bogota' },
  { city: 'Riga', country: 'Latvia', cc: 'LV', lat: 56.9496, lng: 24.1052, tz: 'Europe/Riga' },
  { city: 'Muscat', country: 'Oman', cc: 'OM', lat: 23.588, lng: 58.3829, tz: 'Asia/Muscat' },
  { city: 'Vancouver', country: 'Canada', cc: 'CA', lat: 49.2827, lng: -123.1207, tz: 'America/Vancouver' },
  { city: 'Tbilisi', country: 'Georgia', cc: 'GE', lat: 41.7151, lng: 44.8271, tz: 'Asia/Tbilisi' },
  { city: 'Marseille', country: 'France', cc: 'FR', lat: 43.2965, lng: 5.3698, tz: 'Europe/Paris' },
  { city: 'Busan', country: 'South Korea', cc: 'KR', lat: 35.1796, lng: 129.0756, tz: 'Asia/Seoul' },
  { city: 'Montevideo', country: 'Uruguay', cc: 'UY', lat: -34.9011, lng: -56.1645, tz: 'America/Montevideo' },
] as const

export const FICTIONAL_BANKS = [
  { name: 'Meridian Fortis Bank', code: 'MFB', country: 'Switzerland', cc: 'CH', currency: 'CHF', mark: 'MF' },
  { name: 'Northgate Pacific Trust', code: 'NPT', country: 'Singapore', cc: 'SG', currency: 'SGD', mark: 'NP' },
  { name: 'Helios Gulf Capital', code: 'HGC', country: 'UAE', cc: 'AE', currency: 'AED', mark: 'HG' },
  { name: 'Blackwater Clearing House', code: 'BCH', country: 'United Kingdom', cc: 'GB', currency: 'GBP', mark: 'BW' },
  { name: 'Aurora Baltic Securities', code: 'ABS', country: 'Estonia', cc: 'EE', currency: 'EUR', mark: 'AB' },
  { name: 'Cobalt Reserve International', code: 'CRI', country: 'Panama', cc: 'PA', currency: 'USD', mark: 'CR' },
] as const

export const ORG_NAMES = [
  'Halcyon Logistics Group', 'Verdant Capital Partners', 'Nordwind Maritime',
  'Obsidian Analytics', 'Kestrel Aviation Holdings', 'Solaris Energy Consortium',
  'Tessera Media Network', 'Ironbridge Defense Systems', 'Quanta Biotech Labs',
  'Sable Commodities Exchange',
] as const

export const ORG_CATEGORIES = [
  'LOGISTICS', 'FINANCE', 'MARITIME', 'DATA-ANALYTICS', 'AVIATION',
  'ENERGY', 'MEDIA', 'DEFENSE-PROP', 'BIOTECH', 'COMMODITIES',
] as const

export const OPERATOR_NAMES = [
  { callsign: 'VANTA', name: 'Iris Vanta', role: 'Lead Operations Officer', unit: 'COMMAND / ALPHA', clearance: 'OMEGA' },
  { callsign: 'CIPHER', name: 'Theo Cipher', role: 'Cryptography Analyst', unit: 'CRYPTOGRAPHIC DIVISION', clearance: 'C4' },
  { callsign: 'MERIDIAN', name: 'Sana Meridian', role: 'Financial Operations', unit: 'FINANCIAL SYSTEMS', clearance: 'C4' },
  { callsign: 'HELIOS', name: 'Rafael Helios', role: 'Geospatial Intelligence', unit: 'GEOINT CELL', clearance: 'C3' },
  { callsign: 'NOVA', name: 'Zara Nova', role: 'Surveillance Coordinator', unit: 'OBSERVATION WING', clearance: 'C3' },
  { callsign: 'OBELISK', name: 'Marcus Obelisk', role: 'Network Operations', unit: 'NOC / BRAVO', clearance: 'C4' },
  { callsign: 'SABLE', name: 'Farah Sable', role: 'Forensics Examiner', unit: 'DIGITAL FORENSICS', clearance: 'C3' },
  { callsign: 'ECHO', name: 'Kenji Echo', role: 'Communications Officer', unit: 'COMMS RELAY', clearance: 'C2' },
  { callsign: 'WRAITH', name: 'Anya Wraith', role: 'Cyber Operations', unit: 'CYBER CELL', clearance: 'C4' },
  { callsign: 'ATLAS', name: 'Idris Atlas', role: 'Intelligence Analyst', unit: 'ANALYTIC DIRECTORATE', clearance: 'C4' },
  { callsign: 'PRISM', name: 'Linnea Prism', role: 'AI Systems Supervisor', unit: 'SHADOW AI', clearance: 'C3' },
  { callsign: 'FORGE', name: 'Otto Forge', role: 'Crisis Response Lead', unit: 'CRISIS COMMAND', clearance: 'OMEGA' },
] as const

export const CAMERA_ZONES = [
  'PERIMETER', 'LOBBY', 'SERVER HALL', 'VAULT', 'ELEVATOR', 'CORRIDOR',
  'ROOFTOP', 'DOCK', 'LAB', 'DATA FLOOR', 'GARAGE', 'ATRIUM',
] as const

export const TAG_POOL = [
  'FLAGGED', 'WATCHLIST', 'FINANCIAL', 'LOGISTICS', 'COMMS', 'TRAVEL',
  'SHELL-CORP', 'CONTRACTOR', 'ANALYST', 'COURIER', 'BROKER', 'EMBARGO',
] as const

export const VULN_TITLES = [
  'Simulated TLS downgrade path',
  'Demo credential policy weakness',
  'Placeholder service banner exposure',
  'Synthetic SMB signing disabled',
  'Fictional unpatched middleware',
  'Sample default route misconfiguration',
  'Demonstration weak cipher suite',
  'Simulated open management port',
  'Fictional stale DNS delegation',
  'Placeholder logging gap',
] as const

export const REMEDIATIONS = [
  'Enforce TLS 1.3 minimum across demo endpoints.',
  'Rotate sample credentials and require length policy.',
  'Suppress fictional banner metadata in response headers.',
  'Enable signing on all demonstration SMB shares.',
  'Apply fictional middleware patch v2.4.1 in the lab.',
  'Reapply baseline demo routing table.',
  'Disable legacy cipher suites in simulator profile.',
  'Restrict management interface to demo VLAN.',
  'Refresh synthetic DNS delegation records.',
  'Route demo services through central log collector.',
] as const

export const FORENSIC_CATEGORIES = ['DOCUMENT', 'DEVICE', 'COMMS', 'FINANCIAL', 'PHOTO', 'DATA'] as const

export const MIME_TYPES = [
  'application/pdf', 'image/jpeg', 'text/plain', 'application/zip',
  'application/json', 'application/vnd.oasis.opendocument.text',
  'video/mp4', 'application/octet-stream',
] as const

export const FILE_NAMES = [
  'manifest_4471.pdf', 'site_photo_09.jpg', 'ledger_export.csv', 'comms_burst.log',
  'device_dump.bin', 'interview_notes.txt', 'transfer_receipt.json', 'camera_clip_07.mp4',
  'contract_draft.docx', 'satellite_tile.tif', 'router_config.bak', 'keyring.gpg',
] as const

export const LISTING_POOL = [
  { title: 'Prop Access Credential Kit — Film Use', category: 'FORGED-CREDENTIAL-KIT', desc: 'Inert prop credential set for cinematic scenes. Non-functional.' },
  { title: 'Vintage Hardware Terminal Replica', category: 'PROP-DEVICE', desc: 'Screen-accurate terminal prop with animated display firmware.' },
  { title: 'Automation Script Bundle — Demo Only', category: 'SCRIPT-KIT', desc: 'Fictional automation scripts used in simulation exercises.' },
  { title: 'Synthetic Intelligence Packet', category: 'FICTION-INTEL', desc: 'Generated intelligence packet for production storylines.' },
  { title: 'Signal Analyzer Prop — Replica', category: 'PROP-TOOL', desc: 'Non-transmitting signal analyzer replica for set dressing.' },
  { title: 'Sandbox Demo Access — 30 Days', category: 'DEMO-ACCESS', desc: 'Time-limited access to the SHADOW SYSTEMS demo sandbox.' },
  { title: 'Cinematic CCTV Decoder Prop', category: 'PROP-TOOL', desc: 'Prop CCTV decoder with fake status LEDs.' },
  { title: 'Fictional Ledger Template Pack', category: 'FORGED-CREDENTIAL-KIT', desc: 'Template pack for fictional financial scenes.' },
  { title: 'Encrypted Relay Simulation Node', category: 'SCRIPT-KIT', desc: 'Simulated relay node for set-piece demonstrations.' },
  { title: 'Prop Satellite Uplink Case', category: 'PROP-DEVICE', desc: 'Uplink case prop with working digital display.' },
] as const

export const SEVERITY_ORDER = { low: 0, elevated: 1, critical: 2 } as const

export const OPERATION_TEMPLATES = [
  {
    id: 'tpl-blackout',
    code: 'OP-BLACKOUT',
    name: 'OPERATION BLACKOUT',
    description: 'A simulated infrastructure outage cascading across grid, telecom and financial nodes with staged crisis escalation.',
    category: 'INFRASTRUCTURE',
    severity: 'critical',
    durationMinutes: 6,
    accent: '#f14e61',
  },
  {
    id: 'tpl-ghost',
    code: 'OP-GHOST',
    name: 'OPERATION GHOST PROTOCOL',
    description: 'A fictional digital intelligence investigation tracing a synthetic entity across the relationship graph.',
    category: 'INTELLIGENCE',
    severity: 'elevated',
    durationMinutes: 8,
    accent: '#377eff',
  },
  {
    id: 'tpl-silent',
    code: 'OP-SILENT',
    name: 'OPERATION SILENT TRANSFER',
    description: 'A dramatic fictional financial sequence following a high-value transfer through layered clearing houses.',
    category: 'FINANCIAL',
    severity: 'elevated',
    durationMinutes: 5,
    accent: '#38db91',
  },
  {
    id: 'tpl-redsignal',
    code: 'OP-REDSIGNAL',
    name: 'OPERATION RED SIGNAL',
    description: 'Multi-module emergency event: a simulated comms blackout, escalated alerts and crisis response.',
    category: 'CRISIS',
    severity: 'critical',
    durationMinutes: 7,
    accent: '#f14e61',
  },
  {
    id: 'tpl-darkhorizon',
    code: 'OP-DARKHORIZON',
    name: 'OPERATION DARK HORIZON',
    description: 'Global intelligence situation: fictional target movement across three continents with surveillance uptick.',
    category: 'GEOINT',
    severity: 'elevated',
    durationMinutes: 9,
    accent: '#28d8ea',
  },
  {
    id: 'tpl-zerotrace',
    code: 'OP-ZEROTRACE',
    name: 'OPERATION ZERO TRACE',
    description: 'A fictional investigation and forensics scenario: evidence acquisition, hashing and timeline reconstruction.',
    category: 'FORENSICS',
    severity: 'low',
    durationMinutes: 6,
    accent: '#f5b942',
  },
] as const
