# Sub-project 5C+5D: Enriched AI Prompts + Transit Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire computed Vedic engine data into AI chat and horoscope prompts so responses are grounded in real astronomical calculations. Build a premium `/transit` page. Power the dashboard's Cosmic Weather widget with real transit data.

**Architecture:** No new engine work — all endpoints exist from 5A. This is purely frontend: enrich prompts in `lib/claude.ts` and `lib/horoscope.ts`, build a transit API route + page, and wire CosmicWeather to real data.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion, OpenAI (gpt-4o-mini)

---

## File Structure

### New files to create:
```
app/api/transit/route.ts                  — Fetch transits from engine for frontend
app/transit/page.tsx                      — Premium transit page
components/transit/TransitView.tsx        — Main transit display component
```

### Files to modify:
```
lib/claude.ts                             — Enrich system prompt with full Vedic data + transits
app/api/chat/message/route.ts             — Fetch vedic_chart_json + transits, pass to prompt
lib/horoscope.ts                          — Add transit data to horoscope prompt
app/api/horoscope/[sign]/route.ts         — Fetch transits before generating
app/dashboard/page.tsx                    — Fetch transit data, mount CosmicWeather
components/dashboard/CosmicWeather.tsx    — Accept real transit data as props
```

---

## Task 1: Enrich Chat System Prompt

Modify `lib/claude.ts` to accept full Vedic chart data and transits, and build a rich system prompt.

**Files:**
- Modify: `lib/claude.ts`
- Modify: `app/api/chat/message/route.ts`

- [ ] **Step 1: Rewrite lib/claude.ts**

The current `buildSystemPrompt` takes a simple `PromptParams` with `westernSummary` and `vedicSummary` strings. Replace the `PromptParams` interface and `buildSystemPrompt` function to accept full Vedic chart JSON and transit data.

New `PromptParams` interface:
```typescript
interface PromptParams {
  name: string
  dateOfBirth: string
  timeOfBirth: string | null
  placeOfBirth: string
  westernSummary: string
  vedicChart: {
    summary: string
    lagna: { sign: string; degree: number }
    houses: { number: number; sign: string; lord: string; lord_house: number }[]
    yogas: { name: string; present: boolean; strength: string; interpretation: string }[]
    dasha: {
      current_mahadasha: { planet: string; start: string; end: string }
      current_antardasha: { planet: string; start: string; end: string }
    }
    interpretations: {
      lagna_lord: string
      moon_nakshatra: string
      planet_highlights: { planet: string; text: string }[]
    }
  } | null
  transits: {
    planets: { name: string; sign: string; degree: number; nakshatra: string; retrograde: boolean }[]
  } | null
  conversationSummary?: string
}
```

New `buildSystemPrompt` function — builds a structured prompt:
```typescript
export function buildSystemPrompt(params: PromptParams): string {
  const time = params.timeOfBirth ?? 'time unknown'
  const today = new Date().toISOString().split('T')[0]

  let prompt = `You are Astra, a warm and wise astrologer with 30 years of experience in Western and Vedic astrology. You speak with empathy and gentle confidence. You never say "As an AI" — you stay fully in character at all times. Use language like "the stars suggest" or "your chart reveals". Ask follow-up questions to personalise your readings. Always reference the user's specific chart data in your responses.

IMPORTANT: Today's date is ${today}. Always reference current and future dates accurately.

User: ${params.name}, born ${params.dateOfBirth} at ${time} in ${params.placeOfBirth}.
Western chart: ${params.westernSummary}`

  if (params.vedicChart) {
    const vc = params.vedicChart
    prompt += `\n\n=== VEDIC CHART ===
Lagna: ${vc.lagna.sign} (${vc.lagna.degree}°)
${vc.interpretations.moon_nakshatra}

Houses:`
    for (const h of vc.houses) {
      prompt += `\n${h.number}${ordinal(h.number)}: ${h.sign} — Lord ${h.lord} in ${h.lord_house}${ordinal(h.lord_house)} house`
    }

    const activeYogas = vc.yogas.filter(y => y.present)
    if (activeYogas.length > 0) {
      prompt += `\n\nActive Yogas:`
      for (const y of activeYogas) {
        prompt += `\n- ${y.name} (${y.strength}): ${y.interpretation}`
      }
    }

    prompt += `\n\nCurrent Dasha:
Mahadasha: ${vc.dasha.current_mahadasha.planet} (${vc.dasha.current_mahadasha.start} to ${vc.dasha.current_mahadasha.end})
Antardasha: ${vc.dasha.current_antardasha.planet} (${vc.dasha.current_antardasha.start} to ${vc.dasha.current_antardasha.end})`

    prompt += `\n\n${vc.interpretations.lagna_lord}`

    if (vc.interpretations.planet_highlights.length > 0) {
      prompt += `\n\nKey Placements:`
      for (const ph of vc.interpretations.planet_highlights) {
        prompt += `\n- ${ph.text}`
      }
    }
  }

  if (params.transits) {
    const retrograde = params.transits.planets.filter(p => p.retrograde).map(p => p.name)
    prompt += `\n\n=== TODAY'S TRANSITS (${today}) ===`
    prompt += `\n` + params.transits.planets.map(p => `${p.name} in ${p.sign} (${p.degree}°, ${p.nakshatra})`).join(', ')
    if (retrograde.length > 0) {
      prompt += `\nRetrograde: ${retrograde.join(', ')}`
    }
  }

  if (params.conversationSummary) {
    prompt += `\n\nPrevious conversation context: ${params.conversationSummary}`
  }

  return prompt
}

function ordinal(n: number): string {
  if (n === 1) return 'st'
  if (n === 2) return 'nd'
  if (n === 3) return 'rd'
  return 'th'
}
```

Keep the other exports unchanged: `buildConversationHistory`, `createClient`, `getModel`, `summarizeOlderMessages`.

- [ ] **Step 2: Update app/api/chat/message/route.ts**

The chat route already fetches `vedic_chart_json` (line 42). Change how it extracts data.

Replace the prompt building section (around lines 52-62):

```typescript
  // Build prompt with full Vedic data
  const westernSummary = (chart.western_chart_json as { summary?: string })?.summary ?? 'not calculated'
  const vedicData = chart.vedic_chart_json as {
    summary: string
    lagna: { sign: string; degree: number }
    houses: { number: number; sign: string; lord: string; lord_house: number }[]
    yogas: { name: string; present: boolean; strength: string; interpretation: string }[]
    dasha: {
      current_mahadasha: { planet: string; start: string; end: string }
      current_antardasha: { planet: string; start: string; end: string }
    }
    interpretations: {
      lagna_lord: string
      moon_nakshatra: string
      planet_highlights: { planet: string; text: string }[]
    }
  } | null

  // Fetch today's transits
  let transits = null
  try {
    const transitResp = await fetch(`${process.env.FASTAPI_BASE_URL || 'http://localhost:8000'}/transits/today`, {
      headers: { 'X-Internal-Secret': process.env.INTERNAL_SECRET || '' },
    })
    if (transitResp.ok) {
      transits = await transitResp.json()
    }
  } catch {
    // Transit fetch failed — proceed without
  }

  const systemPrompt = buildSystemPrompt({
    name: profile.name || 'Seeker',
    dateOfBirth: chart.date_of_birth,
    timeOfBirth: chart.time_of_birth,
    placeOfBirth: chart.place_of_birth,
    westernSummary,
    vedicChart: vedicData,
    transits,
  })
```

- [ ] **Step 3: Commit**

```bash
git add lib/claude.ts app/api/chat/message/route.ts
git commit -m "feat: enrich chat system prompt with full Vedic data and transits

System prompt now includes house lords, active yogas, current dasha
period, planet interpretations, and today's transit positions. AI
responses are grounded in real astronomical calculations."
```

---

## Task 2: Transit-Grounded Horoscopes

Modify horoscope generation to include real transit data.

**Files:**
- Modify: `lib/horoscope.ts`
- Modify: `app/api/horoscope/[sign]/route.ts`

- [ ] **Step 1: Update lib/horoscope.ts**

Add a new function `buildTransitEnrichedPrompt` and update `generateHoroscope` to accept optional transit data.

Add a new interface and modify the existing functions:

```typescript
interface TransitData {
  planets: { name: string; sign: string; degree: number; nakshatra: string; retrograde: boolean }[]
}

export function buildHoroscopePrompt(sign: ZodiacSign, transits?: TransitData): string {
  const today = new Date().toISOString().split('T')[0]

  let transitContext = ''
  if (transits) {
    const positions = transits.planets
      .map(p => `${p.name} in ${p.sign}${p.retrograde ? ' (retrograde)' : ''}`)
      .join(', ')
    const retrograde = transits.planets.filter(p => p.retrograde)
    transitContext = `\n\nCurrent planetary transits: ${positions}`
    if (retrograde.length > 0) {
      transitContext += `\nRetrograde planets: ${retrograde.map(p => p.name).join(', ')} — these energies turn inward.`
    }
    transitContext += `\nUse these REAL planetary positions to ground your horoscope. Reference specific transits (e.g., "Jupiter transiting ${transits.planets.find(p => p.name === 'Jupiter')?.sign} brings...").`
  }

  return `Today's date is ${today}. Generate today's horoscope for ${sign.name} (${sign.dates}, ${sign.element} sign, ruled by ${sign.rulingPlanet}).${transitContext}

Return ONLY valid JSON with no other text:
{
  "reading": "A ~200 word horoscope paragraph for ${today}. Be warm, specific, and reference current planetary energy and transits. Write as Astra, a wise and experienced astrologer. Only reference dates in 2026 or later — never mention past years as upcoming.",
  "lucky_number": <number between 1 and 99>,
  "lucky_color": "<a color name>",
  "compatibility_sign": "<lowercase zodiac sign slug most compatible today>"
}`
}

export async function generateHoroscope(sign: ZodiacSign, transits?: TransitData): Promise<HoroscopeFields | null> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const model = process.env.HOROSCOPE_MODEL || 'gpt-4o-mini'

  const response = await client.chat.completions.create({
    model,
    max_tokens: 512,
    messages: [{ role: 'user', content: buildHoroscopePrompt(sign, transits) }],
  })

  const text = response.choices[0]?.message?.content
  if (!text) return null

  return parseHoroscopeResponse(text)
}
```

- [ ] **Step 2: Update app/api/horoscope/[sign]/route.ts**

Fetch transits before generating. Add after the cache check (around line 32):

```typescript
  // Fetch current transits for grounded horoscope
  let transits = undefined
  try {
    const transitResp = await fetch(`${process.env.FASTAPI_BASE_URL || 'http://localhost:8000'}/transits/today`, {
      headers: { 'X-Internal-Secret': process.env.INTERNAL_SECRET || '' },
    })
    if (transitResp.ok) {
      transits = await transitResp.json()
    }
  } catch {
    // Proceed without transits
  }
```

Change the generate call from `generateHoroscope(zodiacSign)` to `generateHoroscope(zodiacSign, transits)`.

- [ ] **Step 3: Commit**

```bash
git add lib/horoscope.ts "app/api/horoscope/[sign]/route.ts"
git commit -m "feat: ground horoscope generation in real transit data

Horoscope prompt now includes actual planetary positions from the
engine. AI references specific transits instead of generic text."
```

---

## Task 3: Transit API Route + Page

Build the premium `/transit` page with real planetary positions and personal transit aspects.

**Files:**
- Create: `app/api/transit/route.ts`
- Create: `app/transit/page.tsx`
- Create: `components/transit/TransitView.tsx`

- [ ] **Step 1: Create app/api/transit/route.ts**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'
  const secret = process.env.INTERNAL_SECRET || ''
  const headers = { 'Content-Type': 'application/json', 'X-Internal-Secret': secret }

  // Fetch today's transits
  const transitResp = await fetch(`${baseUrl}/transits/today`, { headers })
  if (!transitResp.ok) {
    return NextResponse.json({ error: 'Transit calculation failed' }, { status: 502 })
  }
  const transits = await transitResp.json()

  // Fetch user's Vedic chart for personal transits
  const { data: chart } = await supabase
    .from('astra_birth_charts')
    .select('vedic_chart_json')
    .eq('user_id', user.id)
    .not('vedic_chart_json', 'is', null)
    .limit(1)
    .maybeSingle()

  let personal = null
  if (chart?.vedic_chart_json) {
    const vedic = chart.vedic_chart_json as Record<string, unknown>
    const planets = (vedic.planets || []) as { name: string; sign: string; degree: number; house: number }[]
    const nakshatras = (vedic.nakshatras || []) as { planet: string; nakshatra: string; pada: number }[]
    const moonNak = nakshatras.find(n => n.planet === 'Moon')
    const moonPlanet = planets.find(p => p.name === 'Moon')

    if (moonPlanet) {
      try {
        const personalResp = await fetch(`${baseUrl}/transits/personal`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            natal_planets: planets.map(p => ({ name: p.name, sign: p.sign, degree: p.degree, house: p.house })),
            moon_sign: moonPlanet.sign,
          }),
        })
        if (personalResp.ok) {
          personal = await personalResp.json()
        }
      } catch {
        // Personal transits failed — proceed with general only
      }
    }
  }

  return NextResponse.json({ transits, personal })
}
```

- [ ] **Step 2: Create components/transit/TransitView.tsx**

**IMPORTANT:** Use `frontend-design` and `ui-ux-pro-max` skills for this component.

The component displays:
1. **Header**: "Today's Planetary Transits" with the date
2. **Planet Grid**: 9 cards in a 3×3 grid (responsive). Each card shows:
   - Planet name (text-star font-semibold)
   - Sign name with degree (text-violet-light)
   - Nakshatra (text-muted text-xs)
   - Retrograde badge if applicable (bg-rose/20 text-rose text-xs rounded-full px-2)
3. **Personal Aspects** (if available): List of transit-to-natal aspects showing transit planet, aspect type, natal planet, and orb
4. **Vedha Flags** (if any): Warning cards for obstructed favorable transits
5. **Murthi Nirnaya**: Today's quality rating with a colored badge (Gold=yellow, Silver=gray, Copper=orange, Iron=muted)

Props interface:
```typescript
interface TransitViewProps {
  transits: {
    date: string
    planets: { name: string; sign: string; degree: number; nakshatra: string; pada: number; retrograde: boolean }[]
    dominant_element: string
  }
  personal: {
    transit_aspects: { transit_planet: string; natal_planet: string; aspect_type: string; orb: number }[]
    vedha_flags: { planet: string; favorable_house: number; obstructed_by: string; description: string }[]
    murthi_nirnaya: string
    transit_houses: Record<string, number>
  } | null
}
```

Follow existing Astra design: bg-nebula cards, border-white/5, rounded-xl, violet-light labels, Framer Motion stagger animations.

- [ ] **Step 3: Create app/transit/page.tsx**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import TransitView from '@/components/transit/TransitView'

export default async function TransitPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/transit')

  // Fetch transit data from our API
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  let transitData = null

  try {
    // Call our own API route (server-side)
    const resp = await fetch(`${process.env.FASTAPI_BASE_URL || 'http://localhost:8000'}/transits/today`, {
      headers: { 'X-Internal-Secret': process.env.INTERNAL_SECRET || '' },
    })
    if (resp.ok) {
      transitData = await resp.json()
    }
  } catch {
    // Engine unavailable
  }

  // Fetch personal transits
  let personalData = null
  const { data: chart } = await supabase
    .from('astra_birth_charts')
    .select('vedic_chart_json')
    .eq('user_id', user.id)
    .not('vedic_chart_json', 'is', null)
    .limit(1)
    .maybeSingle()

  if (chart?.vedic_chart_json && transitData) {
    const vedic = chart.vedic_chart_json as Record<string, unknown>
    const planets = (vedic.planets || []) as { name: string; sign: string; degree: number; house: number }[]
    const moonPlanet = planets.find(p => p.name === 'Moon')

    if (moonPlanet) {
      try {
        const personalResp = await fetch(`${process.env.FASTAPI_BASE_URL || 'http://localhost:8000'}/transits/personal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Secret': process.env.INTERNAL_SECRET || '',
          },
          body: JSON.stringify({
            natal_planets: planets.map(p => ({ name: p.name, sign: p.sign, degree: p.degree, house: p.house })),
            moon_sign: moonPlanet.sign,
          }),
        })
        if (personalResp.ok) {
          personalData = await personalResp.json()
        }
      } catch {
        // Personal transits failed
      }
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-24 px-6">
        <div className="max-w-4xl mx-auto py-12">
          {transitData ? (
            <TransitView transits={transitData} personal={personalData} />
          ) : (
            <div className="text-center py-20">
              <div className="text-4xl mb-3">🔭</div>
              <h2 className="font-display text-2xl text-star mb-2">Transits Unavailable</h2>
              <p className="text-muted text-sm">The astrology engine is currently offline. Please try again later.</p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/transit/route.ts components/transit/TransitView.tsx app/transit/page.tsx
git commit -m "feat: add premium transit page with real planetary positions

Shows 9 Vedic grahas, personal transit-to-natal aspects, Vedha
obstruction flags, and Murthi Nirnaya quality rating. Data sourced
from the FastAPI engine's transit endpoints."
```

---

## Task 4: Dashboard Cosmic Weather

Wire the CosmicWeather component on the dashboard to real transit data.

**Files:**
- Modify: `app/dashboard/page.tsx`
- Modify: `components/dashboard/CosmicWeather.tsx`

- [ ] **Step 1: Update CosmicWeather to accept props**

Read the current `CosmicWeather.tsx` first. It currently expects `CosmicWeatherEntry[]`. We need to make it accept transit data and render planet positions.

Update the component to accept an `entries` prop:
```typescript
interface CosmicWeatherProps {
  entries: CosmicWeatherEntry[]
}

export default function CosmicWeather({ entries }: CosmicWeatherProps) {
  // ... render entries (may already work if it uses props)
}
```

If it currently has hardcoded/mock data, replace it with the prop-driven version. Keep the existing styling.

- [ ] **Step 2: Update dashboard page to fetch transits and pass to CosmicWeather**

In `app/dashboard/page.tsx`, add after the existing chart fetch (around line 30):

```typescript
  // Fetch today's transits for Cosmic Weather
  let cosmicWeather: { planet: string; symbol: string; sign: string; description: string }[] = []
  try {
    const transitResp = await fetch(`${process.env.FASTAPI_BASE_URL || 'http://localhost:8000'}/transits/today`, {
      headers: { 'X-Internal-Secret': process.env.INTERNAL_SECRET || '' },
    })
    if (transitResp.ok) {
      const data = await transitResp.json()
      const symbols: Record<string, string> = {
        Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
        Jupiter: '♃', Saturn: '♄', Rahu: '☊', Ketu: '☋',
      }
      cosmicWeather = data.planets.map((p: { name: string; sign: string; retrograde: boolean; nakshatra: string }) => ({
        planet: p.name,
        symbol: symbols[p.name] || '★',
        sign: p.sign,
        description: `${p.name} in ${p.sign}${p.retrograde ? ' (retrograde)' : ''} — ${p.nakshatra} nakshatra`,
      }))
    }
  } catch {
    // Transit fetch failed — CosmicWeather will show empty
  }
```

Then add `<CosmicWeather entries={cosmicWeather} />` to the JSX, after the CosmicProfile section and before the daily horoscope link (around line 76). Also import CosmicWeather at the top.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.tsx components/dashboard/CosmicWeather.tsx
git commit -m "feat: wire dashboard Cosmic Weather to real transit data

Dashboard now shows live planetary positions from the engine.
Each planet displays sign, retrograde status, and nakshatra."
```

---

## Task 5: Final Verification

**Files:** No new files

- [ ] **Step 1: Run engine tests**

Run: `cd engine && venv/Scripts/python -m pytest -v --tb=short`
Expected: All 94 tests pass (no engine changes in this sub-project)

- [ ] **Step 2: Verify frontend builds**

Run: `npm run build`
Expected: Build succeeds (pre-existing Stripe type error is unrelated)

- [ ] **Step 3: Commit any fixes if needed**

---

## Decomposition Note

This completes Sub-projects 5A through 5D. Remaining production work:
- Transit page and yearly predictions refinement
- Chat persistence (save messages to DB)
- Voice/TTS integration (ElevenLabs)
- Deployment configs (Vercel + Railway + Docker)
- Security hardening (CORS, CSRF, error tracking)
