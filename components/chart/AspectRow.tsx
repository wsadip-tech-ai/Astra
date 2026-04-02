'use client'

import type { Aspect, Planet } from '@/types'

interface AspectRowProps {
  aspect: Aspect
  planets: Planet[]
}

const ASPECT_SYMBOLS: Record<string, string> = {
  conjunction: '☌',
  opposition: '☍',
  trine: '△',
  square: '□',
  sextile: '⚹',
}

const HARMONIOUS = new Set(['trine', 'sextile', 'conjunction'])

export default function AspectRow({ aspect, planets }: AspectRowProps) {
  const p1 = planets.find(p => p.name === aspect.planet1)
  const p2 = planets.find(p => p.name === aspect.planet2)
  const isHarmonious = HARMONIOUS.has(aspect.type)
  const typeName = aspect.type.charAt(0).toUpperCase() + aspect.type.slice(1)

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
        isHarmonious ? 'border-violet/20 bg-violet/5' : 'border-rose/20 bg-rose/5'
      }`}
    >
      <span className="text-lg">{p1?.symbol ?? '?'}</span>
      <span className={`text-sm ${isHarmonious ? 'text-violet-light' : 'text-rose'}`}>
        {ASPECT_SYMBOLS[aspect.type] ?? '•'}
      </span>
      <span className="text-lg">{p2?.symbol ?? '?'}</span>
      <span className="text-star text-sm font-medium ml-1">{typeName}</span>
      <span className="text-muted text-xs ml-auto">{aspect.orb}°</span>
    </div>
  )
}
