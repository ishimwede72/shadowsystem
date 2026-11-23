import { useMemo, useState } from 'react'
import {
  Cctv, LayoutGrid, Maximize2, Minimize2, Star, Power, RefreshCw,
  Camera as CameraIcon, Search, Play, Pause, Grid2x2, Grid3x3, Rows4,
} from 'lucide-react'
import { Panel, PageHeader, Screen, StatusPill, Toggle, Select, Modal, KeyValue, InlineAlert, Divider, EmptyState } from '@/components/ui'
import { SyntheticCamera } from '@/components/feeds/SyntheticCamera'
import { useEngine } from '@/services/engine'
import { cn } from '@/lib/utils'

type Layout = 4 | 9 | 16 | 25

export default function CameraWall() {
  const s = useEngine()
  const [layout, setLayout] = useState<Layout>(9)
  const [selected, setSelected] = useState<string | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [zone, setZone] = useState('all')
  const [q, setQ] = useState('')
  const [onlyFav, setOnlyFav] = useState(false)
  const [paused, setPaused] = useState(false)
  const [detail, setDetail] = useState<string | null>(null)

  const zones = useMemo(() => Array.from(new Set(s.cameras.map((c) => c.zone))), [s.cameras])

  const visible = useMemo(() => {
    const t = q.toLowerCase()
    return s.cameras
      .filter((c) => (zone === 'all' || c.zone === zone) && (!t || `${c.id} ${c.label} ${c.location}`.toLowerCase().includes(t)) && (!onlyFav || c.favorite))
      .slice(0, layout)
  }, [s.cameras, zone, q, onlyFav, layout])

  const cols = layout === 4 ? 2 : layout === 9 ? 3 : layout === 16 ? 4 : 5
  const detailCam = s.cameras.find((c) => c.id === detail)

  const cycleStatus = (id: string) => {
    const cam = s.cameras.find((c) => c.id === id)
    if (!cam) return
    s.setCameraStatus(id, cam.status === 'online' ? 'offline' : 'online')
  }

  return (
    <Screen className="pb-6">
      <PageHeader
        eyebrow="SURVEILLANCE · CAMERA WALL"
        title="Camera Wall"
        subtitle="Switch between 4, 9, 16 and 25 tile layouts. Feeds are synthetic renders, never real camera streams."
        icon={Cctv}
        meta={
          <>
            <span className="badge badge-cyan">{layout} TILE LAYOUT</span>
            <span className="badge badge-green">{s.cameras.filter((c) => c.status === 'online').length} ONLINE</span>
            <span className="badge badge-grey">{visible.length} SHOWN</span>
            <span className="badge badge-amber">SYNTHETIC</span>
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-sm" onClick={() => setPaused((p) => !p)}>{paused ? <Play size={11} /> : <Pause size={11} />} {paused ? 'Resume' : 'Pause'}</button>
            <button type="button" className="btn btn-sm" onClick={() => setFullscreen((f) => !f)}>{fullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />} {fullscreen ? 'Exit wall' : 'Full wall'}</button>
          </>
        }
      />

      <div className={cn('grid gap-3', fullscreen ? 'grid-cols-1' : 'xl:grid-cols-[1fr_260px]')}>
        {!fullscreen && (
          <Panel title="Wall Controls" icon={LayoutGrid} className="xl:col-span-2">
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <p className="label-xs mb-1">LAYOUT</p>
                <div className="flex gap-1">
                  {([4, 9, 16, 25] as Layout[]).map((l) => (
                    <button key={l} type="button" onClick={() => setLayout(l)} className={cn('btn btn-sm !px-2.5', layout === l && 'btn-primary')}>
                      {l === 4 ? <Grid2x2 size={11} /> : l === 9 ? <Grid3x3 size={11} /> : l === 16 ? <LayoutGrid size={11} /> : <Rows4 size={11} />} {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="label-xs mb-1">ZONE</p>
                <Select className="w-40" value={zone} onChange={setZone} options={[{ value: 'all', label: 'All zones' }, ...zones.map((z) => ({ value: z, label: z }))]} />
              </div>
              <div>
                <p className="label-xs mb-1">SEARCH</p>
                <div className="relative">
                  <Search size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-ink-3" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Camera id or location…" className="field h-6 w-52 pl-6 text-[10px]" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 pb-1">
                <Toggle checked={onlyFav} onChange={setOnlyFav} label="Favourites only" />
              </div>
              <div className="ml-auto flex items-center gap-1">
                <button type="button" className="btn btn-sm" onClick={() => s.cameras.forEach((c) => s.setCameraStatus(c.id, 'online'))}><RefreshCw size={10} /> Restore all</button>
                <button type="button" className="btn btn-sm" onClick={() => setSelected(null)}><Power size={10} /> Clear focus</button>
              </div>
            </div>
          </Panel>
        )}

        <div className={cn('grid gap-1.5', fullscreen && 'p-1')} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
          {visible.map((c) => (
            <div
              key={c.id}
              className={cn('group relative overflow-hidden border bg-bg', selected === c.id ? 'border-[var(--accent)]' : 'border-line', c.status !== 'online' && 'opacity-60')}
            >
              <button type="button" className="block w-full" aria-label={`Focus ${c.label} feed`} title={`${c.label} · ${c.zone}`} onClick={() => setSelected(c.id)} onDoubleClick={() => setDetail(c.id)}>
                <SyntheticCamera seed={c.id} className="aspect-video" moving={!paused && c.status === 'online'} scan={!paused} label={false} />
              </button>
              {c.status !== 'online' && (
                <div className="absolute inset-0 grid place-items-center bg-black/55">
                  <span className="mono text-[8px] uppercase tracking-widest text-red">SIGNAL {c.status.toUpperCase()}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-1 border-t border-line bg-[#0a1117] px-1.5 py-[3px]">
                <span className="truncate font-mono text-[8.5px] text-ink-2">{c.id} · {c.zone}</span>
                <span className="flex shrink-0 items-center gap-1">
                  {c.recording && <span className="mono text-[7.5px] text-red">REC</span>}
                  <span className={cn('h-1.5 w-1.5 rounded-full', c.status === 'online' ? 'bg-green' : c.status === 'degraded' ? 'bg-amber' : 'bg-red')} />
                </span>
              </div>
              <div className="absolute right-1 top-1 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button type="button" className="grid h-5 w-5 place-items-center border border-line bg-bg/90 text-ink-2 hover:text-ink" onClick={() => s.toggleCameraFavorite(c.id)} title="Favourite">
                  <Star size={9} className={c.favorite ? 'fill-amber text-amber' : ''} />
                </button>
                <button type="button" className="grid h-5 w-5 place-items-center border border-line bg-bg/90 text-ink-2 hover:text-ink" onClick={() => cycleStatus(c.id)} title="Toggle power">
                  <Power size={9} />
                </button>
                <button type="button" className="grid h-5 w-5 place-items-center border border-line bg-bg/90 text-ink-2 hover:text-ink" onClick={() => setDetail(c.id)} title="Expand">
                  <Maximize2 size={9} />
                </button>
              </div>
            </div>
          ))}
          {visible.length === 0 && (
            <div className="col-span-full">
              <Panel title="No matching cameras" icon={Cctv}><EmptyState icon={CameraIcon} title="Nothing to show" message="Adjust zone, search or favourites filters." /></Panel>
            </div>
          )}
        </div>

        {!fullscreen && (
          <div className="space-y-3">
            <Panel title="Wall Status" icon={CameraIcon}>
              <KeyValue
                items={[
                  { k: 'Layout', v: `${layout} tiles` },
                  { k: 'Shown', v: String(visible.length) },
                  { k: 'Online', v: String(visible.filter((c) => c.status === 'online').length) },
                  { k: 'Recording', v: String(visible.filter((c) => c.recording).length) },
                  { k: 'Favourites', v: String(s.cameras.filter((c) => c.favorite).length) },
                  { k: 'Focus', v: selected ?? 'NONE' },
                ]}
              />
              <Divider label="BULK ACTIONS" />
              <div className="space-y-1.5">
                <button type="button" className="btn btn-sm w-full" onClick={() => s.cameras.forEach((c) => s.setCameraStatus(c.id, 'online'))}><RefreshCw size={10} /> Bring all online</button>
                <button type="button" className="btn btn-sm w-full" onClick={() => s.cameras.filter((c) => c.status === 'online').slice(0, 2).forEach((c) => s.setCameraStatus(c.id, 'offline'))}><Power size={10} /> Simulate outage (2)</button>
                <button type="button" className="btn btn-sm w-full" onClick={() => setOnlyFav((f) => !f)}><Star size={10} /> {onlyFav ? 'Show all' : 'Favourites view'}</button>
              </div>
            </Panel>

            <Panel title="Selected Feed" icon={CameraIcon} actions={selected && <StatusPill value={s.cameras.find((c) => c.id === selected)?.status ?? 'unknown'} />}>
              {selected ? (
                <>
                  <SyntheticCamera seed={selected} className="aspect-video border border-line" moving={!paused} />
                  <KeyValue
                    cols={1}
                    items={[
                      { k: 'Camera', v: s.cameras.find((c) => c.id === selected)?.label ?? '—' },
                      { k: 'Location', v: s.cameras.find((c) => c.id === selected)?.location ?? '—' },
                      { k: 'Resolution', v: s.cameras.find((c) => c.id === selected)?.resolution ?? '—' },
                    ]}
                  />
                </>
              ) : (
                <EmptyState icon={CameraIcon} title="No feed focused" message="Click a tile to focus it, double-click to expand." />
              )}
            </Panel>
          </div>
        )}
      </div>

      <InlineAlert tone="amber" title="Rendered, not recorded">
        Tiles are deterministic SVG scenes. Pausing freezes the render locally. In production, a real deployment would need
        explicit consent and lawful authority for every camera source.
      </InlineAlert>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detailCam ? `${detailCam.id} · ${detailCam.label}` : 'Camera'}
        subtitle={detailCam ? `${detailCam.location} · Zone ${detailCam.zone} · Floor ${detailCam.floor}` : undefined}
        icon={Cctv}
        size="lg"
        footer={
          detailCam ? (
            <>
              <button type="button" className="btn" onClick={() => { s.toggleCameraFavorite(detailCam.id); }}><Star size={11} /> {detailCam.favorite ? 'Unfavourite' : 'Favourite'}</button>
              <button type="button" className="btn" onClick={() => cycleStatus(detailCam.id)}><Power size={11} /> Toggle power</button>
              <button type="button" className="btn btn-primary" onClick={() => setDetail(null)}>Close</button>
            </>
          ) : <button type="button" className="btn" onClick={() => setDetail(null)}>Close</button>
        }
      >
        {detailCam && (
          <div className="space-y-3">
            <SyntheticCamera seed={detailCam.id} className="aspect-video border border-line" moving={!paused} />
            <KeyValue
              items={[
                { k: 'Resolution', v: detailCam.resolution },
                { k: 'Frame rate', v: `${detailCam.fps} fps` },
                { k: 'Signal', v: `${detailCam.signal}%` },
                { k: 'Status', v: detailCam.status.toUpperCase() },
                { k: 'Recording', v: detailCam.recording ? 'YES (SIM)' : 'NO' },
                { k: 'Position', v: `x ${detailCam.x} · y ${detailCam.y}` },
              ]}
            />
            <InlineAlert tone="amber" title="Simulated source">This is a generated scene for the SHADOW SYSTEMS demo.</InlineAlert>
          </div>
        )}
      </Modal>
    </Screen>
  )
}
