'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface DayQuality {
  score: string
  label: string
  description: string
}

interface TopAlert {
  headline: string
  planet: string
  type: 'opportunity' | 'attention'
  life_areas: string[]
  is_favorable: boolean
}

interface GlanceData {
  day_quality: DayQuality
  top_alert: TopAlert | null
  focus_advice: string
  favorable_count: number
  challenging_count: number
}

const QUALITY_CONFIG: Record<string, { icon: string; glow: string; accent: string; bg: string }> = {
  excellent: {
    icon: '\u2728',
    glow: 'shadow-green-500/20',
    accent: 'text-green-400',
    bg: 'from-green-500/10 via-green-500/5 to-transparent',
  },
  good: {
    icon: '\u2600\uFE0F',
    glow: 'shadow-violet/20',
    accent: 'text-violet-light',
    bg: 'from-violet/10 via-violet/5 to-transparent',
  },
  moderate: {
    icon: '\u26A1',
    glow: 'shadow-amber-500/20',
    accent: 'text-amber-400',
    bg: 'from-amber-500/10 via-amber-500/5 to-transparent',
  },
  challenging: {
    icon: '\uD83C\uDF19',
    glow: 'shadow-rose/20',
    accent: 'text-rose-light',
    bg: 'from-rose/10 via-rose/5 to-transparent',
  },
}

export default function DayAtGlance() {
  const [data, setData] = useState<GlanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/glance')
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && !data) return null

  // Skeleton
  if (loading) {
    return (
      <div className="mb-8">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-cosmos p-6 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-white/5" />
            <div>
              <div className="h-5 w-32 bg-white/5 rounded mb-1" />
              <div className="h-3 w-48 bg-white/5 rounded" />
            </div>
          </div>
          <div className="h-4 w-full bg-white/5 rounded mb-2" />
          <div className="h-4 w-2/3 bg-white/5 rounded mb-4" />
          <div className="h-3 w-40 bg-white/5 rounded" />
        </div>
      </div>
    )
  }

  const quality = data!.day_quality
  const config = QUALITY_CONFIG[quality.score] ?? QUALITY_CONFIG.moderate
  const alert = data!.top_alert

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mb-8"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border border-white/10 bg-cosmos p-6 shadow-lg ${config.glow}`}
      >
        {/* Atmospheric background gradient */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${config.bg} pointer-events-none`}
        />
        {/* Subtle orb */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-violet/6 rounded-full blur-3xl pointer-events-none" />

        {/* Day quality header */}
        <div className="relative flex items-center gap-3 mb-4">
          <motion.span
            className="text-3xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {config.icon}
          </motion.span>
          <div>
            <h2 className={`font-display text-xl ${config.accent}`}>
              {quality.label}
            </h2>
            <p className="text-muted text-xs">
              {data!.favorable_count} supportive &middot; {data!.challenging_count} challenging transits
            </p>
          </div>
        </div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative text-star/85 text-sm leading-relaxed mb-3"
        >
          {quality.description}
        </motion.p>

        {/* Top alert */}
        {alert && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="relative flex items-start gap-2 mb-4 pl-3 border-l-2 border-violet/30"
          >
            <div>
              <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-0.5">
                Top alert
              </p>
              <p className="text-star/90 text-sm">{alert.headline}</p>
            </div>
          </motion.div>
        )}

        {/* Focus advice + link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="relative flex items-center justify-between"
        >
          <p className="text-muted text-xs italic">
            Focus: {data!.focus_advice}
          </p>
          <Link
            href="/transit"
            className="text-violet-light text-xs font-medium hover:text-violet transition-colors whitespace-nowrap ml-4 group"
          >
            See full forecast{' '}
            <span className="inline-block group-hover:translate-x-0.5 transition-transform">
              &rarr;
            </span>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}
