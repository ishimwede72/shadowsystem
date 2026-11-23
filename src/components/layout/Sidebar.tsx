import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronsLeft, ChevronsRight, LogOut, ShieldCheck, Star } from 'lucide-react'
import { NAV_GROUPS } from '@/config/nav'
import { cn } from '@/lib/utils'
import { Wordmark, ShadowMark } from '@/components/brand/Logo'
import { useEngine, selectOperator, unreadCount } from '@/services/engine'
import { usePrefs } from '@/services/prefs'
import { Avatar } from '@/components/ui'

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  onNavigate,
  mobile,
}: {
  collapsed: boolean
  onToggleCollapsed: () => void
  onNavigate?: () => void
  mobile?: boolean
}) {
  const location = useLocation()
  const operator = useEngine(selectOperator)
  const unread = useEngine(unreadCount)
  const emergency = useEngine((s) => s.emergency)
  const favorites = usePrefs((s) => s.favoriteModules)
  const toggleFavorite = usePrefs((s) => s.toggleFavorite)

  const activeGroupId = useMemo(() => {
    return NAV_GROUPS.find((g) => location.pathname === g.to || location.pathname.startsWith(g.to + '/'))?.id
  }, [location.pathname])

  const [openGroups, setOpenGroups] = useState<string[]>(activeGroupId ? [activeGroupId] : [])
  useEffect(() => {
    if (activeGroupId && !openGroups.includes(activeGroupId)) setOpenGroups((p) => [...p, activeGroupId])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupId])

  const isCollapsed = collapsed && !mobile

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-line bg-bg-2 transition-[width] duration-200',
        isCollapsed ? 'w-[64px]' : 'w-[264px]',
        mobile && 'w-[280px]',
      )}
    >
      {/* brand */}
      <div className={cn('flex h-[52px] shrink-0 items-center border-b border-line px-3', isCollapsed ? 'justify-center' : 'justify-between')}>
        {isCollapsed ? <ShadowMark size={26} /> : <Wordmark size="sm" />}
        {!mobile && !isCollapsed && (
          <button type="button" className="icon-btn" onClick={onToggleCollapsed} aria-label="Collapse sidebar" title="Collapse sidebar">
            <ChevronsLeft size={14} />
          </button>
        )}
      </div>

      {/* emergency strip */}
      {emergency && !isCollapsed && (
        <div className="flex items-center gap-2 border-b border-[#6e2633] bg-[#2a1016] px-3 py-1.5">
          <span className="dot animate-[pulse-dot_1.2s_ease-in-out_infinite] bg-red" />
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#ff9aa6]">Emergency mode active</span>
        </div>
      )}

      {/* nav */}
      <nav className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {!isCollapsed && (
          <p className="label-xs mb-2 px-2 pt-1">Operations Modules</p>
        )}
        <ul className="space-y-0.5">
          {NAV_GROUPS.map((g) => {
            const active = activeGroupId === g.id
            const open = openGroups.includes(g.id)
            const Icon = g.icon
            if (isCollapsed) {
              return (
                <li key={g.id}>
                  <NavLink
                    to={g.to}
                    className={cn('nav-item justify-center px-0')}
                    data-active={active}
                    title={g.label}
                    onClick={onNavigate}
                  >
                    <Icon size={16} style={{ color: active ? g.accent : undefined }} />
                  </NavLink>
                </li>
              )
            }
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => setOpenGroups((p) => (p.includes(g.id) ? p.filter((x) => x !== g.id) : [...p, g.id]))}
                  className="nav-item w-full justify-between"
                  data-active={active}
                  aria-expanded={open}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon size={15} style={{ color: active ? g.accent : undefined }} className="shrink-0" />
                    <span className="truncate">{g.label}</span>
                  </span>
                  <ChevronDown size={11} className={cn('shrink-0 text-ink-3 transition-transform', open && 'rotate-180')} />
                </button>
                {open && (
                  <ul className="ml-[18px] mt-0.5 space-y-0.5 border-l border-line-soft pl-2">
                    {g.children.map((c) => (
                      <li key={c.to}>
                        <NavLink
                          to={c.to}
                          end={c.to === g.to}
                          onClick={onNavigate}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center justify-between gap-2 rounded-sm px-2 py-[5px] text-[11.5px] transition-colors',
                              isActive ? 'bg-[var(--accent-soft)] text-ink' : 'text-ink-3 hover:bg-elevated hover:text-ink-2',
                            )
                          }
                        >
                          <span className="truncate">{c.label}</span>
                          {c.badge && <span className="badge badge-green !px-1 !py-0 !text-[7.5px]">{c.badge}</span>}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>

        {!isCollapsed && favorites.length > 0 && (
          <>
            <p className="label-xs mb-1 mt-4 flex items-center gap-1 px-2"><Star size={8} /> Favorites</p>
            <ul className="space-y-0.5">
              {NAV_GROUPS.filter((g) => favorites.includes(g.id)).map((g) => (
                <li key={g.id}>
                  <NavLink to={g.to} onClick={onNavigate} className="nav-item" data-active={activeGroupId === g.id}>
                    <g.icon size={14} />
                    <span className="truncate">{g.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* footer / operator */}
      <div className="shrink-0 border-t border-line p-2">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <button type="button" className="icon-btn" onClick={onToggleCollapsed} aria-label="Expand sidebar">
              <ChevronsRight size={14} />
            </button>
            <Avatar seed={operator.displayName} size={26} status={operator.status} />
          </div>
        ) : (
          <div className="flex items-center gap-2 border border-line-soft bg-panel p-2">
            <Avatar seed={operator.displayName} size={30} status={operator.status} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[10px] uppercase tracking-wider text-ink">{operator.callsign}</p>
              <p className="truncate text-[10px] text-ink-3">{operator.clearance} · {operator.unit.split(' / ')[0]}</p>
            </div>
            <NavLink to="/access" className="icon-btn" title="End session" aria-label="End session">
              <LogOut size={13} />
            </NavLink>
          </div>
        )}
        {!isCollapsed && (
          <div className="mt-2 flex items-center justify-between px-1">
            <span className="flex items-center gap-1 font-mono text-[8.5px] uppercase tracking-widest text-ink-3">
              <ShieldCheck size={9} className="text-green" /> Sim secure
            </span>
            <span className="font-mono text-[8.5px] tracking-widest text-ink-3">v4.2.0</span>
          </div>
        )}
        {!isCollapsed && (
          <div className="mt-2 flex items-center justify-between rounded-sm border border-line-soft px-2 py-1">
            <span className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => toggleFavorite(NAV_GROUPS[0].id)}
                className="text-ink-3 hover:text-amber"
                aria-label="Toggle command center favorite"
              >
                <Star size={10} />
              </button>
              <span className="font-mono text-[9px] uppercase tracking-wider text-ink-3">{unread} unread</span>
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
