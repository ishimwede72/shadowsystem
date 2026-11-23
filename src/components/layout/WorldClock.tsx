// Timezones are computed with Intl so they stay correct across DST changes —
// no offsets are hardcoded and no date library is needed.
import { useEffect, useMemo, useState } from 'react'
import { Globe2, Clock, Sun, Moon } from 'lucide-react'
import { Panel, Tag } from '@/components/ui'
import { cn } from '@/lib/utils'

export interface Zone {
  city: string
  zone: string
  code: string
  /** Operational role in the fiction, shown as a caption. */
  station: string
}

export const ZONES: Zone[] = [
  { city: 'Kigali', zone: 'Africa/Kigali', code: 'KGL', station: 'FIELD OFFICE' },
  { city: 'Zurich', zone: 'Europe/Zurich', code: 'ZRH', station: 'FINANCIAL HUB' },
  { city: 'London', zone: 'Europe/London', code: 'LON', station: 'LIAISON' },
  { city: 'Reykjavík', zone: 'Atlantic/Reykjavik', code: 'REK', station: 'ARCHIVE' },
  { city: 'New York', zone: 'America/New_York', code: 'NYC', station: 'MARKETS DESK' },
  { city: 'Singapore', zone: 'Asia/Singapore', code: 'SIN', station: 'RELAY' },
  { city: 'Tokyo', zone: 'Asia/Tokyo', code: 'TYO', station: 'SIGINT' },
  { city: 'Dubai', zone: 'Asia/Dubai', code: 'DXB', station: 'LOGISTICS' },
]

/** Returns { hh, mm, ss, hour, weekday } for a zone at a given instant. */
export function zoneTime(date: Date, zone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  const hour = Number(get('hour')) % 24
  return { hh: String(hour).padStart(2, '0'), mm: get('minute'), ss: get('second'), hour, weekday: get('weekday') }
}

/**
 * Minutes east of UTC for a zone at an instant. Built from the same wall-clock
 * fields the formatter produces, so DST transitions are handled by Intl rather
 * than hardcoded offsets.
 */
export function zoneOffsetMinutes(date: Date, zone: string) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const p = dtf.formatToParts(date)
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0)
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'))
  const realUTC = Math.floor(date.getTime() / 1000) * 1000
  return Math.round((asUTC - realUTC) / 60000)
}

const fmtOffset = (min: number) => {
  const sign = min >= 0 ? '+' : '-'
  const a = Math.abs(min)
  return `UTC${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`
}

/** A "day band" bar: how far through the local day each zone is. */
function daylight(hour: number) {
  // Crude but legible: 06–18 is day, 18–06 is night, with dawn/dusk quarters.
  if (hour >= 6 && hour < 18) return { icon: Sun, label: 'DAY', tone: 'text-amber' }
  if (hour >= 18 && hour < 21) return { icon: Moon, label: 'DUSK', tone: 'text-[var(--color-violet)]' }
  if (hour >= 4 && hour < 6) return { icon: Sun, label: 'DAWN', tone: 'text-[var(--color-cyan)]' }
  return { icon: Moon, label: 'NIGHT', tone: 'text-[var(--color-blue)]' }
}

export function WorldClockPanel({ compact = false, className }: { compact?: boolean; className?: string }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const rows = useMemo(
    () => ZONES.map((z) => ({ ...z, t: zoneTime(now, z.zone), off: zoneOffsetMinutes(now, z.zone) })),
    [now],
  )

  return (
    <Panel
      title="World Clock"
      icon={Globe2}
      subtitle={compact ? 'Operational timezones' : 'Eight operational stations · live local time'}
      badge={<span className="mono text-[8.5px] text-ink-3">{fmtOffset(0)}</span>}
      bodyClassName="p-0"
      className={className}
      scroll
    >
      <ul className="divide-y divide-line-soft">
        {rows.map((r, i) => {
          const light = daylight(r.t.hour)
          const DayIcon = light.icon
          const pct = ((r.t.hour * 3600 + Number(r.t.mm) * 60 + Number(r.t.ss)) / 86400) * 100
          return (
            <li
              key={r.code}
              className="anim-ticker flex items-center gap-2 px-2.5 py-1.5"
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <span className="mono w-8 shrink-0 text-[8px] text-ink-3">{r.code}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[10.5px] text-ink">{r.city}</span>
                {!compact && <span className="block truncate font-mono text-[7.5px] uppercase tracking-wider text-ink-3">{r.station}</span>}
              </span>
              <span className={cn('flex shrink-0 items-center gap-0.5 font-mono text-[7.5px]', light.tone)}>
                <DayIcon size={8} />
                {light.label}
              </span>
              <span className="mono w-16 shrink-0 text-right text-[10.5px] tabular text-ink">
                {r.t.hh}:{r.t.mm}
                <span className="text-[8px] text-ink-3">:{r.t.ss}</span>
              </span>
              <span className="mono hidden w-14 shrink-0 text-right text-[8px] text-ink-3 sm:block">{fmtOffset(r.off)}</span>
              <span className="relative hidden h-1 w-10 shrink-0 overflow-hidden rounded-full bg-bg-2 sm:block" title={`${Math.round(pct)}% through the local day`}>
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${pct}%`, background: r.t.hour >= 6 && r.t.hour < 18 ? 'var(--color-amber)' : 'var(--color-blue)' }}
                />
              </span>
            </li>
          )
        })}
      </ul>
      <div className="flex items-center justify-between border-t border-line-soft px-2.5 py-1.5">
        <span className="flex items-center gap-1 font-mono text-[8px] text-ink-3">
          <Clock size={8} /> LOCAL DEVICE TIME
        </span>
        <Tag>{now.toLocaleTimeString('en-GB', { hour12: false })}</Tag>
      </div>
    </Panel>
  )
}
