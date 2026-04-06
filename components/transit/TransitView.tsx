'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TransitKundaliChart from './TransitKundaliChart'

/* ─── Type Definitions ─── */

interface TransitPlanet {
  name: string
  sign: string
  degree: number
  nakshatra: string
  pada: number
  retrograde: boolean
}

interface TransitAspect {
  transit_planet: string
  natal_planet: string
  aspect_type: string
  orb: number
}

interface VedhaFlag {
  planet: string
  favorable_house: number
  obstructed_by: string
  description: string
}

interface PlanetInterpretation {
  planet: string
  sign: string
  house: number
  life_areas: string[]
  is_favorable: boolean
  tone: string
  summary: string
  detailed: string
  retrograde_note: string | null
  dasha_connection: string | null
}

interface LifeAreaEntry {
  outlook: string
  planets: { planet: string; house: number; tone: string; summary: string }[]
}

interface AlertRemedy {
  mantra?: string
  gemstone?: string
  charity?: string
  practice?: string
}

interface AlertTiming {
  active_from: string
  active_until: string
  days_remaining: number
  duration: string
  progress_pct: number
}

interface HighImpactAlert {
  planet: string
  house: number
  sign: string
  type: string
  impact_score: number
  life_areas: string[]
  headline: string
  detail: string
  remedy: AlertRemedy
  is_favorable: boolean
  timing?: AlertTiming
}

interface LifeScore {
  outlook: string
  verdict: string
}

interface TimelineEntry {
  planet: string
  start: string
  end: string
  nature: string
  description: string
}

interface HighImpact {
  alerts: HighImpactAlert[]
  life_scores: Record<string, LifeScore>
  timeline: TimelineEntry[]
}

interface UpcomingAntardasha {
  planet: string
  start: string
  end: string
}

export interface TransitViewProps {
  transits: {
    date: string
    planets: TransitPlanet[]
    dominant_element: string
  }
  personal: {
    transit_aspects: TransitAspect[]
    vedha_flags: VedhaFlag[]
    murthi_nirnaya: string
    transit_houses: Record<string, number>
  } | null
  interpreted: {
    high_impact?: HighImpact | null
    planet_interpretations: PlanetInterpretation[]
    life_area_summary: Record<string, LifeAreaEntry>
    favorable_count: number
    challenging_count: number
    overall_outlook: string
  } | null
  dasha?: {
    current_mahadasha: { planet: string; start: string; end: string }
    current_antardasha: { planet: string; start: string; end: string }
  } | null
  upcomingAntardashas?: UpcomingAntardasha[]
  natalHouses?: { number: number; sign: string; lord: string }[]
  futureYogas?: {
    currently_active: { yoga: string; start_date: string; end_date: string; description: string; strength: string; category?: string; phase?: string; jupiter_sign?: string; kendra_house?: number }[]
    gaja_kesari: { yoga: string; start_date: string; end_date: string; jupiter_sign: string; kendra_house: number; description: string; strength: string }[]
    sade_sati: {
      currently_active: boolean
      current_phase: string | null
      phase_details: Record<string, { sign: string; start: string; end: string; description: string }>
      next_sade_sati: { start: string; end: string } | null
      description: string
      remedies: { mantra: string; practice: string; charity: string }
    }
    jupiter_return: { start_date: string; end_date: string; sign: string; description: string; strength: string }[]
    saturn_return: { start_date: string; end_date: string; sign: string; description: string; strength: string }[]
    rahu_ketu_moon: { yoga: string; start_date: string; end_date: string; sign: string; description: string; strength: string }[]
    timeline: { yoga: string; start_date: string; end_date: string; description: string; strength: string; category?: string; phase?: string }[]
    next_gaja_kesari: { yoga: string; start_date: string; end_date: string; jupiter_sign: string; kendra_house: number; description: string; strength: string } | null
  } | null
}

/* ─── Constants ─── */

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '\u2609',
  Moon: '\u263D',
  Mars: '\u2642',
  Mercury: '\u263F',
  Jupiter: '\u2643',
  Venus: '\u2640',
  Saturn: '\u2644',
  Rahu: '\u260A',
  Ketu: '\u260B',
}

const MURTHI_STYLES: Record<string, { bg: string; label: string }> = {
  Gold: { bg: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25', label: 'Gold Murthi' },
  Silver: { bg: 'bg-gray-400/15 text-gray-300 border border-gray-400/25', label: 'Silver Murthi' },
  Copper: { bg: 'bg-orange-400/15 text-orange-400 border border-orange-400/25', label: 'Copper Murthi' },
  Iron: { bg: 'bg-gray-600/15 text-muted border border-gray-600/25', label: 'Iron Murthi' },
}

const ASPECT_LABELS: Record<string, { label: string; color: string }> = {
  conjunction: { label: 'Conjunction', color: 'text-violet-light' },
  trine: { label: 'Trine', color: 'text-emerald-400' },
  square: { label: 'Square', color: 'text-rose' },
  opposition: { label: 'Opposition', color: 'text-orange-400' },
  sextile: { label: 'Sextile', color: 'text-sky-400' },
}

const ASPECT_MEANINGS: Record<string, { keyword: string; icon: string; color: string; bgColor: string; effect: (transit: string, natal: string) => string }> = {
  conjunction: {
    keyword: 'Intensification',
    icon: '\u26A1',
    color: 'text-violet-light',
    bgColor: 'bg-violet/8 border-violet/15',
    effect: (t, n) => `${t}'s energy merges with your natal ${n}, amplifying its themes in your life right now.`,
  },
  opposition: {
    keyword: 'Tension & Awareness',
    icon: '\u26A0\uFE0F',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/8 border-orange-400/15',
    effect: (t, n) => `${t} opposes your natal ${n}, creating a push-pull dynamic. Balance is needed between these energies.`,
  },
  trine: {
    keyword: 'Harmony & Flow',
    icon: '\u2728',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/8 border-emerald-500/15',
    effect: (t, n) => `${t} harmoniously supports your natal ${n}. Opportunities flow naturally in ${n}'s domain.`,
  },
  square: {
    keyword: 'Growth Through Friction',
    icon: '\uD83D\uDD25',
    color: 'text-rose',
    bgColor: 'bg-rose/8 border-rose/15',
    effect: (t, n) => `${t} challenges your natal ${n}, pushing you to grow. Take deliberate action rather than reacting.`,
  },
  sextile: {
    keyword: 'Gentle Opportunity',
    icon: '\uD83C\uDF1F',
    color: 'text-sky-400',
    bgColor: 'bg-sky-400/8 border-sky-400/15',
    effect: (t, n) => `${t} gently opens doors through your natal ${n}. Small efforts yield meaningful results.`,
  },
}

/* ─── Yoga Category Colors ─── */

const YOGA_CATEGORY_STYLES: Record<string, { text: string; border: string; bg: string; glow: string; badge: string }> = {
  opportunity: {
    text: 'text-yellow-400',
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/5',
    glow: 'rgba(234, 179, 8, 0.12)',
    badge: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  },
  transformation: {
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/5',
    glow: 'rgba(99, 102, 241, 0.12)',
    badge: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  },
  karmic: {
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/5',
    glow: 'rgba(244, 63, 94, 0.12)',
    badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  },
}

const YOGA_GLYPH: Record<string, string> = {
  'Gaja Kesari': '\u2643',          // Jupiter
  'Sade Sati': '\u2644',            // Saturn
  'Sade Sati (upcoming)': '\u2644',
  'Jupiter Return': '\u2643',
  'Saturn Return': '\u2644',
  'Rahu over Moon': '\u260A',
  'Ketu over Moon': '\u260B',
}

const FAST_MOVERS = new Set(['Moon'])

const HOUSE_THEMES: Record<number, string> = {
  1: 'Self & Identity',
  2: 'Finances & Values',
  3: 'Communication',
  4: 'Home & Comfort',
  5: 'Creativity & Romance',
  6: 'Health & Routine',
  7: 'Partnerships',
  8: 'Transformation',
  9: 'Spirituality & Travel',
  10: 'Career & Status',
  11: 'Social Circle & Gains',
  12: 'Rest & Inner World',
}

const VEDHA_DURATION: Record<string, string> = {
  Moon: 'a few hours',
  Sun: '~1 month',
  Mercury: '~3 weeks',
  Venus: '~3 weeks',
  Mars: '~6 weeks',
  Jupiter: '~1 year',
  Saturn: '~2.5 years',
  Rahu: '~1.5 years',
  Ketu: '~1.5 years',
}

const LIFE_AREA_ICONS: Record<string, React.ReactNode> = {
  'Finance & Career': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  'Relationships & Family': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  'Health & Wellbeing': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  ),
  'Spirituality & Growth': (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
    </svg>
  ),
}

const LIFE_AREA_ORDER = [
  'Finance & Career',
  'Relationships & Family',
  'Health & Wellbeing',
  'Spirituality & Growth',
]

/* ─── Animation Variants ─── */

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
}

const slideIn = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

/* ─── Sub-components ─── */

function SectionDivider() {
  return (
    <div className="relative h-px w-full">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet/20 to-transparent" />
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-muted transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

/* ─── Alert Card (full — top 3) ─── */

function AlertCard({ alert, index }: { alert: HighImpactAlert; index: number }) {
  const [remedyOpen, setRemedyOpen] = useState(false)
  const isFavorable = alert.is_favorable
  const stripColor = isFavorable ? 'bg-emerald-500' : 'bg-rose'
  const glyph = PLANET_GLYPHS[alert.planet] ?? ''
  const gradientBg = isFavorable
    ? 'bg-gradient-to-r from-emerald-500/8 to-transparent'
    : 'bg-gradient-to-r from-rose/8 to-transparent'

  return (
    <motion.div
      variants={slideIn}
      custom={index}
      className={`relative rounded-xl overflow-hidden border border-white/5 ${gradientBg}`}
    >
      {/* Left color strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${stripColor}`} />

      <div className="pl-5 pr-5 py-5">
        {/* Planet glyph + Headline */}
        <h3 className="font-display text-lg text-star leading-snug mb-2">
          <span className="text-violet-light mr-2 text-xl">{glyph}</span>
          {alert.headline}
        </h3>

        {/* Life area tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {alert.life_areas.map(area => (
            <span
              key={area}
              className="text-[10px] uppercase tracking-wide font-medium text-violet-light bg-violet/10 rounded-full px-2.5 py-0.5"
            >
              {area}
            </span>
          ))}
          <span className={`text-[10px] uppercase tracking-wide font-medium rounded-full px-2.5 py-0.5 ${
            isFavorable ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose/15 text-rose'
          }`}>
            {alert.type === 'opportunity' ? 'Opportunity' : 'Needs Attention'}
          </span>
        </div>

        {/* Timing bar — more prominent */}
        {alert.timing && alert.timing.active_from && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[11px] text-muted mb-1.5">
              <span>Active: {new Date(alert.timing.active_from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} — {new Date(alert.timing.active_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span className="text-star font-medium">{alert.timing.days_remaining}d left ({alert.timing.duration})</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isFavorable ? 'bg-emerald-500/60' : 'bg-rose/60'}`}
                style={{ width: `${alert.timing.progress_pct}%` }}
              />
            </div>
          </div>
        )}

        {/* One-line detail */}
        <p className="text-muted text-sm leading-relaxed mb-3">
          {alert.detail}
        </p>

        {/* Remedy toggle */}
        {alert.remedy && (
          <>
            <button
              onClick={() => setRemedyOpen(!remedyOpen)}
              className="flex items-center gap-1.5 text-xs text-violet-light hover:text-star transition-colors cursor-pointer"
              aria-expanded={remedyOpen}
            >
              <span className="font-medium">{remedyOpen ? 'Hide Remedies' : 'View Remedies'}</span>
              <ChevronIcon open={remedyOpen} />
            </button>

            <AnimatePresence initial={false}>
              {remedyOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-white/5">
                    {alert.remedy.mantra && (
                      <div className="flex items-start gap-2.5 bg-cosmos rounded-lg px-3.5 py-2.5">
                        <span className="text-base mt-0.5 shrink-0" aria-hidden="true">{'\ud83e\udeb7'}</span>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-0.5">Mantra</p>
                          <p className="text-star text-xs leading-relaxed">{alert.remedy.mantra}</p>
                        </div>
                      </div>
                    )}
                    {alert.remedy.gemstone && (
                      <div className="flex items-start gap-2.5 bg-cosmos rounded-lg px-3.5 py-2.5">
                        <span className="text-base mt-0.5 shrink-0" aria-hidden="true">{'\ud83d\udc8e'}</span>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-0.5">Gemstone</p>
                          <p className="text-star text-xs leading-relaxed">{alert.remedy.gemstone}</p>
                        </div>
                      </div>
                    )}
                    {alert.remedy.charity && (
                      <div className="flex items-start gap-2.5 bg-cosmos rounded-lg px-3.5 py-2.5">
                        <span className="text-base mt-0.5 shrink-0" aria-hidden="true">{'\ud83d\ude4f'}</span>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-0.5">Charity</p>
                          <p className="text-star text-xs leading-relaxed">{alert.remedy.charity}</p>
                        </div>
                      </div>
                    )}
                    {alert.remedy.practice && (
                      <div className="flex items-start gap-2.5 bg-cosmos rounded-lg px-3.5 py-2.5">
                        <span className="text-base mt-0.5 shrink-0" aria-hidden="true">{'\u2728'}</span>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-0.5">Practice</p>
                          <p className="text-star text-xs leading-relaxed">{alert.remedy.practice}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  )
}

/* ─── Mini Alert Card (remaining planets) ─── */

function MiniAlertCard({ interp }: { interp: PlanetInterpretation }) {
  const [expanded, setExpanded] = useState(false)
  const glyph = PLANET_GLYPHS[interp.planet] ?? ''
  const isFavorable = interp.is_favorable

  return (
    <motion.div
      variants={fadeUp}
      className="bg-nebula/50 rounded-lg border border-white/5 hover:border-violet/15 transition-colors"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 cursor-pointer"
      >
        <span className="text-violet-light text-lg shrink-0">{glyph}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-star text-sm font-medium">{interp.planet}</span>
            <span className="text-muted text-xs">{interp.sign} &middot; House {interp.house}</span>
          </div>
          <p className="text-muted text-xs leading-relaxed truncate">{interp.summary}</p>
        </div>
        <span className={`text-[10px] uppercase tracking-wide font-medium rounded-full px-2.5 py-0.5 shrink-0 ${
          isFavorable ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose/15 text-rose'
        }`}>
          {isFavorable ? 'Favorable' : 'Challenging'}
        </span>
        <ChevronIcon open={expanded} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-3">
              <p className="text-muted text-sm leading-relaxed">{interp.detailed}</p>

              {interp.life_areas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {interp.life_areas.map(area => (
                    <span key={area} className="text-[10px] uppercase tracking-wide text-violet-light bg-violet/10 rounded-full px-2.5 py-0.5">
                      {area}
                    </span>
                  ))}
                </div>
              )}

              {interp.retrograde_note && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3.5 py-2.5">
                  <p className="text-amber-400 text-xs font-medium mb-0.5">Retrograde Effect</p>
                  <p className="text-amber-300/80 text-xs leading-relaxed">{interp.retrograde_note}</p>
                </div>
              )}

              {interp.dasha_connection && (
                <div className="bg-violet/10 border border-violet/20 rounded-lg px-3.5 py-2.5">
                  <p className="text-violet-light text-xs font-medium mb-0.5">Dasha Connection</p>
                  <p className="text-violet-light/70 text-xs leading-relaxed">{interp.dasha_connection}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Life Score Card ─── */

function LifeScoreCard({ area, score }: { area: string; score: LifeScore | undefined }) {
  const icon = LIFE_AREA_ICONS[area]
  const outlook = score?.outlook?.toLowerCase() ?? 'mixed'
  const dotColor = outlook === 'favorable' ? 'bg-emerald-400' : outlook === 'challenging' ? 'bg-rose' : 'bg-yellow-400'
  const borderHover = outlook === 'favorable'
    ? 'hover:border-emerald-500/20'
    : outlook === 'challenging'
      ? 'hover:border-rose/20'
      : 'hover:border-yellow-400/20'

  return (
    <div className={`bg-nebula rounded-xl p-4 border border-white/5 ${borderHover} transition-colors`}>
      <div className="flex items-center gap-2.5 mb-2">
        <div className="text-violet-light/80">{icon}</div>
        <h3 className="text-star text-xs font-semibold truncate">{area}</h3>
        <span className={`w-2 h-2 rounded-full shrink-0 ml-auto ${dotColor}`} />
      </div>
      <p className="text-muted text-xs leading-relaxed line-clamp-2">
        {score?.verdict ?? 'No significant transits'}
      </p>
    </div>
  )
}

/* ─── Planet Card (for detailed analysis) ─── */

function PlanetCard({ interp, defaultOpen = false }: { interp: PlanetInterpretation; defaultOpen?: boolean }) {
  const [expanded, setExpanded] = useState(defaultOpen)
  const borderColor = interp.is_favorable ? 'border-l-green-500/30' : 'border-l-rose/30'
  const glyph = PLANET_GLYPHS[interp.planet] ?? ''

  return (
    <motion.div
      variants={fadeUp}
      className={`bg-cosmos rounded-xl p-4 border-l-2 ${borderColor} border border-l-2 border-white/5`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-star font-semibold text-sm">
            <span className="text-violet-light mr-1.5">{glyph}</span>
            {interp.planet}
          </h4>
          <p className="text-violet-light text-xs">
            {interp.sign} &middot; House {interp.house}
          </p>
        </div>
        <span
          className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${
            interp.is_favorable ? 'bg-green-500/15 text-green-400' : 'bg-rose/15 text-rose'
          }`}
        >
          {interp.is_favorable ? 'Supportive' : 'Challenging'}
        </span>
      </div>

      <p className="text-muted text-sm leading-relaxed mb-3">{interp.summary}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {interp.life_areas.map(area => (
          <span key={area} className="text-[11px] text-violet-light bg-violet/10 rounded-full px-2.5 py-0.5">
            {area}
          </span>
        ))}
      </div>

      {interp.retrograde_note && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3.5 py-2.5 mb-3">
          <p className="text-amber-400 text-xs font-medium mb-0.5">Retrograde Effect</p>
          <p className="text-amber-300/80 text-xs leading-relaxed">{interp.retrograde_note}</p>
        </div>
      )}

      {interp.dasha_connection && (
        <div className="bg-violet/10 border border-violet/20 rounded-lg px-3.5 py-2.5 mb-3">
          <p className="text-violet-light text-xs font-medium mb-0.5">Dasha Connection</p>
          <p className="text-violet-light/70 text-xs leading-relaxed">{interp.dasha_connection}</p>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted hover:text-violet-light transition-colors cursor-pointer mt-1"
        aria-expanded={expanded}
      >
        <span>{expanded ? 'Show less' : 'Read more'}</span>
        <ChevronIcon open={expanded} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <p className="text-muted text-sm leading-relaxed pt-3 border-t border-white/5 mt-3">
              {interp.detailed}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Timeline Entry ─── */

function TimelineDot({ nature }: { nature: string }) {
  const n = nature.toLowerCase()
  const color = n === 'favorable' ? 'bg-emerald-400 shadow-emerald-400/40' : n === 'challenging' ? 'bg-rose shadow-rose/40' : 'bg-yellow-400 shadow-yellow-400/40'
  return <div className={`w-2.5 h-2.5 rounded-full shadow-lg shrink-0 ${color}`} />
}

/* ─── Main Component ─── */

export default function TransitView({ transits, personal, interpreted, dasha, upcomingAntardashas, natalHouses, futureYogas }: TransitViewProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [showAllAlerts, setShowAllAlerts] = useState(false)

  const dateFormatted = new Date(transits.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const murthi = personal?.murthi_nirnaya
    ? MURTHI_STYLES[personal.murthi_nirnaya] ?? MURTHI_STYLES.Iron
    : null

  const highImpact = interpreted?.high_impact ?? null

  // Sort top alerts: first by days_remaining ascending, then impact_score descending
  const sortedAlerts = useMemo(() => {
    if (!highImpact?.alerts?.length) return []
    return [...highImpact.alerts].sort((a, b) => {
      const aDays = a.timing?.days_remaining ?? Infinity
      const bDays = b.timing?.days_remaining ?? Infinity
      if (aDays !== bDays) return aDays - bDays
      return b.impact_score - a.impact_score
    })
  }, [highImpact?.alerts])

  const topAlerts = sortedAlerts.slice(0, 3)
  const hasAlerts = topAlerts.length > 0

  // Remaining planet interpretations not in top 3 alerts
  const topAlertPlanets = useMemo(
    () => new Set(topAlerts.map(a => a.planet)),
    [topAlerts]
  )

  const remainingPlanets = useMemo(() => {
    if (!interpreted?.planet_interpretations) return []
    return interpreted.planet_interpretations.filter(p => !topAlertPlanets.has(p.planet))
  }, [interpreted?.planet_interpretations, topAlertPlanets])

  // Build timeline: prefer high_impact.timeline, fallback to upcomingAntardashas
  const timeline: TimelineEntry[] = highImpact?.timeline && highImpact.timeline.length > 0
    ? highImpact.timeline
    : (upcomingAntardashas ?? []).map(ad => ({
        planet: ad.planet,
        start: ad.start,
        end: ad.end,
        nature: 'mixed',
        description: `${ad.planet} Antardasha period`,
      }))

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* ═══ 1. Compact Header + Murthi Badge ═══ */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-star mb-1">
            Your Cosmic Forecast
          </h1>
          <p className="text-muted text-sm">{dateFormatted}</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {murthi && (
            <span className={`text-xs font-medium rounded-full px-3 py-1 ${murthi.bg}`}>
              {murthi.label}
            </span>
          )}
        </div>
      </motion.div>

      <SectionDivider />

      {/* ═══ 2. Transit Kundali Chart (HERO) — 3-Column Dashboard ═══ */}
      {transits && personal?.transit_houses && (
        <motion.section variants={fadeUp}>
          <h2 className="font-display text-lg text-star/70 mb-4 tracking-wide">Your Sky Today</h2>

          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_240px] md:grid-cols-[200px_1fr_200px] gap-3 lg:gap-4">

            {/* ── Left Panel: Today's Energy ── */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
              className="bg-nebula/50 backdrop-blur-sm rounded-xl border border-white/5 p-4 space-y-4 order-1 md:order-1"
            >
              {/* Murthi Nirnaya */}
              {personal?.murthi_nirnaya && (() => {
                const murthiMap: Record<string, { icon: string; glow: string; label: string; color: string }> = {
                  Gold:   { icon: '\u2609', glow: 'shadow-yellow-400/30 border-yellow-500/30 bg-yellow-500/10', label: 'Excellent Day', color: 'text-yellow-400' },
                  Silver: { icon: '\u263D', glow: 'shadow-gray-300/20 border-gray-400/25 bg-gray-400/10', label: 'Good Day', color: 'text-gray-300' },
                  Copper: { icon: '\u2B25', glow: 'shadow-orange-400/20 border-orange-400/25 bg-orange-400/10', label: 'Moderate Day', color: 'text-orange-400' },
                  Iron:   { icon: '\u2699', glow: 'shadow-gray-500/15 border-gray-600/25 bg-gray-600/10', label: 'Challenging Day', color: 'text-gray-500' },
                }
                const m = murthiMap[personal.murthi_nirnaya] ?? murthiMap.Iron
                return (
                  <div>
                    <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-2">Day Quality</p>
                    <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 shadow-lg ${m.glow}`}>
                      <span className={`text-2xl ${m.color}`}>{m.icon}</span>
                      <div>
                        <p className={`text-sm font-semibold ${m.color}`}>{personal.murthi_nirnaya} Murthi</p>
                        <p className="text-muted text-[11px]">{m.label}</p>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Energy Balance */}
              {interpreted && (
                <div>
                  <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-2">Energy Balance</p>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden flex">
                    {(interpreted.favorable_count + interpreted.challenging_count) > 0 && (
                      <>
                        <div
                          className="h-full bg-emerald-500/70 rounded-l-full transition-all"
                          style={{ width: `${(interpreted.favorable_count / (interpreted.favorable_count + interpreted.challenging_count)) * 100}%` }}
                        />
                        <div
                          className="h-full bg-rose/70 rounded-r-full transition-all"
                          style={{ width: `${(interpreted.challenging_count / (interpreted.favorable_count + interpreted.challenging_count)) * 100}%` }}
                        />
                      </>
                    )}
                  </div>
                  <p className="text-muted text-[11px] mt-1.5">
                    <span className="text-emerald-400">{interpreted.favorable_count} Supportive</span>
                    {' \u00B7 '}
                    <span className="text-rose-light">{interpreted.challenging_count} Challenging</span>
                  </p>
                </div>
              )}

              {/* Current Dasha */}
              {dasha && (
                <div>
                  <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-2">Current Dasha</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-cosmos rounded-lg px-2.5 py-2 text-center border border-white/5">
                      <span className="text-2xl text-violet-light block leading-none">{PLANET_GLYPHS[dasha.current_mahadasha.planet] ?? ''}</span>
                      <p className="text-star text-[11px] font-medium mt-1">{dasha.current_mahadasha.planet}</p>
                      <p className="text-muted text-[9px] uppercase tracking-wider">Maha</p>
                    </div>
                    <div className="w-4 h-px bg-white/10" />
                    <div className="flex-1 bg-cosmos rounded-lg px-2.5 py-2 text-center border border-white/5">
                      <span className="text-2xl text-violet-light block leading-none">{PLANET_GLYPHS[dasha.current_antardasha.planet] ?? ''}</span>
                      <p className="text-star text-[11px] font-medium mt-1">{dasha.current_antardasha.planet}</p>
                      <p className="text-muted text-[9px] uppercase tracking-wider">Antar</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Dominant Element */}
              {transits.dominant_element && (() => {
                const elementStyles: Record<string, string> = {
                  Fire: 'bg-red-500/15 text-red-400 border-red-500/20',
                  Earth: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
                  Air: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/20',
                  Water: 'bg-blue-400/15 text-blue-400 border-blue-400/20',
                }
                const style = elementStyles[transits.dominant_element] ?? 'bg-violet/15 text-violet-light border-violet/20'
                return (
                  <div>
                    <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-2">Dominant Element</p>
                    <span className={`text-[11px] font-medium rounded-full px-3 py-1 border ${style}`}>
                      {transits.dominant_element}
                    </span>
                  </div>
                )
              })()}
            </motion.div>

            {/* ── Center: Kundali Chart ── */}
            <div className="order-2 md:order-2">
              <TransitKundaliChart
                transitPlanets={transits.planets}
                transitHouses={personal.transit_houses}
                natalHouses={natalHouses}
                selectedHouse={null}
                interpretedPlanets={interpreted?.planet_interpretations?.map(p => ({
                  planet: p.planet,
                  is_favorable: p.is_favorable,
                  tone: p.tone,
                }))}
              />
            </div>

            {/* ── Right Panel: Key Influences ── */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
              className="bg-nebula/50 backdrop-blur-sm rounded-xl border border-white/5 p-4 space-y-4 order-3 md:order-3"
            >
              {/* Top Influence */}
              {sortedAlerts[0] && (() => {
                const top = sortedAlerts[0]
                const glyph = PLANET_GLYPHS[top.planet] ?? ''
                const isFav = top.is_favorable
                return (
                  <div>
                    <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-2">Top Influence</p>
                    <div className="text-center mb-2">
                      <span className={`text-3xl inline-block ${isFav ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'text-rose drop-shadow-[0_0_8px_rgba(236,72,153,0.4)]'}`}>
                        {glyph}
                      </span>
                    </div>
                    <p className="text-star text-sm font-medium text-center">{top.planet}</p>
                    <p className="text-muted text-[11px] text-center">in {top.house}{top.house === 1 ? 'st' : top.house === 2 ? 'nd' : top.house === 3 ? 'rd' : 'th'} house &middot; {top.sign}</p>
                    {top.life_areas[0] && (
                      <p className="text-violet-light text-[10px] text-center mt-1">{top.life_areas[0]}</p>
                    )}
                    <p className="text-muted text-[11px] leading-relaxed mt-2 line-clamp-2">{top.headline}</p>
                    <span className={`inline-block text-[10px] uppercase tracking-wide font-medium rounded-full px-2.5 py-0.5 mt-2 ${
                      isFav ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose/15 text-rose'
                    }`}>
                      {isFav ? 'Favorable' : 'Challenging'}
                    </span>
                  </div>
                )
              })()}

              {/* Retrograde Planets */}
              {(() => {
                const retrogrades = transits.planets.filter(p => p.retrograde)
                if (retrogrades.length === 0) return null
                return (
                  <div>
                    <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-2">Retrograde Planets</p>
                    <div className="space-y-1.5">
                      {retrogrades.map(p => (
                        <div key={p.name} className="flex items-center gap-2 bg-cosmos rounded-lg px-2.5 py-1.5 border border-white/5">
                          <span className="text-violet-light text-base">{PLANET_GLYPHS[p.name] ?? ''}</span>
                          <span className="text-star text-xs flex-1">{p.name}</span>
                          <span className="bg-rose/20 text-rose text-[9px] rounded-full px-1.5 py-0.5 font-semibold">Rx</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Houses to Watch */}
              {personal?.transit_houses && (() => {
                // Count planets per house
                const houseCounts: Record<number, { planets: string[]; sign: string }> = {}
                Object.entries(personal.transit_houses).forEach(([planet, house]) => {
                  if (!houseCounts[house]) {
                    const planetData = transits.planets.find(p => p.name === planet)
                    houseCounts[house] = { planets: [], sign: planetData?.sign ?? '' }
                  }
                  houseCounts[house].planets.push(planet)
                })
                // Get top 3 houses by planet count
                const topHouses = Object.entries(houseCounts)
                  .filter(([, data]) => data.planets.length >= 1)
                  .sort(([, a], [, b]) => b.planets.length - a.planets.length)
                  .slice(0, 3)

                if (topHouses.length === 0) return null

                return (
                  <div>
                    <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-2">Houses to Watch</p>
                    <div className="space-y-1.5">
                      {topHouses.map(([house, data]) => (
                        <div key={house} className="flex items-center justify-between bg-cosmos rounded-lg px-2.5 py-1.5 border border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="text-violet-light text-xs font-semibold">H{house}</span>
                            <span className="text-muted text-[11px]">{data.sign}</span>
                          </div>
                          <span className="text-star text-[11px]">{data.planets.length} planet{data.planets.length > 1 ? 's' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </motion.div>

          </div>
        </motion.section>
      )}

      <SectionDivider />

      {/* ═══ 3. Dasha Period Bar ═══ */}
      {dasha && (
        <motion.div
          variants={fadeUp}
          className="bg-nebula rounded-xl px-5 py-3.5 border border-white/5 flex items-center justify-between gap-4 flex-wrap"
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-light shrink-0" />
            <span className="text-star text-sm font-medium">
              {dasha.current_mahadasha.planet} Mahadasha
            </span>
            <span className="text-muted text-sm">&middot;</span>
            <span className="text-star text-sm">
              {dasha.current_antardasha.planet} Antardasha
            </span>
          </div>
          <div className="text-muted text-xs">
            {new Date(dasha.current_antardasha.start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            {' \u2014 '}
            {new Date(dasha.current_antardasha.end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </div>
        </motion.div>
      )}

      <SectionDivider />

      {/* ═══ 4. Alert Cards — Top 3 + Expandable Remaining ═══ */}
      {hasAlerts && (
        <motion.section variants={stagger} initial="hidden" animate="show" className="space-y-3">
          {/* Top 3 full alert cards */}
          {topAlerts.map((alert, i) => (
            <AlertCard key={`${alert.planet}-${alert.house}`} alert={alert} index={i} />
          ))}

          {/* Remaining planet transits as mini-cards */}
          {remainingPlanets.length > 0 && (
            <>
              <button
                onClick={() => setShowAllAlerts(!showAllAlerts)}
                className="flex items-center gap-2 text-sm text-violet-light hover:text-star transition-colors cursor-pointer pt-2"
              >
                <span className="font-medium">
                  {showAllAlerts ? 'Hide Additional Transits' : `Show ${remainingPlanets.length} More Transit${remainingPlanets.length > 1 ? 's' : ''}`}
                </span>
                <ChevronIcon open={showAllAlerts} />
              </button>

              <AnimatePresence initial={false}>
                {showAllAlerts && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      variants={stagger}
                      initial="hidden"
                      animate="show"
                      className="space-y-2 pt-1"
                    >
                      {remainingPlanets.map(interp => (
                        <MiniAlertCard key={interp.planet} interp={interp} />
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.section>
      )}

      <SectionDivider />

      {/* ═══ 5. Life Area Scores (compact 4-column) ═══ */}
      {highImpact?.life_scores && (
        <motion.section variants={fadeUp}>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          >
            {LIFE_AREA_ORDER.map(area => (
              <motion.div key={area} variants={fadeUp}>
                <LifeScoreCard area={area} score={highImpact.life_scores[area]} />
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}

      <SectionDivider />

      {/* ═══ 6. Upcoming Shifts Timeline ═══ */}
      {timeline.length > 0 && (
        <motion.section variants={fadeUp}>
          <h2 className="text-star font-display text-lg mb-4">Upcoming Shifts</h2>
          <div className="space-y-0">
            {timeline.map((entry, i) => (
              <div key={`${entry.planet}-${entry.start}`} className="flex gap-4 items-start">
                {/* Vertical line + dot */}
                <div className="flex flex-col items-center pt-1.5">
                  <TimelineDot nature={entry.nature} />
                  {i < timeline.length - 1 && (
                    <div className="w-px flex-1 bg-white/10 min-h-[32px]" />
                  )}
                </div>
                {/* Content */}
                <div className="pb-5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-star text-sm font-semibold">
                      <span className="text-violet-light mr-1">{PLANET_GLYPHS[entry.planet] ?? ''}</span>
                      {entry.planet}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wide font-medium rounded-full px-2 py-0.5 ${
                      entry.nature === 'favorable'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : entry.nature === 'challenging'
                          ? 'bg-rose/15 text-rose'
                          : 'bg-yellow-400/15 text-yellow-400'
                    }`}>
                      {entry.nature}
                    </span>
                  </div>
                  <p className="text-muted text-xs mb-0.5">{entry.description}</p>
                  <p className="text-muted/60 text-[11px]">
                    {new Date(entry.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' \u2014 '}
                    {new Date(entry.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      <SectionDivider />

      {/* ═══ 6b. Upcoming Yogas — All Types ═══ */}
      {futureYogas && (futureYogas.currently_active.length > 0 || futureYogas.timeline.length > 0 || futureYogas.sade_sati?.currently_active) && (
        <motion.section variants={fadeUp} className="space-y-4">
          <h2 className="text-star font-display text-lg mb-2">Upcoming Yogas</h2>

          {/* Sade Sati prominent card — if active */}
          {futureYogas.sade_sati?.currently_active && (
            <div
              className="relative rounded-xl p-5 border border-indigo-500/30 bg-indigo-500/5"
              style={{ boxShadow: '0 0 24px 2px rgba(99, 102, 241, 0.15)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-indigo-400 text-lg">{PLANET_GLYPHS.Saturn}</span>
                <span className="text-indigo-300 font-display font-semibold text-base">Sade Sati</span>
                <span className="ml-auto text-[10px] uppercase tracking-widest font-bold rounded-full px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {futureYogas.sade_sati.current_phase} phase
                </span>
              </div>
              {futureYogas.sade_sati.current_phase && futureYogas.sade_sati.phase_details[futureYogas.sade_sati.current_phase] && (
                <p className="text-star/80 text-sm leading-relaxed mb-2">
                  {futureYogas.sade_sati.phase_details[futureYogas.sade_sati.current_phase].description}
                </p>
              )}
              <div className="mt-3 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
                <p className="text-indigo-300 text-xs font-medium mb-1.5">Remedies</p>
                <p className="text-muted text-xs leading-relaxed">
                  <span className="text-star/70">Mantra:</span> {futureYogas.sade_sati.remedies.mantra}<br />
                  <span className="text-star/70">Practice:</span> {futureYogas.sade_sati.remedies.practice}<br />
                  <span className="text-star/70">Charity:</span> {futureYogas.sade_sati.remedies.charity}
                </p>
              </div>
            </div>
          )}

          {/* Currently active yogas (non-Sade Sati) */}
          {futureYogas.currently_active.filter(y => y.yoga !== 'Sade Sati').map((y, i) => {
            const style = YOGA_CATEGORY_STYLES[y.category || 'opportunity']
            return (
              <div
                key={`active-${i}`}
                className={`relative rounded-xl p-5 border ${style.border} ${style.bg}`}
                style={{ boxShadow: `0 0 24px 2px ${style.glow}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`${style.text} text-lg`}>{YOGA_GLYPH[y.yoga] || PLANET_GLYPHS.Jupiter}</span>
                  <span className={`${style.text} font-display font-semibold text-base`}>{y.yoga}</span>
                  <span className={`ml-auto text-[10px] uppercase tracking-widest font-bold rounded-full px-3 py-1 ${style.badge}`}>
                    Active Now
                  </span>
                </div>
                <p className="text-star/80 text-sm leading-relaxed mb-2">{y.description}</p>
                <p className="text-muted text-xs">
                  {y.start_date} to {y.end_date}
                  {y.jupiter_sign ? ` · Jupiter in ${y.jupiter_sign} (${y.kendra_house}th from Moon)` : ''}
                </p>
              </div>
            )
          })}

          {/* Timeline — all upcoming yoga events */}
          {futureYogas.timeline.length > 0 && (
            <div className="space-y-3">
              {futureYogas.timeline.filter(e => e.start_date > new Date().toISOString().slice(0, 10)).slice(0, 6).map((y, i) => {
                const style = YOGA_CATEGORY_STYLES[y.category || 'opportunity']
                return (
                  <div
                    key={`timeline-${i}`}
                    className="rounded-xl p-4 border border-white/5 bg-cosmos hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`${style.text} text-base`}>{YOGA_GLYPH[y.yoga] || '\u2728'}</span>
                      <span className="text-star font-display text-sm font-semibold">{y.yoga}</span>
                      <span className={`ml-auto text-[10px] uppercase tracking-wide font-medium rounded-full px-2 py-0.5 ${style.badge}`}>
                        {y.category || 'transit'}
                      </span>
                    </div>
                    <p className="text-muted text-xs mb-1">{y.description}</p>
                    <p className="text-muted/60 text-[11px]">
                      {new Date(y.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' \u2014 '}
                      {new Date(y.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </motion.section>
      )}

      <SectionDivider />

      {/* ═══ 7. Your Complete Reading ═══ */}
      {interpreted && (
        <motion.section variants={fadeUp} className="space-y-8">
          <h2 className="font-display text-lg text-star/70 tracking-wide">Your Complete Reading</h2>

          {/* ── 2-Column Layout: At a Glance + How Today Affects You ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Left Column: Planet at a Glance ── */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full bg-violet-light/60" />
                <h3 className="text-star font-display text-base">Planet at a Glance</h3>
              </div>
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3"
              >
                {interpreted.planet_interpretations.map(interp => {
                  const glyph = PLANET_GLYPHS[interp.planet] ?? ''
                  const isFav = interp.is_favorable
                  const borderColor = isFav ? 'border-l-emerald-500/50' : 'border-l-rose/50'
                  const planet = transits.planets.find(p => p.name === interp.planet)
                  const houseTheme = HOUSE_THEMES[interp.house] ?? `House ${interp.house}`
                  const primaryLifeArea = interp.life_areas[0] ?? houseTheme

                  return (
                    <motion.div
                      key={interp.planet}
                      variants={fadeUp}
                      className={`bg-cosmos rounded-xl p-4 border border-white/5 border-l-2 ${borderColor} hover:border-white/10 transition-colors group`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-violet-light text-lg">{glyph}</span>
                          <span className="text-star text-sm font-semibold">{interp.planet}</span>
                          {planet?.retrograde && (
                            <span className="bg-amber-500/20 text-amber-400 text-[9px] rounded-full px-1.5 py-0.5 font-semibold leading-none">Rx</span>
                          )}
                        </div>
                      </div>
                      <p className="text-violet-light/80 text-xs mb-1.5">
                        {interp.house}{interp.house === 1 ? 'st' : interp.house === 2 ? 'nd' : interp.house === 3 ? 'rd' : 'th'} House{' \u00B7 '}{primaryLifeArea}
                      </p>
                      <span className={`inline-block text-[10px] uppercase tracking-wide font-medium rounded-full px-2.5 py-0.5 mb-2 ${
                        isFav ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose/15 text-rose'
                      }`}>
                        {isFav ? 'Supportive' : 'Challenging'}
                      </span>
                      <p className="text-muted text-xs leading-relaxed line-clamp-2">
                        &ldquo;{interp.summary}&rdquo;
                      </p>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>

            {/* ── Right Column: How Today Affects You ── */}
            {personal && personal.transit_aspects.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 rounded-full bg-violet-light/60" />
                  <h3 className="text-star font-display text-base">How Today Affects You</h3>
                </div>
                <motion.div
                  variants={stagger}
                  initial="hidden"
                  animate="show"
                  className="space-y-3"
                >
                  {personal.transit_aspects
                    .filter(asp => !FAST_MOVERS.has(asp.transit_planet) || asp.orb <= 2)
                    .sort((a, b) => a.orb - b.orb)
                    .slice(0, 6)
                    .map((asp, i) => {
                      const meaning = ASPECT_MEANINGS[asp.aspect_type]
                      const fallbackLabel = ASPECT_LABELS[asp.aspect_type]
                      const keyword = meaning?.keyword ?? fallbackLabel?.label ?? asp.aspect_type
                      const icon = meaning?.icon ?? ''
                      const colorClass = meaning?.color ?? fallbackLabel?.color ?? 'text-muted'
                      const bgClass = meaning?.bgColor ?? 'bg-white/5 border-white/10'
                      const explanation = meaning?.effect(asp.transit_planet, asp.natal_planet)
                        ?? `${asp.transit_planet} forms a ${asp.aspect_type} to your natal ${asp.natal_planet}.`
                      const transitGlyph = PLANET_GLYPHS[asp.transit_planet] ?? ''
                      const natalGlyph = PLANET_GLYPHS[asp.natal_planet] ?? ''

                      return (
                        <motion.div
                          key={i}
                          variants={fadeUp}
                          className={`rounded-xl border px-5 py-4 ${bgClass} hover:border-white/15 transition-colors`}
                        >
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-violet-light text-base">{transitGlyph}</span>
                            <span className="text-star text-sm font-medium">{asp.transit_planet}</span>
                            <span className="text-muted text-xs">&rarr;</span>
                            <span className="text-violet-light text-base">{natalGlyph}</span>
                            <span className="text-star text-sm font-medium">{asp.natal_planet}</span>
                            <span className={`ml-auto text-xs font-medium ${colorClass} flex items-center gap-1`}>
                              <span>{icon}</span> {keyword}
                            </span>
                          </div>
                          <p className="text-muted text-sm leading-relaxed">
                            {explanation}
                          </p>
                        </motion.div>
                      )
                    })}
                </motion.div>
              </div>
            )}
          </div>

          {/* ── Full-Width: Vedha Warnings ── */}
          {personal && personal.vedha_flags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full bg-amber-400/60" />
                <h3 className="text-star font-display text-base">Temporary Blocks to Watch</h3>
              </div>
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                {personal.vedha_flags.map((v, i) => {
                  const blockerGlyph = PLANET_GLYPHS[v.obstructed_by] ?? ''
                  const planetGlyph = PLANET_GLYPHS[v.planet] ?? ''
                  const houseTheme = HOUSE_THEMES[v.favorable_house] ?? `House ${v.favorable_house}`
                  const duration = VEDHA_DURATION[v.obstructed_by] ?? 'some time'
                  const isMoonBlock = v.obstructed_by === 'Moon'

                  return (
                    <motion.div
                      key={i}
                      variants={fadeUp}
                      className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-5 py-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-amber-400 text-base">{planetGlyph}</span>
                        <span className="text-star text-sm font-medium">{v.planet} in {houseTheme}</span>
                        <span className="text-amber-400/60 text-xs ml-auto">Blocked by {blockerGlyph} {v.obstructed_by}</span>
                      </div>
                      <p className="text-muted text-sm leading-relaxed mb-2">
                        {v.description
                          ? v.description
                          : `Your ${houseTheme.toLowerCase()} gains from ${v.planet} are partially blocked right now. ${v.obstructed_by}'s position creates a temporary interference.`}
                      </p>
                      <p className={`text-xs ${isMoonBlock ? 'text-emerald-400/80' : 'text-amber-400/80'}`}>
                        {isMoonBlock
                          ? `This clears quickly as the Moon moves on (within ${duration}).`
                          : `This influence lasts approximately ${duration}. Plan accordingly.`}
                      </p>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          )}

          {/* ── Detailed Planet Readings (expandable) ── */}
          {interpreted.planet_interpretations.length > 0 && (
            <div>
              <button
                onClick={() => setDetailOpen(!detailOpen)}
                className="group flex items-center gap-2 text-sm text-violet-light hover:text-star transition-colors cursor-pointer w-full"
              >
                <span className="font-display text-base">
                  {detailOpen ? 'Hide Detailed Planet Readings' : 'Read Full Planet Interpretations'}
                </span>
                <ChevronIcon open={detailOpen} />
              </button>

              <AnimatePresence initial={false}>
                {detailOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <motion.div
                      variants={stagger}
                      initial="hidden"
                      animate="show"
                      className="space-y-3 pt-4"
                    >
                      {interpreted.planet_interpretations.map((interp, i) => (
                        <PlanetCard key={interp.planet} interp={interp} defaultOpen={i === 0} />
                      ))}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.section>
      )}

      {/* ═══ Fallback: No interpreted data — show planet grid + personal aspects directly ═══ */}
      {!interpreted && (
        <>
          {/* Planet Position Grid */}
          <motion.section variants={fadeUp}>
            <div className="border-t border-white/5 pt-8">
              <h2 className="text-star font-display text-lg mb-1">Planetary Positions</h2>
              <p className="text-muted text-xs mb-4">Current sidereal positions of all planets</p>
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                {transits.planets.map(planet => (
                  <motion.div
                    key={planet.name}
                    variants={fadeUp}
                    className="bg-cosmos border border-white/5 rounded-xl p-4 hover:border-violet/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <p className="text-star font-semibold text-sm">
                        <span className="text-violet-light mr-1.5">{PLANET_GLYPHS[planet.name] ?? ''}</span>
                        {planet.name}
                      </p>
                      {planet.retrograde && (
                        <span className="bg-rose/20 text-rose text-[10px] rounded-full px-2 py-0.5 font-medium">
                          Rx
                        </span>
                      )}
                    </div>
                    <p className="text-violet-light text-xs">
                      {planet.sign} {planet.degree.toFixed(1)}&deg;
                    </p>
                    <p className="text-muted text-[11px] mt-0.5">
                      {planet.nakshatra} &middot; Pada {planet.pada}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.section>

          {/* Personal Aspects (fallback) */}
          {personal && (
            <motion.section variants={fadeUp} className="border-t border-white/5 pt-8 space-y-8">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <h2 className="text-star font-display text-lg mb-0.5">Your Personal Transits</h2>
                  <p className="text-muted text-xs">How today&apos;s sky aspects your natal chart</p>
                </div>
                {murthi && (
                  <span className={`text-xs font-medium rounded-full px-3 py-1 ${murthi.bg}`}>
                    {murthi.label}
                  </span>
                )}
              </div>

              {personal.transit_aspects.length > 0 && (
                <div>
                  <h3 className="text-star text-sm font-semibold mb-3">Transit Aspects</h3>
                  <div className="bg-cosmos border border-white/5 rounded-xl divide-y divide-white/5 overflow-hidden">
                    {personal.transit_aspects.map((asp, i) => {
                      const aspectInfo = ASPECT_LABELS[asp.aspect_type] ?? { label: asp.aspect_type, color: 'text-muted' }
                      return (
                        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                          <span className="text-star text-sm font-medium w-20 shrink-0">{asp.transit_planet}</span>
                          <span className={`text-xs font-medium ${aspectInfo.color}`}>{aspectInfo.label}</span>
                          <span className="text-muted text-xs">&rarr;</span>
                          <span className="text-star text-sm">{asp.natal_planet}</span>
                          <span className="text-muted text-xs ml-auto">{asp.orb.toFixed(1)}&deg; orb</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {personal.vedha_flags.length > 0 && (
                <div>
                  <h3 className="text-star text-sm font-semibold mb-3">Vedha Obstructions</h3>
                  <div className="space-y-3">
                    {personal.vedha_flags.map((v, i) => (
                      <div key={i} className="bg-rose/10 border border-rose/20 rounded-xl px-5 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-rose text-sm font-semibold">{v.planet}</span>
                          <span className="text-muted text-xs">
                            House {v.favorable_house} obstructed by {v.obstructed_by}
                          </span>
                        </div>
                        <p className="text-muted text-xs">{v.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.section>
          )}
        </>
      )}
    </motion.div>
  )
}
