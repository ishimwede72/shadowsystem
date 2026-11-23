import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ChevronRight, Copy, Download, Expand, History, Maximize2, Minimize2, Plus,
  RefreshCw, Terminal as TerminalIcon, Trash2, Type, X, Columns2, Settings2,
} from 'lucide-react'
import { Panel, PageHeader, Screen, InlineAlert, Select, Slider, StatusPill } from '@/components/ui'
import { useEngine, selectOperator } from '@/services/engine'
import { usePrefs } from '@/services/prefs'
import { audio } from '@/services/audio'
import { COMMANDS, bannerLines, runCommand, type TerminalLine } from '@/services/terminal'
import { cn, downloadFile, fmtTime } from '@/lib/utils'

const THEMES = {
  green: { text: '#79f0b9', dim: '#4b7f68', bg: '#05090c', border: '#1c2a36', error: '#ff9aa6', warn: '#ffd489', success: '#79f0b9' },
  amber: { text: '#ffd489', dim: '#7d6a3f', bg: '#0a0805', border: '#2a2418', error: '#ff9aa6', warn: '#f5b942', success: '#ffd489' },
  cyan: { text: '#7ff0fb', dim: '#3f7079', bg: '#04080c', border: '#132a32', error: '#ff9aa6', warn: '#ffd489', success: '#7ff0fb' },
  white: { text: '#e9f0f6', dim: '#65788b', bg: '#06090d', border: '#1c2a36', error: '#ff9aa6', warn: '#ffd489', success: '#38db91' },
} as const

interface Session {
  id: string
  name: string
  lines: TerminalLine[]
  history: string[]
}

export default function TerminalPage() {
  const s = useEngine()
  const operator = useEngine(selectOperator)
  const terminalTheme = usePrefs((p) => p.terminalTheme)
  const terminalFontSize = usePrefs((p) => p.terminalFontSize)
  const setPref = usePrefs((p) => p.set)
  const soundEnabled = usePrefs((p) => p.soundEnabled)

  const sessionCounter = useRef(1)
  const mkSession = useCallback((n: number): Session => ({
    id: `TTY-${n}`,
    name: `session ${n}`,
    lines: bannerLines(`${s.sessionId}-${n}`),
    history: [],
  }), [s.sessionId])

  const [sessions, setSessions] = useState<Session[]>([mkSession(1)])
  const [activeId, setActiveId] = useState('TTY-1')
  const [input, setInput] = useState('')
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [fontSize, setFontSize] = useState(terminalFontSize)
  const [theme, setTheme] = useState<keyof typeof THEMES>(terminalTheme)
  const [split, setSplit] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [showHelp, setShowHelp] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const active = sessions.find((x) => x.id === activeId) ?? sessions[0]
  const themeStyles = THEMES[theme] ?? THEMES.green

  const ctx = useMemo(
    () => ({
      operator: operator.callsign,
      missionCode: s.missions.find((m) => m.status === 'active')?.code,
      missionName: s.missions.find((m) => m.status === 'active')?.name,
      nodes: s.networkNodes.length,
      onlineNodes: s.networkNodes.filter((n) => n.status !== 'offline').length,
      cameras: s.cameras.length,
      onlineCameras: s.cameras.filter((c) => c.status === 'online').length,
      targets: s.targets.length,
      txCount: s.transactions.length,
      pendingTx: s.transactions.filter((t) => t.status === 'pending').length,
      findings: s.findings.length,
      criticalFindings: s.findings.filter((f) => f.severity === 'critical').length,
      walletNotional: s.wallets.reduce((a, w) => a + w.balanceUsd, 0),
      sessionId: s.sessionId,
      uptimeSeconds: s.tick * 0.016,
    }),
    [s, operator],
  )

  const updateSession = (id: string, fn: (sess: Session) => Session) =>
    setSessions((prev) => prev.map((x) => (x.id === id ? fn(x) : x)))

  const submit = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    const output = runCommand(trimmed, ctx)
    updateSession(activeId, (sess) => {
      if (output.some((o) => o.text === '__CLEAR__')) return { ...sess, lines: [], history: [...sess.history, trimmed] }
      if (output.some((o) => o.text === '__RESET__')) return { ...sess, lines: bannerLines(s.sessionId), history: [...sess.history, trimmed] }
      return {
        ...sess,
        lines: [...sess.lines, { id: `in-${Date.now()}`, kind: 'input', text: trimmed, ts: Date.now() }, ...output],
        history: [...sess.history, trimmed],
      }
    })
    setInput('')
    setHistoryIdx(-1)
    if (soundEnabled) audio.play('keystroke')
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const hist = active.history
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const idx = historyIdx < 0 ? hist.length - 1 : Math.max(0, historyIdx - 1)
      setHistoryIdx(idx)
      setInput(hist[idx] ?? '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const idx = Math.min(hist.length - 1, historyIdx + 1)
      setHistoryIdx(idx)
      setInput(hist[idx] ?? '')
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const match = COMMANDS.find((c) => c.name.startsWith(input.split(' ')[0]) && input.trim())
      if (match) setInput(match.name + ' ')
    } else if (e.key === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      updateSession(activeId, (sess) => ({ ...sess, lines: [] }))
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [active.lines.length])

  useEffect(() => {
    setPref('terminalTheme', theme)
  }, [theme, setPref])

  useEffect(() => {
    setPref('terminalFontSize', fontSize)
  }, [fontSize, setPref])

  const addSession = () => {
    sessionCounter.current += 1
    const sess = mkSession(sessionCounter.current)
    setSessions((p) => [...p, sess])
    setActiveId(sess.id)
  }

  const closeSession = (id: string) => {
    if (sessions.length === 1) return
    const next = sessions.filter((x) => x.id !== id)
    setSessions(next)
    if (activeId === id) setActiveId(next[0].id)
  }

  const copyBuffer = () => {
    const text = active.lines.map((l) => (l.kind === 'input' ? `$ ${l.text}` : l.text)).join('\n')
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  const exportBuffer = () => {
    const text = active.lines.map((l) => `[${l.ts ? fmtTime(l.ts) : '--:--:--'}] ${l.kind === 'input' ? '$ ' : ''}${l.text}`).join('\n')
    downloadFile(`shadow-terminal-${active.id}-${Date.now()}.log`, text)
  }

  const renderLine = (l: TerminalLine) => {
    if (l.kind === 'input') {
      return (
        <div key={l.id} className="flex gap-1.5">
          <span style={{ color: themeStyles.dim }}>operator@shadow:~$</span>
          <span style={{ color: themeStyles.text }}>{l.text}</span>
        </div>
      )
    }
    const color =
      l.kind === 'error' ? themeStyles.error
        : l.kind === 'warn' ? themeStyles.warn
        : l.kind === 'success' ? themeStyles.success
        : l.kind === 'dim' ? themeStyles.dim
        : themeStyles.text
    return (
      <div key={l.id} style={{ color }} className="whitespace-pre-wrap break-words">
        {l.text}
      </div>
    )
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="CYBER OPERATIONS · SANDBOX SHELL"
        title="Hacker Terminal Workspace"
        subtitle="Multiple scripted sessions, command history, themes and export. The interpreter is fully contained — it cannot reach an OS or a network."
        icon={TerminalIcon}
        meta={
          <>
            <span className="badge badge-green">SCRIPTED INTERPRETER</span>
            <span className="badge badge-grey">{COMMANDS.length} SANDBOX COMMANDS</span>
            <span className="badge badge-amber">NO OS / NETWORK ACCESS</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={addSession}><Plus size={11} /> New session</button>
            <button type="button" className={cn('btn btn-sm', split && 'btn-primary')} onClick={() => setSplit((v) => !v)}><Columns2 size={11} /> Split</button>
            <button type="button" className="btn btn-sm" onClick={() => setFullscreen((v) => !v)}>
              {fullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />} {fullscreen ? 'Restore' : 'Fullscreen'}
            </button>
          </>
        }
      />

      <div className={cn('grid gap-3', fullscreen ? 'grid-cols-1' : 'xl:grid-cols-[1fr_300px]')}>
        <div className="space-y-3">
          <div className={cn('terminal-window scanlines relative', fullscreen ? 'fixed inset-0 z-[85] m-0 flex flex-col' : '')} style={{ borderColor: themeStyles.border, background: themeStyles.bg }}>
            {/* tab bar */}
            <div className="flex items-center gap-1 border-b px-1.5 py-1" style={{ borderColor: themeStyles.border }}>
              <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                {sessions.map((sess) => (
                  <span
                    key={sess.id}
                    className={cn('group flex shrink-0 items-center gap-1 border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider',
                      sess.id === activeId ? 'border-[#2a4152] bg-[#0d1821]' : 'border-transparent',
                    )}
                    style={{ color: sess.id === activeId ? themeStyles.text : themeStyles.dim }}
                  >
                    <button type="button" onClick={() => setActiveId(sess.id)} className="flex items-center gap-1">
                      <TerminalIcon size={9} /> {sess.id}
                    </button>
                    {sessions.length > 1 && (
                      <button type="button" onClick={() => closeSession(sess.id)} aria-label={`Close ${sess.id}`} className="opacity-40 hover:opacity-100">
                        <X size={8} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button type="button" className="icon-btn !h-5 !w-5" onClick={copyBuffer} title="Copy buffer"><Copy size={9} /></button>
                <button type="button" className="icon-btn !h-5 !w-5" onClick={exportBuffer} title="Export log"><Download size={9} /></button>
                <button type="button" className="icon-btn !h-5 !w-5" onClick={() => updateSession(activeId, (sess) => ({ ...sess, lines: [] }))} title="Clear"><Trash2 size={9} /></button>
                <button type="button" className="icon-btn !h-5 !w-5" onClick={() => updateSession(activeId, (sess) => ({ ...sess, lines: bannerLines(s.sessionId), history: [] }))} title="Reset session"><RefreshCw size={9} /></button>
                {fullscreen && <button type="button" className="icon-btn !h-5 !w-5" onClick={() => setFullscreen(false)} title="Exit fullscreen"><X size={9} /></button>}
              </div>
            </div>

            <div className={cn('flex min-h-0 gap-0', fullscreen ? 'flex-1' : 'h-[420px]')} onClick={() => inputRef.current?.focus()}>
              <div
                ref={scrollRef}
                className="min-w-0 flex-1 overflow-y-auto p-3 font-terminal leading-[1.45]"
                style={{ fontSize: `${fontSize}px` }}
              >
                {active.lines.map(renderLine)}
                <div className="mt-0.5 flex items-center gap-1.5">
                  <ChevronRight size={11} style={{ color: themeStyles.success }} />
                  <span className="font-terminal" style={{ color: themeStyles.dim, fontSize: `${fontSize}px` }}>operator@shadow:~$</span>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    className="min-w-0 flex-1 bg-transparent font-terminal outline-none"
                    style={{ color: themeStyles.text, fontSize: `${fontSize}px`, caretColor: themeStyles.success }}
                    aria-label="Terminal input"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="type help"
                  />
                </div>
              </div>

              {split && !fullscreen && (
                <div className="hidden w-1/2 shrink-0 overflow-y-auto border-l p-3 font-terminal" style={{ borderColor: themeStyles.border, fontSize: `${fontSize - 1}px`, color: themeStyles.dim }}>
                  <p className="mb-1 uppercase tracking-widest" style={{ color: themeStyles.success }}>// mirrored output · {active.id}</p>
                  {active.lines.slice(-24).map((l) => (
                    <div key={`mirror-${l.id}`} className="whitespace-pre-wrap break-words opacity-70">
                      {l.kind === 'input' ? `$ ${l.text}` : l.text}
                    </div>
                  ))}
                  <p className="mt-2 animate-pulse">▌</p>
                </div>
              )}
            </div>

            {/* status bar */}
            <div className="flex items-center justify-between border-t px-2 py-0.5" style={{ borderColor: themeStyles.border }}>
              <span className="font-terminal text-[8.5px] uppercase tracking-widest" style={{ color: themeStyles.dim }}>
                {active.id} · {active.lines.length} lines · {active.history.length} commands
              </span>
              <span className="flex items-center gap-2 font-terminal text-[8.5px] uppercase tracking-widest" style={{ color: themeStyles.dim }}>
                <span>containment verified</span>
                <span style={{ color: themeStyles.success }}>● ready</span>
              </span>
            </div>
          </div>

          {!fullscreen && showHelp && (
            <Panel title="Command Reference" icon={TerminalIcon} actions={<button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowHelp(false)}>Hide</button>} bodyClassName="p-0">
              <div className="max-h-[220px] overflow-y-auto">
                <table className="data-table">
                  <thead><tr><th>Command</th><th>Usage</th><th>Description</th></tr></thead>
                  <tbody>
                    {COMMANDS.map((c) => (
                      <tr key={c.name} className="cursor-pointer" onClick={() => { setInput(c.name + (c.args ? ' ' : '')); inputRef.current?.focus() }}>
                        <td className="mono text-[10px] text-[var(--accent)]">{c.name}</td>
                        <td className="mono text-[9.5px] text-ink-3">{c.usage}</td>
                        <td className="text-[10.5px]">{c.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </div>

        {!fullscreen && (
          <div className="space-y-3">
            <Panel title="Terminal Settings" icon={Settings2}>
              <div className="space-y-3">
                <Select label="Theme" value={theme} onChange={(v) => setTheme(v as keyof typeof THEMES)} options={Object.keys(THEMES).map((t) => ({ value: t, label: t.toUpperCase() }))} />
                <Slider label="Font size" min={9} max={20} step={0.5} value={fontSize} onChange={setFontSize} suffix="px" />
                <div>
                  <p className="label-xs mb-1">Quick actions</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button type="button" className="btn btn-sm" onClick={() => { setInput('status'); inputRef.current?.focus() }}>status</button>
                    <button type="button" className="btn btn-sm" onClick={() => { setInput('scan-demo'); inputRef.current?.focus() }}>scan-demo</button>
                    <button type="button" className="btn btn-sm" onClick={() => { setInput('network-demo'); inputRef.current?.focus() }}>network</button>
                    <button type="button" className="btn btn-sm" onClick={() => { setInput('firewall-demo'); inputRef.current?.focus() }}>firewall</button>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel title="Session History" icon={History} bodyClassName="p-0">
              <ul className="max-h-[200px] divide-y divide-line-soft overflow-y-auto font-terminal text-[10px]">
                {[...active.history].reverse().map((h, i) => (
                  <li key={`${h}-${i}`} className="flex items-center gap-1.5 px-2 py-1 hover:bg-elevated">
                    <span className="text-ink-3">{String(active.history.length - i).padStart(2, '0')}</span>
                    <button type="button" className="min-w-0 flex-1 truncate text-left text-ink-2" onClick={() => { setInput(h); inputRef.current?.focus() }}>
                      {h}
                    </button>
                  </li>
                ))}
                {active.history.length === 0 && <li className="p-2 text-ink-3">No commands issued yet.</li>}
              </ul>
            </Panel>

            <Panel title="Containment" icon={Expand}>
              <ul className="space-y-1.5">
                {[
                  ['OS execution', 'disabled'],
                  ['Filesystem', 'unmounted'],
                  ['Network sockets', 'unavailable'],
                  ['Credential capture', 'none'],
                ].map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between">
                    <span className="text-[10.5px] text-ink-2">{k}</span>
                    <StatusPill value="inactive" label={v.toUpperCase()} dot={false} />
                  </li>
                ))}
              </ul>
              <p className="mt-2 font-mono text-[8.5px] leading-relaxed text-ink-3">
                Every command renders scripted text. Attempting an unknown command produces a standard shell error.
              </p>
            </Panel>

            <Panel title="Shortcuts" icon={Type}>
              <ul className="space-y-1 font-mono text-[9.5px] text-ink-3">
                <li className="flex justify-between"><span>Autocomplete</span><span className="text-ink-2">Tab</span></li>
                <li className="flex justify-between"><span>History</span><span className="text-ink-2">↑ / ↓</span></li>
                <li className="flex justify-between"><span>Clear buffer</span><span className="text-ink-2">Ctrl+L</span></li>
                <li className="flex justify-between"><span>Run command</span><span className="text-ink-2">Enter</span></li>
              </ul>
            </Panel>
          </div>
        )}
      </div>

      <InlineAlert tone="amber" title="Sandboxed interpreter">
        This terminal is a scripted movie-prop shell. It cannot execute system commands, read files, scan networks or
        collect credentials — all output is generated from local simulation state.
      </InlineAlert>
    </Screen>
  )
}
