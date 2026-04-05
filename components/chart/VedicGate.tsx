'use client'

import GlowButton from '@/components/ui/GlowButton'
import KundaliChart from '@/components/chart/KundaliChart'
import type { VedicChartData } from '@/types'

interface VedicGateProps {
  tier: 'free' | 'premium'
  vedicChart: VedicChartData | null
}

export default function VedicGate({ tier, vedicChart }: VedicGateProps) {
  if (tier !== 'premium') {
    return (
      <div className="bg-gradient-to-br from-nebula to-cosmos border border-violet/20 rounded-2xl p-8 text-center max-w-md mx-auto">
        <div className="text-4xl mb-4">🕉️</div>
        <h3 className="font-display text-2xl text-star mb-3">Unlock Vedic Astrology</h3>
        <ul className="text-muted text-sm space-y-2 mb-6 text-left max-w-xs mx-auto">
          <li><span aria-hidden="true">✦ </span>Nakshatra analysis</li>
          <li><span aria-hidden="true">✦ </span>Dasha periods</li>
          <li><span aria-hidden="true">✦ </span>Kundali chart</li>
          <li><span aria-hidden="true">✦ </span>Vedic remedies and insights</li>
        </ul>
        <GlowButton href="/pricing" variant="primary">Upgrade to Premium</GlowButton>
      </div>
    )
  }

  if (!vedicChart) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">🕉️</div>
        <h3 className="font-display text-2xl text-star mb-2">Vedic Astrology</h3>
        <p className="text-muted text-sm">Coming soon — your Vedic chart will appear here once calculations are ready.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Kundali Chart */}
      <div>
        <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-4 text-center">
          Kundali &mdash; North Indian Birth Chart
        </p>
        <KundaliChart
          planets={vedicChart.planets}
          houses={vedicChart.houses}
          lagna={vedicChart.lagna}
        />
      </div>

      {/* Planet details grid */}
      <div>
        <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">
          Planetary Positions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {vedicChart.planets.map(p => (
            <div
              key={p.name}
              className="flex items-center gap-3 bg-nebula border border-white/5 rounded-xl px-4 py-3"
            >
              <span className={`text-lg ${p.retrograde ? 'text-rose' : 'text-star'}`}>
                {PLANET_GLYPHS[p.name] ?? p.name.charAt(0)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-star text-sm font-semibold">{p.name}</span>
                  {p.retrograde && (
                    <span className="text-rose text-[10px] font-bold">℞</span>
                  )}
                </div>
                <div className="text-muted text-xs">
                  {p.sign} {p.degree.toFixed(1)}° &middot; {p.nakshatra} &middot; House {p.house}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nakshatras */}
      {vedicChart.nakshatras.length > 0 && (
        <div>
          <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">
            Nakshatras
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {vedicChart.nakshatras.map(n => (
              <div
                key={n.planet}
                className="bg-cosmos/60 border border-white/5 rounded-lg px-3 py-2"
              >
                <span className="text-star text-sm">{n.planet}</span>
                <div className="text-muted text-xs">{n.nakshatra} &middot; Pada {n.pada}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mars: '♂',
  Mercury: '☿',
  Jupiter: '♃',
  Venus: '♀',
  Saturn: '♄',
  Rahu: '☊',
  Ketu: '☋',
}
