import type { WesternChartData } from '@/types'
import { SIGN_TRAITS } from '@/constants/mock-chart'
import Link from 'next/link'

interface CosmicProfileProps {
  chart: WesternChartData
}

export default function CosmicProfile({ chart }: CosmicProfileProps) {
  const sun = chart.planets.find(p => p.name === 'Sun')
  const moon = chart.planets.find(p => p.name === 'Moon')
  const risingHouse = chart.houses.find(h => h.number === 1)

  const big3 = [
    { label: 'Sun', symbol: sun?.symbol ?? '☉', sign: sun?.sign ?? '—' },
    { label: 'Moon', symbol: moon?.symbol ?? '☽', sign: moon?.sign ?? '—' },
    { label: 'Rising', symbol: '↑', sign: risingHouse?.sign ?? '—' },
  ]

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-violet-light text-xs font-semibold tracking-widest uppercase">Your Cosmic Profile</p>
        <Link href="/chart" className="text-violet-light text-xs hover:text-violet transition-colors">
          View Full Chart →
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {big3.map(item => (
          <div
            key={item.label}
            className="bg-gradient-to-br from-nebula to-cosmos border border-violet/20 rounded-xl p-4 text-center"
          >
            <span className="text-2xl">{item.symbol}</span>
            <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mt-1">{item.label}</p>
            <p className="text-star text-sm font-semibold mt-0.5">{item.sign}</p>
            <p className="text-muted text-xs">{SIGN_TRAITS[item.sign] ?? ''}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
