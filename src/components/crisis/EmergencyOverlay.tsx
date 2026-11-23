import { useNavigate } from 'react-router-dom'
import { AlertOctagon, ArrowUpRight, X } from 'lucide-react'
import { useEngine } from '@/services/engine'
import { cn, fmtTime } from '@/lib/utils'
import { useEffect, useState } from 'react'

export function EmergencyOverlay() {
  const navigate = useNavigate()
  const exitEmergency = useEngine((s) => s.exitEmergency)
  const incidents = useEngine((s) => s.crisisIncidents)
  const infra = useEngine((s) => s.infrastructure)
  const emergencyIncidentId = useEngine((s) => s.emergencyIncidentId)
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const incident = incidents.find((c) => c.id === emergencyIncidentId) ?? incidents[0]

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-[#0a0406]/96 backdrop-blur-sm">
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0,transparent_3px,rgba(241,78,97,0.05)_4px)]" />
      <div className="relative border-b-2 border-red bg-[#1d0a0f] px-4 py-2.5">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center border border-red bg-[#2a1016]"><AlertOctagon size={17} className="animate-pulse text-red" /></span>
            <div>
              <p className="font-display text-[15px] font-bold uppercase tracking-[0.22em] text-[#ff9aa6]">EMERGENCY MODE ACTIVE</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">FICTIONAL CRISIS PRESENTATION · NO REAL INFRASTRUCTURE AFFECTED</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="mono text-[13px] tabular text-[#ff9aa6]">{fmtTime(now)}</span>
            <span className="badge badge-red">{incident?.id ?? 'CRI-000'} · {incident?.severity.toUpperCase()}</span>
            <button type="button" className="btn btn-sm btn-danger" onClick={exitEmergency}><X size={11} /> EXIT EMERGENCY MODE</button>
          </div>
        </div>
      </div>
      <div className="relative mx-auto grid w-full max-w-[1600px] flex-1 gap-3 overflow-y-auto p-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <div className="border border-[#6e2633] bg-[#150a0e] p-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#ff9aa6]">INCIDENT {incident?.id}</p>
            <h1 className="mt-1.5 font-display text-2xl font-semibold uppercase leading-tight text-ink">{incident?.title}</h1>
            <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-ink-2">{incident?.description}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['SEVERITY', incident?.severity.toUpperCase() ?? '—'],
                ['STATUS', incident?.status.toUpperCase() ?? '—'],
                ['AFFECTED', String(incident?.affected.length ?? 0) + ' systems'],
                ['REPORTED', incident ? fmtTime(incident.reported) : '—'],
              ].map(([k, v]) => (
                <div key={k} className="border border-[#6e2633]/60 bg-[#1d0a0f] px-2 py-1.5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-ink-3">{k}</p>
                  <p className="mono mt-0.5 text-[11px] text-[#ff9aa6]">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-[#6e2633] bg-[#150a0e]">
            <p className="border-b border-[#6e2633]/60 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">RESPONSE SEQUENCE</p>
            <ul className="divide-y divide-[#6e2633]/40">
              {incident?.timeline.map((t) => (
                <li key={t.label} className="flex items-center gap-3 px-3 py-1.5">
                  <span className={cn('dot', t.done ? 'bg-green' : 'bg-ink-3/40')} />
                  <span className="mono w-16 text-[9px] text-ink-3">{fmtTime(t.ts)}</span>
                  <span className={cn('flex-1 text-[11px] uppercase tracking-wider', t.done ? 'text-ink' : 'text-ink-3')}>{t.label}</span>
                  <span className={cn('mono text-[8.5px] uppercase tracking-widest', t.done ? 'text-green' : 'text-ink-3')}>{t.done ? 'COMPLETE' : 'PENDING'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-3">
          <div className="border border-[#6e2633] bg-[#150a0e] p-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">AFFECTED INFRASTRUCTURE (SIMULATED)</p>
            <ul className="mt-2 space-y-1.5">
              {infra.filter((i) => i.status !== 'nominal').slice(0, 6).map((i) => (
                <li key={i.id}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] text-ink-2">{i.name}</span>
                    <span className={cn('mono text-[9px] uppercase', i.status === 'critical' ? 'text-red' : 'text-amber')}>{i.health}%</span>
                  </div>
                  <div className="mt-0.5 h-1 w-full bg-[#2a1016]">
                    <div className="h-full" style={{ width: `${i.health}%`, background: i.status === 'critical' ? '#f14e61' : '#f5b942' }} />
                  </div>
                </li>
              ))}
              {infra.filter((i) => i.status !== 'nominal').length === 0 && <li className="text-[10.5px] text-ink-3">All simulated infrastructure nominal.</li>}
            </ul>
          </div>
          <div className="border border-[#6e2633] bg-[#150a0e] p-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">ESCALATION LOG</p>
            <ul className="mt-2 space-y-1 font-terminal text-[10px]">
              <li className="text-[#ff9aa6]">[T-00:00] EMERGENCY MODE ENGAGED</li>
              <li className="text-ink-2">[T-00:04] CRISIS COMMAND NOTIFIED</li>
              <li className="text-ink-2">[T-00:11] SIMULATED RESPONSE DISPATCHED</li>
              <li className="text-ink-2">[T-00:26] AFFECTED SYSTEMS ISOLATED (DEMO)</li>
              <li className="text-ink-3">[T-00:41] AWAITING OPERATOR REVIEW</li>
            </ul>
          </div>
          <button type="button" className="btn w-full border-[#6e2633] text-[#ff9aa6] hover:bg-[#2a1016]" onClick={() => { exitEmergency(); navigate('/crisis') }}>
            <ArrowUpRight size={11} /> Open crisis command
          </button>
        </div>
      </div>
    </div>
  )
}
