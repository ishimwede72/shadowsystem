import { useMemo } from 'react'
import { AreaTrend, PALETTE } from '@/components/charts'

/** Small internal chart used by the signatures page. */
export function AreasAndSignatures() {
  const data = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ t: `${i + 1}`, v: Math.round(6 + Math.abs(Math.sin(i / 2)) * 14) })),
    [],
  )
  return (
    <div>
      <AreaTrend data={data} keys={[{ key: 'v', color: PALETTE.blue, label: 'Signatures / min' }]} height={120} />
      <p className="mt-1 font-mono text-[8.5px] text-ink-3">Simulated signing volume · local demo</p>
    </div>
  )
}
