import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { BootSequence } from '@/components/layout/BootSequence'
import { usePrefs } from '@/services/prefs'
import { useEffect } from 'react'
import { ACCENTS } from '@/services/prefs'
import { audio } from '@/services/audio'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'

// ---- public ----
const Landing = lazy(() => import('@/pages/landing/Landing'))
const Access = lazy(() => import('@/pages/access/Access'))

// ---- core ----
const CommandCenter = lazy(() => import('@/pages/command-center/CommandCenter'))
const SystemHealth = lazy(() => import('@/pages/command-center/SystemHealth'))
const ActivityHistory = lazy(() => import('@/pages/command-center/ActivityHistory'))
const CinematicView = lazy(() => import('@/pages/command-center/CinematicView'))

// ---- finance ----
const FinanceOverview = lazy(() => import('@/pages/finance/FinanceOverview'))
const Banks = lazy(() => import('@/pages/finance/Banks'))
const Accounts = lazy(() => import('@/pages/finance/Accounts'))
const Transactions = lazy(() => import('@/pages/finance/Transactions'))
const Transfers = lazy(() => import('@/pages/finance/Transfers'))
const Cards = lazy(() => import('@/pages/finance/Cards'))
const Wallets = lazy(() => import('@/pages/finance/Wallets'))
const Crypto = lazy(() => import('@/pages/finance/Crypto'))
const FinanceAnalytics = lazy(() => import('@/pages/finance/FinanceAnalytics'))

// ---- cyber ----
const CyberOverview = lazy(() => import('@/pages/cyber/CyberOverview'))
const Terminal = lazy(() => import('@/pages/cyber/TerminalPage'))
const AccessSim = lazy(() => import('@/pages/cyber/AccessSim'))
const Firewall = lazy(() => import('@/pages/cyber/Firewall'))
const PasswordLab = lazy(() => import('@/pages/cyber/PasswordLab'))
const CyberEncryption = lazy(() => import('@/pages/cyber/CyberEncryption'))
const Vulnerabilities = lazy(() => import('@/pages/cyber/Vulnerabilities'))
const ServerLab = lazy(() => import('@/pages/cyber/ServerLab'))
const CyberActivity = lazy(() => import('@/pages/cyber/CyberActivity'))

// ---- geoint ----
const GeoOverview = lazy(() => import('@/pages/geoint/GeoOverview'))
const GeoWorld = lazy(() => import('@/pages/geoint/GeoWorld'))
const Targets = lazy(() => import('@/pages/geoint/Targets'))
const GeoHistory = lazy(() => import('@/pages/geoint/GeoHistory'))
const RoutesPage = lazy(() => import('@/pages/geoint/RoutesPage'))
const Geofencing = lazy(() => import('@/pages/geoint/Geofencing'))

// ---- surveillance ----
const SurveillanceOverview = lazy(() => import('@/pages/surveillance/SurveillanceOverview'))
const CameraWall = lazy(() => import('@/pages/surveillance/CameraWall'))
const Playback = lazy(() => import('@/pages/surveillance/Playback'))
const Floors = lazy(() => import('@/pages/surveillance/Floors'))
const SurveillanceIncidents = lazy(() => import('@/pages/surveillance/SurveillanceIncidents'))

// ---- intelligence ----
const IntelOverview = lazy(() => import('@/pages/intelligence/IntelOverview'))
const People = lazy(() => import('@/pages/intelligence/People'))
const Organizations = lazy(() => import('@/pages/intelligence/Organizations'))
const Records = lazy(() => import('@/pages/intelligence/Records'))
const Cases = lazy(() => import('@/pages/intelligence/Cases'))
const Relationships = lazy(() => import('@/pages/intelligence/Relationships'))
const IntelReports = lazy(() => import('@/pages/intelligence/IntelReports'))

// ---- network ----
const NetworkOverview = lazy(() => import('@/pages/network/NetworkOverview'))
const Topology = lazy(() => import('@/pages/network/Topology'))
const Traffic = lazy(() => import('@/pages/network/Traffic'))
const Servers = lazy(() => import('@/pages/network/Servers'))
const Devices = lazy(() => import('@/pages/network/Devices'))
const Monitoring = lazy(() => import('@/pages/network/Monitoring'))

// ---- forensics ----
const ForensicsOverview = lazy(() => import('@/pages/forensics/ForensicsOverview'))
const Files = lazy(() => import('@/pages/forensics/Files'))
const HashLab = lazy(() => import('@/pages/forensics/HashLab'))
const Metadata = lazy(() => import('@/pages/forensics/Metadata'))
const Timeline = lazy(() => import('@/pages/forensics/Timeline'))
const Evidence = lazy(() => import('@/pages/forensics/Evidence'))

// ---- underground ----
const Market = lazy(() => import('@/pages/underground/Market'))
const Vendors = lazy(() => import('@/pages/underground/Vendors'))
const UndergroundMessages = lazy(() => import('@/pages/underground/Messages'))
const Orders = lazy(() => import('@/pages/underground/Orders'))

// ---- cryptography ----
const CryptoOverview = lazy(() => import('@/pages/cryptography/CryptoOverview'))
const Encryption = lazy(() => import('@/pages/cryptography/Encryption'))
const Decryption = lazy(() => import('@/pages/cryptography/Decryption'))
const HashPage = lazy(() => import('@/pages/cryptography/HashPage'))
const Signatures = lazy(() => import('@/pages/cryptography/Signatures'))
const SecretMessages = lazy(() => import('@/pages/cryptography/SecretMessages'))

// ---- ai ----
const AIChat = lazy(() => import('@/pages/ai/AIChat'))
const AIReports = lazy(() => import('@/pages/ai/AIReports'))
const AIAnalysis = lazy(() => import('@/pages/ai/AIAnalysis'))
const AISettings = lazy(() => import('@/pages/ai/AISettings'))

// ---- crisis ----
const CrisisOverview = lazy(() => import('@/pages/crisis/CrisisOverview'))
const CrisisIncidents = lazy(() => import('@/pages/crisis/CrisisIncidents'))
const Alerts = lazy(() => import('@/pages/crisis/Alerts'))
const Infrastructure = lazy(() => import('@/pages/crisis/Infrastructure'))
const CrisisTimeline = lazy(() => import('@/pages/crisis/CrisisTimeline'))

// ---- comms ----
const CommsOverview = lazy(() => import('@/pages/communications/CommsOverview'))
const CommsMessages = lazy(() => import('@/pages/communications/CommsMessages'))
const Operators = lazy(() => import('@/pages/communications/Operators'))
const Calls = lazy(() => import('@/pages/communications/Calls'))
const Dispatch = lazy(() => import('@/pages/communications/Dispatch'))

// ---- missions ----
const MissionDashboard = lazy(() => import('@/pages/missions/MissionDashboard'))
const MissionBuilder = lazy(() => import('@/pages/missions/MissionBuilder'))
const ActiveMissions = lazy(() => import('@/pages/missions/ActiveMissions'))
const MissionHistory = lazy(() => import('@/pages/missions/MissionHistory'))
const Templates = lazy(() => import('@/pages/missions/Templates'))

// ---- reports ----
const ReportsOverview = lazy(() => import('@/pages/reports/ReportsOverview'))
const FinancialReports = lazy(() => import('@/pages/reports/FinancialReports'))
const CyberReports = lazy(() => import('@/pages/reports/CyberReports'))
const NetworkReports = lazy(() => import('@/pages/reports/NetworkReports'))
const IntelReportsPage = lazy(() => import('@/pages/reports/IntelReportsPage'))
const MissionReports = lazy(() => import('@/pages/reports/MissionReports'))
const ReportDetail = lazy(() => import('@/pages/reports/ReportDetail'))

// ---- settings ----
const SettingsGeneral = lazy(() => import('@/pages/settings/SettingsGeneral'))
const SettingsProfile = lazy(() => import('@/pages/settings/SettingsProfile'))
const SettingsAppearance = lazy(() => import('@/pages/settings/SettingsAppearance'))
const SettingsSound = lazy(() => import('@/pages/settings/SettingsSound'))
const SettingsShortcuts = lazy(() => import('@/pages/settings/SettingsShortcuts'))
const SettingsSimulation = lazy(() => import('@/pages/settings/SettingsSimulation'))
const SettingsData = lazy(() => import('@/pages/settings/SettingsData'))

const NotFound = lazy(() => import('@/pages/system/NotFound'))

export default function App() {
  const accent = usePrefs((s) => s.accent)
  const density = usePrefs((s) => s.density)
  const motion = usePrefs((s) => s.motion)
  const soundEnabled = usePrefs((s) => s.soundEnabled)
  const volume = usePrefs((s) => s.volume)
  const fontScale = usePrefs((s) => s.fontScale)
  const texture = usePrefs((s) => s.texture)

  useEffect(() => {
    const color = ACCENTS[accent].color
    document.documentElement.style.setProperty('--accent', color)
    document.documentElement.style.setProperty('--accent-soft', `${color}1f`)
    document.documentElement.dataset.accent = accent
  }, [accent])

  useEffect(() => {
    document.documentElement.dataset.density = density
    document.documentElement.style.setProperty('--density', density === 'compact' ? '0.86' : density === 'spacious' ? '1.16' : '1')
  }, [density])

  useEffect(() => {
    document.documentElement.dataset.motion = motion
  }, [motion])

  useEffect(() => {
    document.documentElement.style.fontSize = `${(fontScale / 100) * 16}px`
  }, [fontScale])

  useEffect(() => {
    document.body.dataset.texture = texture ? 'on' : 'off'
  }, [texture])

  useEffect(() => {
    audio.setEnabled(soundEnabled)
  }, [soundEnabled])

  useEffect(() => {
    audio.setVolume(volume)
  }, [volume])

  return (
    <ErrorBoundary>
      <BootSequence />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/access" element={<Access mode="terminal" />} />
        <Route path="/access/operator" element={<Access mode="operator" />} />
        <Route path="/access/recovery" element={<Access mode="recovery" />} />
        <Route path="/cinematic" element={<CinematicView />} />

        <Route element={<AppShell />}>
          <Route path="/command-center" element={<CommandCenter />} />
          <Route path="/command-center/health" element={<SystemHealth />} />
          <Route path="/command-center/activity" element={<ActivityHistory />} />

          <Route path="/finance" element={<FinanceOverview />} />
          <Route path="/finance/banks" element={<Banks />} />
          <Route path="/finance/accounts" element={<Accounts />} />
          <Route path="/finance/transactions" element={<Transactions />} />
          <Route path="/finance/transfers" element={<Transfers />} />
          <Route path="/finance/cards" element={<Cards />} />
          <Route path="/finance/wallets" element={<Wallets />} />
          <Route path="/finance/crypto" element={<Crypto />} />
          <Route path="/finance/analytics" element={<FinanceAnalytics />} />

          <Route path="/cyber" element={<CyberOverview />} />
          <Route path="/cyber/terminal" element={<Terminal />} />
          <Route path="/cyber/access" element={<AccessSim />} />
          <Route path="/cyber/firewall" element={<Firewall />} />
          <Route path="/cyber/password-lab" element={<PasswordLab />} />
          <Route path="/cyber/encryption" element={<CyberEncryption />} />
          <Route path="/cyber/vulnerabilities" element={<Vulnerabilities />} />
          <Route path="/cyber/server-lab" element={<ServerLab />} />
          <Route path="/cyber/activity" element={<CyberActivity />} />

          <Route path="/geoint" element={<GeoOverview />} />
          <Route path="/geoint/world" element={<GeoWorld />} />
          <Route path="/geoint/targets" element={<Targets />} />
          <Route path="/geoint/history" element={<GeoHistory />} />
          <Route path="/geoint/routes" element={<RoutesPage />} />
          <Route path="/geoint/geofencing" element={<Geofencing />} />

          <Route path="/surveillance" element={<SurveillanceOverview />} />
          <Route path="/surveillance/cameras" element={<CameraWall />} />
          <Route path="/surveillance/playback" element={<Playback />} />
          <Route path="/surveillance/floors" element={<Floors />} />
          <Route path="/surveillance/incidents" element={<SurveillanceIncidents />} />

          <Route path="/intelligence" element={<IntelOverview />} />
          <Route path="/intelligence/people" element={<People />} />
          <Route path="/intelligence/organizations" element={<Organizations />} />
          <Route path="/intelligence/records" element={<Records />} />
          <Route path="/intelligence/cases" element={<Cases />} />
          <Route path="/intelligence/relationships" element={<Relationships />} />
          <Route path="/intelligence/reports" element={<IntelReports />} />

          <Route path="/network" element={<NetworkOverview />} />
          <Route path="/network/topology" element={<Topology />} />
          <Route path="/network/traffic" element={<Traffic />} />
          <Route path="/network/servers" element={<Servers />} />
          <Route path="/network/devices" element={<Devices />} />
          <Route path="/network/monitoring" element={<Monitoring />} />

          <Route path="/forensics" element={<ForensicsOverview />} />
          <Route path="/forensics/files" element={<Files />} />
          <Route path="/forensics/hashes" element={<HashLab />} />
          <Route path="/forensics/metadata" element={<Metadata />} />
          <Route path="/forensics/timeline" element={<Timeline />} />
          <Route path="/forensics/evidence" element={<Evidence />} />

          <Route path="/underground" element={<Navigate to="/underground/market" replace />} />
          <Route path="/underground/market" element={<Market />} />
          <Route path="/underground/vendors" element={<Vendors />} />
          <Route path="/underground/messages" element={<UndergroundMessages />} />
          <Route path="/underground/orders" element={<Orders />} />

          <Route path="/cryptography" element={<CryptoOverview />} />
          <Route path="/cryptography/encryption" element={<Encryption />} />
          <Route path="/cryptography/decryption" element={<Decryption />} />
          <Route path="/cryptography/hash" element={<HashPage />} />
          <Route path="/cryptography/signatures" element={<Signatures />} />
          <Route path="/cryptography/messages" element={<SecretMessages />} />

          <Route path="/ai" element={<Navigate to="/ai/chat" replace />} />
          <Route path="/ai/chat" element={<AIChat />} />
          <Route path="/ai/reports" element={<AIReports />} />
          <Route path="/ai/analysis" element={<AIAnalysis />} />
          <Route path="/ai/settings" element={<AISettings />} />

          <Route path="/crisis" element={<CrisisOverview />} />
          <Route path="/crisis/incidents" element={<CrisisIncidents />} />
          <Route path="/crisis/alerts" element={<Alerts />} />
          <Route path="/crisis/infrastructure" element={<Infrastructure />} />
          <Route path="/crisis/timeline" element={<CrisisTimeline />} />

          <Route path="/communications" element={<CommsOverview />} />
          <Route path="/communications/messages" element={<CommsMessages />} />
          <Route path="/communications/operators" element={<Operators />} />
          <Route path="/communications/calls" element={<Calls />} />
          <Route path="/communications/dispatch" element={<Dispatch />} />

          <Route path="/missions" element={<MissionDashboard />} />
          <Route path="/missions/builder" element={<MissionBuilder />} />
          <Route path="/missions/active" element={<ActiveMissions />} />
          <Route path="/missions/history" element={<MissionHistory />} />
          <Route path="/missions/templates" element={<Templates />} />

          <Route path="/reports" element={<ReportsOverview />} />
          <Route path="/reports/financial" element={<FinancialReports />} />
          <Route path="/reports/cyber" element={<CyberReports />} />
          <Route path="/reports/network" element={<NetworkReports />} />
          <Route path="/reports/intelligence" element={<IntelReportsPage />} />
          <Route path="/reports/missions" element={<MissionReports />} />
          <Route path="/reports/:reportId" element={<ReportDetail />} />

          <Route path="/settings" element={<SettingsGeneral />} />
          <Route path="/settings/profile" element={<SettingsProfile />} />
          <Route path="/settings/appearance" element={<SettingsAppearance />} />
          <Route path="/settings/sound" element={<SettingsSound />} />
          <Route path="/settings/shortcuts" element={<SettingsShortcuts />} />
          <Route path="/settings/simulation" element={<SettingsSimulation />} />
          <Route path="/settings/data" element={<SettingsData />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}
