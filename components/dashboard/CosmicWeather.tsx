'use client'

import { useState, useEffect } from 'react'
import type { CosmicWeatherEntry } from '@/types'

interface CosmicWeatherProps {
  entries: CosmicWeatherEntry[]
}

export default function CosmicWeather({ entries }: CosmicWeatherProps) {
  const [reading, setReading] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReading() {
      try {
        const resp = await fetch('/api/cosmic-weather')
        if (resp.ok) {
          const data = await resp.json()
          setReading(data.reading)
        }
      } catch {
        // No reading
      }
    }
    fetchReading()
  }, [])

  return (
    <div className="mb-8">
      <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-4">Today's Cosmic Weather</p>

      {reading && (
        <div className="bg-nebula border border-violet/20 rounded-xl p-4 mb-4">
          <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">Your Daily Cosmic Weather</p>
          <p className="text-star text-sm leading-relaxed">{reading}</p>
        </div>
      )}

      <div className="bg-cosmos border border-white/5 rounded-2xl p-5 space-y-4">
        {entries.map(entry => (
          <div key={entry.planet} className="flex items-start gap-3">
            <span className="text-xl mt-0.5">{entry.symbol}</span>
            <div>
              <p className="text-star text-sm font-medium">
                {entry.planet} in {entry.sign}
              </p>
              <p className="text-muted text-xs mt-0.5">{entry.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
