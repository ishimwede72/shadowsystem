import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, CornerDownLeft, ArrowUp, ArrowDown, LayoutGrid, Crosshair,
  RotateCcw, Siren, Volume2, Moon, Sparkles, FileDown, Wand2, Signal, Circle, Square, Film,
} from 'lucide-react'
import { NAV_GROUPS } from '@/config/nav'
import { cn, downloadFile, toCSV, pad } from '@/lib/utils'
import { useEngine } from '@/services/engine'
import { ShadowMark } from '@/components/brand/Logo'
import { usePrefs } from '@/services/prefs'
import { useRecorder } from '@/services/recorder'

interface Item {
  id: string
  label: string
  hint?: string
  group: string
  icon: React.ElementType
  run: () => void
  keywords?: string
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const engine = useEngine
  const resetSimulation = useEngine((s) => s.resetSimulation)
  const enterEmergency = useEngine((s) => s.enterEmergency)
  const setSpeed = useEngine((s) => s.setSpeed)
  const togglePause = useEngine((s) => s.togglePause)
  const notifications = useEngine((s) => s.notifications)
  const transactions = useEngine((s) => s.transactions)
  const recorder = useRecorder()
  const setCinematic = useEngine.setState
  const setPref = usePrefs((s) => s.set)
  const soundEnabled = usePrefs((s) => s.soundEnabled)

  const items = useMemo<Item[]>(() => {
    const navItems: Item[] = NAV_GROUPS.flatMap((g) =>
      g.children.map((c) => ({
        id: `nav-${c.to}`,
        label: c.label,
        hint: g.label,
        group: 'Navigate',
        icon: g.icon,
        keywords: `${g.label} ${c.label}`,
        run: () => {
          navigate(c.to)
          onClose()
        },
      })),
    )
    const actions: Item[] = [
      recorder.recording
        ? {
            id: 'act-rec-stop',
            label: 'Stop & save recording',
            hint: `${recorder.live.length} frames captured`,
            group: 'Recorder',
            icon: Square,
            run: () => { recorder.stop(); onClose() },
          }
        : {
            id: 'act-rec-start',
            label: 'Arm scenario recorder',
            hint: 'Capture every bus event to a replayable tape',
            group: 'Recorder',
            icon: Circle,
            run: () => { recorder.start(); onClose() },
          },
      {
        id: 'act-rec-open',
        label: 'Open scenario recorder',
        hint: `${recorder.recordings.length} saved takes`,
        group: 'Recorder',
        icon: Film,
        run: () => { navigate('/missions/recorder'); onClose() },
      },
      {
        id: 'act-sim-reset',
        label: 'Reset demonstration',
        hint: 'Regenerate all records',
        group: 'Actions',
        icon: RotateCcw,
        run: () => { resetSimulation(false); onClose() },
      },
      {
        id: 'act-emergency',
        label: 'Activate emergency mode',
        hint: 'Full-screen crisis presentation',
        group: 'Actions',
        icon: Siren,
        run: () => { enterEmergency(); navigate('/crisis'); onClose() },
      },
      {
        id: 'act-cinematic',
        label: 'Toggle cinematic mode',
        hint: 'Presentation layout',
        group: 'Actions',
        icon: Moon,
        run: () => { setCinematic({ cinematic: !engine.getState().cinematic }); onClose() },
      },
      {
        id: 'act-pause',
        label: 'Pause / resume simulation',
        hint: 'Engine control',
        group: 'Actions',
        icon: Signal,
        run: () => { togglePause(); onClose() },
      },
      {
        id: 'act-speed-2',
        label: 'Set simulation speed 2x',
        group: 'Actions',
        icon: Sparkles,
        run: () => { setSpeed(2); onClose() },
      },
      {
        id: 'act-sound',
        label: 'Toggle sound engine',
        group: 'Actions',
        icon: Volume2,
        run: () => { setPref('soundEnabled', !soundEnabled); onClose() },
      },
      {
        id: 'act-export-txn',
        label: 'Export transactions CSV',
        hint: `${transactions.length} fictional records`,
        group: 'Actions',
        icon: FileDown,
        run: () => {
          downloadFile(
            `shadow-transactions-${pad(new Date().getHours())}${pad(new Date().getMinutes())}.csv`,
            toCSV(transactions.map(({ id, reference, sender, recipient, amount, currency, status, channel, timestamp }) => ({
              id, reference, sender, recipient, amount, currency, status, channel, timestamp,
            }))),
            'text/csv',
          )
          onClose()
        },
      },
      {
        id: 'act-export-notif',
        label: 'Export notifications JSON',
        hint: `${notifications.length} records`,
        group: 'Actions',
        icon: Wand2,
        run: () => {
          downloadFile('shadow-notifications.json', JSON.stringify(notifications, null, 2), 'application/json')
          onClose()
        },
      },
      {
        id: 'act-mission',
        label: 'Open mission builder',
        group: 'Actions',
        icon: Crosshair,
        run: () => { navigate('/missions/builder'); onClose() },
      },
      {
        id: 'act-dash',
        label: 'Customize dashboard layout',
        group: 'Actions',
        icon: LayoutGrid,
        run: () => { navigate('/command-center?customize=1'); onClose() },
      },
    ]
    return [...actions, ...navItems]
  }, [navigate, onClose, resetSimulation, enterEmergency, setSpeed, togglePause, setPref, soundEnabled, transactions, notifications, setCinematic])

  const results = useMemo(() => {
    if (!q.trim()) return items.slice(0, 12)
    const t = q.toLowerCase()
    return items
      .filter((i) => (i.label + ' ' + (i.keywords ?? '') + ' ' + (i.hint ?? '')).toLowerCase().includes(t))
      .slice(0, 14)
  }, [q, items])

  useEffect(() => {
    if (open) {
      setQ('')
      setIdx(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => setIdx(0), [q])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setIdx((i) => Math.min(results.length - 1, i + 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setIdx((i) => Math.max(0, i - 1))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        results[idx]?.run()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, idx, onClose])

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${idx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [idx])

  if (!open) return null

  const groups = results.reduce<Record<string, Item[]>>((acc, it) => {
    ;(acc[it.group] ??= []).push(it)
    return acc
  }, {})

  let flat = -1

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/70 p-3 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div
        className="panel corner-marks w-full max-w-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-2 border-b border-line bg-[#0d151d] px-3 py-2.5">
          <Search size={14} className="text-[var(--accent)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search modules, run an action, jump anywhere…"
            className="w-full bg-transparent font-mono text-[12.5px] text-ink placeholder:text-ink-3 focus:outline-none"
            aria-label="Command search"
          />
          <kbd className="border border-line px-1 font-mono text-[9px] text-ink-3">ESC</kbd>
        </div>
        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-1.5">
          {Object.entries(groups).map(([group, list]) => (
            <div key={group} className="mb-1">
              <p className="label-xs px-2 py-1">{group}</p>
              {list.map((it) => {
                flat++
                const activeIndex = flat
                const Icon = it.icon
                return (
                  <button
                    key={it.id}
                    type="button"
                    data-idx={activeIndex}
                    onMouseEnter={() => setIdx(activeIndex)}
                    onClick={it.run}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left transition-colors',
                      idx === activeIndex ? 'bg-[var(--accent-soft)] text-ink' : 'text-ink-2 hover:bg-elevated',
                    )}
                  >
                    <Icon size={13} className={idx === activeIndex ? 'text-[var(--accent)]' : 'text-ink-3'} />
                    <span className="min-w-0 flex-1 truncate text-[12px]">{it.label}</span>
                    {it.hint && <span className="hidden shrink-0 font-mono text-[9px] text-ink-3 sm:block">{it.hint}</span>}
                    {idx === activeIndex && <CornerDownLeft size={11} className="shrink-0 text-[var(--accent)]" />}
                  </button>
                )
              })}
            </div>
          ))}
          {results.length === 0 && (
            <p className="px-2 py-6 text-center text-[11px] text-ink-3">No matching command or module.</p>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-line bg-[#0d151d] px-3 py-1.5">
          <span className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-wider text-ink-3">
            <span className="flex items-center gap-1"><ArrowUp size={9} /><ArrowDown size={9} /> navigate</span>
            <span className="flex items-center gap-1"><CornerDownLeft size={9} /> run</span>
          </span>
          <span className="flex items-center gap-1.5 opacity-60">
            <ShadowMark size={14} />
            <span className="font-mono text-[9px] uppercase tracking-widest text-ink-3">Shadow Systems</span>
          </span>
        </div>
      </div>
    </div>
  )
}
