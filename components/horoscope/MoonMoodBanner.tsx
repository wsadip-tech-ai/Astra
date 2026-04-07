'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface MoonData {
  moon_sign: string
  mood: string
  daily_mantra: string
  element: string
}

const ELEMENT_COLOR: Record<string, string> = {
  Fire: 'text-orange-400',
  Earth: 'text-emerald-400',
  Air: 'text-amber-300',
  Water: 'text-sky-400',
}

export default function MoonMoodBanner() {
  const [data, setData] = useState<MoonData | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/moon-brief')
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setData)
      .catch(() => setData(null))
  }, [])

  if (!data) return null

  const elemColor = ELEMENT_COLOR[data.element] ?? 'text-violet-light'

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-violet/[0.06] border border-violet/15 rounded-xl px-5 py-3.5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
    >
      <div className="flex items-center gap-2.5">
        <span className="text-xl text-violet-light">{'\u263D'}</span>
        <div>
          <p className="text-star text-sm">
            Moon mood: <span className="italic font-display">{data.mood}</span>
          </p>
          <p className={`text-[11px] ${elemColor}`}>
            {data.moon_sign} &middot; {data.element}
          </p>
        </div>
      </div>
      <p className="text-muted text-xs italic sm:text-right">
        &ldquo;{data.daily_mantra}&rdquo;
      </p>
    </motion.div>
  )
}
