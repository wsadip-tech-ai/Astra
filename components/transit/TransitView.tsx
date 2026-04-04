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
}

/* ─── Constants ─── */

const ELEMENT_COLORS: Record<string, string> = {
  Fire: 'bg-orange-500/20 text-orange-300',
  Earth: 'bg-emerald-500/20 text-emerald-300',
  Air: 'bg-sky-500/20 text-sky-300',
  Water: 'bg-blue-500/20 text-blue-300',
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

const OUTLOOK_STYLES: Record<string, string> = {
  favorable: 'bg-green-500/15 text-green-400',
  challenging: 'bg-rose/15 text-rose',
  mixed: 'bg-yellow-400/15 text-yellow-400',
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
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
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

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' as const } },
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

function OutlookBadge({ outlook, size = 'sm' }: { outlook: string; size?: 'sm' | 'md' }) {
  const key = outlook.toLowerCase()
  const style = OUTLOOK_STYLES[key] ?? OUTLOOK_STYLES.mixed
  const label = key.charAt(0).toUpperCase() + key.slice(1)
  const sizeClass = size === 'md' ? 'text-sm px-4 py-1.5' : 'text-xs px-3 py-1'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${style} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${key === 'favorable' ? 'bg-green-400' : key === 'challenging' ? 'bg-rose' : 'bg-yellow-400'}`} />
      {label}
    </span>
  )
}

function FavorableIndicator({ count, type }: { count: number; type: 'favorable' | 'challenging' }) {
  const isFav = type === 'favorable'
  return (
    <div className={`flex items-center gap-2 ${isFav ? 'text-green-400' : 'text-rose'}`}>
      {isFav ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      )}
      <span className="text-sm font-medium">{count}</span>
      <span className="text-xs text-muted">{isFav ? 'Supportive' : 'Challenging'}</span>
    </div>
  )
}

function PlanetCard({ interp, defaultOpen = false }: { interp: PlanetInterpretation; defaultOpen?: boolean }) {
  const [expanded, setExpanded] = useState(defaultOpen)
  const borderColor = interp.is_favorable ? 'border-l-green-500/30' : 'border-l-rose/30'

  return (
    <motion.div
      variants={fadeUp}
      className={`bg-cosmos rounded-xl p-4 border-l-2 ${borderColor} border border-l-2 border-white/5`}
    >
      {/* Planet Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div>
            <h4 className="text-star font-semibold text-sm">{interp.planet}</h4>
            <p className="text-violet-light text-xs">
              {interp.sign} &middot; House {interp.house}
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${
            interp.is_favorable ? 'bg-green-500/15 text-green-400' : 'bg-rose/15 text-rose'
          }`}
        >
          {interp.is_favorable ? 'Supportive' : 'Challenging'}
        </span>
      </div>

      {/* Summary */}
      <p className="text-muted text-sm leading-relaxed mb-3">{interp.summary}</p>

      {/* Life area tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {interp.life_areas.map(area => (
          <span key={area} className="text-[11px] text-violet-light bg-violet/10 rounded-full px-2.5 py-0.5">
            {area}
          </span>
        ))}
      </div>

      {/* Retrograde note */}
      {interp.retrograde_note && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3.5 py-2.5 mb-3">
          <p className="text-amber-400 text-xs font-medium mb-0.5">Retrograde Effect</p>
          <p className="text-amber-300/80 text-xs leading-relaxed">{interp.retrograde_note}</p>
        </div>
      )}

      {/* Dasha connection */}
      {interp.dasha_connection && (
        <div className="bg-violet/10 border border-violet/20 rounded-lg px-3.5 py-2.5 mb-3">
          <p className="text-violet-light text-xs font-medium mb-0.5">Dasha Connection</p>
          <p className="text-violet-light/70 text-xs leading-relaxed">{interp.dasha_connection}</p>
        </div>
      )}

      {/* Expand/Collapse */}
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

/* ─── Main Component ─── */

export default function TransitView({ transits, personal, interpreted, dasha }: TransitViewProps) {
  const [showAllPlanets, setShowAllPlanets] = useState(false)

  const dateFormatted = new Date(transits.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const elementClass = ELEMENT_COLORS[transits.dominant_element] ?? 'bg-violet/20 text-violet-light'
  const murthi = personal?.murthi_nirnaya
    ? MURTHI_STYLES[personal.murthi_nirnaya] ?? MURTHI_STYLES.Iron
    : null

  const hasInterpreted = !!interpreted

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      {/* ═══ 1. Header ═══ */}
      <motion.div variants={fadeUp}>
        <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          Planetary Transits
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-star mb-3">
          Today&apos;s Cosmic Sky
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-muted text-sm">{dateFormatted}</p>
          <span className={`text-xs font-medium rounded-full px-3 py-1 ${elementClass}`}>
            {transits.dominant_element} dominant
          </span>
          {hasInterpreted && (
            <OutlookBadge
              outlook={
                interpreted.favorable_count > interpreted.challenging_count
                  ? 'favorable'
                  : interpreted.challenging_count > interpreted.favorable_count
                    ? 'challenging'
                    : 'mixed'
              }
              size="sm"
            />
          )}
        </div>
      </motion.div>

      {/* ═══ 2. Overall Outlook Card ═══ */}
      {hasInterpreted && (
        <motion.div
          variants={scaleIn}
          className="bg-nebula rounded-xl p-6 border border-white/5 relative overflow-hidden"
        >
          {/* Subtle glow accent */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative">
            <h2 className="text-star font-display text-lg mb-3">Overall Outlook</h2>
            <p className="text-muted text-sm leading-relaxed mb-5">{interpreted.overall_outlook}</p>

            <div className="flex flex-wrap items-center gap-6">
              <FavorableIndicator count={interpreted.favorable_count} type="favorable" />
              <FavorableIndicator count={interpreted.challenging_count} type="challenging" />

              {/* Divider */}
              <div className="hidden sm:block w-px h-6 bg-white/10" />

              {/* Murthi badge */}
              {murthi && (
                <span className={`text-xs font-medium rounded-full px-3 py-1 ${murthi.bg}`}>
                  {murthi.label}
                </span>
              )}
            </div>

            {/* Dasha period */}
            {dasha && (
              <div className="mt-5 pt-4 border-t border-white/5">
                <p className="text-xs text-muted mb-2 font-medium uppercase tracking-wider">Current Dasha Period</p>
                <div className="flex flex-wrap gap-3">
                  <span className="text-xs bg-violet/15 text-violet-light rounded-full px-3 py-1">
                    Mahadasha: {dasha.current_mahadasha.planet}
                  </span>
                  <span className="text-xs bg-violet/10 text-violet-light/80 rounded-full px-3 py-1">
                    Antardasha: {dasha.current_antardasha.planet}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ 3. Life Area Summary Cards ═══ */}
      {hasInterpreted && (
        <motion.section variants={fadeUp}>
          <h2 className="text-star font-display text-lg mb-4">Life Areas</h2>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {LIFE_AREA_ORDER.map(area => {
              const data = interpreted.life_area_summary[area]
              const icon = LIFE_AREA_ICONS[area]

              return (
                <motion.div
                  key={area}
                  variants={fadeUp}
                  className="bg-nebula rounded-xl p-5 border border-white/5 hover:border-violet/15 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="text-violet-light/70">{icon}</div>
                      <h3 className="text-star text-sm font-semibold">{area}</h3>
                    </div>
                    {data && <OutlookBadge outlook={data.outlook} />}
                  </div>

                  {data && data.planets.length > 0 ? (
                    <ul className="space-y-2.5">
                      {data.planets.map(p => (
                        <li key={p.planet} className="flex items-start gap-2">
                          <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                            p.tone === 'supportive' || p.tone === 'favorable'
                              ? 'bg-green-400'
                              : p.tone === 'challenging'
                                ? 'bg-rose'
                                : 'bg-yellow-400'
                          }`} />
                          <div>
                            <span className="text-star text-xs font-medium">{p.planet}</span>
                            <span className="text-muted text-xs"> &middot; House {p.house}</span>
                            <p className="text-muted text-xs leading-relaxed mt-0.5">{p.summary}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted/60 text-xs italic">No significant transits in this area</p>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        </motion.section>
      )}

      {/* ═══ 4. Detailed Planet Interpretations ═══ */}
      {hasInterpreted && interpreted.planet_interpretations.length > 0 && (
        <motion.section variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-star font-display text-lg">Detailed Planet Readings</h2>
            <button
              onClick={() => setShowAllPlanets(!showAllPlanets)}
              className="text-xs text-violet-light hover:text-violet transition-colors cursor-pointer"
            >
              {showAllPlanets ? 'Collapse all' : 'Show all'}
            </button>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {interpreted.planet_interpretations.map((interp, i) => (
              <PlanetCard key={interp.planet} interp={interp} defaultOpen={showAllPlanets || i === 0} />
            ))}
          </motion.div>
        </motion.section>
      )}

      {/* ═══ 5. Planet Position Grid (reference) ═══ */}
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

      {/* ═══ 6. Personal Aspects ═══ */}
      {personal && (
        <motion.section
          variants={fadeUp}
          className="border-t border-white/5 pt-8 space-y-8"
        >
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <h2 className="text-star font-display text-lg mb-0.5">Your Personal Transits</h2>
              <p className="text-muted text-xs">
                How today&apos;s sky aspects your natal chart
              </p>
            </div>
            {!hasInterpreted && murthi && (
              <span className={`text-xs font-medium rounded-full px-3 py-1 ${murthi.bg}`}>
                {murthi.label}
              </span>
            )}
          </div>

          {/* Transit Aspects */}
          {personal.transit_aspects.length > 0 && (
            <div>
              <h3 className="text-star text-sm font-semibold mb-3">Transit Aspects</h3>
              <div className="bg-cosmos border border-white/5 rounded-xl divide-y divide-white/5 overflow-hidden">
                {personal.transit_aspects.map((asp, i) => {
                  const aspectInfo = ASPECT_LABELS[asp.aspect_type] ?? {
                    label: asp.aspect_type,
                    color: 'text-muted',
                  }
                  return (
                    <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                      <span className="text-star text-sm font-medium w-20 shrink-0">
                        {asp.transit_planet}
                      </span>
                      <span className={`text-xs font-medium ${aspectInfo.color}`}>
                        {aspectInfo.label}
                      </span>
                      <span className="text-muted text-xs">&rarr;</span>
                      <span className="text-star text-sm">{asp.natal_planet}</span>
                      <span className="text-muted text-xs ml-auto">
                        {asp.orb.toFixed(1)}&deg; orb
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Vedha Flags */}
          {personal.vedha_flags.length > 0 && (
            <div>
              <h3 className="text-star text-sm font-semibold mb-3">Vedha Obstructions</h3>
              <div className="space-y-3">
                {personal.vedha_flags.map((v, i) => (
                  <div
                    key={i}
                    className="bg-rose/10 border border-rose/20 rounded-xl px-5 py-4"
                  >
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
    </motion.div>
  )
}
