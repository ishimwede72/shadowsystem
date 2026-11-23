import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellOff, CheckCheck, Trash2, Filter, Inbox, CircleDot } from 'lucide-react'
import { useEngine, unreadCount } from '@/services/engine'
import { cn, relTime } from '@/lib/utils'
import { Drawer, EmptyState, StatusPill, Tabs, SeverityPill } from '@/components/ui'
import type { Notification } from '@/types'

const TYPE_LABEL: Record<Notification['type'], string> = {
  success: 'Success', failure: 'Failure', pending: 'Pending', incident: 'Incident',
  'mission-start': 'Mission', 'mission-complete': 'Mission', camera: 'Camera',
  node: 'Network', finance: 'Finance', emergency: 'Emergency', ai: 'AI',
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'critical', label: 'Critical' },
  { id: 'missions', label: 'Missions' },
  { id: 'finance', label: 'Finance' },
  { id: 'security', label: 'Security' },
]

export function NotificationCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const notifications = useEngine((s) => s.notifications)
  const markRead = useEngine((s) => s.markRead)
  const markAllRead = useEngine((s) => s.markAllRead)
  const clear = useEngine((s) => s.clearNotifications)
  const unread = useEngine(unreadCount)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    switch (filter) {
      case 'unread': return notifications.filter((n) => !n.read)
      case 'critical': return notifications.filter((n) => n.severity === 'critical')
      case 'missions': return notifications.filter((n) => n.type === 'mission-start' || n.type === 'mission-complete')
      case 'finance': return notifications.filter((n) => ['finance', 'success', 'pending', 'failure'].includes(n.type))
      case 'security': return notifications.filter((n) => ['incident', 'camera', 'node', 'emergency'].includes(n.type))
      default: return notifications
    }
  }, [notifications, filter])

  const openItem = (n: Notification) => {
    markRead(n.id)
    if (n.href) {
      navigate(n.href)
      onClose()
    }
  }

  return (
    <Drawer open={open} onClose={onClose} title={`Notification Center · ${unread} unread`} width="max-w-md">
      <div className="border-b border-line bg-panel px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="label-sm flex items-center gap-1"><Inbox size={10} /> Inbox</span>
          <div className="flex items-center gap-1">
            <button type="button" className="btn btn-sm btn-ghost" onClick={markAllRead} title="Mark all read">
              <CheckCheck size={11} /> Read
            </button>
            <button type="button" className="btn btn-sm btn-ghost text-red" onClick={clear} title="Clear all notifications">
              <Trash2 size={11} /> Clear
            </button>
          </div>
        </div>
        <Tabs
          className="mt-2 border-0"
          size="sm"
          tabs={FILTERS.map((f) => ({
            id: f.id,
            label: f.label,
            count: f.id === 'all' ? notifications.length : f.id === 'unread' ? unread : undefined,
          }))}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <ul className="divide-y divide-line-soft">
        {filtered.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => openItem(n)}
              className={cn(
                'flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-elevated',
                !n.read && 'bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]',
              )}
            >
              <span className="mt-0.5 shrink-0">
                {!n.read ? (
                  <CircleDot size={12} className="text-[var(--accent)]" />
                ) : (
                  <span className="block h-3 w-3" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className={cn('text-[12px] leading-snug', n.read ? 'text-ink-2' : 'text-ink')}>{n.title}</span>
                  <span className="shrink-0 font-mono text-[8.5px] uppercase tracking-wider text-ink-3">{relTime(n.ts)}</span>
                </span>
                <span className="mt-0.5 block text-[10.5px] leading-relaxed text-ink-3">{n.body}</span>
                <span className="mt-1 flex items-center gap-1.5">
                  <span className="badge badge-grey !text-[8px]">{TYPE_LABEL[n.type]}</span>
                  <SeverityPill value={n.severity} />
                </span>
              </span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li>
            <EmptyState icon={BellOff} title="No notifications in this filter" message="Generated events from the simulation engine will appear here." />
          </li>
        )}
      </ul>
      <div className="border-t border-line bg-panel p-2.5">
        <p className="flex items-center gap-1 text-[9.5px] text-ink-3">
          <Filter size={9} /> Notifications originate from the shared simulation event bus.
        </p>
        <div className="mt-1.5 flex items-center gap-1">
          <StatusPill value="active" label="NOTIFICATION ENGINE" />
          <span className="font-mono text-[8.5px] text-ink-3">15 types · live routing</span>
        </div>
      </div>
    </Drawer>
  )
}
