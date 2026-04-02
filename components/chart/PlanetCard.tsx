'use client'

import type { Planet } from '@/types'

interface PlanetCardProps {
  planet: Planet
  variant?: 'default' | 'hero'
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default function PlanetCard({ planet, variant = 'default' }: PlanetCardProps) {
  const isHero = variant === 'hero'

  return (
    <div
      className={
        isHero
          ? 'bg-gradient-to-br from-nebula to-cosmos border border-violet/30 rounded-2xl p-5 text-center'
          : 'bg-nebula border border-white/5 rounded-xl p-4'
      }
    >
      <div className={isHero ? 'text-3xl mb-2' : 'flex items-center gap-3'}>
        <span className={isHero ? '' : 'text-xl text-rose'}>{planet.symbol}</span>
        {!isHero && (
          <div>
            <div className="text-star text-sm font-semibold">
              {planet.name}
              {planet.retrograde && (
                <span className="ml-1.5 text-rose text-xs" title="Retrograde">℞</span>
              )}
            </div>
            <div className="text-muted text-xs">
              <span>{planet.sign} {planet.degree}°</span>
              <span> · </span>
              <span>{ordinal(planet.house)} House</span>
            </div>
          </div>
        )}
      </div>
      {isHero && (
        <>
          <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mt-1">{planet.name}</p>
          <p className="text-star text-lg font-semibold mt-1">
            <span>{planet.sign} {planet.degree}°</span>
            {planet.retrograde && <span className="ml-1.5 text-rose text-sm" title="Retrograde">℞</span>}
          </p>
          <p className="text-muted text-xs mt-1">{ordinal(planet.house)} House</p>
        </>
      )}
    </div>
  )
}
