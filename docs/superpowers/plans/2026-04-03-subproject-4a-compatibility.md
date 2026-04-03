# Sub-project 4A: Partner Compatibility — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/compatibility` page with partner chart input, synastry scoring via FastAPI, and Claude-generated compatibility report (premium).

**Architecture:** FastAPI calculates cross-aspects between two Western charts and returns a compatibility score. Next.js BFF orchestrates: geocode partner city → calculate partner chart → save → run compatibility → optional Claude report. Client renders form → results with score circle, aspects, and premium report gate.

**Tech Stack:** Python 3.11+ (FastAPI, pyswisseph), Next.js 14 (App Router), TypeScript, @anthropic-ai/sdk (Claude), Supabase, Tailwind CSS, Vitest, pytest.

---

## File Map

| File | Responsibility |
|------|---------------|
| `engine/app/models/schemas.py` | Add compatibility request/response schemas |
| `engine/app/services/compatibility.py` | Synastry calculation — cross-aspects + scoring |
| `engine/app/routes/compatibility.py` | POST /compatibility endpoint |
| `engine/app/main.py` | Register compatibility router |
| `engine/tests/test_compatibility.py` | Synastry calculation tests |
| `types/index.ts` | Add CompatibilityResult interface |
| `lib/compatibility.ts` | Claude report generation + FastAPI client |
| `app/api/compatibility/route.ts` | BFF orchestration route |
| `components/compatibility/PartnerForm.tsx` | Partner birth details form |
| `components/compatibility/CompatibilityResult.tsx` | Score + aspects + report display |
| `components/compatibility/CompatibilityView.tsx` | Main container (form ↔ results) |
| `app/compatibility/page.tsx` | Server component page |
| `__tests__/components/compatibility/CompatibilityResult.test.tsx` | Result display tests |

---

## Task 1: Pydantic Schemas for Compatibility

**Files:**
- Modify: `engine/app/models/schemas.py`

- [ ] **Step 1: Add compatibility schemas**

Append to `engine/app/models/schemas.py`:

```python
class CompatibilityPlanet(BaseModel):
    name: str
    sign: str
    degree: int


class CompatibilityRequest(BaseModel):
    chart1_planets: list[CompatibilityPlanet]
    chart2_planets: list[CompatibilityPlanet]


class CrossAspect(BaseModel):
    planet1: str  # from chart1
    planet2: str  # from chart2
    type: str
    orb: float


class CompatibilityResponse(BaseModel):
    score: int
    aspects: list[CrossAspect]
    summary: str
```

- [ ] **Step 2: Commit**

```bash
git add -f engine/app/models/schemas.py
git commit -m "feat: add Pydantic schemas for compatibility endpoint"
```

---

## Task 2: Synastry Calculation Service

**Files:**
- Create: `engine/app/services/compatibility.py`

- [ ] **Step 1: Create the compatibility service**

Create `engine/app/services/compatibility.py`:

```python
from app.services.western_chart import ZODIAC_SIGNS, _angular_separation

ASPECT_DEFINITIONS = [
    ("conjunction", 0.0, 8.0),
    ("opposition", 180.0, 8.0),
    ("trine", 120.0, 7.0),
    ("square", 90.0, 7.0),
    ("sextile", 60.0, 5.0),
]

PERSONAL_PLANETS = {"Sun", "Moon", "Venus"}


def _sign_degree_to_longitude(sign: str, degree: int) -> float:
    """Convert sign name + degree to ecliptic longitude (0-360)."""
    index = ZODIAC_SIGNS.index(sign)
    return index * 30.0 + degree


def calculate_compatibility(
    chart1_planets: list[dict],
    chart2_planets: list[dict],
) -> dict:
    """Calculate synastry cross-aspects and compatibility score."""
    # Convert to longitudes
    c1 = {p["name"]: _sign_degree_to_longitude(p["sign"], p["degree"]) for p in chart1_planets}
    c2 = {p["name"]: _sign_degree_to_longitude(p["sign"], p["degree"]) for p in chart2_planets}

    # Find cross-aspects
    aspects = []
    for name1, lon1 in c1.items():
        for name2, lon2 in c2.items():
            sep = _angular_separation(lon1, lon2)
            for aspect_type, angle, max_orb in ASPECT_DEFINITIONS:
                orb = abs(sep - angle)
                if orb <= max_orb:
                    aspects.append({
                        "planet1": name1,
                        "planet2": name2,
                        "type": aspect_type,
                        "orb": round(orb, 1),
                    })
                    break

    # Score: start at 50
    score = 50
    for a in aspects:
        is_personal = a["planet1"] in PERSONAL_PLANETS or a["planet2"] in PERSONAL_PLANETS
        if a["type"] == "conjunction":
            score += 5 if is_personal else 3
        elif a["type"] == "trine":
            score += 4
        elif a["type"] == "sextile":
            score += 3
        elif a["type"] == "square":
            score -= 3
        elif a["type"] == "opposition":
            score -= 2

    score = max(0, min(100, score))

    # Sort by orb (tightest first) and build summary from top 3
    sorted_aspects = sorted(aspects, key=lambda a: a["orb"])
    top3 = sorted_aspects[:3]
    summary_parts = []
    for a in top3:
        summary_parts.append(f"{a['planet1']}-{a['planet2']} {a['type']} ({a['orb']}°)")
    summary = "Key connections: " + ", ".join(summary_parts) if summary_parts else "No strong cross-aspects found."

    return {
        "score": score,
        "aspects": sorted_aspects,
        "summary": summary,
    }
```

- [ ] **Step 2: Commit**

```bash
git add -f engine/app/services/compatibility.py
git commit -m "feat: add synastry cross-aspect calculation with scoring"
```

---

## Task 3: Compatibility Endpoint + Tests

**Files:**
- Create: `engine/app/routes/compatibility.py`
- Modify: `engine/app/main.py`
- Create: `engine/tests/test_compatibility.py`

- [ ] **Step 1: Create the route**

Create `engine/app/routes/compatibility.py`:

```python
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from app.models.schemas import CompatibilityRequest, CompatibilityResponse, ErrorResponse
from app.services.compatibility import calculate_compatibility

router = APIRouter()


@router.post(
    "/compatibility",
    response_model=CompatibilityResponse,
    responses={500: {"model": ErrorResponse}},
)
async def compatibility(request: CompatibilityRequest):
    try:
        chart1 = [p.model_dump() for p in request.chart1_planets]
        chart2 = [p.model_dump() for p in request.chart2_planets]
        result = calculate_compatibility(chart1, chart2)
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "calculation_failed", "detail": str(e)},
        )
```

- [ ] **Step 2: Register the router in main.py**

Read `engine/app/main.py` and add after the vedic router:

```python
from app.routes.compatibility import router as compatibility_router

app.include_router(compatibility_router)
```

- [ ] **Step 3: Write the tests**

Create `engine/tests/test_compatibility.py`:

```python
import os
import pytest
from httpx import AsyncClient, ASGITransport

os.environ["INTERNAL_SECRET"] = "test-secret"

from app.main import app

HEADERS = {"X-Internal-Secret": "test-secret"}

# Two charts with known positions for predictable aspects
CHART1_PLANETS = [
    {"name": "Sun", "sign": "Taurus", "degree": 24},
    {"name": "Moon", "sign": "Scorpio", "degree": 8},
    {"name": "Mercury", "sign": "Taurus", "degree": 12},
    {"name": "Venus", "sign": "Gemini", "degree": 2},
    {"name": "Mars", "sign": "Pisces", "degree": 18},
    {"name": "Jupiter", "sign": "Cancer", "degree": 6},
    {"name": "Saturn", "sign": "Capricorn", "degree": 25},
    {"name": "Uranus", "sign": "Capricorn", "degree": 9},
    {"name": "Neptune", "sign": "Capricorn", "degree": 14},
    {"name": "Pluto", "sign": "Scorpio", "degree": 16},
]

CHART2_PLANETS = [
    {"name": "Sun", "sign": "Leo", "degree": 28},
    {"name": "Moon", "sign": "Taurus", "degree": 20},
    {"name": "Mercury", "sign": "Virgo", "degree": 5},
    {"name": "Venus", "sign": "Cancer", "degree": 10},
    {"name": "Mars", "sign": "Aries", "degree": 15},
    {"name": "Jupiter", "sign": "Virgo", "degree": 22},
    {"name": "Saturn", "sign": "Aquarius", "degree": 1},
    {"name": "Uranus", "sign": "Capricorn", "degree": 18},
    {"name": "Neptune", "sign": "Capricorn", "degree": 19},
    {"name": "Pluto", "sign": "Scorpio", "degree": 20},
]


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_compatibility_returns_score_in_range(client):
    response = await client.post(
        "/compatibility",
        json={"chart1_planets": CHART1_PLANETS, "chart2_planets": CHART2_PLANETS},
        headers=HEADERS,
    )
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["score"] <= 100


@pytest.mark.asyncio
async def test_compatibility_returns_aspects_with_valid_types(client):
    response = await client.post(
        "/compatibility",
        json={"chart1_planets": CHART1_PLANETS, "chart2_planets": CHART2_PLANETS},
        headers=HEADERS,
    )
    data = response.json()
    valid_types = {"trine", "square", "conjunction", "opposition", "sextile"}
    assert len(data["aspects"]) > 0
    for aspect in data["aspects"]:
        assert aspect["type"] in valid_types
        assert aspect["orb"] >= 0


@pytest.mark.asyncio
async def test_compatibility_returns_summary(client):
    response = await client.post(
        "/compatibility",
        json={"chart1_planets": CHART1_PLANETS, "chart2_planets": CHART2_PLANETS},
        headers=HEADERS,
    )
    data = response.json()
    assert len(data["summary"]) > 0


@pytest.mark.asyncio
async def test_compatibility_aspects_sorted_by_orb(client):
    response = await client.post(
        "/compatibility",
        json={"chart1_planets": CHART1_PLANETS, "chart2_planets": CHART2_PLANETS},
        headers=HEADERS,
    )
    data = response.json()
    orbs = [a["orb"] for a in data["aspects"]]
    assert orbs == sorted(orbs)


@pytest.mark.asyncio
async def test_compatibility_identical_charts_high_score(client):
    """Two identical charts should have many conjunctions = high score."""
    response = await client.post(
        "/compatibility",
        json={"chart1_planets": CHART1_PLANETS, "chart2_planets": CHART1_PLANETS},
        headers=HEADERS,
    )
    data = response.json()
    assert data["score"] >= 80
```

- [ ] **Step 4: Run tests**

```bash
cd engine && source venv/Scripts/activate && python -m pytest tests/test_compatibility.py -v
```

Expected: 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add -f engine/app/routes/compatibility.py engine/app/main.py engine/tests/test_compatibility.py
git commit -m "feat: add POST /compatibility endpoint with synastry tests"
```

---

## Task 4: Next.js Types + Compatibility Client

**Files:**
- Modify: `types/index.ts`
- Create: `lib/compatibility.ts`
- Create: `__tests__/lib/compatibility.test.ts`

- [ ] **Step 1: Add CompatibilityResult type**

Append to `types/index.ts` after `HoroscopeData`:

```ts
export interface CrossAspect {
  planet1: string
  planet2: string
  type: string
  orb: number
}

export interface CompatibilityResult {
  score: number
  aspects: CrossAspect[]
  summary: string
  report: string | null
  partner_chart_id: string
}
```

- [ ] **Step 2: Write the failing test**

Create `__tests__/lib/compatibility.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('compatibility', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.CLAUDE_API_KEY = 'test-key'
  })

  it('buildCompatibilityReportPrompt includes names, score, and chart summaries', async () => {
    const { buildCompatibilityReportPrompt } = await import('@/lib/compatibility')
    const prompt = buildCompatibilityReportPrompt({
      userName: 'Sadip',
      partnerName: 'Sarah',
      score: 72,
      topAspects: 'Sun-Moon trine (1.3°), Venus-Mars conjunction (0.8°)',
      userChartSummary: 'Sun Taurus, Moon Scorpio, ASC Libra',
      partnerChartSummary: 'Sun Leo, Moon Taurus, ASC Aries',
    })

    expect(prompt).toContain('Sadip')
    expect(prompt).toContain('Sarah')
    expect(prompt).toContain('72')
    expect(prompt).toContain('Sun Taurus')
    expect(prompt).toContain('Sun Leo')
    expect(prompt).toContain('Sun-Moon trine')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/compatibility.test.ts`
Expected: FAIL

- [ ] **Step 4: Create the compatibility client**

Create `lib/compatibility.ts`:

```ts
import Anthropic from '@anthropic-ai/sdk'
import type { WesternChartData } from '@/types'

interface ReportParams {
  userName: string
  partnerName: string
  score: number
  topAspects: string
  userChartSummary: string
  partnerChartSummary: string
}

export function buildCompatibilityReportPrompt(params: ReportParams): string {
  return `You are Astra, a warm and wise astrologer. Generate a ~300 word compatibility reading for ${params.userName} and ${params.partnerName}.

Their synastry shows:
Score: ${params.score}/100
Key aspects: ${params.topAspects}

${params.userName}'s chart: ${params.userChartSummary}
${params.partnerName}'s chart: ${params.partnerChartSummary}

Write a warm, insightful reading about their connection. Reference specific aspects. Be encouraging but honest about challenges.`
}

export async function generateCompatibilityReport(params: ReportParams): Promise<string | null> {
  try {
    const client = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY })
    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: buildCompatibilityReportPrompt(params) }],
    })

    const block = response.content[0]
    return block.type === 'text' ? block.text : null
  } catch {
    return null
  }
}

export async function callCompatibilityEngine(
  chart1Planets: WesternChartData['planets'],
  chart2Planets: WesternChartData['planets'],
): Promise<{ score: number; aspects: { planet1: string; planet2: string; type: string; orb: number }[]; summary: string } | null> {
  const baseUrl = process.env.FASTAPI_BASE_URL || 'http://localhost:8000'
  const secret = process.env.INTERNAL_SECRET || ''

  try {
    const response = await fetch(`${baseUrl}/compatibility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': secret,
      },
      body: JSON.stringify({
        chart1_planets: chart1Planets.map(p => ({ name: p.name, sign: p.sign, degree: p.degree })),
        chart2_planets: chart2Planets.map(p => ({ name: p.name, sign: p.sign, degree: p.degree })),
      }),
    })

    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/compatibility.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add types/index.ts lib/compatibility.ts __tests__/lib/compatibility.test.ts
git commit -m "feat: add compatibility types, Claude report builder, and engine client"
```

---

## Task 5: BFF Compatibility Route

**Files:**
- Create: `app/api/compatibility/route.ts`

- [ ] **Step 1: Create the orchestration route**

Create `app/api/compatibility/route.ts`:

```ts
import { createClient } from '@/lib/supabase/server'
import { geocodeCity, GeocodingError } from '@/lib/geocoding'
import { calculateWesternChart } from '@/lib/astrology-engine'
import { callCompatibilityEngine, generateCompatibilityReport } from '@/lib/compatibility'
import { NextResponse } from 'next/server'
import type { WesternChartData } from '@/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { partner_name, date_of_birth, time_of_birth, place_of_birth } = body

  if (!partner_name || !date_of_birth || !place_of_birth) {
    return NextResponse.json({ error: 'partner_name, date_of_birth, and place_of_birth are required' }, { status: 400 })
  }

  // Fetch user's profile and chart
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, subscription_tier')
    .eq('id', user.id)
    .single()

  const { data: userChart } = await supabase
    .from('birth_charts')
    .select('western_chart_json')
    .eq('user_id', user.id)
    .not('western_chart_json', 'is', null)
    .limit(1)
    .maybeSingle()

  if (!userChart?.western_chart_json) {
    return NextResponse.json({ error: 'no_chart' }, { status: 400 })
  }

  const userChartData = userChart.western_chart_json as WesternChartData

  // Geocode partner's city
  let geoResult
  try {
    geoResult = await geocodeCity(place_of_birth)
  } catch (err) {
    if (err instanceof GeocodingError) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 503 })
  }

  // Calculate partner's Western chart
  const partnerChartData = await calculateWesternChart({
    date_of_birth,
    time_of_birth: time_of_birth || null,
    latitude: geoResult.lat,
    longitude: geoResult.lng,
    timezone: geoResult.timezone,
  })

  // Save partner chart
  const { data: partnerChart } = await supabase
    .from('birth_charts')
    .insert({
      user_id: user.id,
      label: `Partner - ${partner_name}`,
      date_of_birth,
      time_of_birth: time_of_birth || null,
      place_of_birth: geoResult.displayName,
      latitude: geoResult.lat,
      longitude: geoResult.lng,
      timezone: geoResult.timezone,
      western_chart_json: partnerChartData,
      vedic_chart_json: null,
    })
    .select('id')
    .single()

  if (!partnerChart) {
    return NextResponse.json({ error: 'Failed to save partner chart' }, { status: 500 })
  }

  // Calculate compatibility
  if (!partnerChartData) {
    return NextResponse.json({
      score: null,
      aspects: [],
      summary: null,
      report: null,
      partner_chart_id: partnerChart.id,
    })
  }

  const compatibility = await callCompatibilityEngine(userChartData.planets, partnerChartData.planets)

  if (!compatibility) {
    return NextResponse.json({
      score: null,
      aspects: [],
      summary: null,
      report: null,
      partner_chart_id: partnerChart.id,
    })
  }

  // Generate Claude report for premium users
  let report: string | null = null
  if (profile?.subscription_tier === 'premium') {
    const topAspects = compatibility.aspects
      .slice(0, 5)
      .map(a => `${a.planet1}-${a.planet2} ${a.type} (${a.orb}°)`)
      .join(', ')

    report = await generateCompatibilityReport({
      userName: profile.name || 'You',
      partnerName: partner_name,
      score: compatibility.score,
      topAspects,
      userChartSummary: userChartData.summary,
      partnerChartSummary: partnerChartData.summary,
    })
  }

  return NextResponse.json({
    score: compatibility.score,
    aspects: compatibility.aspects,
    summary: compatibility.summary,
    report,
    partner_chart_id: partnerChart.id,
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/compatibility/route.ts
git commit -m "feat: add compatibility BFF route with partner chart save and Claude report"
```

---

## Task 6: PartnerForm Component

**Files:**
- Create: `components/compatibility/PartnerForm.tsx`

- [ ] **Step 1: Create the form component**

Create `components/compatibility/PartnerForm.tsx`:

```tsx
'use client'

import { useState } from 'react'

interface PartnerFormProps {
  onSubmit: (data: {
    partner_name: string
    date_of_birth: string
    time_of_birth: string
    place_of_birth: string
  }) => void
  loading: boolean
}

export default function PartnerForm({ onSubmit, loading }: PartnerFormProps) {
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [tob, setTob] = useState('')
  const [city, setCity] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !dob || !city.trim()) {
      setError('Name, date of birth, and city are required')
      return
    }
    onSubmit({
      partner_name: name.trim(),
      date_of_birth: dob,
      time_of_birth: tob,
      place_of_birth: city.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-5">
      <div>
        <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          Partner's Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Sarah"
          className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm placeholder:text-muted focus:outline-none focus:border-violet/50"
        />
      </div>
      <div>
        <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          Date of Birth
        </label>
        <input
          type="date"
          value={dob}
          onChange={e => setDob(e.target.value)}
          className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm focus:outline-none focus:border-violet/50"
        />
      </div>
      <div>
        <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          Time of Birth <span className="text-muted font-normal normal-case">(optional)</span>
        </label>
        <input
          type="time"
          value={tob}
          onChange={e => setTob(e.target.value)}
          className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm focus:outline-none focus:border-violet/50"
        />
      </div>
      <div>
        <label className="block text-violet-light text-xs font-semibold tracking-widest uppercase mb-2">
          City of Birth
        </label>
        <input
          type="text"
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="e.g. Pokhara"
          className="w-full bg-nebula border border-white/10 rounded-xl px-4 py-3 text-star text-sm placeholder:text-muted focus:outline-none focus:border-violet/50"
        />
      </div>
      {error && <p className="text-rose text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-violet to-rose text-white rounded-xl py-3 font-semibold text-sm disabled:opacity-50 hover:shadow-lg hover:shadow-violet/30 transition-all"
      >
        {loading ? 'Calculating...' : 'Check Compatibility ✦'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/compatibility/PartnerForm.tsx
git commit -m "feat: add PartnerForm component for compatibility input"
```

---

## Task 7: CompatibilityResult Component

**Files:**
- Create: `components/compatibility/CompatibilityResult.tsx`
- Create: `__tests__/components/compatibility/CompatibilityResult.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `__tests__/components/compatibility/CompatibilityResult.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CompatibilityResult from '@/components/compatibility/CompatibilityResult'

const mockResult = {
  score: 72,
  aspects: [
    { planet1: 'Sun', planet2: 'Moon', type: 'trine', orb: 1.3 },
    { planet1: 'Venus', planet2: 'Mars', type: 'conjunction', orb: 0.8 },
    { planet1: 'Moon', planet2: 'Saturn', type: 'square', orb: 2.1 },
    { planet1: 'Mercury', planet2: 'Jupiter', type: 'sextile', orb: 3.0 },
    { planet1: 'Mars', planet2: 'Pluto', type: 'opposition', orb: 4.2 },
    { planet1: 'Jupiter', planet2: 'Neptune', type: 'trine', orb: 5.1 },
  ],
  summary: 'Key connections: Sun-Moon trine',
  report: null,
  partnerName: 'Sarah',
}

describe('CompatibilityResult', () => {
  it('renders the score', () => {
    render(<CompatibilityResult {...mockResult} isPremium={false} />)
    expect(screen.getByText('72')).toBeInTheDocument()
  })

  it('shows top 5 aspects for free users', () => {
    render(<CompatibilityResult {...mockResult} isPremium={false} />)
    expect(screen.getByText('Trine')).toBeInTheDocument()
    expect(screen.getByText('Conjunction')).toBeInTheDocument()
  })

  it('shows premium gate for free users', () => {
    render(<CompatibilityResult {...mockResult} isPremium={false} />)
    expect(screen.getByText(/unlock full report/i)).toBeInTheDocument()
  })

  it('shows report for premium users', () => {
    render(
      <CompatibilityResult
        {...mockResult}
        report="Your connection is written in the stars..."
        isPremium={true}
      />
    )
    expect(screen.getByText(/written in the stars/i)).toBeInTheDocument()
  })

  it('shows all aspects for premium users', () => {
    render(<CompatibilityResult {...mockResult} isPremium={true} />)
    // 6th aspect should be visible for premium
    expect(screen.getAllByText('Trine').length).toBe(2) // two trines in mock data
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/components/compatibility/CompatibilityResult.test.tsx`
Expected: FAIL

- [ ] **Step 3: Create the component**

Create `components/compatibility/CompatibilityResult.tsx`:

```tsx
'use client'

import Link from 'next/link'
import type { CrossAspect } from '@/types'

interface CompatibilityResultProps {
  score: number
  aspects: CrossAspect[]
  summary: string
  report: string | null
  partnerName: string
  isPremium: boolean
  onReset?: () => void
}

const ASPECT_COLORS: Record<string, string> = {
  conjunction: 'text-violet-light',
  trine: 'text-violet-light',
  sextile: 'text-violet-light',
  square: 'text-rose',
  opposition: 'text-rose',
}

function scoreColor(score: number): string {
  if (score >= 71) return 'text-violet-light'
  if (score >= 41) return 'text-yellow-400'
  return 'text-rose'
}

function scoreBorder(score: number): string {
  if (score >= 71) return 'border-violet/50'
  if (score >= 41) return 'border-yellow-400/50'
  return 'border-rose/50'
}

export default function CompatibilityResult({
  score, aspects, summary, report, partnerName, isPremium, onReset,
}: CompatibilityResultProps) {
  const visibleAspects = isPremium ? aspects : aspects.slice(0, 5)

  return (
    <div className="max-w-lg mx-auto">
      {/* Score circle */}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${scoreBorder(score)}`}>
          <div>
            <span className={`text-4xl font-display font-bold ${scoreColor(score)}`}>{score}</span>
            <p className="text-muted text-xs">/100</p>
          </div>
        </div>
        <p className="text-star font-display text-xl mt-4">You & {partnerName}</p>
        <p className="text-muted text-sm mt-1">{summary}</p>
      </div>

      {/* Aspects list */}
      <div className="space-y-2 mb-6">
        <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">Cross-Aspects</p>
        {visibleAspects.map((a, i) => {
          const typeName = a.type.charAt(0).toUpperCase() + a.type.slice(1)
          return (
            <div key={i} className="flex items-center gap-3 px-4 py-3 bg-nebula border border-white/5 rounded-xl">
              <span className="text-star text-sm font-medium">{a.planet1}</span>
              <span className={`text-sm ${ASPECT_COLORS[a.type] ?? 'text-muted'}`}>{typeName}</span>
              <span className="text-star text-sm font-medium">{a.planet2}</span>
              <span className="text-muted text-xs ml-auto">{a.orb}°</span>
            </div>
          )
        })}
      </div>

      {/* Premium gate or report */}
      {!isPremium && aspects.length > 5 && (
        <div className="bg-violet/10 border border-violet/30 rounded-xl p-5 text-center mb-6">
          <p className="text-star text-sm font-medium mb-1">Unlock Full Report</p>
          <p className="text-muted text-xs mb-4">
            See all {aspects.length} cross-aspects and get Astra's detailed compatibility reading.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-gradient-to-r from-violet to-rose text-white rounded-full px-6 py-2.5 font-semibold text-sm hover:shadow-lg hover:shadow-violet/30 transition-all"
          >
            Upgrade to Premium
          </Link>
        </div>
      )}

      {isPremium && report && (
        <div className="bg-nebula border border-violet/20 rounded-2xl p-6 mb-6">
          <p className="text-violet-light text-xs font-semibold tracking-widest uppercase mb-3">Astra's Reading</p>
          <p className="text-star text-sm leading-relaxed">{report}</p>
        </div>
      )}

      {/* Try another */}
      {onReset && (
        <div className="text-center">
          <button
            onClick={onReset}
            className="text-violet-light text-sm hover:text-violet transition-colors"
          >
            ← Try another partner
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/components/compatibility/CompatibilityResult.test.tsx`
Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add components/compatibility/CompatibilityResult.tsx __tests__/components/compatibility/CompatibilityResult.test.tsx
git commit -m "feat: add CompatibilityResult with score circle, aspects, and premium gate"
```

---

## Task 8: CompatibilityView + Page

**Files:**
- Create: `components/compatibility/CompatibilityView.tsx`
- Create: `app/compatibility/page.tsx`

- [ ] **Step 1: Create the main container**

Create `components/compatibility/CompatibilityView.tsx`:

```tsx
'use client'

import { useState } from 'react'
import PartnerForm from '@/components/compatibility/PartnerForm'
import CompatibilityResult from '@/components/compatibility/CompatibilityResult'
import type { CrossAspect } from '@/types'

interface Result {
  score: number
  aspects: CrossAspect[]
  summary: string
  report: string | null
  partner_chart_id: string
}

interface CompatibilityViewProps {
  isPremium: boolean
}

export default function CompatibilityView({ isPremium }: CompatibilityViewProps) {
  const [result, setResult] = useState<Result | null>(null)
  const [partnerName, setPartnerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(data: {
    partner_name: string
    date_of_birth: string
    time_of_birth: string
    place_of_birth: string
  }) {
    setLoading(true)
    setError('')
    setPartnerName(data.partner_name)

    try {
      const response = await fetch('/api/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const err = await response.json()
        setError(err.error || 'Something went wrong')
        setLoading(false)
        return
      }

      const resultData = await response.json()
      if (resultData.score === null) {
        setError('Chart calculations temporarily unavailable. Please try again later.')
        setLoading(false)
        return
      }

      setResult(resultData)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <CompatibilityResult
        score={result.score}
        aspects={result.aspects}
        summary={result.summary}
        report={result.report}
        partnerName={partnerName}
        isPremium={isPremium}
        onReset={() => { setResult(null); setPartnerName(''); setError('') }}
      />
    )
  }

  return (
    <div>
      <div className="text-center mb-10">
        <div className="text-4xl mb-3">💫</div>
        <h2 className="font-display text-2xl text-star mb-2">Check Your Compatibility</h2>
        <p className="text-muted text-sm">Enter your partner's birth details to discover your cosmic connection.</p>
      </div>
      {error && (
        <div className="max-w-md mx-auto mb-4 bg-rose/10 border border-rose/30 rounded-xl p-4 text-center">
          <p className="text-rose text-sm">{error}</p>
        </div>
      )}
      <PartnerForm onSubmit={handleSubmit} loading={loading} />
    </div>
  )
}
```

- [ ] **Step 2: Create the page**

Create `app/compatibility/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import CompatibilityView from '@/components/compatibility/CompatibilityView'

export default async function CompatibilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/compatibility')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const { data: chart } = await supabase
    .from('birth_charts')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!chart) redirect('/signup/onboarding')

  const isPremium = profile?.subscription_tier === 'premium'

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-void pt-24 px-6">
        <div className="max-w-4xl mx-auto py-12">
          <CompatibilityView isPremium={isPremium} />
        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add components/compatibility/CompatibilityView.tsx app/compatibility/page.tsx
git commit -m "feat: add CompatibilityView container and /compatibility page"
```

---

## Task 9: Final Verification

- [ ] **Step 1: Run all Python tests**

```bash
cd engine && source venv/Scripts/activate && python -m pytest tests/ -v
```

Expected: All engine tests pass (auth + western + vedic + compatibility)

- [ ] **Step 2: Run all Next.js tests**

```bash
npx vitest run
```

Expected: All frontend tests pass

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No new type errors
