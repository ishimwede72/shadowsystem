import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie,
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, RadialBarChart, RadialBar, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, Legend,
} from 'recharts'

export const PALETTE = {
  cyan: '#28d8ea',
  green: '#38db91',
  blue: '#377eff',
  amber: '#f5b942',
  red: '#f14e61',
  ink: '#93a3b4',
  line: '#233241',
}

export const GRID = { stroke: '#1b2a36', strokeDasharray: '2 4', vertical: false }

const tipStyle = {
  contentStyle: {
    background: '#0b1119',
    border: '1px solid #233241',
    borderRadius: 2,
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 10.5,
    color: '#e9f0f6',
    padding: '6px 8px',
  },
  labelStyle: { color: '#93a3b4', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 2 },
  itemStyle: { color: '#e9f0f6', fontSize: 10.5 },
  cursor: { stroke: '#28d8ea', strokeOpacity: 0.3, strokeWidth: 1 },
}

export function AreaTrend({
  data, keys, height = 200, xKey = 't', showGrid = true, stacked, className,
}: {
  data: object[]
  keys: { key: string; color: string; label?: string }[]
  height?: number
  xKey?: string
  showGrid?: boolean
  stacked?: boolean
  className?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }} className={className}>
        <defs>
          {keys.map((k) => (
            <linearGradient key={k.key} id={`grad-${k.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={k.color} stopOpacity={0.42} />
              <stop offset="100%" stopColor={k.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        {showGrid && <CartesianGrid {...GRID} />}
        <XAxis dataKey={xKey} tick={{ fill: '#65788b', fontSize: 9 }} axisLine={{ stroke: '#233241' }} tickLine={false} minTickGap={22} />
        <YAxis tick={{ fill: '#65788b', fontSize: 9 }} axisLine={false} tickLine={false} width={46} />
        <Tooltip {...tipStyle} />
        {keys.map((k) => (
          <Area
            key={k.key}
            type="monotone"
            dataKey={k.key}
            name={k.label ?? k.key}
            stroke={k.color}
            strokeWidth={1.5}
            fill={`url(#grad-${k.key})`}
            stackId={stacked ? '1' : undefined}
            dot={false}
            isAnimationActive
            animationDuration={500}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function LineTrend({
  data, keys, height = 180, xKey = 't', showGrid = true,
}: {
  data: object[]
  keys: { key: string; color: string; label?: string; dashed?: boolean }[]
  height?: number
  xKey?: string
  showGrid?: boolean
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
        {showGrid && <CartesianGrid {...GRID} />}
        <XAxis dataKey={xKey} tick={{ fill: '#65788b', fontSize: 9 }} axisLine={{ stroke: '#233241' }} tickLine={false} minTickGap={20} />
        <YAxis tick={{ fill: '#65788b', fontSize: 9 }} axisLine={false} tickLine={false} width={44} />
        <Tooltip {...tipStyle} />
        {keys.map((k) => (
          <Line
            key={k.key}
            type="monotone"
            dataKey={k.key}
            name={k.label ?? k.key}
            stroke={k.color}
            strokeWidth={1.5}
            dot={false}
            strokeDasharray={k.dashed ? '4 3' : undefined}
            animationDuration={450}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export function BarsTrend({
  data, keys, height = 180, xKey = 't', horizontal, stacked,
}: {
  data: object[]
  keys: { key: string; color: string; label?: string }[]
  height?: number
  xKey?: string
  horizontal?: boolean
  stacked?: boolean
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 4, right: 6, left: horizontal ? 12 : -24, bottom: 0 }}>
        <CartesianGrid {...GRID} horizontal={!horizontal} vertical={horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fill: '#65788b', fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey={xKey} tick={{ fill: '#93a3b4', fontSize: 9 }} axisLine={false} tickLine={false} width={92} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fill: '#65788b', fontSize: 9 }} axisLine={{ stroke: '#233241' }} tickLine={false} minTickGap={16} />
            <YAxis tick={{ fill: '#65788b', fontSize: 9 }} axisLine={false} tickLine={false} width={44} />
          </>
        )}
        <Tooltip {...tipStyle} />
        {keys.map((k) => (
          <Bar key={k.key} dataKey={k.key} name={k.label ?? k.key} fill={k.color} radius={[1, 1, 0, 0]} stackId={stacked ? 'a' : undefined} maxBarSize={26} animationDuration={450} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

export function Donut({
  data, height = 180, innerRadius = 46, outerRadius = 68, centerLabel, centerValue,
}: {
  data: { name: string; value: number; color: string }[]
  height?: number
  innerRadius?: number
  outerRadius?: number
  centerLabel?: string
  centerValue?: string
}) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={innerRadius} outerRadius={outerRadius} paddingAngle={2} stroke="none" animationDuration={500}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip {...tipStyle} />
        </PieChart>
      </ResponsiveContainer>
      {centerValue && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" style={{ height }}>
          <span className="stat-value text-[15px] text-ink">{centerValue}</span>
          {centerLabel && <span className="label-xs mt-0.5">{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}

export function RadialGauge({
  value, color = PALETTE.cyan, height = 150, label, suffix = '%',
}: {
  value: number
  color?: string
  height?: number
  label?: string
  suffix?: string
}) {
  const data = [{ name: label ?? 'value', value, fill: color }]
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <RadialBarChart data={data} innerRadius="72%" outerRadius="100%" startAngle={210} endAngle={-30}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={1} background={{ fill: '#16212b' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="stat-value text-xl" style={{ color }}>{value.toFixed(0)}{suffix}</span>
        {label && <span className="label-xs mt-0.5">{label}</span>}
      </div>
    </div>
  )
}

export function RadarMetric({
  data, height = 210, color = PALETTE.cyan,
}: {
  data: { axis: string; value: number }[]
  height?: number
  color?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="#1e2d3a" />
        <PolarAngleAxis dataKey="axis" tick={{ fill: '#93a3b4', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
        <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.22} strokeWidth={1.4} animationDuration={500} />
        <Tooltip {...tipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function MiniBars({ data, color = PALETTE.cyan, height = 28 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {data.map((v, i) => (
        <span key={i} className="flex-1 rounded-[1px]" style={{ height: `${Math.max(8, (v / max) * 100)}%`, background: color, opacity: 0.35 + (i / data.length) * 0.65 }} />
      ))}
    </div>
  )
}

export function HeatStrip({ data, colors }: { data: number[]; colors?: string[] }) {
  const max = Math.max(...data, 1)
  const palette = colors ?? ['#0e2a24', '#12603f', '#1fa568', '#38db91']
  return (
    <div className="flex gap-[3px]">
      {data.map((v, i) => {
        const idx = Math.min(palette.length - 1, Math.floor((v / max) * palette.length))
        return <span key={i} className="h-6 flex-1 rounded-[1px]" style={{ background: palette[idx] }} title={String(v)} />
      })}
    </div>
  )
}

export function ChartLegend({ items }: { items: { label: string; color: string; value?: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-ink-3">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: i.color }} />
          {i.label}
          {i.value && <span className="tabular text-ink-2">{i.value}</span>}
        </span>
      ))}
    </div>
  )
}

export { Legend }
