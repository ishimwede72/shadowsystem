import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

export type FeedKind = 'corridor' | 'lobby' | 'street' | 'garage' | 'server' | 'roof' | 'dock' | 'lab'

const KIND_ORDER: FeedKind[] = ['corridor', 'lobby', 'street', 'garage', 'server', 'roof', 'dock', 'lab']

export function feedKindFor(seed: string): FeedKind {
  const sum = Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0)
  return KIND_ORDER[sum % KIND_ORDER.length]
}

/**
 * Purely decorative SVG "camera feed". Every frame is generated locally —
 * nothing is captured, recorded, streamed or sourced from a real device.
 */
export function SyntheticCamera({
  seed,
  color = '#28d8ea',
  kind,
  className,
  moving = true,
  scan = true,
  noise = true,
  label = true,
}: {
  seed: string
  color?: string
  kind?: FeedKind
  className?: string
  moving?: boolean
  scan?: boolean
  noise?: boolean
  label?: boolean
}) {
  const shape = kind ?? feedKindFor(seed)
  const [frameTick, setFrameTick] = useState(0)
  const [glitch, setGlitch] = useState(false)

  useEffect(() => {
    if (!moving) return
    const i = window.setInterval(() => setFrameTick((t) => t + 1), 1600)
    const g = window.setInterval(() => {
      setGlitch(true)
      window.setTimeout(() => setGlitch(false), 220)
    }, 9000)
    return () => {
      clearInterval(i)
      clearInterval(g)
    }
  }, [moving])

  const num = useMemo(() => Array.from(seed).reduce((a, c) => a + c.charCodeAt(0), 0), [seed])
  const drift = moving ? (frameTick % 7) * 1.6 : 0

  return (
    <div className={cn('relative overflow-hidden bg-[#04080c]', className)}>
      <svg viewBox="0 0 160 90" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={`fade-${num}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.10" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="160" height="90" fill="#04080c" />
        <rect width="160" height="90" fill={`url(#fade-${num})`} />

        {/* perspective floor / ceiling lines */}
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 9} x2={160} y2={i * 9} stroke={color} strokeOpacity={0.055} strokeWidth={0.4} />
        ))}
        {Array.from({ length: 15 }, (_, i) => (
          <line key={`v${i}`} x1={i * 11.4} y1={0} x2={i * 11.4} y2={90} stroke={color} strokeOpacity={0.045} strokeWidth={0.4} />
        ))}

        {shape === 'corridor' && (
          <g stroke={color} fill="none" strokeWidth="0.6">
            <path d={`M${14 + drift} 8 L${146 - drift} 8 L110 82 L50 82 Z`} strokeOpacity="0.22" />
            <path d={`M${38 + drift} 16 L${122 - drift} 16 L100 78 L60 78 Z`} strokeOpacity="0.35" />
            {[28, 44, 58, 70].map((y, i) => (
              <line key={y} x1={34 + i * 3 + drift} y1={y} x2={126 - i * 3 - drift} y2={y} strokeOpacity="0.3" />
            ))}
            <rect x={74 + drift} y={34} width="12" height="16" fill={color} fillOpacity="0.12" strokeOpacity="0.5" />
          </g>
        )}

        {shape === 'lobby' && (
          <g stroke={color} fill="none" strokeWidth="0.6">
            <line x1="0" y1="58" x2="160" y2="58" strokeOpacity="0.3" />
            <rect x={18 + drift} y={38} width="30" height="20" strokeOpacity="0.4" />
            <rect x={104 - drift} y={44} width="24" height="14" strokeOpacity="0.35" />
            <circle cx={80 + drift} cy={30} r="7" strokeOpacity="0.5" />
            <circle cx={80 + drift} cy={30} r="11" strokeOpacity="0.2" />
            <path d="M52 34 L70 34 L70 40 L52 40 Z" strokeOpacity="0.28" />
            <path d="M0 78 L160 78" strokeOpacity="0.18" strokeDasharray="4 3" />
          </g>
        )}

        {shape === 'street' && (
          <g stroke={color} fill="none" strokeWidth="0.6">
            <path d="M0 66 L160 60" strokeOpacity="0.3" />
            <path d="M0 72 L160 66" strokeOpacity="0.16" />
            <rect x={10 + drift} y={24} width="26" height="36" strokeOpacity="0.35" />
            <rect x={42 + drift} y={16} width="18" height="44" strokeOpacity="0.25" />
            <rect x={112 - drift} y={20} width="30" height="40" strokeOpacity="0.3" />
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1={20 + i * 6} y1={70 + i * 2} x2={40 + i * 6} y2={70 + i * 2} strokeOpacity="0.4" />
            ))}
            <rect x={74} y={48} width="18" height="9" strokeOpacity="0.5" fill={color} fillOpacity="0.08" />
          </g>
        )}

        {shape === 'garage' && (
          <g stroke={color} fill="none" strokeWidth="0.6">
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={8 + i * 30} y={44} width="24" height="26" strokeOpacity="0.28" />
            ))}
            <line x1="0" y1="42" x2="160" y2="42" strokeOpacity="0.35" />
            <line x1="0" y1="80" x2="160" y2="80" strokeOpacity="0.2" />
            <rect x={60 + drift} y={50} width="14" height="20" fill={color} fillOpacity="0.1" strokeOpacity="0.5" />
          </g>
        )}

        {shape === 'server' && (
          <g stroke={color} fill="none" strokeWidth="0.6">
            {[0, 1, 2, 3].map((r) => (
              <g key={r}>
                <rect x={20 + r * 32} y={14} width="24" height="62" strokeOpacity="0.32" />
                {Array.from({ length: 8 }, (_, i) => (
                  <line key={i} x1={22 + r * 32} y1={18 + i * 7.5} x2={42 + r * 32} y2={18 + i * 7.5} strokeOpacity="0.22" />
                ))}
              </g>
            ))}
            <circle cx={30 + (frameTick % 4) * 32} cy={22 + (frameTick % 3) * 7.5} r="1.2" fill={color} fillOpacity="0.9" stroke="none" />
          </g>
        )}

        {shape === 'roof' && (
          <g stroke={color} fill="none" strokeWidth="0.6">
            <path d="M0 58 L52 40 L108 40 L160 58" strokeOpacity="0.35" />
            <line x1="0" y1="58" x2="160" y2="58" strokeOpacity="0.22" />
            <circle cx={52} cy={46} r="5" strokeOpacity="0.4" />
            <circle cx={108} cy={46} r="5" strokeOpacity="0.4" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <line key={i} x1={i * 28 + 8} y1={70} x2={i * 28 + 8} y2={90} strokeOpacity="0.18" />
            ))}
            <rect x={70 + drift} y={62} width="10" height="8" fill={color} fillOpacity="0.14" strokeOpacity="0.5" />
          </g>
        )}

        {shape === 'dock' && (
          <g stroke={color} fill="none" strokeWidth="0.6">
            <line x1="0" y1="54" x2="160" y2="54" strokeOpacity="0.3" />
            {[0, 1, 2].map((i) => (
              <rect key={i} x={10 + i * 46} y={30} width="34" height="24" strokeOpacity="0.32" />
            ))}
            {[0, 1, 2, 3].map((i) => (
              <rect key={`c${i}`} x={18 + i * 34} y={64} width="20" height="14" strokeOpacity="0.24" />
            ))}
            <line x1={80 + drift} y1={22} x2={80 + drift} y2={54} strokeOpacity="0.4" strokeDasharray="2 2" />
          </g>
        )}

        {shape === 'lab' && (
          <g stroke={color} fill="none" strokeWidth="0.6">
            <line x1="0" y1="62" x2="160" y2="62" strokeOpacity="0.3" />
            <rect x={22} y={40} width="44" height="22" strokeOpacity="0.34" />
            <rect x={96} y={44} width="34" height="18" strokeOpacity="0.3" />
            <circle cx={44} cy={30} r="8" strokeOpacity="0.42" />
            {[0, 1, 2].map((i) => (
              <line key={i} x1={110} y1={30 + i * 5} x2={132} y2={30 + i * 5} strokeOpacity="0.4" />
            ))}
            <rect x={68 + drift} y={54} width="12" height="8" fill={color} fillOpacity="0.12" strokeOpacity="0.5" />
          </g>
        )}

        {/* camera noise */}
        {noise && (
          <g opacity="0.16">
            {Array.from({ length: 34 }, (_, i) => {
              const x = ((num + i * 37) % 160) + (moving ? (frameTick * 3 + i) % 5 : 0)
              const y = (num * 3 + i * 53) % 90
              return <rect key={i} x={x} y={y} width="1.6" height="1.6" fill={color} />
            })}
          </g>
        )}

        {/* scan sweep */}
        {scan && (
          <rect x="0" y="0" width="160" height="2" fill={color} fillOpacity="0.3">
            <animate attributeName="y" values="-4;90" dur="3.4s" repeatCount="indefinite" />
          </rect>
        )}

        {/* crosshair */}
        <g stroke={color} strokeOpacity="0.45" strokeWidth="0.4">
          <line x1="80" y1="34" x2="80" y2="56" />
          <line x1="69" y1="45" x2="91" y2="45" />
          <rect x="75" y="40" width="10" height="10" fill="none" />
        </g>

        {glitch && <rect width="160" height="90" fill={color} fillOpacity="0.16" />}

        {label && (
          <>
            <text x="5" y="9" fill={color} fontSize="4.6" fontFamily="IBM Plex Mono, monospace" opacity="0.9">● REC · SYNTHETIC</text>
            <text x="155" y="9" fill={color} fontSize="4.6" fontFamily="IBM Plex Mono, monospace" opacity="0.65" textAnchor="end">{seed}</text>
            <text x="5" y="86" fill={color} fontSize="4.2" fontFamily="IBM Plex Mono, monospace" opacity="0.55">{shape.toUpperCase()} · NOT A REAL CAMERA</text>
          </>
        )}
      </svg>
      <div className="pointer-events-none absolute inset-0 scanlines opacity-30" />
    </div>
  )
}

export default SyntheticCamera
