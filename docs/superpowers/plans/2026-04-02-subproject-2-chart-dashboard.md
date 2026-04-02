# Sub-project 2: Birth Chart Visualization + Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/chart` page with tabbed card-grid visualization and enhance the `/dashboard` with cosmic profile + weather sections, all powered by mock chart data.

**Architecture:** Server components fetch birth chart data from Supabase, falling back to mock data when `western_chart_json` is null. Client components handle tab switching and interactivity. No new API routes — all data is read from Supabase or constants.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion, Supabase (@supabase/ssr), Vitest + React Testing Library.

---

## File Map

| File | Responsibility |
|------|---------------|
| `types/index.ts` | Add `Planet`, `House`, `Aspect`, `WesternChartData`, `CosmicWeatherEntry` interfaces |
| `constants/mock-chart.ts` | Mock `WesternChartData` for sample birth + mock cosmic weather entries |
| `components/chart/PlanetCard.tsx` | Single planet card — glyph, name, sign, degree, house, retrograde badge |
| `components/chart/AspectRow.tsx` | Single aspect row — planet glyphs, type, orb, color-coded |
| `components/chart/VedicGate.tsx` | Premium upsell prompt for Vedic tab |
| `components/chart/ChartTabs.tsx` | Tab switcher — Overview/Planets/Aspects/Vedic, renders tab content |
| `app/chart/page.tsx` | Server component — auth check, data fetch, render ChartTabs |
| `components/dashboard/CosmicProfile.tsx` | Big 3 summary cards for dashboard |
| `components/dashboard/CosmicWeather.tsx` | Today's planetary positions (mock data) |
| `app/dashboard/page.tsx` | Modify — add CosmicProfile + CosmicWeather above feature cards |
| `__tests__/components/chart/PlanetCard.test.tsx` | PlanetCard unit tests |
| `__tests__/components/chart/AspectRow.test.tsx` | AspectRow unit tests |
| `__tests__/components/chart/ChartTabs.test.tsx` | Tab switching tests |
| `__tests__/components/chart/VedicGate.test.tsx` | Premium gate tests |
| `__tests__/components/dashboard/CosmicProfile.test.tsx` | Cosmic profile tests |
| `__tests__/components/dashboard/CosmicWeather.test.tsx` | Cosmic weather tests |

---

## Task 1: Types + Mock Data

**Files:**
- Modify: `types/index.ts`
- Create: `constants/mock-chart.ts`

- [ ] **Step 1: Add chart types to `types/index.ts`**

Append these exported interfaces after the existing `ZodiacSign` interface:

```ts
export interface Planet {
  name: string
  symbol: string
  sign: string
  degree: number
  house: number
  retrograde: boolean
}

export interface House {
  number: number
  sign: string
  degree: number
}

export interface Aspect {
  planet1: string
  planet2: string
  type: 'trine' | 'square' | 'conjunction' | 'opposition' | 'sextile'
  orb: number
}

export interface WesternChartData {
  summary: string
  planets: Planet[]
  houses: House[]
  aspects: Aspect[]
}

export interface CosmicWeatherEntry {
  planet: string
  symbol: string
  sign: string
  description: string
}
```

- [ ] **Step 2: Update `BirthChart` interface**

In `types/index.ts`, change the `western_chart_json` field on the existing `BirthChart` interface:

```ts
// Change from:
western_chart_json: Record<string, unknown> | null
// To:
western_chart_json: WesternChartData | null
```

- [ ] **Step 3: Create mock chart data**

Create `constants/mock-chart.ts`:

```ts
import type { WesternChartData, CosmicWeatherEntry } from '@/types'

export const MOCK_WESTERN_CHART: WesternChartData = {
  summary: 'Sun Taurus, Moon Scorpio, ASC Libra',
  planets: [
    { name: 'Sun', symbol: '☉', sign: 'Taurus', degree: 24, house: 10, retrograde: false },
    { name: 'Moon', symbol: '☽', sign: 'Scorpio', degree: 8, house: 4, retrograde: false },
    { name: 'Mercury', symbol: '☿', sign: 'Taurus', degree: 12, house: 10, retrograde: false },
    { name: 'Venus', symbol: '♀', sign: 'Gemini', degree: 2, house: 9, retrograde: false },
    { name: 'Mars', symbol: '♂', sign: 'Pisces', degree: 18, house: 6, retrograde: false },
    { name: 'Jupiter', symbol: '♃', sign: 'Cancer', degree: 6, house: 10, retrograde: false },
    { name: 'Saturn', symbol: '♄', sign: 'Capricorn', degree: 25, house: 4, retrograde: true },
    { name: 'Uranus', symbol: '♅', sign: 'Capricorn', degree: 9, house: 4, retrograde: true },
    { name: 'Neptune', symbol: '♆', sign: 'Capricorn', degree: 14, house: 4, retrograde: true },
    { name: 'Pluto', symbol: '♇', sign: 'Scorpio', degree: 16, house: 2, retrograde: true },
  ],
  houses: [
    { number: 1, sign: 'Libra', degree: 15 },
    { number: 2, sign: 'Scorpio', degree: 12 },
    { number: 3, sign: 'Sagittarius', degree: 14 },
    { number: 4, sign: 'Capricorn', degree: 18 },
    { number: 5, sign: 'Aquarius', degree: 20 },
    { number: 6, sign: 'Pisces', degree: 18 },
    { number: 7, sign: 'Aries', degree: 15 },
    { number: 8, sign: 'Taurus', degree: 12 },
    { number: 9, sign: 'Gemini', degree: 14 },
    { number: 10, sign: 'Cancer', degree: 18 },
    { number: 11, sign: 'Leo', degree: 20 },
    { number: 12, sign: 'Virgo', degree: 18 },
  ],
  aspects: [
    { planet1: 'Sun', planet2: 'Moon', type: 'opposition', orb: 1.2 },
    { planet1: 'Sun', planet2: 'Jupiter', type: 'sextile', orb: 0.8 },
    { planet1: 'Sun', planet2: 'Saturn', type: 'trine', orb: 1.0 },
    { planet1: 'Moon', planet2: 'Pluto', type: 'conjunction', orb: 0.5 },
    { planet1: 'Venus', planet2: 'Mars', type: 'square', orb: 2.1 },
    { planet1: 'Jupiter', planet2: 'Saturn', type: 'opposition', orb: 1.5 },
    { planet1: 'Mercury', planet2: 'Jupiter', type: 'sextile', orb: 1.8 },
    { planet1: 'Mars', planet2: 'Neptune', type: 'conjunction', orb: 0.9 },
  ],
}

export const MOCK_COSMIC_WEATHER: CosmicWeatherEntry[] = [
  { planet: 'Mercury', symbol: '☿', sign: 'Aries', description: 'Communication gets direct and assertive — speak your mind today' },
  { planet: 'Venus', symbol: '♀', sign: 'Taurus', description: 'Love slows down and deepens — enjoy the simple pleasures' },
  { planet: 'Mars', symbol: '♂', sign: 'Gemini', description: 'Energy scatters across many interests — focus on one thing at a time' },
  { planet: 'Jupiter', symbol: '♃', sign: 'Cancer', description: 'Expansion through home and family — nurture your roots' },
]

export const MOCK_SUMMARY_TEXT = `Your Taurus Sun gives you grounded determination and an appreciation for life's finer things. With your Moon in Scorpio, you feel emotions deeply and possess powerful intuition. Libra rising means you present a harmonious, diplomatic exterior to the world — balancing your earthy core with social grace.`

/** Map sign names to one-word traits for the dashboard cosmic profile cards */
export const SIGN_TRAITS: Record<string, string> = {
  Aries: 'Bold',
  Taurus: 'Grounded',
  Gemini: 'Curious',
  Cancer: 'Nurturing',
  Leo: 'Radiant',
  Virgo: 'Analytical',
  Libra: 'Diplomatic',
  Scorpio: 'Intense',
  Sagittarius: 'Adventurous',
  Capricorn: 'Ambitious',
  Aquarius: 'Visionary',
  Pisces: 'Intuitive',
}
```

- [ ] **Step 4: Commit**

```bash
git add types/index.ts constants/mock-chart.ts
git commit -m "feat: add chart types and mock Western chart data"
```

---

## Task 2: PlanetCard Component

**Files:**
- Create: `components/chart/PlanetCard.tsx`
- Create: `__tests__/components/chart/PlanetCard.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/chart/PlanetCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PlanetCard from '@/components/chart/PlanetCard'

describe('PlanetCard', () => {
  const planet = {
    name: 'Sun',
    symbol: '☉',
    sign: 'Taurus',
    degree: 24,
    house: 10,
    retrograde: false,
  }

  it('renders planet name, symbol, sign, degree, and house', () => {
    render(<PlanetCard planet={planet} />)
    expect(screen.getByText('☉')).toBeInTheDocument()
    expect(screen.getByText('Sun')).toBeInTheDocument()
    expect(screen.getByText('Taurus 24°')).toBeInTheDocument()
    expect(screen.getByText('10th House')).toBeInTheDocument()
  })

  it('shows retrograde badge when retrograde is true', () => {
    render(<PlanetCard planet={{ ...planet, retrograde: true }} />)
    expect(screen.getByText('℞')).toBeInTheDocument()
  })

  it('does not show retrograde badge when retrograde is false', () => {
    render(<PlanetCard planet={planet} />)
    expect(screen.queryByText('℞')).not.toBeInTheDocument()
  })

  it('renders with variant="hero" for Big 3 styling', () => {
    const { container } = render(<PlanetCard planet={planet} variant="hero" />)
    expect(container.firstChild).toHaveClass('border-violet/30')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/components/chart/PlanetCard.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the component**

Create `components/chart/PlanetCard.tsx`:

```tsx
'use client'

import type { Planet } from '@/types'

interface PlanetCardProps {
  planet: Planet
  variant?: 'default' | 'hero'
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export default function PlanetCard({ planet, variant = 'default' }: PlanetCardProps) {
  const isHero = variant === 'hero'

  return (
    <div
      className={
        isHero
          ? 'bg-gradient-to-br from-nebula to-cosmos border border-violet/30 rounded-2xl p-5 text-center'
          : 'bg-nebula border border-white/5 rounded-xl p-4'
      }
    >
      <div className={isHero ? 'text-3xl mb-2' : 'flex items-center gap-3'}>
        <span className={isHero ? '' : 'text-xl text-rose'}>{planet.symbol}</span>
        {!isHero && (
          <div>
            <div className="text-star text-sm font-semibold">
              {planet.name}
              {planet.retrograde && (
                <span className="ml-1.5 text-rose text-xs" title="Retrograde">℞</span>
              )}
            </div>
            <div className="text-muted text-xs">{planet.sign} {planet.degree}° · {ordinal(planet.house)} House</div>
          </div>
        )}
      </div>
      {isHero && (
        <>
          <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mt-1">{planet.name}</p>
          <p className="text-star text-lg font-semibold mt-1">
            {planet.sign} {planet.degree}°
            {planet.retrograde && <span className="ml-1.5 text-rose text-sm" title="Retrograde">℞</span>}
          </p>
          <p className="text-muted text-xs mt-1">{ordinal(planet.house)} House</p>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/components/chart/PlanetCard.test.tsx`
Expected: PASS — all 4 tests

- [ ] **Step 5: Commit**

```bash
git add components/chart/PlanetCard.tsx __tests__/components/chart/PlanetCard.test.tsx
git commit -m "feat: add PlanetCard component with hero and default variants"
```

---

## Task 3: AspectRow Component

**Files:**
- Create: `components/chart/AspectRow.tsx`
- Create: `__tests__/components/chart/AspectRow.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/chart/AspectRow.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AspectRow from '@/components/chart/AspectRow'
import { MOCK_WESTERN_CHART } from '@/constants/mock-chart'

describe('AspectRow', () => {
  const planets = MOCK_WESTERN_CHART.planets

  it('renders planet names and aspect type', () => {
    const aspect = { planet1: 'Sun', planet2: 'Moon', type: 'opposition' as const, orb: 1.2 }
    render(<AspectRow aspect={aspect} planets={planets} />)
    expect(screen.getByText('☉')).toBeInTheDocument()
    expect(screen.getByText('☽')).toBeInTheDocument()
    expect(screen.getByText('Opposition')).toBeInTheDocument()
    expect(screen.getByText('1.2°')).toBeInTheDocument()
  })

  it('uses violet styling for harmonious aspects (trine)', () => {
    const aspect = { planet1: 'Sun', planet2: 'Saturn', type: 'trine' as const, orb: 1.0 }
    const { container } = render(<AspectRow aspect={aspect} planets={planets} />)
    expect(container.firstChild).toHaveClass('border-violet/20')
  })

  it('uses rose styling for challenging aspects (square)', () => {
    const aspect = { planet1: 'Venus', planet2: 'Mars', type: 'square' as const, orb: 2.1 }
    const { container } = render(<AspectRow aspect={aspect} planets={planets} />)
    expect(container.firstChild).toHaveClass('border-rose/20')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/components/chart/AspectRow.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the component**

Create `components/chart/AspectRow.tsx`:

```tsx
'use client'

import type { Aspect, Planet } from '@/types'

interface AspectRowProps {
  aspect: Aspect
  planets: Planet[]
}

const ASPECT_SYMBOLS: Record<string, string> = {
  conjunction: '☌',
  opposition: '☍',
  trine: '△',
  square: '□',
  sextile: '⚹',
}

const HARMONIOUS = new Set(['trine', 'sextile', 'conjunction'])

export default function AspectRow({ aspect, planets }: AspectRowProps) {
  const p1 = planets.find(p => p.name === aspect.planet1)
  const p2 = planets.find(p => p.name === aspect.planet2)
  const isHarmonious = HARMONIOUS.has(aspect.type)
  const typeName = aspect.type.charAt(0).toUpperCase() + aspect.type.slice(1)

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
        isHarmonious ? 'border-violet/20 bg-violet/5' : 'border-rose/20 bg-rose/5'
      }`}
    >
      <span className="text-lg">{p1?.symbol ?? '?'}</span>
      <span className={`text-sm ${isHarmonious ? 'text-violet-light' : 'text-rose'}`}>
        {ASPECT_SYMBOLS[aspect.type] ?? '•'}
      </span>
      <span className="text-lg">{p2?.symbol ?? '?'}</span>
      <span className="text-star text-sm font-medium ml-1">{typeName}</span>
      <span className="text-muted text-xs ml-auto">{aspect.orb}°</span>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/components/chart/AspectRow.test.tsx`
Expected: PASS — all 3 tests

- [ ] **Step 5: Commit**

```bash
git add components/chart/AspectRow.tsx __tests__/components/chart/AspectRow.test.tsx
git commit -m "feat: add AspectRow component with harmonious/challenging color coding"
```

---

## Task 4: VedicGate Component

**Files:**
- Create: `components/chart/VedicGate.tsx`
- Create: `__tests__/components/chart/VedicGate.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/chart/VedicGate.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import VedicGate from '@/components/chart/VedicGate'

describe('VedicGate', () => {
  it('shows upgrade prompt for free users', () => {
    render(<VedicGate tier="free" />)
    expect(screen.getByText('Unlock Vedic Astrology')).toBeInTheDocument()
    expect(screen.getByText('Nakshatra analysis')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /upgrade to premium/i })).toHaveAttribute('href', '/pricing')
  })

  it('shows coming soon for premium users', () => {
    render(<VedicGate tier="premium" />)
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
    expect(screen.queryByText('Unlock Vedic Astrology')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/components/chart/VedicGate.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the component**

Create `components/chart/VedicGate.tsx`:

```tsx
'use client'

import GlowButton from '@/components/ui/GlowButton'

interface VedicGateProps {
  tier: 'free' | 'premium'
}

export default function VedicGate({ tier }: VedicGateProps) {
  if (tier === 'premium') {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">🕉️</div>
        <h3 className="font-display text-2xl text-star mb-2">Vedic Astrology</h3>
        <p className="text-muted text-sm">Coming soon — your Vedic chart will appear here once calculations are ready.</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-nebula to-cosmos border border-violet/20 rounded-2xl p-8 text-center max-w-md mx-auto">
      <div className="text-4xl mb-4">🕉️</div>
      <h3 className="font-display text-2xl text-star mb-3">Unlock Vedic Astrology</h3>
      <ul className="text-muted text-sm space-y-2 mb-6 text-left max-w-xs mx-auto">
        <li>✦ Nakshatra analysis</li>
        <li>✦ Dasha periods</li>
        <li>✦ Kundali chart</li>
        <li>✦ Vedic remedies and insights</li>
      </ul>
      <GlowButton href="/pricing" variant="primary">Upgrade to Premium</GlowButton>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/components/chart/VedicGate.test.tsx`
Expected: PASS — all 2 tests

- [ ] **Step 5: Commit**

```bash
git add components/chart/VedicGate.tsx __tests__/components/chart/VedicGate.test.tsx
git commit -m "feat: add VedicGate component with premium upsell and coming-soon states"
```

---

## Task 5: ChartTabs Component

**Files:**
- Create: `components/chart/ChartTabs.tsx`
- Create: `__tests__/components/chart/ChartTabs.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/chart/ChartTabs.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChartTabs from '@/components/chart/ChartTabs'
import { MOCK_WESTERN_CHART, MOCK_SUMMARY_TEXT } from '@/constants/mock-chart'

describe('ChartTabs', () => {
  const defaultProps = {
    chart: MOCK_WESTERN_CHART,
    summaryText: MOCK_SUMMARY_TEXT,
    tier: 'free' as const,
  }

  it('renders Overview tab by default with Big 3', () => {
    render(<ChartTabs {...defaultProps} />)
    expect(screen.getByText('Sun')).toBeInTheDocument()
    expect(screen.getByText('Moon')).toBeInTheDocument()
    expect(screen.getByText(/Libra/)).toBeInTheDocument() // Rising = house 1 sign
  })

  it('switches to Planets tab and shows all 10 planets', () => {
    render(<ChartTabs {...defaultProps} />)
    fireEvent.click(screen.getByRole('tab', { name: /planets/i }))
    expect(screen.getByText('Mercury')).toBeInTheDocument()
    expect(screen.getByText('Pluto')).toBeInTheDocument()
  })

  it('switches to Aspects tab and shows aspect rows', () => {
    render(<ChartTabs {...defaultProps} />)
    fireEvent.click(screen.getByRole('tab', { name: /aspects/i }))
    expect(screen.getByText('Opposition')).toBeInTheDocument()
    expect(screen.getByText('Trine')).toBeInTheDocument()
  })

  it('switches to Vedic tab and shows premium gate for free users', () => {
    render(<ChartTabs {...defaultProps} />)
    fireEvent.click(screen.getByRole('tab', { name: /vedic/i }))
    expect(screen.getByText('Unlock Vedic Astrology')).toBeInTheDocument()
  })

  it('shows coming soon on Vedic tab for premium users', () => {
    render(<ChartTabs {...defaultProps} tier="premium" />)
    fireEvent.click(screen.getByRole('tab', { name: /vedic/i }))
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/components/chart/ChartTabs.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the component**

Create `components/chart/ChartTabs.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { WesternChartData } from '@/types'
import PlanetCard from '@/components/chart/PlanetCard'
import AspectRow from '@/components/chart/AspectRow'
import VedicGate from '@/components/chart/VedicGate'

interface ChartTabsProps {
  chart: WesternChartData
  summaryText: string
  tier: 'free' | 'premium'
}

const TABS = ['Overview', 'Planets', 'Aspects', 'Vedic'] as const
type Tab = typeof TABS[number]

export default function ChartTabs({ chart, summaryText, tier }: ChartTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview')

  const sun = chart.planets.find(p => p.name === 'Sun')
  const moon = chart.planets.find(p => p.name === 'Moon')
  // Rising = Ascendant = 1st house sign
  const risingSign = chart.houses.find(h => h.number === 1)
  const rising = risingSign
    ? { name: 'Rising', symbol: '↑', sign: risingSign.sign, degree: risingSign.degree, house: 1, retrograde: false }
    : null

  const sortedAspects = [...chart.aspects].sort((a, b) => a.orb - b.orb)

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-cosmos rounded-xl p-1 mb-8" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-violet text-white shadow-lg shadow-violet/30'
                : 'text-muted hover:text-star'
            }`}
          >
            {tab}
            {tab === 'Vedic' && tier !== 'premium' && (
              <span className="ml-1 text-rose text-xs">★</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {sun && <PlanetCard planet={sun} variant="hero" />}
            {moon && <PlanetCard planet={moon} variant="hero" />}
            {rising && <PlanetCard planet={rising} variant="hero" />}
          </div>
          <div className="bg-nebula border border-white/5 rounded-2xl p-6">
            <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">Your Cosmic Blueprint</p>
            <p className="text-star/90 text-sm leading-relaxed">{summaryText}</p>
          </div>
        </div>
      )}

      {activeTab === 'Planets' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {chart.planets.map(planet => (
            <PlanetCard key={planet.name} planet={planet} />
          ))}
        </div>
      )}

      {activeTab === 'Aspects' && (
        <div className="space-y-2">
          {sortedAspects.map(aspect => (
            <AspectRow key={`${aspect.planet1}-${aspect.planet2}`} aspect={aspect} planets={chart.planets} />
          ))}
        </div>
      )}

      {activeTab === 'Vedic' && <VedicGate tier={tier} />}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/components/chart/ChartTabs.test.tsx`
Expected: PASS — all 5 tests

- [ ] **Step 5: Commit**

```bash
git add components/chart/ChartTabs.tsx __tests__/components/chart/ChartTabs.test.tsx
git commit -m "feat: add ChartTabs with Overview, Planets, Aspects, and Vedic tabs"
```

---

## Task 6: /chart Page

**Files:**
- Create: `app/chart/page.tsx`

- [ ] **Step 1: Create the chart page**

Create `app/chart/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import ChartTabs from '@/components/chart/ChartTabs'
import { MOCK_WESTERN_CHART, MOCK_SUMMARY_TEXT } from '@/constants/mock-chart'
import type { WesternChartData } from '@/types'

export default async function ChartPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/chart')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const { data: chart } = await supabase
    .from('birth_charts')
    .select('id, date_of_birth, time_of_birth, place_of_birth, western_chart_json')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!chart) redirect('/signup/onboarding')

  const chartData: WesternChartData = (chart.western_chart_json as WesternChartData) ?? MOCK_WESTERN_CHART
  const tier = profile?.subscription_tier ?? 'free'

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-24 px-6">
        <div className="max-w-4xl mx-auto py-12">
          <div className="text-center mb-10">
            <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">Your Birth Chart</p>
            <h1 className="font-display text-4xl text-star">{chartData.summary}</h1>
            <p className="text-muted text-sm mt-2">
              {chart.date_of_birth}
              {chart.time_of_birth ? ` · ${chart.time_of_birth}` : ''}
              {' · '}{chart.place_of_birth}
            </p>
          </div>

          <ChartTabs
            chart={chartData}
            summaryText={MOCK_SUMMARY_TEXT}
            tier={tier as 'free' | 'premium'}
          />
        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 2: Verify the page builds**

Run: `npx next build`
Expected: Build succeeds (or `npx vitest run` — all existing + new tests pass)

- [ ] **Step 3: Commit**

```bash
git add app/chart/page.tsx
git commit -m "feat: add /chart page with tabbed birth chart visualization"
```

---

## Task 7: CosmicProfile Dashboard Component

**Files:**
- Create: `components/dashboard/CosmicProfile.tsx`
- Create: `__tests__/components/dashboard/CosmicProfile.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/dashboard/CosmicProfile.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CosmicProfile from '@/components/dashboard/CosmicProfile'
import { MOCK_WESTERN_CHART } from '@/constants/mock-chart'

describe('CosmicProfile', () => {
  it('renders Big 3 with sign names and traits', () => {
    render(<CosmicProfile chart={MOCK_WESTERN_CHART} />)
    expect(screen.getByText('☉')).toBeInTheDocument()
    expect(screen.getByText('Taurus')).toBeInTheDocument()
    expect(screen.getByText('Grounded')).toBeInTheDocument()
    expect(screen.getByText('☽')).toBeInTheDocument()
    expect(screen.getByText('Scorpio')).toBeInTheDocument()
    expect(screen.getByText('Intense')).toBeInTheDocument()
    expect(screen.getByText('Libra')).toBeInTheDocument()
    expect(screen.getByText('Diplomatic')).toBeInTheDocument()
  })

  it('links to /chart', () => {
    render(<CosmicProfile chart={MOCK_WESTERN_CHART} />)
    expect(screen.getByRole('link', { name: /view full chart/i })).toHaveAttribute('href', '/chart')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/components/dashboard/CosmicProfile.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the component**

Create `components/dashboard/CosmicProfile.tsx`:

```tsx
import type { WesternChartData } from '@/types'
import { SIGN_TRAITS } from '@/constants/mock-chart'
import Link from 'next/link'

interface CosmicProfileProps {
  chart: WesternChartData
}

export default function CosmicProfile({ chart }: CosmicProfileProps) {
  const sun = chart.planets.find(p => p.name === 'Sun')
  const moon = chart.planets.find(p => p.name === 'Moon')
  const risingHouse = chart.houses.find(h => h.number === 1)

  const big3 = [
    { label: 'Sun', symbol: sun?.symbol ?? '☉', sign: sun?.sign ?? '—' },
    { label: 'Moon', symbol: moon?.symbol ?? '☽', sign: moon?.sign ?? '—' },
    { label: 'Rising', symbol: '↑', sign: risingHouse?.sign ?? '—' },
  ]

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <p className="text-violet-light text-xs font-semibold tracking-widest uppercase">Your Cosmic Profile</p>
        <Link href="/chart" className="text-violet-light text-xs hover:text-violet transition-colors">
          View Full Chart →
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {big3.map(item => (
          <div
            key={item.label}
            className="bg-gradient-to-br from-nebula to-cosmos border border-violet/20 rounded-xl p-4 text-center"
          >
            <span className="text-2xl">{item.symbol}</span>
            <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mt-1">{item.label}</p>
            <p className="text-star text-sm font-semibold mt-0.5">{item.sign}</p>
            <p className="text-muted text-xs">{SIGN_TRAITS[item.sign] ?? ''}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/components/dashboard/CosmicProfile.test.tsx`
Expected: PASS — all 2 tests

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/CosmicProfile.tsx __tests__/components/dashboard/CosmicProfile.test.tsx
git commit -m "feat: add CosmicProfile dashboard component with Big 3 summary"
```

---

## Task 8: CosmicWeather Dashboard Component

**Files:**
- Create: `components/dashboard/CosmicWeather.tsx`
- Create: `__tests__/components/dashboard/CosmicWeather.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/dashboard/CosmicWeather.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CosmicWeather from '@/components/dashboard/CosmicWeather'
import { MOCK_COSMIC_WEATHER } from '@/constants/mock-chart'

describe('CosmicWeather', () => {
  it('renders all weather entries', () => {
    render(<CosmicWeather entries={MOCK_COSMIC_WEATHER} />)
    expect(screen.getByText(/Mercury/)).toBeInTheDocument()
    expect(screen.getByText(/Venus/)).toBeInTheDocument()
    expect(screen.getByText(/Mars/)).toBeInTheDocument()
    expect(screen.getByText(/Jupiter/)).toBeInTheDocument()
  })

  it('shows planet symbols', () => {
    render(<CosmicWeather entries={MOCK_COSMIC_WEATHER} />)
    expect(screen.getByText('☿')).toBeInTheDocument()
    expect(screen.getByText('♀')).toBeInTheDocument()
  })

  it('renders the section heading', () => {
    render(<CosmicWeather entries={MOCK_COSMIC_WEATHER} />)
    expect(screen.getByText(/cosmic weather/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/components/dashboard/CosmicWeather.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the component**

Create `components/dashboard/CosmicWeather.tsx`:

```tsx
import type { CosmicWeatherEntry } from '@/types'

interface CosmicWeatherProps {
  entries: CosmicWeatherEntry[]
}

export default function CosmicWeather({ entries }: CosmicWeatherProps) {
  return (
    <div className="mb-8">
      <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-4">Today's Cosmic Weather</p>
      <div className="bg-cosmos border border-white/5 rounded-2xl p-5 space-y-4">
        {entries.map(entry => (
          <div key={entry.planet} className="flex items-start gap-3">
            <span className="text-xl mt-0.5">{entry.symbol}</span>
            <div>
              <p className="text-star text-sm font-medium">
                {entry.planet} in {entry.sign}
              </p>
              <p className="text-muted text-xs mt-0.5">{entry.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/components/dashboard/CosmicWeather.test.tsx`
Expected: PASS — all 3 tests

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/CosmicWeather.tsx __tests__/components/dashboard/CosmicWeather.test.tsx
git commit -m "feat: add CosmicWeather dashboard component with mock planetary data"
```

---

## Task 9: Enhance Dashboard Page

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Update the dashboard page**

Modify `app/dashboard/page.tsx` to import and render the new components. The full updated file:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import GlowButton from '@/components/ui/GlowButton'
import CosmicProfile from '@/components/dashboard/CosmicProfile'
import CosmicWeather from '@/components/dashboard/CosmicWeather'
import Link from 'next/link'
import { MOCK_WESTERN_CHART, MOCK_COSMIC_WEATHER } from '@/constants/mock-chart'
import type { WesternChartData } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, subscription_tier')
    .eq('id', user.id)
    .single()

  const { data: chart } = await supabase
    .from('birth_charts')
    .select('id, place_of_birth, date_of_birth, western_chart_json')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const firstName = profile?.name?.split(' ')[0] ?? 'Seeker'
  const chartData: WesternChartData | null = chart
    ? ((chart.western_chart_json as WesternChartData) ?? MOCK_WESTERN_CHART)
    : null

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-24 px-6">
        <div className="max-w-4xl mx-auto py-12">
          <div className="mb-10">
            <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">Welcome back</p>
            <h1 className="font-display text-4xl text-star">Hello, {firstName} ✦</h1>
            <p className="text-muted mt-2">
              {profile?.subscription_tier === 'premium' ? '⭐ Premium member' : 'Free plan · '}
              {profile?.subscription_tier !== 'premium' && (
                <Link href="/pricing" className="text-violet-light hover:text-violet transition-colors">Upgrade to Premium</Link>
              )}
            </p>
          </div>

          {/* Onboarding prompt if no chart */}
          {!chart && (
            <div className="bg-violet/10 border border-violet/30 rounded-2xl p-8 mb-8 text-center">
              <div className="text-4xl mb-3">🌟</div>
              <h2 className="font-display text-2xl text-star mb-2">Complete your cosmic profile</h2>
              <p className="text-muted text-sm mb-6">Add your birth details so Astra can read your personal chart.</p>
              <GlowButton href="/signup/onboarding" variant="primary">Add Birth Details →</GlowButton>
            </div>
          )}

          {/* Cosmic Profile — Big 3 summary (only if chart exists) */}
          {chartData && <CosmicProfile chart={chartData} />}

          {/* Today's Cosmic Weather — always shown */}
          <CosmicWeather entries={MOCK_COSMIC_WEATHER} />

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🌙', title: 'My Birth Chart', desc: 'View your natal chart — Western and Vedic', href: '/chart', locked: !chart },
              { icon: '🎙️', title: 'Talk to Astra', desc: 'Ask anything by voice or text', href: '/chat', locked: !chart },
              { icon: '💫', title: 'Compatibility', desc: 'Check your compatibility with a partner', href: '/compatibility', locked: !chart },
            ].map(card => card.locked ? (
              <div
                key={card.title}
                aria-disabled="true"
                className="bg-cosmos border border-white/5 rounded-2xl p-6 opacity-50 cursor-not-allowed"
              >
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="text-star font-semibold mb-1">{card.title}</h3>
                <p className="text-muted text-sm">{card.desc}</p>
              </div>
            ) : (
              <Link
                key={card.title}
                href={card.href}
                className="group bg-cosmos border border-white/10 rounded-2xl p-6 transition-all hover:border-violet/30 hover:bg-violet/5"
              >
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="text-star font-semibold mb-1">{card.title}</h3>
                <p className="text-muted text-sm">{card.desc}</p>
                <span className="text-violet-light text-xs mt-3 block group-hover:translate-x-1 transition-transform">
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat: enhance dashboard with Cosmic Profile and Cosmic Weather sections"
```

---

## Task 10: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (existing + new)

- [ ] **Step 2: Verify build**

Run: `npx next build`
Expected: Build succeeds with no type errors

- [ ] **Step 3: Verify no leftover issues**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors
