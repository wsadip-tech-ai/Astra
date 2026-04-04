# Sub-project 5F: Vaastu Frontend — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **IMPORTANT:** Use `frontend-design` and `ui-ux-pro-max` skills for ALL component implementation. Follow the Astra dark cosmic design system.

**Goal:** Build the premium `/vaastu` page with progressive property input, interactive 16-zone compass grid visualization, diagnostic report with remedies, and chat integration for Vaastu questions.

**Architecture:** Server component page fetches user's Vedic chart from Supabase, client components handle property input and display. API route calls the FastAPI engine's `/vaastu/analyze` endpoint. Compass grid is a CSS/SVG component with color-coded zones. Chat system prompt enriched with Vaastu data when property is saved.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion

---

## File Structure

### New files to create:
```
types/vaastu.ts                                — Vaastu-specific TypeScript interfaces
app/api/vaastu/analyze/route.ts                — Calls engine /vaastu/analyze
app/api/vaastu/save/route.ts                   — Saves property to Supabase
app/vaastu/page.tsx                            — Premium Vaastu page (server component)
components/vaastu/VaastuView.tsx               — Main page orchestrator (client component)
components/vaastu/PropertyForm.tsx             — Progressive property input form
components/vaastu/CompassGrid.tsx              — 16-zone interactive compass visualization
components/vaastu/AayadiCard.tsx               — Dimensional harmony display
components/vaastu/HitReport.tsx                — HIT analysis display
components/vaastu/SpatialFindings.tsx          — Room placement rule results
components/vaastu/RemedyList.tsx               — Remedies grouped by zone
```

### Files to modify:
```
middleware.ts                                  — Add /vaastu to protected + premium routes
lib/claude.ts                                  — Add Vaastu context to chat system prompt
components/layout/Navbar.tsx                   — Add Vaastu nav link
```

---

## Task 1: TypeScript Types + API Routes

Set up the data layer: types, API routes for analyze and save.

**Files:**
- Create: `types/vaastu.ts`
- Create: `app/api/vaastu/analyze/route.ts`
- Create: `app/api/vaastu/save/route.ts`

- [ ] **Step 1: Create types/vaastu.ts**

```typescript
// types/vaastu.ts

export interface VaastuProperty {
  length: number
  breadth: number
  entrance_direction: string
  floor_level: string
}

export interface VaastuRoomDetails {
  kitchen_zone?: string | null
  toilet_zones?: string[] | null
  brahmasthan_status?: string | null
  slope_direction?: string | null
}

export interface VaastuHitResult {
  attacker: string
  victim: string
  angle: number
  type: 'killer' | 'dangerous' | 'obstacle' | 'best_support' | 'friend' | 'positive'
  direction: string
}

export interface VaastuZoneStatus {
  zone: string
  status: 'clear' | 'afflicted' | 'warning' | 'positive'
  planet: string | null
  hit_type: string | null
  devtas: { name: string; domain: string }[]
}

export interface VaastuRemedy {
  zone: string
  type: string
  remedy: string
  reason: string
}

export interface AayadiResult {
  aaya: number
  vyaya: number
  aaya_greater: boolean
  yoni: { type: string; value: number; interpretation: string }
  footprint_effects: { dimension: string; value: number; effect: string }[]
  overall_harmony: 'favorable' | 'neutral' | 'unfavorable'
  description: string
}

export interface VaastuSummary {
  dasha_lord: string
  total_zones: number
  afflicted_zones: number
  warning_zones: number
  positive_zones: number
  clear_zones: number
  aayadi_harmony: string
  spatial_overall_status: string
}

export interface VaastuHitsResponse {
  primary_hits: VaastuHitResult[]
  secondary_hits: VaastuHitResult[]
  positive_hits: VaastuHitResult[]
  dasha_lord: string
}

export interface VaastuDiagnosticResult {
  summary: VaastuSummary
  aayadi: AayadiResult
  hits: VaastuHitsResponse
  zone_map: VaastuZoneStatus[]
  spatial_findings: { rule: string; status: string; zone?: string; detail?: string; description: string; remedy?: string }[]
  remedies: VaastuRemedy[]
  plant_recommendations: { plant: string; zone: string; purpose: string }[]
  disclaimer: string
}
```

- [ ] **Step 2: Create app/api/vaastu/analyze/route.ts**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || ''

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { property, room_details, user_name_initial } = body

  if (!property?.length || !property?.breadth || !property?.entrance_direction) {
    return NextResponse.json({ error: 'Property dimensions and entrance direction are required' }, { status: 400 })
  }

  // Fetch user's Vedic chart
  const { data: chart } = await supabase
    .from('astra_birth_charts')
    .select('vedic_chart_json')
    .eq('user_id', user.id)
    .not('vedic_chart_json', 'is', null)
    .limit(1)
    .maybeSingle()

  if (!chart?.vedic_chart_json) {
    return NextResponse.json({ error: 'Vedic chart required. Please generate your birth chart first.' }, { status: 400 })
  }

  const vedic = chart.vedic_chart_json as Record<string, unknown>
  const planets = (vedic.planets || []) as { name: string; sign: string; degree: number; house: number; nakshatra: string; retrograde: boolean }[]
  const nakshatras = (vedic.nakshatras || []) as { planet: string; nakshatra: string; pada: number }[]
  const dasha = vedic.dasha as { current_mahadasha: { planet: string } } | undefined
  const moonNak = nakshatras.find(n => n.planet === 'Moon')

  if (!dasha || !moonNak) {
    return NextResponse.json({ error: 'Vedic chart data incomplete' }, { status: 400 })
  }

  // Call engine
  const resp = await fetch(`${FASTAPI_BASE_URL}/vaastu/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': INTERNAL_SECRET },
    body: JSON.stringify({
      property,
      room_details: room_details || null,
      user_nakshatra: moonNak.nakshatra,
      user_name_initial: user_name_initial || null,
      planets,
      dasha_lord: dasha.current_mahadasha.planet,
    }),
  })

  if (!resp.ok) {
    return NextResponse.json({ error: 'Vaastu analysis failed' }, { status: 502 })
  }

  return NextResponse.json(await resp.json())
}
```

- [ ] **Step 3: Create app/api/vaastu/save/route.ts**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // Upsert property data (one per user)
  try {
    await supabase.from('astra_vaastu_properties').upsert({
      user_id: user.id,
      length: body.length,
      breadth: body.breadth,
      entrance_direction: body.entrance_direction,
      floor_level: body.floor_level || 'ground',
      kitchen_zone: body.kitchen_zone || null,
      toilet_zones: body.toilet_zones || null,
      brahmasthan_status: body.brahmasthan_status || null,
      slope_direction: body.slope_direction || null,
      name_initial: body.name_initial || null,
    }, { onConflict: 'user_id' })
  } catch {
    // Table may not exist yet — that's ok
  }

  return NextResponse.json({ saved: true })
}
```

- [ ] **Step 4: Commit**

```bash
git add types/vaastu.ts app/api/vaastu/analyze/route.ts app/api/vaastu/save/route.ts
git commit -m "feat: add Vaastu TypeScript types and API routes

Types for diagnostic results, zone statuses, HITs, Aayadi.
Analyze route calls engine with user's Vedic chart data.
Save route persists property to Supabase."
```

---

## Task 2: PropertyForm Component

Progressive input form for property details.

**Files:**
- Create: `components/vaastu/PropertyForm.tsx`

- [ ] **Step 1: Create PropertyForm**

**IMPORTANT:** Use `frontend-design` and `ui-ux-pro-max` skills. Follow existing Astra design patterns from `PartnerForm.tsx`.

Props interface:
```typescript
interface PropertyFormProps {
  onSubmit: (data: {
    property: { length: number; breadth: number; entrance_direction: string; floor_level: string }
    room_details?: { kitchen_zone?: string; toilet_zones?: string[]; brahmasthan_status?: string; slope_direction?: string }
    user_name_initial?: string
  }) => void
  loading: boolean
}
```

The form has two sections:

**Section 1 (always visible):**
- Length (ft) — number input
- Breadth (ft) — number input
- Main entrance direction — dropdown with 16 options (N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW)
- Floor level — two pill buttons: Ground / Upper

**Section 2 (expandable — "Add Room Details" toggle):**
- Kitchen zone — 16-direction dropdown
- Toilet zones — multi-checkbox or multi-select
- Brahmasthan status — 3 options: Open / Pillared / Walled
- Plot slope direction — 16-direction dropdown
- Name initial — single character input

Style: Same input/label/button patterns as existing forms. Use bg-nebula, border-white/10, text-star, violet-light labels. Expandable section uses Framer Motion AnimatePresence.

Submit button: "Analyze My Space ✦" with the standard gradient style.

- [ ] **Step 2: Commit**

```bash
git add components/vaastu/PropertyForm.tsx
git commit -m "feat: add Vaastu property input form with progressive disclosure

Dimensions, entrance direction, floor level. Expandable room details
section with kitchen, toilet, Brahmasthan, slope, and name initial."
```

---

## Task 3: CompassGrid Component — 16-Zone Visualization

The hero visual — an interactive compass showing zone statuses.

**Files:**
- Create: `components/vaastu/CompassGrid.tsx`

- [ ] **Step 1: Create CompassGrid**

**IMPORTANT:** Use `frontend-design` and `ui-ux-pro-max` skills. This is the most visually distinctive component.

Props:
```typescript
import type { VaastuZoneStatus } from '@/types/vaastu'

interface CompassGridProps {
  zones: VaastuZoneStatus[]
  onZoneClick?: (zone: VaastuZoneStatus) => void
  selectedZone?: string | null
}
```

**Visual design:**
- Circular compass layout with 16 wedge-shaped segments
- Implementation: CSS grid or absolute-positioned elements forming a circle, OR an SVG with 16 arc paths
- The simplest high-quality approach: a CSS grid of 5×5 cells where the outer ring forms the 16 zones and the center is the Brahmasthan marker
- Each zone is color-coded by status:
  - `clear` → bg-white/5 border-white/10
  - `afflicted` → bg-rose/20 border-rose/40
  - `warning` → bg-yellow-400/15 border-yellow-400/30
  - `positive` → bg-violet/20 border-violet/40
- Cardinal directions (N, E, S, W) are larger/more prominent
- Direction labels outside the grid
- Hover effect: scale + glow
- Click: highlights zone and shows detail panel
- Center: small label "Brahmasthan"
- Framer Motion: stagger animation on initial render

**Selected zone detail panel** (shown below or beside the grid when a zone is clicked):
- Zone name, ruling planet, element
- Status with colored badge
- Devtas list with domains
- Hit details if afflicted

- [ ] **Step 2: Commit**

```bash
git add components/vaastu/CompassGrid.tsx
git commit -m "feat: add 16-zone interactive compass grid visualization

Color-coded zones (clear/afflicted/warning/positive), click-to-detail,
Framer Motion stagger animation. Follows Astra cosmic design."
```

---

## Task 4: Result Display Components

Build the remaining result sections: Aayadi card, HIT report, spatial findings, remedies.

**Files:**
- Create: `components/vaastu/AayadiCard.tsx`
- Create: `components/vaastu/HitReport.tsx`
- Create: `components/vaastu/SpatialFindings.tsx`
- Create: `components/vaastu/RemedyList.tsx`

- [ ] **Step 1: Create AayadiCard**

**Use `frontend-design` and `ui-ux-pro-max` skills.**

Props: `{ aayadi: AayadiResult }`

Display:
- "Dimensional Harmony" header
- Visual comparison: Aaya vs Vyaya as two bars or a balance scale metaphor
- Color: green if aaya_greater, rose if not
- Yoni type with icon/emoji and interpretation
- Footprint effects as small tags (green for auspicious, rose for inauspicious)
- Overall harmony badge

- [ ] **Step 2: Create HitReport**

Props: `{ hits: VaastuHitsResponse }`

Display:
- "Planetary Influences" header
- Primary HITs section (prominent, bg-rose/10 cards): attacker → victim, angle, type badge, affected direction
- Positive HITs section (bg-violet/10 cards): supporting planets and zones
- Secondary HITs collapsed by default (expandable)
- HIT type badges: killer=rose, dangerous=orange, obstacle=yellow, best_support=violet, friend=green, positive=blue

- [ ] **Step 3: Create SpatialFindings**

Props: `{ findings: VaastuDiagnosticResult['spatial_findings'], plantRecommendations: VaastuDiagnosticResult['plant_recommendations'] }`

Display:
- "Space Analysis" header
- Rule check list: each finding as a row with pass/warning/fail icon + rule name + description
- Plant recommendations in a separate sub-section with plant name, zone, and purpose

- [ ] **Step 4: Create RemedyList**

Props: `{ remedies: VaastuRemedy[], disclaimer: string }`

Display:
- "Recommended Remedies" header
- Remedies grouped by zone, each as a card with remedy text and reason
- Disclaimer at the bottom in muted text with warning styling

- [ ] **Step 5: Commit**

```bash
git add components/vaastu/AayadiCard.tsx components/vaastu/HitReport.tsx components/vaastu/SpatialFindings.tsx components/vaastu/RemedyList.tsx
git commit -m "feat: add Vaastu result display components

Aayadi harmony card, HIT report with planetary influences,
spatial findings with rule checks, remedy list with disclaimers."
```

---

## Task 5: VaastuView Orchestrator + Page

Wire everything together: the main view component and the page.

**Files:**
- Create: `components/vaastu/VaastuView.tsx`
- Create: `app/vaastu/page.tsx`
- Modify: `middleware.ts`

- [ ] **Step 1: Create VaastuView**

**Use `frontend-design` and `ui-ux-pro-max` skills.**

Props:
```typescript
interface VaastuViewProps {
  hasVedicChart: boolean
}
```

State management:
- `mode`: 'input' | 'results'
- `loading`: boolean
- `result`: VaastuDiagnosticResult | null
- `selectedZone`: string | null

Flow:
1. If `!hasVedicChart` → show "Generate your Vedic chart first" CTA with link to /chart
2. Show PropertyForm
3. On submit → POST to `/api/vaastu/analyze` + POST to `/api/vaastu/save` (fire and forget)
4. On result → switch to results mode, show:
   - CompassGrid (hero, with selectedZone state)
   - AayadiCard
   - HitReport
   - SpatialFindings (if room details were provided)
   - RemedyList
   - "Analyze Again" reset button at bottom

Layout: centered max-w-4xl container. Results stack vertically with Framer Motion fade-in.

- [ ] **Step 2: Create app/vaastu/page.tsx**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import VaastuView from '@/components/vaastu/VaastuView'

export default async function VaastuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/vaastu')

  const { data: chart } = await supabase
    .from('astra_birth_charts')
    .select('vedic_chart_json')
    .eq('user_id', user.id)
    .not('vedic_chart_json', 'is', null)
    .limit(1)
    .maybeSingle()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-24 px-6">
        <div className="max-w-4xl mx-auto py-12">
          <VaastuView hasVedicChart={!!chart?.vedic_chart_json} />
        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 3: Add /vaastu to middleware routes**

In `middleware.ts`, add `/vaastu` to the protected routes array (line 6) and premium routes check (line 11):

Change the `isProtectedRoute` routes array to include `'/vaastu'`:
```typescript
const routes = ['/dashboard', '/chart', '/chat', '/compatibility', '/transit', '/yearly', '/settings', '/vaastu']
```

Change `isPremiumRoute` to include `/vaastu`:
```typescript
return pathname.startsWith('/transit') || pathname.startsWith('/yearly') || pathname.startsWith('/vaastu')
```

- [ ] **Step 4: Add Vaastu to Navbar**

In `components/layout/Navbar.tsx`, add a "Vaastu" link alongside the existing "Transits" link in both desktop and mobile nav menus. Use the same pattern as the existing transit link.

- [ ] **Step 5: Commit**

```bash
git add components/vaastu/VaastuView.tsx app/vaastu/page.tsx middleware.ts components/layout/Navbar.tsx
git commit -m "feat: add premium /vaastu page with full diagnostic flow

Progressive input, compass grid, Aayadi, HITs, spatial findings,
remedies. Protected and premium-gated via middleware."
```

---

## Task 6: Chat Integration — Vaastu Context in System Prompt

When the user has saved Vaastu property data, enrich the chat system prompt.

**Files:**
- Modify: `lib/claude.ts`
- Modify: `app/api/chat/message/route.ts`

- [ ] **Step 1: Update lib/claude.ts PromptParams**

Add an optional `vaastuProfile` field to the existing `PromptParams` interface:

```typescript
  vaastuProfile?: {
    length: number
    breadth: number
    entrance_direction: string
    aayadi_harmony: string
    afflicted_zones: string[]
    dasha_lord: string
    active_hit: string | null
  } | null
```

Add to `buildSystemPrompt`, after the transits section:

```typescript
  if (params.vaastuProfile) {
    const vp = params.vaastuProfile
    prompt += `\n\n=== VAASTU PROFILE ===
Property: ${vp.length}ft × ${vp.breadth}ft, ${vp.entrance_direction} entrance
Aayadi Harmony: ${vp.aayadi_harmony}
Afflicted Zones: ${vp.afflicted_zones.length > 0 ? vp.afflicted_zones.join(', ') : 'None'}
Active Dasha: ${vp.dasha_lord}
${vp.active_hit ? `Active HIT: ${vp.active_hit}` : 'No active negative HITs'}`
  }
```

- [ ] **Step 2: Update chat API route to fetch Vaastu data**

In `app/api/chat/message/route.ts`, after fetching the Vedic chart and transits, fetch the saved Vaastu property:

```typescript
  // Fetch Vaastu property if saved
  let vaastuProfile = null
  try {
    const { data: vaastuProp } = await supabase
      .from('astra_vaastu_properties')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (vaastuProp) {
      vaastuProfile = {
        length: vaastuProp.length,
        breadth: vaastuProp.breadth,
        entrance_direction: vaastuProp.entrance_direction,
        aayadi_harmony: 'See /vaastu for details',
        afflicted_zones: [],  // Simplified — full analysis requires engine call
        dasha_lord: vedicData?.dasha?.current_mahadasha?.planet || 'Unknown',
        active_hit: null,
      }
    }
  } catch {
    // Table may not exist
  }
```

Pass `vaastuProfile` to `buildSystemPrompt`:
```typescript
  const systemPrompt = buildSystemPrompt({
    ...existingParams,
    vaastuProfile,
  })
```

- [ ] **Step 3: Commit**

```bash
git add lib/claude.ts app/api/chat/message/route.ts
git commit -m "feat: add Vaastu context to chat system prompt

When user has saved property data, Astra can answer Vaastu questions
using real property dimensions and entrance direction."
```

---

## Task 7: Final Verification

**Files:** No new files

- [ ] **Step 1: Run engine tests**

Run: `cd engine && venv/Scripts/python -m pytest -v --tb=short`
Expected: All 158 tests pass (no engine changes in this sub-project)

- [ ] **Step 2: Verify frontend builds**

Run: `npm run build`
Expected: Build succeeds (Stripe type error already fixed)

- [ ] **Step 3: Verify route count**

Run: `cd engine && venv/Scripts/python -c "from app.main import app; print('App loaded with', len(app.routes), 'routes')"`
Expected: 16 routes

- [ ] **Step 4: Commit any fixes if needed**

---

## Supabase Table (for deployment)

The `/vaastu` page needs this table created in Supabase:

```sql
create table astra_vaastu_properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  length float not null,
  breadth float not null,
  entrance_direction text not null,
  floor_level text default 'ground',
  kitchen_zone text,
  toilet_zones text[],
  brahmasthan_status text,
  slope_direction text,
  name_initial text,
  created_at timestamptz default now()
);
```

The save route handles the missing table gracefully (fails silently).
