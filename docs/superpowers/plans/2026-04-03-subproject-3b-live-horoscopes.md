# Sub-project 3B: Live Horoscopes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace static placeholder horoscopes with Claude-generated daily horoscopes, cached in Supabase, with lucky number, lucky color, and compatibility sign.

**Architecture:** On-demand generation — first request per sign per day triggers Claude (haiku), result cached in existing `horoscopes` table. API route checks cache first, generates on miss. Horoscope page fetches from API, falls back to static text on failure.

**Tech Stack:** Next.js 14 (App Router), TypeScript, @anthropic-ai/sdk (Claude), Supabase, Vitest.

---

## File Map

| File | Responsibility |
|------|---------------|
| `supabase/migrations/005_horoscopes_compatibility.sql` | Add compatibility_sign column |
| `types/index.ts` | Add HoroscopeData interface |
| `lib/horoscope.ts` | Claude horoscope generation + cache logic |
| `app/api/horoscope/[sign]/route.ts` | Public GET endpoint — cache check + generate |
| `app/horoscope/[sign]/page.tsx` | Modify — fetch live data, show extras, fallback |
| `__tests__/lib/horoscope.test.ts` | Generation + cache tests |

---

## Task 1: Migration + Type

**Files:**
- Create: `supabase/migrations/005_horoscopes_compatibility.sql`
- Modify: `types/index.ts`

- [ ] **Step 1: Create the migration**

Create `supabase/migrations/005_horoscopes_compatibility.sql`:

```sql
ALTER TABLE horoscopes ADD COLUMN compatibility_sign text;
```

- [ ] **Step 2: Add HoroscopeData type**

Append to `types/index.ts` after `ChatSession`:

```ts
export interface HoroscopeData {
  sign: string
  date: string
  reading: string
  lucky_number: number
  lucky_color: string
  compatibility_sign: string
}
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/005_horoscopes_compatibility.sql types/index.ts
git commit -m "feat: add compatibility_sign column and HoroscopeData type"
```

---

## Task 2: Horoscope Generation Library

**Files:**
- Create: `lib/horoscope.ts`
- Create: `__tests__/lib/horoscope.test.ts`

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/horoscope.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('horoscope', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.CLAUDE_API_KEY = 'test-key'
  })

  it('buildHoroscopePrompt includes sign name, dates, element, and ruling planet', async () => {
    const { buildHoroscopePrompt } = await import('@/lib/horoscope')
    const prompt = buildHoroscopePrompt({
      slug: 'aries',
      name: 'Aries',
      symbol: '♈',
      dates: 'March 21 – April 19',
      element: 'Fire',
      rulingPlanet: 'Mars',
      placeholderHoroscope: '',
    })

    expect(prompt).toContain('Aries')
    expect(prompt).toContain('March 21 – April 19')
    expect(prompt).toContain('Fire')
    expect(prompt).toContain('Mars')
    expect(prompt).toContain('"reading"')
    expect(prompt).toContain('"lucky_number"')
    expect(prompt).toContain('"lucky_color"')
    expect(prompt).toContain('"compatibility_sign"')
  })

  it('parseHoroscopeResponse extracts valid JSON from Claude response', async () => {
    const { parseHoroscopeResponse } = await import('@/lib/horoscope')
    const raw = JSON.stringify({
      reading: 'The stars align today.',
      lucky_number: 7,
      lucky_color: 'emerald green',
      compatibility_sign: 'leo',
    })

    const result = parseHoroscopeResponse(raw)
    expect(result).not.toBeNull()
    expect(result!.reading).toBe('The stars align today.')
    expect(result!.lucky_number).toBe(7)
    expect(result!.lucky_color).toBe('emerald green')
    expect(result!.compatibility_sign).toBe('leo')
  })

  it('parseHoroscopeResponse returns null for invalid JSON', async () => {
    const { parseHoroscopeResponse } = await import('@/lib/horoscope')
    const result = parseHoroscopeResponse('not json at all')
    expect(result).toBeNull()
  })

  it('parseHoroscopeResponse returns null for missing fields', async () => {
    const { parseHoroscopeResponse } = await import('@/lib/horoscope')
    const result = parseHoroscopeResponse(JSON.stringify({ reading: 'hello' }))
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/horoscope.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Create the horoscope library**

Create `lib/horoscope.ts`:

```ts
import Anthropic from '@anthropic-ai/sdk'
import type { ZodiacSign } from '@/types'

interface HoroscopeFields {
  reading: string
  lucky_number: number
  lucky_color: string
  compatibility_sign: string
}

export function buildHoroscopePrompt(sign: ZodiacSign): string {
  return `Generate today's horoscope for ${sign.name} (${sign.dates}, ${sign.element} sign, ruled by ${sign.rulingPlanet}).

Return ONLY valid JSON with no other text:
{
  "reading": "A ~200 word horoscope paragraph. Be warm, specific, and reference current planetary energy. Write as Astra, a wise and experienced astrologer.",
  "lucky_number": <number between 1 and 99>,
  "lucky_color": "<a color name>",
  "compatibility_sign": "<lowercase zodiac sign slug most compatible today>"
}`
}

export function parseHoroscopeResponse(raw: string): HoroscopeFields | null {
  try {
    const data = JSON.parse(raw)
    if (
      typeof data.reading !== 'string' ||
      typeof data.lucky_number !== 'number' ||
      typeof data.lucky_color !== 'string' ||
      typeof data.compatibility_sign !== 'string'
    ) {
      return null
    }
    return {
      reading: data.reading,
      lucky_number: data.lucky_number,
      lucky_color: data.lucky_color,
      compatibility_sign: data.compatibility_sign,
    }
  } catch {
    return null
  }
}

export async function generateHoroscope(sign: ZodiacSign): Promise<HoroscopeFields | null> {
  const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
  const model = process.env.HOROSCOPE_MODEL || 'claude-haiku-4-5'

  const response = await client.messages.create({
    model,
    max_tokens: 512,
    messages: [{ role: 'user', content: buildHoroscopePrompt(sign) }],
  })

  const block = response.content[0]
  if (block.type !== 'text') return null

  return parseHoroscopeResponse(block.text)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/horoscope.test.ts`
Expected: PASS — all 4 tests

- [ ] **Step 5: Commit**

```bash
git add lib/horoscope.ts __tests__/lib/horoscope.test.ts
git commit -m "feat: add horoscope generation library with Claude and JSON parsing"
```

---

## Task 3: Horoscope API Route

**Files:**
- Create: `app/api/horoscope/[sign]/route.ts`

- [ ] **Step 1: Create the API route**

Create `app/api/horoscope/[sign]/route.ts`:

```ts
import { createClient } from '@/lib/supabase/server'
import { generateHoroscope } from '@/lib/horoscope'
import { getSignBySlug } from '@/constants/zodiac'
import { NextResponse } from 'next/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sign: string }> }
) {
  const { sign } = await params
  const zodiacSign = getSignBySlug(sign)

  if (!zodiacSign) {
    return NextResponse.json({ error: 'Invalid sign' }, { status: 404 })
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  // Check cache
  const { data: cached } = await supabase
    .from('horoscopes')
    .select('sign, date, reading, lucky_number, lucky_color, compatibility_sign')
    .eq('sign', sign)
    .eq('date', today)
    .maybeSingle()

  if (cached) {
    return NextResponse.json(cached)
  }

  // Generate
  try {
    const result = await generateHoroscope(zodiacSign)
    if (!result) {
      return NextResponse.json(
        { error: 'Horoscope generation temporarily unavailable' },
        { status: 503 }
      )
    }

    // Save to cache
    const row = {
      sign,
      date: today,
      reading: result.reading,
      lucky_number: result.lucky_number,
      lucky_color: result.lucky_color,
      compatibility_sign: result.compatibility_sign,
    }

    await supabase.from('horoscopes').upsert(row, { onConflict: 'sign,date' })

    return NextResponse.json(row)
  } catch {
    return NextResponse.json(
      { error: 'Horoscope generation temporarily unavailable' },
      { status: 503 }
    )
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/horoscope/[sign]/route.ts
git commit -m "feat: add GET /api/horoscope/[sign] with on-demand generation and caching"
```

---

## Task 4: Update Horoscope Page

**Files:**
- Modify: `app/horoscope/[sign]/page.tsx`

- [ ] **Step 1: Update the horoscope page**

Replace `app/horoscope/[sign]/page.tsx` with:

```tsx
import { notFound } from 'next/navigation'
import { ZODIAC_SIGNS, ZODIAC_SLUGS, getSignBySlug } from '@/constants/zodiac'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import GlowButton from '@/components/ui/GlowButton'
import type { Metadata } from 'next'
import type { HoroscopeData } from '@/types'

export const revalidate = 86400

interface Props { params: Promise<{ sign: string }> }

export async function generateStaticParams() {
  return ZODIAC_SLUGS.map(sign => ({ sign }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sign } = await params
  const s = getSignBySlug(sign)
  if (!s) return {}
  return {
    title: `${s.name} Horoscope Today ${s.symbol} — Astra`,
    description: `Today's ${s.name} horoscope. Daily reading, lucky number, and compatibility.`,
  }
}

async function fetchHoroscope(sign: string): Promise<HoroscopeData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/horoscope/${sign}`, {
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default async function HoroscopePage({ params }: Props) {
  const { sign } = await params
  const zodiacSign = getSignBySlug(sign)
  if (!zodiacSign) notFound()

  const horoscope = await fetchHoroscope(sign)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const reading = horoscope?.reading ?? zodiacSign.placeholderHoroscope
  const compatSign = horoscope?.compatibility_sign
    ? getSignBySlug(horoscope.compatibility_sign)
    : null

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cosmic-gradient pt-24">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="text-7xl mb-4">{zodiacSign.symbol}</div>
            <h1 className="font-display text-5xl text-star mb-2">{zodiacSign.name}</h1>
            <p className="text-muted text-sm mb-1">{zodiacSign.dates}</p>
            <p className="text-muted text-xs">{zodiacSign.element} · Ruled by {zodiacSign.rulingPlanet}</p>
          </div>

          <div className="bg-cosmos border border-violet/20 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-violet-light text-xs font-semibold tracking-widest uppercase">Today's Reading</span>
              <span className="text-muted text-xs">· {today}</span>
            </div>
            <p className="text-star text-lg leading-relaxed font-display italic">
              "{reading}"
            </p>
          </div>

          {/* Lucky details */}
          {horoscope && (
            <div className="grid grid-cols-3 gap-3 mb-10">
              <div className="bg-gradient-to-br from-nebula to-cosmos border border-violet/20 rounded-xl p-4 text-center">
                <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-1">Lucky Number</p>
                <p className="text-star text-2xl font-display">{horoscope.lucky_number}</p>
              </div>
              <div className="bg-gradient-to-br from-nebula to-cosmos border border-violet/20 rounded-xl p-4 text-center">
                <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-1">Lucky Color</p>
                <p className="text-star text-sm font-semibold capitalize">{horoscope.lucky_color}</p>
              </div>
              <div className="bg-gradient-to-br from-nebula to-cosmos border border-violet/20 rounded-xl p-4 text-center">
                <p className="text-violet-light text-[10px] font-semibold tracking-widest uppercase mb-1">Best Match</p>
                <p className="text-star text-lg">{compatSign?.symbol ?? '✦'}</p>
                <p className="text-muted text-xs">{compatSign?.name ?? ''}</p>
              </div>
            </div>
          )}

          <div className="mb-10">
            <h2 className="font-display text-xl text-star mb-4">Other signs</h2>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {ZODIAC_SIGNS.filter(s => s.slug !== sign).map(s => (
                <a
                  key={s.slug}
                  href={`/horoscope/${s.slug}`}
                  className="bg-nebula/50 hover:bg-violet/10 border border-white/5 hover:border-violet/30 rounded-xl p-3 text-center transition-all"
                >
                  <div className="text-2xl">{s.symbol}</div>
                  <div className="text-xs text-muted mt-1">{s.name}</div>
                </a>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-violet/10 to-rose/10 border border-violet/20 rounded-2xl p-8 text-center">
            <h3 className="font-display text-2xl text-star mb-3">
              Want a personal reading?
            </h3>
            <p className="text-muted text-sm mb-6">
              Astra can give you a detailed reading based on your exact birth chart — not just your sun sign.
            </p>
            <GlowButton href="/signup" variant="primary">
              Get Your Free Birth Chart ✨
            </GlowButton>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add app/horoscope/[sign]/page.tsx
git commit -m "feat: update horoscope page with live Claude readings, lucky details, and fallback"
```

---

## Task 5: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No new type errors
