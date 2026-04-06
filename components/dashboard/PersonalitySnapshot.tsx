'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

/* ── Types ──────────────────────────────────────────────────────────── */

interface PersonalityData {
  personality: {
    core_nature: string
    emotional_nature: string
    outer_expression: string
    strengths: string[]
    challenges: string[]
  }
  career: {
    direction: string
    strengths?: string
    wealth_potential?: string
  }
  family?: {
    spouse?: string
  }
  health?: {
    constitution?: string
  }
  spiritual?: {
    path?: string
    past_life_karma?: string
    dharma?: string
  }
  life_themes: string[]
}

/* ── House meanings for humanisation ────────────────────────────────── */

const HOUSE_MEANINGS: Record<string, string> = {
  '1st': 'identity and self-expression',
  '2nd': 'finances and family values',
  '3rd': 'communication and courage',
  '4th': 'home and emotional security',
  '5th': 'creativity and intelligence',
  '6th': 'health and daily routines',
  '7th': 'relationships and partnerships',
  '8th': 'transformation and hidden depths',
  '9th': 'wisdom and spiritual growth',
  '10th': 'career and public reputation',
  '11th': 'financial gains and social network',
  '12th': 'spiritual liberation and inner life',
}

const PLANET_QUALITIES: Record<string, string> = {
  Sun: 'vitality and authority',
  Moon: 'emotions and intuition',
  Mars: 'drive and ambition',
  Mercury: 'intellect and communication',
  Jupiter: 'wisdom and expansion',
  Venus: 'love and harmony',
  Saturn: 'discipline and persistence',
  Rahu: 'intense desire and unconventional energy',
  Ketu: 'spiritual detachment and past-life wisdom',
}

/** Convert "Mars in 10th house" to "Strong drive and ambition in career" */
function humanizeStrength(raw: string): string {
  // Yogas are already meaningful — keep them
  if (/yoga/i.test(raw)) return raw

  // Pattern: "Planet in Nth house"
  const match = raw.match(/^(\w+)\s+in\s+(\d+)(?:st|nd|rd|th)\s+house/i)
  if (match) {
    const planet = match[1]
    const houseKey = `${match[2]}${ordinalSuffix(Number(match[2]))}`
    const planetMeaning = PLANET_QUALITIES[planet]
    const houseMeaning = HOUSE_MEANINGS[houseKey]

    if (planetMeaning && houseMeaning) {
      return `Strong ${planetMeaning} in ${houseMeaning}`
    }
    if (houseMeaning) {
      return `${planet} energy focused on ${houseMeaning}`
    }
  }

  // Pattern: "Planet exalted in Nth house"
  const exaltedMatch = raw.match(
    /^(\w+)\s+exalted\s+in\s+(\d+)(?:st|nd|rd|th)\s+house/i,
  )
  if (exaltedMatch) {
    const planet = exaltedMatch[1]
    const houseKey = `${exaltedMatch[2]}${ordinalSuffix(Number(exaltedMatch[2]))}`
    const houseMeaning = HOUSE_MEANINGS[houseKey]
    if (houseMeaning) {
      return `Exceptional ${PLANET_QUALITIES[planet] ?? `${planet} power`} in ${houseMeaning}`
    }
  }

  return raw
}

function ordinalSuffix(n: number): string {
  if (n === 1) return 'st'
  if (n === 2) return 'nd'
  if (n === 3) return 'rd'
  return 'th'
}

/* ── Yoga descriptions ──────────────────────────────────────────────── */

const YOGA_DESCRIPTIONS: Record<string, string> = {
  Budhaditya: 'Gifted intellect and powerful communication',
  'Gajakesari': 'Wisdom, fame, and lasting success',
  'Dhana': 'Strong wealth potential and financial prosperity',
  'Raja': 'Authority, power, and high social standing',
  'Hamsa': 'Spiritual wisdom and noble character',
  'Malavya': 'Artistic talent, luxury, and romantic magnetism',
  'Ruchaka': 'Courage, physical strength, and leadership',
  'Bhadra': 'Sharp intellect and business acumen',
  'Sasa': 'Discipline, authority, and practical wisdom',
  'Viparita': 'Sudden gains through overcoming adversity',
  'Chandra-Mangal': 'Financial courage and emotional drive',
  'Adhi': 'Protection, support, and influential allies',
}

function getYogaDescription(yogaName: string): string {
  for (const [key, desc] of Object.entries(YOGA_DESCRIPTIONS)) {
    if (yogaName.toLowerCase().includes(key.toLowerCase())) return desc
  }
  return 'A beneficial planetary combination in your chart'
}

/* ── Extract insights from API text ─────────────────────────────────── */

interface InsightResult {
  icon: 'flame' | 'scale' | 'book'
  label: string
  text: string
}

function buildPunchyInsights(data: {
  personality: { core_nature: string; emotional_nature: string; outer_expression: string; strengths: string[] }
  career?: { direction: string }
}): InsightResult[] {
  const insights: InsightResult[] = []

  // 1. Core identity from lagna — extract the key trait words
  const core = data.personality.core_nature
  if (core) {
    // Look for trait patterns: "dynamic, courageous", "practical, grounded", etc.
    const traitMatch = core.match(/fundamentally\s+([^.]+)/i) || core.match(/native is\s+([^.]+)/i)
    const lordMatch = core.match(/lagna lord (\w+) is placed in house (\d+)/i) || core.match(/(\w+) in .+ is ([^,]+)/i)

    let text = ''
    if (traitMatch) {
      const traits = traitMatch[1].replace(/and /g, '').split(',').map(t => t.trim()).filter(t => t.length > 2).slice(0, 2)
      text = `You are naturally ${traits.join(' and ')} at your core`
    }
    if (lordMatch && text) {
      const planet = lordMatch[1]
      text += ` — ${planet} drives your personality with force and determination`
    }
    if (text) insights.push({ icon: 'flame', label: 'Your Core', text })
  }

  // 2. Emotional nature from Moon
  const emotional = data.personality.emotional_nature
  if (emotional) {
    const moonMatch = emotional.match(/Moon in (\w+) (?:confers|gives|creates|brings)\s+([^.]+)/i)
    if (moonMatch) {
      const qualities = moonMatch[2].replace(/and an? /g, '').replace(/innate /g, '').replace(/\s+/g, ' ').trim()
      insights.push({ icon: 'scale', label: 'Your Heart', text: `Emotionally, you bring ${qualities.split(',').slice(0, 2).join(' and ').replace(/\s+/g, ' ').trim()}` })
    } else {
      // Fallback: extract first meaningful phrase
      const first = emotional.split('.')[0]?.trim()
      if (first && first.length > 20) {
        insights.push({ icon: 'scale', label: 'Your Heart', text: first.replace(/^Moon in \w+ /i, 'Your emotional nature — ') })
      }
    }
  }

  // 3. Career/life direction
  const career = data.career?.direction
  if (career) {
    const careerMatch = career.match(/inclining the native toward\s+([^.]+)/i)
    const lordMatch2 = career.match(/Lord of 10th in \d+th\s*[—–-]\s*([^;.]+)/i)

    if (careerMatch) {
      const fields = careerMatch[1].trim()
      let text = `Your career thrives in ${fields}`
      if (lordMatch2) {
        const lordText = lordMatch2[1].trim()
        text = `${lordText.charAt(0).toUpperCase() + lordText.slice(1)} — your career thrives in ${fields.split(',').slice(0, 2).join(' and ').trim()}`
      }
      insights.push({ icon: 'book', label: 'Your Path', text })
    } else {
      const first = career.split('.')[0]?.trim()
      if (first && first.length > 20) {
        insights.push({ icon: 'book', label: 'Your Path', text: first })
      }
    }
  }

  // Fallback: if we got fewer than 2 insights, add outer expression
  if (insights.length < 2 && data.personality.outer_expression) {
    const outer = data.personality.outer_expression.split(':').pop()?.split('.')[0]?.trim()
    if (outer && outer.length > 20) {
      insights.push({ icon: 'book', label: 'Your Expression', text: outer })
    }
  }

  return insights.slice(0, 3)
}

/* ── Inline SVG icons (no dependency needed) ────────────────────────── */

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  )
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
      <path d="M7 21h10" />
      <path d="M12 3v18" />
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  )
}

function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  )
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  )
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

/* ── Insight icon picker ────────────────────────────────────────────── */

const INSIGHT_ICONS = [FlameIcon, ScaleIcon, BookOpenIcon]

/* ── Stagger animation helpers ──────────────────────────────────────── */

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
}

/* ── Explore-more links ─────────────────────────────────────────────── */

const EXPLORE_LINKS = [
  {
    label: "What's my career path?",
    href: '/chart',
    Icon: BriefcaseIcon,
  },
  {
    label: 'My relationships',
    href: '/chat?prompt=Tell%20me%20about%20my%20relationships%20based%20on%20my%20chart',
    Icon: HeartIcon,
  },
  {
    label: 'Health insights',
    href: '/chat?prompt=What%20does%20my%20chart%20say%20about%20my%20health',
    Icon: ActivityIcon,
  },
  {
    label: 'Spiritual journey',
    href: '/chart',
    Icon: CompassIcon,
  },
]

/* ── Component ──────────────────────────────────────────────────────── */

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

  // Graceful absence
  if (!loading && !data) return null

  // Skeleton
  if (loading) {
    return (
      <div className="mb-8">
        <div className="bg-cosmos border border-white/10 rounded-2xl p-6 animate-pulse">
          <div className="h-3 w-48 bg-white/5 rounded mb-6" />
          <div className="space-y-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-9 w-9 bg-white/5 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-full bg-white/5 rounded" />
                  <div className="h-3 w-2/3 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 flex-1 bg-white/5 rounded-xl" />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-7 w-28 bg-white/5 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── Derive display data ─────────────────────────────────── */

  const { personality, career, life_themes } = data!

  // Section 1: Top 3 punchy insights — human-readable, no jargon
  const insights = buildPunchyInsights(data!)

  // Section 2: Extract yogas from strengths
  const yogas = personality.strengths.filter((s) => /yoga/i.test(s))
  const nonYogaStrengths = personality.strengths.filter(
    (s) => !/yoga/i.test(s),
  )

  // Section 3: Humanised strengths and challenges
  const humanStrengths = nonYogaStrengths.slice(0, 4).map((s) => ({
    raw: s,
    human: humanizeStrength(s),
  }))
  const humanChallenges = personality.challenges.slice(0, 3).map((c) => ({
    raw: c,
    human: humanizeStrength(c),
  }))

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mb-8"
    >
      <div className="relative overflow-hidden rounded-2xl border border-violet/20 bg-gradient-to-br from-cosmos via-cosmos to-nebula/40">
        {/* Decorative gradient orbs */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="relative p-6 sm:p-8">
          {/* Header */}
          <motion.div
            variants={fadeUp}
            className="mb-6 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-violet-light" />
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-light">
                Your Cosmic Blueprint
              </p>
            </div>
            <Link
              href="/chart"
              className="group flex cursor-pointer items-center gap-1 text-xs text-violet-light transition-colors duration-200 hover:text-violet"
            >
              Full Profile
              <ChevronRightIcon className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          {/* ── Section 1: "What the Stars Say" ──────────────── */}
          {insights.length > 0 && (
            <motion.div variants={fadeUp} className="mb-6 space-y-3">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                What the Stars Say About You
              </p>
              {insights.map((insight, i) => {
                const iconMap = { flame: FlameIcon, scale: ScaleIcon, book: BookIcon }
                const Icon = iconMap[insight.icon] ?? FlameIcon
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border-l-2 border-violet/30 bg-violet/[0.04] py-3 pl-4 pr-4"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet/10">
                      <Icon className="h-4 w-4 text-violet-light" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-light mb-0.5">{insight.label}</p>
                      <p className="text-sm leading-relaxed text-star/90">
                        {insight.text}
                      </p>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          )}

          {/* ── Section 2: Active Yogas ──────────────────────── */}
          {yogas.length > 0 && (
            <motion.div variants={fadeUp} className="mb-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Active Yogas
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {yogas.map((yoga) => {
                  // Extract yoga name: "Budhaditya Yoga active" → "Budhaditya Yoga"
                  const yogaName =
                    yoga
                      .match(/(\w+\s*Yoga)/i)?.[1]
                      ?.trim() ?? yoga
                  const desc = getYogaDescription(yogaName)
                  return (
                    <div
                      key={yoga}
                      className="group relative overflow-hidden rounded-xl border border-yellow-500/20 bg-yellow-500/[0.06] p-4 transition-colors duration-200 hover:bg-yellow-500/[0.1]"
                    >
                      {/* Subtle golden glow */}
                      <div
                        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
                        style={{
                          background:
                            'radial-gradient(circle, rgba(234,179,8,0.1) 0%, transparent 70%)',
                        }}
                      />
                      <div className="relative flex items-start gap-3">
                        <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                        <div>
                          <p className="text-sm font-semibold text-yellow-200">
                            {yogaName}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-yellow-200/60">
                            {desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── Section 3: Strengths & Watch Areas ───────────── */}
          <motion.div variants={fadeUp} className="mb-6">
            {humanStrengths.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Your Strengths
                </p>
                <div className="flex flex-wrap gap-2">
                  {humanStrengths.map(({ raw, human }) => (
                    <span
                      key={raw}
                      className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.07] px-3 py-1.5 text-xs font-medium leading-snug text-emerald-300"
                      title={raw}
                    >
                      {human}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {humanChallenges.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Watch Areas
                </p>
                <div className="flex flex-wrap gap-2">
                  {humanChallenges.map(({ raw, human }) => (
                    <span
                      key={raw}
                      className="rounded-lg border border-amber-500/15 bg-amber-500/[0.07] px-3 py-1.5 text-xs font-medium leading-snug text-amber-300"
                      title={raw}
                    >
                      {human}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* ── Life Themes (compact) ────────────────────────── */}
          {life_themes.length > 0 && (
            <motion.div variants={fadeUp} className="mb-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Life Themes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {life_themes.slice(0, 5).map((theme) => (
                  <span
                    key={theme}
                    className="rounded-full border border-violet/15 bg-violet/[0.08] px-3 py-1 text-[11px] font-medium text-violet-light"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Section 4: Explore More ──────────────────────── */}
          <motion.div variants={fadeUp}>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Explore More
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EXPLORE_LINKS.map(({ label, href, Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="group flex cursor-pointer items-center gap-2 rounded-xl border border-violet/10 bg-violet/[0.04] px-3 py-2.5 transition-all duration-200 hover:border-violet/25 hover:bg-violet/[0.08]"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-violet-light/70 transition-colors duration-200 group-hover:text-violet-light" />
                  <span className="text-[11px] font-medium leading-tight text-star/70 transition-colors duration-200 group-hover:text-star/90">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
