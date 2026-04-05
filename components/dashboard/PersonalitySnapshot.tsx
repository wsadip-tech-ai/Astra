'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface PersonalityData {
  personality: {
    core_nature: string
    strengths: string[]
    challenges: string[]
  }
  life_themes: string[]
}

export default function PersonalitySnapshot() {
  const [data, setData] = useState<PersonalityData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/personality')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  // Graceful absence — don't render anything on error or no data
  if (!loading && !data) return null

  // Skeleton while loading
  if (loading) {
    return (
      <div className="mb-8">
        <div className="bg-cosmos border border-white/10 rounded-2xl p-6 animate-pulse">
          <div className="h-3 w-40 bg-white/5 rounded mb-5" />
          <div className="flex flex-wrap gap-2 mb-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 w-24 bg-white/5 rounded-full" />
            ))}
          </div>
          <div className="h-4 w-full bg-white/5 rounded mb-2" />
          <div className="h-4 w-3/4 bg-white/5 rounded mb-5" />
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-5 w-20 bg-white/5 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const coreNature = data!.personality.core_nature
  const truncatedNature =
    coreNature.length > 120 ? coreNature.slice(0, 117) + '...' : coreNature
  const strengths = data!.personality.strengths.slice(0, 3)
  const challenges = data!.personality.challenges.slice(0, 2)
  const lifeThemes = data!.life_themes.slice(0, 5)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mb-8"
    >
      <div className="bg-cosmos border border-white/10 rounded-2xl p-6 relative overflow-hidden">
        {/* Subtle decorative gradient orb */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-violet/8 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 relative">
          <p className="text-violet-light text-xs font-semibold tracking-widest uppercase">
            Your Cosmic Blueprint
          </p>
          <Link
            href="/chart"
            className="text-violet-light text-xs hover:text-violet transition-colors"
          >
            View Full Profile &rarr;
          </Link>
        </div>

        {/* Life Themes — most prominent */}
        {lifeThemes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="flex flex-wrap gap-2 mb-4"
          >
            {lifeThemes.map((theme) => (
              <span
                key={theme}
                className="bg-violet/15 text-violet-light rounded-full px-3 py-1 text-xs font-medium"
              >
                {theme}
              </span>
            ))}
          </motion.div>
        )}

        {/* Core Nature */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="text-star/90 text-sm leading-relaxed mb-4"
        >
          {truncatedNature}
        </motion.p>

        {/* Strengths + Challenges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="flex flex-wrap gap-1.5"
        >
          {strengths.map((s) => (
            <span
              key={s}
              className="bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            >
              {s}
            </span>
          ))}
          {challenges.map((c) => (
            <span
              key={c}
              className="bg-rose/10 text-rose border border-rose/20 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            >
              {c}
            </span>
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}
