import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { NotificationCenter } from './NotificationCenter'
import { CommandPalette } from './CommandPalette'
import { GlobalSearch } from './GlobalSearch'
import { HelpCenter } from './HelpCenter'
import { useEngine } from '@/services/engine'
import { usePrefs } from '@/services/prefs'
import { cn } from '@/lib/utils'
import { EmergencyOverlay } from '@/components/crisis/EmergencyOverlay'
import { PageLoader } from '@/components/ui/PageLoader'

export function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const collapsed = usePrefs((s) => s.sidebarCollapsed)
  const setPref = usePrefs((s) => s.set)
  const cinematic = useEngine((s) => s.cinematic)
  const emergency = useEngine((s) => s.emergency)
  const paused = useEngine((s) => s.paused)
  const tickEngine = useEngine((s) => s.tickEngine)
  const togglePause = useEngine((s) => s.togglePause)
  const setCinematic = useEngine.setState
  const resetSimulation = useEngine((s) => s.resetSimulation)

  const [mobileNav, setMobileNav] = useState(false)
  const [palette, setPalette] = useState(false)
  const [search, setSearch] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const [help, setHelp] = useState(false)

  // main simulation loop
  useEffect(() => {
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const delta = (now - last) / 1000
      last = now
      tickEngine(delta)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tickEngine])

  // global keyboard shortcuts
  useEffect(() => {
    let gPressed = 0
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPalette((v) => !v)
        return
      }
      if (mod && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setPref('sidebarCollapsed', !collapsed)
        return
      }
      if (mod && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setNotifications(true)
        return
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.()
        else void document.exitFullscreen?.()
        return
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        const s = useEngine.getState()
        if (s.emergency) s.exitEmergency()
        else s.enterEmergency()
        return
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        setCinematic({ cinematic: !useEngine.getState().cinematic })
        return
      }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault()
        if (window.confirm('Reset the entire demonstration? All generated records will be regenerated.')) resetSimulation(false)
        return
      }
      if (mod && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        const p = usePrefs.getState()
        p.set('soundEnabled', !p.soundEnabled)
        return
      }
      if (e.key === '/' && !typing) {
        e.preventDefault()
        setSearch(true)
        return
      }
      if (e.key === ' ' && !typing) {
        e.preventDefault()
        togglePause()
        return
      }
      if (e.key.toLowerCase() === 'g' && !typing && !mod) {
        gPressed = Date.now()
        return
      }
      if (Date.now() - gPressed < 900 && !typing) {
        const map: Record<string, string> = {
          c: '/command-center', f: '/finance', t: '/cyber/terminal',
          m: '/missions', g: '/geoint/world', s: '/surveillance/cameras',
          a: '/ai/chat', r: '/reports', n: '/network/topology',
        }
        const dest = map[e.key.toLowerCase()]
        if (dest) {
          e.preventDefault()
          navigate(dest)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [collapsed, setPref, navigate, resetSimulation, togglePause, setCinematic])

  // close mobile nav on route change
  useEffect(() => {
    setMobileNav(false)
  }, [location.pathname])

  return (
    <div className={cn('flex h-screen overflow-hidden bg-bg', cinematic && 'cinematic-mode')}>
      {/* desktop sidebar */}
      <div className="hidden shrink-0 lg:block">
        <Sidebar collapsed={collapsed} onToggleCollapsed={() => setPref('sidebarCollapsed', !collapsed)} />
      </div>

      {/* mobile drawer */}
      {mobileNav && (
        <div className="fixed inset-0 z-[70] flex lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileNav(false)} />
          <div className="relative z-10 h-full">
            <Sidebar collapsed={false} onToggleCollapsed={() => {}} mobile onNavigate={() => setMobileNav(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onOpenMenu={() => setMobileNav(true)}
          onOpenSearch={() => setSearch(true)}
          onOpenNotifications={() => setNotifications(true)}
          onOpenPalette={() => setPalette(true)}
          onOpenHelp={() => setHelp(true)}
        />
        <main className="relative min-h-0 flex-1 overflow-y-auto">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,color-mix(in_srgb,var(--accent)_7%,transparent),transparent_55%)]" />
          <div className="relative p-2.5 sm:p-3 lg:p-4 lg:pt-[30px]">
            <Suspense fallback={<PageLoader />}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </Suspense>
          </div>
        </main>
      </div>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      <GlobalSearch open={search} onClose={() => setSearch(false)} />
      <NotificationCenter open={notifications} onClose={() => setNotifications(false)} />
      <HelpCenter open={help} onClose={() => setHelp(false)} />
      {emergency && <EmergencyOverlay />}
      {paused && (
        <button
          type="button"
          onClick={togglePause}
          className="fixed bottom-3 left-1/2 z-[60] -translate-x-1/2 border border-[#6d5320] bg-[#2a2110] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#ffd489] shadow-lg hover:bg-[#342a14]"
        >
          ⏸ Simulation paused — click to resume
        </button>
      )}
    </div>
  )
}
