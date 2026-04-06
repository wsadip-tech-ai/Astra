'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GlowButton from '@/components/ui/GlowButton'
import type { VedicDashaPeriod, VedicYoga } from '@/types'

interface YearlyData {
  reading: string
  dasha: {
    current_mahadasha: VedicDashaPeriod
    current_antardasha: VedicDashaPeriod
    upcoming_antardashas: VedicDashaPeriod[]
  } | null
  yogas: VedicYoga[]
  year: number
}

/* ── Planet glyph map ────────────────────────────────────── */
const PLANET_GLYPHS: Record<string, string> = {
  Sun: '\u2609', Moon: '\u263D', Mars: '\u2642', Mercury: '\u263F',
  Jupiter: '\u2643', Venus: '\u2640', Saturn: '\u2644', Rahu: '\u260A',
  Ketu: '\u260B',
}

/* ── Yoga strength accent colours ────────────────────────── */
const YOGA_STRENGTH: Record<string, string> = {
  strong: 'bg-violet/25 text-violet-light border-violet/30',
  medium: 'bg-rose/15 text-rose-light border-rose/20',
  weak: 'bg-white/5 text-muted border-white/10',
}

/* ── Framer variants ─────────────────────────────────────── */
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
}

const shimmer = {
  hidden: { opacity: 0.4 },
  show: {
    opacity: [0.4, 0.7, 0.4],
    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' as const },
  },
}

/* ── Skeleton ────────────────────────────────────────────── */
function YearlySkeleton() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-8"
      role="status"
      aria-label="Loading yearly forecast"
    >
      {/* Title skeleton */}
      <div className="space-y-3">
        <motion.div variants={shimmer} className="h-4 w-36 rounded-full bg-violet/15" />
        <motion.div variants={shimmer} className="h-10 w-72 rounded-xl bg-white/5" />
      </div>

      {/* Dasha card skeleton */}
      <motion.div
        variants={shimmer}
        className="rounded-2xl border border-white/5 bg-cosmos p-6 space-y-4"
      >
        <div className="h-5 w-48 rounded-lg bg-white/5" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 rounded-xl bg-white/[0.03]" />
          <div className="h-20 rounded-xl bg-white/[0.03]" />
        </div>
      </motion.div>

      {/* Narrative skeleton */}
      <motion.div
        variants={shimmer}
        className="rounded-2xl border border-white/5 bg-cosmos p-8 space-y-3"
      >
        {[88, 95, 78, 82, 70, 65, 73, 58].map((w, i) => (
          <div
            key={i}
            className="h-3.5 rounded-full bg-white/5"
            style={{ width: `${w}%` }}
          />
        ))}
      </motion.div>

      {/* Yoga badges skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div key={i} variants={shimmer} className="h-7 w-24 rounded-full bg-white/5" />
        ))}
      </div>
    </motion.div>
  )
}

/* ── No chart CTA ────────────────────────────────────────── */
function NoChartState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center py-24"
    >
      <div className="relative mx-auto w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full bg-violet/20 blur-xl" />
        <div className="relative flex items-center justify-center w-20 h-20 rounded-full border border-violet/30 bg-cosmos">
          <svg className="w-8 h-8 text-violet-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
      </div>
      <h2 className="font-display text-2xl text-star mb-2">
        Your Stars Await
      </h2>
      <p className="text-muted text-sm max-w-sm mx-auto mb-8 leading-relaxed">
        Generate your Vedic birth chart first so Astra can craft your
        personalised year-ahead forecast.
      </p>
      <GlowButton href="/chart" variant="primary">
        Generate Birth Chart
      </GlowButton>
    </motion.div>
  )
}

/* ── Dasha Timeline Card ─────────────────────────────────── */
function DashaCard({ dasha }: { dasha: NonNullable<YearlyData['dasha']> }) {
  const maha = dasha.current_mahadasha
  const antar = dasha.current_antardasha
  const upcoming = dasha.upcoming_antardashas ?? []

  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border border-violet/15 bg-gradient-to-br from-cosmos via-nebula/40 to-cosmos p-6 md:p-8"
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1.5 h-1.5 rounded-full bg-violet animate-pulse" />
        <h2 className="text-violet-light text-xs font-semibold tracking-widest uppercase">
          Current Dasha Period
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Mahadasha */}
        <div className="rounded-xl border border-white/5 bg-void/50 p-5">
          <p className="text-muted text-[11px] font-semibold tracking-widest uppercase mb-2">
            Mahadasha
          </p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl leading-none" aria-hidden="true">
              {PLANET_GLYPHS[maha.planet] ?? ''}
            </span>
            <span className="font-display text-xl text-star">{maha.planet}</span>
          </div>
          <p className="text-muted text-xs">
            {maha.start} &mdash; {maha.end}
          </p>
        </div>

        {/* Antardasha */}
        <div className="rounded-xl border border-white/5 bg-void/50 p-5">
          <p className="text-muted text-[11px] font-semibold tracking-widest uppercase mb-2">
            Antardasha
          </p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl leading-none" aria-hidden="true">
              {PLANET_GLYPHS[antar.planet] ?? ''}
            </span>
            <span className="font-display text-xl text-star">{antar.planet}</span>
          </div>
          <p className="text-muted text-xs">
            {antar.start} &mdash; {antar.end}
          </p>
        </div>
      </div>

      {/* Upcoming transitions */}
      {upcoming.length > 0 && (
        <div>
          <p className="text-muted text-[11px] font-semibold tracking-widest uppercase mb-3">
            Upcoming Antardashas
          </p>
          <div className="flex flex-wrap gap-2">
            {upcoming.slice(0, 5).map((ad, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 text-xs rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-muted"
              >
                <span aria-hidden="true">{PLANET_GLYPHS[ad.planet] ?? ''}</span>
                <span className="text-star font-medium">{ad.planet}</span>
                <span className="opacity-60">{ad.start}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

/* ── Narrative Card ──────────────────────────────────────── */
function NarrativeCard({ reading }: { reading: string }) {
  // Split reading into paragraphs for visual rhythm
  const paragraphs = reading.split('\n').filter(p => p.trim())

  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl border border-white/5 bg-cosmos relative overflow-hidden"
    >
      {/* Subtle top gradient accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.5), rgba(236,72,153,0.3), transparent)',
        }}
      />

      <div className="p-6 md:p-8 lg:p-10">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-4 h-4 text-violet-light" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <h2 className="text-violet-light text-xs font-semibold tracking-widest uppercase">
            Year-Ahead Reading
          </h2>
        </div>

        <div className="prose-invert space-y-4">
          {paragraphs.map((p, i) => {
            // Detect section headings (lines starting with a number or bold pattern)
            const isHeading = /^\d+[\.\)]\s/.test(p.trim()) || /^\*\*/.test(p.trim())
            const cleaned = p.replace(/^\*\*|\*\*$/g, '').replace(/^\d+[\.\)]\s*/, '')

            if (isHeading) {
              return (
                <h3
                  key={i}
                  className="font-display text-lg text-star mt-6 first:mt-0"
                >
                  {cleaned}
                </h3>
              )
            }

            return (
              <p
                key={i}
                className="text-muted text-sm leading-relaxed"
              >
                {p}
              </p>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

/* ── Yoga Badges ─────────────────────────────────────────── */
function YogaBadges({ yogas }: { yogas: VedicYoga[] }) {
  if (yogas.length === 0) return null

  return (
    <motion.div variants={fadeUp}>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-violet-light text-xs font-semibold tracking-widest uppercase">
          Active Yogas
        </h2>
        <span className="text-[10px] text-muted bg-white/5 rounded-full px-2 py-0.5">
          {yogas.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {yogas.map((yoga, i) => {
          const strengthKey = yoga.strength?.toLowerCase() ?? 'weak'
          const classes = YOGA_STRENGTH[strengthKey] ?? YOGA_STRENGTH.weak

          return (
            <span
              key={i}
              className={`inline-flex items-center gap-1.5 text-xs font-medium rounded-full border px-3 py-1.5 cursor-default ${classes}`}
              title={yoga.interpretation}
            >
              {yoga.name}
              {strengthKey === 'strong' && (
                <span className="w-1 h-1 rounded-full bg-violet-light" aria-hidden="true" />
              )}
            </span>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ── Main Component ──────────────────────────────────────── */
export default function YearlyView() {
  const [data, setData] = useState<YearlyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noChart, setNoChart] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchYearly() {
      try {
        const resp = await fetch('/api/yearly')
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}))
          if (resp.status === 404) {
            setNoChart(true)
            return
          }
          throw new Error(body.error ?? `Request failed (${resp.status})`)
        }
        const json = await resp.json()
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchYearly()
    return () => { cancelled = true }
  }, [])

  if (loading) return <YearlySkeleton />

  if (noChart) return <NoChartState />

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-24"
      >
        <div className="relative mx-auto w-16 h-16 mb-5">
          <div className="absolute inset-0 rounded-full bg-rose/20 blur-lg" />
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full border border-rose/30 bg-cosmos">
            <svg className="w-6 h-6 text-rose" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        </div>
        <h2 className="font-display text-xl text-star mb-2">Cosmic Disruption</h2>
        <p className="text-muted text-sm max-w-sm mx-auto mb-6">{error}</p>
        <GlowButton onClick={() => window.location.reload()} variant="secondary">
          Try Again
        </GlowButton>
      </motion.div>
    )
  }

  if (!data) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="yearly-content"
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {/* ── Header ───────────────────────────────────────── */}
        <motion.div variants={fadeUp}>
          <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
            Vedic Year-Ahead Forecast
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-star leading-tight">
            Your {data.year} Forecast
          </h1>
        </motion.div>

        {/* ── Dasha timeline ───────────────────────────────── */}
        {data.dasha && <DashaCard dasha={data.dasha} />}

        {/* ── AI narrative ─────────────────────────────────── */}
        <NarrativeCard reading={data.reading} />

        {/* ── Active yogas ─────────────────────────────────── */}
        <YogaBadges yogas={data.yogas} />
      </motion.div>
    </AnimatePresence>
  )
}
