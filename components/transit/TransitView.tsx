'use client'

import { motion } from 'framer-motion'

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
}

const ELEMENT_COLORS: Record<string, string> = {
  Fire: 'bg-orange-500/20 text-orange-300',
  Earth: 'bg-emerald-500/20 text-emerald-300',
  Air: 'bg-sky-500/20 text-sky-300',
  Water: 'bg-blue-500/20 text-blue-300',
}

const MURTHI_STYLES: Record<string, string> = {
  Gold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Silver: 'bg-gray-400/20 text-gray-300 border-gray-400/30',
  Copper: 'bg-orange-400/20 text-orange-400 border-orange-400/30',
  Iron: 'bg-gray-600/20 text-muted border-gray-600/30',
}

const ASPECT_LABELS: Record<string, { label: string; color: string }> = {
  conjunction: { label: 'Conjunction', color: 'text-violet-light' },
  trine: { label: 'Trine', color: 'text-emerald-400' },
  square: { label: 'Square', color: 'text-rose' },
  opposition: { label: 'Opposition', color: 'text-orange-400' },
  sextile: { label: 'Sextile', color: 'text-sky-400' },
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

export default function TransitView({ transits, personal }: TransitViewProps) {
  const dateFormatted = new Date(transits.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const elementClass = ELEMENT_COLORS[transits.dominant_element] ?? 'bg-violet/20 text-violet-light'

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
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
        </div>
      </div>

      {/* Planet Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {transits.planets.map(planet => (
          <motion.div
            key={planet.name}
            variants={item}
            className="bg-cosmos border border-white/5 rounded-2xl p-5 hover:border-violet/20 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-star font-semibold">{planet.name}</p>
              {planet.retrograde && (
                <span className="bg-rose/20 text-rose text-xs rounded-full px-2 py-0.5 font-medium">
                  Rx
                </span>
              )}
            </div>
            <p className="text-violet-light text-sm">
              {planet.sign} {planet.degree.toFixed(1)}&deg;
            </p>
            <p className="text-muted text-xs mt-1">
              {planet.nakshatra} &middot; Pada {planet.pada}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Personal Section */}
      {personal && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-8"
        >
          <div className="border-t border-white/5 pt-10">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div>
                <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-1">
                  Your Personal Transits
                </p>
                <p className="text-muted text-xs">
                  How today&apos;s sky aspects your natal chart
                </p>
              </div>
              {personal.murthi_nirnaya && (
                <span
                  className={`text-xs font-medium rounded-full px-3 py-1 border ${
                    MURTHI_STYLES[personal.murthi_nirnaya] ?? MURTHI_STYLES.Iron
                  }`}
                >
                  {personal.murthi_nirnaya} Murthi
                </span>
              )}
            </div>

            {/* Transit Aspects */}
            {personal.transit_aspects.length > 0 && (
              <div className="mb-8">
                <h3 className="text-star text-sm font-semibold mb-3">Transit Aspects</h3>
                <div className="bg-cosmos border border-white/5 rounded-2xl divide-y divide-white/5 overflow-hidden">
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
          </div>
        </motion.div>
      )}
    </div>
  )
}
