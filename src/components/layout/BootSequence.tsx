import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { ShadowMark } from '@/components/brand/Logo'
import { cn } from '@/lib/utils'
import { audio } from '@/services/audio'
import { usePrefs } from '@/services/prefs'

const LINES = [
  'SHADOW SYSTEMS CORE v4.2.0 · BOOT',
  'Loading cryptographic substrate … OK',
  'Mounting simulated financial ledger … OK',
  'Initialising geospatial renderer … OK',
  'Linking surveillance matrix (14 nodes) … OK',
  'Spinning up event bus … OK',
  'Verifying simulation containment … OK',
  'Operator channel authenticated …',
  'BEYOND THE VISIBLE.',
]

export function BootSequence() {
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(true)
  const soundEnabled = usePrefs((s) => s.soundEnabled)

  useEffect(() => {
    const isPublic = location.pathname === '/' || location.pathname.startsWith('/access') || location.pathname === '/cinematic'
    const seen = sessionStorage.getItem('ss-boot-seen')
    if (isPublic && !seen) {
      setVisible(true)
      setDone(false)
      setStep(0)
      sessionStorage.setItem('ss-boot-seen', '1')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!visible) return
    if (soundEnabled) audio.play('startup')
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= LINES.length - 1) {
          clearInterval(id)
          setTimeout(() => {
            setDone(true)
            setTimeout(() => setVisible(false), 650)
          }, 380)
          return s
        }
        return s + 1
      })
    }, 240)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  if (!visible) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#04070a] transition-opacity duration-500',
        done && 'pointer-events-none opacity-0',
      )}
    >
      <div className="micro-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="scanlines pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative flex flex-col items-center">
        <ShadowMark size={84} animated />
        <div className="mt-5 text-center">
          <h1 className="font-display text-2xl font-bold uppercase tracking-[0.42em] text-ink animate-[logoReveal_1.2s_ease-out_both]">
            SHADOW <span className="text-[var(--accent)]">SYSTEMS</span>
          </h1>
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.5em] text-ink-3 animate-[logoReveal_1.5s_ease-out_both]">
            BEYOND THE VISIBLE
          </p>
        </div>
        <div className="mt-8 w-[min(88vw,420px)] border border-line bg-black/50 p-3 backdrop-blur">
          <div className="h-28 overflow-hidden font-terminal text-[10.5px] leading-relaxed text-[#79f0b9]">
            {LINES.slice(0, step + 1).map((l, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-ink-3">{String(i + 1).padStart(2, '0')}</span>
                <span className={cn(i === step && !done && 'caret')}>{l}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 h-[2px] w-full bg-[#16212b]">
            <div
              className="h-full bg-[var(--accent)] transition-[width] duration-200"
              style={{ width: `${((step + 1) / LINES.length) * 100}%`, boxShadow: '0 0 10px var(--accent)' }}
            />
          </div>
        </div>
        <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.3em] text-ink-3">
          FICTIONAL SIMULATION ENVIRONMENT · NO REAL SYSTEMS ACCESSED
        </p>
      </div>
      <style>{`@keyframes logoReveal{from{opacity:0;letter-spacing:.6em;filter:blur(6px)}to{opacity:1;letter-spacing:inherit;filter:blur(0)}}`}</style>
    </div>
  )
}
