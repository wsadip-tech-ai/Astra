# Sub-project 4A: Partner Compatibility — Design Spec

## Overview

Build the `/compatibility` page where users enter a partner's birth details, get a synastry compatibility score (0-100), view cross-aspects between their charts, and (premium only) read a Claude-generated narrative report. Partner charts are saved to `birth_charts` for reuse. Western synastry only — Vedic Kundali Milan deferred to a future enhancement.

---

## User Flow

1. Navigate to `/compatibility` (auth required, must have own birth chart)
2. Enter partner's name, date of birth, time of birth (optional), city of birth
3. Submit → geocode city → calculate partner's Western chart via FastAPI → save to `birth_charts` with label `"Partner - {name}"`
4. Calculate cross-aspects between user's chart and partner's chart
5. Display results: score (0-100) + key cross-aspects + Claude report (premium)

---

## FastAPI Endpoint: `POST /compatibility`

New endpoint in `engine/`. Takes two sets of planet positions, calculates cross-aspects and a compatibility score.

**Request:**
```json
{
  "chart1_planets": [
    { "name": "Sun", "sign": "Taurus", "degree": 24 }
  ],
  "chart2_planets": [
    { "name": "Sun", "sign": "Scorpio", "degree": 8 }
  ]
}
```

**Response 200:**
```json
{
  "score": 72,
  "aspects": [
    { "planet1": "Sun", "planet2": "Moon", "type": "trine", "orb": 1.3 }
  ],
  "summary": "Strong Sun-Moon trine suggests emotional harmony..."
}
```

**Calculation details:**

**Longitude conversion:** Convert sign + degree to ecliptic longitude. `sign_index * 30 + degree` where sign_index follows standard zodiac order (Aries=0, Taurus=1, ..., Pisces=11).

**Cross-aspects:** Check all 100 planet pairs (10 from chart1 × 10 from chart2). Same 5 aspect types and orb table as natal charts:
- Conjunction: 0°, orb 8°
- Opposition: 180°, orb 8°
- Trine: 120°, orb 7°
- Square: 90°, orb 7°
- Sextile: 60°, orb 5°

**Scoring:** Start at 50 (neutral). For each cross-aspect:
- Conjunction: +5 (Sun/Moon/Venus) or +3 (others)
- Trine: +4
- Sextile: +3
- Square: -3
- Opposition: -2 (tension but also attraction)

Clamp final score to 0-100.

**Summary:** Auto-generated text listing the 3 strongest cross-aspects (tightest orbs).

---

## Next.js BFF Route: `POST /api/compatibility`

Authenticated endpoint that orchestrates the full flow.

**Request:**
```json
{
  "partner_name": "Sarah",
  "date_of_birth": "1992-08-20",
  "time_of_birth": "10:15",
  "place_of_birth": "Pokhara"
}
```

**Response 200:**
```json
{
  "score": 72,
  "aspects": [...],
  "summary": "Strong Sun-Moon trine...",
  "report": "Your connection with Sarah is written in the stars... (premium only, null for free)",
  "partner_chart_id": "uuid"
}
```

**Flow:**
1. Auth check
2. Fetch user's birth chart (must have `western_chart_json`)
3. Geocode partner's city
4. Call FastAPI `POST /chart/western` for partner
5. Save partner chart to `birth_charts` with label `"Partner - {partner_name}"`
6. Call FastAPI `POST /compatibility` with both charts' planets
7. If `subscription_tier === 'premium'`: call Claude to generate a ~300 word narrative report using the synastry data
8. Return results

**Claude report prompt:**
```
You are Astra, a warm and wise astrologer. Generate a ~300 word compatibility reading for {user_name} and {partner_name}.

Their synastry shows:
Score: {score}/100
Key aspects: {top aspects}

{user_name}'s chart: {western_summary}
{partner_name}'s chart: {partner_western_summary}

Write a warm, insightful reading about their connection. Reference specific aspects. Be encouraging but honest about challenges.
```

**Graceful degradation:** If FastAPI compatibility endpoint fails, return the partner chart ID but no score/aspects. If Claude fails for premium users, return score/aspects without the narrative report.

---

## Compatibility UI

### Page: `app/compatibility/page.tsx` (server component)

Auth check → fetch profile + birth chart → if no chart redirect to onboarding → render CompatibilityView.

### Components

| Component | Type | Responsibility |
|-----------|------|---------------|
| `components/compatibility/CompatibilityView.tsx` | Client | Main container — manages form/results state |
| `components/compatibility/PartnerForm.tsx` | Client | Partner birth details form with city geocoding |
| `components/compatibility/CompatibilityResult.tsx` | Client | Score circle, aspects list, Claude report, premium gate |

### Form State

`PartnerForm` — fields: partner name, date of birth (date picker), time of birth (time picker, optional), city of birth (text input). Submit calls `POST /api/compatibility`. Same geocoding pattern as signup onboarding.

### Results State

`CompatibilityResult` — displays:
- **Score circle:** Large circular display (0-100), color-coded: 0-40 rose/red, 41-70 amber/yellow, 71-100 green/violet
- **Key aspects list:** Top cross-aspects with planet glyphs, aspect type, orb. Reuses `AspectRow` component styling. Free: top 5 aspects. Premium: all aspects.
- **Claude report:** (premium only) Narrative card with Astra's reading. Free users see "Unlock Full Report" banner with upgrade CTA to `/pricing`.
- **"Try another partner" button** — resets to form state

---

## Free vs Premium

| Feature | Free | Premium |
|---------|------|---------|
| Compatibility score | Yes | Yes |
| Top 5 cross-aspects | Yes | Yes |
| All cross-aspects | No | Yes |
| Claude narrative report | No | Yes |

Free users see a `PremiumGate` banner between the top 5 aspects and the rest, with "Unlock Full Report → Upgrade to Premium" CTA.

---

## File Structure

| File | Change |
|------|--------|
| `engine/app/services/compatibility.py` | New — synastry calculation |
| `engine/app/routes/compatibility.py` | New — POST /compatibility |
| `engine/app/main.py` | Modify — register compatibility router |
| `engine/app/models/schemas.py` | Modify — add compatibility request/response schemas |
| `engine/tests/test_compatibility.py` | New — synastry tests |
| `lib/compatibility.ts` | New — Claude compatibility report generation |
| `app/api/compatibility/route.ts` | New — BFF orchestration route |
| `app/compatibility/page.tsx` | New — server component page |
| `components/compatibility/CompatibilityView.tsx` | New — main container |
| `components/compatibility/PartnerForm.tsx` | New — partner birth details form |
| `components/compatibility/CompatibilityResult.tsx` | New — results display |
| `__tests__/lib/compatibility.test.ts` | New — report generation tests |
| `__tests__/components/compatibility/CompatibilityResult.test.tsx` | New — result display tests |

---

## Testing

### FastAPI (pytest)
- `test_compatibility.py` — cross-aspect detection for known chart pair, score within 0-100 range, correct aspect types

### Next.js (Vitest)
- `lib/compatibility.ts` — Claude prompt includes both chart summaries and score
- `CompatibilityResult` — renders score, shows top 5 aspects for free, shows premium gate for free users, shows report for premium

---

## What This Does NOT Include

- Vedic Kundali Milan (Guna matching) — deferred to future premium enhancement
- Transit forecasts (`/transit` page) — separate feature
- Yearly predictions (`/yearly` page) — separate feature
- Storing compatibility results (computed on demand each time)
- Partner account linking (partner is just a saved chart, not a user)
