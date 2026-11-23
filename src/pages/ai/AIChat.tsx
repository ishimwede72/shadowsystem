import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Send, Trash2, Download, Bot, User, ArrowUpRight, Cpu, ShieldCheck,
  Copy, Check, RefreshCw, MessageSquare, Braces,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatCard, StatusPill, Select, InlineAlert, Divider, Tag, EmptyState, Toggle, Modal } from '@/components/ui'
import { Doc } from '@/components/ui/extras'
import { answer, greeting, SUGGESTIONS, type AiMessage } from '@/services/ai'
import { useEngine } from '@/services/engine'
import { useReports, REPORT_TYPES } from '@/services/reports'
import { downloadFile, pad } from '@/lib/utils'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'shadow-ai-history'

export default function AIChat() {
  const navigate = useNavigate()
  const s = useEngine()
  const addReport = useReports((r) => r.add)
  const [messages, setMessages] = useState<AiMessage[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as AiMessage[]
        if (Array.isArray(parsed) && parsed.length) return parsed
      }
    } catch { /* ignore */ }
    return [greeting()]
  })
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const [autoSave, setAutoSave] = useState(true)
  const [tone, setTone] = useState('analyst')
  const [copied, setCopied] = useState<string | null>(null)
  const [saveAsReport, setSaveAsReport] = useState<AiMessage | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (autoSave) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40))) } catch { /* quota */ }
    }
  }, [messages, autoSave])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages.length, thinking])

  const send = (text?: string) => {
    const prompt = (text ?? draft).trim()
    if (!prompt) return
    const user: AiMessage = { id: `u-${Date.now()}`, role: 'user', content: prompt, ts: new Date().toISOString() }
    setMessages((m) => [...m, user])
    setDraft('')
    setThinking(true)
    window.setTimeout(() => {
      const a = answer(prompt)
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: 'ai', content: a.content, ts: new Date().toISOString(), kind: a.kind, refs: a.refs }])
      setThinking(false)
    }, 420 + Math.min(700, prompt.length * 8))
  }

  const clear = () => { setMessages([greeting()]); try { localStorage.removeItem(STORAGE_KEY) } catch { /* noop */ } }

  const copy = async (id: string, t: string) => { try { await navigator.clipboard.writeText(t); setCopied(id); window.setTimeout(() => setCopied(null), 1400) } catch { /* noop */ } }

  const exportChat = () => downloadFile('shadow-ai-transcript.txt', messages.map((m) => `[${new Date(m.ts).toISOString()}] ${m.role.toUpperCase()}\n${m.content}\n`).join('\n' + '-'.repeat(64) + '\n\n') + '\nSHADOW AI — local rule engine. All content fictional.\n', 'text/plain')

  const promoteToReport = (m: AiMessage) => {
    addReport({
      title: `SHADOW AI Brief — ${new Date(m.ts).toISOString().slice(0, 10)}`,
      type: 'intelligence',
      department: 'SHADOW AI',
      generated: new Date().toISOString(),
      author: s.operators.find((o) => o.id === s.currentOperatorId)?.callsign ?? 'OPERATOR',
      summary: m.content.split('\n').filter(Boolean).slice(0, 3).join(' '),
      analysis: m.content.split('\n').filter((l) => l.trim().startsWith('•') || /^\d\./.test(l.trim())).slice(0, 6),
      metrics: [
        { label: 'Accounts', value: String(s.accounts.length) },
        { label: 'Findings', value: String(s.findings.length) },
        { label: 'Cases', value: String(s.cases.length) },
      ],
      classification: 'FICTIONAL · DEMO',
    })
    setSaveAsReport(null)
    s.notify({ type: 'success', title: 'Saved as report', body: 'Available in Reports and AI Reports', severity: 'low', module: 'ai', href: '/reports' })
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="SHADOW AI · ASSISTANT"
        title="SHADOW AI"
        subtitle="A deterministic rule engine that reads the live simulation store. No remote model, no network, no secrets."
        icon={Sparkles}
        meta={
          <>
            <span className="badge badge-cyan">LOCAL RULES</span>
            <span className="badge badge-green">STORE-GROUNDED</span>
            <span className="badge badge-grey">{messages.length} MESSAGES</span>
            <span className="badge badge-amber">FICTIONAL</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={exportChat}><Download size={11} /> Export</button>
            <button type="button" className="btn btn-sm" onClick={clear}><Trash2 size={11} /> Clear</button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Engine" value="Rule-based" icon={Cpu} accent="cyan" />
        <StatCard label="Knowledge" value="Live store" icon={Braces} accent="blue" />
        <StatCard label="Messages" value={messages.length} icon={MessageSquare} accent="green" />
        <StatCard label="Reports filed" value={useReports.getState().reports.length} icon={ShieldCheck} accent="amber" onClick={() => navigate('/ai/reports')} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_300px]">
        <Panel
          title="Conversation"
          icon={Bot}
          subtitle="Answers are computed from the same store that drives every page"
          bodyClassName="p-0"
          actions={<StatusPill value="active" label="SHADOW AI ONLINE" />}
        >
          <div className="flex h-[58vh] flex-col">
            <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
              {messages.map((m) => (
                <div key={m.id} className={cn('flex gap-2', m.role === 'user' ? 'flex-row-reverse' : '')}>
                  <span className={cn('grid h-6 w-6 shrink-0 place-items-center border', m.role === 'user' ? 'border-[#1a6472] bg-[#0c2830] text-[#7ff0fb]' : 'border-line bg-elevated text-[var(--accent)]')}>
                    {m.role === 'user' ? <User size={11} /> : <Bot size={11} />}
                  </span>
                  <div className={cn('max-w-[84%] border px-2.5 py-2', m.role === 'user' ? 'border-[#1a6472] bg-[#0c2830]' : 'border-line bg-panel')}>
                    <div className="flex items-center gap-2">
                      <span className={cn('mono text-[8px] uppercase tracking-widest', m.role === 'user' ? 'text-[#7ff0fb]' : 'text-ink-3')}>
                        {m.role === 'user' ? s.operators.find((o) => o.id === s.currentOperatorId)?.callsign ?? 'OPERATOR' : 'SHADOW AI'}
                      </span>
                      <span className="mono text-[7.5px] text-ink-3">{new Date(m.ts).toISOString().slice(11, 19)}Z</span>
                      {m.kind === 'report' && <span className="badge badge-amber">DRAFT</span>}
                      {m.kind === 'error' && <span className="badge badge-grey">NO MATCH</span>}
                      <button type="button" className="ml-auto text-ink-3 hover:text-ink" onClick={() => copy(m.id, m.content)} title="Copy">
                        {copied === m.id ? <Check size={9} className="text-green" /> : <Copy size={9} />}
                      </button>
                    </div>
                    <pre className={cn('mt-1 whitespace-pre-wrap break-words font-terminal text-[10.5px] leading-relaxed', m.role === 'user' ? 'text-[#c9f6ff]' : 'text-ink-2')}>{m.content}</pre>
                    {m.refs && m.refs.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {m.refs.map((r) => (
                          <button key={r.path} type="button" className="btn btn-sm !px-1.5 !py-0" onClick={() => navigate(r.path)}><ArrowUpRight size={8} /> {r.label}</button>
                        ))}
                      </div>
                    )}
                    {m.role === 'ai' && m.kind !== 'text' && (
                      <button type="button" className="mt-1 font-mono text-[8px] uppercase tracking-wider text-ink-3 hover:text-[var(--accent)]" onClick={() => setSaveAsReport(m)}>
                        + save as report
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex items-center gap-2 pl-8">
                  <span className="flex gap-0.5">
                    <span className="h-1.5 w-1.5 animate-bounce bg-[var(--accent)]" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce bg-[var(--accent)]" style={{ animationDelay: '120ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce bg-[var(--accent)]" style={{ animationDelay: '240ms' }} />
                  </span>
                  <span className="mono text-[9px] text-ink-3">matching rules against the simulation store…</span>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="border-t border-line p-2">
              <div className="flex items-end gap-1.5">
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  rows={1}
                  placeholder="Ask about finance, cyber, network, missions, risk… (Enter to send)"
                  className="field min-h-[38px] flex-1 resize-none font-terminal text-[10.5px]"
                />
                <button type="button" className="btn btn-primary h-8 !px-2.5" title="Send message" aria-label="Send message" onClick={() => send()} disabled={!draft.trim() || thinking}><Send size={11} /></button>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="mono text-[7.5px] text-ink-3">Shift+Enter for newline · answers computed locally from app data</span>
                <span className="mono text-[7.5px] text-ink-3">{draft.length} chars</span>
              </div>
            </div>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel title="Suggested Prompts" icon={Sparkles} bodyClassName="p-0">
            <div className="max-h-[300px] divide-y divide-line-soft overflow-y-auto">
              {SUGGESTIONS.map((sg) => (
                <button key={sg.id} type="button" onClick={() => send(sg.prompt)} className="w-full px-2.5 py-1.5 text-left hover:bg-elevated">
                  <span className="mono block text-[7.5px] uppercase tracking-widest text-ink-3">{sg.group}</span>
                  <span className="block text-[10px] text-ink-2">{sg.label}</span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Behaviour" icon={Cpu}>
            <Select label="Persona" value={tone} onChange={setTone} options={[{ value: 'analyst', label: 'Analyst (concise)' }, { value: 'brief', label: 'Brief (bullets)' }, { value: 'verbose', label: 'Verbose' }]} />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-ink-2">Persist transcript</span>
              <Toggle checked={autoSave} onChange={setAutoSave} label="" />
            </div>
            <Divider />
            <KeyValueLite />
          </Panel>

          <Panel title="Transcript Status" icon={ShieldCheck}>
            <ul className="space-y-1 text-[10px] leading-relaxed text-ink-2">
              <li>• Kept in {autoSave ? 'localStorage' : 'memory only'}.</li>
              <li>• Clear removes the stored transcript.</li>
              <li>• Export writes a plain-text file locally.</li>
              <li>• No message leaves the browser.</li>
            </ul>
          </Panel>
        </div>
      </div>

      {messages.length <= 1 && (
        <Panel title="Welcome">
          <EmptyState icon={Sparkles} title="Ask SHADOW AI anything about the simulation" message="Use a suggested prompt or type your own question. Answers are grounded in the current store." />
        </Panel>
      )}

      <InlineAlert tone="cyan" title="Rule engine, not a language model">
        SHADOW AI matches your question against a fixed rule set and formats a response from live app data. It cannot browse,
        remember outside this tab, or contact anything.
      </InlineAlert>

      <Panel title="Raw view" icon={Braces}>
        <Doc label="LAST ANSWER">{messages.filter((m) => m.role === 'ai').slice(-1)[0]?.content ?? 'No answer yet.'}</Doc>
      </Panel>

      <PromptModal message={saveAsReport} onClose={() => setSaveAsReport(null)} onConfirm={promoteToReport} />
    </Screen>
  )
}

function KeyValueLite() {
  const s = useEngine()
  return (
    <ul className="space-y-0.5 font-mono text-[8.5px] text-ink-3">
      <li>store.accounts = {s.accounts.length}</li>
      <li>store.findings = {s.findings.length}</li>
      <li>store.missions = {s.missions.length}</li>
      <li>store.cameras = {s.cameras.length}</li>
      <li>tick = {pad(s.tick)}</li>
    </ul>
  )
}

function PromptModal({ message, onClose, onConfirm }: { message: AiMessage | null; onClose: () => void; onConfirm: (m: AiMessage) => void }) {
  return (
    <Modal
      open={!!message}
      onClose={onClose}
      title="Save Answer as Report"
      subtitle="Creates a fictional intelligence report from this response"
      icon={RefreshCw}
      footer={<>
        <button type="button" className="btn" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={() => message && onConfirm(message)}><Check size={11} /> Create report</button>
      </>}
    >
      <div className="space-y-2">
        <p className="text-[10.5px] leading-relaxed text-ink-2">
          The answer will be summarised into a report and added to the Reports module and the SHADOW AI report index. All
          content remains flagged as fictional.
        </p>
        <div className="flex flex-wrap gap-1">{REPORT_TYPES.map((t) => <Tag key={t.id}>{t.label}</Tag>)}</div>
        <div className="terminal-window max-h-[160px] overflow-auto p-2">
          <pre className="whitespace-pre-wrap font-terminal text-[9px] leading-relaxed text-ink-2">{message?.content}</pre>
        </div>
      </div>
    </Modal>
  )
}
