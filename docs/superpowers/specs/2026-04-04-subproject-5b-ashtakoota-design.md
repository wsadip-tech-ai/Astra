# Sub-project 5B: Vedic Ashtakoota Compatibility — Design Spec

## Goal

Add traditional Vedic Ashtakoota (Kundali Milan) compatibility scoring to Astra. Users get an 8-koota breakdown (max 36 points), Mangal Dosha assessment with remedies, and an AI-generated narrative — all shown alongside the existing Western synastry results on the `/compatibility` page.

## User Flow

### Input Modes

The compatibility page offers two input paths:

1. **Full Birth Details** (existing flow, enhanced) — Partner's name, date of birth, time (optional), city. We generate their Vedic chart, extract Moon sign/nakshatra/pada and Mars house, then run both Ashtakoota and Western synastry.

2. **Quick Mode** (new) — Partner's name, Moon sign (dropdown of 12 Sanskrit signs), nakshatra (dropdown of 27, filtered by selected sign), and pada (1-4). No chart generation needed. Only Ashtakoota runs (no Western synastry since we don't have full chart data).

A toggle above the form lets users switch between modes. Default is Full Birth Details.

### Result Display

After submission, the page shows (top to bottom):

1. **Vedic Score Hero** — Large circular gauge showing X/36 with rating tier (Excellent/Good/Average/Not Recommended) and a one-line verdict.

2. **8 Koota Breakdown** — Grid of 8 cards, each showing: koota name, score/max (e.g., "3/3"), a brief description of what it measures, and a pass/fail visual indicator (filled dots or bar).

3. **Mangal Dosha Section** — If either person has Mangal Dosha: status for each person, severity, whether it's cancelled (mutual dosha), and traditional remedies. If neither has it: a simple "No Mangal Dosha detected" note.

4. **AI Narrative** (premium only) — A 3-4 paragraph reading that weaves the 8 koota results, any doshas, and overall compatibility into a personalized story. Generated via the existing chat API with a compatibility-focused system prompt.

5. **Western Synastry** (full birth mode only) — The existing `CompatibilityResult` component, repositioned as a secondary "Planetary Aspects" section below the Vedic results. Shows cross-aspects and the existing Western score (/100).

## Architecture

### Engine: Ashtakoota Service

**New file:** `engine/app/services/ashtakoota.py`

A pure-function module with no AI dependency. Core function:

```
calculate_ashtakoota(
    user_moon_sign: str,        # Sanskrit sign name
    user_nakshatra: str,        # Nakshatra name
    user_pada: int,             # 1-4
    partner_moon_sign: str,
    partner_nakshatra: str,
    partner_pada: int,
    user_mars_house: int | None,    # For Mangal Dosha (None if unknown)
    partner_mars_house: int | None,
) -> dict
```

Returns:
```json
{
  "score": 28,
  "max_score": 36,
  "rating": "Good",
  "kootas": [
    {"name": "Varna", "score": 1, "max_score": 1, "description": "..."},
    {"name": "Vashya", "score": 2, "max_score": 2, "description": "..."},
    ...
  ],
  "doshas": [
    {"type": "Mangal Dosha", "person": "partner", "severity": "moderate", "canceled": false, "remedy": "..."}
  ],
  "mangal_dosha_user": false,
  "mangal_dosha_partner": true
}
```

**Scoring logic per koota:**

| Koota | Max | Logic |
|-------|-----|-------|
| Varna | 1 | Compare nakshatra varna (Brahmin > Kshatriya > Vaishya > Shudra). Score 1 if user's varna >= partner's. |
| Vashya | 2 | Compare sign-based vashya categories (Chatushpada, Manava, Jalachara, Vanachara, Keeta). Full/half/zero based on compatibility table. |
| Tara | 3 | Count nakshatras from user to partner, mod 9. Favorable positions (1,2,4,6,8,9) = 3, semi (3,5) = 1.5, unfavorable (7) = 0. Half-point scores allowed; total is displayed as-is (e.g., 24.5/36). |
| Yoni | 4 | Each nakshatra has an animal symbol. Same animal = 4, friendly = 3, neutral = 2, unfriendly = 1, enemy = 0. |
| Graha Maitri | 5 | Compare nakshatra lords' friendship. Both friends = 5, one friend one neutral = 4, both neutral = 3, one enemy = 1, both enemies = 0. |
| Gana | 6 | Compare gana (Deva/Manushya/Rakshasa). Same = 6, Deva-Manushya = 5, Manushya-Rakshasa = 1, Deva-Rakshasa = 0. |
| Bhakoot | 7 | Check Moon sign distance. Certain pairs (2/12, 5/9, 6/8) score 0 unless exceptions apply. Others score 7. |
| Nadi | 8 | Compare Ayurvedic nadi (Aadi/Madhya/Antya). Different = 8, same = 0 (exception: same nakshatra different pada). |

**Rating tiers:**
- 0-17: "Not Recommended"
- 18-24: "Average"  
- 25-30: "Good"
- 31-36: "Excellent"

**Mangal Dosha:** Mars in houses 1, 4, 7, 8, or 12 from lagna. If one person has it and the other doesn't → dosha present with remedies. If both have it → mutual cancellation.

**Lookup tables needed** (internal to the module):
- `NAKSHATRA_VARNA`: 27 nakshatras → Brahmin/Kshatriya/Vaishya/Shudra
- `SIGN_VASHYA`: 12 signs → Chatushpada/Manava/etc.
- `VASHYA_COMPATIBILITY`: category pairs → 0/1/2
- `NAKSHATRA_YONI`: 27 nakshatras → animal symbol
- `YONI_COMPATIBILITY`: animal pairs → 0-4
- `NAKSHATRA_LORD`: 27 nakshatras → ruling planet (already exists in dasha.py as NAKSHATRA_LORDS)
- `GRAHA_MAITRI`: planet pairs → Friend/Neutral/Enemy
- `NAKSHATRA_GANA`: 27 nakshatras → Deva/Manushya/Rakshasa
- `GANA_COMPATIBILITY`: gana pairs → score
- `NAKSHATRA_NADI`: 27 nakshatras → Aadi/Madhya/Antya

### Engine: Route

**New file:** `engine/app/routes/compatibility_vedic.py`

`POST /compatibility/vedic` — accepts `VedicCompatibilityRequest`, returns `VedicCompatibilityResponse`. Pydantic models already stubbed in schemas.py from Sub-project 5A (add the missing ones: `KootaScore`, `DoshaInfo`, `VedicCompatibilityResponse`).

Register in `main.py`.

### Engine: Tests

**New file:** `engine/tests/test_ashtakoota.py`

Unit tests for the pure scoring functions:
- Each koota scores correctly for known nakshatra pairs
- Total score sums correctly
- Rating tiers map correctly
- Mangal Dosha detection works (present/absent/mutual cancellation)
- Edge cases: same nakshatra, adjacent nakshatras, Nadi exception

**New file:** `engine/tests/test_vedic_enhanced.py` (append route tests)

Integration tests for `POST /compatibility/vedic` endpoint.

### Frontend: API Route

**Modify:** `app/api/compatibility/route.ts`

After computing Western synastry, also call `POST /compatibility/vedic` on the FastAPI engine with the user's and partner's Moon data (extracted from their Vedic charts). Return both results to the client.

For quick mode: skip chart generation and Western synastry. Just call the Vedic endpoint directly with the user-provided Moon data.

**New:** `app/api/compatibility/vedic/route.ts`

Dedicated route for quick-mode requests that only need Ashtakoota (no chart generation).

### Frontend: Components

**Modify:** `components/compatibility/CompatibilityView.tsx`
- Add input mode toggle (Full Birth Details / Quick Mode)
- Handle both result shapes (full = Western + Vedic, quick = Vedic only)
- Orchestrate the result sections

**New:** `components/compatibility/QuickModeForm.tsx`
- Moon sign dropdown (12 Sanskrit signs with English labels)
- Nakshatra dropdown (filtered to show only nakshatras in selected sign)
- Pada radio buttons (1-4)
- Partner name input

**New:** `components/compatibility/AshtakootaResult.tsx`
- Circular score gauge (X/36) with color-coded rating
- 8 koota breakdown cards in a 2x4 or 4x2 grid
- Each card: name, score bar/dots, one-line description

**New:** `components/compatibility/MangalDoshaSection.tsx`
- Status cards for user and partner
- Severity indicator
- Cancellation notice if mutual
- Traditional remedies list

**New:** `components/compatibility/CompatibilityNarrative.tsx`
- AI-generated reading (premium only)
- Loading skeleton while generating
- Upgrade prompt for free users

**Modify:** `components/compatibility/CompatibilityResult.tsx`
- Rename section header to "Western Planetary Aspects"
- Only shown when Western data is available (full birth mode)

### Frontend: Nakshatra-Sign Mapping

**New:** `constants/nakshatras.ts`

Export a mapping of Moon signs to their contained nakshatras (for the quick mode dropdown filtering). Each sign spans 2.25 nakshatras, so some nakshatras span two signs.

```typescript
export const SIGN_NAKSHATRAS: Record<string, string[]> = {
  "Mesha": ["Ashwini", "Bharani", "Krittika"],
  "Vrishabha": ["Krittika", "Rohini", "Mrigashira"],
  ...
}
```

## Design System

All new components follow the existing Astra design language:
- Background: `bg-nebula` cards with `border-white/5` or `border-white/10`
- Text: `text-star` for primary, `text-muted` for secondary, `text-violet-light` for labels
- Accents: Violet-to-rose gradients for primary actions
- Typography: `font-display` (Playfair Display) for headings, Inter for body
- Borders: `rounded-xl` or `rounded-2xl`
- Animations: Framer Motion fade/slide on mount

The score gauge uses a radial gradient (violet for high scores, yellow for average, rose for low) matching the existing `scoreColor` pattern in `CompatibilityResult.tsx`.

## Data Dependencies

- User's Vedic chart must exist in `astra_birth_charts.vedic_chart_json` (generated during onboarding or chart page visit)
- If user hasn't generated a Vedic chart yet, show a prompt to generate one first
- Quick mode bypasses this requirement entirely

## Error Handling

- Engine service errors → "Compatibility calculation unavailable" with retry button
- Missing user chart → "Generate your birth chart first" with link to `/chart`
- Geocoding failure (full mode) → existing error handling applies
- AI narrative failure → hide narrative section gracefully, show koota results anyway

## Scope Boundaries

**In scope:**
- Engine: Ashtakoota service + route + tests
- Frontend: Modified compatibility page with both input modes and result sections
- AI narrative generation for premium users

**Out of scope:**
- Saving Vedic compatibility results to database (future enhancement)
- Ashtakoota in the AI chat system prompt (that's 5C)
- Partner chart Vedic generation in quick mode
- Detailed per-koota remedies (only Mangal Dosha gets remedies)
