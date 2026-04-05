'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { VedicPlanet, VedicHouse } from '@/types'

/* ───────────────────────── Props ───────────────────────── */

interface KundaliChartProps {
  planets: VedicPlanet[]
  houses: VedicHouse[]
  lagna: { sign: string; degree: number }
  onHouseClick?: (house: number) => void
  selectedHouse?: number | null
}

/* ───────────────────── Constants ───────────────────────── */

const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mars: '♂',
  Mercury: '☿',
  Jupiter: '♃',
  Venus: '♀',
  Saturn: '♄',
  Rahu: '☊',
  Ketu: '☋',
}

const SIGN_ABBR: Record<string, string> = {
  Aries: 'Ar',
  Taurus: 'Ta',
  Gemini: 'Ge',
  Cancer: 'Cn',
  Leo: 'Le',
  Virgo: 'Vi',
  Libra: 'Li',
  Scorpio: 'Sc',
  Sagittarius: 'Sg',
  Capricorn: 'Cp',
  Aquarius: 'Aq',
  Pisces: 'Pi',
  /* Vedic / Sanskrit names */
  Mesha: 'Ar',
  Vrishabha: 'Ta',
  Mithuna: 'Ge',
  Karka: 'Cn',
  Simha: 'Le',
  Kanya: 'Vi',
  Tula: 'Li',
  Vrischika: 'Sc',
  Dhanu: 'Sg',
  Makara: 'Cp',
  Kumbha: 'Aq',
  Meena: 'Pi',
}

/**
 * North Indian Kundali house layout.
 *
 * The chart is a 400x400 square. An inner diamond connects the
 * midpoints (200,0)-(400,200)-(200,400)-(0,200). The four corner
 * rectangles are each bisected by a diagonal, giving 12 houses.
 *
 * Standard numbering (counter-clockwise from top):
 *   1 = top diamond, 2 = top-left corner, 3 = left-top triangle,
 *   4 = left diamond, 5 = left-bottom triangle, 6 = bottom-left corner,
 *   7 = bottom diamond, 8 = bottom-right corner, 9 = right-bottom triangle,
 *  10 = right diamond, 11 = right-top triangle, 12 = top-right corner.
 */

/* SVG polygon paths for each house — clickable hit areas */
const HOUSE_POLYGONS: Record<number, string> = {
  1: '200,0 100,100 200,200 300,100',          // top diamond
  2: '0,0 100,100 200,0',                       // top-left triangle
  3: '0,0 100,100 0,200',                       // left-top triangle
  4: '0,200 100,100 200,200 100,300',           // left diamond
  5: '0,200 100,300 0,400',                     // left-bottom triangle
  6: '0,400 100,300 200,400',                   // bottom-left triangle
  7: '200,400 100,300 200,200 300,300',         // bottom diamond
  8: '200,400 300,300 400,400',                 // bottom-right triangle
  9: '400,400 300,300 400,200',                 // right-bottom triangle
  10: '400,200 300,300 200,200 300,100',        // right diamond
  11: '400,200 300,100 400,0',                  // right-top triangle
  12: '400,0 300,100 200,0',                    // top-right triangle
}

/* Center point of each house for placing text */
const HOUSE_CENTERS: Record<number, [number, number]> = {
  1: [200, 75],
  2: [90, 50],
  3: [40, 140],
  4: [75, 200],
  5: [40, 265],
  6: [90, 355],
  7: [200, 325],
  8: [310, 355],
  9: [360, 265],
  10: [325, 200],
  11: [360, 140],
  12: [310, 50],
}

/* SVG structural lines */
const CHART_LINES: [number, number, number, number][] = [
  /* inner diamond */
  [200, 0, 400, 200],
  [400, 200, 200, 400],
  [200, 400, 0, 200],
  [0, 200, 200, 0],
  /* corner diagonals */
  [0, 0, 200, 200],   // top-left → center
  [400, 0, 200, 200],  // top-right → center
  [400, 400, 200, 200],// bottom-right → center
  [0, 400, 200, 200],  // bottom-left → center
]

/* ────────────────────── Component ─────────────────────── */

export default function KundaliChart({
  planets,
  houses,
  lagna,
  onHouseClick,
  selectedHouse: selectedHouseProp,
}: KundaliChartProps) {
  const [internalSelected, setInternalSelected] = useState<number | null>(null)
  const selectedHouse = selectedHouseProp ?? internalSelected

  /* Group planets by house number */
  const planetsByHouse = useMemo(() => {
    const map: Record<number, VedicPlanet[]> = {}
    for (const p of planets) {
      ;(map[p.house] ??= []).push(p)
    }
    return map
  }, [planets])

  /* House sign map */
  const houseSignMap = useMemo(() => {
    const m: Record<number, VedicHouse> = {}
    for (const h of houses) m[h.number] = h
    return m
  }, [houses])

  const handleHouseClick = (n: number) => {
    setInternalSelected(prev => (prev === n ? null : n))
    onHouseClick?.(n)
  }

  const selectedHouseData = selectedHouse ? houseSignMap[selectedHouse] : null
  const selectedPlanets = selectedHouse ? (planetsByHouse[selectedHouse] ?? []) : []

  return (
    <div className="flex flex-col items-center gap-6">
      {/* ─── SVG Chart ─── */}
      <motion.svg
        viewBox="0 0 400 400"
        className="w-full max-w-[420px] select-none"
        initial="hidden"
        animate="visible"
      >
        {/* Subtle glow filter */}
        <defs>
          <filter id="kGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="kGlowStrong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="bgGrad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#1e0035" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#09010f" stopOpacity="0.9" />
          </radialGradient>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="400" height="400" fill="url(#bgGrad)" rx="8" />

        {/* Outer border */}
        <motion.rect
          x="0" y="0" width="400" height="400" rx="8"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1.5"
          variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />

        {/* Structural lines — draw-in animation */}
        {CHART_LINES.map(([x1, y1, x2, y2], i) => (
          <motion.line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            variants={{ hidden: { pathLength: 0 }, visible: { pathLength: 1 } }}
            transition={{ duration: 0.8, delay: 0.15 * i, ease: 'easeOut' }}
          />
        ))}

        {/* House hit-areas + highlights */}
        {Array.from({ length: 12 }, (_, i) => i + 1).map(n => {
          const isSelected = selectedHouse === n
          return (
            <motion.polygon
              key={n}
              points={HOUSE_POLYGONS[n]}
              fill={isSelected ? 'rgba(124,58,237,0.12)' : 'transparent'}
              stroke={isSelected ? 'rgba(124,58,237,0.6)' : 'transparent'}
              strokeWidth={isSelected ? 1.5 : 0}
              className="cursor-pointer"
              onClick={() => handleHouseClick(n)}
              whileHover={{ fill: 'rgba(124,58,237,0.08)' }}
              transition={{ duration: 0.2 }}
            />
          )
        })}

        {/* House content: number, sign, planets */}
        {Array.from({ length: 12 }, (_, i) => i + 1).map(n => {
          const [cx, cy] = HOUSE_CENTERS[n]
          const houseInfo = houseSignMap[n]
          const housePlanets = planetsByHouse[n] ?? []
          const signAbbr = houseInfo ? (SIGN_ABBR[houseInfo.sign] ?? houseInfo.sign.slice(0, 2)) : ''
          const isLagna = n === 1

          return (
            <motion.g
              key={n}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.0 + n * 0.06 }}
              className="cursor-pointer"
              onClick={() => handleHouseClick(n)}
            >
              {/* House number */}
              <text
                x={cx}
                y={cy - 18}
                textAnchor="middle"
                className="fill-muted"
                fontSize="9"
                fontFamily="var(--font-inter), sans-serif"
              >
                {n}
              </text>

              {/* Lagna marker */}
              {isLagna && (
                <text
                  x={cx + 24}
                  y={cy - 18}
                  textAnchor="middle"
                  fontSize="8"
                  fontFamily="var(--font-inter), sans-serif"
                  className="fill-violet"
                  filter="url(#kGlow)"
                >
                  Asc
                </text>
              )}

              {/* Sign abbreviation */}
              <text
                x={cx}
                y={cy - 4}
                textAnchor="middle"
                fontSize="11"
                fontFamily="var(--font-inter), sans-serif"
                className="fill-violet-light"
              >
                {signAbbr}
              </text>

              {/* Planets */}
              {housePlanets.map((p, pi) => {
                const glyph = PLANET_GLYPHS[p.name] ?? p.name.charAt(0)
                const isRetro = p.retrograde
                /* Layout: up to 3 planets per row, centered */
                const cols = Math.min(housePlanets.length, 3)
                const row = Math.floor(pi / cols)
                const col = pi % cols
                const totalInRow = Math.min(cols, housePlanets.length - row * cols)
                const px = cx + (col - (totalInRow - 1) / 2) * 18
                const py = cy + 12 + row * 16

                return (
                  <motion.g
                    key={p.name}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 1.4 + pi * 0.1 }}
                  >
                    <text
                      x={px}
                      y={py}
                      textAnchor="middle"
                      fontSize="14"
                      fontFamily="var(--font-inter), sans-serif"
                      className={isRetro ? 'fill-rose' : 'fill-star'}
                      filter="url(#kGlow)"
                    >
                      {glyph}
                    </text>
                    {isRetro && (
                      <text
                        x={px + 8}
                        y={py - 5}
                        textAnchor="middle"
                        fontSize="7"
                        className="fill-rose"
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

        {/* Center label */}
        <motion.text
          x="200" y="196"
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-inter), sans-serif"
          className="fill-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          {lagna.sign}
        </motion.text>
        <motion.text
          x="200" y="210"
          textAnchor="middle"
          fontSize="8"
          fontFamily="var(--font-inter), sans-serif"
          className="fill-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1, delay: 1.6 }}
        >
          {lagna.degree.toFixed(1)}°
        </motion.text>
      </motion.svg>

      {/* ─── Detail Panel ─── */}
      <AnimatePresence mode="wait">
        {selectedHouse && selectedHouseData && (
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
                <span className="ml-2 text-violet-light text-sm font-body">
                  {selectedHouseData.sign}
                </span>
              </h4>
              <span className="text-muted text-xs">
                Lord: <span className="text-star">{selectedHouseData.lord}</span>
                <span className="text-muted"> in {ordinalHouse(selectedHouseData.lord_house)}</span>
              </span>
            </div>

            {/* Planets list */}
            {selectedPlanets.length > 0 ? (
              <div className="space-y-2">
                {selectedPlanets.map(p => (
                  <div
                    key={p.name}
                    className="flex items-center gap-3 bg-cosmos/60 rounded-lg px-3 py-2"
                  >
                    <span
                      className={`text-lg ${p.retrograde ? 'text-rose' : 'text-star'}`}
                      style={{ filter: 'drop-shadow(0 0 4px rgba(124,58,237,0.5))' }}
                    >
                      {PLANET_GLYPHS[p.name] ?? p.name.charAt(0)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-star text-sm font-semibold">{p.name}</span>
                        {p.retrograde && (
                          <span className="text-rose text-[10px] font-bold" title="Retrograde">
                            ℞
                          </span>
                        )}
                      </div>
                      <div className="text-muted text-xs">
                        {p.sign} {p.degree.toFixed(1)}° &middot; {p.nakshatra}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-xs italic">No planets in this house.</p>
            )}

            {selectedHouse === 1 && (
              <p className="text-violet-light/60 text-[10px] mt-3">
                Ascendant (Lagna) &mdash; {lagna.sign} {lagna.degree.toFixed(1)}°
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ───────── Helpers ───────── */

function ordinalHouse(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]} house`
}
