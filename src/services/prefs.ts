import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AccentKey = 'cyan' | 'green' | 'blue' | 'amber' | 'red' | 'violet'
export const ACCENTS: Record<AccentKey, { color: string; label: string }> = {
  cyan: { color: '#28d8ea', label: 'Cyan Protocol' },
  green: { color: '#38db91', label: 'Neon Green' },
  blue: { color: '#377eff', label: 'Electric Blue' },
  amber: { color: '#f5b942', label: 'Warning Amber' },
  red: { color: '#f14e61', label: 'Critical Red' },
  violet: { color: '#a78bfa', label: 'Spectre Violet' },
}

export type Density = 'compact' | 'comfortable' | 'spacious'
export type MotionLevel = 'full' | 'reduced'
/** Drives the CSS --anim-scale multiplier and framer-motion defaults. */
export type AnimIntensity = 'cinematic' | 'standard' | 'minimal'

export interface PrefsState {
  accent: AccentKey
  density: Density
  fontScale: number
  motion: MotionLevel
  texture: boolean
  soundEnabled: boolean
  volume: number
  ambient: boolean
  animIntensity: AnimIntensity
  /** Cues the operator has switched off individually. */
  mutedCues: string[]
  sidebarCollapsed: boolean
  defaultLanding: string
  favoriteModules: string[]
  displayName: string
  avatarSeed: string
  terminalFontSize: number
  terminalTheme: 'green' | 'amber' | 'cyan' | 'white'
  autoUpdateFrequency: number
  clockFormat: 24 | 12
  set: <K extends keyof PrefsState>(key: K, value: PrefsState[K]) => void
  toggleFavorite: (id: string) => void
  resetPrefs: () => void
}

const DEFAULTS = {
  accent: 'cyan' as AccentKey,
  density: 'comfortable' as Density,
  fontScale: 100,
  motion: 'full' as MotionLevel,
  texture: true,
  soundEnabled: false,
  volume: 0.4,
  ambient: false,
  animIntensity: 'standard' as AnimIntensity,
  mutedCues: [] as string[],
  sidebarCollapsed: false,
  defaultLanding: '/command-center',
  favoriteModules: ['command', 'missions', 'finance'],
  displayName: 'Operator VANTA',
  avatarSeed: 'VANTA',
  terminalFontSize: 12.5,
  terminalTheme: 'green' as const,
  autoUpdateFrequency: 5,
  clockFormat: 24 as const,
}

export const usePrefs = create<PrefsState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      set: (key, value) => set({ [key]: value } as Partial<PrefsState>),
      toggleFavorite: (id) => {
        const cur = get().favoriteModules
        set({ favoriteModules: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] })
      },
      resetPrefs: () => set({ ...DEFAULTS }),
    }),
    { name: 'shadow-systems-prefs', version: 2 },
  ),
)
