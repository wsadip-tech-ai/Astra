'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
}

/* ─── Constants ─── */

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

const LIFE_AREA_ICONS: Record<string, React.ReactNode> = {
  'Finance & Career': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
    </svg>
  ),
  'Relationships & Family': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  'Health & Wellbeing': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  ),
  'Spirituality & Growth': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
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

/* ─── Alert Card ─── */

function AlertCard({ alert, index }: { alert: HighImpactAlert; index: number }) {
  const [remedyOpen, setRemedyOpen] = useState(false)
  const isFavorable = alert.is_favorable
  const stripColor = isFavorable ? 'bg-emerald-500' : 'bg-rose'
  const glowColor = isFavorable ? 'bg-emerald-500/5' : 'bg-rose/5'

  return (
    <motion.div
      variants={slideIn}
      custom={index}
      className={`relative rounded-xl overflow-hidden border border-white/5 ${glowColor}`}
    >
      {/* Left color strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${stripColor}`} />

      <div className="pl-5 pr-5 py-5">
        {/* Headline */}
        <h3 className="font-display text-lg text-star leading-snug mb-2">
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

/* ─── Life Score Card ─── */

function LifeScoreCard({ area, score }: { area: string; score: LifeScore | undefined }) {
  const icon = LIFE_AREA_ICONS[area]
  const outlook = score?.outlook?.toLowerCase() ?? 'mixed'
  const dotColor = outlook === 'favorable' ? 'bg-emerald-400' : outlook === 'challenging' ? 'bg-rose' : 'bg-yellow-400'

  return (
    <div className="bg-nebula rounded-xl p-4 border border-white/5 hover:border-violet/15 transition-colors">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="text-violet-light/70">{icon}</div>
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

  return (
    <motion.div
      variants={fadeUp}
      className={`bg-cosmos rounded-xl p-4 border-l-2 ${borderColor} border border-l-2 border-white/5`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-star font-semibold text-sm">{interp.planet}</h4>
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

export default function TransitView({ transits, personal, interpreted, dasha, upcomingAntardashas }: TransitViewProps) {
  const [detailOpen, setDetailOpen] = useState(false)

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
  const hasAlerts = highImpact && highImpact.alerts && highImpact.alerts.length > 0

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
      {/* ═══ 1. Compact Header ═══ */}
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

      {/* ═══ 2. Alert Cards (TOP PRIORITY) ═══ */}
      {hasAlerts && (
        <motion.section variants={stagger} initial="hidden" animate="show" className="space-y-3">
          {highImpact.alerts.map((alert, i) => (
            <AlertCard key={`${alert.planet}-${alert.house}`} alert={alert} index={i} />
          ))}
        </motion.section>
      )}

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

      {/* ═══ 4. Life Area Scores (compact 4-column) ═══ */}
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

      {/* ═══ 5. Upcoming Shifts Timeline ═══ */}
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
                    <span className="text-star text-sm font-semibold">{entry.planet}</span>
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

      {/* ═══ 6. Full Analysis Toggle ═══ */}
      {interpreted && (
        <motion.section variants={fadeUp}>
          <button
            onClick={() => setDetailOpen(!detailOpen)}
            className="group flex items-center gap-2 text-sm text-violet-light hover:text-star transition-colors cursor-pointer w-full border-t border-white/5 pt-6"
          >
            <span className="font-display text-lg">
              {detailOpen ? 'Hide Detailed Analysis' : 'View Detailed Planet Analysis'}
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${detailOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
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
                <div className="space-y-10 pt-6">
                  {/* Per-planet interpretation cards */}
                  {interpreted.planet_interpretations.length > 0 && (
                    <div>
                      <h3 className="text-star font-display text-base mb-3">Planet Readings</h3>
                      <motion.div
                        variants={stagger}
                        initial="hidden"
                        animate="show"
                        className="space-y-3"
                      >
                        {interpreted.planet_interpretations.map((interp, i) => (
                          <PlanetCard key={interp.planet} interp={interp} defaultOpen={i === 0} />
                        ))}
                      </motion.div>
                    </div>
                  )}

                  {/* Planet Position Grid */}
                  <div>
                    <h3 className="text-star font-display text-base mb-1">Planetary Positions</h3>
                    <p className="text-muted text-xs mb-4">Current sidereal positions</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {transits.planets.map(planet => (
                        <div
                          key={planet.name}
                          className="bg-cosmos border border-white/5 rounded-xl p-4 hover:border-violet/20 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-1.5">
                            <p className="text-star font-semibold text-sm">{planet.name}</p>
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
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Personal Aspects */}
                  {personal && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-star font-display text-base mb-0.5">Your Personal Transits</h3>
                        <p className="text-muted text-xs">How today&apos;s sky aspects your natal chart</p>
                      </div>

                      {personal.transit_aspects.length > 0 && (
                        <div>
                          <h4 className="text-star text-sm font-semibold mb-3">Transit Aspects</h4>
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
                          <h4 className="text-star text-sm font-semibold mb-3">Vedha Obstructions</h4>
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
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                      <p className="text-star font-semibold text-sm">{planet.name}</p>
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
