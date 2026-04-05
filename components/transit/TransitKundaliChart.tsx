'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ───────────────────────── Types ───────────────────────── */

interface TransitPlanetData {
  name: string
  sign: string
  degree: number
  nakshatra: string
  retrograde: boolean
}

interface NatalHouseData {
  number: number
  sign: string
  lord: string
}

interface InterpretedPlanetData {
  planet: string
  is_favorable: boolean
  tone: string
}

interface TransitKundaliChartProps {
  transitPlanets: TransitPlanetData[]
  transitHouses: Record<string, number>
  natalHouses?: NatalHouseData[]
  onHouseClick?: (house: number) => void
  selectedHouse?: number | null
  interpretedPlanets?: InterpretedPlanetData[]
}

/* ───────────────────────── Constants ───────────────────── */

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃',
  Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
}

const SIGN_ABBR: Record<string, string> = {
  Aries: 'Ar', Taurus: 'Ta', Gemini: 'Ge', Cancer: 'Cn',
  Leo: 'Le', Virgo: 'Vi', Libra: 'Li', Scorpio: 'Sc',
  Sagittarius: 'Sg', Capricorn: 'Cp', Aquarius: 'Aq', Pisces: 'Pi',
  Mesha: 'Ar', Vrishabha: 'Ta', Mithuna: 'Ge', Karka: 'Cn',
  Simha: 'Le', Kanya: 'Vi', Tula: 'Li', Vrischika: 'Sc',
  Dhanu: 'Sg', Makara: 'Cp', Kumbha: 'Aq', Meena: 'Pi',
}

const ZODIAC_ORDER = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

/* North Indian diamond house polygons */
const HOUSE_POLYGONS: Record<number, string> = {
  1:  '200,0 100,100 200,200 300,100',
  2:  '0,0 100,100 200,0',
  3:  '0,0 100,100 0,200',
  4:  '0,200 100,100 200,200 100,300',
  5:  '0,200 100,300 0,400',
  6:  '0,400 100,300 200,400',
  7:  '200,400 100,300 200,200 300,300',
  8:  '200,400 300,300 400,400',
  9:  '400,400 300,300 400,200',
  10: '400,200 300,300 200,200 300,100',
  11: '400,200 300,100 400,0',
  12: '400,0 300,100 200,0',
}

const HOUSE_CENTERS: Record<number, [number, number]> = {
  1: [200, 75],   2: [90, 50],    3: [40, 140],
  4: [75, 200],   5: [40, 265],   6: [90, 355],
  7: [200, 325],  8: [310, 355],  9: [360, 265],
  10: [325, 200], 11: [360, 140], 12: [310, 50],
}

const CHART_LINES: [number, number, number, number][] = [
  [200, 0, 400, 200], [400, 200, 200, 400],
  [200, 400, 0, 200], [0, 200, 200, 0],
  [0, 0, 200, 200], [400, 0, 200, 200],
  [400, 400, 200, 200], [0, 400, 200, 200],
]

/* ───────────────────────── Helpers ───────────────────────── */

/** Derive house signs from Moon sign (Moon = house 1, next sign = house 2, etc.) */
function deriveHouseSigns(moonSign: string): Record<number, string> {
  const idx = ZODIAC_ORDER.indexOf(moonSign)
  if (idx === -1) return {}
  const map: Record<number, string> = {}
  for (let h = 1; h <= 12; h++) {
    map[h] = ZODIAC_ORDER[(idx + h - 1) % 12]
  }
  return map
}

function getPlanetTone(
  planetName: string,
  interpretedPlanets?: InterpretedPlanetData[],
): 'favorable' | 'challenging' | 'neutral' {
  if (!interpretedPlanets) return 'neutral'
  const match = interpretedPlanets.find(
    p => p.planet.toLowerCase() === planetName.toLowerCase(),
  )
  if (!match) return 'neutral'
  return match.is_favorable ? 'favorable' : 'challenging'
}

/* ───────────────────────── Component ───────────────────── */

export default function TransitKundaliChart({
  transitPlanets,
  transitHouses,
  natalHouses,
  onHouseClick,
  selectedHouse: selectedHouseProp,
  interpretedPlanets,
}: TransitKundaliChartProps) {
  const [internalSelected, setInternalSelected] = useState<number | null>(null)
  const selectedHouse = selectedHouseProp ?? internalSelected

  /* Build natal house sign map */
  const houseSignMap = useMemo(() => {
    if (natalHouses && natalHouses.length > 0) {
      const m: Record<number, NatalHouseData> = {}
      for (const h of natalHouses) m[h.number] = h
      return m
    }
    // Derive from Moon sign: find Moon in transitHouses, use its sign
    const moonPlanet = transitPlanets.find(p => p.name === 'Moon')
    if (moonPlanet) {
      const derived = deriveHouseSigns(moonPlanet.sign)
      const m: Record<number, NatalHouseData> = {}
      for (const [num, sign] of Object.entries(derived)) {
        m[Number(num)] = { number: Number(num), sign, lord: '' }
      }
      return m
    }
    return {}
  }, [natalHouses, transitPlanets])

  /* Group transit planets by house number */
  const planetsByHouse = useMemo(() => {
    const map: Record<number, (TransitPlanetData & { tone: 'favorable' | 'challenging' | 'neutral' })[]> = {}
    for (const p of transitPlanets) {
      const house = transitHouses[p.name]
      if (house == null) continue
      const tone = getPlanetTone(p.name, interpretedPlanets)
      ;(map[house] ??= []).push({ ...p, tone })
    }
    return map
  }, [transitPlanets, transitHouses, interpretedPlanets])

  const handleHouseClick = (n: number) => {
    setInternalSelected(prev => (prev === n ? null : n))
    onHouseClick?.(n)
  }

  const selectedHouseInfo = selectedHouse ? houseSignMap[selectedHouse] : null
  const selectedPlanets = selectedHouse ? (planetsByHouse[selectedHouse] ?? []) : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center gap-6 w-full"
    >
      {/* Section title */}
      <div className="text-center">
        <h2 className="font-display text-xl text-violet-light tracking-wide">
          Today&apos;s Transit Chart
        </h2>
        <p className="text-muted text-xs mt-1">
          Transit planets in your natal houses from Moon
        </p>
      </div>

      {/* ─── SVG Chart ─── */}
      <motion.svg
        viewBox="0 0 400 400"
        className="w-full max-w-[420px] select-none"
        initial="hidden"
        animate="visible"
        role="img"
        aria-label="North Indian transit Kundali chart showing today's planetary positions in your natal houses"
      >
        <defs>
          {/* Glow filters */}
          <filter id="tGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="tGlowGreen" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feFlood floodColor="#34d399" floodOpacity="0.3" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="tGlowRose" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feFlood floodColor="#ec4899" floodOpacity="0.3" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Background gradient */}
          <radialGradient id="tBgGrad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#1e0035" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#09010f" stopOpacity="0.9" />
          </radialGradient>
          {/* Subtle center radial for depth */}
          <radialGradient id="tCenterGlow" cx="50%" cy="50%" r="30%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.06" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="400" height="400" fill="url(#tBgGrad)" rx="8" />
        <rect x="0" y="0" width="400" height="400" fill="url(#tCenterGlow)" rx="8" />

        {/* Outer border — draw-in */}
        <motion.rect
          x="0" y="0" width="400" height="400" rx="8"
          fill="none"
          stroke="rgba(196,181,253,0.12)"
          strokeWidth="1.5"
          variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />

        {/* Structural lines — draw-in animation */}
        {CHART_LINES.map(([x1, y1, x2, y2], i) => (
          <motion.line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="rgba(196,181,253,0.08)"
            strokeWidth="1"
            variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
            transition={{ duration: 0.8, delay: 0.12 * i, ease: 'easeOut' }}
          />
        ))}

        {/* House hit-areas + selection highlight */}
        {Array.from({ length: 12 }, (_, i) => i + 1).map(n => {
          const isSelected = selectedHouse === n
          const hasPlanets = (planetsByHouse[n] ?? []).length > 0
          return (
            <motion.polygon
              key={n}
              points={HOUSE_POLYGONS[n]}
              fill={
                isSelected
                  ? 'rgba(124,58,237,0.14)'
                  : hasPlanets
                    ? 'rgba(124,58,237,0.03)'
                    : 'transparent'
              }
              stroke={isSelected ? 'rgba(124,58,237,0.5)' : 'transparent'}
              strokeWidth={isSelected ? 1.5 : 0}
              className="cursor-pointer"
              onClick={() => handleHouseClick(n)}
              whileHover={{ fill: 'rgba(124,58,237,0.1)' }}
              transition={{ duration: 0.2 }}
            />
          )
        })}

        {/* House content: number, sign, transit planets */}
        {Array.from({ length: 12 }, (_, i) => i + 1).map(n => {
          const [cx, cy] = HOUSE_CENTERS[n]
          const houseInfo = houseSignMap[n]
          const housePlanets = planetsByHouse[n] ?? []
          const signAbbr = houseInfo
            ? (SIGN_ABBR[houseInfo.sign] ?? houseInfo.sign.slice(0, 2))
            : ''

          return (
            <motion.g
              key={n}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.0 + n * 0.05 }}
              className="cursor-pointer"
              onClick={() => handleHouseClick(n)}
            >
              {/* House number */}
              <text
                x={cx}
                y={cy - 18}
                textAnchor="middle"
                fill="#6b7280"
                fontSize="9"
                fontFamily="var(--font-inter), sans-serif"
              >
                {n}
              </text>

              {/* Sign abbreviation */}
              <text
                x={cx}
                y={cy - 4}
                textAnchor="middle"
                fontSize="10"
                fontFamily="var(--font-inter), sans-serif"
                fill="#c4b5fd"
                opacity="0.7"
              >
                {signAbbr}
              </text>

              {/* Transit planets */}
              {housePlanets.map((p, pi) => {
                const glyph = PLANET_GLYPHS[p.name] ?? p.name.charAt(0)
                const cols = Math.min(housePlanets.length, 3)
                const row = Math.floor(pi / cols)
                const col = pi % cols
                const totalInRow = Math.min(cols, housePlanets.length - row * cols)
                const px = cx + (col - (totalInRow - 1) / 2) * 20
                const py = cy + 12 + row * 18

                const fillColor =
                  p.tone === 'favorable'
                    ? '#34d399'
                    : p.tone === 'challenging'
                      ? '#ec4899'
                      : '#f8fafc'

                const glowFilter =
                  p.tone === 'favorable'
                    ? 'url(#tGlowGreen)'
                    : p.tone === 'challenging'
                      ? 'url(#tGlowRose)'
                      : 'url(#tGlow)'

                return (
                  <motion.g
                    key={p.name}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 1.4 + pi * 0.08 + n * 0.03 }}
                  >
                    <text
                      x={px}
                      y={py}
                      textAnchor="middle"
                      fontSize="14"
                      fontFamily="var(--font-inter), sans-serif"
                      fill={fillColor}
                      filter={glowFilter}
                    >
                      {glyph}
                    </text>
                    {/* Retrograde marker */}
                    {p.retrograde && (
                      <text
                        x={px + 9}
                        y={py - 6}
                        textAnchor="middle"
                        fontSize="7"
                        fontFamily="var(--font-inter), sans-serif"
                        fill="#ec4899"
                        fontWeight="bold"
                      >
                        R
                      </text>
                    )}
                  </motion.g>
                )
              })}
            </motion.g>
          )
        })}

        {/* Center label — "Transit" */}
        <motion.text
          x="200" y="194"
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-playfair), serif"
          fill="#c4b5fd"
          opacity="0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          Transit
        </motion.text>
        <motion.text
          x="200" y="210"
          textAnchor="middle"
          fontSize="8"
          fontFamily="var(--font-inter), sans-serif"
          fill="#6b7280"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1, delay: 1.6 }}
        >
          from Moon
        </motion.text>
      </motion.svg>

      {/* ─── Legend ─── */}
      <div className="flex items-center gap-5 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/30" />
          <span className="text-muted">Favorable</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose shadow-lg shadow-rose/30" />
          <span className="text-muted">Challenging</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-rose text-[10px] font-bold leading-none">R</span>
          <span className="text-muted">Retrograde</span>
        </span>
      </div>

      {/* ─── Detail Panel on house click ─── */}
      <AnimatePresence mode="wait">
        {selectedHouse != null && (
          <motion.div
            key={selectedHouse}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full max-w-[420px] bg-nebula border border-violet/20 rounded-2xl p-5"
          >
            {/* Header */}
            <div className="flex items-baseline justify-between mb-3">
              <h4 className="font-display text-lg text-star">
                House {selectedHouse}
                {selectedHouseInfo && (
                  <span className="ml-2 text-violet-light text-sm font-body">
                    {selectedHouseInfo.sign}
                  </span>
                )}
              </h4>
              {selectedHouseInfo?.lord && (
                <span className="text-muted text-xs">
                  Lord: <span className="text-star">{selectedHouseInfo.lord}</span>
                </span>
              )}
            </div>

            {/* Transit planets list */}
            {selectedPlanets.length > 0 ? (
              <div className="space-y-2">
                {selectedPlanets.map(p => {
                  const toneColor =
                    p.tone === 'favorable'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : p.tone === 'challenging'
                        ? 'bg-rose/15 text-rose'
                        : 'bg-white/10 text-muted'
                  const toneLabel =
                    p.tone === 'favorable'
                      ? 'Supportive'
                      : p.tone === 'challenging'
                        ? 'Challenging'
                        : 'Neutral'

                  return (
                    <div
                      key={p.name}
                      className="flex items-center gap-3 bg-cosmos/60 rounded-lg px-3 py-2.5"
                    >
                      <span
                        className="text-lg"
                        style={{
                          color:
                            p.tone === 'favorable'
                              ? '#34d399'
                              : p.tone === 'challenging'
                                ? '#ec4899'
                                : '#f8fafc',
                          filter:
                            p.tone === 'favorable'
                              ? 'drop-shadow(0 0 5px rgba(52,211,153,0.4))'
                              : p.tone === 'challenging'
                                ? 'drop-shadow(0 0 5px rgba(236,72,153,0.4))'
                                : 'drop-shadow(0 0 4px rgba(124,58,237,0.4))',
                        }}
                      >
                        {PLANET_GLYPHS[p.name] ?? p.name.charAt(0)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-star text-sm font-semibold">{p.name}</span>
                          {p.retrograde && (
                            <span className="text-rose text-[10px] font-bold" title="Retrograde">
                              R
                            </span>
                          )}
                        </div>
                        <div className="text-muted text-xs">
                          {p.sign} {p.degree.toFixed(1)}&deg; &middot; {p.nakshatra}
                        </div>
                      </div>
                      <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 shrink-0 ${toneColor}`}>
                        {toneLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted text-xs italic">
                No transit planets in this house today.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
