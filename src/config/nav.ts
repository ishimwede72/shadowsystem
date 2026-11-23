import {
  LayoutDashboard, Wallet, Terminal, Globe2, Cctv, Database, Network,
  Microscope, Store, Lock, Bot, Siren, MessagesSquare, Crosshair,
  FileBarChart, Settings, type LucideIcon,
} from 'lucide-react'
import type { ModuleKey } from '@/types'

export interface NavChild {
  label: string
  to: string
  badge?: string
}

export interface NavGroup {
  id: ModuleKey | 'settings'
  label: string
  to: string
  icon: LucideIcon
  accent: string
  children: NavChild[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'command',
    label: 'Overview',
    to: '/command-center',
    icon: LayoutDashboard,
    accent: '#28d8ea',
    children: [
      { label: 'Command Center', to: '/command-center' },
      { label: 'System Health', to: '/command-center/health' },
      { label: 'Activity History', to: '/command-center/activity' },
    ],
  },
  {
    id: 'finance',
    label: 'Financial Systems',
    to: '/finance',
    icon: Wallet,
    accent: '#38db91',
    children: [
      { label: 'Overview', to: '/finance' },
      { label: 'Institutions', to: '/finance/banks' },
      { label: 'Accounts', to: '/finance/accounts' },
      { label: 'Transactions', to: '/finance/transactions' },
      { label: 'Transfers', to: '/finance/transfers' },
      { label: 'Cards', to: '/finance/cards' },
      { label: 'Wallets', to: '/finance/wallets' },
      { label: 'Crypto', to: '/finance/crypto' },
      { label: 'Analytics', to: '/finance/analytics' },
    ],
  },
  {
    id: 'cyber',
    label: 'Cyber Operations',
    to: '/cyber',
    icon: Terminal,
    accent: '#38db91',
    children: [
      { label: 'Overview', to: '/cyber' },
      { label: 'Terminal', to: '/cyber/terminal', badge: 'LIVE' },
      { label: 'Access Simulation', to: '/cyber/access' },
      { label: 'Firewall', to: '/cyber/firewall' },
      { label: 'Password Lab', to: '/cyber/password-lab' },
      { label: 'Encryption', to: '/cyber/encryption' },
      { label: 'Vulnerabilities', to: '/cyber/vulnerabilities' },
      { label: 'Server Lab', to: '/cyber/server-lab' },
      { label: 'Activity', to: '/cyber/activity' },
    ],
  },
  {
    id: 'geoint',
    label: 'Global Intelligence',
    to: '/geoint',
    icon: Globe2,
    accent: '#28d8ea',
    children: [
      { label: 'World Map', to: '/geoint/world' },
      { label: 'Targets', to: '/geoint/targets' },
      { label: 'History', to: '/geoint/history' },
      { label: 'Routes', to: '/geoint/routes' },
      { label: 'Geofencing', to: '/geoint/geofencing' },
    ],
  },
  {
    id: 'surveillance',
    label: 'Surveillance',
    to: '/surveillance',
    icon: Cctv,
    accent: '#377eff',
    children: [
      { label: 'Camera Wall', to: '/surveillance/cameras' },
      { label: 'Playback', to: '/surveillance/playback' },
      { label: 'Building Overview', to: '/surveillance/floors' },
      { label: 'Incidents', to: '/surveillance/incidents' },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence DB',
    to: '/intelligence',
    icon: Database,
    accent: '#377eff',
    children: [
      { label: 'Overview', to: '/intelligence' },
      { label: 'Profiles', to: '/intelligence/people' },
      { label: 'Organizations', to: '/intelligence/organizations' },
      { label: 'Records', to: '/intelligence/records' },
      { label: 'Cases', to: '/intelligence/cases' },
      { label: 'Relationships', to: '/intelligence/relationships' },
      { label: 'Reports', to: '/intelligence/reports' },
    ],
  },
  {
    id: 'network',
    label: 'Network Operations',
    to: '/network',
    icon: Network,
    accent: '#28d8ea',
    children: [
      { label: 'Overview', to: '/network' },
      { label: 'Topology', to: '/network/topology' },
      { label: 'Traffic', to: '/network/traffic' },
      { label: 'Servers', to: '/network/servers' },
      { label: 'Devices', to: '/network/devices' },
      { label: 'Monitoring', to: '/network/monitoring' },
    ],
  },
  {
    id: 'forensics',
    label: 'Digital Forensics',
    to: '/forensics',
    icon: Microscope,
    accent: '#f5b942',
    children: [
      { label: 'Overview', to: '/forensics' },
      { label: 'Files', to: '/forensics/files' },
      { label: 'Hash Lab', to: '/forensics/hashes' },
      { label: 'Metadata', to: '/forensics/metadata' },
      { label: 'Timeline', to: '/forensics/timeline' },
      { label: 'Evidence', to: '/forensics/evidence' },
    ],
  },
  {
    id: 'underground',
    label: 'Underground Sim',
    to: '/underground',
    icon: Store,
    accent: '#f14e61',
    children: [
      { label: 'Market', to: '/underground/market' },
      { label: 'Vendors', to: '/underground/vendors' },
      { label: 'Messages', to: '/underground/messages' },
      { label: 'Orders', to: '/underground/orders' },
    ],
  },
  {
    id: 'crypto',
    label: 'Cryptography',
    to: '/cryptography',
    icon: Lock,
    accent: '#38db91',
    children: [
      { label: 'Encryption', to: '/cryptography/encryption' },
      { label: 'Decryption', to: '/cryptography/decryption' },
      { label: 'Hashing', to: '/cryptography/hash' },
      { label: 'Signatures', to: '/cryptography/signatures' },
      { label: 'Secret Messages', to: '/cryptography/messages' },
    ],
  },
  {
    id: 'ai',
    label: 'AI Intelligence',
    to: '/ai',
    icon: Bot,
    accent: '#28d8ea',
    children: [
      { label: 'SHADOW AI', to: '/ai/chat' },
      { label: 'Reports', to: '/ai/reports' },
      { label: 'Analysis', to: '/ai/analysis' },
      { label: 'Settings', to: '/ai/settings' },
    ],
  },
  {
    id: 'crisis',
    label: 'Crisis Management',
    to: '/crisis',
    icon: Siren,
    accent: '#f14e61',
    children: [
      { label: 'Overview', to: '/crisis' },
      { label: 'Incidents', to: '/crisis/incidents' },
      { label: 'Alerts', to: '/crisis/alerts' },
      { label: 'Infrastructure', to: '/crisis/infrastructure' },
      { label: 'Timeline', to: '/crisis/timeline' },
    ],
  },
  {
    id: 'comms',
    label: 'Communications',
    to: '/communications',
    icon: MessagesSquare,
    accent: '#377eff',
    children: [
      { label: 'Overview', to: '/communications' },
      { label: 'Messages', to: '/communications/messages' },
      { label: 'Operators', to: '/communications/operators' },
      { label: 'Calls', to: '/communications/calls' },
      { label: 'Dispatch', to: '/communications/dispatch' },
    ],
  },
  {
    id: 'missions',
    label: 'Mission Control',
    to: '/missions',
    icon: Crosshair,
    accent: '#f5b942',
    children: [
      { label: 'Dashboard', to: '/missions' },
      { label: 'Builder', to: '/missions/builder' },
      { label: 'Active', to: '/missions/active' },
      { label: 'History', to: '/missions/history' },
      { label: 'Templates', to: '/missions/templates' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    to: '/reports',
    icon: FileBarChart,
    accent: '#377eff',
    children: [
      { label: 'Overview', to: '/reports' },
      { label: 'Financial', to: '/reports/financial' },
      { label: 'Cyber', to: '/reports/cyber' },
      { label: 'Network', to: '/reports/network' },
      { label: 'Intelligence', to: '/reports/intelligence' },
      { label: 'Missions', to: '/reports/missions' },
    ],
  },
  {
    id: 'settings',
    label: 'System Settings',
    to: '/settings',
    icon: Settings,
    accent: '#93a3b4',
    children: [
      { label: 'General', to: '/settings' },
      { label: 'Profile', to: '/settings/profile' },
      { label: 'Appearance', to: '/settings/appearance' },
      { label: 'Sound', to: '/settings/sound' },
      { label: 'Shortcuts', to: '/settings/shortcuts' },
      { label: 'Simulation', to: '/settings/simulation' },
      { label: 'Data', to: '/settings/data' },
    ],
  },
]

export const NAV_LOOKUP = new Map(NAV_GROUPS.flatMap((g) => g.children.map((c) => [c.to, { group: g, child: c }])))

export function resolvePageTitle(pathname: string): { group: NavGroup; child: NavChild } | null {
  if (NAV_LOOKUP.has(pathname)) return NAV_LOOKUP.get(pathname)!
  // longest prefix match
  let best: { group: NavGroup; child: NavChild } | null = null
  for (const g of NAV_GROUPS) {
    for (const c of g.children) {
      if (pathname.startsWith(c.to) && (!best || c.to.length > best.child.to.length)) best = { group: g, child: c }
    }
  }
  return best
}
