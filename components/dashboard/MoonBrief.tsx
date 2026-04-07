'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface DailyRemedy {
  planet: string
  remedy: string
  deity: string
  mantra: string
}

interface MoonBriefData {
  moon_sign: string
  moon_nakshatra: string
  mood: string
  best_for: string
  avoid: string
  element: string
  daily_mantra: string
  daily_remedy: DailyRemedy
}

const ELEMENT_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  Fire:  { label: 'Fire Day',  color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/25' },
  Earth: { label: 'Earth Day', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/25' },
  Air:   { label: 'Air Day',   color: 'text-amber-300',  bg: 'bg-amber-400/15 border-amber-400/25' },
  Water: { label: 'Water Day', color: 'text-sky-400',    bg: 'bg-sky-500/15 border-sky-500/25' },
}

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '\u2609', Moon: '\u263D', Mars: '\u2642', Mercury: '\u263F',
  Jupiter: '\u2643', Venus: '\u2640', Saturn: '\u2644',
}

const DAY_FROM_PLANET: Record<string, string> = {
  Sun: 'Sunday', Moon: 'Monday', Mars: 'Tuesday', Mercury: 'Wednesday',
  Jupiter: 'Thursday', Venus: 'Friday', Saturn: 'Saturday',
}

export default function MoonBrief() {
  const [data, setData] = useState<MoonBriefData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/moon-brief')
      .then(r => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (!loading && !data) return null

  /* ── Skeleton ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="mb-8">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-cosmos to-nebula/60 p-5 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/5" />
              <div className="h-5 w-40 bg-white/5 rounded" />
            </div>
            <div className="h-6 w-20 bg-white/5 rounded-full" />
          </div>
          <div className="h-5 w-52 bg-white/5 rounded mb-4" />
          <div className="h-4 w-full bg-white/5 rounded mb-2" />
          <div className="h-4 w-3/4 bg-white/5 rounded mb-5" />
          <div className="h-16 w-full bg-white/5 rounded-xl mb-3" />
          <div className="h-16 w-full bg-white/5 rounded-xl" />
        </div>
      </div>
    )
  }

  const d = data!
  const elem = ELEMENT_STYLES[d.element] ?? ELEMENT_STYLES.Fire
  const planetGlyph = PLANET_GLYPHS[d.daily_remedy.planet] ?? '\u2726'
  const dayLabel = DAY_FROM_PLANET[d.daily_remedy.planet] ?? ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mb-8"
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-cosmos to-nebula/60 p-5 shadow-lg shadow-violet/5">
        {/* Atmospheric orb */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-rose/[0.04] rounded-full blur-3xl pointer-events-none" />

        {/* ── Header: Moon sign + element badge ──────────────── */}
        <div className="relative flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <motion.span
              className="text-3xl text-violet-light drop-shadow-[0_0_12px_rgba(196,181,253,0.35)]"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              {'\u263D'}
            </motion.span>
            <div>
              <h2 className="font-display text-lg text-star leading-tight">
                Moon in {d.moon_sign}
              </h2>
              <p className="text-muted text-[11px]">{d.moon_nakshatra} nakshatra</p>
            </div>
          </div>
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${elem.bg} ${elem.color}`}>
            {elem.label}
          </span>
        </div>

        {/* ── Mood ───────────────────────────────────────────── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="relative text-star/80 text-sm italic font-display mb-4 pl-0.5"
        >
          &ldquo;{d.mood}&rdquo;
        </motion.p>

        {/* ── Best for / Avoid ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="relative space-y-2 mb-4"
        >
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 text-sm mt-0.5 shrink-0">{'\u2713'}</span>
            <p className="text-star/85 text-sm leading-relaxed">
              <span className="text-emerald-400/80 font-medium text-xs uppercase tracking-wider mr-1.5">Best for</span>
              {d.best_for}
            </p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-amber-400 text-sm mt-0.5 shrink-0">{'\u26A0'}</span>
            <p className="text-star/85 text-sm leading-relaxed">
              <span className="text-amber-400/80 font-medium text-xs uppercase tracking-wider mr-1.5">Avoid</span>
              {d.avoid}
            </p>
          </div>
        </motion.div>

        {/* ── Divider ────────────────────────────────────────── */}
        <div className="relative border-t border-white/[0.06] mb-4" />

        {/* ── Daily Mantra ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="relative bg-violet/[0.06] rounded-xl p-3.5 border-l-2 border-violet/30 mb-3"
        >
          <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-1.5">
            {'\u2726'} Today&apos;s Mantra
          </p>
          <p className="font-display text-star text-[15px] leading-snug italic">
            &ldquo;{d.daily_mantra}&rdquo;
          </p>
        </motion.div>

        {/* ── Daily Remedy ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="relative bg-cosmos/50 rounded-xl p-3.5"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-violet-light text-lg">{planetGlyph}</span>
            <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase">
              Daily Remedy{dayLabel ? ` — ${dayLabel}` : ''}
            </p>
          </div>
          <p className="text-star/80 text-sm leading-relaxed mb-1.5">
            {d.daily_remedy.remedy}
          </p>
          <p className="text-muted text-xs italic">
            Mantra: {d.daily_remedy.mantra}
          </p>
        </motion.div>
      </div>
    </motion.div>
  )
}
