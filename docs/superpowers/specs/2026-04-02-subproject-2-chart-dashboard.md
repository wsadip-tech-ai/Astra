# Sub-project 2: Birth Chart Visualization + Dashboard — Design Spec

## Overview

Build the `/chart` page and enhance the `/dashboard` with birth chart data. Frontend-first approach using mock chart data — no FastAPI dependency. The astrology engine (pyswisseph) will be wired in later; all components read from `western_chart_json` on the `birth_charts` table, falling back to mock data when null.

---

## Approach

**Frontend-first with mock data.** The FastAPI astrology engine is deferred. All chart visualization and dashboard enhancements use a hardcoded mock chart (`constants/mock-chart.ts`) until the engine populates `western_chart_json` on the `birth_charts` row. Components are built to read from the real column — mock data is the fallback, not a separate code path.

---

## Data Model

### New Types (`types/index.ts`)

```ts
interface Planet {
  name: string          // "Sun", "Moon", "Mercury", etc.
  symbol: string        // "☉", "☽", "☿", etc.
  sign: string          // "Taurus", "Scorpio", etc.
  degree: number        // 0–29
  house: number         // 1–12
  retrograde: boolean
}

interface House {
  number: number        // 1–12
  sign: string
  degree: number
}

interface Aspect {
  planet1: string       // planet name
  planet2: string
  type: string          // "trine", "square", "conjunction", "opposition", "sextile"
  orb: number           // degrees of orb
}

interface WesternChartData {
  summary: string       // e.g. "Sun Taurus, Moon Scorpio, ASC Libra"
  planets: Planet[]
  houses: House[]
  aspects: Aspect[]
}
```

These extend the existing `BirthChart` interface — `western_chart_json` is typed as `WesternChartData | null`.

### Mock Chart Data (`constants/mock-chart.ts`)

Realistic sample chart for: **May 15, 1990, 2:30 PM, Kathmandu**

**10 planets:** Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
**12 houses** with sign and degree
**~8 aspects:** mix of trines, squares, conjunctions, oppositions, sextiles

Also includes mock "cosmic weather" data — 3–4 current planetary positions with short interpretive text for the dashboard.

---

## /chart Page

**Route:** `app/chart/page.tsx` — server component, auth-protected.

**No chart redirect:** If user has no `birth_charts` row, redirect to `/signup/onboarding`.

**Data flow:** Fetch `birth_charts` row → read `western_chart_json` → if null, use mock data → pass to client tab component.

### Tabbed Layout

Client component `ChartTabs` with 4 tabs:

#### Tab 1: Overview
- **Big 3 hero cards** — Sun, Moon, Rising (Ascendant). Each card: large glyph, planet name, sign + degree, house number. Styled with gradient background and violet border.
- **Summary text** — 2–3 sentence personality summary derived from chart data. Mock text for now (becomes Claude-generated in Sub-project 3).

#### Tab 2: Planets
- **Full 10-planet card grid** — 2 columns on mobile, 3–4 on desktop.
- Each card: planet glyph, name, sign, degree, house, retrograde badge (if applicable).
- Compact style — smaller than Big 3 cards.

#### Tab 3: Aspects
- **Aspect list** — each row shows: planet1 glyph, aspect symbol, planet2 glyph, aspect type name, orb value.
- **Color-coded by nature:**
  - Harmonious (trine, sextile, conjunction): violet/lavender tones
  - Challenging (square, opposition): pink/rose tones
- Sorted by orb (tightest first).

#### Tab 4: Vedic (Premium)
- **Free users:** Shows premium upsell card — "Unlock Vedic Astrology" with feature list (Nakshatra analysis, Dasha periods, Kundali chart) and CTA button to `/pricing`.
- **Premium users:** Empty shell for now with "Coming soon" message. Populated when FastAPI Vedic calculation is built.

### Chart Visualization Style

**Modern Card Grid** — no circular wheel chart. Clean, mobile-friendly cards showing planet sign, degree, and house. Aspects listed in a separate tab. This is simpler to build, more readable on mobile, and aligns with the platform's modern aesthetic.

**Planet display hierarchy:**
- Big 3 (Sun, Moon, Rising) shown prominently on Overview tab
- All 10 planets on Planets tab in a uniform grid

---

## Enhanced Dashboard

**Route:** `app/dashboard/page.tsx` — extends existing page.

### New Sections (added above existing feature cards)

#### 1. "Your Cosmic Profile"
- **Shown only if** user has a `birth_charts` row.
- Three compact cards in a row: Sun sign, Moon sign, Rising sign.
- Each card: glyph, sign name, one-word trait (e.g., "Grounded", "Intense", "Diplomatic").
- Links to `/chart` for full details.
- Data: derived from `western_chart_json` (or mock fallback).

#### 2. "Today's Cosmic Weather"
- **Always shown** (no chart required).
- Styled card with 3–4 mock planetary positions/transits.
- Example entries: "Mercury in Aries — communication gets direct", "Venus enters Taurus — love slows down".
- Static mock data for now. Becomes live when FastAPI `/transits` endpoint is built.

### Existing Elements (unchanged)
- Welcome header with user name
- Onboarding prompt (if no chart)
- 3 feature cards (My Birth Chart, Talk to Astra, Compatibility)

---

## Component Structure

| Component | Type | Responsibility |
|-----------|------|---------------|
| `components/chart/ChartTabs.tsx` | Client | Tab switcher — manages active tab state, renders tab content |
| `components/chart/PlanetCard.tsx` | Client | Single planet card — glyph, name, sign, degree, house, retrograde badge |
| `components/chart/AspectRow.tsx` | Client | Single aspect row — planet glyphs, type, orb, color-coded |
| `components/chart/VedicGate.tsx` | Client | Premium upsell prompt for Vedic tab (free users) |
| `components/dashboard/CosmicProfile.tsx` | Server | Big 3 summary cards for dashboard |
| `components/dashboard/CosmicWeather.tsx` | Server | Today's planetary positions (mock data) |

### New Data Files

| File | Purpose |
|------|---------|
| `constants/mock-chart.ts` | Mock `WesternChartData` + mock cosmic weather entries |

### No New API Routes

All data is read from Supabase directly in server components or from mock constants. No new `/api/` routes needed.

---

## Styling

All components follow the existing design system:
- Backgrounds: `void` (#09010f), `cosmos` (#140025), `nebula` (#1e0035)
- Borders: `violet/30`, `white/10`, `white/5`
- Text: `star` for headings, `violet-light` for labels, `muted` for secondary
- Cards: rounded-2xl, gradient backgrounds for Big 3, flat nebula for others
- Tabs: pill-style tab bar with violet active state

---

## Testing

Vitest + React Testing Library:

- **ChartTabs:** Tab switching renders correct content for each tab
- **PlanetCard:** Displays correct planet data, shows retrograde badge when applicable
- **AspectRow:** Correct color coding for harmonious vs challenging aspects
- **VedicGate:** Shows premium upsell for free users, different content for premium
- **Dashboard CosmicProfile:** Renders Big 3 only when chart exists, not shown without chart
- **Dashboard CosmicWeather:** Always renders with mock data
- **Chart page redirect:** Redirects to onboarding when no birth chart exists

---

## What This Does NOT Include

- FastAPI astrology engine (deferred — separate sub-project)
- pyswisseph chart calculation (deferred)
- Claude-generated summaries (Sub-project 3)
- Vedic chart data (requires FastAPI)
- Chart SVG wheel visualization (decided against — using card grid instead)
