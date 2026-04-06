'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface UpcomingEvent {
  yoga: string
  category: string
  status: 'active' | 'upcoming'
  days_until: number
  days_remaining: number
  start_date: string
  end_date: string
  description: string
  strength: string
  what_to_do: string[]
  life_areas: string[]
}

const CATEGORY_STYLES: Record<string, { badge: string; border: string; glow: string }> = {
  opportunity: {
    badge: 'bg-violet/15 text-violet-light border-violet/25',
    border: 'border-violet/20 hover:border-violet/40',
    glow: 'group-hover:shadow-violet/10',
  },
  transformation: {
    badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
    border: 'border-indigo-500/20 hover:border-indigo-500/40',
    glow: 'group-hover:shadow-indigo-500/10',
  },
  karmic: {
    badge: 'bg-rose/15 text-rose-light border-rose/25',
    border: 'border-rose/20 hover:border-rose/40',
    glow: 'group-hover:shadow-rose/10',
  },
}

function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? CATEGORY_STYLES.opportunity
}

export default function UpcomingEvents() {
  const [events, setEvents] = useState<UpcomingEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/upcoming')
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(data => setEvents(data.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && events.length === 0) return null

  // Skeleton
  if (loading) {
    return (
      <div className="mb-8">
        <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-4">
          Coming Up
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="rounded-2xl border border-white/5 bg-cosmos p-5 animate-pulse"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="h-4 w-28 bg-white/5 rounded" />
                <div className="h-8 w-14 bg-white/5 rounded" />
              </div>
              <div className="h-3 w-16 bg-white/5 rounded mb-3" />
              <div className="h-3 w-full bg-white/5 rounded mb-2" />
              <div className="h-3 w-3/4 bg-white/5 rounded mb-4" />
              <div className="h-3 w-full bg-white/5 rounded mb-4" />
              <div className="h-3 w-24 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mb-8"
    >
      <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-4">
        Coming Up
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((evt, i) => {
          const style = getCategoryStyle(evt.category)
          const isActive = evt.status === 'active'
          const countNumber = isActive ? evt.days_remaining : evt.days_until
          const countLabel = isActive ? 'days left' : 'days away'
          const firstAction = evt.what_to_do?.[0] ?? null

          return (
            <motion.div
              key={`${evt.yoga}-${evt.start_date}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
            >
              <Link
                href="/transit#upcoming-yogas"
                className={`group block relative overflow-hidden rounded-2xl border bg-cosmos p-5 transition-all shadow-lg ${style.border} ${style.glow} hover:bg-violet/5`}
              >
                {/* Subtle corner glow */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet/5 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Header: yoga name + countdown */}
                <div className="relative flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-violet-light text-xs">
                        {isActive ? '\u2726' : '\u2729'}
                      </span>
                      <h3 className="text-star font-semibold text-sm truncate">
                        {evt.yoga}
                      </h3>
                    </div>
                    {/* Category badge */}
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${style.badge}`}
                    >
                      {evt.category}
                    </span>
                  </div>

                  {/* Countdown number */}
                  <div className="text-right ml-3 flex-shrink-0">
                    <motion.span
                      className="font-display text-2xl text-star tabular-nums block leading-none"
                      animate={isActive ? { opacity: [1, 0.7, 1] } : {}}
                      transition={
                        isActive
                          ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                          : {}
                      }
                    >
                      {countNumber}
                    </motion.span>
                    <span className="text-muted text-[10px]">
                      {isActive ? 'days left' : countLabel}
                    </span>
                  </div>
                </div>

                {/* Description — truncated to 2 lines */}
                <p className="relative text-muted text-xs leading-relaxed mb-3 line-clamp-2">
                  {stripPrefix(evt.description)}
                </p>

                {/* Action item */}
                {firstAction && (
                  <div className="relative bg-white/[0.03] rounded-lg px-3 py-2 mb-3">
                    <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-0.5">
                      {isActive ? 'Focus' : 'Prepare'}
                    </p>
                    <p className="text-star/80 text-xs leading-relaxed line-clamp-2">
                      {firstAction}
                    </p>
                  </div>
                )}

                {/* Link */}
                <span className="relative text-violet-light text-xs group-hover:translate-x-0.5 transition-transform inline-block">
                  {isActive ? 'See guidance' : 'See preparation guide'} &rarr;
                </span>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

/** Strip "Jupiter in Capricorn — " prefix from descriptions that start with planet info */
function stripPrefix(desc: string): string {
  const dashIdx = desc.indexOf(' \u2014 ')
  if (dashIdx > 0 && dashIdx < 40) {
    return desc.slice(dashIdx + 3).trim()
  }
  return desc
}
