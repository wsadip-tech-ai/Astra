'use client'

import { useState } from 'react'
import type { WesternChartData } from '@/types'
import PlanetCard from '@/components/chart/PlanetCard'
import AspectRow from '@/components/chart/AspectRow'
import VedicGate from '@/components/chart/VedicGate'

interface ChartTabsProps {
  chart: WesternChartData
  summaryText: string
  tier: 'free' | 'premium'
}

const TABS = ['Overview', 'Planets', 'Aspects', 'Vedic'] as const
type Tab = typeof TABS[number]

export default function ChartTabs({ chart, summaryText, tier }: ChartTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview')

  const sun = chart.planets.find(p => p.name === 'Sun')
  const moon = chart.planets.find(p => p.name === 'Moon')
  // Rising = Ascendant = 1st house sign
  const risingHouse = chart.houses.find(h => h.number === 1)
  const rising = risingHouse
    ? { name: 'Rising', symbol: '↑', sign: risingHouse.sign, degree: risingHouse.degree, house: 1, retrograde: false }
    : null

  const sortedAspects = [...chart.aspects].sort((a, b) => a.orb - b.orb)

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-cosmos rounded-xl p-1 mb-8" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-violet text-white shadow-lg shadow-violet/30'
                : 'text-muted hover:text-star'
            }`}
          >
            {tab}
            {tab === 'Vedic' && tier !== 'premium' && (
              <span className="ml-1 text-rose text-xs">★</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {sun && <PlanetCard planet={sun} variant="hero" />}
            {moon && <PlanetCard planet={moon} variant="hero" />}
            {rising && <PlanetCard planet={rising} variant="hero" />}
          </div>
          <div className="bg-nebula border border-white/5 rounded-2xl p-6">
            <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">Your Cosmic Blueprint</p>
            <p className="text-star/90 text-sm leading-relaxed">{summaryText}</p>
          </div>
        </div>
      )}

      {activeTab === 'Planets' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {chart.planets.map(planet => (
            <PlanetCard key={planet.name} planet={planet} />
          ))}
        </div>
      )}

      {activeTab === 'Aspects' && (
        <div className="space-y-2">
          {sortedAspects.map(aspect => (
            <AspectRow key={`${aspect.planet1}-${aspect.planet2}`} aspect={aspect} planets={chart.planets} />
          ))}
        </div>
      )}

      {activeTab === 'Vedic' && <VedicGate tier={tier} />}
    </div>
  )
}
